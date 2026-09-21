import type { VisualNode, VisualProject, VisualTransform } from '../model';

export type AlignMode = 'left'|'center'|'right'|'top'|'middle'|'bottom'|'distribute-horizontal'|'distribute-vertical';
export type ResizeHandle = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w';
export type EditorSnapshot = { project: VisualProject; label: string };
export type SnapGuide = { axis: 'x'|'y'; value: number; source: 'canvas'|'object'|'grid' };
export type SnapResult = { x: number; y: number; guides: SnapGuide[] };
export const DEFAULT_NODE_SIZE = { width: 160, height: 100 };
export const DEFAULT_SNAP_THRESHOLD = 6;

const clone = <T>(value:T):T => structuredClone(value);
const n = (value:number|undefined, fallback:number) => Number.isFinite(value) ? value! : fallback;
export const nodeRect = (node:VisualNode) => ({
  x:n(node.transform?.x,0), y:n(node.transform?.y,0),
  width:Math.max(1,n(node.transform?.width,DEFAULT_NODE_SIZE.width)),
  height:Math.max(1,n(node.transform?.height,DEFAULT_NODE_SIZE.height)),
});
const roots=(p:VisualProject)=>p.document.rootNodeIds;
const siblings=(p:VisualProject,node:VisualNode):string[] => node.parentId ? (p.document.nodes[node.parentId]?.childIds ?? []) : roots(p);

