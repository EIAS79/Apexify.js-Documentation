import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DOC3_REQUIRED_COMPONENTS, DOC3_REGISTERED_COMPONENTS } from '../../components/mdx/doc3-contract';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc3');
const checkOnly = process.argv.includes('--check');
const representativePages = ['content/docs/03-feature-guides/canvas/00-create-canvas-overview.mdx','content/docs/03-feature-guides/canvas/01-canvas-size-and-coordinates.mdx'];
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const usedComponents = (source: string) => DOC3_REGISTERED_COMPONENTS.filter((name) => new RegExp(`<${name}\\b`).test(source));
const componentManifest = { schemaVersion:1, phase:'DOC-3', required:DOC3_REQUIRED_COMPONENTS, registered:DOC3_REGISTERED_COMPONENTS, architecture:{ parser:'components/mdx/rich-parser.ts', renderer:'components/docs/route/RouteDocsMarkdown.tsx', serverComponents:'components/mdx/RichDocsComponents.tsx', interactiveIslands:['components/mdx/DocsTabs.tsx','components/mdx/CodeBlock.tsx'], compatibilityWrappers:['Alert','Dropdown','CodeSwitcher','CodeBlock'], expressionPolicy:'registered components only; brace expressions must parse as JSON; no arbitrary JavaScript evaluation' } };
const pageManifest = { schemaVersion:1, phase:'DOC-3', pages:representativePages.map((sourcePath)=>({sourcePath,usedComponents:usedComponents(read(sourcePath))})) };
const clientBoundaryManifest = { schemaVersion:1, phase:'DOC-3', staticComponents:DOC3_REQUIRED_COMPONENTS.filter((name)=>!['Tabs','CodeGroup','InstallCommand','CodeBlockV2','CodeDiff','ArchitectureDiagram'].includes(name)), interactiveIslands:{Tabs:'DocsTabs.tsx',codeControls:'CodeBlock.tsx'}, compatibility:{Alert:'server wrapper over Callout',Dropdown:'server wrapper over native Details',CodeSwitcher:'client compatibility wrapper over Tabs',CodeBlock:'existing code-control island reused by CodeBlockV2'} };
const files: Record<string, unknown> = {'component-manifest.json':componentManifest,'representative-pages.json':pageManifest,'client-boundaries.json':clientBoundaryManifest};
const serialized=(value:unknown)=>`${JSON.stringify(value,null,2)}\n`; const digest=(value:string)=>crypto.createHash('sha256').update(value).digest('hex');
files['index.json']={schemaVersion:1,phase:'DOC-3',artifacts:Object.entries(files).map(([file,value])=>({file,sha256:digest(serialized(value))}))};
fs.mkdirSync(OUT,{recursive:true}); let changed=false;
for (const [file,value] of Object.entries(files)) { const target=path.join(OUT,file); const next=serialized(value); const previous=fs.existsSync(target)?fs.readFileSync(target,'utf8'):null; if(previous!==next)changed=true; if(!checkOnly)fs.writeFileSync(target,next); }
if(checkOnly&&changed){console.error('[doc3-generate] generated/docs-doc3 is stale; run npm run docs:generate:doc3');process.exit(1);} console.log(`[doc3-generate] ${checkOnly?'verified':'wrote'} ${Object.keys(files).length} deterministic artifacts`);
