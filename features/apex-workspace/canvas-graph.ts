/** Typed canvas graph projection. The Workspace document remains the only authoritative state. */
import {validateCanvasExtras,validateCanvasGradient,validateCanvasPattern,validateCanvasStroke,validateCanvasShadow,type CanvasExtras,type CanvasGradient,type CanvasPattern,type CanvasStroke,type CanvasShadow,type CanvasBlendMode,type CanvasImageFit,type CanvasImageAlign} from './canvas-options';
import {validateDocument,type WorkspaceDocument} from './model';
import {ASSET_REFERENCE} from './asset-store';
export type CanvasGraphPortType='canvas'|'background'|'image-asset'|'image-mask'|'group-transform'|'color'|'gradient'|'pattern'|'ordered-layer'|'stroke'|'shadow';
export type CanvasGraphNode={
  id:string;kind:'canvas'|'background'|'image'|'image-layer'|'group'|'gradient'|'pattern'|'layer'|'output'|'effect';
  name:string;outputs:CanvasGraphPortType[];inputs:CanvasGraphPortType[];
};
export type CanvasGraphEdge={id:string;from:string;to:string;type:CanvasGraphPortType;order?:number};
export type CanvasGraphPort={id:string;nodeId:string;direction:'input'|'output';type:CanvasGraphPortType};
export interface CanvasGraph {nodes:CanvasGraphNode[];ports:CanvasGraphPort[];edges:CanvasGraphEdge[]}
export function canvasGraphPortId(nodeId:string,direction:CanvasGraphPort['direction'],type:CanvasGraphPortType):string {
  return nodeId+'|'+direction+'|'+type;
}

