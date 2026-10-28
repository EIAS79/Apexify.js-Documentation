import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as React from 'react';
import {createElement} from 'react';
const {renderToStaticMarkup} = require('react-dom/server') as {renderToStaticMarkup: (element: React.ReactElement) => string};
import {DockLayout,type DockTree} from '../../features/apex-workspace/components/DockLayout';
import {Queue} from '../../features/apex-workspace/components/Results';
(globalThis as typeof globalThis & {React:typeof React}).React=React;
const read=(p:string)=>readFileSync(p,'utf8');
const tree:DockTree={id:'root',direction:'row',weights:[14,86],children:[{panel:'tools'},{panel:'code'}]};
const resize=(sizes:number[])=>renderToStaticMarkup(createElement(DockLayout,{tree,visible:{tools:true,code:true},sizes:{root:sizes},onResize:()=>{},renderPanel:id=>createElement('div',{},id)}));
const attr=(markup:string,k:string)=>new RegExp(k+'="([^"]+)"').exec(markup)?.[1];
test('real DockLayout renders focusable ARIA separator with bounded live resize value',()=>{
 const before=resize([14,86]),after=resize([28,72]);
 for(const html of [before,after]){
  assert.match(html,/role="separator"/);
  assert.match(html,/tabindex="0"/);
  assert.equal(attr(html,'aria-valuemin'),'12');
  assert.equal(attr(html,'aria-valuemax'),'88');
  assert.equal(attr(html,'aria-orientation'),'vertical');
  assert.equal(attr(html,'aria-label'),'Resize root panels');
 }
 assert.equal(attr(before,'aria-valuenow'),'14');
 assert.equal(attr(after,'aria-valuenow'),'28');
});
test('keyboard arrow resizing remains enabled with constrained 12–88% pair semantics',()=>{
 const dock=read('features/apex-workspace/components/DockLayout.tsx');
 assert.match(dock,/onKeyDown=\{\(e\) =>/);
 assert.match(dock,/\["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"\]/);
 assert.match(dock,/e\.preventDefault\(\)/);
 assert.match(dock,/pair \* 0\.12/);
 assert.match(dock,/pair \* 0\.88/);
 assert.match(dock,/onResize\(tree\.id, next\)/);
});
test('rendered Image results give enabled and disabled image buttons discernible names',()=>{
 const make=(url?:string)=>renderToStaticMarkup(createElement(Queue,{jobs:[{id:'r1',name:'Sample output',state:url?'completed':'running',document:{width:50,height:50} as never,url}],onCancel:()=>{},onSelect:()=>{},onRender:()=>{}}));
 const available=make('data:image/png;base64,AA=='),missing=make();
 assert.match(available,/aria-label="Open Sample output rendered image"/);
 assert.match(missing,/aria-label="Sample output image unavailable"/);
 assert.match(missing,/disabled=""/);
 assert.match(available,/class="aw-job-art"/);
});
test('CodeMirror labels editable area and enables keyboard scrolling',()=>{
 const code=read('features/apex-workspace/components/CodeEditor.tsx');
 assert.match(code,/onCreateEditor=\{\(view\) => \{/);
 assert.match(code,/view\.contentDOM\.setAttribute\("aria-label", "TypeScript code editor"\)/);
 assert.match(code,/view\.scrollDOM\.setAttribute\("tabindex", "0"\)/);
 assert.match(code,/onChange=\{onChange\}/);
});
test('CodeMirror gutter meets WCAG AA 4.5:1 small-text contrast',()=>{
 const css=read('features/apex-workspace/workspace.css');
 const rule=[...css.matchAll(/\.aw-editor \.cm-gutters\s*\{([^}]+)\}/gs)].at(-1)?.[1];
 assert.ok(rule);
 assert.match(rule,/color:\s*var\(--text-secondary\)/);
 assert.match(rule,/background:\s*var\(--bg-sunken\)/);
 const palette=read('styles/frame-palette.css');
 const themes=[palette.split('.frame-palette {')[1].split('}')[0],palette.split('.light .frame-palette {')[1].split('}')[0]];
 const lum=(h:string)=>{
  const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return .2126*v[0]+.7152*v[1]+.0722*v[2];
 };
 for(const theme of themes){
  const fg=/--text-secondary:\s*(#[a-f\d]{6})/i.exec(theme)?.[1],bg=/--bg-sunken:\s*(#[a-f\d]{6})/i.exec(theme)?.[1];
  assert.ok(fg&&bg);
  const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  assert.ok(ratio>=4.5,'Actual gutter contrast '+ratio.toFixed(2)+' must meet 4.5:1 in both themes');
 }
});
test('S23 intentional engine migration preserves Image 329/Text 440 historical certification counts',()=>{
 const image=JSON.parse(read('docs/workspace/IMG01_STRICT_CERTIFICATION_LEDGER.json'));
 const text=JSON.parse(read('docs/workspace/TEXT01_STRICT_CERTIFICATION_444.json'));
 const count=(records:any[],field:string)=>records.reduce((d:any,r:any)=>{d[r[field]]=(d[r[field]]||0)+1;return d},{});
 assert.deepEqual(count(image.records,'strictStatus'),{FULL:329,PARTIAL:17,BLOCKED:5});
 assert.deepEqual(count(text.records,'classification'),{FULL:440,PARTIAL:2,BLOCKED:1,EXCLUDED:1});
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.dependencies['apexify.js'],'github:EIAS79/Apexify.js#b6ca97cfc675b16a52c2c7b5d0ff881b87b911be');
});
