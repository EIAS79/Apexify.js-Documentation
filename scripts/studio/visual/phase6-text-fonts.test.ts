import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import {
  TEXT_AUTHORING_CLASSIFICATION,
  defaultTextNodeProps,
  textBatchGroupPropsRecord,
  textPropsRecord,
  visualTextBatchGroupProps,
  visualTextProps,
} from '../../../lib/studio/visual/text-contract';
import {
  defaultShapeNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

function phase6Project() {
  const project = createVisualProject({
    id: 'project_phase6',
    name: 'Text Font Proof',
    width: 960,
    height: 600,
    now: '2026-09-21T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };

  const shape = createVisualNode(
    'shape',
    imagePropsRecord(defaultShapeNodeProps('rectangle')),
    { id: 'shape_panel', name: 'Panel' },
  );
  shape.transform = {
    x: 80,
    y: 80,
    width: 800,
    height: 420,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
  };

  const text = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Apexify Studio\nText from code.'),
      font: {
        size: 54,
        family: 'Arial',
        name: 'Arial',
      },
      decorations: {
        bold: true,
        italic: false,
        underline: { color: '#7dd3fc', width: 2 },
      },
      layout: {
        lineHeight: 1.25,
        letterSpacing: 1,
        wordSpacing: 2,
        maxWidth: 560,
        maxHeight: 180,
      },
      placement: {
        textAlign: 'left',
        textBaseline: 'top',
        rotation: 4,
      },
      fill: {
        color: '#f8fafc',
        opacity: .94,
      },
      effects: {
        shadow: {
          color: '#000000',
          offsetX: 0,
          offsetY: 8,
          blur: 18,
          opacity: .35,
        },
        glow: {
          color: '#60a5fa',
          intensity: 7,
          opacity: .4,
        },
      },
      stroke: {
        color: '#0b1730',
        width: 1,
        opacity: .7,
        style: 'solid',
      },
      includeCharMetrics: true,
      measurementCanvas: { width: 1200, height: 600 },
    }),
    { id: 'text_hero', name: 'Hero Copy' },
  );
  text.transform = {
    x: 160,
    y: 180,
    width: 560,
    height: 180,
    rotation: 4,
    opacity: .94,
    visible: true,
    locked: false,
    zIndex: 1,
  };

  project.document.nodes[shape.id] = shape;
  project.document.nodes[text.id] = text;
  project.document.rootNodeIds = [shape.id, text.id];
  return project;
}

test('Phase 6 lowers text after earlier visual output and preserves modern typography', () => {
  const project = phase6Project();
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  assert.deepEqual(
    plan.operations.map((operation) => operation.kind),
    ['create-canvas', 'create-image', 'create-text'],
  );

  const text = plan.operations[2];
  assert.equal(text.kind, 'create-text');
  if (text.kind !== 'create-text') return;
  assert.equal(Array.isArray(text.properties), false);
  if (Array.isArray(text.properties)) return;
  assert.equal(text.base.$studioTarget, 'shape_panel');
  assert.equal(text.properties.text, 'Apexify Studio\nText from code.');
  assert.equal(text.properties.x, 160);
  assert.equal(text.properties.y, 180);
  assert.equal(text.properties.font?.size, 54);
  assert.equal(text.properties.layout?.maxWidth, 560);
  assert.equal(text.properties.layout?.maxHeight, 180);
  assert.equal(text.properties.placement?.rotation, 4);
  assert.equal(text.properties.fill?.opacity, .94);
});

test('Phase 6 emits clean canonical createText source', () => {
  const source = generateVisualProjectCode(phase6Project()).source;
  assert.match(source, /\.createText\(/);
  assert.match(source, /text: "Apexify Studio\\nText from code\."/);
  assert.match(source, /font:/);
  assert.match(source, /decorations:/);
  assert.match(source, /layout:/);
  assert.match(source, /placement:/);
  assert.match(source, /effects:/);
  assert.match(source, /measurementCanvas:/);
  assert.match(source, /createText\([\s\S]+panel\)/);
});

test('Phase 6 canonical createText round-trips into a semantic text node', () => {
  const project = phase6Project();
  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    id: project.id,
    name: project.name,
    width: 320,
    height: 200,
    now: project.createdAt,
  });

  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const ids = result.project.document.rootNodeIds;
  assert.equal(ids.length, 2);
  const text = result.project.document.nodes[ids[1]];
  assert.equal(text.kind, 'text');
  const props = visualTextProps(text);
  assert.equal(props.text, 'Apexify Studio\nText from code.');
  assert.equal(props.font?.size, 54);
  assert.equal(props.decorations?.bold, true);
  assert.equal(props.layout?.lineHeight, 1.25);
  assert.equal(props.effects?.shadow?.blur, 18);
  assert.equal(text.transform?.x, 160);
  assert.equal(text.transform?.y, 180);
  assert.equal(text.transform?.width, 560);
  assert.equal(text.transform?.height, 180);
  assert.equal(text.transform?.rotation, 4);
  assert.equal(text.transform?.opacity, .94);
});

