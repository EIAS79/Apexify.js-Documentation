import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { createLegacyIdentityMap, getDocumentationPageBySourcePath } from '@/lib/docs/content';
import { stripDocumentationFrontmatter } from '@/lib/docs/frontmatter';
import type { ApiSearchRecord } from '@/lib/api-reference/schema';

interface SearchResult {
  filename:string; name:string; folder:string; href:string;
  matchType:'filename'|'folder'|'content'|'api';
  snippet?:string;
}
interface SearchFile {filename:string;name:string;folder:string;path:string;sourcePath:string;}

function loadApiSearchRecords():ApiSearchRecord[]{
  const file=path.join(process.cwd(),'generated','docs-doc4','api-search-index.json');
  if(!fs.existsSync(file))return [];
  try{return (JSON.parse(fs.readFileSync(file,'utf8')).records||[]) as ApiSearchRecord[];}catch{return [];}
}
export async function GET(request:NextRequest){
  const query=request.nextUrl.searchParams.get('q');
  if(!query||query.trim().length===0)return NextResponse.json({results:[]});
  try{
    const docsDir=path.join(process.cwd(),'content','docs');
    const results:SearchResult[]=[];const searchTerm=query.toLowerCase().trim();
    const migratedByLegacyIdentity=createLegacyIdentityMap();
    for(const file of getAllMdxFiles(docsDir)){
      const migratedPage=getDocumentationPageBySourcePath(file.sourcePath)??migratedByLegacyIdentity.get(file.filename)??null;
      const resultName=migratedPage?.title??file.name;const resultFolder=migratedPage?.category??file.folder;
      const href=migratedPage?.canonicalPath??`/docs#${file.filename}`;
      if(file.filename.toLowerCase().includes(searchTerm)||resultName.toLowerCase().includes(searchTerm)){
        results.push({filename:file.filename,name:resultName,folder:resultFolder,href,matchType:'filename'});continue;
      }
      if(resultFolder.toLowerCase().includes(searchTerm)){
        results.push({filename:file.filename,name:resultName,folder:resultFolder,href,matchType:'folder'});continue;
      }
      try{
        const raw=fs.readFileSync(file.path,'utf8');const content=stripDocumentationFrontmatter(raw,file.sourcePath);const lower=content.toLowerCase();
        if(!lower.includes(searchTerm))continue;
        const index=lower.indexOf(searchTerm),start=Math.max(0,index-50),end=Math.min(content.length,index+searchTerm.length+50);
        let snippet=content.slice(start,end).replace(/```[\s\S]*?```/g,'').replace(/`[^`]+`/g,'').replace(/[#*_~]/g,'').replace(/\n+/g,' ').trim();
        if(snippet.length>150)snippet=`${snippet.slice(0,150)}...`;
        results.push({filename:file.filename,name:resultName,folder:resultFolder,href,matchType:'content',snippet});
      }catch{}
    }
    for(const record of loadApiSearchRecords()){
      const haystack=[record.title,...record.terms,record.package,record.kind].join(' ').toLowerCase();
      if(!haystack.includes(searchTerm))continue;
      results.push({filename:record.id,name:record.title,folder:'API Reference',href:record.href,matchType:'api',snippet:`${record.kind} · ${record.runtime.join(', ')}`});
    }
    const rank:Record<SearchResult['matchType'],number>={api:0,filename:1,folder:2,content:3};
    results.sort((a,b)=>rank[a.matchType]-rank[b.matchType]||a.name.localeCompare(b.name)||a.href.localeCompare(b.href));
    const unique=[...new Map(results.map(r=>[`${r.name}|${r.href}`,r])).values()];
    return NextResponse.json({results:unique.slice(0,30)});
  }catch(error){console.error('Search error:',error);return NextResponse.json({results:[]},{status:500});}
}
function getAllMdxFiles(dir:string,baseDir=dir):SearchFile[]{
  const files:SearchFile[]=[];if(!fs.existsSync(dir))return files;
  const entries=fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  for(const entry of entries){const full=path.join(dir,entry.name);
    if(entry.isDirectory())files.push(...getAllMdxFiles(full,baseDir));
    else if(entry.isFile()&&entry.name.endsWith('.mdx')){
      const relative=path.relative(baseDir,full),folder=path.dirname(relative),filename=path.basename(entry.name,'.mdx');
      files.push({filename,name:formatName(filename),path:full,folder:folder==='.'?'root':folder,sourcePath:path.relative(process.cwd(),full).split(path.sep).join('/')});
    }
  }return files;
}
function formatName(filename:string){return filename.replace(/^\d+-/,'').split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');}
