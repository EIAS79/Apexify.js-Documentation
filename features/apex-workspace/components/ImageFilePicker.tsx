"use client";
import {useRef,useState} from 'react';
import {ArrowUpTrayIcon} from '@heroicons/react/24/outline';

/** Keep the native file input hidden; its browser button is not a themed form field. */
export default function ImageFilePicker({label,buttonLabel='Choose image',disabled=false,onFile,onError}: {
  label:string;buttonLabel?:string;disabled?:boolean;
  onFile:(file:File)=>Promise<void>|void;onError:(message:string)=>void;
}) {
  const input=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [filename,setFilename]=useState('');
  const [error,setError]=useState<string|null>(null);
  return <div className="aw-image-file-picker">
    <button type="button" className="aw-file-picker-button" aria-label={label+' — choose file'}
      disabled={disabled||busy} onClick={()=>input.current?.click()}>
      <ArrowUpTrayIcon/><span>{busy?'Importing…':buttonLabel}</span>
    </button>
    <input ref={input} hidden type="file" aria-label={label} accept="image/png,image/jpeg,image/webp"
      disabled={disabled||busy} onChange={async event=>{
        const file=event.currentTarget.files?.[0];event.currentTarget.value='';if(!file)return;
        setError(null);setBusy(true);
        try {await onFile(file);setFilename(file.name);}
        catch(cause){const message=cause instanceof Error?cause.message:'Image import failed.';setError(message);onError(message);}
        finally{setBusy(false);}
      }}/>
    <span className="aw-file-picker-name" title={filename||undefined}>{filename||'PNG, JPEG or WebP · up to 2 MB'}</span>
    {error&&<span className="aw-file-picker-error" role="alert">{error}</span>}
  </div>;
}
