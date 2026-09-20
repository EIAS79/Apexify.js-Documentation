import type { GalleryCardBase, GalleryLens } from '../core/galleryTypes';

export type PeakLabGalleryCard = GalleryCardBase & {
  category: 'advance';
  primaryLens: GalleryLens;
  lenses: GalleryLens[];
  peakLab: true;
  sourceCategory: string;
  sourceFile: string;
  code: { js: string };
};

type PeakLabDefinition = {
  id: string;
  title: string;
  description: string;
  sourceCategory: string;
  sourceFile: string;
  primaryLens: GalleryLens;
  lenses: GalleryLens[];
  featured: boolean;
  colors: [string, string, string];
  variant: number;
  source: string;
};

function previewSvg(def: PeakLabDefinition): string {
  const escape = (value: string) =>
    value.replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch] ?? ch));
  const [a, b, c] = def.colors;
  const motif = [
    '<g opacity=".88"><rect x="76" y="100" width="1048" height="546" rx="34" fill="rgba(255,255,255,.045)" stroke="rgba(255,255,255,.14)"/><g stroke="'+c+'" opacity=".5">'+Array.from({length:10},(_,i)=>'<path d="M90 '+(180+i*38)+' C 310 '+(90+i*31)+' 610 '+(270-i*8)+' 1110 '+(130+i*40)+'" fill="none" stroke-width="'+(i%3===0?3:1)+'"/>').join('')+'</g></g>',
    '<g><circle cx="815" cy="348" r="238" fill="'+c+'" opacity=".22"/><circle cx="815" cy="348" r="158" fill="none" stroke="'+c+'" stroke-width="22" opacity=".68"/><rect x="92" y="152" width="510" height="410" rx="28" fill="rgba(255,255,255,.06)"/></g>',
    '<g><rect x="82" y="130" width="1010" height="470" rx="28" fill="rgba(255,255,255,.055)"/>'+Array.from({length:8},(_,i)=>'<rect x="'+(130+i*108)+'" y="'+(510-(i%5)*58)+'" width="62" height="'+(80+(i%5)*58)+'" rx="12" fill="'+(i%2?b:c)+'" opacity=".72"/>').join('')+'<polyline points="130,440 250,390 370,410 490,300 610,330 730,250 850,280 970,190" fill="none" stroke="'+c+'" stroke-width="6"/></g>',
    '<g><rect x="90" y="110" width="1020" height="530" rx="30" fill="rgba(255,255,255,.045)"/><text x="120" y="385" font-family="Arial" font-size="128" font-weight="800" fill="white" opacity=".9">PEAK</text><circle cx="930" cy="278" r="130" fill="'+c+'" opacity=".6"/></g>'
  ][def.variant % 4];
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset=".55" stop-color="'+b+'"/><stop offset="1" stop-color="'+a+'"/></linearGradient></defs>' +
    '<rect width="1200" height="760" fill="url(#g)"/>' + motif +
    '<rect x="42" y="38" width="205" height="38" rx="19" fill="rgba(0,0,0,.34)" stroke="rgba(255,255,255,.18)"/>' +
    '<text x="145" y="63" text-anchor="middle" font-size="14" font-family="monospace" fill="white" font-weight="700">PEAK LAB / '+escape(def.sourceCategory.toUpperCase())+'</text>' +
    '<text x="58" y="694" font-size="34" font-family="Arial" fill="white" font-weight="700">'+escape(def.title.replace(/^Peak Lab \d+ · /, ''))+'</text>' +
    '<text x="58" y="730" font-size="15" font-family="monospace" fill="rgba(255,255,255,.7)">'+escape(def.sourceFile)+'</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