/** Fail-closed graph DAG validation for derived and proposed typed connections. */
export function validateGraphTopology(graph:CanvasGraph,proposal?:CanvasGraphEdge):void{
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  if(nodes.size!==graph.nodes.length)throw new Error('Graph duplicate node');
  const ports=new Map(graph.ports.map(p=>[p.id,p]));
  if(ports.size!==graph.ports.length)throw new Error('Graph duplicate port');
  const edges=proposal?[...graph.edges,proposal]:graph.edges;
  const adjacency=new Map<string,string[]>(graph.nodes.map(n=>[n.id,[]]));
  for(const edge of edges){
    const from=nodes.get(edge.from),to=nodes.get(edge.to);
    if(!from||!to)throw new Error('Graph edge references missing node');
    if(!from.outputs.includes(edge.type)||!to.inputs.includes(edge.type))
      throw new Error('Graph edge port type mismatch');
    adjacency.get(edge.from)!.push(edge.to);
  }
  const active=new Set<string>(),done=new Set<string>();
  function visit(id:string):void{
    if(active.has(id))throw new Error('Graph connection creates a cycle');
    if(done.has(id))return;
    active.add(id);
    for(const next of adjacency.get(id)??[])visit(next);
    active.delete(id);done.add(id);
  }
  for(const id of nodes.keys())visit(id);
}
export function projectCanvasGraph(document:WorkspaceDocument):CanvasGraph {
  const x=validateCanvasExtras(document.canvasExtras);
  const nodes:CanvasGraphNode[]=[
    {id:'canvas:root',kind:'canvas',name:'Canvas',inputs:['background','ordered-layer','stroke','shadow'],outputs:['canvas']},
    {id:'canvas:background',kind:'background',name:'Background input',inputs:['image-asset','gradient','pattern','color'],outputs:['background']},
    {id:'canvas:output',kind:'output',name:'PNG output',inputs:['canvas'],outputs:[]}
  ];
  nodes.push({id:'canvas:color:root',kind:'background',name:'Solid color source',inputs:[],outputs:['color']});
  const edges:CanvasGraphEdge[]=[
    {id:'edge:bg-root',from:'canvas:background',to:'canvas:root',type:'background'},
    {id:'edge:root-output',from:'canvas:root',to:'canvas:output',type:'canvas'}
  ];
  if(document.background.mode==='color'&&!document.background.transparent&&!x.customBg&&!x.gradientBg)
    edges.push({id:'edge:color-bg',from:'canvas:color:root',to:'canvas:background',type:'color'});
  if(x.stroke){
    nodes.push({id:'canvas:stroke',kind:'effect',name:'Stroke',inputs:['gradient'],outputs:['stroke']});
    edges.push({id:'edge:stroke-root',from:'canvas:stroke',to:'canvas:root',type:'stroke'});
    if(x.stroke.gradient){
      nodes.push({id:'canvas:gradient:stroke',kind:'gradient',name:'Stroke gradient paint',inputs:[],outputs:['gradient']});
      edges.push({id:'edge:gradient-stroke',from:'canvas:gradient:stroke',to:'canvas:stroke',type:'gradient'});
    }
  }
  if(x.shadow){
    nodes.push({id:'canvas:shadow',kind:'effect',name:'Shadow',inputs:['gradient'],outputs:['shadow']});
    edges.push({id:'edge:shadow-root',from:'canvas:shadow',to:'canvas:root',type:'shadow'});
    if(x.shadow.gradient){
      nodes.push({id:'canvas:gradient:shadow',kind:'gradient',name:'Shadow gradient paint',inputs:[],outputs:['gradient']});
      edges.push({id:'edge:gradient-shadow',from:'canvas:gradient:shadow',to:'canvas:shadow',type:'gradient'});
    }
  }
  // Stable image nodes use content hashes; edges can be reconnected without creating any persisted Graph JSON.
  for(const asset of document.assets??[]){
    nodes.push({id:'canvas:image:'+asset.id,kind:'image',name:'Verified image '+asset.sha256.slice(0,10),
      inputs:[],outputs:['image-asset','image-mask']});
  }
  // createImage nodes reflect real ordered image/shape layers, content-addressed assets,
  // masks and optional groupTransform references. No synthetic graph data is persisted.
  for(const group of document.imageGroups??[]){
    nodes.push({id:'canvas:image-group:'+group.id,kind:'group',name:group.name,
      inputs:['image-mask'],outputs:['group-transform']});
    if(group.transform.mask&&typeof group.transform.mask.source==='string'&&ASSET_REFERENCE.test(group.transform.mask.source))
      edges.push({id:'edge:image-group-mask:'+group.id,from:'canvas:image:'+group.transform.mask.source,
        to:'canvas:image-group:'+group.id,type:'image-mask'});
  }
  for(const [order,layer] of document.layers.entries()){
    if(layer.kind!=='image'&&layer.kind!=='shape')continue;
    const nodeId='canvas:image-layer:'+layer.id;
    nodes.push({id:nodeId,kind:'image-layer',name:layer.name,
      inputs:['image-asset','image-mask','group-transform'],outputs:['ordered-layer']});
    edges.push({id:'edge:image-layer-order:'+layer.id,from:nodeId,to:'canvas:root',type:'ordered-layer',order});
    if(layer.kind==='image'&&ASSET_REFERENCE.test(layer.source))
      edges.push({id:'edge:image-layer-source:'+layer.id,from:'canvas:image:'+layer.source,to:nodeId,type:'image-asset'});
    if(layer.imageOptions?.mask&&ASSET_REFERENCE.test(layer.imageOptions.mask.source))
      edges.push({id:'edge:image-layer-mask:'+layer.id,from:'canvas:image:'+layer.imageOptions.mask.source,to:nodeId,type:'image-mask'});
    if(layer.imageGroupId)
      edges.push({id:'edge:image-group-member:'+layer.id,from:'canvas:image-group:'+layer.imageGroupId,to:nodeId,type:'group-transform'});
  }
  if(x.gradientBg){
    nodes.push({id:'canvas:gradient:root',kind:'gradient',name:'Canvas gradient',inputs:[],outputs:['gradient']});
    edges.push({id:'edge:gradient-root',from:'canvas:gradient:root',to:'canvas:background',type:'gradient'});
  }
  if(x.customBg){

    edges.push({id:'edge:image-bg',from:'canvas:image:'+x.customBg.source,to:'canvas:background',type:'image-asset'});
  }
  if(x.patternBg){
    const patternId='canvas:pattern:root';
    nodes.push({id:patternId,kind:'pattern',name:'Pattern '+x.patternBg.type,
      inputs:x.patternBg.type==='custom'?['image-asset']:[],outputs:['pattern']});
    edges.push({id:'edge:pattern-root',from:patternId,to:'canvas:background',type:'pattern'});
    if(x.patternBg.type==='custom'){
      const ref=x.patternBg.customPatternImage!;

      edges.push({id:'edge:pattern-source',from:'canvas:image:'+ref,to:patternId,type:'image-asset'});
    }
  }
  (x.bgLayers??[]).forEach((layer,order)=>{
    const stable=layer.nodeId??('legacy-index:'+order);
    const nodeId='canvas:ordered-layer:'+stable;
    nodes.push({id:nodeId,kind:'layer',name:layer.type,
      inputs:layer.type==='image'||layer.type==='pattern'?['image-asset']:
        layer.type==='gradient'?['gradient']:layer.type==='presetPattern'?['pattern']:[],
      outputs:['ordered-layer']});
    edges.push({id:'edge:layer:'+stable,from:nodeId,to:'canvas:root',type:'ordered-layer',order});
    if(layer.type==='image'||layer.type==='pattern')
      edges.push({id:'edge:layer-source:'+stable,from:'canvas:image:'+layer.source,to:nodeId,type:'image-asset'});
    if(layer.type==='gradient'){
      const sourceId='canvas:gradient:layer:'+stable;
      nodes.push({id:sourceId,kind:'gradient',name:'Layer '+(order+1)+' gradient',inputs:[],outputs:['gradient']});
      edges.push({id:'edge:gradient-layer:'+stable,from:sourceId,to:nodeId,type:'gradient'});
    }
    if(layer.type==='presetPattern'){
      const sourceId='canvas:pattern:layer:'+stable;
      const custom=layer.pattern.type==='custom';
      nodes.push({id:sourceId,kind:'pattern',name:'Layer '+(order+1)+' pattern',inputs:custom?['image-asset']:[],outputs:['pattern']});
      edges.push({id:'edge:pattern-layer:'+stable,from:sourceId,to:nodeId,type:'pattern'});
      if(custom)edges.push({id:'edge:pattern-asset:'+stable,from:'canvas:image:'+layer.pattern.customPatternImage,to:sourceId,type:'image-asset'});
    }
  });
  const uniqueNodes=new Set(nodes.map(n=>n.id));
  if(uniqueNodes.size!==nodes.length)throw new Error('Graph duplicate semantic node identity');
  const ports=nodes.flatMap(node=>([
    ...node.inputs.map(type=>({id:canvasGraphPortId(node.id,'input',type),nodeId:node.id,direction:'input' as const,type})),
    ...node.outputs.map(type=>({id:canvasGraphPortId(node.id,'output',type),nodeId:node.id,direction:'output' as const,type}))
  ]));
  const portKeys=new Set(ports.map(p=>p.id));
  if(portKeys.size!==ports.length)throw new Error('Graph duplicate port identity');
  if(edges.some(e=>!uniqueNodes.has(e.from)||!uniqueNodes.has(e.to)))
    throw new Error('Graph contains unresolvable image or layer dependency');
  const graph={nodes,ports,edges};validateGraphTopology(graph);return graph;
}
export type CanvasGraphEdit =
  | {op:'source';assetId:string|null}
  | {op:'pattern-source';assetId:string|null}
  | {op:'layer-order';from:number;to:number}
  | {op:'gradient';value:CanvasGradient|null}
  | {op:'zoom';value:{scale?:number;centerX?:number;centerY?:number}|null}
  | {op:'noise';value:{intensity?:number}|null}
  | {op:'root-pattern';value:CanvasPattern|null}
  | {op:'layer-pattern';index:number;value:CanvasPattern}
  | {op:'layer-gradient';index:number;value:CanvasGradient}
  | {op:'layer-blend';index:number;value:CanvasBlendMode}
  | {op:'image-layout';target:'root'|'layer';index?:number;fit?:CanvasImageFit;align?:CanvasImageAlign;inherit?:boolean}
  | {op:'canvas-blend';value:CanvasBlendMode}
  | {op:'canvas-opacity';value:number|null}
  | {op:'root-image-opacity';value:number|null}
  | {op:'layer-opacity';index:number;value:number|null}
  | {op:'layer-noise-intensity';index:number;value:number|null}
  | {op:'stroke';value:CanvasStroke|null}
  | {op:'shadow';value:CanvasShadow|null}
  | {op:'layer-source';index:number;assetId:string}
  | {op:'connect';fromPort:string;toPort:string}
  | {op:'disconnect';toPort:string};
