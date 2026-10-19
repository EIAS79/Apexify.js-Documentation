import { createHeroDocument, createBlankDocument, newLayer, type WorkspaceDocument } from "./model";
export const PRESETS = [
  {id:"hero",name:"Crystal Lake",description:"Image, headline and call to action",color:"#23195f"},
  {id:"metrics",name:"Growth dashboard",description:"Charts and progress components",color:"#133453"},
  {id:"poster",name:"Neon poster",description:"Editable geometric typography",color:"#471074"},
  {id:"social",name:"Product launch",description:"Square social card and badge",color:"#23382a"},
  {id:"path",name:"Signal paths",description:"Layered vector point paths",color:"#113f49"},
  {id:"blank",name:"Blank canvas",description:"Start a composition from scratch",color:"#131c30"},
];
export function createPreset(id:string):WorkspaceDocument {
  if(id==="hero")return createHeroDocument();
  const d=createBlankDocument();d.background.mode="gradient";d.background.startColor="#0c102c";d.background.endColor="#263b69";
  const text=(id:string,t:string,x:number,y:number,size=48)=>({...newLayer("text",id),kind:"text" as const,text:t,x,y,fontSize:size,weight:700,color:"#ffffff"});
  d.name=PRESETS.find(p=>p.id===id)?.name??"Untitled";
  if(id==="metrics")d.layers=[text("title","Growth, made visible.",70,50),{...newLayer("chart","chart"),x:70,y:180,width:700,height:380},{...newLayer("component","progress"),kind:"component",component:"progressBar",x:820,y:230,width:360,height:45,text:"",body:"",value:78,color:"#eaff00",background:"#10213e",source:d.background.image},text("stat","78% to target",820,320,30)];
  if(id==="poster") {d.background.endColor="#6815a2";d.layers=[{...newLayer("shape","orb"),kind:"shape",shape:"circle",x:730,y:70,width:420,height:420,color:"#29d1e8",radius:0,strokeColor:"#81ecff",strokeWidth:2},text("title","MAKE\nYOUR MOVE.",80,130,90),text("caption","Apexify.js • built with code",85,580,26)];}
  if(id==="social"){d.width=1080;d.height=1080;d.background.endColor="#204e42";d.layers=[text("title","Ideas deserve\na bigger canvas.",80,240,78),{...newLayer("component","badge"),kind:"component",component:"badge",text:"NEW RELEASE",body:"",value:0,x:80,y:120,width:240,height:65,color:"#0c1822",background:"#eaff00",source:d.background.image},text("footer","apexify.js / create something",85,850,32)];}
  if(id==="path"){d.layers=[text("title","Follow your own signal.",70,60,50),...[0,1,2].map(i=>({...newLayer("path",`path-${i}`),kind:"path" as const,x:100,y:220+i*90,width:1080,height:240,points:[{x:0,y:80},{x:20,y:25},{x:45,y:60},{x:70,y:0},{x:100,y:55}],closed:false,color:"#6739e8",strokeColor:["#00d5ff","#eaff00","#b14cff"][i],strokeWidth:5}))];}
  return d;
}
