import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankDocument,validateDocument} from '../../features/apex-workspace/model';
import {generateSource,parseSource} from '../../features/apex-workspace/codegen';

test('original pinned combined workspace parses exactly generated Code',()=>{
 const doc=validateDocument(createBlankDocument());
 assert.deepEqual(parseSource(generateSource(doc)),doc);
});
test('Code-to-Visual refuses arbitrary executable tail instead of silently reconciling',()=>{
 const valid=generateSource(validateDocument(createBlankDocument()));
 assert.throws(()=>parseSource(valid+'\nprocess.exit(1);\n'),/Changes outside composition data cannot be reconciled with Visual/);
});
test('Code-to-Visual rejects missing composition and cannot silently construct model',()=>{
 assert.throws(()=>parseSource('const painter = malicious();'),/Keep the composition declaration/);
});
test('Code-to-Visual rejects malformed composition with a valid source preamble',()=>{
 const valid=generateSource(validateDocument(createBlankDocument()));
 assert.throws(()=>parseSource(valid.replace('const composition = {','const composition = {"unexpectedField":true,')),/Unknown|unexpected|not allowed|unrecognized|Invalid|not permitted|Changes outside composition data/);
});
