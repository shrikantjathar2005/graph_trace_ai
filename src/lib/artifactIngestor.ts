import { DocumentationEntity, MethodEntity, ModuleEntity, RequirementEntity, TestEntity } from "@/types/entities";
import { GraphEdgeData, GraphNodeData } from "@/types/graph";
const langs:Record<string,ModuleEntity["language"]>={ts:"TypeScript",tsx:"TypeScript",js:"TypeScript",jsx:"TypeScript",py:"Python",java:"Java",go:"Go",rs:"Rust"};
const allowed=new Set(["md","mdx","txt",...Object.keys(langs)]);
const ext=(p:string)=>p.split(".").pop()?.toLowerCase()??"";
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).toUpperCase();};
const clean=(s:string)=>s.toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"");
export async function ingestArtifacts(files:FileList|File[]) {
 const input=Array.from(files).map(file=>({file,path:(file as File&{webkitRelativePath?:string}).webkitRelativePath||file.name}));
 const picked=input.filter(x=>allowed.has(ext(x.path))).slice(0,500);
 const records=await Promise.all(picked.map(async x=>({path:x.path,text:(await x.file.text()).slice(0,1000000)})));
 const nodes:GraphNodeData[]=[],edges:GraphEdgeData[]=[];
 const ids=new Set<string>(),edgeIds=new Set<string>(),reqs=new Map<string,RequirementEntity>();
 const methods:Array<{id:string;name:string}>=[],tests:Array<{id:string;text:string}>=[],mods:Array<{id:string;text:string}>=[];
 const add=(n:GraphNodeData)=>{if(!ids.has(n.id)){ids.add(n.id);nodes.push(n);}};
 const edge=(source:string,target:string,relationship:GraphEdgeData["relationship"])=>{const id=source+relationship+target;if(ids.has(source)&&ids.has(target)&&!edgeIds.has(id)){edgeIds.add(id);edges.push({id,source,target,relationship,confidence:.78});}};
 for(const {path,text} of records){
  const e=ext(path);
  if(["md","mdx","txt"].includes(e)){
   const title=text.match(/^#\s+(.+)$/m)?.[1]?.trim()||path.split("/").pop()||path,docId="DOC-"+hash(path);
   const docType:DocumentationEntity["docType"]=/readme/i.test(path)?"README":/adr/i.test(path)?"ADR":/api/i.test(path)?"API_SPEC":"SRS";
   const doc:DocumentationEntity={id:docId,name:title,type:"documentation",docType,filePath:path,section:title};
   add({id:docId,label:title,type:"documentation",subtitle:path,filePath:path,entity:doc});
   for(const m of text.matchAll(/\b(REQ[-_ ]?[A-Z]*[-_]?\d+)\s*[:.)-]?\s*([^\r\n]{8,160})/gi)){
    const code=clean(m[1]).replace(/^REQ-?/,"REQ-");let req=reqs.get(code);
    if(!req){const name=m[2].trim().replace(/^[-*#\s]+/,"").slice(0,90);req={id:code,reqCode:code,name,type:"requirement",category:/security|auth|password/i.test(name)?"SECURITY":/audit|compliance/i.test(name)?"COMPLIANCE":"FUNCTIONAL",priority:"MEDIUM",status:"IN_REVIEW",sourceDocument:path,description:name};reqs.set(code,req);add({id:code,label:code+": "+name,type:"requirement",subtitle:"Imported requirement",entity:req});}
    edge(docId,code,"DOCUMENTS");
   } continue;
  }
  if(!langs[e])continue;
  const id="MOD-"+hash(path),name=path.split("/").pop()||path;
  const modEntity:ModuleEntity={id,name,type:"module",filePath:path,language:langs[e],loc:text.split(/\r?\n/).length,imports:[]};
  add({id,label:"Module: "+name,type:"module",subtitle:path,filePath:path,entity:modEntity,metrics:{loc:modEntity.loc}});mods.push({id,text});
  if(/(^|[/_.-])(test|spec|tests|__tests__)([/_.-]|$)/i.test(path)){
   const found=Array.from(text.matchAll(/\b(?:it|test)\s*\(\s*["']([^"']{2,100})["']/g)).slice(0,100),names=found.length?found.map(m=>m[1]):[name];
   for(const testName of names){const testId="TST-"+hash(path+testName),entity:TestEntity={id:testId,name:testName,type:"test",testType:"UNIT",filePath:path,testSuite:name,framework:e==="py"?"Pytest":e==="java"?"JUnit":"Jest",lastRunStatus:"SKIPPED",durationMs:0};add({id:testId,label:"Test: "+testName,type:"test",subtitle:path,filePath:path,entity});tests.push({id:testId,text});}
  }else{
   const pattern=/\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)/g;
   for(const m of text.matchAll(pattern)){const fn=m[1],line=text.slice(0,m.index).split(/\r?\n/).length,fnId="MTH-"+hash(path+line+fn),entity:MethodEntity={id:fnId,name:fn,type:"method",filePath:path,startLine:line,endLine:line,signature:m[0],returnType:"unknown",parameters:[],visibility:"public"};add({id:fnId,label:fn+"()",type:"method",subtitle:path+":"+line,filePath:path,entity});edge(id,fnId,"CONTAINS");methods.push({id:fnId,name:fn});}
  }
 }
 for(const mod of mods)for(const req of reqs.values())if(mod.text.includes(req.reqCode))edge(req.id,mod.id,"REALIZES");
 for(const test of tests)for(const method of methods)if(test.text.includes(method.name))edge(test.id,method.id,"VERIFIES");
 return {graph:{nodes,edges},fileCount:picked.length,skippedCount:input.length-picked.length,requirementCount:reqs.size,moduleCount:mods.length,methodCount:methods.length,testCount:tests.length};
}