export function patchNodeTransform(project:VisualProject,id:string,patch:Partial<VisualTransform>):VisualProject {
  const node=project.document.nodes[id]; if(!node || node.transform?.locked) return project;
  const next=clone(project); next.document.nodes[id].transform={...next.document.nodes[id].transform,...patch}; return next;
}
export function setSelection(project:VisualProject,ids:string[]):VisualProject {
  const next=clone(project); next.editor={...next.editor,selectedNodeIds:[...new Set(ids.filter(id=>!!next.document.nodes[id]))]}; return next;
}
export function toggleSelection(project:VisualProject,id:string):VisualProject {
  const selected=project.editor?.selectedNodeIds ?? []; return setSelection(project,selected.includes(id)?selected.filter(x=>x!==id):[...selected,id]);
}
export function moveNodes(project:VisualProject,ids:string[],dx:number,dy:number):VisualProject {
  let next=project; for(const id of ids){const node=next.document.nodes[id];if(!node||node.transform?.locked)continue;const r=nodeRect(node);next=patchNodeTransform(next,id,{x:r.x+dx,y:r.y+dy});} return next;
}
export function resizeNode(project:VisualProject,id:string,handle:ResizeHandle,dx:number,dy:number,keepAspect=false):VisualProject {
  const node=project.document.nodes[id]; if(!node||node.transform?.locked)return project;
  const r=nodeRect(node); let {x,y,width,height}=r;
  if(handle.includes('e')) width+=dx; if(handle.includes('s')) height+=dy;
  if(handle.includes('w')) {x+=dx;width-=dx;} if(handle.includes('n')) {y+=dy;height-=dy;}
  width=Math.max(8,width);height=Math.max(8,height);
  if(keepAspect){const ratio=r.width/r.height;if(Math.abs(dx)>=Math.abs(dy))height=width/ratio;else width=height*ratio;}
  return patchNodeTransform(project,id,{x,y,width,height});
}
export function rotateNode(project:VisualProject,id:string,rotation:number):VisualProject { return patchNodeTransform(project,id,{rotation:((rotation%360)+360)%360}); }
export function setNodeVisibility(project:VisualProject,id:string,visible:boolean):VisualProject {
  const node=project.document.nodes[id];if(!node)return project;const next=clone(project);next.document.nodes[id].transform={...node.transform,visible};return next;
}
export function setNodeLocked(project:VisualProject,id:string,locked:boolean):VisualProject {
  const node=project.document.nodes[id];if(!node)return project;const next=clone(project);next.document.nodes[id].transform={...node.transform,locked};return next;
}
export function renameNode(project:VisualProject,id:string,name:string):VisualProject {
  if(!project.document.nodes[id])return project;const next=clone(project);next.document.nodes[id].name=name.trim()||next.document.nodes[id].kind;return next;
}
export function reorderNode(project:VisualProject,id:string,toIndex:number):VisualProject {
  const node=project.document.nodes[id];if(!node)return project;const next=clone(project);const list=siblings(next,next.document.nodes[id]);const from=list.indexOf(id);if(from<0)return project;list.splice(from,1);list.splice(Math.max(0,Math.min(toIndex,list.length)),0,id);list.forEach((nodeId,index)=>{next.document.nodes[nodeId].transform={...next.document.nodes[nodeId].transform,zIndex:index};});return next;
}
export function duplicateNodes(project:VisualProject,ids:string[],idFactory:(source:VisualNode)=>string):VisualProject {
  const next=clone(project);const created:string[]=[];
  for(const id of ids){const source=next.document.nodes[id];if(!source)continue;const copy=clone(source);copy.id=idFactory(source);copy.name=(source.name??source.kind)+' copy';copy.childIds=[];copy.transform={...source.transform,x:nodeRect(source).x+16,y:nodeRect(source).y+16};next.document.nodes[copy.id]=copy;const list=source.parentId?(next.document.nodes[source.parentId]?.childIds??next.document.rootNodeIds):next.document.rootNodeIds;const at=list.indexOf(id);list.splice(at+1,0,copy.id);created.push(copy.id);}
  next.editor={...next.editor,selectedNodeIds:created};return next;
}
function collectDescendants(project:VisualProject,id:string,out:Set<string>){if(out.has(id))return;out.add(id);for(const child of project.document.nodes[id]?.childIds??[])collectDescendants(project,child,out);}
export function deleteNodes(project:VisualProject,ids:string[]):VisualProject {
  const next=clone(project), doomed=new Set<string>();ids.forEach(id=>collectDescendants(next,id,doomed));
  for(const id of doomed)delete next.document.nodes[id];
  next.document.rootNodeIds=next.document.rootNodeIds.filter(id=>!doomed.has(id));
  for(const node of Object.values(next.document.nodes))node.childIds=node.childIds?.filter(id=>!doomed.has(id));
  next.editor={...next.editor,selectedNodeIds:(next.editor?.selectedNodeIds??[]).filter(id=>!doomed.has(id))};return next;
}
export function alignNodes(project:VisualProject,ids:string[],mode:AlignMode):VisualProject {
  const nodes=ids.map(id=>project.document.nodes[id]).filter(Boolean);if(nodes.length<2)return project;
  const rects=nodes.map(nodeRect);let next=project;
  if(mode==='distribute-horizontal'||mode==='distribute-vertical'){
    if(nodes.length<3)return project;const horizontal=mode==='distribute-horizontal';const sorted=nodes.map((node,i)=>({node,r:rects[i]})).sort((a,b)=>horizontal?a.r.x-b.r.x:a.r.y-b.r.y);
    const first=sorted[0].r,last=sorted[sorted.length-1].r;const span=horizontal?(last.x+last.width-first.x):(last.y+last.height-first.y);const occupied=sorted.reduce((s,x)=>s+(horizontal?x.r.width:x.r.height),0);const gap=(span-occupied)/(sorted.length-1);let cursor=horizontal?first.x:first.y;
    for(const item of sorted){next=patchNodeTransform(next,item.node.id,horizontal?{x:cursor}:{y:cursor});cursor+=(horizontal?item.r.width:item.r.height)+gap;}return next;
  }
  const minX=Math.min(...rects.map(r=>r.x)),maxX=Math.max(...rects.map(r=>r.x+r.width)),minY=Math.min(...rects.map(r=>r.y)),maxY=Math.max(...rects.map(r=>r.y+r.height));
  for(const node of nodes){const r=nodeRect(node);let patch:Partial<VisualTransform>={};if(mode==='left')patch={x:minX};if(mode==='center')patch={x:(minX+maxX-r.width)/2};if(mode==='right')patch={x:maxX-r.width};if(mode==='top')patch={y:minY};if(mode==='middle')patch={y:(minY+maxY-r.height)/2};if(mode==='bottom')patch={y:maxY-r.height};next=patchNodeTransform(next,node.id,patch);}return next;
}
export function snapPosition(project:VisualProject,id:string,x:number,y:number,threshold=DEFAULT_SNAP_THRESHOLD,grid=8):SnapResult {
  const node=project.document.nodes[id];if(!node)return{x,y,guides:[]};const r=nodeRect(node);const guides:SnapGuide[]=[];let sx=x,sy=y;
  const xTargets=[0,project.document.width/2-r.width/2,project.document.width-r.width],yTargets=[0,project.document.height/2-r.height/2,project.document.height-r.height];
  for(const other of Object.values(project.document.nodes)){if(other.id===id||other.transform?.visible===false)continue;const o=nodeRect(other);xTargets.push(o.x,o.x+o.width/2-r.width/2,o.x+o.width-r.width);yTargets.push(o.y,o.y+o.height/2-r.height/2,o.y+o.height-r.height);}
  const gx=Math.round(x/grid)*grid,gy=Math.round(y/grid)*grid;xTargets.push(gx);yTargets.push(gy);
  const tx=xTargets.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a,xTargets[0]),ty=yTargets.reduce((a,b)=>Math.abs(b-y)<Math.abs(a-y)?b:a,yTargets[0]);
  if(Math.abs(tx-x)<=threshold){sx=tx;guides.push({axis:'x',value:tx,source:tx===gx?'grid':'object'});}if(Math.abs(ty-y)<=threshold){sy=ty;guides.push({axis:'y',value:ty,source:ty===gy?'grid':'object'});}return{x:sx,y:sy,guides};
}
export class VisualHistory {
  private past:EditorSnapshot[]=[]; private future:EditorSnapshot[]=[]; constructor(private limit=100){}
  commit(before:VisualProject,after:VisualProject,label:string){if(before===after||JSON.stringify(before)===JSON.stringify(after))return;this.past.push({project:clone(before),label});if(this.past.length>this.limit)this.past.shift();this.future=[];}
  undo(current:VisualProject){const item=this.past.pop();if(!item)return null;this.future.push({project:clone(current),label:item.label});return{project:clone(item.project),label:item.label};}
  redo(current:VisualProject){const item=this.future.pop();if(!item)return null;this.past.push({project:clone(current),label:item.label});return{project:clone(item.project),label:item.label};}
  get canUndo(){return this.past.length>0} get canRedo(){return this.future.length>0} get entries(){return [...this.past].reverse().map(x=>x.label);}
}