const definitions: PeakLabDefinition[] = [
  {
    "id": "peak-lab-01-canvas",
    "title": "Peak Lab 01 · Chromatic architecture",
    "description": "A material library built from layered backgrounds, all procedural patterns, three gradient families, noise and compositing. **Peak Lab project recipe:** this source is shown verbatim from `examples/01-canvas.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Canvas",
    "sourceFile": "examples/01-canvas.mjs",
    "primaryLens": "surface",
    "lenses": [
      "surface",
      "image"
    ],
    "featured": true,
    "colors": [
      "#07111f",
      "#103f4a",
      "#36d9b4"
    ],
    "variant": 0,
    "source": "import {p,C,txt,font,images,rect,textLayer,linear,radial,conic,scene,save,heading} from '../shared/studio.mjs';\nexport const meta={id:'01',title:'Chromatic architecture',category:'Canvas',description:'A material library built from layered backgrounds, all procedural patterns, three gradient families, noise and compositing.'};\nexport async function run(){\n  const names=['grid','dots','diagonal','stripes','waves','crosses','hexagons','checkerboard','diamonds','triangles','stars','polka'];\n  const layers=heading('01 / CREATE CANVAS','Chromatic architecture','Twelve procedural surfaces. A single coordinated material system.');\n  for(let i=0;i<12;i++){\n    const w=304,h=186,x=64+(i%4)*336,y=244+Math.floor(i/4)*264;\n    const gradient=[linear([C.red,C.gold]),radial(['#e8ffca',C.teal,'#167b70']),conic([C.violet,C.blue,C.red,C.violet])][i%3];\n    const tile=await p.createCanvas({width:w,height:h,borderRadius:18,transparentBase:true,bgLayers:[\n      {type:'gradient',value:gradient},\n      {type:'presetPattern',pattern:{type:names[i],size:14,spacing:28,rotation:i*7,color:'#112d35',secondaryColor:'#faf0d4',opacity:.55},blendMode:'soft-light'},\n      {type:'noise',intensity:.08,blendMode:'soft-light'}\n    ]});\n    layers.push({type:'imageBuffer',buffer:tile.buffer,x,y},textLayer(txt(String(i+1).padStart(2,'0'),x,y+h+17,15,C.red,{font:font(15,'mono')}),txt(names[i].toUpperCase(),x+38,y+h+16,17,C.ink)));\n  }\n  return [await save('01-canvas.png',await scene(1440,1060,layers))];\n}\n"
  },
  {
    "id": "peak-lab-02-image",
    "title": "Peak Lab 02 · Solar studies",
    "description": "A layered editorial cover: procedural source image, cover crops, local clipping, grouped transformations, screen blending and rim shadows. **Peak Lab project recipe:** this source is shown verbatim from `examples/02-image.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Image",
    "sourceFile": "examples/02-image.mjs",
    "primaryLens": "image",
    "lenses": [
      "image"
    ],
    "featured": false,
    "colors": [
      "#16121f",
      "#5e183e",
      "#f1ba63"
    ],
    "variant": 1,
    "source": "import {p,C,txt,font,rect,circle,linear,radial,plate,save} from '../shared/studio.mjs';\nexport const meta={id:'02',title:'Solar studies',category:'Image',description:'A layered editorial cover: procedural source image, cover crops, local clipping, grouped transformations, screen blending and rim shadows.'};\nexport async function run(){\n  const W=1200,H=1500,source=await plate(1100,1000);\n  let art=await p.createCanvas({width:W,height:H,colorBg:C.paper});\n  art=await p.createImage([\n    {source,x:60,y:190,width:1080,height:1040,fit:'cover',borderRadius:260,shadow:{color:'#252430',blur:42,offsetY:20,opacity:.2}},\n    rect(60,1070,1080,160,'#fce7cb',{blendMode:'screen',opacity:.75}),\n    circle(630,690,245,'#eff5e7',{shape:{gradient:radial(['#fff9dd','#ffc369','#e35c48','#5e183e'])},shadow:{color:'#f6b468',blur:35,opacity:.35}}),\n    {source:'arc',x:319,y:379,width:622,height:622,shape:{fill:false,startAngle:.12,endAngle:5.7},rotation:-24,stroke:{color:'#f5e5c4',width:3}},\n    circle(920,992,23,C.teal,{shadow:{color:C.teal,blur:25}}),\n    rect(85,235,4,265,C.paper)\n  ],art);\n  // All pieces in this group rotate around a shared pivot rather than individually.\n  art=await p.createImage(Array.from({length:8},(_,i)=>rect(102+i*34,1130,15,120+i*4,C.red)),art,{isGrouped:true,groupTransform:{rotation:-12,pivotX:230,pivotY:1160,opacity:.8}});\n  art=await p.createText([\n    txt('FORM / LIGHT / MATTER',64,62,19,C.ink,{font:font(19,'mono'),layout:{letterSpacing:3}}),\n    txt('SOLAR',92,276,146,C.paper,{font:font(146,'bold'),layout:{letterSpacing:-7}}),\n    txt('STUDIES',90,410,114,C.paper,{font:font(114,'bold'),layout:{letterSpacing:-5}}),\n    txt('A study in procedural light.',64,1294,43,C.ink,{font:font(43,'serif')}),\n    txt('APEXIFY.JS   /   VOLUME 02',64,1410,17,C.ink,{font:font(17,'mono')}),\n    txt('NO PHOTOGRAPHS\\nONLY CODE.',865,1330,18,C.ink,{layout:{lineHeight:1.5}})\n  ],art);\n  return [await save('02-image.png',art)];\n}\n"
  },
  {
    "id": "peak-lab-03-text",
    "title": "Peak Lab 03 · Type as architecture",
    "description": "Measured typography, curved text, gradient fill, outline, spacing, rotated annotations, custom fonts and controlled wrapping. **Peak Lab project recipe:** this source is shown verbatim from `examples/03-text.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Text",
    "sourceFile": "examples/03-text.mjs",
    "primaryLens": "typography",
    "lenses": [
      "typography"
    ],
    "featured": false,
    "colors": [
      "#0d1725",
      "#173f47",
      "#5088ff"
    ],
    "variant": 2,
    "source": "import {p,C,txt,font,images,rect,circle,line,linear,scene,save,json} from '../shared/studio.mjs';\nexport const meta={id:'03',title:'Type as architecture',category:'Text',description:'Measured typography, curved text, gradient fill, outline, spacing, rotated annotations, custom fonts and controlled wrapping.'};\nexport async function run(){\n  const title=txt('AFTER',64,180,213,C.paper,{font:font(213,'bold'),layout:{letterSpacing:-12}});\n  const metrics=await p.measureText({...title,includeCharMetrics:true});\n  let art=await scene(1200,1440,[\n    images(rect(0,0,1200,1440,C.night),rect(0,565,1200,12,C.red)),\n    ...Array.from({length:13},(_,i)=>line([[60+i*90,110],[60+i*90,1210]],'#ffffff',1,{opacity:.055})),\n    line([[64,176],[64+metrics.width,176]],C.teal,2),\n    line([[64,385],[64+metrics.width,385]],C.teal,1,{opacity:.4}),\n    images(circle(932,845,128,C.red,{shape:{fill:false},stroke:{color:C.red,width:2}}))\n  ]);\n  art=await p.createText([\n    txt('03 / TYPOGRAPHIC SYSTEMS',64,56,18,C.teal,{font:font(18,'mono'),layout:{letterSpacing:2}}),title,\n    txt('LIGHT',58,365,227,C.red,{font:font(227,'bold'),fill:{gradient:linear([C.red,C.gold])},layout:{letterSpacing:-12},stroke:{color:'#f7c79a',width:1}}),\n    txt('The space between\\nwhat is seen\\nand what is felt.',65,704,61,C.paper,{font:font(61,'serif'),layout:{lineHeight:1.28,maxWidth:760}}),\n    txt('MEASURED / SHAPED / RENDERED',932,703,15,C.paper,{font:font(15,'mono'),textOnCurve:{sweepAngle:310,radius:142,up:true,layoutMode:'clamp'}}),\n    txt('Aa',932,791,91,C.red,{font:font(91,'serif'),placement:{textAlign:'center',textBaseline:'top'}}),\n    txt('LET THE LETTERS BREATHE.',70,1060,19,C.teal,{layout:{letterSpacing:6},decorations:{underline:{color:C.red,width:3}}}),\n    txt('A typographic poster built with the same text renderer used by Apexify scenes, charts, templates and video overlays.',65,1173,24,'#a2afbb',{layout:{maxWidth:820,lineHeight:1.6}}),\n    txt(`MEASURED WIDTH  ${metrics.width.toFixed(2)} PX`,1140,1080,14,C.teal,{font:font(14,'mono'),placement:{rotation:-90}})\n  ],art);\n  return [await save('03-text.png',art),await json('03-text-metrics.json',metrics)];\n}\n"
  },
  {
    "id": "peak-lab-04-paths",
    "title": "Peak Lab 04 · A field of echoes",
    "description": "Parametric contour geometry, reusable Path2D, compound paths, gradient strokes and annotated curved connectors. **Peak Lab project recipe:** this source is shown verbatim from `examples/04-paths.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Paths",
    "sourceFile": "examples/04-paths.mjs",
    "primaryLens": "advanced",
    "lenses": [
      "advanced",
      "image"
    ],
    "featured": false,
    "colors": [
      "#101820",
      "#4d294e",
      "#ee593b"
    ],
    "variant": 3,
    "source": "import {p,C,txt,font,textLayer,images,circle,line,scene,save,heading,TAU,polar} from '../shared/studio.mjs';\nexport const meta={id:'04',title:'A field of echoes',category:'Paths',description:'Parametric contour geometry, reusable Path2D, compound paths, gradient strokes and annotated curved connectors.'};\nexport async function run(){\n  const layers=heading('04 / PARAMETRIC CARTOGRAPHY','A field of echoes','A synthetic terrain. Contours are computed from harmonic radial fields.');\n  for(let k=0;k<76;k++){\n    const r=35+k*5.5;\n    const pts=Array.from({length:241},(_,j)=>{const a=j/240*TAU;const d=r*(1+.12*Math.sin(3*a+k*.045)+.065*Math.cos(7*a-k*.025));return polar(760,680,d,a);});\n    layers.push(line(pts,k%6===0?C.red:'#325e62',k%6===0?2.2:.8,{opacity:k%6===0?.95:.55}));\n  }\n  layers.push(textLayer(txt('RESONANCE\\nINDEX 079',92,266,16,C.ink,{font:font(16,'mono'),layout:{lineHeight:1.5}}),txt('ECHO / 01',970,1020,30,C.ink,{font:font(30,'serif')})));\n  let art=await scene(1440,1160,layers);\n  const mark=p.path2d.create([{type:'circle',x:760,y:680,radius:27},{type:'circle',x:760,y:680,radius:9}]);\n  art=await p.path2d.draw(art,mark,{fill:{color:C.red,rule:'evenodd'},stroke:{color:C.ink,width:1}});\n  art=await p.path2d.custom([\n    {startCoordinates:{x:180,y:395},endCoordinates:{x:704,y:632},path:{type:'bezier',tension:.4},arrow:{end:true,size:12},markers:[{position:.35,shape:'diamond',size:7,color:C.red}],lineStyle:{width:1.5,color:C.ink,lineDash:{dashArray:[5,5]}}},\n    {startCoordinates:{x:1190,y:450},endCoordinates:{x:969,y:600},path:{type:'smooth'},arrow:{end:true},lineStyle:{width:1.5,color:C.red}}\n  ],art);\n  return [await save('04-paths.png',art)];\n}\n"
  },
  {
    "id": "peak-lab-05-pixels",
    "title": "Peak Lab 05 · Interference atlas",
    "description": "A deterministic field renderer writes RGBA data, applies a region processor, samples calibration pixels and makes a false-colour plate. **Peak Lab project recipe:** this source is shown verbatim from `examples/05-pixels.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Pixels",
    "sourceFile": "examples/05-pixels.mjs",
    "primaryLens": "image",
    "lenses": [
      "image",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#0f172a",
      "#1e3a5f",
      "#bda5ff"
    ],
    "variant": 4,
    "source": "import {p,C,txt,font,images,rect,textLayer,scene,save,json,heading} from '../shared/studio.mjs';\nexport const meta={id:'05',title:'Interference atlas',category:'Pixels',description:'A deterministic field renderer writes RGBA data, applies a region processor, samples calibration pixels and makes a false-colour plate.'};\nexport async function run(){\n  const w=900,h=640,base=await p.createCanvas({width:w,height:h,colorBg:'#000000'});\n  const pixels=await p.pixels.getData(base);\n  for(let y=0;y<h;y++)for(let x=0;x<w;x++){\n    const u=(x-w/2)/h,v=(y-h/2)/h;\n    const d1=Math.hypot(u+.21,v),d2=Math.hypot(u-.22,v-.1);\n    const f=Math.sin(d1*62)+Math.cos(d2*54)+Math.sin((u+v)*16);\n    const k=(Math.atan(f*1.8)/Math.PI+.5);\n    const index=(y*w+x)*4;\n    pixels.data[index]=Math.round(18+225*Math.pow(k,1.8));\n    pixels.data[index+1]=Math.round(20+190*Math.sin(k*Math.PI)*.8);\n    pixels.data[index+2]=Math.round(35+195*(1-k));pixels.data[index+3]=255;\n  }\n  const original=await p.pixels.setData(base,pixels);\n  let treated=await p.pixels.manipulate(original,{region:{x:0,y:0,width:w,height:h},processor:(r,g,b,a,x,y)=>{\n    const vignette=Math.max(.25,1-Math.hypot((x-w/2)/w,(y-h/2)/h)*.9);\n    return [r*vignette,g*vignette,b*vignette,a];\n  }});\n  treated=await p.pixels.setColor(treated,2,2,{r:255,g:255,b:255,a:255});\n  const sample=await p.pixels.getColor(treated,2,2);\n  const monochrome=await p.pixels.manipulate(original,{filter:'grayscale',intensity:1});\n  const layers=heading('05 / FIELD RESEARCH','Interference atlas','Two wave sources. Pixel-level synthesis. No external rendering engine.');\n  layers.push({type:'imageBuffer',buffer:treated,x:64,y:246,width:930,height:661},{type:'imageBuffer',buffer:monochrome,x:1022,y:246,width:354,height:252});\n  layers.push(textLayer(txt('CONSTRUCTIVE\\n& DESTRUCTIVE\\nINTERFERENCE',1022,532,20,C.ink,{font:font(20,'bold'),layout:{lineHeight:1.4}}),txt('FIELD 05\\n900 × 640 SAMPLES\\nRGBA / 8 BIT',1022,670,15,C.muted,{font:font(15,'mono'),layout:{lineHeight:1.6}})));\n  for(let i=0;i<20;i++)layers.push(images(rect(1022+i*17.7,825,18,48,`rgb(${18+i*11},${30+i*6},${230-i*9})`)));\n  return [await save('05-pixels.png',await scene(1440,970,layers)),await save('05-field-source.png',treated),await json('05-pixel-sample.json',sample)];\n}\n"
  },
  {
    "id": "peak-lab-06-shapes-and-hit-testing",
    "title": "Peak Lab 06 · Geometry with behaviour",
    "description": "Every image shape, followed by actual region/path/stroke/distance queries visualized as a hit-map. **Peak Lab project recipe:** this source is shown verbatim from `examples/06-shapes-and-hit-testing.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Geometry",
    "sourceFile": "examples/06-shapes-and-hit-testing.mjs",
    "primaryLens": "image",
    "lenses": [
      "image",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#111827",
      "#374151",
      "#f59e0b"
    ],
    "variant": 5,
    "source": "import {p,C,txt,font,images,rect,circle,textLayer,scene,save,json,heading,rng} from '../shared/studio.mjs';\nexport const meta={id:'06',title:'Geometry with behaviour',category:'Geometry',description:'Every image shape, followed by actual region/path/stroke/distance queries visualized as a hit-map.'};\nexport async function run(){\n  const shapes=['rectangle','square','circle','triangle','trapezium','star','heart','polygon','arc','pieSlice'];\n  const layers=heading('06 / GEOMETRY & HIT TESTING','Geometry with behaviour','The coloured sample points below are computed with the public detection APIs.');\n  for(let i=0;i<shapes.length;i++){\n    const x=70+(i%5)*267,y=255+Math.floor(i/5)*244;\n    layers.push(images({source:shapes[i],x:x+42,y,width:140,height:140,shape:{color:[C.red,C.teal,C.blue,C.gold,C.violet][i%5],sides:6,startAngle:0,endAngle:Math.PI*1.5},stroke:{color:C.ink,width:1.5}}),textLayer(txt(shapes[i].toUpperCase(),x+12,y+164,16,C.ink,{font:font(16,'mono')})));\n  }\n  const region={type:'polygon',points:[{x:105,y:849},{x:455,y:764},{x:716,y:866},{x:594,y:1043},{x:171,y:1014}]};\n  const commands=[{type:'polygon',points:region.points}],path=p.path2d.create(commands),random=rng(42),hits=[];\n  layers.push({type:'path',path:commands,options:{fill:{color:'#e4e3d9'},stroke:{color:C.ink,width:2}}});\n  for(let i=0;i<170;i++){\n    const x=75+random()*670,y=747+random()*330;\n    const result=await p.detect.region(region,x,y);\n    hits.push({x,y,...result});layers.push(images(circle(x,y,3.2,result.hit?C.red:'#b4b8b4')));\n  }\n  const report={path:await p.detect.path(path,300,900),anyRegion:await p.detect.anyRegion([region,{type:'circle',x:1100,y:950,radius:75}],1100,950),distance:await p.detect.distance({type:'circle',x:1100,y:950,radius:75},1250,950),hits};\n  layers.push(textLayer(txt('TEST THE DRAWING.',843,791,31,C.ink,{font:font(31,'bold')}),txt('170 sample points\\nPolygon fill test\\nPath test + region index\\nSigned proximity information',845,858,21,C.muted,{layout:{lineHeight:1.7,maxWidth:480}})));\n  return [await save('06-shapes-and-hit-testing.png',await scene(1440,1140,layers)),await json('06-hit-results.json',report)];\n}\n"
  },
  {
    "id": "peak-lab-07-filters",
    "title": "Peak Lab 07 · Eighteen ways to see",
    "description": "All seventeen public filters plus the original, with parameter choices that make their differences inspectable. **Peak Lab project recipe:** this source is shown verbatim from `examples/07-filters.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Image effects",
    "sourceFile": "examples/07-filters.mjs",
    "primaryLens": "image",
    "lenses": [
      "image",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#07111f",
      "#103f4a",
      "#36d9b4"
    ],
    "variant": 6,
    "source": "import {p,C,txt,font,textLayer,scene,save,json,heading,plate,OUT} from '../shared/studio.mjs';\nimport {ApexifyDecodeError} from 'apexify.js';\nimport path from 'node:path';\nexport const meta={id:'07',title:'Eighteen ways to see',category:'Image effects',description:'All seventeen public filters plus the original, with parameter choices that make their differences inspectable.'};\nexport async function run(){\n  const src=await plate(360,230),sourceName='07-filter-source.png';await save(sourceName,src);\n  const filters=[{type:'gaussianBlur',intensity:4},{type:'motionBlur',intensity:11,angle:25},{type:'radialBlur',intensity:12},{type:'sharpen',intensity:2},{type:'noise',intensity:.25},{type:'grain',intensity:.3},{type:'edgeDetection'},{type:'emboss'},{type:'invert'},{type:'grayscale'},{type:'sepia'},{type:'pixelate',size:12},{type:'brightness',value:30},{type:'contrast',value:40},{type:'saturation',value:60},{type:'hueShift',value:100},{type:'posterize',levels:5}];\n  const layers=heading('07 / IMAGE LAB','Eighteen ways to see','Original plus the complete filter family. Each treatment is generated independently.');\n  for(const item of filters){\n    if(['edgeDetection','emboss'].includes(item.type))item.intensity=1;\n    // image.effects brightness is -1..1; contrast is -255..254.\n    // createImage.filters uses percentages for both; these contracts differ.\n    if(item.type==='brightness')item.value/=100;\n  }\n  const all=[{type:'original'},...filters],knownIssues=[];\n  for(let i=0;i<all.length;i++){\n    const item=all[i],x=64+(i%3)*450,y=244+Math.floor(i/3)*330;\n    let buffer=src,fallback=false;\n    if(i)try{buffer=await p.image.effects(path.join(OUT,sourceName),[item]);}catch(error){\n      // Pinned upstream filter bug: grayscale emits a single-channel raw raster,\n      // but the filter pipeline requires four channels. Do not hide this failure.\n      if(!(error instanceof ApexifyDecodeError)||!['grayscale','edgeDetection'].includes(item.type)||!error.message.includes('geometry'))throw error;\n      fallback=true;knownIssues.push({feature:item.type,error:error.message,alternative:'Explicit painter.pixels implementation'});\n      if(item.type==='grayscale')buffer=await p.pixels.manipulate(src,{filter:'grayscale'});\n      else{\n        const pix=await p.pixels.getData(src),copy=new Uint8ClampedArray(pix.data),w=pix.width,h=pix.height;\n        const luminance=(x,y)=>{const n=(y*w+x)*4;return .2126*copy[n]+.7152*copy[n+1]+.0722*copy[n+2];};\n        for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){\n          const gx=-luminance(x-1,y-1)+luminance(x+1,y-1)-2*luminance(x-1,y)+2*luminance(x+1,y)-luminance(x-1,y+1)+luminance(x+1,y+1);\n          const gy=-luminance(x-1,y-1)-2*luminance(x,y-1)-luminance(x+1,y-1)+luminance(x-1,y+1)+2*luminance(x,y+1)+luminance(x+1,y+1);\n          const n=(y*w+x)*4,m=Math.min(255,Math.hypot(gx,gy));pix.data[n]=pix.data[n+1]=pix.data[n+2]=m;\n        }\n        buffer=await p.pixels.setData(src,pix);\n      }\n    }\n    layers.push({type:'imageBuffer',buffer,x,y,width:412,height:264},textLayer(txt(item.type+(fallback?' *':''),x,y+278,19,C.ink,{font:font(19,'mono')})));\n  }\n  layers.push(textLayer(txt('* Upstream channel error reproduced; displayed result uses the documented pixel-based alternative.',64,2220,14,C.red)));\n  return [await save('07-filters.png',await scene(1440,2290,layers)),await json('07-known-filter-issues.json',knownIssues)];\n}\n"
  },
  {
    "id": "peak-lab-08-masks-and-warp",
    "title": "Peak Lab 08 · Mutable matter",
    "description": "Alpha and luminance masks, geometric clipping, all distortion types, mesh warping, grouped transforms and optical effects. **Peak Lab project recipe:** this source is shown verbatim from `examples/08-masks-and-warp.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Image effects",
    "sourceFile": "examples/08-masks-and-warp.mjs",
    "primaryLens": "image",
    "lenses": [
      "image",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#16121f",
      "#5e183e",
      "#f1ba63"
    ],
    "variant": 7,
    "source": "import {p,C,txt,font,textLayer,images,rect,circle,linear,scene,save,heading,plate} from '../shared/studio.mjs';\nexport const meta={id:'08',title:'Mutable matter',category:'Image effects',description:'Alpha and luminance masks, geometric clipping, all distortion types, mesh warping, grouped transforms and optical effects.'};\nexport async function run(){\n  const w=380,h=280,source=await plate(w,h),mask=await scene(w,h,[images(circle(190,140,123,'#ffffff'),rect(20,122,340,36,'#ffffff'))],{transparentBase:true});\n  const treatments=[\n    ['Alpha mask',{mask:{source:mask,mode:'alpha'}}],\n    ['Polygon clipping',{clipPath:[{x:20,y:100},{x:200,y:10},{x:360,y:100},{x:300,y:265},{x:85,y:245}]}],\n    ['Perspective',{distortion:{type:'perspective',points:[{x:25,y:20},{x:350,y:48},{x:320,y:260},{x:50,y:220}]}}],\n    ['Warp',{distortion:{type:'warp',intensity:.26}}],\n    ['Bulge',{distortion:{type:'bulge',intensity:.55}}],\n    ['Pinch',{distortion:{type:'pinch',intensity:.6}}],\n    ['Mesh displacement',{meshWarp:{gridX:2,gridY:2,controlPoints:Array.from({length:3},(_,y)=>Array.from({length:3},(_,x)=>({x:x*w/2+(y===1?30:0),y:y*h/2+(x===1?-25:0)})))}}],\n    ['Optical stack',{effects:{vignette:{intensity:.7,size:.7},chromaticAberration:{intensity:5},filmGrain:{intensity:.08},lensFlare:{x:240,y:80,intensity:.4}}}],\n    ['Group transform',{}]\n  ];\n  const layers=heading('08 / RASTER TRANSFORMATIONS','Mutable matter','One source. Nine controlled transformations. The mask and mesh are generated from code.');\n  for(let i=0;i<treatments.length;i++){\n    const [title,opts]=treatments[i],base=await p.createCanvas({width:w,height:h,colorBg:'#e2ddd2'});\n    const buffer=await p.createImage({source,x:0,y:0,width:w,height:h,...opts},base,i===8?{isGrouped:true,groupTransform:{rotation:-9,scaleX:.82,scaleY:.82,pivotX:w/2,pivotY:h/2,opacity:.9}}:undefined);\n    const x=64+i%3*450,y=245+Math.floor(i/3)*358;\n    layers.push({type:'imageBuffer',buffer,x,y,width:410,height:302},textLayer(txt(title,x,y+318,18,C.ink,{font:font(18,'mono')})));\n  }\n  return [await save('08-masks-and-warp.png',await scene(1440,1350,layers))];\n}\n"
  },
  {
    "id": "peak-lab-09-image-utilities",
    "title": "Peak Lab 09 · The image finishing desk",
    "description": "Every local image utility: masked duotones, cutouts, blend layers, palette algorithms, compression, conversion, resizing, stitch and three collage layouts. **Peak Lab project recipe:** this source is shown verbatim from `examples/09-image-utilities.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Image utilities",
    "sourceFile": "examples/09-image-utilities.mjs",
    "primaryLens": "image",
    "lenses": [
      "image",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#0d1725",
      "#173f47",
      "#5088ff"
    ],
    "variant": 8,
    "source": "import {p,C,txt,font,images,rect,circle,textLayer,linear,scene,save,json,heading,plate,OUT} from '../shared/studio.mjs';\nimport path from 'node:path';\nexport const meta={id:'09',title:'The image finishing desk',category:'Image utilities',description:'Every local image utility: masked duotones, cutouts, blend layers, palette algorithms, compression, conversion, resizing, stitch and three collage layouts.'};\nexport async function run(){\n  const src=await plate(600,400);await save('09-source.png',src);const source=path.join(OUT,'09-source.png');\n  const mask=await scene(600,400,[images(circle(300,200,180,'#fff'))],{transparentBase:true});\n  const cut=await p.image.masking(src,mask,{type:'alpha'});\n  const gradient=await p.image.gradientBlend(src,{type:'linear',angle:45,colors:[{stop:0,color:C.blue},{stop:.5,color:C.red},{stop:1,color:C.gold}],blendMode:'screen'});\n  const tinted=await p.image.colorsFilter(source,C.teal,.38);\n  const keyed=await scene(600,400,[images(circle(300,200,180,C.red))],{colorBg:'#00ff00'});await save('09-key-source.png',keyed);\n  const removed=await p.image.colorsRemover(path.join(OUT,'09-key-source.png'),{red:0,green:255,blue:0});\n  const blended=await p.image.blend([{image:cut,blendMode:'screen',opacity:.6,position:{x:0,y:0}},{image:removed,blendMode:'multiply',opacity:.6}],src);\n  const pts=[{x:40,y:40},{x:500,y:80},{x:570,y:320},{x:80,y:365}];\n  const crop=await p.image.cropImage({imageSource:source,crop:'inner',radius:24,coordinates:pts.map((point,i)=>({from:point,to:pts[(i+1)%pts.length]}))});\n  const resized=await p.image.resize({imagePath:src,size:{width:300,height:200},maintainAspectRatio:true,outputFormat:'png'});\n  const previews=[src,cut,gradient,tinted,blended,crop];\n  const names=['Original','Alpha mask','Gradient blend','Colour filter','Layer blend','Path crop'];\n  const layers=heading('09 / FINISHING','The image finishing desk','A practical asset pipeline, from procedural source to delivery formats.');\n  for(let i=0;i<previews.length;i++){const x=64+i%3*450,y=245+Math.floor(i/3)*335;layers.push({type:'imageBuffer',buffer:previews[i],x,y,width:410,height:273},textLayer(txt(names[i],x,y+286,19,C.ink)));}\n  const palettes={};for(const method of ['kmeans','median-cut','octree'])palettes[method]=await p.image.extractPalette(src,{method,count:7,format:'hex'});\n  palettes.kmeans.forEach((s,i)=>layers.push(images(rect(64+i*188,974,188,70,s.color)),textLayer(txt(s.color,64+i*188,1061,16,C.ink,{font:font(16,'mono')}))));\n  const files=[await save('09-image-utilities.png',await scene(1440,1150,layers)),await save('09-alpha-cutout.png',cut),await save('09-color-key-cutout.png',removed),await save('09-resized.png',resized)];\n  for(const format of ['jpeg','webp','avif'])files.push(await save(`09-delivery.${format}`,await p.image.compress(src,{format,quality:84,maxWidth:600})));\n  files.push(await save('09-converted.webp',await p.image.imgConverter(src,'webp')));\n  const thumbs=await Promise.all(previews.map(imagePath=>p.image.resize({imagePath,size:{width:280,height:187},outputFormat:'png'})));\n  files.push(await save('09-stitch.png',await p.image.stitchImages(thumbs,{direction:'horizontal',spacing:12})));\n  for(const type of ['grid','masonry','carousel'])files.push(await save(`09-collage-${type}.png`,await p.image.createCollage(thumbs.map(source=>({source})),{type,columns:3,spacing:14,background:C.paper,borderRadius:14})));\n  files.push(await json('09-image-analysis.json',{palettes,colorAnalysis:await p.image.colorAnalysis(source),validHex:p.image.validHex(C.red)}));return files;\n}\n"
  },
  {
    "id": "peak-lab-10-line-chart",
    "title": "Peak Lab 10 · Growth under uncertainty",
    "description": "A multi-series time course with explicit uncertainty bounds, error bars, curve smoothing and an annotated secondary process. All data are synthetic. **Peak Lab project recipe:** this source is shown verbatim from `examples/10-line-chart.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Charts",
    "sourceFile": "examples/10-line-chart.mjs",
    "primaryLens": "data",
    "lenses": [
      "data"
    ],
    "featured": true,
    "colors": [
      "#101820",
      "#4d294e",
      "#ee593b"
    ],
    "variant": 9,
    "source": "import {p,C,save,mountArt} from '../shared/studio.mjs';\nimport {chartOptions,series} from '../shared/charts.mjs';\nexport const meta={id:'10',title:'Growth under uncertainty',category:'Charts',description:'A multi-series time course with explicit uncertainty bounds, error bars, curve smoothing and an annotated secondary process. All data are synthetic.'};\nexport async function run(){\n  const growth=t=>8+83/(1+Math.exp(-(t-10)/2.7));\n  const a=series('Culture A',C.red,growth),b=series('Culture B',C.blue,t=>4+72/(1+Math.exp(-(t-13)/3.2)));\n  a.area={type:'around',show:true,color:C.red,opacity:.14,lowerBound:a.data.map(d=>d.y-5),upperBound:a.data.map(d=>d.y+5)};\n  a.errorBar={show:true,color:C.red,width:1.5,capSize:6};\n  a.data=a.data.map((d,i)=>({...d,errorBar:i%4===0?{positive:5,negative:5,show:true,color:C.red,capSize:6}:undefined}));\n  const control=series('Control',C.muted,t=>6+Math.sin(t*.4)*2);control.lineStyle='dashed';control.marker={show:false};\n  const opts=chartOptions('Cell density / synthetic experiment');opts.axes.x={...opts.axes.x,label:'Incubation time (h)',range:{min:0,max:24,step:4}};opts.axes.y={...opts.axes.y,label:'Relative density (%)',range:{min:0,max:110,step:20}};\n  return [await mountArt('10-line-chart.png',await p.createChart('line',[a,b,control],opts),{title:'Growth under uncertainty',subtitle:'Synthetic data · envelope ±5 units · error bars every four hours'})];\n}\n"
  },
  {
    "id": "peak-lab-11-bar-charts",
    "title": "Peak Lab 11 · A resource story",
    "description": "Standard, grouped, stacked, waterfall and lollipop charts plus horizontal ranking. Continuous x-domain positions are specified explicitly. **Peak Lab project recipe:** this source is shown verbatim from `examples/11-bar-charts.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Charts",
    "sourceFile": "examples/11-bar-charts.mjs",
    "primaryLens": "data",
    "lenses": [
      "data"
    ],
    "featured": false,
    "colors": [
      "#0f172a",
      "#1e3a5f",
      "#bda5ff"
    ],
    "variant": 10,
    "source": "import {p,C,save,scene,heading} from '../shared/studio.mjs';\nimport {chartOptions} from '../shared/charts.mjs';\nexport const meta={id:'11',title:'A resource story',category:'Charts',description:'Standard, grouped, stacked, waterfall and lollipop charts plus horizontal ranking. Continuous x-domain positions are specified explicitly.'};\nexport async function run(){\n  const categories=['Capture','Decode','Compose','Encode','Export'];\n  const types=['standard','grouped','stacked','waterfall','lollipop'];\n  const layers=heading('11 / CHART GRAMMAR','A resource story','Five vertical bar geometries and a horizontal ranking. Synthetic measurements.');\n  const files=[];\n  for(let i=0;i<6;i++){\n    const type=types[i],horizontal=i===5;\n    const data=categories.map((label,j)=>({label,xStart:j+.18,xEnd:j+.82,value:type==='waterfall'?[22,-5,18,-7,14][j]:[24,48,67,82,42][j],color:[C.red,C.teal,C.blue,C.violet,C.gold][j],labelColor:C.ink,valueColor:C.ink,...(['grouped','stacked'].includes(type)?{values:[{value:12+j*7,color:C.teal},{value:20+j*4,color:C.red}]}:{})}));\n    if(['grouped','stacked'].includes(type))for(const row of data)delete row.value;\n    const options={...chartOptions(horizontal?'HORIZONTAL RANKING':type.toUpperCase(),620,395),type:horizontal?'lollipop':type,legend:{show:false},bars:{minWidth:20,groupSpacing:5,spacing:16}};\n    if(horizontal){options.axes={x:{range:{min:0,max:100,step:20},color:C.muted},y:{color:C.muted}};}\n    const buffer=await p.createChart(horizontal?'horizontalBar':'bar',horizontal?data.map(({xStart,xEnd,...d})=>d):data,options);\n    const name=`11-${horizontal?'horizontal':type}.png`;files.push(await save(name,buffer));layers.push({type:'imageBuffer',buffer,x:64+i%2*668,y:238+Math.floor(i/2)*423,width:640,height:400});\n  }\n  files.unshift(await save('11-bar-charts.png',await scene(1440,1550,layers)));return files;\n}\n"
  },
  {
    "id": "peak-lab-12-circular-charts",
    "title": "Peak Lab 12 · Circular intelligence",
    "description": "Donut and pie, multidimensional radar and area-scaled polar charts. These are explicit synthetic profiles, not measured product claims. **Peak Lab project recipe:** this source is shown verbatim from `examples/12-circular-charts.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Charts",
    "sourceFile": "examples/12-circular-charts.mjs",
    "primaryLens": "data",
    "lenses": [
      "data"
    ],
    "featured": false,
    "colors": [
      "#111827",
      "#374151",
      "#f59e0b"
    ],
    "variant": 11,
    "source": "import {p,C,save,scene,heading,txt,textLayer,font} from '../shared/studio.mjs';\nimport {chartOptions} from '../shared/charts.mjs';\nexport const meta={id:'12',title:'Circular intelligence',category:'Charts',description:'Donut and pie, multidimensional radar and area-scaled polar charts. These are explicit synthetic profiles, not measured product claims.'};\nexport async function run(){\n  const slices=['Solar','Wind','Hydro','Storage'].map((label,i)=>({label,value:[38,27,21,14][i],color:[C.red,C.teal,C.blue,C.gold][i]}));\n  const pieOptions={dimensions:{width:640,height:500,padding:{top:34,right:32,bottom:40,left:32}},appearance:{backgroundColor:C.paper},labels:{title:{text:'ENERGY MIX',color:C.ink,fontSize:22},showValues:true,showLabels:false,valueLabels:{color:C.ink,fontSize:18},valueFormat:(_,pct)=>`${pct.toFixed(0)}%`},legends:{standard:{show:true,position:'bottom',fontSize:16,textColor:C.ink,backgroundColor:C.paper,borderColor:'#ddd8cf'}},slices:{stroke:{color:C.paper,width:4}}};\n  const donut=await p.createChart('pie',slices,{...pieOptions,type:'donut',donutInnerRadius:.60});\n  const pie=await p.createChart('pie',slices,{...pieOptions,type:'pie'});\n  const radar=await p.createChart('radar',[{label:'Design A',values:[88,64,92,75,81,70],color:C.red,fillOpacity:.12,lineWidth:3},{label:'Design B',values:[65,85,70,91,64,88],color:C.blue,fillOpacity:.10,lineWidth:3}],{...chartOptions('SYSTEM PROFILES',640,540),radar:{categories:['Speed','Clarity','Reach','Control','Depth','Scale'],maxValue:100,gridLevels:5,axisLabelColor:C.ink,axisLabelFontSize:17,gridColor:'#cccfc9',showPoints:true}});\n  const polar=await p.createChart('polarArea',Array.from({length:8},(_,i)=>({label:['N','NE','E','SE','S','SW','W','NW'][i],value:[18,32,58,87,64,37,21,12][i],color:[C.red,C.gold,C.teal,C.blue,C.violet,C.red,C.gold,C.teal][i]})),{...chartOptions('DIRECTIONAL FIELD',640,540),scale:'area',polar:{innerRadiusRatio:.14,sliceStrokeWidth:3,sliceStrokeColor:C.paper},legend:{show:false},labels:{sliceLabelColor:C.ink,sliceLabelFontSize:19,showValues:true}});\n  const buffers=[donut,pie,radar,polar],layers=heading('12 / CIRCULAR CHARTS','Circular intelligence','Synthetic profiles · proportional area encoding · consistent colour semantics');\n  const files=[];for(let i=0;i<4;i++){layers.push({type:'imageBuffer',buffer:buffers[i],x:64+i%2*670,y:230+Math.floor(i/2)*565,width:640,height:530});files.push(await save(`12-${['donut','pie','radar','polar'][i]}.png`,buffers[i]));}\n  files.unshift(await save('12-circular-charts.png',await scene(1440,1380,layers)));return files;\n}\n"
  },
  {
    "id": "peak-lab-13-scatter-and-comparison",
    "title": "Peak Lab 13 · Two explanations, one signal",
    "description": "Scatter regression with seeded observations, a before/after comparison and a dual-axis bar/line figure with explicit units. **Peak Lab project recipe:** this source is shown verbatim from `examples/13-scatter-and-comparison.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Charts",
    "sourceFile": "examples/13-scatter-and-comparison.mjs",
    "primaryLens": "data",
    "lenses": [
      "data"
    ],
    "featured": false,
    "colors": [
      "#07111f",
      "#103f4a",
      "#36d9b4"
    ],
    "variant": 12,
    "source": "import {p,C,rng,mountArt,save} from '../shared/studio.mjs';\nimport {chartOptions,series} from '../shared/charts.mjs';\nexport const meta={id:'13',title:'Two explanations, one signal',category:'Charts',description:'Scatter regression with seeded observations, a before/after comparison and a dual-axis bar/line figure with explicit units.'};\nexport async function run(){\n  const random=rng(79),observations=Array.from({length:54},(_,i)=>({x:5+i*1.7,y:12+i*1.12+(random()-.5)*17}));\n  const scatter=await p.createChart('scatter',[{label:'Synthetic observations',data:observations,color:C.blue,markerSize:5,opacity:.7,correlation:{show:true,type:'linear',color:C.red,lineWidth:3}}],{...chartOptions('Dose-response relationship'),axes:{x:{label:'Dose (arbitrary units)',color:C.muted},y:{label:'Response (arbitrary units)',color:C.muted}}});\n  const before=[series('Before',C.blue,t=>18+Math.sin(t*.7)*12+t*.8)],after=[series('After',C.red,t=>20+t*.9+Math.sin(t*.7)*3)];\n  const compare=await p.createComparisonChart({dimensions:{width:1300,height:700},layout:'sideBySide',spacing:35,appearance:{backgroundColor:C.paper},chart1:{type:'line',data:before,options:chartOptions('Uncontrolled process',600,620)},chart2:{type:'line',data:after,options:chartOptions('Stabilized process',600,620)}});\n  const combo=await p.createComboChart({bars:Array.from({length:8},(_,i)=>({label:`R${i+1}`,xStart:i+.2,xEnd:i+.8,value:36+i*8,color:C.teal,labelColor:C.ink})),lines:[{...series('Yield (%)',C.red,i=>63+i*3.6,8),data:Array.from({length:8},(_,i)=>({x:i+.5,y:63+i*3.6})),yAxis:'secondary'}],...chartOptions('Throughput and yield'),axes:{x:{showTickLabels:false,showTickMarks:false,color:C.muted},y:{label:'Throughput (units/h)',range:{min:0,max:110,step:20},color:'#118e75'},ySecondary:{label:'Yield (%)',range:{min:50,max:100,step:10},color:C.red}},legend:{show:false}});\n  return [await mountArt('13-scatter.png',scatter,{title:'Two explanations, one signal',subtitle:'Synthetic observations · computed linear fit · correlation does not establish causation'}),await mountArt('13-comparison.png',compare,{title:'A before / after study',subtitle:'Two independent chart panels composed with createComparisonChart'}),await mountArt('13-combo.png',combo,{title:'Throughput meets yield',subtitle:'Synthetic data · bars use the left axis · line uses the right axis'})];\n}\n"
  },
  {
    "id": "peak-lab-14-scenes",
    "title": "Peak Lab 14 · The orbital observatory",
    "description": "A layered observatory with nested clipped surfaces, transform-isolated instruments, a reusable scene builder and explicit preflight validation. **Peak Lab project recipe:** this source is shown verbatim from `examples/14-scenes.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Scenes",
    "sourceFile": "examples/14-scenes.mjs",
    "primaryLens": "composition",
    "lenses": [
      "composition",
      "advanced"
    ],
    "featured": true,
    "colors": [
      "#16121f",
      "#5e183e",
      "#f1ba63"
    ],
    "variant": 13,
    "source": "import {p,C,txt,font,textLayer,images,rect,circle,line,linear,radial,scene,save,json,heading,TAU,polar,rng} from '../shared/studio.mjs';\nexport const meta={id:'14',title:'The orbital observatory',category:'Scenes',description:'A layered observatory with nested clipped surfaces, transform-isolated instruments, a reusable scene builder and explicit preflight validation.'};\nexport async function run(){\n  const width=1440,height=1000,builder=p.createScene({width,height,background:{colorBg:C.night}});\n  builder.setBackground({gradientBg:linear(['#0e1725','#142f35'])});\n  const random=rng(19),starLayers=images(Array.from({length:190},()=>circle(40+random()*1360,205+random()*690,random()*1.4+.3,'#e3e9cf',{opacity:random()*.7+.1})));\n  builder.addLayer(starLayers).addLayers(heading('14 / SCENE SYSTEMS','The orbital observatory','Nested surfaces · deterministic draw order · isolated transforms',C.paper));\n  for(let k=0;k<6;k++)builder.addLayer({type:'path',path:[{type:'ellipse',x:725,y:610,radiusX:170+k*58,radiusY:85+k*27,rotation:-.45}],options:{stroke:{color:k===3?C.teal:'#547888',width:k===3?2:1},opacity:.55}});\n  builder.addLayer(images(circle(725,610,115,C.gold,{shape:{gradient:radial(['#fff4c6','#f7b465','#853951'])},shadow:{color:C.gold,blur:38,opacity:.3}})));\n  for(let k=0;k<5;k++){const [x,y]=polar(725,610,170+k*55,k*1.6-.5);builder.addLayer(images(circle(x,y,[12,21,16,28,9][k],[C.teal,C.blue,C.red,C.violet,C.paper][k])));}\n  const instrument={type:'surface',placement:{x:72,y:630,width:290,height:240,rotation:-6},background:{colorBg:C.panel,borderRadius:20,stroke:{color:'#2d5c68',width:1}},layers:[textLayer(txt('DEEP FIELD / 079',22,24,15,C.teal,{font:font(15,'mono')})),...Array.from({length:22},(_,i)=>line([[20+i*11,178],[20+i*11,170-Math.sin(i*.65)*50-i*2]],C.teal,4)),textLayer(txt('SIGNAL LOCKED',24,201,13,C.paper,{font:font(13,'mono')}))]};\n  builder.addLayer(instrument);\n  const counter=textLayer(txt('6 ORBITS',1090,847,36,C.paper,{font:font(36,'bold')}));\n  builder.insertBefore(builder.layerCount-1,counter);\n  builder.insertAfter(builder.layerCount-1,textLayer(txt('APEX / TELEMETRY',64,942,16,C.teal,{font:font(16,'mono')})));\n  builder.insertLayer(1,line([[63,900],[1377,900]],'#42616d',1));\n  builder.insertLayers(2,[textLayer(txt('SIMULATED DATA',1130,46,14,C.teal,{font:font(14,'mono')}))]);\n  // A real edit cycle: replace the label, reorder the footer, remove a draft mark.\n  builder.replaceLayer(2,textLayer(txt('SIMULATED ORBITS',1098,46,14,C.teal,{font:font(14,'mono')})));\n  builder.addLayer(textLayer(txt('DRAFT',0,0))).removeLayer(builder.layerCount-1);\n  builder.moveLayer(1,builder.layerCount-1);\n  const input=builder.toRenderInput();p.validateSceneRenderInput(input);\n  const final=await builder.render();\n  const thumbnail=p.createScene(720,500);thumbnail.clearBackground().setBackground({colorBg:C.night}).addLayer({type:'imageBuffer',buffer:final,x:0,y:0,width:720,height:500});\n  const snapshot=thumbnail.toRenderInput().layers;thumbnail.clearLayers().replaceLayers(snapshot);\n  return [await save('14-scenes.png',final),await save('14-scene-thumbnail.png',await thumbnail.render()),await json('14-scene-structure.json',{rootLayers:builder.layerCount,nestedSurfaceCount:1,dimensions:{width,height}})];\n}\n"
  },
  {
    "id": "peak-lab-15-components",
    "title": "Peak Lab 15 · Expedition dossier",
    "description": "All five component factories composed into a data-rich expedition card: avatar, badge, progress, card and watermark. **Peak Lab project recipe:** this source is shown verbatim from `examples/15-components.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Components",
    "sourceFile": "examples/15-components.mjs",
    "primaryLens": "composition",
    "lenses": [
      "composition"
    ],
    "featured": false,
    "colors": [
      "#0d1725",
      "#173f47",
      "#5088ff"
    ],
    "variant": 14,
    "source": "import {p,C,txt,font,images,rect,circle,textLayer,line,linear,plate,scene,save,heading} from '../shared/studio.mjs';\nexport const meta={id:'15',title:'Expedition dossier',category:'Components',description:'All five component factories composed into a data-rich expedition card: avatar, badge, progress, card and watermark.'};\nexport async function run(){\n  const avatar=await plate(180,180);\n  const layers=heading('15 / COMPONENT COMPOSITION','Expedition dossier','Reusable scene fragments become a coherent printable field report.');\n  layers.push(...p.components.card.toLayers({x:64,y:246,width:790,height:745,radius:26,background:'#152b35',borderColor:'#304950',borderWidth:1}));\n  layers.push(...p.components.avatar.toLayers({source:avatar,x:106,y:290,size:116,borderColor:C.teal,borderWidth:4}),...p.components.badge.toLayers({text:'MISSION ACTIVE',x:268,y:297,background:C.teal,color:C.ink,fontSize:16,paddingX:18,paddingY:10,radius:8}));\n  layers.push(textLayer(txt('Dr. Mira Sol',264,361,40,C.paper,{font:font(40,'bold')}),txt('FIELD SCIENTIST / EXPEDITION 079',109,462,16,C.teal,{font:font(16,'mono')}),txt('Aster Research Station',109,500,39,C.paper,{font:font(39,'serif')})));\n  const specs=[['Mapping coverage',84,C.teal],['Sample cataloguing',62,C.gold],['Energy reserve',91,C.blue],['Uplink quality',73,C.violet]];\n  specs.forEach(([label,value,fill],i)=>{const y=602+i*84;layers.push(textLayer(txt(label,110,y-28,18,C.paper)),...p.components.progressBar.toLayers({x:110,y,width:690,height:24,value,max:100,fill,background:'#30434d',radius:8,showLabel:true,labelColor:C.paper}));});\n  layers.push(...p.components.card.toLayers({x:894,y:246,width:482,height:356,radius:26,background:'#e8e2d6',title:'FIELD NOTES',titleFontSize:19,titleColor:C.ink,body:'The most useful component is the one that disappears into the composition.',bodyFontSize:25,bodyColor:C.ink,padding:34}));\n  layers.push(textLayer(txt('079',927,660,156,C.red,{font:font(156,'bold')}),txt('EST. 2042\\n46.50 N / 11.35 E\\nFICTIONAL EXPEDITION',933,849,18,C.muted,{font:font(18,'mono'),layout:{lineHeight:1.6}})));\n  layers.push(...p.components.watermark.toLayers({text:'APEXIFY / FIELD EDITION',canvasWidth:1440,canvasHeight:1070,position:'bottom-right',margin:36,fontSize:15,color:'#71808b'}));\n  return [await save('15-components.png',await scene(1440,1070,layers))];\n}\n"
  },
  {
    "id": "peak-lab-16-templates",
    "title": "Peak Lab 16 · One system, four editions",
    "description": "Immutable template definition, native-value placeholders, defaults, visibility, grid/flex layout, deep layer overrides and insertions. **Peak Lab project recipe:** this source is shown verbatim from `examples/16-templates.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Templates",
    "sourceFile": "examples/16-templates.mjs",
    "primaryLens": "composition",
    "lenses": [
      "composition",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#101820",
      "#4d294e",
      "#ee593b"
    ],
    "variant": 15,
    "source": "import {p,C,txt,font,textLayer,images,rect,circle,linear,save,json,scene,heading} from '../shared/studio.mjs';\nexport const meta={id:'16',title:'One system, four editions',category:'Templates',description:'Immutable template definition, native-value placeholders, defaults, visibility, grid/flex layout, deep layer overrides and insertions.'};\nexport async function run(){\n  const template=p.createTemplate({width:600,height:780,background:{colorBg:C.paper},layers:[\n    {type:'image',images:rect(0,0,600,780,'{{background}}')},\n    {id:'orb',type:'image',images:{source:'circle',x:100,y:178,width:400,height:400,shape:{gradient:linear([C.red,C.gold])}}},\n    {type:'text',texts:txt('PEAK / {{edition}}',36,37,16,'{{ink}}',{font:font(16,'mono')})},\n    {id:'title',type:'text',texts:txt('{{title}}',32,102,62,'{{ink}}',{font:font(62,'bold')})},\n    {type:'layout',x:36,y:584,width:528,height:60,layout:{type:'flex',direction:'row',gap:16,align:'center',justify:'space-between'},children:[\n      {type:'text',...txt('{{region}}',0,0,17,'{{ink}}')},{type:'text',...txt('{{year | 2042}}',0,0,17,'{{ink}}')}\n    ]},\n    {type:'layout',x:36,y:670,width:528,height:60,layout:{type:'grid',columns:3,gap:12,align:'center',justify:'start'},children:[\n      {type:'text',...txt('FIELD {{field}}',0,0,12,'{{ink}}',{font:font(12,'mono')})},{type:'text',...txt('ED. {{edition}}',0,0,12,'{{ink}}',{font:font(12,'mono')})},{type:'text',...txt('APEXIFY',0,0,12,'{{ink}}',{font:font(12,'mono')})}\n    ]},\n    {type:'text',visible:'{{limited}}',texts:txt('LIMITED / RESEARCH EDITION',36,747,12,'{{ink}}',{font:font(12,'mono')})}\n  ]});\n  const data=[{title:'SOLSTICE',region:'NORTHERN OBSERVATORY',background:C.paper,ink:C.ink,edition:'01',field:'A',limited:true},{title:'MIDNIGHT',region:'ARCTIC RESEARCH UNIT',background:C.night,ink:C.paper,edition:'02',field:'B',limited:false},{title:'VERDANT',region:'CANOPY FIELD STATION',background:'#143b37',ink:C.paper,edition:'03',field:'C',limited:true},{title:'EQUINOX',region:'EQUATORIAL LAB',background:'#f5bb80',ink:C.ink,edition:'04',field:'D',limited:false}];\n  const layers=heading('16 / TEMPLATE SYSTEMS','One system, four editions','The same immutable definition responds to data, overrides and layout.');const files=[];\n  for(let i=0;i<data.length;i++){\n    const options={overrides:{orb:{images:{shape:{gradient:linear([[C.red,C.gold],[C.blue,C.violet],[C.teal,C.gold],[C.ink,C.red]][i])}}}},insertions:[{targetId:'orb',position:'after',layers:{type:'image',images:circle(380,384,120,data[i].background)}}]};\n    const buf=await template.render(data[i],options);const name=`16-edition-${i+1}.png`;files.push(await save(name,buf));\n    layers.push({type:'imageBuffer',buffer:buf,x:64+i%2*675,y:240+Math.floor(i/2)*845,width:620,height:806});\n  }\n  const resolved=await template.toRenderInput(data[0]);\n  files.unshift(await save('16-templates.png',await scene(1440,1980,layers)));files.push(await json('16-template-resolved.json',resolved));return files;\n}\n"
  },
  {
    "id": "peak-lab-17-assets-and-plugins",
    "title": "Peak Lab 17 · An extensible engraving engine",
    "description": "A real engraving extension uses named palettes and values; registry replacement, resolution, installation and cleanup are exercised explicitly. **Peak Lab project recipe:** this source is shown verbatim from `examples/17-assets-and-plugins.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Assets & plugins",
    "sourceFile": "examples/17-assets-and-plugins.mjs",
    "primaryLens": "advanced",
    "lenses": [
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#0f172a",
      "#1e3a5f",
      "#bda5ff"
    ],
    "variant": 16,
    "source": "import {makePainter,p,C,txt,font,fontFile,textLayer,line,images,circle,linear,scene,save,json,heading,plate} from '../shared/studio.mjs';\nexport const meta={id:'17',title:'An extensible engraving engine',category:'Assets & plugins',description:'A real engraving extension uses named palettes and values; registry replacement, resolution, installation and cleanup are exercised explicitly.'};\nexport async function run(){\n  const host=makePainter(),photo=await plate(200,200);\n  host.assets.loadPalette('brand',{paper:C.paper,ink:C.ink,accent:C.red});\n  host.assets.loadValue('edition',{number:79,density:90});\n  host.assets.loadImage('seal',photo).replaceImage('seal',photo);\n  host.assets.loadFont('heading',fontFile('bold')).replaceFont('heading',fontFile('bold'));\n  host.assets.replaceValue('edition',{number:79,density:100});\n  host.assets.replacePalette('brand',{paper:C.paper,ink:C.ink,accent:C.red});\n  await host.use({name:'engraving',async install(painter){\n    painter.plugins.use('engraving',{toLayers({cx,cy,radius,phase=0}){\n      const accent=painter.assets.resolve('brand.accent');\n      return Array.from({length:80},(_,i)=>line(Array.from({length:140},(_,j)=>{\n        const u=j/139*2-1,x=u*radius;\n        return [cx+x,cy+(i-40)*5+Math.sin(u*4+phase+i*.035)*80*Math.sqrt(1-u*u)];\n      }),i%8===0?accent:'#68817b',i%8===0?2:.7,{opacity:.8}));\n    }});\n  }});\n  const api=host.plugins.get('engraving');\n  const layers=heading('17 / EXTENSION ARCHITECTURE','An extensible engraving engine','A trusted plugin builds normal scene layers and reads the caller’s named design tokens.');\n  layers.push(...api.toLayers({cx:710,cy:610,radius:580}),textLayer(txt('ENGRAVING / 079',64,926,18,C.ink,{font:font(18,'mono')})));\n  const prepared=host.prepareForRender({width:1440,height:1010,background:{colorBg:'$brand.paper'},layers});\n  const art=await host.renderScene(prepared);\n  const report={assets:host.assets.list(),hasBrand:host.assets.has('brand'),installed:host.plugins.listInstalled(),isInstalled:host.plugins.isInstalled('engraving'),apis:host.plugins.list(),hasApi:host.plugins.has('engraving')};\n  // Alternate installation entry for applications managing their own host object.\n  await host.plugins.install({name:'editionStamp',install(target){target.plugins.use('editionStamp',{number:79});}},host);\n  host.plugins.remove('editionStamp');host.plugins.remove('engraving');\n  host.assets.unregisterImage('seal').unregisterFont('heading').unregisterPalette('brand');host.assets.delete('edition');host.assets.clear();\n  return [await save('17-assets-and-plugins.png',art),await json('17-registry-report.json',report)];\n}\n"
  },
  {
    "id": "peak-lab-18-batch-and-chain",
    "title": "Peak Lab 18 · The identity printer",
    "description": "Bounded batches prepare independent plates. Sequential chains build complete generative identity cards with explicit current-buffer passing. **Peak Lab project recipe:** this source is shown verbatim from `examples/18-batch-and-chain.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Batch & chain",
    "sourceFile": "examples/18-batch-and-chain.mjs",
    "primaryLens": "composition",
    "lenses": [
      "composition",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#111827",
      "#374151",
      "#f59e0b"
    ],
    "variant": 17,
    "source": "import {p,C,txt,font,rect,circle,linear,scene,save,heading} from '../shared/studio.mjs';\nexport const meta={id:'18',title:'The identity printer',category:'Batch & chain',description:'Bounded batches prepare independent plates. Sequential chains build complete generative identity cards with explicit current-buffer passing.'};\nexport async function run(){\n  const pairs=[[C.red,C.gold],[C.blue,C.violet],[C.teal,'#215748'],[C.ink,C.muted],[C.gold,C.red],[C.violet,C.blue]];\n  const backgrounds=await p.batch(pairs.map(colors=>({type:'canvas',config:{width:390,height:520,gradientBg:linear(colors)}})));\n  const layers=heading('18 / AUTOMATED PRODUCTION','The identity printer','Six related compositions. Shared structure, independent data, stable output ordering.');\n  const files=[];\n  for(let i=0;i<6;i++){\n    const poster=await p.chain([\n      {method:'createCanvas',args:[{width:390,height:520,colorBg:C.paper}]},\n      {method:'createImage',args:[[{source:backgrounds[i],x:20,y:100,width:350,height:350,borderRadius:170},...Array.from({length:9},(_,j)=>circle(80+j*28,280+Math.sin(j*.6+i)*55,10+(j%3)*8,C.paper,{opacity:.5}))],'current']},\n      {method:'createText',args:[[txt(`FIELD / ${String(i+1).padStart(2,'0')}`,24,26,17,C.ink,{font:font(17,'mono')}),txt(['ORBIT','TIDAL','GROVE','NOIR','EMBER','ECHO'][i],24,60,46,C.ink,{font:font(46,'bold')}),txt('GENERATIVE IDENTITY SERIES',24,474,13,C.ink,{font:font(13,'mono')})],'current']}\n    ]);\n    files.push(await save(`18-identity-${i+1}.png`,poster));layers.push({type:'imageBuffer',buffer:poster,x:64+i%3*450,y:240+Math.floor(i/3)*595,width:414,height:552});\n  }\n  files.unshift(await save('18-batch-and-chain.png',await scene(1440,1450,layers)));return files;\n}\n"
  },
  {
    "id": "peak-lab-19-output",
    "title": "Peak Lab 19 · One master, every delivery",
    "description": "A print-style master is saved in multiple formats; data URL, base64, Blob and ArrayBuffer conversions are byte-checked. **Peak Lab project recipe:** this source is shown verbatim from `examples/19-output.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Output",
    "sourceFile": "examples/19-output.mjs",
    "primaryLens": "advanced",
    "lenses": [
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#07111f",
      "#103f4a",
      "#36d9b4"
    ],
    "variant": 18,
    "source": "import {p,makePainter,C,txt,font,images,circle,textLayer,scene,save,json,heading,plate,OUT} from '../shared/studio.mjs';\nimport path from 'node:path';\nimport assert from 'node:assert/strict';\nexport const meta={id:'19',title:'One master, every delivery',category:'Output',description:'A print-style master is saved in multiple formats; data URL, base64, Blob and ArrayBuffer conversions are byte-checked.'};\nexport async function run(){\n  const master=await plate(1100,680),art=await scene(1440,980,[...heading('19 / OUTPUT PIPELINE','One master, every delivery','PNG master · encoded views · format-specific file exports'),{type:'imageBuffer',buffer:master,x:64,y:244,width:1312,height:675}]);\n  const dataURL=p.output.dataURL(art),base64=p.output.base64(art),blob=p.output.blob(art),arrayBuffer=p.output.arrayBuffer(art);\n  assert.deepEqual(Buffer.from(base64,'base64'),art);assert.deepEqual(Buffer.from(await blob.arrayBuffer()),art);assert.deepEqual(Buffer.from(arrayBuffer),art);\n  const chosen=makePainter({type:'dataURL'});assert.equal(await chosen.toOutput(art),dataURL);assert.equal(await chosen.outPut(art),dataURL); // Explicit deprecated alias compatibility example.\n  const png=await p.save(art,{directory:OUT,filename:'19-output.png',naming:'custom',format:'png',overwrite:true});\n  const set=await p.saveMultiple([art,master],{directory:OUT,prefix:'19-delivery-',naming:'counter',counterStart:1,format:'webp',quality:86,overwrite:true});\n  return [path.basename(png.path),...set.map(x=>path.basename(x.path)),await json('19-output-formats.json',{pngBytes:art.length,base64Characters:base64.length,blobType:blob.type,arrayBufferBytes:arrayBuffer.byteLength,configuredType:chosen.outputFormat.type,byteEquivalence:true})];\n}\n"
  },
  {
    "id": "peak-lab-20-runtime",
    "title": "Peak Lab 20 · The render flight recorder",
    "description": "Policy resolution, configured limits, diagnostics, explicit preflight and structured failures are presented as a runtime instrument panel. **Peak Lab project recipe:** this source is shown verbatim from `examples/20-runtime.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Runtime",
    "sourceFile": "examples/20-runtime.mjs",
    "primaryLens": "advanced",
    "lenses": [
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#16121f",
      "#5e183e",
      "#f1ba63"
    ],
    "variant": 19,
    "source": "import * as Apex from 'apexify.js';\nimport {p,C,txt,font,textLayer,images,rect,scene,save,json,heading} from '../shared/studio.mjs';\nexport const meta={id:'20',title:'The render flight recorder',category:'Runtime',description:'Policy resolution, configured limits, diagnostics, explicit preflight and structured failures are presented as a runtime instrument panel.'};\nexport async function run(){\n  const defaults=Apex.getDefaultApexifyRuntimeConfig(),resolved=Apex.resolveApexifyRuntimeConfig({limits:{maxBatchConcurrency:2}}),events=[],failures=[];\n  const record=async(label,fn)=>{try{await fn();throw new Error(`Expected failure: ${label}`);}catch(error){if(!(error instanceof Apex.ApexifyError))throw error;failures.push({label,class:error.constructor.name,code:error.code,message:error.message});}};\n  try{\n    Apex.configureApexifyRuntime({diagnostics:{handler:event=>events.push({code:event.code,level:event.level})},cache:{maxEntries:32}});\n    await record('Invalid dimensions',()=>p.createCanvas({width:0,height:120}));\n    await record('Invalid configuration',()=>Apex.resolveApexifyRuntimeConfig({cache:{maxEntries:-1}}));\n    Apex.configureApexifyRuntime({limits:{maxTotalPixels:10000}});\n    await record('Pixel budget',()=>p.createCanvas({width:200,height:200}));\n    Apex.configureApexifyRuntime({limits:{maxTotalPixels:defaults.limits.maxTotalPixels}});\n    await record('Invalid image',()=>p.createImage({source:Buffer.from('not a PNG'),x:0,y:0},Buffer.from('not a PNG')));\n    await record('Missing asset',()=>p.assets.resolve('does_not_exist'));\n  }finally{Apex.resetApexifyRuntimeConfig();Apex.configureApexifyRuntime(defaults);}\n  const layers=heading('20 / RUNTIME CONTROL','The render flight recorder','Configuration is executable policy. These failures were produced and classified by the real API.');\n  failures.forEach((f,i)=>{const y=260+i*124;layers.push(images(rect(64,y,1312,101,i%2?'#e6e4dc':'#ebe9e1',{borderRadius:12})),textLayer(txt(String(i+1).padStart(2,'0'),87,y+21,34,C.red,{font:font(34,'mono')}),txt(f.label,169,y+19,27,C.ink,{font:font(27,'bold')}),txt(f.code,169,y+59,15,C.muted,{font:font(15,'mono')}),txt(f.class,819,y+35,19,C.ink,{font:font(19,'mono')})));});\n  const errorTypes=['ApexifyError','ApexifyInputError','ApexifyConfigError','ApexifyResourceLimitError','ApexifyRemoteFetchError','ApexifyDecodeError','ApexifyProcessError','ApexifyExternalServiceError','ApexifyAssetError','ApexifyPluginError'];\n  return [await save('20-runtime.png',await scene(1440,980,layers)),await json('20-runtime-report.json',{failures,events,resolvedConcurrency:resolved.limits.maxBatchConcurrency,defaultPixelBudget:Apex.DEFAULT_APEXIFY_RUNTIME_CONFIG.limits.maxTotalPixels,errorTypes})];\n}\n"
  },
  {
    "id": "peak-lab-21-audio",
    "title": "Peak Lab 21 · Signal archive",
    "description": "Stereo generative music, layered oscillators, ADSR, harmonics, noise, filters, panning, mixing, sequencing, composition and every sound preset. **Peak Lab project recipe:** this source is shown verbatim from `examples/21-audio.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Audio",
    "sourceFile": "examples/21-audio.mjs",
    "primaryLens": "motion",
    "lenses": [
      "motion",
      "advanced"
    ],
    "featured": true,
    "colors": [
      "#0d1725",
      "#173f47",
      "#5088ff"
    ],
    "variant": 20,
    "source": "import {p,C,txt,font,textLayer,line,scene,save,json,heading,OUT} from '../shared/studio.mjs';\nimport {waveform,parseWav} from '../shared/wav.mjs';\nimport path from 'node:path';\nexport const meta={id:'21',title:'Signal archive',category:'Audio',description:'Stereo generative music, layered oscillators, ADSR, harmonics, noise, filters, panning, mixing, sequencing, composition and every sound preset.'};\nexport async function run(){\n  const synth=p.createAudio;\n  const pad=synth.synth({sampleRate:44100,channels:2,duration:8,seed:'peak-pad',masterGain:.5,layers:[\n    {waveform:'sine',frequency:110,duration:8,gain:.3,pan:-.5,partials:[[1,1],[2,.2],[3,.09]],adsr:{attack:1.2,decay:.4,sustain:.7,release:1.5},tremolo:{depth:.2,rate:.4}},\n    {waveform:'triangle',frequency:164.81,duration:8,gain:.16,pan:.6,detune:4,filter:{type:'lowpass',cutoff:1900},adsr:{attack:1.8,sustain:.65,release:1.5}},\n    {waveform:'pink',duration:8,gain:.025,filter:{type:'lowpass',cutoff:1200},adsr:{attack:2,sustain:.5,release:1.5}}\n  ]});\n  const noteOptions=frequency=>({channels:2,sampleRate:44100,layers:[{waveform:'sine',frequency,duration:.8,gain:.32,partials:[[1,1],[2,.15],[4,.035]],vibrato:{depth:1.3,rate:5.5},adsr:{attack:.005,decay:.2,sustain:.15,release:.5}}]});\n  const notes=[220,329.63,440,493.88,659.25,493.88,440,329.63];\n  const sequence=synth.sequence({sampleRate:44100,channels:2,seed:79,tail:.2,events:Array.from({length:24},(_,i)=>({at:i*.3,options:noteOptions(notes[i%8]),gain:.7}))});\n  const click=synth.custom({channels:2,sampleRate:44100,seed:'pulse',layers:[{waveform:'noise',duration:.07,gain:.08,filter:{type:'highpass',cutoff:4500},adsr:{attack:.001,decay:.02,sustain:0,release:.045}}]});\n  const accent=synth.preset('sparkle',{channels:2,sampleRate:44100,volume:.18,transpose:-5,seed:5});\n  const mix=synth.mix([{wav:pad,at:0,gain:.8},{wav:sequence,at:0,gain:.85}],{channels:2,sampleRate:44100,masterGain:.85,seed:'mix'});\n  const soundtrack=synth.compose({channels:2,sampleRate:44100,duration:8,seed:'final',masterGain:.9,clips:[{wav:mix,at:0,fadeIn:.12,fadeOut:1},{wav:accent,at:3.2,pan:.65,gain:.7},...Array.from({length:16},(_,i)=>({wav:click,at:i*.45,pan:i%2?.7:-.7,fadeOut:.03}))]});\n  await synth.save(soundtrack,path.join(OUT,'21-signal-archive.wav'));\n  const layers=heading('21 / PROCEDURAL AUDIO','Signal archive','Eight seconds of original stereo synthesis, built from oscillators, envelopes and a deterministic score.',C.paper);\n  for(let ch=0;ch<2;ch++){\n    const path=waveform(soundtrack,960,ch).flatMap((bin,i)=>[{type:'moveTo',x:90+i*1.28,y:410+ch*300-bin.max*135},{type:'lineTo',x:90+i*1.28,y:410+ch*300-bin.min*135}]);\n    layers.push({type:'path',path,options:{stroke:{color:ch?C.gold:C.teal,width:1}}});\n    layers.push(textLayer(txt(ch?'RIGHT CHANNEL':'LEFT CHANNEL',64,255+ch*300,16,C.paper,{font:font(16,'mono')})));\n  }\n  const files=['21-signal-archive.wav',await save('21-audio.png',await scene(1440,950,layers,{colorBg:C.night}))],presets=synth.listPresets(),presetLayers=heading('21 / PRESET COLLECTION','The complete sound palette',`${synth.presetNames.length} procedural sound identities. Every waveform below comes from an actual generated WAV.`);\n  for(let i=0;i<presets.length;i++){\n    const preset=presets[i],wav=synth.preset(preset.name,{seed:79,volume:.65});const x=64+i%3*450,y=252+Math.floor(i/3)*132;\n    presetLayers.push(textLayer(txt(preset.name,x,y,18,C.ink,{font:font(18,'mono')})));\n    waveform(wav,395).forEach((bin,j)=>presetLayers.push(line([[x+j,y+66-bin.max*30],[x+j,y+66-bin.min*30]],i%2?C.red:'#137a69',1)));\n    files.push(await save(`21-preset-${preset.name}.wav`,wav));\n  }\n  // Preset waveforms are rendered in row strips to remain below scene-layer budgets.\n  // Collapse the dense line list to reusable paths before rendering.\n  const compact=[];let commands=[];\n  for(const layer of presetLayers){if(layer.type==='path'&&layer.path.length===2){commands.push(...layer.path);}else{if(commands.length){compact.push({type:'path',path:commands,options:{stroke:{color:'#137a69',width:1}}});commands=[];}compact.push(layer);}}\n  if(commands.length)compact.push({type:'path',path:commands,options:{stroke:{color:'#137a69',width:1}}});\n  files.push(await save('21-audio-presets.png',await scene(1440,270+Math.ceil(presets.length/3)*132,compact)));\n  const {data,...analysis}=parseWav(soundtrack);files.push(await json('21-audio-analysis.json',{...analysis,presets}));return files;\n}\n"
  },
  {
    "id": "peak-lab-22-streaming-gif",
    "title": "Peak Lab 22 · Orbital resonance",
    "description": "A seamless 48-frame loop supplied as an AsyncIterable. Apexify requests, renders and encodes each frame before asking for the next. **Peak Lab project recipe:** this source is shown verbatim from `examples/22-streaming-gif.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "GIF",
    "sourceFile": "examples/22-streaming-gif.mjs",
    "primaryLens": "motion",
    "lenses": [
      "motion"
    ],
    "featured": true,
    "colors": [
      "#101820",
      "#4d294e",
      "#ee593b"
    ],
    "variant": 21,
    "source": "import {p,save,json} from '../shared/studio.mjs';\nimport {renderMotion} from '../shared/motion.mjs';\nexport const meta={id:'22',title:'Orbital resonance',category:'GIF',description:'A seamless 48-frame loop supplied as an AsyncIterable. Apexify requests, renders and encodes each frame before asking for the next.'};\nexport async function run(){\n  const count=48,width=640,height=360;let produced=0;\n  async function* frames(){for(let i=0;i<count;i++){produced++;yield {buffer:await renderMotion(i/count,width,height),duration:80};}}\n  const result=await p.createGIF(undefined,{outputFormat:'buffer',width,height,repeat:0,quality:5,delay:80,frameCount:count,onStart:async()=>frames(),skipResizeWhenDimensionsMatch:true});\n  return [await save('22-streaming-gif.gif',result),await save('22-gif-poster.png',await renderMotion(.22,width,height)),await json('22-gif-report.json',{produced,width,height,frameDurationMs:80,durationSeconds:count*.08,source:'AsyncIterable'})];\n}\n"
  },
  {
    "id": "peak-lab-23-animate",
    "title": "Peak Lab 23 · The kinetic loom",
    "description": "animate() drives a native drawing callback to weave a moving polar lattice. The callback is the API’s explicit custom-drawing extension. **Peak Lab project recipe:** this source is shown verbatim from `examples/23-animate.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Animation",
    "sourceFile": "examples/23-animate.mjs",
    "primaryLens": "motion",
    "lenses": [
      "motion"
    ],
    "featured": false,
    "colors": [
      "#0f172a",
      "#1e3a5f",
      "#bda5ff"
    ],
    "variant": 22,
    "source": "import {p,C,save,json,OUT,TAU} from '../shared/studio.mjs';\nimport path from 'node:path';\nexport const meta={id:'23',title:'The kinetic loom',category:'Animation',description:'animate() drives a native drawing callback to weave a moving polar lattice. The callback is the API’s explicit custom-drawing extension.'};\nexport async function run(){\n  const width=640,height=480,count=40,callbacks=[];\n  const frames=Array.from({length:count},(_,frame)=>({backgroundColor:C.night,duration:80,width,height,onDrawCustom(ctx){\n    const phase=frame/count*TAU;ctx.translate(width/2,height/2);\n    for(let i=0;i<90;i++){\n      const a=i/90*TAU,rad=155+Math.sin(a*6+phase)*22;\n      const b=a+1.8+.25*Math.sin(phase),end=170+Math.cos(b*4-phase)*20;\n      ctx.beginPath();ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);\n      ctx.bezierCurveTo(Math.cos(a+phase)*40,Math.sin(a+phase)*40,Math.cos(b-phase)*60,Math.sin(b-phase)*60,Math.cos(b)*end,Math.sin(b)*end);\n      ctx.strokeStyle=i%4?`rgba(54,217,180,0.3)`:'rgba(241,186,99,0.8)';ctx.lineWidth=i%4?1:1.7;ctx.stroke();\n    }\n    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.paper;ctx.font='16px monospace';ctx.fillText('KINETIC LOOM / APEXIFY',24,33);\n  }}));\n  const paths=await p.animate(frames,80,width,height,{onStart:()=>callbacks.push('start'),onFrame:i=>callbacks.push(i),onEnd:()=>callbacks.push('end')});\n  const result=await p.createGIF(paths.map(buffer=>({buffer,duration:80})),{outputFormat:'buffer',width,height,repeat:0,quality:5});\n  return [await save('23-animate.gif',result),await save('23-animate-poster.png',paths[8]),await json('23-animate-callbacks.json',callbacks)];\n}\n"
  },
  {
    "id": "peak-lab-24-film",
    "title": "Peak Lab 24 · Orbital / the short film",
    "description": "Scene-to-video, scene-to-GIF, explicit frame production, soundtrack mixing, timed typography, editable pipeline history and frame extraction. **Peak Lab project recipe:** this source is shown verbatim from `examples/24-film.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Video",
    "sourceFile": "examples/24-film.mjs",
    "primaryLens": "motion",
    "lenses": [
      "motion",
      "advanced"
    ],
    "featured": true,
    "colors": [
      "#111827",
      "#374151",
      "#f59e0b"
    ],
    "variant": 23,
    "source": "import {p,C,txt,font,save,json,read,OUT} from '../shared/studio.mjs';\nimport {motionScene,renderMotion} from '../shared/motion.mjs';\nimport {run as audioRecipe} from './21-audio.mjs';\nimport {access} from 'node:fs/promises';\nimport path from 'node:path';\nexport const meta={id:'24',title:'Orbital / the short film',category:'Video',description:'Scene-to-video, scene-to-GIF, explicit frame production, soundtrack mixing, timed typography, editable pipeline history and frame extraction.'};\nexport async function run(){\n  try{await access(path.join(OUT,'21-signal-archive.wav'));}catch{await audioRecipe();}\n  const fps=24,count=144,width=960,height=540,frames=[];\n  for(let i=1;i<count;i++)frames.push(await renderMotion(i/count,width,height));\n  const raw=path.join(OUT,'24-motion-source.mp4');\n  await p.renderSceneToVideoFrames(motionScene(0,width,height),{options:{source:frames[0],createFromFrames:{frames,outputPath:raw,fps,quality:'high',format:'mp4'}}});\n  const sceneGif=await p.renderSceneToGIF(motionScene(0,480,270),{options:{outputFormat:'buffer',width:480,height:270,repeat:0,delay:200,quality:5},gifFrames:await Promise.all([.15,.3,.45,.6,.75,.9].map(async t=>({buffer:await renderMotion(t,480,270),duration:200}))),composedFrameDuration:200});\n  const pipeline=p.videoPipeline(raw);\n  pipeline.trim(0,6,'final-duration');\n  pipeline.text({...txt('A FIELD IN MOTION',40,471,19,C.paper,{font:font(19,'mono')}),startTime:.2,endTime:5.7,transitionIn:{type:'fade',duration:.5},transitionOut:{type:'fade',duration:.5}},'closing-line');\n  pipeline.audio({type:'file',source:path.join(OUT,'21-signal-archive.wav'),startTime:0,duration:6,volume:.75,fadeOut:1.2},{keepOriginalAudio:false,durationPolicy:'video'},'score');\n  const canUndo=pipeline.canUndo();pipeline.undo();const canRedo=pipeline.canRedo();pipeline.redo();\n  const snapshot=pipeline.toJSON();\n  const outputPath=path.join(OUT,'24-film.mp4');\n  const result=await pipeline.render({outputPath,preset:'export',overwrite:true});\n  const info=await p.getVideoInfo(outputPath);\n  const single=await p.extractFrameAtTime(outputPath,2.5,'png'),numbered=await p.extractFrameByNumber(outputPath,49,'png'),multiple=await p.extractMultipleFrames(outputPath,[1,3,5],'png');\n  const interval=await p.extractFrames(outputPath,{interval:2000,outputDirectory:path.join(OUT,'24-interval-frames'),outputFormat:'png'});\n  const all=await p.extractAllFrames(outputPath,{startTime:0,endTime:.125,outputDirectory:path.join(OUT,'24-first-frames'),outputFormat:'png'});\n  const edit=p.videoPipeline().source(raw);edit.pushLayer({kind:'trim',id:'working-trim',startTime:0,endTime:4}).removeLayer('working-trim');edit.splice({targetStartTime:1,targetEndTime:1.5,replacementFrames:[frames[0]],replacementFps:2},'insert').clearLayers('splice');\n  const rebuilt=p.videoPipeline(undefined,snapshot.layers);const restored=rebuilt.getLayers().length;\n  return ['24-film.mp4','24-motion-source.mp4',await save('24-scene.gif',sceneGif),await save('24-film-poster.png',single),await save('24-frame-49.png',numbered),...await Promise.all(multiple.map((buf,i)=>save(`24-frame-at-${[1,3,5][i]}s.png`,buf))),await json('24-film-report.json',{info,result,history:{canUndo,canRedo,restoredLayers:restored},intervalFrames:interval.length,firstFrames:all.length}),await json('24-pipeline.json',snapshot)];\n}\n"
  },
  {
    "id": "peak-lab-25-video-workbench",
    "title": "Peak Lab 25 · The complete video workbench",
    "description": "Concrete recipes for every createVideo operation, using a generated source film, a generated LUT and a local soundtrack. **Peak Lab project recipe:** this source is shown verbatim from `examples/25-video-workbench.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Video",
    "sourceFile": "examples/25-video-workbench.mjs",
    "primaryLens": "motion",
    "lenses": [
      "motion",
      "advanced"
    ],
    "featured": false,
    "colors": [
      "#07111f",
      "#103f4a",
      "#36d9b4"
    ],
    "variant": 24,
    "source": "import {p,C,txt,font,images,rect,textLayer,scene,save,json,heading,read,OUT} from '../shared/studio.mjs';\nimport {run as filmRecipe} from './24-film.mjs';\nimport {access,mkdir,writeFile,readFile} from 'node:fs/promises';\nimport path from 'node:path';\nexport const meta={id:'25',title:'The complete video workbench',category:'Video',description:'Concrete recipes for every createVideo operation, using a generated source film, a generated LUT and a local soundtrack.'};\nexport async function run(){\n  const source=path.join(OUT,'24-film.mp4');try{await access(source);}catch{await filmRecipe();}\n  const dir=path.join(OUT,'25-video');await mkdir(dir,{recursive:true});\n  const output=name=>path.join(dir,`${name}.mp4`),poster=await p.extractFrameAtTime(source,1,'png');\n  const logo=await scene(260,70,[textLayer(txt('APEXIFY / 079',16,20,25,C.paper,{font:font(25,'bold')}))],{colorBg:C.ink,borderRadius:16});await save('25-watermark.png',logo);\n  const lutPath=path.join(dir,'warm.cube');const cube=['TITLE \"Peak warm grade\"','LUT_3D_SIZE 2','DOMAIN_MIN 0 0 0','DOMAIN_MAX 1 1 1'];for(let b=0;b<2;b++)for(let g=0;g<2;g++)for(let r=0;r<2;r++)cube.push(`${Math.min(1,r*.95+.04)} ${g*.96} ${b*.88}`);await writeFile(lutPath,cube.join('\\n')+'\\n');\n  const cases=[\n    ['getInfo',true],['detectFormat',true],\n    ['extractFrame',{time:1,outputFormat:'png'}],\n    ['extractFrames',{times:[.5,1.5,2.5],outputFormat:'png'}],\n    ['extractAllFrames',{startTime:0,endTime:.13,outputDirectory:path.join(dir,'all-frames'),outputFormat:'png'}],\n    ['generateThumbnail',{count:6,grid:{cols:3,rows:2},width:320,height:180,outputFormat:'png'}],\n    ['generatePreview',{count:3,outputDirectory:path.join(dir,'preview'),outputFormat:'png'}],\n    ['convert',{format:'mp4',videoCodec:'libx264',audioCodec:'aac',fps:24,resolution:{width:640,height:360,fit:'contain'},outputPath:output('convert')}],\n    ['trim',{startTime:.5,endTime:3.5,mode:'accurate',outputPath:output('trim')}],\n    ['extractAudio',{format:'wav',outputPath:path.join(dir,'extracted.wav')}],\n    ['addWatermark',{watermarkPath:logo,position:'bottom-right',opacity:.75,size:{width:180,height:48},marginX:24,marginY:24,outputPath:output('watermark')}],\n    ['changeSpeed',{speed:1.5,outputPath:output('speed')}],\n    ['applyEffects',{filters:[{type:'contrast',value:1.12},{type:'saturation',value:.7}],outputPath:output('effects')}],\n    ['merge',{videos:[source,source],mode:'sequential',audioPolicy:'preserve',outputPath:output('merge')}],\n    ['replaceSegment',{targetStartTime:2,targetEndTime:3,replacementFrames:[poster],replacementFps:1,durationPolicy:'fit',outputPath:output('replace-segment')}],\n    ['rotate',{angle:180,outputPath:output('rotate')}],\n    ['crop',{x:160,y:90,width:640,height:360,outputPath:output('crop')}],\n    ['compress',{quality:'medium',maxBitrate:1000,outputPath:output('compressed')}],\n    ['addText',{text:'LEGACY CAPTION EXAMPLE',position:'bottom-center',fontSize:24,startTime:1,endTime:4,outputPath:output('legacy-text')}],\n    ['addFade',{fadeIn:.6,fadeOut:.8,outputPath:output('fade')}],\n    ['reverse',{outputPath:output('reverse')}],\n    ['createLoop',{smooth:false,outputPath:output('loop')}],\n    ['batch',{videos:[{source,operations:{trim:{startTime:0,endTime:1}}},{source,operations:{rotate:{angle:90}}}],outputDirectory:path.join(dir,'batch')}],\n    ['detectScenes',{threshold:.3,outputPath:path.join(dir,'detected-scenes.json')}],\n    ['stabilize',{smoothing:10,outputPath:output('stabilize')}],\n    ['colorCorrect',{brightness:.02,contrast:1.05,saturation:1.1,hue:10,temperature:.2,outputPath:output('colour-grade')}],\n    ['pictureInPicture',{overlayVideo:source,position:'bottom-right',size:{width:280,height:158},opacity:.8,outputPath:output('pip')}],\n    ['splitScreen',{videos:[source,source],layout:'side-by-side',audioPolicy:'first',outputPath:output('split')}],\n    ['createTimeLapse',{speed:3,outputPath:output('timelapse')}],\n    ['removeAudio',{outputPath:output('silent')}],\n    ['mixAudio',{overlays:[{source:path.join(OUT,'21-signal-archive.wav'),startTime:0,volume:.35,fadeOut:.5}],keepOriginalAudio:true,originalVolume:.5,durationPolicy:'video',outputPath:output('audio-mix')}],\n    ['mute',{ranges:[{start:1,end:2}],outputPath:output('mute-range')}],\n    ['adjustVolume',{volume:.8,ranges:[{start:1,end:2,volume:.2}],outputPath:output('volume')}],\n    ['createFromFrames',{frames:[poster,poster,poster],fps:2,quality:'high',outputPath:output('frames')}],\n    ['freezeFrame',{time:2,duration:.8,outputPath:output('freeze')}],\n    ['exportPreset',{preset:'web',outputPath:path.join(dir,'web-export.webm')}],\n    ['normalizeAudio',{targetLevel:-16,method:'lufs',outputPath:output('normalised')}],\n    ['applyLUT',{lutPath,intensity:1,outputPath:output('lut')}],\n    ['addTransition',{type:'dissolve',duration:.5,secondVideo:source,outputPath:output('transition')}],\n    ['addTextOverlay',{overlays:[{...txt('SYNTHETIC SIGNAL',42,260,38,C.paper,{font:font(38,'bold')}),startTime:.3,endTime:4,transitionIn:{type:'slideUp',duration:.5},transitionOut:{type:'fade',duration:.5}}],outputPath:output('timed-type')}],\n    ['addAnimatedText',{text:'LEGACY MOTION',animation:'slideIn',startTime:.3,endTime:4,position:{x:40,y:280},fontSize:28,outputPath:output('legacy-animated-text')}]\n  ];\n  const report=[],files=[];\n  for(const [operation,options] of cases){\n    const begin=performance.now();\n    try{\n      const result=await p.createVideo({source,[operation]:options,timeoutMs:90000,overwrite:true});\n      let info;\n      if(/\\.(mp4|webm)$/.test(options?.outputPath ?? '')){info=await p.getVideoInfo(options.outputPath);files.push(path.relative(OUT,options.outputPath));}\n      if(operation==='generateThumbnail'){const buffer=Buffer.isBuffer(result)?result:result.buffer;if(buffer)files.push(await save('25-thumbnail-sheet.png',buffer));}\n      report.push({operation,status:'passed',seconds:Math.round((performance.now()-begin)/10)/100,...(info?{duration:info.duration,width:info.width,height:info.height,audio:info.audio}:{})});\n    }catch(error){\n      report.push({operation,status:'failed',error:error.message,code:error.code,cause:error.cause?.message});\n      console.error(`25 / ${operation}: ${error.message}`);\n    }\n  }\n  const layers=heading('25 / MEDIA OPERATIONS','The complete video workbench','Each row records a real call. Failures stay visible in the accompanying report.');\n  for(let i=0;i<report.length;i++){const item=report[i],x=64+i%3*450,y=247+Math.floor(i/3)*73;layers.push(images(rect(x,y,414,55,item.status==='passed'?'#e1eadf':'#f8d8cf',{borderRadius:8})),textLayer(txt(item.status==='passed'?'OK':'ERR',x+13,y+17,16,item.status==='passed'?'#178574':C.red,{font:font(16,'mono')}),txt(item.operation,x+67,y+17,16,C.ink,{font:font(16,'mono')})));}\n  files.unshift(await save('25-video-workbench.png',await scene(1440,280+Math.ceil(report.length/3)*73,layers)));files.push(await json('25-video-operations.json',report));return files;\n}\n"
  },
  {
    "id": "peak-lab-26-capstone",
    "title": "Peak Lab 26 · Aster / a city made of signals",
    "description": "A dense procedural isometric city combines painter-created polygon geometry, deterministic data, nested panels, charts, typography and component layers. This is 2.5D projection, not a 3D engine. **Peak Lab project recipe:** this source is shown verbatim from `examples/26-capstone.mjs` and uses the collection’s shared helpers/assets, so it is read-only in Gallery rather than a one-file runner snippet.",
    "sourceCategory": "Capstone",
    "sourceFile": "examples/26-capstone.mjs",
    "primaryLens": "composition",
    "lenses": [
      "composition",
      "data",
      "advanced"
    ],
    "featured": true,
    "colors": [
      "#16121f",
      "#5e183e",
      "#f1ba63"
    ],
    "variant": 25,
    "source": "import {p,C,txt,font,textLayer,images,rect,circle,line,linear,scene,save,json,heading,rng} from '../shared/studio.mjs';\nimport {chartOptions,series} from '../shared/charts.mjs';\nexport const meta={id:'26',title:'Aster / a city made of signals',category:'Capstone',description:'A dense procedural isometric city combines painter-created polygon geometry, deterministic data, nested panels, charts, typography and component layers. This is 2.5D projection, not a 3D engine.'};\nexport async function run(){\n  const width=1800,height=1280,n=24,m=22,random=rng(1979),layers=[];\n  const project=(x,y,z=0)=>({x:766+(x-y)*24,y:338+(x+y)*12-z});\n  const polygon=(points,color,stroke)=>({type:'path',path:[{type:'polygon',points}],options:{fill:{color},...(stroke?{stroke:{color:stroke,width:.7}}:{})}});\n  layers.push(polygon([project(-1,-1),project(n+1,-1),project(n+1,m+1),project(-1,m+1)],'#cbded6'));\n  for(let x=0;x<=n;x++)layers.push(line([Object.values(project(x,0)),Object.values(project(x,m))],'#ebeee5',1));\n  for(let y=0;y<=m;y++)layers.push(line([Object.values(project(0,y)),Object.values(project(n,y))],'#ebeee5',1));\n  let buildings=0;\n  for(let diagonal=0;diagonal<n+m;diagonal++)for(let x=0;x<n;x++){\n    const y=diagonal-x;if(y<0||y>=m||x%7===0||y%6===0)continue;\n    const hill=Math.exp(-((x-13)**2+(y-10)**2)/95),z=18+hill*145+random()*47;\n    const a=project(x+.13,y+.13),b=project(x+.87,y+.13),c=project(x+.87,y+.87),d=project(x+.13,y+.87);\n    const at=project(x+.13,y+.13,z),bt=project(x+.87,y+.13,z),ct=project(x+.87,y+.87,z),dt=project(x+.13,y+.87,z);\n    const hero=hill>.72&&random()>.57;\n    layers.push(polygon([bt,b,c,ct],hero?'#a53d36':'#397f7a'),polygon([dt,ct,c,d],hero?'#d96d43':'#6eaaa0'),polygon([at,bt,ct,dt],hero?'#ffcb7e':'#c3ead4','#99beae'));\n    if(z>135&&buildings%4===0){const top=project(x+.5,y+.5,z);layers.push(line([[top.x,top.y],[top.x,top.y-18]],'#304e4d',1),images(circle(top.x,top.y-19,2,C.red)));}\n    buildings++;\n  }\n  const baseCity=await scene(width,height,layers,{colorBg:C.paper});\n  const curve=[series('Demand',C.red,t=>42+Math.sin(t*.32)*24+t*.5,24),series('Renewables','#138878',t=>54+Math.sin(t*.27-1)*21,24)];\n  const chart=await p.createChart('line',curve,{...chartOptions('24 HOUR ENERGY PROFILE',390,300),axes:{x:{color:C.muted,range:{min:0,max:24,step:6}},y:{color:C.muted,range:{min:0,max:100,step:25}}},legend:{show:false}});\n  const annotation=[...heading('26 / APEXIFY INTEGRATED SHOWCASE','Aster / a city made of signals','An original procedural city, generated entirely through the public Node APIs.',C.ink,width),\n    {type:'imageBuffer',buffer:chart,x:1340,y:620,width:395,height:300},\n    textLayer(txt('SYNTHETIC\\nURBAN SYSTEM',1349,290,25,C.ink,{font:font(25,'bold'),layout:{lineHeight:1.2}}),txt(String(buildings),1343,378,104,C.red,{font:font(104,'bold')}),txt('PROCEDURAL BUILDINGS',1350,495,15,C.muted,{font:font(15,'mono')}),txt('A 24 × 22 spatial field, projected\\ninto two dimensions. Every roof,\\nwall, street and signal is code.',1350,540,17,C.ink,{layout:{lineHeight:1.6}}),txt('FORM FOLLOWS DATA.',64,1138,46,C.ink,{font:font(46,'serif')}),txt('APEXIFY / PEAK LAB / 026',64,1220,16,C.muted,{font:font(16,'mono')})),\n    ...p.components.progressBar.toLayers({x:1350,y:966,width:365,height:16,value:78,max:100,fill:'#168c78',background:'#d7ddd4',radius:6}),textLayer(txt('SIMULATED RENEWABLE SHARE',1350,930,13,C.muted,{font:font(13,'mono')}),txt('78%',1350,1009,61,'#168c78',{font:font(61,'bold')}))\n  ];\n  const final=await scene(width,height,[{type:'imageBuffer',buffer:baseCity,x:0,y:0},...annotation]);\n  return [await save('26-capstone.png',final),await json('26-city-metadata.json',{buildings,grid:{x:n,y:m},projection:'2.5D isometric, generated application geometry',data:'synthetic',apis:['renderScene','createChart','components.progressBar.toLayers']})];\n}\n"
  }
];

export const peakLabGalleryItems: PeakLabGalleryCard[] = definitions.map((def) => ({
  id: def.id,
  title: def.title,
  description: def.description,
  category: 'advance',
  primaryLens: def.primaryLens,
  lenses: def.lenses,
  featured: def.featured,
  peakLab: true,
  sourceCategory: def.sourceCategory,
  sourceFile: def.sourceFile,
  thumbnail: previewSvg(def),
  executionMode: 'none',
  code: { js: def.source },
}));
