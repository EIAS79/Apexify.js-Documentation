'use client';

import { ClockIcon, CommandLineIcon, PhotoIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline';
import { StudioPreviewZoom } from './StudioPreviewZoom';
import { RunHistoryEntry } from '@/lib/studio/studioConfig';
import { InteractivePreview } from '@/components/docs/playground/InteractivePreview';
import { DiagnosticsPanel } from '@/components/docs/playground/DiagnosticsPanel';

export type OutputTab = 'preview' | 'terminal' | 'history';
type Props={tab:OutputTab;onTabChange:(next:OutputTab)=>void;running:boolean;previewUrl:string|null;error:string|null;errorExitCode:number|null;elapsedMs:number|null;history:RunHistoryEntry[];onReplayHistory:(entry:RunHistoryEntry)=>void;onClearHistory:()=>void};
const formatTs=(ts:number)=>new Date(ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});

function Tab({active,onClick,Icon,label,badge,status}:{active:boolean;onClick:()=>void;Icon:typeof PhotoIcon;label:string;badge?:number;status?:'ok'|'error'|'idle'}){return <button type="button" role="tab" aria-selected={active} onClick={onClick} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold" style={{color:active?'var(--text-primary)':'var(--text-tertiary)',background:active?'var(--bg-raised)':'transparent',boxShadow:active?'inset 0 0 0 1px var(--border-default)':'none'}}>{status?<span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{background:status==='ok'?'var(--success)':status==='error'?'var(--danger)':'var(--border-strong)'}}/>:null}<Icon className="h-3.5 w-3.5" aria-hidden/>{label}{badge!==undefined?<span className="rounded-full px-1.5 text-[10px]" style={{background:'var(--border-default)'}}>{badge}</span>:null}</button>}

export function StudioOutputPanel({tab,onTabChange,running,previewUrl,error,errorExitCode,elapsedMs,history,onReplayHistory,onClearHistory}:Props){
 const diagnostics=error?[{id:'studio-execution-error',severity:'error' as const,message:error,code:errorExitCode==null?undefined:`EXIT_${errorExitCode}`,help:'Fix the source or reset to the starter example, then run again.'}]:[];
 return <section className="flex min-h-[200px] flex-col overflow-hidden md:min-h-0" style={{background:'var(--bg-canvas)'}}>
  <div role="tablist" aria-label="Output panel" className="flex shrink-0 flex-wrap items-center gap-1.5 px-2 py-2" style={{borderBottom:'1px solid var(--border-subtle)'}}>
   <Tab active={tab==='preview'} onClick={()=>onTabChange('preview')} Icon={PhotoIcon} label="Preview" status={error?'error':previewUrl?'ok':'idle'}/><Tab active={tab==='terminal'} onClick={()=>onTabChange('terminal')} Icon={CommandLineIcon} label="Diagnostics" status={error?'error':'idle'}/><Tab active={tab==='history'} onClick={()=>onTabChange('history')} Icon={ClockIcon} label="History" badge={history.length}/><span className="ml-auto text-[11px]" style={{color:running?'var(--success)':'var(--text-tertiary)'}}>{running?'Running…':elapsedMs!=null?`${elapsedMs} ms`:''}</span>
  </div>
  <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
   {tab==='preview'?<InteractivePreview status={running?'loading':error?'error':previewUrl?'ready':'idle'} label="Studio output preview" provenance={previewUrl?'server-generated':undefined}>{previewUrl&&!error?<StudioPreviewZoom src={previewUrl} alt="Server-generated output from your snippet"/>:null}</InteractivePreview>:null}
   {tab==='terminal'?<div className="min-h-0 flex-1 overflow-auto p-3"><DiagnosticsPanel diagnostics={diagnostics}/>{!error?<p className="mt-3 text-sm" style={{color:'var(--text-tertiary)'}}>No execution diagnostics{elapsedMs!=null?` · last run ${elapsedMs} ms`:''}.</p>:null}</div>:null}
   {tab==='history'?<HistoryTab history={history} onReplay={onReplayHistory} onClear={onClearHistory}/>:null}
  </div>
 </section>;
}

function HistoryTab({history,onReplay,onClear}:{history:RunHistoryEntry[];onReplay:(entry:RunHistoryEntry)=>void;onClear:()=>void}){
 if(!history.length)return <div className="grid flex-1 place-items-center p-6 text-sm" style={{color:'var(--text-tertiary)'}}>Recent runs land here.</div>;
 return <div className="flex min-h-0 flex-1 flex-col"><div className="flex items-center justify-between px-3 py-2 text-xs" style={{borderBottom:'1px solid var(--border-subtle)',color:'var(--text-tertiary)'}}><span>Last {history.length} run{history.length===1?'':'s'}</span><button type="button" onClick={onClear} className="inline-flex min-h-10 items-center gap-1 rounded-md px-2" style={{border:'1px solid var(--border-default)'}}><TrashIcon className="h-3 w-3" aria-hidden/>Clear</button></div><ul className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">{history.map(entry=><li key={entry.id}><button type="button" onClick={()=>onReplay(entry)} className="flex min-h-16 w-full items-center gap-3 rounded-lg p-2 text-left" style={{border:'1px solid var(--border-default)',background:'var(--bg-raised)'}}>{entry.thumbDataUrl?<img src={entry.thumbDataUrl} alt="" className="h-14 w-20 rounded object-cover"/>:<CommandLineIcon className="h-5 w-5" style={{color:entry.ok?'var(--success)':'var(--danger)'}} aria-hidden/>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{entry.bufferName}</span><span className="text-[10px]" style={{color:'var(--text-tertiary)'}}>{entry.ok?'OK':'ERROR'} · {entry.lang.toUpperCase()} · {formatTs(entry.ts)}</span></span><PlayIcon className="h-4 w-4" aria-hidden/></button></li>)}</ul></div>;
}
