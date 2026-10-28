import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {textPropertiesSpec} from '../../features/apex-workspace/domain/text';
import {TEXT_PROPERTY_SECTIONS,TEXT_INSPECTOR_SECTIONS,IMAGE_INSPECTOR_SECTIONS,type LayerInspectorSection} from '../../features/apex-workspace/inspector-sections';
import {createHeroDocument,newLayer,type WorkspaceLayer} from '../../features/apex-workspace/model';
import TextOptionsEditor from '../../features/apex-workspace/components/TextOptionsEditor';
import ImageOptionsEditor from '../../features/apex-workspace/components/ImageOptionsEditor';
import Inspector from '../../features/apex-workspace/components/Inspector';
import LayerInspectorNavigation from '../../features/apex-workspace/components/LayerInspectorNavigation';
Object.assign(globalThis,{React});
const sections:LayerInspectorSection[]=['primary','layout','appearance','advanced'];
const labels=(html:string)=>new Set([...html.matchAll(/aria-label="([^"]+)"/g)].map(match=>match[1]));
const noop=()=>{};

test('every native text-property family has one reachable inspector category',()=>{
 assert.equal(textPropertiesSpec.kind,'object');
 if(textPropertiesSpec.kind!=='object')throw Error('Expected object schema');
 assert.deepEqual(Object.keys(TEXT_PROPERTY_SECTIONS).sort(),Object.keys(textPropertiesSpec.fields).sort());
 for(const section of Object.values(TEXT_PROPERTY_SECTIONS))assert.ok(sections.includes(section));
});

test('Text categories preserve all advanced authoring controls without exposing unrelated families',()=>{
 const layer=newLayer('text','text') as Extract<WorkspaceLayer,{kind:'text'}>;
 layer.textSettings={properties:{font:{family:'DejaVu Sans'},layout:{letterSpacing:2},fill:{color:'#ffffff'},includeCharMetrics:true}};
 const render=(focus:LayerInspectorSection|'all')=>renderToStaticMarkup(React.createElement(TextOptionsEditor,{layer,focus,onChange:noop}));
 const all=labels(render('all')),reachable=new Set(sections.flatMap(section=>[...labels(render(section))]));
 assert.deepEqual(reachable,all);
 assert.match(render('primary'),/Font overrides/);assert.doesNotMatch(render('primary'),/Spacing &amp; wrapping|Text runs &amp; groups|Measure text/);
 assert.match(render('advanced'),/Text runs &amp; groups/);assert.match(render('advanced'),/Measure text/);
});

test('Image categories preserve every configured authoring surface including masks and strokes',()=>{
 const props={options:{borderRadius:12,stroke:{width:8,borderPosition:'bottom,left'},filters:[{type:'sepia' as const}],
   clipPath:[{x:0,y:0},{x:80,y:0},{x:0,y:60}],distortion:{type:'bulge' as const,intensity:.3},effects:{vignette:{intensity:.3,size:.5}}},
  assets:[],onChange:noop,onAsset:noop,onError:noop,width:80,height:60};
 const render=(focus:LayerInspectorSection|'all')=>renderToStaticMarkup(React.createElement(ImageOptionsEditor,{...props,focus}));
 const all=labels(render('all')),reachable=new Set(sections.flatMap(section=>[...labels(render(section))]));
 assert.deepEqual(reachable,all);
 assert.doesNotMatch(render('primary'),/Enable distortion|Enable image mask|Filter intensity/);
 assert.match(render('layout'),/Image rounded corners/);assert.match(render('advanced'),/Enable image mask/);
});

test('intrinsic Image dimensions disable ignored fit and alignment controls',()=>{
 const html=renderToStaticMarkup(React.createElement(ImageOptionsEditor,{options:{inherit:true},focus:'primary',assets:[],onChange:noop,onAsset:noop,onError:noop,width:80,height:60}));
 assert.match(html,/<select aria-label="Image fit" disabled=""/);
 assert.match(html,/<select aria-label="Image alignment" disabled=""/);
});

for(const kind of ['text','image'] as const)test(kind+' navigation connects all tabs to its category panel and starts on the primary editor',()=>{
 const document=createHeroDocument(),layer=newLayer(kind,'selected');document.layers=[layer];
 const nav=renderToStaticMarkup(React.createElement(LayerInspectorNavigation,{layer,section:'primary',onChange:noop,onCanvas:noop,id:'test'}));
 const expected=kind==='text'?TEXT_INSPECTOR_SECTIONS:IMAGE_INSPECTOR_SECTIONS;
 for(const [key] of expected)assert.ok(nav.includes('id="test-layer-tab-'+key+'"'));
 assert.equal((nav.match(/role="tab"/g)??[]).length,4);
 assert.equal((nav.match(/aria-selected="true"/g)??[]).length,1);
 const html=renderToStaticMarkup(React.createElement(Inspector,{document,selected:layer.id,tab:'Properties',setTab:noop,onDocument:noop,
  onCanvasAsset:noop,onLayer:noop,onSelect:noop,onRemove:noop,onReorder:noop,onPreset:noop,onUpload:noop,onError:noop}));
 assert.match(html,kind==='text'?/aria-label="Text content"/:/aria-label="Image layer source"/);
 assert.doesNotMatch(html,/aria-label="Rotation"/,'primary view should not contain the transform form');
 assert.match(html,/Canvas settings/);
});
