import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,existsSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import sharp from 'sharp';
import {ApexPainter} from 'apexify.js';
import {createBlankDocument,newLayer,validateDocument,type WorkspaceLayer} from '../../features/apex-workspace/model';
import {validateTextSettings,textArguments} from '../../features/apex-workspace/domain/text';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';
const outDir=resolve('evidence/workspace-text/strict/final-four'),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
mkdirSync(outDir,{recursive:true});
function make(font:{family?:string;name?:string}){
 const layer=newLayer('text','font-four') as Extract<WorkspaceLayer,{kind:'text'}>;
 layer.text='WMWM iiiiii 0123456789 ABCDEFG';
 layer.x=35;layer.y=92;layer.color='#ffffff';layer.fontSize=52;
 layer.textSettings=validateTextSettings({properties:{font:{size:52,...font}}});
 const d=createBlankDocument();return validateDocument({...d,width:940,height:260,background:{...d.background,mode:'color',color:'#0b1224'},layers:[layer]});
}
async function render(d:ReturnType<typeof validateDocument>){
 const painter=new ApexPainter({type:'buffer'}),canvas=await painter.createCanvas({width:d.width,height:d.height,colorBg:d.background.color});
 const {texts,options}=textArguments(d.layers[0] as Extract<WorkspaceLayer,{kind:'text'}>);
 const obj=Array.isArray(texts)?texts[0]:texts;
 const metrics=await painter.measureText(obj);
 const png=options?await painter.createText(texts,canvas.buffer,options):await painter.createText(texts,canvas.buffer);
 return {png,metrics};
}
async function generated(d:ReturnType<typeof validateDocument>){
 const code=generateSource(d);
 assert.deepEqual(parseSource(code),d,'Code→Visual semantic parity');
 const sandbox=mkdtempSync(join(tmpdir(),'text-four-generated-'));
 const file=resolve(`_text01_four_${process.pid}_${Math.random().toString(36).slice(2)}.mjs`);
 try{writeFileSync(file,code);execFileSync(process.execPath,[file],{cwd:sandbox,timeout:60000,windowsHide:true,stdio:'pipe'});return {code,png:readFileSync(join(sandbox,'output.png'))};}
 finally{if(existsSync(file))unlinkSync(file);rmSync(sandbox,{recursive:true,force:true})}
}
const cases=[
 {path:'createText.TextProperties.font.family',name:'Arial',font:{family:'Arial'}},
 {path:'createText.TextProperties.font.family',name:'Courier New',font:{family:'Courier New'}},
 {path:'createText.TextProperties.font.name',name:'Arial',font:{family:'Courier New',name:'Arial'}},
 {path:'createText.TextProperties.font.name',name:'Courier New',font:{family:'Arial',name:'Courier New'}},
];
async function run(){
const out=[] as any[];
for(const c of cases){
 const d=make(c.font),native=await render(d),code=await generated(d);
 const nativePixels=await sharp(native.png).ensureAlpha().raw().toBuffer();
 const codePixels=await sharp(code.png).ensureAlpha().raw().toBuffer();
 assert.ok(nativePixels.equals(codePixels),'Native != executed generated public Code: '+c.path+' '+c.name);
 assert.ok(code.code.includes(JSON.stringify(c.name)),'Generated Code misses exact font: '+c.name);
 const o={id:c.path.endsWith('.family')?'NATIVE-FOUR-FONT-FAMILY-CODE':'NATIVE-FOUR-FONT-NAME-CODE',path:c.path,font:c.font,caseName:c.name,measuredWidth:native.metrics.width,nativeSha256:sha(nativePixels),codeSha256:sha(codePixels),codeExecution:'PASS',codeToVisual:'PASS',pixelEquality:true};
 out.push(o);console.log(JSON.stringify(o));
}
for(const path of ['createText.TextProperties.font.family','createText.TextProperties.font.name']){
 const pair=out.filter(x=>x.path===path);assert.equal(pair.length,2);
 assert.notEqual(pair[0].nativeSha256,pair[1].nativeSha256,path+' native pixels identical');
 assert.notEqual(pair[0].measuredWidth,pair[1].measuredWidth,path+' metrics identical');
}
writeFileSync(join(outDir,'font-generated-code-equivalence.json'),JSON.stringify({pathCount:2,cases:out},null,2)+'\n');
console.log('FOUR_FONT_CODE_NATIVE_ALL_PASS');
}
run().catch(error=>{console.error(error);process.exitCode=1});
