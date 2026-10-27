/** Transitional canonical-v2 semantic transaction for existing v1 authored canvases.
 * Does NOT persist a second project. The v2 instance is derived/validated atomically
 * then projected back to v1 until frames, media and history have a native v2 editor.
 */
import {validateDocument,type WorkspaceDocument} from '../model';
import {validateCanvasExtras,type CanvasExtras} from '../canvas-options';
import {migrateV1,toV1,validateProject,type CanonicalProject} from './project';

export type V2CanvasTransaction={
  readonly document:WorkspaceDocument;
  readonly canonical:CanonicalProject;
};
export function transactCanvasViaV2(
  input:WorkspaceDocument,options:CanvasExtras,projectId='project:workspace-canvas'
):V2CanvasTransaction{
 const before=validateDocument(input);
 const next=validateDocument({...before,canvasExtras:validateCanvasExtras(options)});
 // No external execution, no frame/time coercion, and no second separately mutable store.
 const canonical=validateProject(migrateV1(next,projectId));
 const projected=toV1(canonical);
 if(JSON.stringify(projected)!==JSON.stringify(next))
   throw new Error('Canonical v2 compatibility projection changed the v1 canvas edit');
 return {document:projected,canonical};
}