test('Phase 6 preserves uploaded font identity in canonical linked source', () => {
  const project = createVisualProject({
    id: 'project_phase6_font',
    width: 640,
    height: 360,
    now: '2026-09-21T00:00:00.000Z',
  });
  const text = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Custom font'),
      font: {
        size: 42,
        family: 'ApexifyCustom',
        name: 'ApexifyCustom',
        path: 'studio://asset/font_abc123',
      },
    }),
    { id: 'text_font', name: 'Custom Font' },
  );
  text.transform = {
    x: 80,
    y: 100,
    width: 420,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
  project.document.nodes[text.id] = text;
  project.document.rootNodeIds = [text.id];

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /family: "ApexifyCustom"/);
  assert.match(source, /path: "studio:\/\/asset\/font_abc123"/);

  const result = reconcileVisualProjectFromCode(
    createVisualProject({
      id: project.id,
      width: 640,
      height: 360,
      now: project.createdAt,
    }),
    source,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const node = result.project.document.nodes[result.project.document.rootNodeIds[0]];
  assert.equal(visualTextProps(node).font?.path, 'studio://asset/font_abc123');
});

test('Phase 6 validates text bounds curve and metrics options', () => {
  const project = createVisualProject({ width: 640, height: 360 });
  const text = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Broken'),
      font: { size: 0, family: 'Arial' },
      layout: { lineHeight: 0, maxWidth: -1 },
      textOnCurve: { sweepAngle: 400, radius: 0, layoutMode: 'clamp' },
      measurementCanvas: { width: 0, height: 1.2 },
    }),
    { id: 'text_invalid' },
  );
  text.transform = { x: 0, y: 0, width: 100, height: 80 };
  project.document.nodes[text.id] = text;
  project.document.rootNodeIds = [text.id];

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  for (const code of [
    'text-font-size',
    'text-line-height',
    'text-layout-bound',
    'text-curve-sweep',
    'text-curve-radius',
    'text-measurement-canvas',
  ]) {
    assert.ok(
      validation.issues.some((issue) => issue.code === code),
      'missing validation issue ' + code,
    );
  }
});

test('Phase 6 classifies every pinned TextProperties field', () => {
  assert.deepEqual(Object.keys(TEXT_AUTHORING_CLASSIFICATION).sort(), [
    'bold','color','decorations','effects','fill','font',
    'fontFamily','fontName','fontPath','fontSize','glow','gradient','highlight',
    'includeCharMetrics','italic','layout','letterSpacing','lineHeight',
    'createOptions','isBold','outlined','scaleX','scaleY','skewX','skewY',
    'maxHeight','maxWidth','measurementCanvas','opacity','overline','painterOpts','studioFrameFit',
    'placement','rotation','shadow','strikethrough','stroke','text','textAlign',
    'textBaseline','textOnCurve','underline','wordSpacing',
  ].sort());

  for (const entry of Object.values(TEXT_AUTHORING_CLASSIFICATION)) {
    assert.ok(
      ['Transform','Style','Effects','Data','Advanced','Metrics'].includes(entry.surface),
    );
    assert.ok(
      ['canonical-literal','font-asset','legacy-normalized'].includes(entry.reverse),
    );
  }
});

