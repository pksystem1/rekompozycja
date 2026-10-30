"use strict";
/* ============================================================
   Dziennik treningowy: samodzielna aplikacja (bez serwera, bez konta)
   Dane trzymane lokalnie w przeglądarce (localStorage).
   ============================================================ */
const APP_VERSION="2.1.0";
const KEY="trening.v1";

/* ---------- pomocnicze ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parseD=s=>{const p=s.split("-").map(Number);return new Date(p[0],p[1]-1,p[2])};
const todayStr=()=>ymd(new Date());
const fmtD=s=>parseD(s).toLocaleDateString("pl-PL",{weekday:"short",day:"numeric",month:"short"});
const fmtS=s=>{const d=parseD(s);return pad(d.getDate())+"."+pad(d.getMonth()+1)};
const num=v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)&&n>=0?n:0};
const nf=n=>(Math.round(n*10)/10).toLocaleString("pl-PL");
const mmss=s=>Math.floor(s/60)+":"+pad(Math.floor(s%60));
const mon=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7));
const isDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(parseD(s).getTime());

/* ---------- stan i dane ---------- */
const S={tab:"train",filter:"all",date:todayStr(),open:null,pick:null,summary:false,draft:{},chartEx:null,rest:null,confirm:null,lib:null};
let DB={days:{},choice:{},rotation:{},custom:{},fav:[],settings:{hint:true},meta:{}};

function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const o=JSON.parse(raw);
      DB.days=o.days||{};DB.choice=o.choice||{};DB.settings=Object.assign({hint:true},o.settings||{});DB.meta=o.meta||{};
      DB.rotation=o.rotation&&typeof o.rotation==="object"?o.rotation:{};
      /* migracja z 1.0: płaska ławka była zamiennikiem Pompek (B), teraz jest zamiennikiem skosu (A) */
      if(DB.choice.pushup==="flatdb"){delete DB.choice.pushup;if(!DB.choice.incline)DB.choice.incline="flatdb"}
      DB.custom=o.custom&&typeof o.custom==="object"?o.custom:{};
      DB.fav=Array.isArray(o.fav)?o.fav.filter(x=>typeof x==="string"):[];}
  }catch(e){}
  registerCustoms();pruneEmptyDays();
}
/* własne ćwiczenia: zapisane w DB.custom, rejestrowane w EX tak jak ćwiczenia z biblioteki */
function regCustom(id,c){
  const K={w:{sets:3,lo:8,hi:12,rest:90},bw:{sets:3,lo:8,hi:15,rest:75,bw:true},nw:{sets:2,lo:8,hi:15,rest:30,nw:true},sec:{sets:2,lo:20,hi:60,rest:45,unit:"sec"},min:{sets:1,lo:10,hi:30,rest:0,unit:"min",nw:true}}[c.kind]||{sets:3,lo:8,hi:12,rest:90};
  EX[id]={id:id,slot:null,w:null,name:c.name,cue:"Własne ćwiczenie.",note:"",sets:K.sets,lo:K.lo,hi:K.hi,rest:K.rest,bw:!!K.bw,side:!!c.side,unit:K.unit||"reps",nw:!!K.nw,g:c.g,eq:c.eq,alias:"",lib:true,custom:true};
  if(!(id in ORDER))ORDER[id]=Object.keys(ORDER).length;
}
function validCustom(id,c){return /^c_[a-z0-9]{3,24}$/.test(id)&&c&&typeof c.name==="string"&&c.name.trim().length>=1&&c.name.length<=80&&Array.isArray(c.g)&&!!GMAP[c.g[0]]&&!!EMAP[c.eq]&&["w","bw","nw","sec","min"].includes(c.kind)}
function registerCustoms(){
  Object.keys(DB.custom).forEach(id=>{
    const c=DB.custom[id];
    if(validCustom(id,c)&&(!EX[id]||EX[id].custom))regCustom(id,{name:String(c.name).trim(),g:[c.g[0]],eq:c.eq,kind:c.kind,side:!!c.side});
    else delete DB.custom[id];
  });
}
/* dni bez żadnej serii, w których tylko przygotowano listę, znikają po upływie dnia */
function pruneEmptyDays(){
  const t=todayStr();
  Object.keys(DB.days).forEach(k=>{const d=DB.days[k];if(!d||typeof d!=="object"||(!dayHas(d)&&k<t))delete DB.days[k]});
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(DB));renderStatus();return true}
  catch(e){toast("Nie udało się zapisać danych. Sprawdź miejsce w przeglądarce.");return false}
}
function persistRequest(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}}

/* ---------- plan: wybór ćwiczenia w miejscu planu ---------- */
/* rotacja co tydzień: {a,b,ref}; tydzień (pon.–niedz.) zawierający ref używa a, kolejny b, itd. */
function rotOf(slot){const r=DB.rotation&&DB.rotation[slot];return r&&EX[r.a]&&EX[r.b]&&EX[r.a].slot===slot&&EX[r.b].slot===slot&&r.a!==r.b&&isDate(r.ref||"")?r:null}
function rotIdx(r,dateStr){const diff=Math.round((mon(parseD(dateStr))-mon(parseD(r.ref)))/(7*864e5));return ((diff%2)+2)%2}
function curIdAt(slot,dateStr){const r=rotOf(slot);if(r)return rotIdx(r,dateStr)===0?r.a:r.b;const c=DB.choice[slot];return c&&EX[c]&&EX[c].slot===slot?c:slot}
const curId=slot=>curIdAt(slot,S.date);
function nextWeekDate(){const d=parseD(S.date);d.setDate(d.getDate()+7);return ymd(d)}
const slotOf=id=>SLOTS.find(s=>s.id===EX[id].slot);

/* ---------- dane treningowe ---------- */
const dayHas=d=>d&&d.ex&&Object.keys(d.ex).length>0;
const daysAsc=()=>Object.values(DB.days).filter(dayHas).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
const sessionsFor=id=>daysAsc().filter(d=>d.ex[id]&&d.ex[id].length).map(d=>({date:d.date,sets:d.ex[id]}));
const sumR=s=>s.reduce((a,x)=>a+x.r,0), maxK=s=>s.reduce((a,x)=>Math.max(a,x.k),0), vol=s=>s.reduce((a,x)=>a+x.r*x.k,0);
function prevSession(id,date){const l=sessionsFor(id).filter(x=>x.date<date);return l[l.length-1]||null}
const dayOf=()=>DB.days[S.date];
const setsToday=id=>{const d=dayOf();return (d&&d.ex&&d.ex[id])||[]};
const timed=p=>p.unit==="sec"||p.unit==="min";
const unitTxt=p=>p.unit==="sec"?" s":p.unit==="min"?" min":"";
function setStr(sets,p){return sets.map(x=>x.r+unitTxt(p)+(x.k?" × "+nf(x.k)+" kg":"")).join(", ")}
function dayTag(d){const ws=new Set(Object.keys(d.ex).filter(i=>EX[i]).map(i=>EX[i].w||"-"));if(ws.size===1){const w=[...ws][0];return w==="-"?"Wolny":w}return "Mix"}
const firstT=(d,id)=>{const s=d.ex[id];return s&&s.length&&s[0].t?s[0].t:0};
const idsInOrder=d=>Object.keys(d.ex).filter(i=>EX[i]).sort((a,b)=>{const ta=firstT(d,a),tb=firstT(d,b);return ta&&tb&&ta!==tb?ta-tb:ORDER[a]-ORDER[b]});
function draftFor(id){
  if(!S.draft[id]){
    const p=EX[id],cur=setsToday(id);let r=p.lo,k=0;
    if(cur.length){const l=cur[cur.length-1];r=l.r;k=l.k}
    else{const ps=prevSession(id,S.date);if(ps){r=ps.sets[0].r;k=ps.sets[0].k}}
    S.draft[id]={r:r,k:k};
  }
  return S.draft[id];
}
function hintFor(p){
  const ps=prevSession(p.id,S.date);if(!ps)return "";
  if(ps.sets.length>=p.sets&&ps.sets.every(s=>s.r>=p.hi))
    return timed(p)?"Ostatnio górny zakres we wszystkich seriach: wydłuż czas lub utrudnij wariant.":p.bw?"Ostatnio górny zakres we wszystkich seriach: czas dodać obciążenie.":"Ostatnio górny zakres we wszystkich seriach: dodaj ok. 2,5–5% ciężaru.";
  return "";
}
function otherHistory(p){
  if(prevSession(p.id,S.date))return null;
  if(!p.slot)return null;
  const s=slotOf(p.id);let best=null;
  s.variants.forEach(v=>{if(v.id===p.id)return;const ps=prevSession(v.id,S.date);if(ps&&(!best||ps.date>best.date))best={date:ps.date,name:EX[v.id].name}});
  return best;
}
function phaseHint(){
  if(!DB.settings.hint)return "";
  const real=daysAsc().filter(d=>!d.demo);
  const first=real.length?parseD(real[0].date):new Date();
  const wk=Math.max(1,Math.floor((parseD(todayStr())-first)/(7*864e5))+1);
  if(wk<=2)return "Powrót po przerwie, tydzień "+wk+": 2 serie na ćwiczenie, ok. 60% dawnego ciężaru, 3–4 powtórzenia zapasu.";
  if(wk<=4)return "Powrót po przerwie, tydzień "+wk+": pełna liczba serii, 2–3 powtórzenia zapasu. Od 5. tygodnia normalnie.";
  return "";
}
function arrow(d,fmt){fmt=fmt||(x=>nf(x));if(d>0)return `<span class="up">▲ +${fmt(d)}</span>`;if(d<0)return `<span class="down">▼ ${fmt(Math.abs(d))}</span>`;return `<span class="eq">=</span>`}