const colorOrDefault=(value:string|undefined)=>value??'#000000';
export function editCanvasGraph(document:WorkspaceDocument,edit:CanvasGraphEdit):CanvasExtras {
  const options=validateCanvasExtras(document.canvasExtras);
  if(edit.op==='connect'||edit.op==='disconnect'){
    const graph=projectCanvasGraph(document);
    const target=graph.ports.find(p=>p.id===edit.toPort&&p.direction==='input');
    if(!target)throw new Error('Graph target port does not exist or is not an input');
    const from=edit.op==='connect'?graph.ports.find(p=>p.id===edit.fromPort&&p.direction==='output'):undefined;
    if(edit.op==='connect'){
      if(!from)throw new Error('Graph source port does not exist or is not an output');
      if(from.type!==target.type)throw new Error('Graph port type mismatch');
      if(from.nodeId===target.nodeId)throw new Error('Graph cycle: self edge');
      validateGraphTopology(graph,{id:'edge:proposed-connection',from:from.nodeId,to:target.nodeId,type:from.type});
    }
    const node=target.nodeId;
    if(target.type==='gradient'){
      // Every gradient output corresponds to actual editable canvas paint, never a decorative port.
      const takeGradient=():CanvasGradient|undefined=>{
        if(from?.nodeId==='canvas:gradient:root')return options.gradientBg;
        if(from?.nodeId==='canvas:gradient:stroke')return options.stroke?.gradient;
        if(from?.nodeId==='canvas:gradient:shadow')return options.shadow?.gradient;
        if(from?.nodeId.startsWith('canvas:gradient:layer:')){
          const id=from.nodeId.slice('canvas:gradient:layer:'.length);
          const layer=(options.bgLayers??[]).find((x,i)=>(x.nodeId??'legacy-index:'+i)===id);
          return layer?.type==='gradient'?layer.value:undefined;
        }
        return undefined;
      };
      const value=edit.op==='connect'?takeGradient():undefined;
      if(edit.op==='connect'&&!value)throw new Error('Graph gradient source has no valid painted value');
      if(node==='canvas:background')return editCanvasGraph(document,{op:'gradient',value:value??null});
      if(node==='canvas:stroke'&&options.stroke){
        const {color:_color,gradient:_gradient,...remaining}=options.stroke;
        return validateCanvasExtras({...options,stroke:{...remaining,...(value?{gradient:value}:{color:colorOrDefault(_color)})}});
      }
      if(node==='canvas:shadow'&&options.shadow){
        const {color:_color,gradient:_gradient,...remaining}=options.shadow;
        return validateCanvasExtras({...options,shadow:{...remaining,...(value?{gradient:value}:{color:colorOrDefault(_color)})}});
      }
      if(node.startsWith('canvas:ordered-layer:')){
        if(!value)throw new Error('Graph cannot disconnect required layer gradient; remove or replace layer');
        const stable=node.slice('canvas:ordered-layer:'.length);
        const index=(options.bgLayers??[]).findIndex((x,i)=>(x.nodeId??'legacy-index:'+i)===stable);
        if(index<0)throw new Error('Graph gradient destination is stale');
        return editCanvasGraph(document,{op:'layer-gradient',index,value});
      }
      throw new Error('Graph has no executable gradient destination');
    }
    if(target.type==='pattern'){
      const takePattern=():CanvasPattern|undefined=>{
        if(from?.nodeId==='canvas:pattern:root')return options.patternBg;
        if(from?.nodeId.startsWith('canvas:pattern:layer:')){
          const id=from.nodeId.slice('canvas:pattern:layer:'.length);
          const layer=(options.bgLayers??[]).find((x,i)=>(x.nodeId??'legacy-index:'+i)===id);
          return layer?.type==='presetPattern'?layer.pattern:undefined;
        }
        return undefined;
      };
      const value=edit.op==='connect'?takePattern():undefined;
      if(edit.op==='connect'&&!value)throw new Error('Graph pattern source has no valid painted value');
      if(node==='canvas:background')return editCanvasGraph(document,{op:'root-pattern',value:value??null});
      if(node.startsWith('canvas:ordered-layer:')){
        if(!value)throw new Error('Graph cannot disconnect required layer pattern; remove or replace layer');
        const stable=node.slice('canvas:ordered-layer:'.length);
        const index=(options.bgLayers??[]).findIndex((x,i)=>(x.nodeId??'legacy-index:'+i)===stable);
        if(index<0)throw new Error('Graph pattern destination is stale');
        return editCanvasGraph(document,{op:'layer-pattern',index,value});
      }
      throw new Error('Graph has no executable pattern destination');
    }
    if(target.type==='image-asset'){
      const assetId=from?.nodeId.startsWith('canvas:image:')?from.nodeId.slice('canvas:image:'.length):undefined;
      if(edit.op==='connect'&&(!assetId||!document.assets?.some(a=>a.id===assetId)))
        throw new Error('Graph source must be a verified image asset node');
      if(node==='canvas:background')
        return editCanvasGraph(document,{op:'source',assetId:assetId??null});
      if(node==='canvas:pattern:root')
        return editCanvasGraph(document,{op:'pattern-source',assetId:assetId??null});
      if(node.startsWith('canvas:ordered-layer:')){
        const stable=node.slice('canvas:ordered-layer:'.length);
        const index=(options.bgLayers??[]).findIndex((x,i)=>(x.nodeId??'legacy-index:'+i)===stable);
        if(index<0)throw new Error('Graph layer ID is stale');
        if(edit.op==='disconnect')throw new Error('Disconnecting a required layer source would leave an invalid project; remove the layer explicitly');
        return editCanvasGraph(document,{op:'layer-source',index,assetId:assetId!});
      }
    }
    if(target.type==='ordered-layer'&&node==='canvas:root'){
      const layerNode=from?.nodeId;
      if(edit.op==='disconnect')throw new Error('Layer disconnect requires a specific source edge');
      if(!layerNode?.startsWith('canvas:ordered-layer:'))throw new Error('Graph source must be an ordered layer');
      const stable=layerNode.slice('canvas:ordered-layer:'.length);
      const fromIndex=(options.bgLayers??[]).findIndex((x,i)=>(x.nodeId??'legacy-index:'+i)===stable);
      if(fromIndex<0)throw new Error('Graph layer source identity is stale');
      return editCanvasGraph(document,{op:'layer-order',from:fromIndex,to:(options.bgLayers?.length??1)-1});
    }
    throw new Error('Graph port connection unsupported for this node type; no project mutation');
  }
  if(edit.op==='source'){
    if(edit.assetId===null)return validateCanvasExtras({...options,customBg:undefined});
    if(!ASSET_REFERENCE.test(edit.assetId)||!document.assets?.some(a=>a.id===edit.assetId))
      throw new Error('Graph cannot connect an unverified image asset');
    return validateCanvasExtras({...options,customBg:{source:edit.assetId,fit:'cover'},
      gradientBg:undefined});
  }
  if(edit.op==='pattern-source'){
    if(edit.assetId===null)return validateCanvasExtras({...options,patternBg:undefined});
    if(!ASSET_REFERENCE.test(edit.assetId)||!document.assets?.some(a=>a.id===edit.assetId))
      throw new Error('Graph pattern source must reference a verified imported asset');
    return validateCanvasExtras({...options,
      patternBg:{type:'custom',customPatternImage:edit.assetId,repeat:'repeat',opacity:1}});
  }
  if(edit.op==='zoom'){
    return validateCanvasExtras({...options,zoom:edit.value??undefined});
  }
  if(edit.op==='noise'){
    return validateCanvasExtras({...options,noiseBg:edit.value??undefined});
  }
  if(edit.op==='stroke')return validateCanvasExtras({...options,
    stroke:edit.value?validateCanvasStroke(edit.value):undefined});
  if(edit.op==='shadow')return validateCanvasExtras({...options,
    shadow:edit.value?validateCanvasShadow(edit.value):undefined});
  if(edit.op==='gradient'){
    return validateCanvasExtras({...options,gradientBg:edit.value?validateCanvasGradient(edit.value):undefined,
      ...(edit.value?{customBg:undefined}:{})});
  }
  if(edit.op==='root-pattern'){
    return validateCanvasExtras({...options,patternBg:edit.value?validateCanvasPattern(edit.value):undefined});
  }
  if(edit.op==='layer-source'){
    if(!Number.isInteger(edit.index)||edit.index<0||edit.index>=(options.bgLayers?.length??0))
      throw new Error('Graph asset connection requires an existing background-layer port');
    if(!ASSET_REFERENCE.test(edit.assetId)||!document.assets?.some(a=>a.id===edit.assetId))
      throw new Error('Graph cannot connect an unverified background asset');
    const layers=[...(options.bgLayers??[])],target=layers[edit.index];
    if(target.type!=='image'&&target.type!=='pattern')
      throw new Error('Graph background asset port rejects incompatible node type');
    layers[edit.index]={...target,source:edit.assetId};
    return validateCanvasExtras({...options,bgLayers:layers});
  }
  if(edit.op==='canvas-blend')
    return validateCanvasExtras({...options,blendMode:edit.value});
  if(edit.op==='canvas-opacity')
    return validateCanvasExtras({...options,opacity:edit.value??undefined});
  if(edit.op==='root-image-opacity'){
    if(!options.customBg)throw new Error('Graph opacity requires verified root image');
    return validateCanvasExtras({...options,customBg:{...options.customBg,opacity:edit.value??undefined}});
  }
  if(edit.op==='layer-opacity'||edit.op==='layer-noise-intensity'){
    const layers=[...(options.bgLayers??[])];
    if(!Number.isInteger(edit.index)||edit.index<0||edit.index>=layers.length)
      throw new Error('Graph scalar requires an existing ordered layer');
    const target=layers[edit.index];
    if(edit.op==='layer-noise-intensity'){
      if(target.type!=='noise')throw new Error('Graph noise intensity requires noise layer');
      layers[edit.index]={...target,intensity:edit.value??undefined};
    }else{
      if(target.type==='noise')throw new Error('Graph alpha cannot be assigned to a noise-only layer');
      layers[edit.index]={...target,opacity:edit.value??undefined};
    }
    return validateCanvasExtras({...options,bgLayers:layers});
  }
  if(edit.op==='image-layout'){
    if(edit.target==='root'){
      if(!options.customBg)throw new Error('Graph image-layout port requires an existing verified root image');
      return validateCanvasExtras({...options,customBg:{...options.customBg,
        ...(edit.fit===undefined?{}:{fit:edit.fit}),
        ...(edit.align===undefined?{}:{align:edit.align}),
        ...(edit.inherit===undefined?{}:{inherit:edit.inherit})}});
    }
    if(edit.inherit!==undefined)throw new Error('Ordered image layer does not support intrinsic image dimensions');
    if(!Number.isInteger(edit.index)||edit.index!<0||edit.index!>=(options.bgLayers?.length??0))
      throw new Error('Graph image-layout port requires an existing ordered image layer');
    const layers=[...(options.bgLayers??[])];
    const layer=layers[edit.index!];
    if(layer.type!=='image')throw new Error('Graph image-layout port rejects non-image ordered layers');
    layers[edit.index!]={...layer,
      ...(edit.fit===undefined?{}:{fit:edit.fit}),
      ...(edit.align===undefined?{}:{align:edit.align})};
    return validateCanvasExtras({...options,bgLayers:layers});
  }
  if(edit.op==='layer-blend'){
    const layers=[...(options.bgLayers??[])];
    if(!Number.isInteger(edit.index)||edit.index<0||edit.index>=layers.length)
      throw new Error('Graph blend port requires a valid ordered layer');
    layers[edit.index]={...layers[edit.index],blendMode:edit.value};
    return validateCanvasExtras({...options,bgLayers:layers});
  }
  if(edit.op==='layer-pattern'||edit.op==='layer-gradient'){
    const layers=[...(options.bgLayers??[])];
    if(!Number.isInteger(edit.index)||edit.index<0||edit.index>=layers.length)
      throw new Error('Graph property port requires an existing layer node');
    const layer=layers[edit.index];
    if(edit.op==='layer-pattern'){
      if(layer.type!=='presetPattern')throw new Error('Graph pattern port rejects incompatible layer node');
      layers[edit.index]={...layer,pattern:validateCanvasPattern(edit.value)};
    }else{
      if(layer.type!=='gradient')throw new Error('Graph gradient port rejects incompatible layer node');
      layers[edit.index]={...layer,value:validateCanvasGradient(edit.value)};
    }
    return validateCanvasExtras({...options,bgLayers:layers});
  }
  const layers=[...(options.bgLayers??[])];
  if(!Number.isInteger(edit.from)||!Number.isInteger(edit.to)||
    edit.from<0||edit.from>=layers.length||edit.to<0||edit.to>=layers.length)
    throw new Error('Graph layer reorder requires existing input ports');
  const [item]=layers.splice(edit.from,1);layers.splice(edit.to,0,item);
  return validateCanvasExtras({...options,bgLayers:layers});
}