test('Phase 6 permanent shell exposes the dedicated text authoring workflow', () => {
  const shell = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );
  const inspector = fs.readFileSync(
    'components/studio/visual/VisualTextInspector.tsx',
    'utf8',
  );

  for (const contract of [
    'data-visual-text-context',
    'data-text-insert',
    'data-inline-text-editor',
    '<VisualTextInspector',
    '<VisualTextBatchInspector',
  ]) {
    assert.ok(shell.includes(contract), 'missing Phase 6 shell contract: ' + contract);
  }

  for (const contract of [
    'data-text-content-editor',
    'data-text-gradient-editor',
    'measureVisualTextInBrowser',
    'Typography',
    'Layout',
    'Text on curve',
    'Runtime contract',
    'Legacy TextProperties aliases',
    'createText(textPropertiesOrArray, canvasBuffer, createTextOptions?, painterOpts?)',
    'CreateTextOptions',
    'Two transformation scopes',
    'Resolve asset references',
    'createText([...])',
  ]) {
    assert.ok(inspector.includes(contract), 'missing rebuilt text inspector contract: ' + contract);
  }

  const advanced = fs.readFileSync('components/studio/visual/VisualTextAdvancedEditors.tsx','utf8');
  for(const required of ['Group perspective','Isolated grouped rendering','Translate X','Blend mode','nearest','bicubic']){
    assert.ok(advanced.includes(required),'missing advanced text control: '+required);
  }
});


