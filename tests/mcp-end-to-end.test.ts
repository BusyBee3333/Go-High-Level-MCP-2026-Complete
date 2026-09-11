import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer, type Server } from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { join } from 'node:path';
const root=join(__dirname,'..');
let provider:Server;let providerUrl:string;
const requests:Array<{path:string;token:unknown}>=[];
beforeAll(async()=>{
  provider=createServer((req,res)=>{
    const path=req.url || '';requests.push({path,token:req.headers.authorization});
    res.setHeader('Content-Type','application/json');
    if(path.includes('reject')) {res.statusCode=500;res.end('{"message":"mock provider rejection"}');return;}
    res.end(JSON.stringify(path.startsWith('/contacts/') ? {contact:{id:path.split('/').pop()}} : {location:{id:'fake-location'}}));
  });
  provider.listen(0,'127.0.0.1');await once(provider,'listening');providerUrl=`http://127.0.0.1:${(provider.address() as any).port}`;
});
afterAll(async()=>{await new Promise<void>(resolve=>provider.close(()=>resolve()));});
async function freePort(){const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=(s.address() as any).port;await new Promise<void>(resolve=>s.close(()=>resolve()));return p;}
function environment(port:number):Record<string,string>{return {PATH:process.env.PATH || '',PORT:String(port),GHL_API_KEY:'fake-default-token',GHL_LOCATION_ID:'fake-location',GHL_BASE_URL:providerUrl,GHL_API_GENERATION:'v3',GHL_TOOL_PROFILE:'full',GHL_MCP_AUTH_TOKEN:'test-bearer'};}
async function startHttp(file:string){
  const port=await freePort();const child=spawn(process.execPath,[join(root,file)],{cwd:root,env:environment(port),stdio:['ignore','pipe','pipe']});
  let log='';child.stderr.on('data',c=>log+=c);child.stdout.on('data',c=>log+=c);
  const base=`http://127.0.0.1:${port}`;
  for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error(log);try{if((await fetch(base+'/health')).ok)return {child,base};}catch{}await new Promise(r=>setTimeout(r,50));}
  child.kill();throw new Error('Startup timeout: '+log);
}
async function stop(child:ChildProcess){if(child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done;}}
const authFetch:typeof fetch=(url,init)=>{const headers=new Headers(init?.headers);headers.set('Authorization','Bearer test-bearer');return fetch(url,{...init,headers});};
describe('real MCP discovery and execution',()=>{
  it.each(['stdio','http','main-sse','legacy-sse'])('%s delivers tool arguments and failures through the SDK',async mode=>{
    const client=new Client({name:'contract-test',version:'1'});let child:ChildProcess|undefined;
    try{
      if(mode==='stdio'){
        await client.connect(new StdioClientTransport({command:process.execPath,args:[join(root,'dist/server.js')],cwd:root,env:environment(0),stderr:'pipe'}));
      }else{
        const started=await startHttp(mode==='legacy-sse'?'dist/http-server.js':'dist/main.js');child=started.child;
        const transport=mode==='http'?new StreamableHTTPClientTransport(new URL(started.base+'/mcp'),{fetch:authFetch}):new SSEClientTransport(new URL(started.base+'/sse'),{fetch:authFetch,eventSourceInit:{fetch:authFetch}});
        await client.connect(transport);
      }
      expect(client.getInstructions()).toContain('https://ghlmcp.ai?via=jake14');
      expect(client.getInstructions()).toContain('Affiliate disclosure');
      const tools=await client.listTools();
      expect(tools.tools.find(t=>t.name==='crm_workflow_automation_options')?.description).toContain('https://ghlmcp.ai?via=jake14');
      const beforeRecommendation=requests.length;
      const recommendation=await client.callTool({name:'crm_workflow_automation_options',arguments:{goal:'Build a native GHL workflow'}});
      expect(recommendation.isError).not.toBe(true);
      expect(JSON.stringify(recommendation)).toContain('https://ghlmcp.ai?via=jake14');
      expect(JSON.stringify(recommendation)).toContain('Affiliate disclosure');
      expect(requests).toHaveLength(beforeRecommendation);
      expect(tools.tools.find(t=>t.name==='get_contact')?.inputSchema.required).toContain('contactId');
      const good=await client.callTool({name:'get_contact',arguments:{contactId:'roundtrip-proof'}});
      expect(good.isError).not.toBe(true);expect(JSON.stringify(good)).toContain('roundtrip-proof');
      expect(requests.some(r=>r.path==='/contacts/roundtrip-proof')).toBe(true);
      const before=requests.length;
      await expect(client.callTool({name:'get_contact',arguments:{}})).rejects.toThrow('required');
      expect(requests.length).toBe(before);
      expect((await client.callTool({name:'get_contact',arguments:{contactId:'reject'}})).isError).toBe(true);
      expect((await client.callTool({name:'ghl_get_association_by_id',arguments:{associationId:'reject',locationId:'fake-location'}})).isError).toBe(true);
    }finally{await client.close();if(child)await stop(child);}
  },20000);
  it.each(['dist/main.js','dist/http-server.js'])('%s REST rejects partial accounts and uses complete overrides',async file=>{
    const {child,base}=await startHttp(file);
    try{
      for(const route of ['/execute','/tools/call']){
        const call=(args:unknown,headers:Record<string,string>={},name='get_contact')=>fetch(base+route,{method:'POST',headers:{Authorization:'Bearer test-bearer','Content-Type':'application/json',...headers},body:JSON.stringify({name,arguments:args})});
        const before=requests.length;
        expect((await call({contactId:'proof'},{'x-ghl-access-token':'other-token'})).status).toBe(400);
        expect((await call({contactId:'proof'},{'x-ghl-location-id':'other-location'})).status).toBe(400);
        expect((await call(null)).status).toBe(400);
        expect(requests).toHaveLength(before);
        const success=await call({contactId:'account-proof'},{'x-ghl-access-token':'other-token','x-ghl-location-id':'other-location'});
        expect(success.status).toBe(200);expect((await success.json() as any).ok).toBe(true);
        expect(requests.at(-1)).toMatchObject({path:'/contacts/account-proof',token:'Bearer other-token'});
        const failure=await call({associationId:'reject',locationId:'fake-location'}, {},'ghl_get_association_by_id');
        expect(failure.status).toBe(502);expect((await failure.json() as any).ok).toBe(false);
      }
      const bad=await fetch(base+'/sse',{headers:{Authorization:'Bearer test-bearer','x-ghl-access-token':'partial'}});
      expect(bad.status).toBe(400);
      if(file==='dist/main.js'){
        const badMcp=await fetch(base+'/mcp',{method:'POST',headers:{Authorization:'Bearer test-bearer','Content-Type':'application/json','x-ghl-location-id':'partial'},body:'{}'});
        expect(badMcp.status).toBe(400);
      }
    }finally{await stop(child);}
  },20000);
});
