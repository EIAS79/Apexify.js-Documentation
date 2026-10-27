import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
const {createElement}=React;
const {renderToStaticMarkup}=require('react-dom/server') as {renderToStaticMarkup:(node:React.ReactNode)=>string};
Object.assign(globalThis,{React});
import {ApexPainter} from 'apexify.js';
import ImageOptionsEditor,{GroupTransformEditor} from '../../features/apex-workspace/components/ImageOptionsEditor';

const gradient={
 type:'linear' as const,startX:0,startY:0,endX:50,endY:50,
 colors:[{stop:0,color:'#ff0000'},{stop:1,color:'#0000ff'}]
};
const common={onChange:()=>{},assets:[],onAsset:()=>{},onError:()=>{},width:50,height:50};

test('native image gradient makes simultaneous solid paint inert; Inspector must not expose no-effect solid color',async()=>{
 const p=new ApexPainter({type:'buffer'}),b=(await p.createCanvas({width:80,height:80,colorBg:'#ffffff'})).buffer;
 for(const part of ['shape','boxBackground'] as const){
  const options=part==='shape'?{shape:{fill:true,color:'#00ee88',gradient}}:{boxBackground:{color:'#00ee88',gradient}};
  const pure=part==='shape'?{shape:{fill:true,gradient}}:{boxBackground:{gradient}};
  const make=(opts:Record<string,unknown>)=>p.createImage({source:'rectangle',x:6,y:6,width:50,height:50,shape:{fill:true,color:'#fb7c21'},...opts},b);
  assert.deepEqual(await make(options),await make(pure),part+' color has no native pixel effect while gradient active');
 }
 const shapeMarkup=renderToStaticMarkup(createElement(ImageOptionsEditor,{
  ...common,isShape:true,shapeType:'rectangle',options:{shape:{fill:true,gradient},boxBackground:{gradient}}
 }));
 assert.match(shapeMarkup,/aria-label="Shape gradient"/);
 assert.doesNotMatch(shapeMarkup,/aria-label="Shape color"/);
 assert.match(shapeMarkup,/aria-label="Box gradient"/);
 assert.doesNotMatch(shapeMarkup,/aria-label="Box color"/);
 const solidMarkup=renderToStaticMarkup(createElement(ImageOptionsEditor,{
  ...common,isShape:true,shapeType:'rectangle',options:{shape:{fill:true,color:'#e2a343'},boxBackground:{color:'#eeae70'}}
 }));
 assert.match(solidMarkup,/aria-label="Shape color"/);
 assert.match(solidMarkup,/aria-label="Box color"/);
 const groupGradient=renderToStaticMarkup(createElement(GroupTransformEditor,{...common,value:{boxBackground:{gradient}}}));
 assert.match(groupGradient,/aria-label="Group box gradient"/);
 assert.doesNotMatch(groupGradient,/aria-label="Group box color"/);
 const groupSolid=renderToStaticMarkup(createElement(GroupTransformEditor,{...common,value:{boxBackground:{color:'#ff783d'}}}));
 assert.match(groupSolid,/aria-label="Group box color"/);
});
