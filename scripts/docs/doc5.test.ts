import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { exampleDefinitions } from '../../lib/examples/definitions';
import { stableSourceHash } from '../../lib/examples/hash';
import { validateExampleDefinitions } from '../../lib/examples/validation';
import { BROWSER_EXAMPLE_RUNTIME_STATUS } from '../../lib/examples/browser-runner-contract';

const root=process.cwd();
const docs=new Set(['/docs/getting-started','/docs/node/canvas']);
const apiIds=new Set(exampleDefinitions.flatMap((e)=>e.apiSymbols));
const files=new Set(exampleDefinitions.flatMap((e)=>e.sourceFiles));
const clone=()=>structuredClone(exampleDefinitions) as unknown as typeof exampleDefinitions;

test('DOC-5 representative definitions validate',()=>assert.doesNotThrow(()=>validateExampleDefinitions(exampleDefinitions,{docs,apiIds,files})));
test('duplicate stable IDs fail',()=>{const items=clone() as any;items[1].id=items[0].id;assert.throws(()=>validateExampleDefinitions(items,{docs,apiIds,files}),/duplicate example ID/);});
test('invalid runtime/difficulty/output fail',()=>{for(const [key,value] of [['runtime','browser'],['difficulty','easy'],['outputType','canvas']] as const){const items=clone() as any;items[0][key]=value;assert.throws(()=>validateExampleDefinitions(items,{docs,apiIds,files}));}});
test('missing source, docs and API references fail',()=>{const items=clone() as any;items[0].sourceFiles=['examples/node/nope.ts'];items[0].entrypoint=items[0].sourceFiles[0];assert.throws(()=>validateExampleDefinitions(items,{docs,apiIds,files}),/missing source file/);const items2=clone() as any;items2[0].relatedDocs=['/docs/nope'];assert.throws(()=>validateExampleDefinitions(items2,{docs,apiIds,files}),/unknown relatedDocs/);const items3=clone() as any;items3[0].apiSymbols=['nope'];assert.throws(()=>validateExampleDefinitions(items3,{docs,apiIds,files}),/unknown DOC-4 API/);});
test('source hashing is order-stable and content-sensitive',()=>{const a=[{path:'b',content:'2'},{path:'a',content:'1'}],b=[...a].reverse(),c=[{path:'b',content:'3'},{path:'a',content:'1'}];assert.equal(stableSourceHash(a),stableSourceHash(b));assert.notEqual(stableSourceHash(a),stableSourceHash(c));});
test('future browser runner remains contract-only',()=>assert.equal(BROWSER_EXAMPLE_RUNTIME_STATUS.available,false));
test('authoritative sources exist under examples/node only',()=>{for(const e of exampleDefinitions)for(const source of e.sourceFiles){assert.equal(source.startsWith('examples/node/'),true);assert.equal(fs.existsSync(path.join(root,source)),true);}});
