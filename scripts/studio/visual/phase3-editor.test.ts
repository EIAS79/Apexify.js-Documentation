import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisualNode,createVisualProject } from '../../../lib/studio/visual/project';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { VisualHistory,alignNodes,deleteNodes,duplicateNodes,moveNodes,nodeRect,reorderNode,resizeNode,rotateNode,setNodeLocked,setNodeVisibility,setSelection,snapPosition } from '../../../lib/studio/visual/editor';

function fixture(){
 const p=createVisualProject({id:'project_phase3',now:'2026-09-21T00:00:00.000Z',width:800,height:600});
 for(const [id,x,y] of [['node_a',10,20],['node_b',250,120],['node_c',500,240]] as const){const n=createVisualNode('group',{}, {id,name:id});n.transform={x,y,width:100,height:80,visible:true,locked:false};p.document.nodes[id]=n;p.document.rootNodeIds.push(id);}
 return p;
}
test('selection and transform operations remain generic',()=>{let p=fixture();p=setSelection(p,['node_a','node_b']);assert.deepEqual(p.editor?.selectedNodeIds,['node_a','node_b']);p=moveNodes(p,['node_a'],15,-5);assert.deepEqual(nodeRect(p.document.nodes.node_a),{x:25,y:15,width:100,height:80});p=resizeNode(p,'node_a','se',20,10);assert.equal(nodeRect(p.document.nodes.node_a).width,120);p=rotateNode(p,'node_a',405);assert.equal(p.document.nodes.node_a.transform?.rotation,45)});
test('locked nodes reject geometry but visibility and lock remain editor state',()=>{let p=fixture();p=setNodeLocked(p,'node_a',true);const same=moveNodes(p,['node_a'],20,20);assert.deepEqual(nodeRect(same.document.nodes.node_a),nodeRect(p.document.nodes.node_a));p=setNodeVisibility(p,'node_a',false);assert.equal(p.document.nodes.node_a.transform?.visible,false)});
test('layer reorder duplicate and delete preserve hierarchy lists',()=>{let p=fixture();p=reorderNode(p,'node_c',0);assert.deepEqual(p.document.rootNodeIds,['node_c','node_a','node_b']);p=duplicateNodes(p,['node_a'],()=> 'node_copy');assert.ok(p.document.nodes.node_copy);assert.equal(p.document.rootNodeIds[p.document.rootNodeIds.indexOf('node_a')+1],'node_copy');p=deleteNodes(p,['node_a']);assert.equal(p.document.nodes.node_a,undefined);assert.ok(!p.document.rootNodeIds.includes('node_a'))});
test('alignment and distribution update only semantic transforms',()=>{let p=fixture();p=alignNodes(p,['node_a','node_b','node_c'],'top');assert.equal(nodeRect(p.document.nodes.node_b).y,20);p=fixture();p=alignNodes(p,['node_a','node_b','node_c'],'distribute-horizontal');const a=nodeRect(p.document.nodes.node_a),b=nodeRect(p.document.nodes.node_b),c=nodeRect(p.document.nodes.node_c);assert.ok(b.x>a.x+a.width);assert.ok(c.x>b.x+b.width)});
test('snapping targets canvas, objects and grid without persisting guides',()=>{const p=fixture();const snap=snapPosition(p,'node_a',248,119,6);assert.equal(snap.x,250);assert.equal(snap.y,120);assert.ok(snap.guides.length>=1);assert.equal((p.document.nodes.node_a.props as any).guides,undefined)});
test('bounded command history groups semantic mutations into one undo/redo step',()=>{const p=fixture();const moved=moveNodes(p,['node_a'],100,0);const h=new VisualHistory(2);h.commit(p,moved,'Move');const undone=h.undo(moved);assert.equal(nodeRect(undone!.project.document.nodes.node_a).x,10);const redone=h.redo(undone!.project);assert.equal(nodeRect(redone!.project.document.nodes.node_a).x,110);assert.equal(h.entries[0],'Move')});

test('phase 3 persisted editor state rejects invalid transforms and dangling selection',()=>{const p=fixture();p.document.nodes.node_a.transform!.width=0;p.editor={...p.editor,selectedNodeIds:['missing']};const result=validateVisualProject(p);assert.equal(result.ok,false);assert.ok(result.issues.some(x=>x.code==='invalid-transform'));assert.ok(result.issues.some(x=>x.code==='missing-selection'))});
