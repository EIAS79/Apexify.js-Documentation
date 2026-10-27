const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url='http://127.0.0.1:38610/workspace',cdp='http://127.0.0.1:38612';
const dir='D:/ApexifyWorkspaceIntegration/audit/S21_S20_CONTROLLED_INTEGRATION/S21_BROWSER';
(async()=>{
 const source=fs.readFileSync(path.join(dir,'04_shadow_position.apexify.json'),'utf8');
 const tab=await(await fetch(cdp+'/json/new?'+encodeURIComponent(url),{method:'PUT'})).json();
 const sock=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((ok,no)=>{sock.onopen=ok;sock.onerror=no});
 let id=0;const requests=new Map(),log=[];
 sock.onmessage=e=>{let r;try{r=JSON.parse(e.data)}catch{return}const p=requests.get(r.id);if(!p)return;requests.delete(r.id);r.error?p.no(Error(r.error.message)):p.ok(r.result)};
 const cmd=(method,params={})=>new Promise((ok,no)=>{const key=++id;requests.set(key,{ok,no});sock.send(JSON.stringify({id:key,method,params}));setTimeout(()=>{if(requests.has(key)){requests.delete(key);no(Error(method+' timeout'))}},55000)});
 const ev=async js=>{const r=await cmd('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value};
 async function until(exp,ms=45000){const start=Date.now();let value;while(Date.now()-start<ms){try{value=await ev(exp);if(value)return value}catch(e){value=e.message}await new Promise(ok=>setTimeout(ok,200))}throw Error('Timed out '+exp+' last='+JSON.stringify(value))}
 let pass=false;let error=null;
 try{
 await cmd('Page.enable');await cmd('Runtime.enable');
 await cmd('Page.navigate',{url});
 await until("document.readyState==='complete' && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",85000);
 log.push('Initial clean profile loaded');
 await until("(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>r(q.result)});const g=db.transaction('projects','readonly').objectStore('projects').get('active-project');return new Promise(resolve=>{g.onsuccess=()=>{db.close();resolve(!!g.result)}})})()");
 const poisoned=await ev("(async()=>{const db=await new Promise(ok=>{const q=indexedDB.open('apexify-workspace-immutable-assets-v1');q.onsuccess=()=>ok(q.result)});const tx=db.transaction('projects','readwrite');const st=tx.objectStore('projects');const record=await new Promise(ok=>{const q=st.get('active-project');q.onsuccess=()=>ok(q.result)});record.document.width=-1;st.put(record);return await new Promise((ok,no)=>{tx.oncomplete=()=>{db.close();ok(true)};tx.onerror=()=>no(tx.error)})})()");
 assert.equal(poisoned,true);log.push('Injected invalid width only into disposable browser profile to engage actual fail-closed recovery UI');
 await cmd('Page.reload',{ignoreCache:true});
 await until("!!document.querySelector('input[aria-label=\"Import recovery project\"]')",60000);
 log.push('Real recovery mode displayed invalid saved project alert and import control');
 const data="(()=>{const el=document.querySelector('input[aria-label=\\\"Import recovery project\\\"]');if(!el)return false;const dt=new DataTransfer();dt.items.add(new File(["+JSON.stringify(source)+"],'S21-valid-native-project.apexify.json',{type:'application/json'}));el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));return true})()";
 assert.equal(await ev(data),true);log.push('Native browser File change initiated real recovery-project import');
 await until("!document.querySelector('input[aria-label=\"Import recovery project\"]') && document.querySelector('.aw-app')?.getAttribute('aria-busy')==='false'",50000);
 const present=await ev("(()=>{const s=document.querySelector('select[aria-label=\"Canvas shadow border position\"]');const g=document.querySelector('select[aria-label=\"Graph shadow border position\"]');return {inspector:s?.value,graph:g?.value,status:document.querySelector('.aw-recovery-panel')?.textContent?.slice(0,90)}})()");
 assert.equal(present.inspector,'left');assert.equal(present.graph,'left');
 log.push('Browser recovery imported verified JSON and hydrated both native Inspector and Graph without bypassing validation');
 const shot=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true});
 fs.writeFileSync(path.join(dir,'06_recovery_project_imported.png'),Buffer.from(shot.data,'base64'));
 pass=true;
 }catch(e){error=String(e.stack||e)}
 finally{fs.writeFileSync(path.join(dir,'S21_REAL_CHROMIUM_PROJECT_IMPORT_REPORT.json'),JSON.stringify({passed:pass,error,log},null,2));console.log('S21_CHROME_REAL_IMPORT='+JSON.stringify({pass,error:error?.slice(0,240),steps:log.length}));sock.close();}
 if(!pass)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