/** A document-level graph operation, not a second Graph document.
 * Color/transparent edits modify the real persisted v1 background; the caller routes
 * the resulting project through the canonical-v2 transaction bridge.
 */
export type CanvasGraphDocumentEdit =
  | {op:'connect-color';fromPort:string;toPort:string}
  | {op:'disconnect-color';toPort:string}
  | {op:'set-color';color:string}
  | {op:'transparent';enabled:boolean};
export function editCanvasGraphDocument(document:WorkspaceDocument,edit:CanvasGraphDocumentEdit):WorkspaceDocument {
 const graph=projectCanvasGraph(document);
 const sourceId=canvasGraphPortId('canvas:color:root','output','color');
 const targetId=canvasGraphPortId('canvas:background','input','color');
 if(edit.op==='connect-color'&&(edit.fromPort!==sourceId||edit.toPort!==targetId))
   throw new Error('Graph solid-color port type mismatch or stale reference');
 if(edit.op==='disconnect-color'&&edit.toPort!==targetId)
   throw new Error('Graph solid-color disconnect needs the exact input port');
 const makeBackground=(patch:Partial<WorkspaceDocument['background']>)=>validateDocument({
   ...document,background:{...document.background,...patch},
   canvasExtras:{...document.canvasExtras,customBg:undefined,gradientBg:undefined}
 });
 if(edit.op==='set-color'){
   if(!/^#[0-9a-fA-F]{6}$/.test(edit.color))throw new Error('Graph solid background requires an opaque hex color');
   return makeBackground({mode:'color',transparent:false,color:edit.color});
 }
 if(edit.op==='transparent')return makeBackground({mode:'color',transparent:edit.enabled});
 if(edit.op==='disconnect-color')return makeBackground({mode:'color',transparent:true});
 if(!graph.ports.some(p=>p.id===sourceId)||!graph.ports.some(p=>p.id===targetId))
   throw new Error('Graph missing solid-color typed source/target ports');
 return makeBackground({mode:'color',transparent:false});
}
