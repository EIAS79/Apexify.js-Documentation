import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DockLayout,hasVisiblePanel,type DockTree} from '../../features/apex-workspace/components/DockLayout';
Object.assign(globalThis,{React});
const tree:DockTree={id:'results',tabs:['queue','preview','output'],defaultPanel:'queue'};
function render(visible:Partial<Record<'queue'|'preview'|'output',boolean>>,active='queue'){
 return renderToStaticMarkup(React.createElement(DockLayout,{
  tree,visible,sizes:{},onResize:()=>{},activeTabs:{results:active as 'queue'|'preview'|'output'},
  renderPanel:(id,tabs)=>React.createElement('span',{'data-members':tabs?.join(',')},id),
 }));
}
test('tabbed dock keeps inactive panels mounted and exposes only selected content',()=>{
 const html=render({queue:true,preview:true,output:true},'preview');
 assert.match(html,/data-panel="queue" hidden=""/);
 assert.match(html,/data-panel="preview"><span/);
 assert.match(html,/data-panel="output" hidden=""/);
 assert.match(html,/data-members="queue,preview,output"/);
});
test('closing the active tab falls back to the default or first remaining panel',()=>{
 assert.match(render({queue:true,output:true},'preview'),/data-panel="queue"><span/);
 assert.match(render({output:true},'preview'),/data-panel="output"><span/);
});
test('closed tabs leave the tab strip and empty tab groups do not consume split space',()=>{
 const html=render({queue:true});
 assert.doesNotMatch(html,/data-panel="preview"|data-panel="output"/);
 assert.match(html,/data-members="queue"/);
 assert.equal(hasVisiblePanel(tree,{}),false);
 assert.equal(hasVisiblePanel(tree,{output:true}),true);
});
