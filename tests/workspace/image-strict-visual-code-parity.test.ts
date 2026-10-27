import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,newLayer,validateDocument} from '../../features/apex-workspace/model';
import {imageArguments} from '../../features/apex-workspace/image-runtime';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
import {projectCanvasGraph} from '../../features/apex-workspace/canvas-graph';
import {IMAGE_FILTERS,IMAGE_DISTORTIONS,IMAGE_SHAPES} from '../../features/apex-workspace/image-options';
const exec=promisify(execFile);
const filters:Record<string,Record<string,number>>={
 gaussianBlur:{intensity:1,radius:2},motionBlur:{intensity:1,radius:3,angle:24},radialBlur:{intensity:1,radius:3,centerX:25,centerY:22},
 sharpen:{intensity:2},noise:{intensity:0.7},grain:{intensity:0.8},edgeDetection:{intensity:1},emboss:{intensity:1},
 pixelate:{size:5,x:0,y:0,width:56,height:54},brightness:{value:1.3},contrast:{value:1.3},saturation:{value:0.6},
 hueShift:{value:70},posterize:{levels:4}
};
const points=[{x:0,y:0},{x:56,y:0},{x:56,y:54},{x:0,y:54}];
const distortions:Record<string,Record<string,unknown>>={
 perspective:{points:[{x:2,y:2},{x:52,y:4},{x:54,y:52},{x:3,y:53}]},
 warp:{controlPoints:[{from:{x:15,y:15},to:{x:21,y:26},radius:19,strength:0.8,falloff:'smooth'}]},
 bulge:{intensity:0.6,centerX:25,centerY:26,radius:24},pinch:{intensity:0.7,centerX:25,centerY:26,radius:24},
 twirl:{intensity:0.7,centerX:25,centerY:26,radius:24,angle:100},
 wave:{amplitudeX:5,amplitudeY:4,wavelengthX:20,wavelengthY:22,phaseX:13,phaseY:24}
};
test('strict union 10 shapes + 17 filters + 6 distortions: real native Visual and generated executable Code PNG bytes agree',async()=>{
 const d=createBlankDocument();d.width=520;d.height=400;d.background={...d.background,mode:'color',color:'#142230'};
 d.layers=[];
 const variants:string[]=[];
 for(const type of IMAGE_SHAPES)variants.push('shape:'+type);
 for(const type of IMAGE_FILTERS)variants.push('filter:'+type);
 for(const type of IMAGE_DISTORTIONS)variants.push('distortion:'+type);
 for(let i=0;i<variants.length;i++){
  const [kind,type]=variants[i].split(':');
  const layer=kind==='shape'?newLayer('shape','strict_'+i,type):newLayer('image','strict_'+i,'/workspace/assets/crystal-lake.webp');
  Object.assign(layer,{x:8+(i%7)*73,y:8+Math.floor(i/7)*76,width:56,height:54,opacity:1,rotation:0});
  if(kind==='shape'&&layer.kind==='shape'){
   const geom=type==='polygon'?{points:[{x:0,y:0},{x:56,y:0},{x:42,y:54},{x:6,y:48}]}:type==='star'?{sides:6,innerRadius:13,outerRadius:25}:type==='arc'||type==='pieSlice'?{radius:24,startAngle:15,endAngle:280}:{};
   layer.imageOptions={shape:{fill:true,color:'#fb6b26',...geom}};
  }else if(kind==='filter'&&layer.kind==='image'){
   layer.imageOptions={filters:[{type:type as typeof IMAGE_FILTERS[number],...filters[type]}],fit:'fill'};
  }else if(kind==='distortion'&&layer.kind==='image'){
   layer.imageOptions={distortion:{type:type as typeof IMAGE_DISTORTIONS[number],...distortions[type]},fit:'fill'};
  }
  d.layers.push(layer);
 }
 const valid=validateDocument(d);
 assert.equal(valid.layers.length,33);
 assert.deepEqual(parseSource(generateSource(valid)),valid);
 const graph=projectCanvasGraph(valid);
 assert.ok(graph.nodes.length>=33);
 const art=await readFile('public/workspace/assets/crystal-lake.webp');
 const painter=new ApexPainter({type:'buffer'});
 let direct=(await painter.createCanvas({width:520,height:400,colorBg:'#142230'})).buffer;
 for(const layer of valid.layers){
  if(layer.kind!=='image'&&layer.kind!=='shape')throw Error('unexpected layer kind');
  direct=await painter.createImage(imageArguments(layer,valid,art),direct);
 }
 const tmp=await mkdtemp(join(process.cwd(),'tests/workspace/.strict-code-'));
 try{
  const program=join(tmp,'render.mjs'),file=join(tmp,'output.png');
  await writeFile(program,generateSource(valid).replace("writeFile('output.png', output)","writeFile("+JSON.stringify(file)+", output)"));
  await exec(process.execPath,[program],{cwd:process.cwd(),timeout:90000});
  const code=await readFile(file);assert.deepEqual(code,direct);
 }finally{await rm(tmp,{recursive:true,force:true})}
});
