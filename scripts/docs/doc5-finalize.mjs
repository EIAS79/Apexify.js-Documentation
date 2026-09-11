import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const generated=path.join(root,'generated','docs-doc5');
const runtime=path.join(generated,'runtime');
const build=JSON.parse(fs.readFileSync(path.join(runtime,'build-comparison.json'),'utf8'));
const browser=JSON.parse(fs.readFileSync(path.join(runtime,'browser.json'),'utf8'));
const coverage=JSON.parse(fs.readFileSync(path.join(generated,'example-coverage.json'),'utf8'));
const artifact=JSON.parse(fs.readFileSync(path.join(generated,'package-artifact.json'),'utf8'));
const failures=[];

if(coverage.verified.length!==coverage.total)failures.push('not all examples verified');
if(coverage.failed.length||coverage.stale.length||coverage.unverified.length)failures.push('coverage contains failed/stale/unverified examples');
if(build.delta.buildPercent>35)failures.push(`build wall regression ${build.delta.buildPercent}% exceeds 35%`);
if(build.after.exampleRouteJsBytes>1500000)failures.push(`example route JS ${build.after.exampleRouteJsBytes} exceeds 1.5MB`);
if(build.after.manifestBytes>2000000)failures.push(`manifest ${build.after.manifestBytes} exceeds 2MB`);
if(!browser.docsLinkage||!browser.galleryLinkage||!browser.apiLinkage||!browser.unknown404)failures.push('browser integration incomplete');
if(!browser.keyboard?.copy||!browser.keyboard?.multiFileTabs||!browser.keyboard?.gifDisclosure)failures.push('keyboard interaction coverage incomplete');
for(const state of browser.states??[]){
  if((state.axeViolations??[]).length)failures.push(`${state.name} has axe violations`);
  if(state.horizontalOverflow)failures.push(`${state.name} has horizontal overflow`);
  if(state.name==='reduced-dark'&&state.reducedMotionOk!==true)failures.push('reduced-motion verification failed');
}
if((browser.states??[]).length!==5)failures.push(`expected 5 browser states, found ${(browser.states??[]).length}`);
if(!artifact.artifactSha256||artifact.localSourceShortcut!==false)failures.push('packed artifact proof invalid');

const evidence={
  schemaVersion:1,
  phase:'DOC-5',
  status:failures.length?'FAIL':'PASS',
  thresholds:{
    buildWallPercentMax:35,
    exampleRouteJsBytesMax:1500000,
    manifestBytesMax:2000000,
    axeViolations:0,
    horizontalOverflow:false,
    reducedMotion:true,
    keyboardInteractions:true,
  },
  failures,
};
fs.writeFileSync(path.join(runtime,'finalizer.json'),`${JSON.stringify(evidence,null,2)}\n`);
console.log('[doc5-finalize]',JSON.stringify(evidence));
if(failures.length)process.exit(1);
