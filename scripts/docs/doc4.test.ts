import assert from 'node:assert/strict';
import test from 'node:test';
import { coverageFailures, extractDeclarationFixture, optionFragment } from './doc4-core';

test('extractor fixture covers classes/functions/interfaces/types/overloads/nested options',()=>{
  const source=`
    export interface Nested { family?: string; size?: number }
    export interface Options { width?: number; text?: { font?: Nested }; mode?: "contain" | "cover"; tuple?: [number,string]; list?: Nested[] }
    /** @deprecated old */
    export type Old = string;
    export enum Mode { A="a", B="b" }
    export function make(options?: Options): Promise<string>;
    export class Painter {
      render(input: string, options?: Options): Promise<Buffer>;
      render(input: Buffer, options?: Options): Promise<Buffer>;
    }
  `;
  const out=extractDeclarationFixture(source);
  assert.deepEqual(out.exports.map(x=>x.name),['make','Mode','Nested','Old','Options','Painter']);
  assert.equal(out.members.find(x=>x.name==='render')?.overloads,2);
  for(const path of ['options.width','options.text','options.text.font','options.text.font.family','options.text.font.size','options.list'])assert.ok(out.optionPaths.includes(path),path);
  assert.deepEqual(out.deprecated,['Old']);
});

test('option fragment is stable and nested',()=>{
  assert.equal(optionFragment('images.effects.vignette.intensity'),'option-images-effects-vignette-intensity');
});

test('coverage failure fixtures detect required drift classes',()=>{
  const failures=coverageFailures({
    publicExports:['apexify.js::A','apexify.js::B'],
    manifestExports:['apexify.js::A','apexify.js::Removed'],
    declaredOptionPaths:['options.real','options.nested.child'],
    documentedOptionPaths:['options.real','options.fake'],
    packedSignatures:{'apexify.js::A':'fn(a:string):void'},
    documentedSignatures:{'apexify.js::A':'fn(a:number):void'},
    relatedIds:['apexify.js::Missing'],
    knownIds:['apexify.js::A'],
  });
  for(const expected of ['missing-export:apexify.js::B','stale-export:apexify.js::Removed','missing-option:options.nested.child','stale-option:options.fake','signature-mismatch:apexify.js::A','unknown-related:apexify.js::Missing'])assert.ok(failures.includes(expected),expected);
});

test('duplicate/collision-safe fragments remain distinct for representative paths',()=>{
  const paths=['images.mask.mode','images.mask.source','images.effects.vignette.intensity','options.groupTransform','painterOpts.resolveAssetRefs'];
  assert.equal(new Set(paths.map(optionFragment)).size,paths.length);
});