/* ---------- lista ćwiczeń dnia ---------- */
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/ł/g,"l");
const gName=id=>GMAP[id]?GMAP[id].name:"";
const eqName=id=>EMAP[id]?EMAP[id].name:"";
const hasKg=p=>!(timed(p)||p.nw);
function ensureDay(date){const d=DB.days[date]||(DB.days[date]={date:date,ex:{}});if(!d.ex)d.ex={};return d}
function listIds(date){
  const d=DB.days[date];if(!d)return [];
  const out=[],seen=new Set();
  (Array.isArray(d.list)?d.list:[]).forEach(i=>{if(EX[i]&&!seen.has(i)){seen.add(i);out.push(i)}});
  idsInOrder(d).forEach(i=>{if(!seen.has(i)){seen.add(i);out.push(i)}});
  return out;
}
function addToDay(ids){
  const d=ensureDay(S.date),have=new Set(listIds(S.date));
  d.list=listIds(S.date);
  let n=0;ids.forEach(id=>{if(EX[id]&&!have.has(id)){have.add(id);d.list.push(id);n++}});
  save();return n;
}
function removeFromDay(id){
  const d=DB.days[S.date];if(!d||setsToday(id).length)return false;
  d.list=listIds(S.date).filter(i=>i!==id);
  if(!dayHas(d)&&!d.list.length)delete DB.days[S.date];
  save();return true;
}
function replaceInDay(from,to){
  const d=ensureDay(S.date);let l=listIds(S.date);
  if(setsToday(from).length){if(!l.includes(to))l.splice(l.indexOf(from)+1,0,to)}
  else l=l.map(i=>i===from?to:i).filter((i,k,x)=>x.indexOf(i)===k);
  d.list=l;save();
}
const tplIds=w=>SLOTS.filter(s=>s.w===w).map(s=>curId(s.id));
function lastDayBefore(date){const l=daysAsc().filter(d=>d.date<date);return l[l.length-1]||null}
function recentIds(){
  const out=[],seen=new Set();
  daysAsc().reverse().forEach(d=>idsInOrder(d).slice().reverse().forEach(id=>{if(!seen.has(id)){seen.add(id);out.push(id)}}));
  return out;
}

/* ---------- wykresy (SVG) ---------- */
function nice(min,max,n){
  n=n||4;
  if(min===max){const p=Math.abs(min)*.1||1;min-=p;max+=p}
  const raw=(max-min)/n,mag=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/mag;
  const step=(f<=1?1:f<=2?2:f<=5?5:10)*mag;
  const lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step,ticks=[];
  for(let v=lo;v<=hi+1e-9;v+=step)ticks.push(+v.toFixed(6));
  return {lo:lo,hi:hi,ticks:ticks};
}
function lineSVG(pts,color,label){
  const W=340,H=200,L=40,R=16,T=18,B=30,n=pts.length;
  const ys=pts.map(p=>p.y);const sc=nice(Math.min.apply(null,ys),Math.max.apply(null,ys));
  if(Math.min.apply(null,ys)>=0&&sc.lo<0)sc.lo=0;
  const X=i=>n===1?L+(W-L-R)/2:L+i*(W-L-R)/(n-1),Y=v=>T+(H-T-B)*(1-(v-sc.lo)/((sc.hi-sc.lo)||1));
  let g="";sc.ticks.forEach(t=>{if(t<sc.lo-1e-9)return;g+=`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-6}" y="${Y(t)+4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${nf(t)}</text>`});
  const every=Math.ceil(n/5);let xl="";pts.forEach((p,i)=>{if(n<=6||i%every===0||i===n-1)xl+=`<text x="${X(i)}" y="${H-10}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${fmtS(p.date)}</text>`});
  const path=pts.map((p,i)=>(i?"L":"M")+X(i).toFixed(1)+","+Y(p.y).toFixed(1)).join(" ");
  const dots=pts.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.y)}" r="5" style="fill:${color};stroke:var(--card)" stroke-width="2"/>`).join("");
  const lp=pts[n-1];
  const val=`<text x="${X(n-1)}" y="${Y(lp.y)-10}" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--ink)">${nf(lp.y)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}${n>1?`<path d="${path}" fill="none" style="stroke:${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`:""}${dots}${val}${xl}</svg>`;
}
function barsSVG(weeks){
  const W=340,H=190,L=30,R=10,T=14,B=30,n=weeks.length,mx=Math.max(3,Math.max.apply(null,weeks.map(w=>w.cnt)));
  const Y=v=>T+(H-T-B)*(1-v/mx),bw=(W-L-R)/n;
  let g="";for(let t=0;t<=mx;t++)g+=`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" style="stroke:var(--line)"/><text x="${L-6}" y="${Y(t)+4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${t}</text>`;
  const every=Math.ceil(n/7);
  const bars=weeks.map((w,i)=>{const x=L+i*bw+bw*.15,h=(H-T-B)*(w.cnt/mx),c=w.cnt>=2?"var(--green)":w.cnt===1?"var(--yellow)":"var(--line)";
    return `<rect x="${x}" y="${Y(w.cnt)}" width="${bw*.7}" height="${Math.max(h,2)}" rx="4" style="fill:${c}"${w.cur?' stroke-dasharray="3 2" stroke="var(--ink)" stroke-width="1"':""}/>`+(i%every===0||i===n-1?`<text x="${x+bw*.35}" y="${H-10}" text-anchor="middle" font-size="10" style="fill:var(--muted)">${fmtS(w.k)}</text>`:"")}).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Liczba treningów w tygodniu, cel 2">${g}${bars}<line x1="${L}" x2="${W-R}" y1="${Y(2)}" y2="${Y(2)}" stroke-dasharray="5 4" stroke-width="2" style="stroke:var(--red)"/><text x="${W-R}" y="${Y(2)-5}" text-anchor="end" font-size="11" font-weight="700" style="fill:var(--red)">cel 2</text></svg>`;
}
function freq(){
  const ds=[...new Set(daysAsc().map(d=>d.date))];
  if(!ds.length)return {weeks:[],total:0,planPct:null,streak:0,longest:0};
  const cnt={};ds.forEach(s=>{const k=ymd(mon(parseD(s)));cnt[k]=(cnt[k]||0)+1});
  const first=mon(parseD(ds[0])),now=mon(new Date()),weeks=[];
  for(const d=new Date(first);d<=now;d.setDate(d.getDate()+7)){const k=ymd(d);weeks.push({k:k,cnt:cnt[k]||0,end:new Date(d.getFullYear(),d.getMonth(),d.getDate()+6),cur:ymd(d)===ymd(now)})}
  const t0=parseD(todayStr());const done=weeks.filter(w=>w.end<t0);
  const planPct=done.length?done.reduce((a,w)=>a+Math.min(w.cnt,2),0)/(2*done.length):null;
  let streak=0,i=weeks.length-1;if(weeks[i]&&weeks[i].cnt<2)i--;while(i>=0&&weeks[i].cnt>=2){streak++;i--}
  let longest=0,run=0;weeks.forEach(w=>{if(w.cnt>=2){run++;longest=Math.max(longest,run)}else run=0});
  return {weeks:weeks,total:ds.length,planPct:planPct,streak:streak,longest:longest};
}
function chartOptions(){
  const have=new Set();daysAsc().forEach(d=>Object.keys(d.ex).forEach(i=>{if(EX[i])have.add(i)}));
  const byG={};
  have.forEach(id=>{const g=EX[id].g[0];(byG[g]=byG[g]||[]).push(EX[id])});
  return GROUPS.filter(g=>byG[g.id]).map(g=>({label:g.name,items:byG[g.id].sort((x,y)=>ORDER[x.id]-ORDER[y.id])}));
}