test('Phase 6 lowers a text batch to one two-argument createText array call', () => {
  const project = createVisualProject({
    id: 'project_phase6_batch',
    width: 640,
    height: 360,
    now: '2026-09-21T00:00:00.000Z',
  });

  const group = createVisualNode(
    'group',
    textBatchGroupPropsRecord({ textBatch: true }),
    { id: 'text_batch', name: 'Text batch (2)' },
  );
  const first = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('First')),
    { id: 'text_first', name: 'First' },
  );
  const second = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Second'),
      decorations: { bold: true, italic: true },
      fill: { color: '#22d3ee', opacity: 0.8 },
    }),
    { id: 'text_second', name: 'Second' },
  );
  first.parentId = group.id;
  second.parentId = group.id;
  first.transform = { x: 30, y: 40, width: 220, height: 80 };
  second.transform = { x: 60, y: 120, width: 260, height: 90 };
  group.childIds = [first.id, second.id];

  project.document.nodes[group.id] = group;
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [group.id];

  const plan = lowerVisualProject(project);
  const textOps = plan.operations.filter((operation) => operation.kind === 'create-text');
  assert.equal(textOps.length, 1);
  const operation = textOps[0];
  assert.equal(operation.kind, 'create-text');
  if (operation.kind !== 'create-text') return;
  assert.equal(Array.isArray(operation.properties), true);
  if (!Array.isArray(operation.properties)) return;
  assert.equal(operation.properties.length, 2);
  assert.equal(operation.properties[0]?.text, 'First');
  assert.equal(operation.properties[1]?.text, 'Second');
  assert.equal('options' in operation, false);
  assert.equal('painterOpts' in operation, false);

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /\.createText\(\s*\[/);
  assert.doesNotMatch(source, /createText\([\s\S]*isGrouped/);
  assert.doesNotMatch(source, /createText\([\s\S]*resolveAssetRefs/);

  const empty = createVisualProject({
    id: project.id,
    width: 640,
    height: 360,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const root = result.project.document.nodes[result.project.document.rootNodeIds[0]];
  assert.equal(root.kind, 'group');
  assert.equal(visualTextBatchGroupProps(root)?.textBatch, true);
  assert.equal(root.childIds?.length, 2);
  assert.equal(
    root.childIds?.map((id) => visualTextProps(result.project.document.nodes[id]).text).join('|'),
    'First|Second',
  );
});

test('Phase 6 reverse sync owns the public createText painterOpts argument', () => {
  const project = createVisualProject({
    id: 'project_phase6_painter_opts',
    width: 320,
    height: 200,
    now: '2026-09-21T00:00:00.000Z',
  });
  const source = [
    "import { ApexPainter } from 'apexify.js';",
    "const painter = new ApexPainter();",
    "const canvas = await painter.createCanvas({ width: 320, height: 200 });",
    "const text = await painter.createText({ text: 'Refs', x: 10, y: 20 }, canvas.buffer, { resolveAssetRefs: true });",
  ].join('\n');
  const result = reconcileVisualProjectFromCode(project, source);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;
  const node = result.project.document.nodes[result.project.document.rootNodeIds[0]!];
  assert.deepEqual(visualTextProps(node).painterOpts, { resolveAssetRefs: true });
  const regenerated = generateVisualProjectCode(result.project).source;
  assert.match(regenerated, /createText\([\s\S]*resolveAssetRefs: true/);
});

test('Phase 6 reverse sync accepts public grouped createText options', () => {
  const project = createVisualProject({
    id: 'project_phase6_invalid_call',
    width: 320,
    height: 200,
    now: '2026-09-21T00:00:00.000Z',
  });
  const source = [
    "import { ApexPainter } from 'apexify.js';",
    "const painter = new ApexPainter();",
    "const canvas = await painter.createCanvas({ width: 320, height: 200 });",
    "const text = await painter.createText({ text: 'Wrong', x: 10, y: 20 }, canvas.buffer, { isGrouped: true });",
  ].join('\n');
  const result = reconcileVisualProjectFromCode(project, source);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;
  const node = result.project.document.nodes[result.project.document.rootNodeIds[0]!];
  assert.equal(visualTextProps(node).createOptions?.isGrouped, true);
  assert.match(generateVisualProjectCode(result.project).source, /isGrouped: true/);
});


test('Phase 3 advanced createText exposes grouped options, per-text perspective and four-argument round trip', () => {
  const project = createVisualProject({
    id:'text_advanced_test',name:'Advanced',width:640,height:420,now:'2026-10-11T00:00:00.000Z'
  });
  const pointQuad: [{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}] = [
    {x:45,y:40},{x:440,y:52},{x:420,y:255},{x:55,y:245}
  ];
  const one=createVisualNode('text',textPropsRecord({
    text:'Advanced',font:{size:32,weight:700,style:'oblique'},
    placement:{scaleX:1.2,scaleY:.9,skewX:9,skewY:-3,perspective:{points:pointQuad,interpolation:'bicubic',edgeMode:'mirror'}},
    fill:{gradient:{type:'radial',startX:0,startY:0,endX:200,endY:100,startRadius:0,endRadius:150,repeat:'reflect',colors:[{stop:0,color:'#ffffff'},{stop:1,color:'#3300aa'}]}},
    stroke:{color:'#000000',style:'double',width:2},isBold:true,outlined:true,
  }),{id:'text_a'});
  const two=createVisualNode('text',textPropsRecord({
    text:'Grouped',font:{size:42,weight:'bolder'},effects:{glow:{intensity:8,opacity:.4}},textOnCurve:{sweepAngle:120,layoutMode:'fit'}
  }),{id:'text_b'});
  one.parentId='text_group';two.parentId='text_group';
  const group=createVisualNode('group',textBatchGroupPropsRecord({textBatch:true,
    createOptions:{isGrouped:true,groupTransform:{translateX:12,translateY:4,rotation:8,scaleX:1.1,scaleY:.8,skewX:4,skewY:-2,pivotX:200,pivotY:150,opacity:.7,blendMode:'screen',perspective:{points:pointQuad,interpolation:'nearest',edgeMode:'clamp'}}},
    painterOpts:{resolveAssetRefs:true}
  }),{id:'text_group'});
  group.childIds=[one.id,two.id];
  project.document.nodes[one.id]=one;project.document.nodes[two.id]=two;project.document.nodes[group.id]=group;
  project.document.rootNodeIds=[group.id];
  const validation=validateVisualProject(project);
  assert.equal(validation.ok,true,JSON.stringify(validation.issues));
  const plan=lowerVisualProject(project);
  const operation=plan.operations.find(x=>x.kind==='create-text');
  assert.ok(operation && operation.kind==='create-text');
  if(!operation||operation.kind!=='create-text')return;
  assert.equal(operation.options?.groupTransform?.blendMode,'screen');
  assert.equal(operation.painterOpts?.resolveAssetRefs,true);
  assert.equal(Array.isArray(operation.properties),true);
  if(!Array.isArray(operation.properties))return;
  assert.equal(operation.properties[0]?.font?.weight,700);
  assert.equal(operation.properties[0]?.placement?.perspective?.edgeMode,'mirror');
  assert.equal(operation.properties[0]?.isBold,true);
  assert.equal(operation.properties[0]?.outlined,true);
  const source=generateVisualProjectCode(project).source;
  assert.match(source,/groupTransform:/);
  assert.match(source,/painterOpts|resolveAssetRefs: true/);
  assert.match(source,/blendMode: "screen"/);
  assert.match(source,/interpolation: "bicubic"/);
  const rebuilt=reconcileVisualProjectFromCode(project,source);
  assert.equal(rebuilt.ok,true,rebuilt.ok?undefined:rebuilt.error);
  if(!rebuilt.ok)return;
  const nextGroup=rebuilt.project.document.nodes[rebuilt.project.document.rootNodeIds[0]!];
  assert.equal(visualTextBatchGroupProps(nextGroup)?.createOptions?.groupTransform?.opacity,.7);
  assert.equal(generateVisualProjectCode(rebuilt.project).source,source);
});

test('Phase 3 advanced invalid font, perspective, skew and group transform fail validation',()=>{
  const project=createVisualProject({id:'text_advanced_bad',width:600,height:400,now:'2026-10-11T00:00:00.000Z'});
  const text=createVisualNode('text',textPropsRecord({
    text:'Unsafe',font:{size:24,weight:950,style:'normal'},
    placement:{skewX:90,perspective:{points:[{x:0,y:0}] as never,interpolation:'none' as never,edgeMode:'bad' as never}}
  }),{id:'bad_text'});
  const sibling=createVisualNode('text',textPropsRecord({text:'Sibling'}),{id:'sibling'});
  text.parentId='bad_group';sibling.parentId='bad_group';
  const group=createVisualNode('group',textBatchGroupPropsRecord({
    textBatch:true,createOptions:{isGrouped:true,groupTransform:{skewY:-90,opacity:3,blendMode:'unknown' as never}}
  }),{id:'bad_group'});
  group.childIds=[text.id,sibling.id];
  project.document.nodes[text.id]=text;project.document.nodes[sibling.id]=sibling;project.document.nodes[group.id]=group;
  project.document.rootNodeIds=[group.id];
  const {issues,ok}=validateVisualProject(project);
  assert.equal(ok,false);
  for(const code of ['text-font-weight','text-perspective-points','text-perspective-interpolation','text-perspective-edge','text-skew-range','text-group-blend-mode']){
    assert.ok(issues.some(issue=>issue.code===code),'missing safety gate '+code);
  }
});
test('Phase 3 MD reference enumerates the full createText control family', () => {
  const inspector = fs.readFileSync('components/studio/visual/VisualTextInspector.tsx', 'utf8');
  const advanced = fs.readFileSync('components/studio/visual/VisualTextAdvancedEditors.tsx', 'utf8');
  for (const [name, sample] of [
    ['font aliases / upload', 'Font registry'],
    ['font weight / style', 'data-text-advanced-weight'],
    ['solid, linear, radial and conic fills', "['linear', 'radial', 'conic']"],
    ['gradient rotation', 'label="Rotate"'],
    ['gradient pivots', 'label="Pivot X"'],
    ['gradient repeat', "['no-repeat', 'repeat', 'reflect']"],
    ['styled decorations', 'Styled line decoration'],
    ['highlight', 'title="Highlight"'],
    ['glow', 'title="Glow"'],
    ['shadow', 'title="Shadow"'],
    ['stroke and gradient', 'Stroke gradient'],
    ['text layout', 'title="Layout"'],
    ['alignment', 'title="Alignment"'],
    ['baseline', 'label="Baseline"'],
    ['circular curved text', 'title="Text on curve"'],
    ['text measurement', 'title="measureText()"'],
    ['per-text scale and skew', 'data-text-perspective'],
    ['legacy compatibility', 'title="Legacy flags"'],
    ['grouped rendering', 'title="CreateTextOptions"'],
  ] as const) {
    assert.ok((inspector + advanced).includes(sample), 'Missing MD createText inspector cohort: ' + name);
  }
  for (const [name, sample] of [
    ['group pivot', "'pivotX'"],
    ['group translation', "'translateX'"],
    ['group scaling', "'scaleX'"],
    ['group skew', "'skewX'"],
    ['group opacity', "'opacity'"],
    ['group blend modes', 'TEXT_BLEND_MODES'],
    ['group perspective', 'Group perspective'],
    ['corner order', 'Top left'],
    ['perspective interpolation', "'bicubic'"],
    ['perspective edge mode', "'mirror'"],
  ] as const) {
    assert.ok(advanced.includes(sample), 'Missing MD createText group control: ' + name);
  }
});

test('Phase 3 MD createText option variants preserve compilation, code and reverse-sync', () => {
  const { TEXT_BLEND_MODES } = require('../../../lib/studio/visual/text-contract') as typeof import('../../../lib/studio/visual/text-contract');
  const quad = [
    {x:20,y:20},{x:350,y:25},{x:340,y:190},{x:30,y:185}
  ] as const;
  const gradientStops = [{stop:0,color:'#112233'},{stop:1,color:'#ddeeff'}];
  const linear = {type:'linear' as const,startX:0,startY:0,endX:300,endY:80,rotate:20,pivotX:100,pivotY:50,repeat:'reflect' as const,colors:gradientStops};
  const radial = {type:'radial' as const,startX:30,startY:20,startRadius:5,endX:200,endY:140,endRadius:120,rotate:12,pivotX:60,pivotY:45,repeat:'repeat' as const,colors:gradientStops};
  const conic = {type:'conic' as const,centerX:140,centerY:65,startAngle:20,rotate:5,pivotX:50,pivotY:70,colors:gradientStops};
  const variants: Array<[string, import('../../../lib/studio/visual/model').VisualTextNodeProps]> = [
    ['font numeric weight and oblique', {text:'Alpha',font:{size:33,family:'Arial',weight:700,style:'oblique'}}],
    ...(['normal','bold','bolder','lighter'] as const).map(weight=>['named font weight '+weight,{text:'Alpha',font:{size:24,weight}}] as [string,import('../../../lib/studio/visual/model').VisualTextNodeProps]),
    ...(['normal','italic','oblique'] as const).map(style=>['font style '+style,{text:'Alpha',font:{size:25,style}}] as [string,import('../../../lib/studio/visual/model').VisualTextNodeProps]),
    ['font registration metadata', {text:'Alpha',font:{size:25,name:'RegisteredFont',path:'/fixtures/registered.ttf',family:'RegisteredFont'}}],
    ['solid fill and opacity', {text:'Alpha',fill:{color:'#ffffff',opacity:0.4}}],
    ['linear gradient geometry rotation pivots and repeat', {text:'Alpha',fill:{gradient:linear}}],
    ['radial gradient geometry radius pivots and repeat', {text:'Alpha',fill:{gradient:radial}}],
    ['conic gradient center angle rotation and pivots', {text:'Alpha',fill:{gradient:conic}}],
    ['underline styled gradient', {text:'Alpha',decorations:{underline:{color:'#aabbcc',width:2,gradient:linear}}}],
    ['overline styled gradient', {text:'Alpha',decorations:{overline:{color:'#aabbcc',width:1,gradient:radial}}}],
    ['strikethrough styled gradient', {text:'Alpha',decorations:{strikethrough:{color:'#aabbcc',width:1,gradient:conic}}}],
    ['bold italic decoration flags', {text:'Alpha',decorations:{bold:true,italic:true}}],
    ['highlight', {text:'Alpha',effects:{highlight:{color:'#0000ff',opacity:.3,gradient:linear}}}],
    ['glow', {text:'Alpha',effects:{glow:{color:'#112233',intensity:7,opacity:.7,gradient:radial}}}],
    ['shadow', {text:'Alpha',effects:{shadow:{color:'#112233',offsetX:4,offsetY:-2,blur:8,opacity:.55,gradient:conic}}}],
    ...(['solid','dashed','dotted','groove','ridge','double'] as const).map(style=>['stroke '+style,{text:'Alpha',stroke:{style,color:'#101010',width:2,opacity:.65,gradient:linear}}] as [string,import('../../../lib/studio/visual/model').VisualTextNodeProps]),
    ['layout wrapping spacing', {text:'Longwordwithoutbreak unicode 👩‍💻\nsecond line',layout:{lineHeight:1.5,letterSpacing:2,wordSpacing:3,maxWidth:210,maxHeight:175}}],
    ...(['left','center','right','start','end'] as const).map(textAlign=>['align '+textAlign,{text:'Alpha',placement:{textAlign}}] as [string,import('../../../lib/studio/visual/model').VisualTextNodeProps]),
    ...(['top','middle','alphabetic','bottom','hanging','ideographic'] as const).map(textBaseline=>['baseline '+textBaseline,{text:'Alpha',placement:{textBaseline}}] as [string,import('../../../lib/studio/visual/model').VisualTextNodeProps]),
    ['rotation scaling and skew both axes', {text:'Alpha',placement:{rotation:25,scaleX:1.25,scaleY:.8,skewX:9,skewY:-6}}],
    ...(['nearest','bilinear','bicubic'] as const).flatMap(interpolation=>(['transparent','clamp','wrap','mirror'] as const).map(edgeMode=>['text perspective '+interpolation+' '+edgeMode,{text:'Alpha',placement:{perspective:{points:quad.map(p=>({...p})) as never,interpolation,edgeMode}}}] as [string,import('../../../lib/studio/visual/model').VisualTextNodeProps])),
    ...(['fit','clamp','override'] as const).map(layoutMode=>['curve '+layoutMode,{text:'Curved\nlongwordwithoutbreak 👩‍💻',textOnCurve:{sweepAngle:200,radius:120,up:true,layoutMode,baselineOffset:3,startAngleDeg:15},layout:{maxWidth:190,lineHeight:1.2}}] as [string,import('../../../lib/studio/visual/model').VisualTextNodeProps]),
    ['single isolated group', {text:'Alpha',createOptions:{isGrouped:true,groupTransform:{rotation:8,translateX:5,translateY:6,scaleX:1.1,scaleY:.9,skewX:3,skewY:-3,pivotX:110,pivotY:90,opacity:.8,blendMode:'screen',perspective:{points:quad.map(p=>({...p})) as never,interpolation:'bicubic',edgeMode:'clamp'}}}}],
    ['asset resolution', {text:'Alpha',painterOpts:{resolveAssetRefs:true}}],
    ['legacy isBold and outlined', {text:'Alpha',isBold:true,outlined:true}],
    ['measurement / characters', {text:'Alpha 👨‍👩‍👧‍👦',includeCharMetrics:true,measurementCanvas:{width:480,height:300}}],
  ];
  for (let i=0;i<variants.length;i++) {
    const [label,props]=variants[i];
    const project=createVisualProject({id:'md_create_text_'+i,name:label,width:640,height:420,now:'2026-10-11T00:00:00.000Z'});
    const node=createVisualNode('text',textPropsRecord(props),{id:'text_md_'+i,name:label});
    project.document.nodes[node.id]=node;project.document.rootNodeIds=[node.id];
    const check=validateVisualProject(project);
    assert.equal(check.ok,true,label+': '+JSON.stringify(check.issues));
    const operations=lowerVisualProject(project).operations;
    const lowered = operations.find(op=>op.kind==='create-text');
    assert.ok(lowered && lowered.kind==='create-text',label+' missing create-text operation');
    if(lowered && lowered.kind==='create-text' && !Array.isArray(lowered.properties)) {
      for(const [key,value] of Object.entries(props)){
        if(key==='painterOpts'){
          assert.deepEqual(lowered.painterOpts,value,label+' lost painterOpts');
        }else if(key==='createOptions'){
          assert.deepEqual(lowered.options,value,label+' lost CreateTextOptions');
        }else{
          assert.deepEqual((lowered.properties as unknown as Record<string,unknown>)[key],value,label+' lost '+key);
        }
      }
    }
    const code=generateVisualProjectCode(project).source;
    const synced=reconcileVisualProjectFromCode(project,code);
    assert.equal(synced.ok,true,label+': '+(synced.ok?'':synced.error));
    if(synced.ok)assert.equal(generateVisualProjectCode(synced.project).source,code,label+': unstable Visual -> Code -> Visual');
  }
  assert.ok(variants.length>=55,'MD option matrix coverage unexpectedly shrank');
  for (const blendMode of TEXT_BLEND_MODES) {
    const p=createVisualProject({id:'blend_'+blendMode,name:'blend',width:640,height:420,now:'2026-10-11T00:00:00.000Z'});
    const a=createVisualNode('text',textPropsRecord({text:'A'}),{id:'a'});
    const b=createVisualNode('text',textPropsRecord({text:'B'}),{id:'b'});
    const g=createVisualNode('group',textBatchGroupPropsRecord({textBatch:true,createOptions:{isGrouped:true,groupTransform:{blendMode,opacity:.6}}}),{id:'g'});
    a.parentId='g';b.parentId='g';g.childIds=['a','b'];p.document.nodes.a=a;p.document.nodes.b=b;p.document.nodes.g=g;p.document.rootNodeIds=['g'];
    const v=validateVisualProject(p);
    assert.equal(v.ok,true,blendMode+': '+JSON.stringify(v.issues));
    const ops=lowerVisualProject(p).operations;
    const op=ops.find(x=>x.kind==='create-text');
    assert.ok(op&&op.kind==='create-text',blendMode+' operation missing');
    if(op&&op.kind==='create-text')assert.equal(op.options?.groupTransform?.blendMode,blendMode);
    const source=generateVisualProjectCode(p).source;
    const synced=reconcileVisualProjectFromCode(p,source);
    assert.equal(synced.ok,true,blendMode+': '+(synced.ok?'':synced.error));
    if(synced.ok)assert.equal(generateVisualProjectCode(synced.project).source,source,blendMode+': unstable round-trip');
  }
});

test('Text content can grow beyond its initial selection frame unless explicitly height-limited', () => {
  const project = phase6Project();
  const textNode = Object.values(project.document.nodes).find(node => node.kind === 'text');
  assert.ok(textNode);
  textNode.transform = {...textNode.transform, height: 72};
  const props = visualTextProps(textNode);
  textNode.props = textPropsRecord({...props, layout:{...props.layout,maxHeight:undefined}, text:'One long line that should wrap.\nTwo lines.\nThree lines.\nFour lines.\nFive lines.'});
  const first=lowerVisualProject(project).operations.find(x=>x.kind==='create-text');
  assert.ok(first && first.kind==='create-text');
  assert.equal(first.properties && !Array.isArray(first.properties) ? first.properties.layout?.maxHeight : undefined,undefined,'Implicit editor frame clipped multiline text');
  textNode.props=textPropsRecord({...visualTextProps(textNode),layout:{...visualTextProps(textNode).layout,maxHeight:240}});
  const bounded=lowerVisualProject(project).operations.find(x=>x.kind==='create-text');
  assert.ok(bounded && bounded.kind==='create-text');
  assert.equal(bounded.properties && !Array.isArray(bounded.properties) ? bounded.properties.layout?.maxHeight : undefined,240,'User-defined text height bound was ignored');
});

test('Text UI has a single insert action, constrained weight options and exclusive paint mode controls',()=>{
  const shell=fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx','utf8');
  const inspector=fs.readFileSync('components/studio/visual/VisualTextInspector.tsx','utf8');
  const textLibrary=shell.slice(shell.indexOf("if (activeTool === 'text') {"),shell.indexOf("if (activeTool === 'shapes') {"));
  assert.equal((textLibrary.match(/data-text-insert/g)||[]).length,1);
  assert.match(textLibrary,/data-text-preset-picker/);
  assert.doesNotMatch(textLibrary,/data-font-asset-insert|data-text-font-family/);
  assert.match(inspector,/data-text-style=\{kind\}/);
  assert.match(inspector,/data-text-advanced-weight/);
  assert.match(inspector,/options=\{\['normal','bold','bolder','lighter','100'/);
  assert.match(inspector,/data-text-paint-mode=\{gradient \? 'gradient' : 'solid'\}/);
  assert.match(inspector,/!gradient \? \(/);
  assert.match(inspector,/!props\.stroke\.gradient \?/);
  assert.match(inspector,/!styled\.gradient \?/);
});

test('Clearing text content during editing never invalidates the whole Visual project', () => {
  const project=phase6Project();
  const text=Object.values(project.document.nodes).find(node=>node.kind==='text');
  assert.ok(text);
  text.props=textPropsRecord({...visualTextProps(text),text:''});
  const check=validateVisualProject(project);
  assert.equal(check.ok,true,JSON.stringify(check.issues));
  const op=lowerVisualProject(project).operations.find(x=>x.kind==='create-text');
  assert.ok(op&&op.kind==='create-text');
  if(!op||op.kind!=='create-text'||Array.isArray(op.properties)) return;
  assert.equal(op.properties.text,' ');
  assert.equal(visualTextProps(text).text,'','Authoring value must remain empty');
});
