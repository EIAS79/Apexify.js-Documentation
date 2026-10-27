import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {textPropertiesSpec,textRunSpec,textGroupSpec,decorationSpec,type TextSpec} from '../../features/apex-workspace/domain/text';
const inv=JSON.parse(readFileSync(resolve('docs/workspace/TEXT_OPTION_INVENTORY_TEXT01.json'),'utf8'));
const map=new Map<string, {spec:TextSpec,tokens:string[],root:string,api:string}>();
function walk(s:TextSpec,p:string,tokens:string[],root:string):void {
 if(s.kind==='object'){for(const [key,v] of Object.entries(s.fields))walk(v,p+'.'+key,[...tokens,key],root);return;}
 if(s.kind==='array'){walk(s.item,p+'[]',[...tokens.slice(0,-1),tokens.at(-1)+'[]'],root);return;}
 if(s.kind==='decoration'){map.set(p+' (boolean)',{spec:{kind:'boolean'},tokens,root,api:p+' (boolean)'});walk(decorationSpec,p+' (styled)',tokens,root);return;}
 map.set(p,{spec:s,tokens,root,api:p});
}
walk(textPropertiesSpec,'createText.TextProperties',[],'properties');
walk(textRunSpec,'createText.TextProperties[]',[],'items');
walk(textGroupSpec,'createText.CreateTextOptions',[],'group');
const opts:Array<{i:number;api:string;model:string;root:string;tokens:string[];spec:TextSpec|null;expectedControl:string}>=inv.results.filter((r:any)=>r.status==='WORKSPACE_READY').map((r:any,i:number)=> {
 const item=map.get(r.api);
 return {i,api:r.api,model:r.model,...(item?{root:item.root,tokens:item.tokens,spec:item.spec}:{root:'baseline',tokens:[],spec:null}),expectedControl:item?'DYNAMIC_TEXT_EDITOR':'INSPECTOR_BASELINE'};
});
if(opts.length!==399)throw Error('unexpected count '+opts.length);
if(opts.filter(x=>!x.spec).length!==10)throw Error('expected 10 baseline');
writeFileSync(resolve('evidence/workspace-text/strict/ui-matrix-plan.json'),JSON.stringify(opts,null,2)+'\n');
console.log('UI_MATRIX_PLAN '+opts.length+' dynamic='+opts.filter(x=>x.spec).length+' baseline='+opts.filter(x=>!x.spec).length);
