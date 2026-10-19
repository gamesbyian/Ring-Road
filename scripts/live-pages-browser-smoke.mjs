#!/usr/bin/env node
/**
 * LIVE hosted GitHub Pages smoke, not the usual localhost Vite preview.
 * Detect blank React mounts, stale/broken production assets and JS exceptions.
 * Zero new npm dependencies: Node 22 WebSocket/CDP and installed Google Chrome.
 */
import {spawn} from "node:child_process";
import {mkdtemp, mkdir, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

const origin = process.env.PAGE_URL || "https://gamesbyian.github.io/Ring-Road/";
const target = new URL(origin);
if (target.protocol !== "https:") throw new Error("Live Pages diagnostic requires https");
const out = process.env.OUTPUT_DIR || "artifacts/live-pages";
await mkdir(out, {recursive:true});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve,ms));
const temp = await mkdtemp(join(tmpdir(),"ring-road-live-"));
const port = 30000 + Math.floor(Math.random()*20000);
let chrome, socket;
let id=0;
const pending=new Map();
let events=[];
async function connect() {
  for (let n=0;n<100;n++) {
    try {
      const p=await fetch("http://127.0.0.1:"+port+"/json",{signal:AbortSignal.timeout(1000)});
      const tabs=await p.json(), page=tabs.find(x=>x.type==="page");
      if (!page?.webSocketDebuggerUrl) throw Error("No page target");
      socket=new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
      socket.addEventListener("message",evt=>{
        const msg=JSON.parse(String(evt.data));
        if (msg.id) {const promise=pending.get(msg.id);if(promise){pending.delete(msg.id);msg.error?promise.reject(Error(msg.error.message)):promise.resolve(msg.result);}return;}
        if (["Runtime.exceptionThrown","Runtime.consoleAPICalled","Log.entryAdded","Network.loadingFailed","Inspector.targetCrashed"].includes(msg.method)) {
          const params=msg.params||{};
          const summary=msg.method==="Runtime.exceptionThrown"?params.exceptionDetails?.exception?.description||params.exceptionDetails?.text:
            msg.method==="Runtime.consoleAPICalled"?params.type+": "+(params.args||[]).map(x=>x.value??x.description??"").join(" "):
            msg.method==="Network.loadingFailed"?params.errorText+" "+params.requestId:
            msg.method==="Log.entryAdded"?params.entry?.text:"browser target crashed";
          events.push({event:msg.method,message:String(summary).slice(0,500)});
        }
      });
      return;
    } catch {await sleep(100);}
  }
  throw Error("Headless Chrome CDP unavailable");
}
function send(method,params={}) {
  return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
}
async function evaluate(expr) {
  const result=await send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
  return result.result?.value;
}
async function probe(label,url) {
  events=[];
  await send("Page.navigate",{url});
  let sample=null;
  for(let i=0;i<115;i++) {
    await sleep(200);
    try {
      sample=await evaluate(`(() => {
        const root=document.getElementById("root");
        const shell=document.querySelector(".app-shell");
        const painted=document.querySelector(".painted-stage-host");
        const bg=getComputedStyle(document.body).backgroundColor;
        return {
          readyState: document.readyState,
          title: document.title,
          rootChildren:root?.children.length||0,
          bodyBackground:bg,
          shell:!!shell,
          skinMode:shell?.dataset.skinMode||null,
          skinStatus:shell?.dataset.skinStatus||null,
          painted:!!painted,
          controls:document.querySelectorAll(".ring-control").length,
          panel:!!document.querySelector(".modal article"),
          visibleMain:!!document.querySelector("main"),
          htmlLength:document.documentElement.outerHTML.length,
          viewport:[innerWidth,innerHeight]
        };
      })()`);
      if (sample?.shell && sample?.skinStatus !== "loading" && sample?.controls===7) break;
    } catch(e){ events.push({event:"evaluation",message:String(e)}); }
  }
  const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(join(out,label+".png"),Buffer.from(shot.data,"base64"));
  const entry={label,url,dom:sample,errors:events.slice(-30)};
  await writeFile(join(out,label+".json"),JSON.stringify(entry,null,2)+"\n");
  console.log("LIVE PAGES "+JSON.stringify(entry));
  if (!sample?.shell||sample?.controls!==7||!sample?.visibleMain)
    throw Error(label+" deployed page did not render the game; see "+out+"/"+label+".json");
  if(label==="painted"&&(sample.skinMode!=="painted"||!sample.painted))
    throw Error("Painted hosted page did not activate painted scene: "+JSON.stringify(sample));
  if(events.some(x=>x.event==="Runtime.exceptionThrown"||x.event==="Inspector.targetCrashed"))
    throw Error(label+" hosted JS crash: "+JSON.stringify(events.slice(-5)));
}
try {
  chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
    "--headless","--no-sandbox","--hide-scrollbars","--disable-gpu-sandbox",
    "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader",
    "--remote-debugging-port="+port,"--user-data-dir="+temp,"about:blank"
  ],{stdio:"ignore"});
  await connect();
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride",{
    width:844,height:390,deviceScaleFactor:2,mobile:true,
    screenOrientation:{type:"landscapePrimary",angle:90}
  });
  const suffix="?diagnostic="+Date.now();
  await probe("classic",new URL(suffix,target).toString());
  await probe("painted",new URL("?skin=painted&diagnostic="+Date.now(),target).toString());
} finally {
  socket?.close();
  if(chrome&&chrome.exitCode===null){chrome.kill("SIGTERM");await Promise.race([new Promise(r=>chrome.once("exit",r)),sleep(1800)]);}
  await rm(temp,{recursive:true,force:true,maxRetries:8,retryDelay:200});
}
