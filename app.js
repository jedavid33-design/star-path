
const STORAGE = {
  data: "starpath.timeline.v3",
  watched: "starpath.watched.v3",
  current: "starpath.current.v3",
  initialized: "starpath.initialized.v3"
};

const $ = s => document.querySelector(s);
const state = { data:null, items:[], index:0, watched:new Set() };

function keyFor(item){
  return [item.show||"", item.episode||"", item.title||""].join("|").toLowerCase().replace(/\s+/g," ").trim();
}
function esc(s=""){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function toast(msg){
  const el=$("#toast"); el.textContent=msg; el.classList.add("show");
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove("show"),1800);
}
function save(){
  localStorage.setItem(STORAGE.data, JSON.stringify(state.data));
  localStorage.setItem(STORAGE.watched, JSON.stringify([...state.watched]));
  const cur=state.items[state.index]; if(cur) localStorage.setItem(STORAGE.current,keyFor(cur));
}
function loadSaved(){
  try{ state.watched=new Set(JSON.parse(localStorage.getItem(STORAGE.watched)||"[]")); }
  catch{ state.watched=new Set(); }
}
function findCurrentIndex(){
  const explicit=Number(state.data?.currentPosition);
  if(explicit){
    const ei=state.items.findIndex(x=>Number(x.position)===explicit);
    if(ei>=0 && !localStorage.getItem(STORAGE.current)) return ei;
  }
  const saved=localStorage.getItem(STORAGE.current);
  if(saved){
    const i=state.items.findIndex(x=>keyFor(x)===saved); if(i>=0) return i;
  }
  const m=state.data.currentMatch;
  if(m){
    const i=state.items.findIndex(x =>
      (x.show||"").toLowerCase()===m.show.toLowerCase() &&
      (x.episode||"").toLowerCase()===m.episode.toLowerCase() &&
      (x.title||"").toLowerCase().includes(m.title.toLowerCase())
    );
    if(i>=0) return i;
  }
  const i=state.items.findIndex(x=>!state.watched.has(keyFor(x)));
  return i>=0?i:0;
}
function backlogPositions(){
  return new Set((state.data.backlogPositions||[]).map(Number));
}
function applyInitialState(){
  if(localStorage.getItem(STORAGE.initialized)) return;
  const through=Number(state.data.initialWatchedThrough)||0;
  const backlog=backlogPositions();
  const forcedUnmarked=new Set((state.data.specialUnmarkedPositions||[]).map(Number));
  state.items.forEach(x=>{
    const p=Number(x.position)||0;
    if(p <= through && !backlog.has(p) && !forcedUnmarked.has(p)) state.watched.add(keyFor(x));
  });
  localStorage.setItem(STORAGE.initialized,"1");
}
function masterTotal(){
  return Number(state.data.masterTotal)||state.items.length;
}
function absoluteWatchedCount(){
  if(state.items.length < masterTotal()){
    const first=state.items[0]?.position||1;
    let inferred=Math.max(0,first-1);
    const sliceWatched=state.items.filter(x=>state.watched.has(keyFor(x))).length;
    return Math.min(masterTotal(), inferred+sliceWatched);
  }
  return state.items.filter(x=>state.watched.has(keyFor(x))).length;
}
function render(){
  const item=state.items[state.index];
  if(!item) return;
  const watched=state.watched.has(keyFor(item));
  $("#eraBadge").textContent=item.era||"Chronology";
  $("#timing").textContent=item.timing||"";
  $("#position").textContent=`Item ${item.position||state.index+1} of ${masterTotal()}`;
  $("#show").textContent=item.show||"Star Wars";
  $("#episode").textContent=item.episode||"";
  $("#title").textContent=item.title||item.raw||"";
  if(item.instructions){
    $("#instructions").textContent=item.instructions;
    $("#instructionBox").classList.remove("hidden");
  } else $("#instructionBox").classList.add("hidden");
  $("#watchedStamp").classList.toggle("hidden",!watched);
  $("#watchedBtn").textContent=watched?"↶ Mark unwatched":"✓ Watched";
  $("#prevBtn").disabled=state.index===0;
  $("#nextBtn").disabled=state.index===state.items.length-1;
  const wc=absoluteWatchedCount();
  $("#progressText").textContent=`${wc} watched • ${Math.max(0,masterTotal()-wc)} remaining`;
  $("#loadedText").textContent=state.items.length===masterTotal()?"Full master loaded":`${state.items.length} loaded`;
  $("#progressBar").style.width=`${Math.min(100,(wc/masterTotal())*100)}%`;
  $("#sliceNote").textContent=state.items.length===masterTotal()
    ?"Full chronology loaded. Progress is saved on this device."
    : `Verified current slice loaded (${state.items[0]?.position||"?"}–${state.items.at(-1)?.position||"?"}). Import the corrected master list once to unlock the full timeline.`;
  save();
}
function go(i){ if(i<0||i>=state.items.length)return; state.index=i; render(); window.scrollTo({top:0,behavior:"smooth"}); }
function nextUnwatched(){
  const backlog=backlogPositions();
  const i=state.items.findIndex(x=>!backlog.has(Number(x.position)) && !state.watched.has(keyFor(x)));
  go(i>=0?i:state.items.length-1);
}
function toggleWatched(){
  const item=state.items[state.index], k=keyFor(item);
  if(state.watched.has(k)){ state.watched.delete(k); render(); toast("Marked unwatched"); return; }
  state.watched.add(k);
  if(state.index<state.items.length-1){ state.index++; render(); toast("Watched ✓"); }
  else { render(); toast("Timeline complete ✓"); }
}
function renderTimeline(filter=""){
  const q=filter.trim().toLowerCase();
  const list=$("#timelineList"); list.innerHTML="";
  state.items.forEach((item,i)=>{
    const blob=[item.show,item.episode,item.title,item.era,item.timing].join(" ").toLowerCase();
    if(q && !blob.includes(q)) return;
    const b=document.createElement("button");
    b.className="timeline-item"+(i===state.index?" current":"");
    const done=state.watched.has(keyFor(item));
    b.innerHTML=`<span class="timeline-number">${esc(item.position||i+1)}</span>
      <span><div class="timeline-title">${esc(item.show)}${item.episode?` · ${esc(item.episode)}`:""}</div>
      <div class="timeline-meta">${esc(item.title||"")}</div></span>
      <span class="timeline-check">${done?"✓":""}</span>`;
    b.onclick=()=>{ $("#timelineDialog").close(); go(i); };
    list.appendChild(b);
  });
}
function renderEras(){
  const map=new Map();
  state.items.forEach((x,i)=>{ const e=x.era||"Chronology"; if(!map.has(e))map.set(e,{i,count:0}); map.get(e).count++; });
  const el=$("#eraList"); el.innerHTML="";
  [...map.entries()].forEach(([era,v])=>{
    const b=document.createElement("button"); b.className="era-choice";
    b.innerHTML=`<span><strong>${esc(era)}</strong><small>${v.count} loaded item${v.count===1?"":"s"}</small></span><span>›</span>`;
    b.onclick=()=>{ $("#eraDialog").close(); go(v.i); };
    el.appendChild(b);
  });
}
function parseItemText(text, position, era){
  const clean=text.replace(/\s+/g," ").trim();
  let instructions="";
  let main=clean;
  const noteMatch=clean.match(/\s+(?:WATCH NOTE|Watch|Timestamp|Stop at|Resume at)\s*[:—-]\s*(.+)$/i);
  if(noteMatch){ instructions=noteMatch[1].trim(); main=clean.slice(0,noteMatch.index).trim(); }
  const m=main.match(/^(.*?)\s+[—–-]\s+(S\d+\s*E\d+|S\d+E\d+)\s*[—–:-]?\s*[“"]?(.+?)[”"]?$/i);
  if(m) return {position,era,show:m[1].trim(),episode:m[2].replace(/\s+/g,"").toUpperCase(),title:m[3].trim(),instructions,timing:""};
  const m2=main.match(/^(.*?)\s+[—–-]\s+[“"]?(.+?)[”"]?$/);
  if(m2) return {position,era,show:m2[1].trim(),episode:"",title:m2[2].trim(),instructions,timing:""};
  return {position,era,show:"Star Wars",episode:"",title:main,instructions,timing:"",raw:clean};
}
function parseMasterText(text){
  const lines=text.replace(/\r/g,"").split("\n");
  let era="Chronology", pendingNum=null, chunks=[], current=null;
  const flush=()=>{ if(current){ chunks.push(parseItemText(current.text.join(" "),current.position,current.era)); current=null; } };
  for(let raw of lines){
    let line=raw.trim(); if(!line) continue;
    if(/era\b/i.test(line) && !/^\d/.test(line) && line.length<90){
      era=line.replace(/^#+\s*/,"").replace(/[~*_]/g,"").trim(); continue;
    }
    const onlyNum=line.match(/^(\d{1,4})[\s.)-]*$/);
    if(onlyNum){ flush(); pendingNum=Number(onlyNum[1]); continue; }
    const withNum=line.match(/^(\d{1,4})[\s.)-]+\s*(.+)$/);
    if(withNum){
      flush(); current={position:Number(withNum[1]),era,text:[withNum[2]]}; pendingNum=null; continue;
    }
    if(pendingNum!==null){ flush(); current={position:pendingNum,era,text:[line]}; pendingNum=null; continue; }
    if(current) current.text.push(line);
  }
  flush();
  return chunks.filter(x=>x.title);
}
function normalizeImported(data){
  let items=Array.isArray(data)?data:data.items;
  if(!Array.isArray(items)||!items.length) throw new Error("No timeline items found.");
  items=items.map((x,i)=>({
    position:Number(x.position)||i+1,
    era:x.era||"Chronology",
    show:x.show||x.series||"Star Wars",
    episode:x.episode||"",
    title:x.title||x.name||x.raw||"",
    instructions:x.instructions||x.note||"",
    timing:x.timing||x.date||""
  }));
  return {
    name:data.name||"Julie’s Star Wars Chronological Watch",
    version:1,
    masterTotal:items.length,
    sourceNote:"Imported master chronology",
    currentMatch:state.data?.currentMatch||{show:"The Mandalorian",episode:"S3E4",title:"The Foundling"},
    preWatchedTitles:[],
    initialWatchedThrough:state.data?.initialWatchedThrough||0,
    currentPosition:state.data?.currentPosition||null,
    items
  };
}
function installData(data){
  state.data=normalizeImported(data);
  state.items=state.data.items.sort((a,b)=>a.position-b.position);
  applyInitialState();
  state.index=findCurrentIndex();
  save(); render(); toast(`Imported ${state.items.length} timeline items`);
}
async function importFile(file){
  const text=await file.text();
  if(file.name.toLowerCase().endsWith(".json")){
    installData(JSON.parse(text));
  }else{
    const items=parseMasterText(text);
    installData({items,name:"Julie’s Star Wars Chronological Watch"});
  }
}
function exportProgress(){
  const payload={
    format:"star-path-progress",
    version:1,
    exportedAt:new Date().toISOString(),
    current:state.items[state.index]||null,
    watched:[...state.watched],
    timelineName:state.data.name,
    masterTotal:masterTotal()
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="star-path-progress.json"; a.click(); URL.revokeObjectURL(a.href);
  toast("Progress backup exported");
}
async function init(){
  loadSaved();
  let data=null;
  try{ data=JSON.parse(localStorage.getItem(STORAGE.data)||"null"); }catch{}
  if(!data){
    try{ data=await (await fetch("starwars-list.json")).json(); }
    catch{ data=null; }
  }
  if(!data || !Array.isArray(data.items)){
    document.body.innerHTML = '<main class="app-shell"><section class="watch-card"><div><div class="eyebrow">STAR PATH</div><h2>Timeline could not load</h2><p style="color:#b7b3ca;line-height:1.5">Open Star Path from its hosted site so <code>starwars-list.json</code> can load.</p></div></section></main>';
    return;
  }
  state.data=data; state.items=data.items||[]; applyInitialState(); state.index=findCurrentIndex(); render();

  $("#prevBtn").onclick=()=>go(state.index-1);
  $("#nextBtn").onclick=()=>go(state.index+1);
  $("#watchedBtn").onclick=toggleWatched;
  $("#currentBtn").onclick=nextUnwatched;
  $("#timelineBtn").onclick=()=>{ renderTimeline(); $("#timelineDialog").showModal(); setTimeout(()=>$("#searchBox").focus(),60); };
  $("#eraBtn").onclick=()=>{ renderEras(); $("#eraDialog").showModal(); };
  $("#menuBtn").onclick=()=>$("#toolsDialog").showModal();
  $("#searchBox").oninput=e=>renderTimeline(e.target.value);
  document.querySelectorAll(".close-dialog").forEach(b=>b.onclick=()=>b.closest("dialog").close());
  $("#importBtn").onclick=()=>$("#fileInput").click();
  $("#fileInput").onchange=async e=>{ if(e.target.files[0]){ try{ await importFile(e.target.files[0]); $("#toolsDialog").close(); }catch(err){ toast("Import failed: "+err.message); } e.target.value=""; } };
  $("#pasteBtn").onclick=()=>{ $("#toolsDialog").close(); $("#pasteDialog").showModal(); };
  $("#parsePasteBtn").onclick=()=>{ try{ const items=parseMasterText($("#pasteArea").value); if(!items.length)throw new Error("No numbered items found"); installData({items}); $("#pasteDialog").close(); }catch(err){ toast(err.message); } };
  $("#exportBtn").onclick=exportProgress;
  $("#resetBtn").onclick=()=>{ if(confirm("Clear watched progress and return to The Foundling?")){ state.watched=new Set(); localStorage.removeItem(STORAGE.current); localStorage.removeItem(STORAGE.initialized); applyInitialState(); state.index=findCurrentIndex(); render(); toast("Progress reset"); } };
  document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{ if(e.target===d)d.close(); }));
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
}
init();
