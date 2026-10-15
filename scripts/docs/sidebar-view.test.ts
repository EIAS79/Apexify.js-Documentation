import assert from 'node:assert/strict';
import test from 'node:test';
import { findNavigationTrail, navigationPackages, scopeNavigation } from '../../lib/docs/sidebar-view';
import type { DocumentationNavigationGroup } from '../../lib/docs/navigation';

const groups: DocumentationNavigationGroup[] = [{ id:'engines', label:'Engines', order:1, items:[
  {id:'node',title:'Node',package:'apexify.js',href:'/node',children:[
    {id:'features',title:'Features',children:[{id:'canvas',title:'Canvas',children:[
      {id:'create',title:'createCanvas',href:'/node/features/createcanvas',package:'apexify.js',runtime:['node']},
      {id:'web-create',title:'Browser canvas',href:'/web/create',package:'@apexify/web',runtime:['web']},
    ]}]},
  ]},
]}];
test('finds full recursive trail for a deep link',()=> {
  assert.deepEqual(findNavigationTrail(groups,'/node/features/createcanvas').map(x=>x.id),['node','features','canvas','create']);
  assert.deepEqual(findNavigationTrail(groups,'/missing'),[]);
});
test('package scope retains ancestors but removes foreign routes and siblings',()=> {
  const scoped=scopeNavigation(groups,'@apexify/web');
  assert.equal(scoped[0].items[0].href,undefined);
  const leaves=scoped[0].items[0].children![0].children![0].children!;
  assert.deepEqual(leaves.map(x=>x.id),['web-create']);
  assert.equal(groups[0].items[0].href,'/node');
  assert.equal(scopeNavigation(groups,''),groups);
  assert.deepEqual(scopeNavigation(groups,'@apexify/not-documented'),[]);
});
test('selector derives packages and runtimes only from linked documentation',()=> {
  assert.deepEqual(navigationPackages(groups),[{name:'apexify.js',runtimes:['node']},{name:'@apexify/web',runtimes:['web']}]);
});