/* ---------- widoki ---------- */
function exRow(id){
  const p=EX[id],ss=setsToday(id),prev=prevSession(id,S.date),n=Math.max(p.sets,ss.length);
  let dots="";for(let i=0;i<n;i++)dots+=`<span class="dot${i<ss.length?" on":""}"></span>`;
  const tgt=`${p.sets} × ${p.lo}–${p.hi}${unitTxt(p)}${p.side?"/str.":""}`;
  const last=ss.length?setStr(ss,p):prev?"ostatnio "+setStr(prev.sets.slice(0,1),p):"";
  const rot=p.slot&&rotOf(p.slot)&&curId(p.slot)===id?EX[curIdAt(p.slot,nextWeekDate())]:null;
  return `<button class="ex${ss.length>=p.sets?" done":""}" data-act="open" data-id="${id}"><span><b>${esc(p.name)}</b>${p.en?`<small class="en">${esc(p.en)}</small>`:""}<small>${esc(gName(p.g[0]))} · ${tgt}${last?" · "+esc(last):""}</small>${rot?`<small>Rotacja, za tydzień: ${esc(rot.name)}</small>`:""}</span><span class="dots" aria-label="Wykonane serie: ${ss.length} z ${p.sets}">${dots}<span class="chev" aria-hidden="true">›</span></span></button>`;
}
function viewTrain(){
  const d=dayOf(),ds=dayHas(d),ids=listIds(S.date);
  let h=`<h1>Trening</h1><div class="row between"><div class="datebox"><label class="small muted" for="dateIn">Data</label><input id="dateIn" type="date" value="${esc(S.date)}"></div>${S.date!==todayStr()?`<button class="btn ghost sm" data-act="today">Dziś</button>`:""}</div>`;
  const ph=phaseHint();if(ph)h+=`<div class="hint">${esc(ph)}</div>`;
  if(ds){
    let sets=0,volume=0,t0=1e15,t1=0,n=0;
    Object.keys(d.ex).forEach(id=>{const ss=d.ex[id];n++;sets+=ss.length;volume+=vol(ss);ss.forEach(x=>{if(x.t){t0=Math.min(t0,x.t);t1=Math.max(t1,x.t)}})});
    const mins=t1>t0?Math.round((t1-t0)/60000):0;
    h+=`<div class="card"><div class="row between"><div><h3>Zrobione tego dnia</h3><p class="muted small">${n} ćwicz. · ${sets} serii · objętość ${Math.round(volume).toLocaleString("pl-PL")} kg${mins?` · ok. ${mins} min`:""}</p></div><button class="btn sm" data-act="summary">Zakończ</button></div></div>`;
  }
  if(S.rest)h+=`<button class="pill rest-pill" data-act="clrrest" aria-label="Zatrzymaj stoper przerwy">Przerwa <span class="rest-t"></span></button>`;
  if(!ids.length){
    const ld=lastDayBefore(S.date);
    h+=`<div class="card"><h3>Co dziś robisz?</h3><p class="small muted">Wybierz ćwiczenia z biblioteki (${Object.keys(EX).length} ćwiczeń) albo zacznij od szablonu.<br>Szablon A: ${esc(FOCUS.A)}.<br>Szablon B: ${esc(FOCUS.B)}.</p><div class="stack"><button class="btn" data-act="libopen">Wybierz ćwiczenia</button><div class="row2"><button class="btn ghost" data-act="tpl" data-w="A">Szablon A</button><button class="btn ghost" data-act="tpl" data-w="B">Szablon B</button></div>${ld?`<button class="btn ghost" data-act="repeat">Powtórz trening z ${fmtS(ld.date)}</button>`:""}</div></div>`;
  }else{
    h+=`<div class="grp">Lista na ten dzień · ${ids.length} ćwicz.</div>`+ids.map(exRow).join("");
    h+=`<div class="stack"><button class="btn" data-act="libopen">+ Dodaj ćwiczenie</button><div class="row2"><button class="btn ghost sm" data-act="tpl" data-w="A">Dodaj szablon A</button><button class="btn ghost sm" data-act="tpl" data-w="B">Dodaj szablon B</button></div></div>`;
  }
  return h;
}
function viewHist(){
  const list=daysAsc().reverse();
  let h=`<h1>Historia</h1>`;
  if(!list.length)h+=`<div class="empty"><p><b>Brak zapisanych treningów</b></p><p>Zapisz pierwszą serię w zakładce Trening, a pojawi się tutaj.</p></div>`;
  list.forEach(d=>{
    let sets=0,volume=0;Object.keys(d.ex).forEach(id=>{sets+=d.ex[id].length;volume+=vol(d.ex[id])});
    const tag=dayTag(d);
    h+=`<details class="card"><summary style="list-style:none;cursor:pointer"><div class="row between"><div><h3>${fmtD(d.date)}</h3><p class="muted small">${idsInOrder(d).length} ćwicz. · ${sets} serii · ${Math.round(volume).toLocaleString("pl-PL")} kg</p></div><div class="row"><span class="badge ${tag}">${tag}</span>${d.demo?'<span class="badge demo">demo</span>':""}</div></div></summary>
    <div style="margin-top:10px">${idsInOrder(d).map(id=>`<p><b>${esc(EX[id].name)}</b><br><span class="muted">${esc(setStr(d.ex[id],EX[id]))}</span></p>`).join("")}
    <button class="btn danger sm" data-act="delday" data-d="${esc(d.date)}" style="margin-top:8px">${S.confirm==="day:"+d.date?"Na pewno usunąć?":"Usuń trening"}</button></div></details>`;
  });
  return h;
}
function viewCharts(){
  const groups=chartOptions(),all=[].concat.apply([],groups.map(g=>g.items));
  if(!all.length)return `<h1>Wykresy</h1><div class="empty"><p>Wykresy pojawią się po pierwszym zapisanym treningu.</p></div>`;
  if(!S.chartEx||!all.some(x=>x.id===S.chartEx))S.chartEx=all[0].id;
  const p=EX[S.chartEx],ss=sessionsFor(p.id);
  let h=`<h1>Wykresy</h1><label class="lbl" for="chartEx">Ćwiczenie</label><select id="chartEx" class="pick">${groups.map(g=>`<optgroup label="${esc(g.label)}">${g.items.map(x=>`<option value="${x.id}"${x.id===p.id?" selected":""}>${esc(x.name)}</option>`).join("")}</optgroup>`).join("")}</select>`;
  const rp=ss.map(s=>({date:s.date,y:sumR(s.sets)})),kp=ss.map(s=>({date:s.date,y:maxK(s.sets)}));
  const unit=p.unit==="sec"?"s":p.unit==="min"?"min":"powt.";
  h+=`<h2>1. Zmiana powtórzeń</h2>`;
  if(!ss.length)h+=`<div class="empty">Brak zapisanych treningów tego ćwiczenia.</div>`;
  else{
    const a=rp[0].y,b=rp[rp.length-1].y;
    h+=`<div class="card row between"><div><span class="lbl">Start</span><br><b style="font-size:22px">${nf(a)}</b></div><div><span class="lbl">Teraz</span><br><b style="font-size:22px">${nf(b)}</b></div><div style="text-align:right"><span class="lbl">Zmiana (${unit})</span><br><b style="font-size:22px">${rp.length>1?arrow(b-a):"–"}</b></div></div>`;
    h+=`<div class="chartbox">${lineSVG(rp,"var(--accent)","Suma "+unit+" w kolejnych treningach")}</div>`;
    h+=`<div class="card"><table class="t"><thead><tr><th>Nr</th><th>Data</th><th>Suma</th><th>vs poprz.</th><th>vs start</th></tr></thead><tbody>${rp.map((x,i)=>`<tr><td>${i+1}</td><td>${fmtS(x.date)}</td><td><b>${nf(x.y)}</b></td><td>${i?arrow(x.y-rp[i-1].y):""}</td><td>${i?arrow(x.y-rp[0].y):""}</td></tr>`).join("")}</tbody></table></div>`;
    h+=`<h2>2. Zmiana obciążenia</h2>`;
    const ka=kp[0].y,kb=kp[kp.length-1].y;
    h+=`<div class="card row between"><div><span class="lbl">Start</span><br><b style="font-size:22px">${nf(ka)} kg</b></div><div><span class="lbl">Teraz</span><br><b style="font-size:22px">${nf(kb)} kg</b></div><div style="text-align:right"><span class="lbl">Zmiana</span><br><b style="font-size:22px">${kp.length>1?arrow(kb-ka,x=>nf(x)+" kg"):"–"}</b></div></div>`;
    if(!hasKg(p))h+=`<p class="muted small">${timed(p)?"Ćwiczenie na czas":"Ćwiczenie bez obciążenia"}: ciężar nie dotyczy.</p>`;
    else{
      if(p.bw)h+=`<p class="muted small">Dla ćwiczeń z masą ciała ciężar to tylko dodatkowe obciążenie.</p>`;
      h+=`<div class="chartbox">${lineSVG(kp,"var(--red)","Maksymalny ciężar w kolejnych treningach")}</div>`;
      h+=`<div class="card"><table class="t"><thead><tr><th>Nr</th><th>Data</th><th>Maks. kg</th><th>Zmiana kg</th><th>Zmiana %</th></tr></thead><tbody>${kp.map((x,i)=>`<tr><td>${i+1}</td><td>${fmtS(x.date)}</td><td><b>${nf(x.y)}</b></td><td>${i?arrow(x.y-kp[i-1].y):""}</td><td>${i&&kp[i-1].y>0?arrow((x.y/kp[i-1].y-1)*100,v=>nf(v)+"%"):""}</td></tr>`).join("")}</tbody></table></div>`;
    }
  }
  const f=freq();
  h+=`<h2>3. Frekwencja (plan: 2 × w tygodniu)</h2>`;
  if(!f.total)h+=`<div class="empty">Frekwencja pojawi się po pierwszym treningu.</div>`;
  else{
    h+=`<div class="stats"><div class="stat"><b>${f.planPct===null?"–":Math.round(f.planPct*100)+"%"}</b><span>wykonanie planu (zakończone tygodnie)</span></div><div class="stat"><b>${f.streak}</b><span>tyg. z rzędu z 2 treningami</span></div><div class="stat"><b>${f.longest}</b><span>najdłuższa seria tygodni</span></div><div class="stat"><b>${f.total}</b><span>treningów łącznie</span></div></div>`;
    h+=`<div class="chartbox">${barsSVG(f.weeks.slice(-16))}</div><p class="muted small">Zielony: 2 lub więcej treningów, żółty: 1. Obrys przerywany to bieżący tydzień. Trening liczy się, gdy ma co najmniej jedną serię.</p>`;
  }
  return h;
}
function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)}
function isStandalone(){return !!(window.navigator.standalone||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches))}
function viewTemplates(){
  const rows=w=>SLOTS.filter(s=>s.w===w).map(s=>{const c=EX[curId(s.id)],r=rotOf(s.id);return `<button class="opt" data-act="slotpick" data-id="${s.id}"><span class="optmain"><b>${esc(c.name)}</b>${r?'<span class="tag cur">rotacja</span>':""}</span><span class="small muted">Miejsce w szablonie: ${esc(s.name)} · zmień ›</span></button>`}).join("");
  return `<div class="card"><h3>Szablony treningów A i B</h3><p class="small muted">Gotowe listy ćwiczeń (przyciski Szablon na ekranie Trening). Tu zmieniasz ćwiczenia w szablonie i ustawiasz rotację co tydzień. Z szablonu nie musisz korzystać: ćwiczenia wybierasz też swobodnie z biblioteki.</p><details><summary class="sum">Trening A · ${esc(FOCUS.A)}</summary>${rows("A")}</details><details><summary class="sum">Trening B · ${esc(FOCUS.B)}</summary>${rows("B")}</details></div>`;
}
function viewCustoms(){
  const cs=Object.keys(DB.custom).filter(id=>EX[id]);
  if(!cs.length)return "";
  return `<div class="card"><h3>Własne ćwiczenia</h3>${cs.map(id=>{const e=EX[id],used=sessionsFor(id).length>0;return `<div class="row between" style="margin-top:10px"><div><b>${esc(e.name)}</b><br><span class="small muted">${esc(gName(e.g[0]))} · ${esc(eqName(e.eq))}</span></div>${used?'<span class="small muted">ma historię</span>':`<button class="btn danger sm" data-act="delcustom" data-id="${id}">${S.confirm==="cust:"+id?"Na pewno?":"Usuń"}</button>`}</div>`}).join("")}</div>`;
}
function viewMore(){
  const le=DB.meta.lastExport?new Date(DB.meta.lastExport).toLocaleDateString("pl-PL"):"jeszcze nie robiona";
  const hasDemo=Object.values(DB.days).some(d=>d&&d.demo);
  return `<h1>Więcej</h1>
  <div class="card"><h3>Instalacja na telefonie</h3>
   <p class="small">Otwórz tę stronę w Safari, wybierz Udostępnij, a potem „Do ekranu początkowego”. Aplikacja będzie działać jak zwykła, także bez internetu.</p>
   <p class="small muted">${isStandalone()?"Ta aplikacja jest już zainstalowana na ekranie początkowym.":isIOS()?"Safari może usunąć dane stron, z których nie korzystałeś przez 7 dni. Aplikacja z ekranu początkowego jest z tego wyłączona.":"Dane są trzymane w tej przeglądarce."}</p></div>
  <div class="card"><h3>Kopia zapasowa</h3>
   <p class="small muted">Ostatnia kopia: ${esc(le)}. Dane są tylko na tym urządzeniu, więc zrób kopię przed zmianą telefonu lub czyszczeniem przeglądarki.</p>
   <div class="stack"><button class="btn" data-act="exportjson">Eksportuj dane (JSON)</button>
   <button class="btn ghost" data-act="exportcsv">Eksportuj do arkusza (CSV)</button>
   <button class="btn ghost" data-act="copyjson">Kopiuj dane do schowka</button></div>
   <p class="lbl" style="margin-top:14px">Import z pliku JSON</p>
   <input id="importFile" type="file" accept="application/json,.json,text/plain" class="file">
   <p class="lbl" style="margin-top:10px">Albo wklej dane</p>
   <textarea id="importText" rows="3" placeholder="Wklej tutaj zawartość kopii JSON"></textarea>
   <button class="btn ghost" data-act="importtext" style="margin-top:8px">Importuj wklejone dane</button>
   <p class="small muted">Import dopisuje treningi, własne ćwiczenia i ustawienia szablonów z kopii. Jeśli dzień o tej samej dacie już istnieje, zostanie zastąpiony.</p></div>
  ${viewTemplates()}${viewCustoms()}
  <div class="card"><h3>Ustawienia</h3>
   <label class="sw"><input type="checkbox" id="hintToggle"${DB.settings.hint?" checked":""}> <span>Podpowiedź „powrót po przerwie” w pierwszych 4 tygodniach</span></label>
   <button class="btn ghost" data-act="resetchoice" style="margin-top:12px">${S.confirm==="resetchoice"?"Na pewno przywrócić?":"Przywróć domyślne szablony A i B"}</button></div>
  <div class="card"><h3>Dane przykładowe</h3>
   <p class="small muted">Pięć tygodni przykładowych treningów, żeby zobaczyć, jak wyglądają wykresy. Możesz je w każdej chwili usunąć.</p>
   <div class="stack"><button class="btn ghost" data-act="demo">Wczytaj dane przykładowe</button>${hasDemo?`<button class="btn ghost" data-act="undemo">Usuń dane przykładowe</button>`:""}</div></div>
  <div class="card"><h3>Usuń dane</h3>
   <button class="btn danger" data-act="wipe">${S.confirm==="wipe"?"Na pewno usunąć wszystkie treningi?":"Usuń wszystkie treningi"}</button></div>
  <div class="card"><h3>O aplikacji</h3>
   <p class="small muted">Dziennik treningowy ${APP_VERSION}. Swobodny wybór ćwiczeń z biblioteki (${Object.keys(EX).length} ćwiczeń) oraz szablony A i B. Wszystkie dane zostają na Twoim urządzeniu. To narzędzie do zapisywania treningów, a nie porada medyczna. Przy bólu promieniującym, drętwieniu lub narastających dolegliwościach skonsultuj się z lekarzem lub fizjoterapeutą.</p></div>`;
}
function renderTabs(){document.querySelectorAll(".tabbar [role=tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.v===S.tab)))}
function renderAll(){
  renderTabs();
  $("#view").innerHTML=S.tab==="train"?viewTrain():S.tab==="hist"?viewHist():S.tab==="charts"?viewCharts():viewMore();
  renderSheet();renderPick();renderLib();renderSummary();tickRest();renderStatus();
}
function renderStatus(){
  const el=$("#status");if(!el)return;
  let t="Dane zapisane na tym urządzeniu",c="";
  const due=daysAsc().length>=8&&(!DB.meta.lastExport||Date.now()-DB.meta.lastExport>30*864e5);
  if(isIOS()&&!isStandalone()){t="Zapisane w przeglądarce. Dodaj do ekranu początkowego (Więcej), żeby Safari ich nie usunęło.";c="warn"}
  else if(due){t="Pora na kopię zapasową (Więcej)";c="warn"}
  el.textContent=t;el.className="status "+c;
}

/* ---------- ekran ćwiczenia ---------- */
function lockScroll(){document.documentElement.style.overflow=(S.open||S.pick||S.summary||S.lib)?"hidden":""}
function renderSheet(){
  const el=$("#sheet");
  if(!S.open){el.hidden=true;el.innerHTML="";lockScroll();return}
  const p=EX[S.open],ss=setsToday(p.id),dr=draftFor(p.id),prev=prevSession(p.id,S.date),hint=hintFor(p),oh=otherHistory(p),sec=timed(p);
  let h=`<div class="topbar"><button class="back" data-act="close">‹ Lista</button><h3 style="flex:1;text-align:center;padding-right:60px">${esc(p.name)}</h3></div><div class="wrap" style="padding-top:12px">`;
  h+=`${p.en?`<p class="en">${esc(p.en)}</p>`:""}<p class="muted small">${esc(p.g.map(gName).join(", "))} · ${esc(eqName(p.eq))}</p><p class="muted">Cel: ${p.sets} × ${p.lo}–${p.hi}${unitTxt(p)}${p.side?" na stronę":""}${p.rest?" · przerwa "+mmss(p.rest):""}</p>`;
  h+=`<button class="swap" data-act="swap">⇄ Zamień na inne ćwiczenie<span class="muted small">z biblioteki</span></button>`;
  if(!ss.length&&listIds(S.date).includes(p.id))h+=`<button class="btn ghost sm" data-act="rmex" style="margin:0 0 8px">Usuń z listy na ten dzień</button>`;
  if(p.note)h+=`<div class="hint">Zamiennik: ${esc(p.note)}</div>`;
  if(prev)h+=`<div class="hint">Ostatnio (${fmtS(prev.date)}): <b>${esc(setStr(prev.sets,p))}</b></div>`;
  else if(oh)h+=`<div class="hint">To ćwiczenie nie ma jeszcze historii. Ostatnio na tym miejscu w planie: ${esc(oh.name)} (${fmtS(oh.date)}). Ciężar może być inny, zacznij lżej.</div>`;
  if(hint)h+=`<div class="hint good">${esc(hint)}</div>`;
  if(S.rest)h+=`<button class="pill rest-pill" data-act="clrrest" aria-label="Zatrzymaj stoper przerwy">Przerwa <span class="rest-t"></span></button>`;
  h+=`<div class="card"><h3>Seria ${ss.length+1}</h3>
  <div class="lbl" style="margin-top:10px">${sec?(p.unit==="min"?"Minuty":"Sekundy"):"Powtórzenia"}${p.side&&!sec?" (na stronę)":""}</div>
  <div class="stepper"><button data-act="step" data-f="r" data-d="-1" aria-label="Mniej">−</button><input id="in-r" type="text" inputmode="numeric" pattern="[0-9]*" value="${dr.r}" aria-label="${sec?(p.unit==="min"?"Minuty":"Sekundy"):"Powtórzenia"}"><button data-act="step" data-f="r" data-d="1" aria-label="Więcej">+</button></div>`;
  if(hasKg(p))h+=`<div class="lbl">${p.bw?"Dodatkowy ciężar (kg), 0 = masa ciała":"Ciężar (kg)"}</div>
  <div class="stepper"><button data-act="step" data-f="k" data-d="-1" aria-label="Mniej">−</button><input id="in-k" type="text" inputmode="decimal" value="${String(dr.k).replace(".",",")}" aria-label="Ciężar w kilogramach"><button data-act="step" data-f="k" data-d="1" aria-label="Więcej">+</button></div>`;
  h+=`<button class="btn green" data-act="save">Zapisz serię ${ss.length+1}</button></div>`;
  if(ss.length)h+=`<div class="card"><h3>Zapisane tego dnia</h3>`+ss.map((x,i)=>`<div class="setrow"><span class="setno">${i+1}</span><span class="v">${x.r}${unitTxt(p)}${x.k?" × "+nf(x.k)+" kg":""}</span><button class="xbtn" data-act="delset" data-i="${i}" aria-label="Usuń serię ${i+1}">${S.confirm==="set:"+p.id+":"+i?"Usunąć?":"✕"}</button></div>`).join("")+`</div>`;
  h+=`<details class="cue card"><summary>Wskazówki techniczne</summary><p>${esc(p.cue)}</p></details>`;
  h+=`<button class="btn ghost" data-act="close">Gotowe, wróć do listy</button></div>`;
  el.innerHTML=h;el.hidden=false;lockScroll();
}
/* ---------- wybór zamiennika ---------- */
function renderPick(){
  const el=$("#pick");
  if(!S.pick){el.hidden=true;el.innerHTML="";lockScroll();return}
  const s=SLOTS.find(x=>x.id===S.pick),cur=curId(s.id);
  let h=`<div class="topbar"><button class="back" data-act="pickclose">‹ Wróć</button><h3 style="flex:1;text-align:center;padding-right:60px">Zamień ćwiczenie</h3></div><div class="wrap" style="padding-top:12px">
  <p class="muted">Miejsce w planie: <b>${esc(s.name)}</b> (trening ${s.w}). Wybrany zamiennik zastępuje je w szablonie treningu A lub B. Serie i przerwa zostają z planu, a zakres powtórzeń może się zmienić, jeśli ćwiczenie tego wymaga.</p>`;
  s.variants.forEach(v=>{
    const e=EX[v.id];
    h+=`<button class="opt${v.id===cur?" on":""}" data-act="choose" data-id="${v.id}"><span class="optmain"><b>${esc(e.name)}</b>${v.id===s.id?'<span class="tag">domyślne</span>':""}${v.id===cur?'<span class="tag cur">wybrane</span>':""}</span>${e.en?`<span class="small en">${esc(e.en)}</span>`:""}<span class="small muted">${e.sets} × ${e.lo}–${e.hi}${unitTxt(e)}${e.side?"/str.":""}${e.bw?" · masa ciała":""}</span>${e.note?`<span class="small">${esc(e.note)}</span>`:`<span class="small">Ćwiczenie z domyślnego planu.</span>`}</button>`;
  });
  const rot=rotOf(s.id);
  if(rot){
    const nx=EX[curIdAt(s.id,nextWeekDate())];
    h+=`<div class="card" style="margin-top:14px"><h3>Rotacja co tydzień</h3><p class="small">Tydzień z ${fmtS(S.date)}: <b>${esc(EX[cur].name)}</b><br>Tydzień później: <b>${esc(nx.name)}</b></p><button class="btn ghost" data-act="rotOff">Wyłącz rotację (zostaje: ${esc(EX[cur].name)})</button></div>`;
  }else{
    const cands=s.variants.filter(v=>v.id!==cur).sort((x,y)=>(y.id==="flatdb")-(x.id==="flatdb"));
    h+=`<div class="card" style="margin-top:14px"><h3>Rotacja co tydzień</h3><p class="small muted">W tym tygodniu (${fmtS(S.date)}) zostaje: <b>${esc(EX[cur].name)}</b>. W następnym tygodniu aplikacja sama pokaże ćwiczenie wybrane poniżej, potem znowu to pierwsze, i tak na przemian. Historia każdego ćwiczenia zapisuje się osobno.</p><label class="lbl" for="rotPartner">Naprzemiennie z</label><select id="rotPartner" class="pick" style="font-size:16px">${cands.map(v=>`<option value="${v.id}">${esc(EX[v.id].name)}</option>`).join("")}</select><button class="btn" data-act="rotOn" style="margin-top:10px">Włącz rotację co tydzień</button></div>`;
  }
  h+=`<p class="small muted" style="margin-top:14px">Zamienniki dobrano według wzorca ruchu i pracujących mięśni. Badania porównujące maszyny z wolnymi ciężarami wskazują na podobny przyrost mięśni przy równej objętości treningu, ale część zamienników nie ma bezpośrednich badań. Historia każdego ćwiczenia jest liczona osobno.</p>`;
  h+=`<button class="btn ghost" data-act="pickclose">Zamknij</button></div>`;
  el.innerHTML=h;el.hidden=false;lockScroll();
}
/* ---------- biblioteka ćwiczeń (wybór) ---------- */
function libList(){
  const L=S.lib,toks=norm(L.q).split(/\s+/).filter(Boolean),inList=new Set(listIds(S.date));
  let ids=Object.keys(EX).filter(id=>EX[id].g);
  if(L.g==="fav")ids=ids.filter(id=>DB.fav.includes(id));
  else if(L.g==="recent")ids=recentIds().filter(id=>EX[id]);
  else if(L.g!=="all")ids=ids.filter(id=>EX[id].g.includes(L.g));
  if(L.eq!=="all")ids=ids.filter(id=>EX[id].eq===L.eq);
  if(toks.length)ids=ids.filter(id=>{const e=EX[id],hay=norm(e.name+" "+e.g.map(gName).join(" ")+" "+eqName(e.eq)+" "+(e.alias||"")+" "+(e.en||""));return toks.every(t=>hay.includes(t))});
  if(L.g!=="recent"){
    const gi=id=>GROUPS.findIndex(g=>g.id===EX[id].g[0]);
    ids.sort((x,y)=>{
      if(toks.length){const st=id=>(norm(EX[id].name).startsWith(toks[0])||norm(EX[id].en||"").startsWith(toks[0]))?0:1,sx=st(x),sy=st(y);if(sx!==sy)return sx-sy}
      else if(L.g==="all"&&gi(x)!==gi(y))return gi(x)-gi(y);
      else if(L.g!=="all"&&L.g!=="fav"){const px=EX[x].g[0]===L.g?0:1,py=EX[y].g[0]===L.g?0:1;if(px!==py)return px-py}
      return EX[x].name.localeCompare(EX[y].name,"pl");
    });
  }
  return {ids:ids,inList:inList};
}
function libRowsHTML(r){
  if(!r.ids.length)return `<div class="empty"><p><b>Brak wyników</b></p><p class="small">Zmień filtr albo dodaj własne ćwiczenie poniżej.</p></div>`;
  return r.ids.map(id=>{
    const e=EX[id],fav=DB.fav.includes(id),on=r.inList.has(id);
    const tgt=`${e.sets} × ${e.lo}–${e.hi}${unitTxt(e)}${e.side?"/str.":""}`;
    return `<div class="lrow"><button class="lmain${on?" on":""}" data-act="libpick" data-id="${id}"><span class="optmain"><b>${esc(e.name)}</b>${on?'<span class="tag cur">na liście</span>':""}${e.custom?'<span class="tag">własne</span>':""}</span>${e.en?`<span class="small en">${esc(e.en)}</span>`:""}<span class="small muted">${esc(e.g.map(gName).join(", "))} · ${esc(eqName(e.eq))} · ${tgt}</span></button><button class="star" data-act="libfav" data-id="${id}" aria-pressed="${fav}" aria-label="${fav?"Usuń z ulubionych":"Dodaj do ulubionych"}">${fav?"★":"☆"}</button></div>`;
  }).join("");
}
function libRefresh(){
  const L=S.lib;if(!L||L.form)return;
  document.querySelectorAll("#lib .chip").forEach(b=>{const on=b.dataset.act==="libg"?L.g===b.dataset.k:L.eq===b.dataset.k;b.setAttribute("aria-pressed",String(on))});
  const r=libList(),list=$("#libList"),cnt=$("#libCount");
  if(list)list.innerHTML=libRowsHTML(r);
  if(cnt)cnt.textContent=r.ids.length+" ćwiczeń"+(L.mode==="replace"?" · wybierz zamiennik":" · na liście: "+r.inList.size);
}
function renderLib(){
  const el=$("#lib");
  if(!S.lib){el.hidden=true;el.innerHTML="";lockScroll();return}
  const L=S.lib;
  if(!L.rebuild&&!el.hidden&&el.firstChild){libRefresh();return}
  L.rebuild=false;
  let h;
  if(L.form){
    h=`<div class="topbar"><button class="back" data-act="libformclose">‹ Wróć</button><h3 style="flex:1;text-align:center;padding-right:60px">Własne ćwiczenie</h3></div><div class="wrap" style="padding-top:12px">
    <label class="lbl" for="cName">Nazwa</label><input id="cName" class="field" type="text" maxlength="60" value="${esc(L.nameDraft||"")}" autocomplete="off" placeholder="np. Wyciskanie na maszynie Hammer">
    <label class="lbl" for="cGroup" style="display:block;margin-top:14px">Główna partia</label><select id="cGroup" class="field">${GROUPS.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select>
    <label class="lbl" for="cEq" style="display:block;margin-top:14px">Sprzęt</label><select id="cEq" class="field">${EQUIP.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join("")}</select>
    <label class="lbl" for="cKind" style="display:block;margin-top:14px">Jak zapisujesz serie</label><select id="cKind" class="field"><option value="w">Powtórzenia i ciężar (kg)</option><option value="bw">Masa ciała, ciężar dodatkowy opcjonalnie</option><option value="nw">Same powtórzenia, bez ciężaru</option><option value="sec">Czas w sekundach</option><option value="min">Czas w minutach (np. cardio)</option></select>
    <label class="sw" style="margin-top:16px"><input type="checkbox" id="cSide"> <span>Ćwiczenie jednostronne (powtórzenia na każdą stronę)</span></label>
    <button class="btn" data-act="libsavecustom" style="margin-top:18px">Zapisz${L.mode==="replace"?" i zamień":" i dodaj do treningu"}</button>
    <button class="btn ghost" data-act="libformclose" style="margin-top:8px">Anuluj</button></div>`;
  }else{
    const gs=[["all","Wszystkie"],["fav","★ Ulubione"],["recent","Ostatnie"]].concat(GROUPS.map(g=>[g.id,g.name]));
    const es=[["all","Dowolny sprzęt"]].concat(EQUIP.map(e=>[e.id,e.name]));
    h=`<div class="libtop"><div class="topbar"><button class="back" data-act="libclose">‹ ${L.mode==="replace"?"Anuluj":"Gotowe"}</button><h3 style="flex:1;text-align:center;padding-right:60px">${L.mode==="replace"?"Zamień ćwiczenie":"Dodaj ćwiczenia"}</h3></div>
    <input id="libQ" class="search" type="search" placeholder="Szukaj, np. wyciskanie, plecy, hantle" value="${esc(L.q)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Szukaj ćwiczenia">
    <div class="chips" role="group" aria-label="Grupa mięśniowa">${gs.map(x=>`<button class="chip" data-act="libg" data-k="${x[0]}" aria-pressed="false">${esc(x[1])}</button>`).join("")}</div>
    <div class="chips" role="group" aria-label="Sprzęt">${es.map(x=>`<button class="chip" data-act="libe" data-k="${x[0]}" aria-pressed="false">${esc(x[1])}</button>`).join("")}</div></div>
    <div class="wrap" style="padding-top:6px"><p class="small muted" id="libCount"></p><div id="libList"></div>
    <button class="btn ghost" data-act="libcustom" style="margin-top:14px">+ Dodaj własne ćwiczenie</button>
    <button class="btn" data-act="libclose" style="margin-top:8px">${L.mode==="replace"?"Anuluj":"Gotowe"}</button></div>`;
  }
  el.innerHTML=h;el.hidden=false;
  if(!L.form)libRefresh();
  lockScroll();
}
function renderSummary(){
  const el=$("#sum");
  if(!S.summary){el.hidden=true;el.innerHTML="";lockScroll();return}
  const d=dayOf();if(!dayHas(d)){S.summary=false;el.hidden=true;lockScroll();return}
  let sets=0,volume=0,t0=1e15,t1=0;
  Object.keys(d.ex).forEach(id=>{const ss=d.ex[id];sets+=ss.length;volume+=vol(ss);ss.forEach(x=>{if(x.t){t0=Math.min(t0,x.t);t1=Math.max(t1,x.t)}})});
  const mins=t1>t0?Math.round((t1-t0)/60000):0;
  let h=`<div class="topbar"><button class="back" data-act="closeSummary">‹ Wróć</button><h3 style="flex:1;text-align:center;padding-right:60px">Podsumowanie</h3></div><div class="wrap" style="padding-top:12px"><p class="muted">${fmtD(d.date)}</p>
  <div class="stats"><div class="stat"><b>${idsInOrder(d).length}</b><span>ćwiczeń</span></div><div class="stat"><b>${sets}</b><span>serii</span></div><div class="stat"><b>${Math.round(volume).toLocaleString("pl-PL")}</b><span>objętość (kg × powt.)</span></div><div class="stat"><b>${mins?mins+" min":"–"}</b><span>czas (od 1. do ostatniej serii)</span></div></div>
  <h2>Porównanie z poprzednim razem</h2>`;
  idsInOrder(d).forEach(id=>{
    const p=EX[id],ss=d.ex[id],prev=prevSession(id,d.date);
    const all=sessionsFor(id).filter(x=>x.date<d.date),pr=ss.length&&maxK(ss)>0&&all.length&&maxK(ss)>Math.max.apply(null,all.map(x=>maxK(x.sets)));
    h+=`<div class="card"><div class="row between"><h3>${esc(p.name)}</h3>${pr?'<span class="badge" style="background:var(--green)">rekord kg</span>':""}</div><p>${esc(setStr(ss,p))}</p>`;
    if(prev){const dr=sumR(ss)-sumR(prev.sets),dk=maxK(ss)-maxK(prev.sets);h+=`<p class="small muted">Powtórzenia łącznie: ${arrow(dr)} ${!hasKg(p)?"":`· Maks. ciężar: ${arrow(dk,x=>nf(x)+" kg")}`}</p>`}
    else h+=`<p class="small muted">Pierwszy zapis tego ćwiczenia.</p>`;
    h+=`</div>`;
  });
  h+=`<button class="btn" data-act="closeSummary">Zamknij</button></div>`;
  el.innerHTML=h;el.hidden=false;lockScroll();
}

/* ---------- stoper przerwy ---------- */
function tickRest(){
  document.querySelectorAll(".rest-t").forEach(el=>{
    if(!S.rest)return;const s=Math.floor((Date.now()-S.rest.t0)/1000),tg=EX[S.rest.id].rest;
    el.textContent=mmss(s)+" / "+mmss(tg);
    const pill=el.closest(".rest-pill");if(pill)pill.classList.toggle("ok",s>=tg);
  });
}
setInterval(tickRest,1000);

/* ---------- eksport / import ---------- */
function exportObj(){return {app:"dziennik-treningowy",version:3,exportedAt:new Date().toISOString(),choice:DB.choice,rotation:DB.rotation,custom:DB.custom,fav:DB.fav,days:DB.days}}
function download(text,name,type){
  const url=URL.createObjectURL(new Blob([text],{type:type}));
  const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1500);
}
function markExport(){DB.meta.lastExport=Date.now();save();if(S.tab==="more")renderAll()}
async function shareOrDownload(text,name,type){
  try{
    const file=new File([text],name,{type:type});
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return true}
  }catch(e){if(e&&e.name==="AbortError")return false}
  download(text,name,type);return true;
}
async function exportJSON(){
  if(!Object.keys(DB.days).length){toast("Brak danych do eksportu");return}
  const ok=await shareOrDownload(JSON.stringify(exportObj(),null,1),"trening-kopia-"+todayStr()+".json","application/json");
  if(ok){markExport();toast("Kopia gotowa")}
}
async function exportCSV(){
  const rows=[["data","trening","cwiczenie","seria","powtorzenia_lub_sekundy","kg","grupa"]];
  Object.values(DB.days).filter(dayHas).sort((a,b)=>a.date<b.date?-1:1).forEach(d=>idsInOrder(d).forEach(id=>d.ex[id].forEach((x,i)=>rows.push([d.date,EX[id].w||"-",EX[id].name,i+1,x.r,String(x.k).replace(".",","),gName(EX[id].g[0])]))));
  if(rows.length===1){toast("Brak danych do eksportu");return}
  const csv="\ufeff"+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(";")).join("\r\n");
  await shareOrDownload(csv,"trening-"+todayStr()+".csv","text/csv");
}
async function copyJSON(){
  const text=JSON.stringify(exportObj());
  try{await navigator.clipboard.writeText(text);markExport();toast("Skopiowano do schowka")}
  catch(e){const t=$("#importText");if(t){t.value=text;t.select();toast("Zaznacz i skopiuj tekst ręcznie")}}
}
function importData(text){
  let o;try{o=JSON.parse(text)}catch(e){toast("To nie jest poprawny plik JSON");return}
  if(o&&o.custom&&typeof o.custom==="object")Object.keys(o.custom).forEach(id=>{const c=o.custom[id];if(validCustom(id,c)&&(!EX[id]||EX[id].custom)){const cc={name:String(c.name).trim(),g:[c.g[0]],eq:c.eq,kind:c.kind,side:!!c.side};DB.custom[id]=cc;regCustom(id,cc)}});
  if(o&&Array.isArray(o.fav))o.fav.forEach(id=>{if(typeof id==="string"&&EX[id]&&!DB.fav.includes(id))DB.fav.push(id)});
  const src=o&&o.days&&typeof o.days==="object"?o.days:null;
  if(!src){toast("Brak danych treningowych w pliku");return}
  let n=0,skipped=0;
  Object.keys(src).forEach(k=>{
    const d=src[k]||{};const data=d.data&&d.data.ex?d.data:d;
    const date=isDate(data.date||"")?data.date:(isDate(k)?k:(isDate(k.replace(/^d-/,""))?k.replace(/^d-/,""):""));
    if(!date||(data.ex!==undefined&&(!data.ex||typeof data.ex!=="object"))){skipped++;return}
    const ex={};
    Object.keys(data.ex||{}).forEach(id=>{
      if(!EX[id]||!Array.isArray(data.ex[id]))return;
      const sets=data.ex[id].map(x=>({r:Math.min(999,Math.round(num(x&&x.r))),k:Math.min(1000,num(x&&x.k)),t:Number(x&&x.t)||0})).filter(x=>x.r>0);
      if(sets.length)ex[id]=sets;
    });
    const list=Array.isArray(data.list)?data.list.filter((i,k,x)=>EX[i]&&x.indexOf(i)===k):[];
    if(!Object.keys(ex).length&&!list.length){skipped++;return}
    const day={date:date,ex:ex};if(list.length)day.list=list;if(data.demo)day.demo=true;
    DB.days[date]=day;n++;
  });
  if(o.choice&&typeof o.choice==="object")Object.keys(o.choice).forEach(s0=>{
    let s=s0;const c=o.choice[s0];
    if(s0==="pushup"&&c==="flatdb")s="incline";   /* kopie z wersji 1.0 */
    if(EX[c]&&EX[c].slot===s){if(c===s)delete DB.choice[s];else DB.choice[s]=c}
  });
  if(o.rotation&&typeof o.rotation==="object")Object.keys(o.rotation).forEach(s=>{
    const r=o.rotation[s];
    if(r&&EX[r.a]&&EX[r.b]&&EX[r.a].slot===s&&EX[r.b].slot===s&&r.a!==r.b&&isDate(r.ref||"")){DB.rotation[s]={a:r.a,b:r.b,ref:r.ref};delete DB.choice[s]}
  });
  save();renderAll();
  toast(n?`Zaimportowano dni: ${n}${skipped?`, pominięto: ${skipped}`:""}`:"Nic nie zaimportowano");
}
function demoDays(){
  const W0={squat:16,incline:18,csrow:20,pullup:0,dips:0,cossack:0,facepull:15,pallof:7.5,rdl:18,ohp:8,pulldown:40,split:8,pushup:0,dbrow:16,lateral:4,sideplank:0};
  const bump={squat:[2,2],incline:[2,2],rdl:[2,4],pulldown:[2,-5],facepull:[2,2.5],ohp:[1,2]};
  const dates={A:["2026-08-31","2026-09-07","2026-09-14","2026-09-21","2026-09-28"],B:["2026-09-03","2026-09-17","2026-09-24"]},out=[];
  ["A","B"].forEach(w=>dates[w].forEach((dt,si)=>{
    const ex={};let t=parseD(dt).getTime()+18*3600000;
    SLOTS.filter(s=>s.w===w).forEach(s=>{
      const p=EX[s.id];const full=dt>="2026-09-14";const n=full?p.sets:Math.min(2,p.sets);
      let rs=p.unit==="sec"?[20+5*si,20+5*si,20+5*si]:[Math.min(p.hi,p.lo+si+1),Math.min(p.hi,p.lo+si),Math.min(p.hi,Math.max(1,p.lo+si-1))];
      rs=rs.slice(0,n);if(s.id==="dips"&&si===3)rs=[6,5,5];
      let k=W0[s.id];if(bump[s.id]&&si>=bump[s.id][0])k+=bump[s.id][1];
      ex[s.id]=rs.map(r=>{t+=150000;return {r:r,k:k,t:t}});
    });
    out.push({date:dt,ex:ex,demo:true});
  }));
  return out;
}

