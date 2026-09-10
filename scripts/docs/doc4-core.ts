import ts from 'typescript';
import type { ApiOption } from '../../lib/api-reference/schema';

export function optionFragment(path: string): string {
  return `option-${path.replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()}`;
}
export function flattenOptions(options: ApiOption[]): ApiOption[] {
  const out: ApiOption[]=[];
  const walk=(items: ApiOption[])=>{for(const item of items){out.push(item);walk(item.children||[]);}};
  walk(options);return out;
}

export interface CoverageFixture {
  publicExports: string[];
  manifestExports: string[];
  declaredOptionPaths: string[];
  documentedOptionPaths: string[];
  packedSignatures: Record<string,string>;
  documentedSignatures: Record<string,string>;
  relatedIds?: string[];
  knownIds?: string[];
}
export function coverageFailures(f: CoverageFixture): string[] {
  const errors:string[]=[];
  for(const id of f.publicExports)if(!f.manifestExports.includes(id))errors.push(`missing-export:${id}`);
  for(const id of f.manifestExports)if(!f.publicExports.includes(id))errors.push(`stale-export:${id}`);
  for(const path of f.declaredOptionPaths)if(!f.documentedOptionPaths.includes(path))errors.push(`missing-option:${path}`);
  for(const path of f.documentedOptionPaths)if(!f.declaredOptionPaths.includes(path))errors.push(`stale-option:${path}`);
  for(const [id,sig] of Object.entries(f.packedSignatures))if(f.documentedSignatures[id]!==sig)errors.push(`signature-mismatch:${id}`);
  const ids=new Set(f.knownIds||[]);
  for(const id of f.relatedIds||[])if(!ids.has(id))errors.push(`unknown-related:${id}`);
  const optionFragments=f.documentedOptionPaths.map(optionFragment);
  if(new Set(optionFragments).size!==optionFragments.length)errors.push('duplicate-option-fragment');
  return errors.sort();
}

export interface FixtureExtraction {
  exports: Array<{name:string;kind:string}>;
  members: Array<{owner:string;name:string;overloads:number}>;
  optionPaths: string[];
  deprecated: string[];
}
export function extractDeclarationFixture(source: string): FixtureExtraction {
  const sf=ts.createSourceFile('fixture.d.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const interfaces=new Map<string,ts.InterfaceDeclaration>();
  for(const stmt of sf.statements)if(ts.isInterfaceDeclaration(stmt))interfaces.set(stmt.name.text,stmt);
  const exported=(node:ts.Node)=>Boolean(ts.canHaveModifiers(node)&&ts.getModifiers(node)?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword));
  const exports:FixtureExtraction['exports']=[];
  const members:FixtureExtraction['members']=[];
  const deprecated:string[]=[];
  const optionPaths:string[]=[];
  const typeName=(node:ts.TypeNode|undefined)=>node&&ts.isTypeReferenceNode(node)&&ts.isIdentifier(node.typeName)?node.typeName.text:null;
  const walkType=(node:ts.TypeNode|undefined,base:string,seen=new Set<string>())=>{
    if(!node)return;
    if(ts.isUnionTypeNode(node)){
      for(const t of node.types)walkType(t,base,new Set(seen));
      return;
    }
    if(ts.isArrayTypeNode(node)){walkType(node.elementType,base,new Set(seen));return;}
    const ref=typeName(node);
    if(ref&&interfaces.has(ref)&&!seen.has(ref)){
      const next=new Set(seen);next.add(ref);
      walkMembers(interfaces.get(ref)!.members,base,next);return;
    }
    if(ts.isTypeLiteralNode(node))walkMembers(node.members,base,seen);
  };
  const walkMembers=(nodes:ts.NodeArray<ts.TypeElement>,base:string,seen:Set<string>)=>{
    for(const member of nodes){
      if(!ts.isPropertySignature(member)||!member.name)continue;
      const n=member.name.getText(sf).replace(/['"]/g,'');
      const p=base?`${base}.${n}`:n;optionPaths.push(p);walkType(member.type,p,new Set(seen));
    }
  };
  for(const stmt of sf.statements){
    if(!exported(stmt))continue;
    let name:string|undefined,kind:string|undefined;
    if(ts.isClassDeclaration(stmt)&&stmt.name){name=stmt.name.text;kind='class';}
    else if(ts.isInterfaceDeclaration(stmt)){name=stmt.name.text;kind='interface';}
    else if(ts.isTypeAliasDeclaration(stmt)){name=stmt.name.text;kind='type';}
    else if(ts.isFunctionDeclaration(stmt)&&stmt.name){name=stmt.name.text;kind='function';}
    else if(ts.isEnumDeclaration(stmt)){name=stmt.name.text;kind='enum';}
    if(name&&kind)exports.push({name,kind});
    if(name&&ts.getJSDocDeprecatedTag(stmt))deprecated.push(name);
    if(ts.isClassDeclaration(stmt)&&stmt.name){
      const groups=new Map<string,ts.MethodDeclaration[]>();
      for(const m of stmt.members)if(ts.isMethodDeclaration(m)&&m.name){
        const mn=m.name.getText(sf);const list=groups.get(mn)||[];list.push(m);groups.set(mn,list);
        for(const p of m.parameters){const pn=p.name.getText(sf);walkType(p.type,pn);}
      }
      for(const [mn,list] of groups)members.push({owner:stmt.name.text,name:mn,overloads:list.length});
    }
  }
  return {exports:exports.sort((a,b)=>a.name.localeCompare(b.name)),members:members.sort((a,b)=>`${a.owner}.${a.name}`.localeCompare(`${b.owner}.${b.name}`)),optionPaths:[...new Set(optionPaths)].sort(),deprecated:deprecated.sort()};
}