/* ---------- zdarzenia ---------- */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)}
function setConfirm(v){S.confirm=v;clearTimeout(setConfirm.t);if(v)setConfirm.t=setTimeout(()=>{S.confirm=null;renderAll()},3000)}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  if(a==="tab"){S.tab=b.dataset.v;S.confirm=null;renderAll();window.scrollTo(0,0)}
  else if(a==="filter"){S.filter=b.dataset.v;renderAll()}
  else if(a==="today"){S.date=todayStr();S.draft={};renderAll()}
  else if(a==="open"){S.open=b.dataset.id;S.confirm=null;renderAll();$("#sheet").scrollTop=0}
  else if(a==="close"){S.open=null;S.confirm=null;renderAll()}
  else if(a==="swap"){S.lib={mode:"replace",from:S.open,q:"",g:"all",eq:"all",form:false,rebuild:true};renderAll();$("#lib").scrollTop=0}
  else if(a==="slotpick"){S.pick=b.dataset.id;renderAll();$("#pick").scrollTop=0}
  else if(a==="pickclose"){S.pick=null;renderAll()}
  else if(a==="choose"){
    const id=b.dataset.id,s=slotOf(id);
    delete DB.rotation[s.id];
    if(id===s.id)delete DB.choice[s.id];else DB.choice[s.id]=id;
    delete S.draft[id];S.pick=null;save();renderAll();toast("Zmieniono ćwiczenie w szablonie");
  }
  else if(a==="libopen"){S.lib={mode:"add",q:"",g:"all",eq:"all",form:false,rebuild:true};renderAll();$("#lib").scrollTop=0}
  else if(a==="libclose"){S.lib=null;S.confirm=null;renderAll()}
  else if(a==="libg"&&S.lib){S.lib.g=b.dataset.k;libRefresh();$("#lib").scrollTop=0}
  else if(a==="libe"&&S.lib){S.lib.eq=b.dataset.k;libRefresh();$("#lib").scrollTop=0}
  else if(a==="libfav"){const id=b.dataset.id,i=DB.fav.indexOf(id);if(i>=0)DB.fav.splice(i,1);else DB.fav.push(id);save();libRefresh()}
  else if(a==="libpick"&&S.lib){
    const id=b.dataset.id;
    if(S.lib.mode==="replace"){
      const from=S.lib.from;
      if(id!==from)replaceInDay(from,id);
      delete S.draft[id];S.lib=null;S.open=id;renderAll();$("#sheet").scrollTop=0;
      if(id!==from)toast("Zamieniono ćwiczenie");
    }else if(listIds(S.date).includes(id)){
      toast(removeFromDay(id)?"Usunięto z listy":"To ćwiczenie ma już serie");libRefresh();
    }else{addToDay([id]);toast("Dodano: "+EX[id].name);libRefresh()}
  }
  else if(a==="libcustom"&&S.lib){S.lib.form=true;S.lib.nameDraft=S.lib.q||"";S.lib.rebuild=true;renderAll();const n=$("#cName");if(n)n.focus()}
  else if(a==="libformclose"&&S.lib){S.lib.form=false;S.lib.rebuild=true;renderAll()}
  else if(a==="libsavecustom"&&S.lib){
    const name=($("#cName").value||"").trim().replace(/\s+/g," ");
    if(name.length<2){toast("Wpisz nazwę ćwiczenia");return}
    if(Object.keys(EX).some(i=>norm(EX[i].name)===norm(name))){toast("Ćwiczenie o takiej nazwie już istnieje");return}
    const kind=$("#cKind").value,id="c_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    const c={name:name,g:[$("#cGroup").value],eq:$("#cEq").value,kind:["w","bw","nw","sec","min"].includes(kind)?kind:"w",side:$("#cSide").checked};
    if(!validCustom(id,c)){toast("Nie udało się zapisać ćwiczenia");return}
    DB.custom[id]=c;regCustom(id,c);
    if(S.lib.mode==="replace"){const from=S.lib.from;replaceInDay(from,id);delete S.draft[id];S.lib=null;S.open=id;renderAll();toast("Dodano własne ćwiczenie")}
    else{addToDay([id]);S.lib.form=false;S.lib.q=name;S.lib.g="all";S.lib.eq="all";S.lib.rebuild=true;save();renderAll();toast("Dodano własne ćwiczenie")}
  }
  else if(a==="tpl"){const n=addToDay(tplIds(b.dataset.w));renderAll();toast(n?"Dodano ćwiczenia: "+n:"Szablon jest już na liście")}
  else if(a==="repeat"){const ld=lastDayBefore(S.date);if(ld){const n=addToDay(idsInOrder(ld));renderAll();toast(n?"Dodano ćwiczenia: "+n:"Te ćwiczenia są już na liście")}}
  else if(a==="rmex"){if(removeFromDay(S.open)){S.open=null;toast("Usunięto z listy")}else toast("To ćwiczenie ma już serie");renderAll()}
  else if(a==="delcustom"){
    const id=b.dataset.id,key="cust:"+id;
    if(S.confirm!==key){setConfirm(key);renderAll();return}
    if(sessionsFor(id).length){toast("Ćwiczenie ma historię, nie można go usunąć");setConfirm(null);renderAll();return}
    delete DB.custom[id];delete EX[id];DB.fav=DB.fav.filter(x=>x!==id);
    Object.keys(DB.days).forEach(k=>{const d=DB.days[k];if(d&&Array.isArray(d.list)){d.list=d.list.filter(x=>x!==id);if(!dayHas(d)&&!d.list.length)delete DB.days[k]}});
    save();setConfirm(null);renderAll();toast("Usunięto ćwiczenie");
  }
  else if(a==="rotOn"){
    const s=SLOTS.find(x=>x.id===S.pick),sel=$("#rotPartner");if(!s||!sel)return;
    const cur=curId(s.id),partner=sel.value;
    if(!EX[partner]||EX[partner].slot!==s.id||partner===cur)return;
    DB.rotation[s.id]={a:cur,b:partner,ref:ymd(mon(parseD(S.date)))};delete DB.choice[s.id];
    S.draft={};save();renderAll();toast("Włączono rotację co tydzień");
  }
  else if(a==="rotOff"){
    const s=SLOTS.find(x=>x.id===S.pick);if(!s)return;
    const cur=curId(s.id);delete DB.rotation[s.id];
    if(cur===s.id)delete DB.choice[s.id];else DB.choice[s.id]=cur;
    S.draft={};save();renderAll();toast("Wyłączono rotację");
  }
  else if(a==="step"){
    const dr=draftFor(S.open),p=EX[S.open],f=b.dataset.f,dir=+b.dataset.d;
    if(f==="r"){const st=timed(p)?5:1;dr.r=Math.max(0,Math.round(dr.r+dir*st));$("#in-r").value=dr.r}
    else{dr.k=Math.max(0,Math.round((dr.k+dir*2.5)*10)/10);$("#in-k").value=String(dr.k).replace(".",",")}
  }
  else if(a==="save"){
    const p=EX[S.open],dr=draftFor(p.id);
    if(!(dr.r>0)){toast("Podaj liczbę powtórzeń");return}
    const d=DB.days[S.date]||(DB.days[S.date]={date:S.date,ex:{}});
    (d.ex[p.id]=d.ex[p.id]||[]).push({r:dr.r,k:hasKg(p)?dr.k:0,t:Date.now()});
    if(save()){persistRequest();S.rest=p.rest>0?{t0:Date.now(),id:p.id}:null;S.confirm=null;renderAll();toast("Zapisano serię "+d.ex[p.id].length)}
  }
  else if(a==="delset"){
    const p=EX[S.open],i=+b.dataset.i,key="set:"+p.id+":"+i;
    if(S.confirm!==key){setConfirm(key);renderAll();return}
    const d=DB.days[S.date];
    if(d&&d.ex[p.id]){d.ex[p.id].splice(i,1);if(!d.ex[p.id].length)delete d.ex[p.id];if(!Object.keys(d.ex).length&&!(d.list&&d.list.length))delete DB.days[S.date];save()}
    setConfirm(null);delete S.draft[p.id];renderAll();
  }
  else if(a==="clrrest"){S.rest=null;renderAll()}
  else if(a==="summary"){S.summary=true;renderAll();$("#sum").scrollTop=0}
  else if(a==="closeSummary"){S.summary=false;renderAll()}
  else if(a==="delday"){
    const key="day:"+b.dataset.d;
    if(S.confirm!==key){setConfirm(key);renderAll();return}
    delete DB.days[b.dataset.d];save();setConfirm(null);renderAll();
  }
  else if(a==="demo"){demoDays().forEach(d=>{if(!DB.days[d.date])DB.days[d.date]=d});save();renderAll();toast("Wczytano dane przykładowe")}
  else if(a==="undemo"){Object.keys(DB.days).forEach(k=>{if(DB.days[k]&&DB.days[k].demo)delete DB.days[k]});save();renderAll();toast("Usunięto dane przykładowe")}
  else if(a==="exportjson")exportJSON();
  else if(a==="exportcsv")exportCSV();
  else if(a==="copyjson")copyJSON();
  else if(a==="importtext"){const t=$("#importText");if(t&&t.value.trim())importData(t.value);else toast("Wklej najpierw dane")}
  else if(a==="resetchoice"){
    if(S.confirm!=="resetchoice"){setConfirm("resetchoice");renderAll();return}
    DB.choice={};DB.rotation={};save();setConfirm(null);renderAll();toast("Przywrócono domyślne ćwiczenia");
  }
  else if(a==="wipe"){
    if(S.confirm!=="wipe"){setConfirm("wipe");renderAll();return}
    DB.days={};save();setConfirm(null);S.draft={};renderAll();toast("Usunięto wszystkie treningi");
  }
});
document.addEventListener("input",e=>{
  const el=e.target;
  if(el.id==="libQ"&&S.lib){S.lib.q=el.value;libRefresh();return}
  if(!S.open)return;const dr=draftFor(S.open);
  if(el.id==="in-r")dr.r=Math.round(num(el.value));
  else if(el.id==="in-k")dr.k=num(el.value);
});
document.addEventListener("change",e=>{
  const el=e.target;
  if(el.id==="dateIn"&&isDate(el.value)){S.date=el.value;S.draft={};renderAll()}
  else if(el.id==="chartEx"){S.chartEx=el.value;renderAll()}
  else if(el.id==="hintToggle"){DB.settings.hint=el.checked;save();toast(el.checked?"Podpowiedź włączona":"Podpowiedź wyłączona")}
  else if(el.id==="importFile"&&el.files&&el.files[0]){
    const r=new FileReader();r.onload=()=>importData(String(r.result));r.onerror=()=>toast("Nie udało się odczytać pliku");r.readAsText(el.files[0]);el.value="";
  }
});

/* ---------- start ---------- */
load();
renderAll();
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
  window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").catch(()=>{})});
}
