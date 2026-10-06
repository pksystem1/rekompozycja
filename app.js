"use strict";
/* ============================================================
   Dziennik treningowy: samodzielna aplikacja (bez serwera, bez konta)
   Dane trzymane lokalnie w przeglądarce (localStorage).
   ============================================================ */
const APP_VERSION="1.0.0";
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
const S={tab:"train",filter:"all",date:todayStr(),open:null,pick:null,summary:false,draft:{},chartEx:null,rest:null,confirm:null};
let DB={days:{},choice:{},settings:{hint:true},meta:{}};

function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const o=JSON.parse(raw);
      DB.days=o.days||{};DB.choice=o.choice||{};DB.settings=Object.assign({hint:true},o.settings||{});DB.meta=o.meta||{};}
  }catch(e){}
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(DB));renderStatus();return true}
  catch(e){toast("Nie udało się zapisać danych. Sprawdź miejsce w przeglądarce.");return false}
}
function persistRequest(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}}

/* ---------- plan: wybór ćwiczenia w miejscu planu ---------- */
function curId(slot){const c=DB.choice[slot];return c&&EX[c]&&EX[c].slot===slot?c:slot}
const slotOf=id=>SLOTS.find(s=>s.id===EX[id].slot);

/* ---------- dane treningowe ---------- */
const dayHas=d=>d&&d.ex&&Object.keys(d.ex).length>0;
const daysAsc=()=>Object.values(DB.days).filter(dayHas).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
const sessionsFor=id=>daysAsc().filter(d=>d.ex[id]&&d.ex[id].length).map(d=>({date:d.date,sets:d.ex[id]}));
const sumR=s=>s.reduce((a,x)=>a+x.r,0), maxK=s=>s.reduce((a,x)=>Math.max(a,x.k),0), vol=s=>s.reduce((a,x)=>a+x.r*x.k,0);
function prevSession(id,date){const l=sessionsFor(id).filter(x=>x.date<date);return l[l.length-1]||null}
const dayOf=()=>DB.days[S.date];
const setsToday=id=>{const d=dayOf();return (d&&d.ex&&d.ex[id])||[]};
const unitTxt=p=>p.unit==="sec"?" s":"";
function setStr(sets,p){return sets.map(x=>x.r+unitTxt(p)+(x.k?" × "+nf(x.k)+" kg":"")).join(", ")}
function dayTag(d){const ws=new Set(Object.keys(d.ex).map(id=>EX[id]&&EX[id].w).filter(Boolean));return ws.size===1?[...ws][0]:"Mix"}
const idsInOrder=d=>Object.keys(d.ex).filter(i=>EX[i]).sort((a,b)=>ORDER[a]-ORDER[b]);
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
    return p.unit==="sec"?"Ostatnio górny zakres we wszystkich seriach: wydłuż czas lub utrudnij wariant.":p.bw?"Ostatnio górny zakres we wszystkich seriach: czas dodać obciążenie.":"Ostatnio górny zakres we wszystkich seriach: dodaj ok. 2,5–5% ciężaru.";
  return "";
}
function otherHistory(p){
  if(prevSession(p.id,S.date))return null;
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
  const have=new Set();daysAsc().forEach(d=>Object.keys(d.ex).forEach(i=>have.add(i)));
  const out={A:[],B:[]};
  SLOTS.forEach(s=>{const c=curId(s.id);s.variants.forEach(v=>{if(v.id===c||have.has(v.id))out[s.w].push(EX[v.id])})});
  return out;
}

/* ---------- widoki ---------- */
function viewTrain(){
  const d=dayOf(),ds=dayHas(d);
  let h=`<h1>Trening</h1><div class="row between"><div class="datebox"><label class="small muted" for="dateIn">Data</label><input id="dateIn" type="date" value="${esc(S.date)}"></div>${S.date!==todayStr()?`<button class="btn ghost sm" data-act="today">Dziś</button>`:""}</div>`;
  h+=`<div class="seg" role="group" aria-label="Filtr ćwiczeń">${[["all","Wszystkie"],["A","Trening A"],["B","Trening B"]].map(x=>`<button data-act="filter" data-v="${x[0]}" aria-pressed="${S.filter===x[0]}">${x[1]}</button>`).join("")}</div>`;
  const ph=phaseHint();if(ph)h+=`<div class="hint">${esc(ph)}</div>`;
  if(ds){
    let sets=0,volume=0,t0=1e15,t1=0,n=0;
    Object.keys(d.ex).forEach(id=>{const ss=d.ex[id];n++;sets+=ss.length;volume+=vol(ss);ss.forEach(x=>{if(x.t){t0=Math.min(t0,x.t);t1=Math.max(t1,x.t)}})});
    const mins=t1>t0?Math.round((t1-t0)/60000):0;
    h+=`<div class="card"><div class="row between"><div><h3>Zrobione tego dnia</h3><p class="muted small">${n} ćwicz. · ${sets} serii · objętość ${Math.round(volume).toLocaleString("pl-PL")} kg${mins?` · ok. ${mins} min`:""}</p></div><button class="btn sm" data-act="summary">Zakończ</button></div></div>`;
  }
  if(S.rest)h+=`<button class="pill rest-pill" data-act="clrrest" aria-label="Zatrzymaj stoper przerwy">Przerwa <span class="rest-t"></span></button>`;
  (S.filter==="all"?["A","B"]:[S.filter]).forEach(w=>{
    h+=`<div class="grp">Trening ${w} · ${FOCUS[w]}</div>`;
    SLOTS.filter(s=>s.w===w).forEach(s=>{
      const p=EX[curId(s.id)],ss=setsToday(p.id),prev=prevSession(p.id,S.date),n=Math.max(p.sets,ss.length);
      let dots="";for(let i=0;i<n;i++)dots+=`<span class="dot${i<ss.length?" on":""}"></span>`;
      const tgt=`${p.sets} × ${p.lo}–${p.hi}${p.unit==="sec"?" s":""}${p.side?"/str.":""}`;
      const last=ss.length?setStr(ss,p):prev?"ostatnio "+setStr(prev.sets.slice(0,1),p):"";
      const others=s.variants.filter(v=>v.id!==p.id&&setsToday(v.id).length).map(v=>EX[v.id].name+" ×"+setsToday(v.id).length);
      h+=`<button class="ex${ss.length>=p.sets?" done":""}" data-act="open" data-id="${p.id}"><span><b>${esc(p.name)}</b><small>${tgt}${last?" · "+esc(last):""}</small>${others.length?`<small>Też dziś: ${esc(others.join(", "))}</small>`:""}</span><span class="dots" aria-label="Wykonane serie: ${ss.length} z ${p.sets}">${dots}<span class="chev" aria-hidden="true">›</span></span></button>`;
    });
  });
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
  const opts=chartOptions(),all=opts.A.concat(opts.B);
  if(!S.chartEx||!all.some(x=>x.id===S.chartEx))S.chartEx=all[0].id;
  const p=EX[S.chartEx],ss=sessionsFor(p.id);
  let h=`<h1>Wykresy</h1><label class="lbl" for="chartEx">Ćwiczenie</label><select id="chartEx" class="pick">${["A","B"].map(w=>`<optgroup label="Trening ${w}">${opts[w].map(x=>`<option value="${x.id}"${x.id===p.id?" selected":""}>${esc(x.name)}</option>`).join("")}</optgroup>`).join("")}</select>`;
  if(!daysAsc().length)h+=`<div class="empty"><p>Wykresy pojawią się po pierwszym zapisanym treningu.</p></div>`;
  const rp=ss.map(s=>({date:s.date,y:sumR(s.sets)})),kp=ss.map(s=>({date:s.date,y:maxK(s.sets)}));
  const unit=p.unit==="sec"?"s":"powt.";
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
    if(p.unit==="sec")h+=`<p class="muted small">Ćwiczenie na czas: ciężar nie dotyczy.</p>`;
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
   <p class="small muted">Import dopisuje treningi z kopii. Jeśli dzień o tej samej dacie już istnieje, zostanie zastąpiony.</p></div>
  <div class="card"><h3>Ustawienia</h3>
   <label class="sw"><input type="checkbox" id="hintToggle"${DB.settings.hint?" checked":""}> <span>Podpowiedź „powrót po przerwie” w pierwszych 4 tygodniach</span></label>
   <button class="btn ghost" data-act="resetchoice" style="margin-top:12px">${S.confirm==="resetchoice"?"Na pewno przywrócić?":"Przywróć domyślne ćwiczenia w planie"}</button></div>
  <div class="card"><h3>Dane przykładowe</h3>
   <p class="small muted">Pięć tygodni przykładowych treningów, żeby zobaczyć, jak wyglądają wykresy. Możesz je w każdej chwili usunąć.</p>
   <div class="stack"><button class="btn ghost" data-act="demo">Wczytaj dane przykładowe</button>${hasDemo?`<button class="btn ghost" data-act="undemo">Usuń dane przykładowe</button>`:""}</div></div>
  <div class="card"><h3>Usuń dane</h3>
   <button class="btn danger" data-act="wipe">${S.confirm==="wipe"?"Na pewno usunąć wszystkie treningi?":"Usuń wszystkie treningi"}</button></div>
  <div class="card"><h3>O aplikacji</h3>
   <p class="small muted">Dziennik treningowy ${APP_VERSION}. Plan 2 × w tygodniu (A i B), wszystkie dane zostają na Twoim urządzeniu. To narzędzie do zapisywania treningów, a nie porada medyczna. Przy bólu promieniującym, drętwieniu lub narastających dolegliwościach skonsultuj się z lekarzem lub fizjoterapeutą.</p></div>`;
}
function renderTabs(){document.querySelectorAll(".tabbar [role=tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.v===S.tab)))}
function renderAll(){
  renderTabs();
  $("#view").innerHTML=S.tab==="train"?viewTrain():S.tab==="hist"?viewHist():S.tab==="charts"?viewCharts():viewMore();
  renderSheet();renderPick();renderSummary();tickRest();renderStatus();
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
function lockScroll(){document.documentElement.style.overflow=(S.open||S.pick||S.summary)?"hidden":""}
function renderSheet(){
  const el=$("#sheet");
  if(!S.open){el.hidden=true;el.innerHTML="";lockScroll();return}
  const p=EX[S.open],ss=setsToday(p.id),dr=draftFor(p.id),prev=prevSession(p.id,S.date),hint=hintFor(p),oh=otherHistory(p),sec=p.unit==="sec";
  const s=slotOf(p.id);
  let h=`<div class="topbar"><button class="back" data-act="close">‹ Lista</button><h3 style="flex:1;text-align:center;padding-right:60px">${esc(p.name)}</h3></div><div class="wrap" style="padding-top:12px">`;
  h+=`<p class="muted">${p.sets} × ${p.lo}–${p.hi}${sec?" s":""}${p.side?" na stronę":""} · przerwa ${mmss(p.rest)}</p>`;
  h+=`<button class="swap" data-act="swap">⇄ Zamień na inne ćwiczenie<span class="muted small">${s.variants.length-1} zamienników</span></button>`;
  if(p.note)h+=`<div class="hint">Zamiennik: ${esc(p.note)}</div>`;
  if(prev)h+=`<div class="hint">Ostatnio (${fmtS(prev.date)}): <b>${esc(setStr(prev.sets,p))}</b></div>`;
  else if(oh)h+=`<div class="hint">To ćwiczenie nie ma jeszcze historii. Ostatnio na tym miejscu w planie: ${esc(oh.name)} (${fmtS(oh.date)}). Ciężar może być inny, zacznij lżej.</div>`;
  if(hint)h+=`<div class="hint good">${esc(hint)}</div>`;
  if(S.rest)h+=`<button class="pill rest-pill" data-act="clrrest" aria-label="Zatrzymaj stoper przerwy">Przerwa <span class="rest-t"></span></button>`;
  h+=`<div class="card"><h3>Seria ${ss.length+1}</h3>
  <div class="lbl" style="margin-top:10px">${sec?"Sekundy":"Powtórzenia"}${p.side&&!sec?" (na stronę)":""}</div>
  <div class="stepper"><button data-act="step" data-f="r" data-d="-1" aria-label="Mniej">−</button><input id="in-r" type="text" inputmode="numeric" pattern="[0-9]*" value="${dr.r}" aria-label="${sec?"Sekundy":"Powtórzenia"}"><button data-act="step" data-f="r" data-d="1" aria-label="Więcej">+</button></div>`;
  if(!sec)h+=`<div class="lbl">${p.bw?"Dodatkowy ciężar (kg), 0 = masa ciała":"Ciężar (kg)"}</div>
  <div class="stepper"><button data-act="step" data-f="k" data-d="-1" aria-label="Mniej">−</button><input id="in-k" type="text" inputmode="decimal" value="${String(dr.k).replace(".",",")}" aria-label="Ciężar w kilogramach"><button data-act="step" data-f="k" data-d="1" aria-label="Więcej">+</button></div>`;
  h+=`<button class="btn green" data-act="save">Zapisz serię ${ss.length+1}</button></div>`;
  if(ss.length)h+=`<div class="card"><h3>Zapisane tego dnia</h3>`+ss.map((x,i)=>`<div class="setrow"><span class="setno">${i+1}</span><span class="v">${x.r}${sec?" s":""}${x.k?" × "+nf(x.k)+" kg":""}</span><button class="xbtn" data-act="delset" data-i="${i}" aria-label="Usuń serię ${i+1}">${S.confirm==="set:"+p.id+":"+i?"Usunąć?":"✕"}</button></div>`).join("")+`</div>`;
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
  <p class="muted">Miejsce w planie: <b>${esc(s.name)}</b> (trening ${s.w}). Wybrany zamiennik zastępuje je na liście treningowej. Serie i przerwa zostają z planu, a zakres powtórzeń może się zmienić, jeśli ćwiczenie tego wymaga.</p>`;
  s.variants.forEach(v=>{
    const e=EX[v.id];
    h+=`<button class="opt${v.id===cur?" on":""}" data-act="choose" data-id="${v.id}"><span class="optmain"><b>${esc(e.name)}</b>${v.id===s.id?'<span class="tag">domyślne</span>':""}${v.id===cur?'<span class="tag cur">wybrane</span>':""}</span><span class="small muted">${e.sets} × ${e.lo}–${e.hi}${e.unit==="sec"?" s":""}${e.side?"/str.":""}${e.bw?" · masa ciała":""}</span>${e.note?`<span class="small">${esc(e.note)}</span>`:`<span class="small">Ćwiczenie z domyślnego planu.</span>`}</button>`;
  });
  h+=`<p class="small muted" style="margin-top:14px">Zamienniki dobrano według wzorca ruchu i pracujących mięśni. Badania porównujące maszyny z wolnymi ciężarami wskazują na podobny przyrost mięśni przy równej objętości treningu, ale część zamienników nie ma bezpośrednich badań. Historia każdego ćwiczenia jest liczona osobno.</p>`;
  h+=`<button class="btn ghost" data-act="pickclose">Zamknij</button></div>`;
  el.innerHTML=h;el.hidden=false;lockScroll();
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
    if(prev){const dr=sumR(ss)-sumR(prev.sets),dk=maxK(ss)-maxK(prev.sets);h+=`<p class="small muted">Powtórzenia łącznie: ${arrow(dr)} ${p.unit==="sec"?"":`· Maks. ciężar: ${arrow(dk,x=>nf(x)+" kg")}`}</p>`}
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
function exportObj(){return {app:"dziennik-treningowy",version:1,exportedAt:new Date().toISOString(),choice:DB.choice,days:DB.days}}
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
  const rows=[["data","trening","cwiczenie","seria","powtorzenia_lub_sekundy","kg"]];
  Object.values(DB.days).filter(dayHas).sort((a,b)=>a.date<b.date?-1:1).forEach(d=>idsInOrder(d).forEach(id=>d.ex[id].forEach((x,i)=>rows.push([d.date,EX[id].w,EX[id].name,i+1,x.r,String(x.k).replace(".",",")]))));
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
  const src=o&&o.days&&typeof o.days==="object"?o.days:null;
  if(!src){toast("Brak danych treningowych w pliku");return}
  let n=0,skipped=0;
  Object.keys(src).forEach(k=>{
    const d=src[k]||{};const data=d.data&&d.data.ex?d.data:d;
    const date=isDate(data.date||"")?data.date:(isDate(k)?k:(isDate(k.replace(/^d-/,""))?k.replace(/^d-/,""):""));
    if(!date||!data.ex||typeof data.ex!=="object"){skipped++;return}
    const ex={};
    Object.keys(data.ex).forEach(id=>{
      if(!EX[id]||!Array.isArray(data.ex[id]))return;
      const sets=data.ex[id].map(x=>({r:Math.min(999,Math.round(num(x&&x.r))),k:Math.min(1000,num(x&&x.k)),t:Number(x&&x.t)||0})).filter(x=>x.r>0);
      if(sets.length)ex[id]=sets;
    });
    if(!Object.keys(ex).length){skipped++;return}
    const day={date:date,ex:ex};if(data.demo)day.demo=true;
    DB.days[date]=day;n++;
  });
  if(o.choice&&typeof o.choice==="object")Object.keys(o.choice).forEach(s=>{const c=o.choice[s];if(EX[c]&&EX[c].slot===s){if(c===s)delete DB.choice[s];else DB.choice[s]=c}});
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
  else if(a==="swap"){S.pick=EX[S.open].slot;renderAll();$("#pick").scrollTop=0}
  else if(a==="pickclose"){S.pick=null;renderAll()}
  else if(a==="choose"){
    const id=b.dataset.id,s=slotOf(id);
    if(id===s.id)delete DB.choice[s.id];else DB.choice[s.id]=id;
    delete S.draft[id];S.open=id;S.pick=null;save();renderAll();toast("Zmieniono ćwiczenie");
  }
  else if(a==="step"){
    const dr=draftFor(S.open),p=EX[S.open],f=b.dataset.f,dir=+b.dataset.d;
    if(f==="r"){const st=p.unit==="sec"?5:1;dr.r=Math.max(0,Math.round(dr.r+dir*st));$("#in-r").value=dr.r}
    else{dr.k=Math.max(0,Math.round((dr.k+dir*2.5)*10)/10);$("#in-k").value=String(dr.k).replace(".",",")}
  }
  else if(a==="save"){
    const p=EX[S.open],dr=draftFor(p.id);
    if(!(dr.r>0)){toast("Podaj liczbę powtórzeń");return}
    const d=DB.days[S.date]||(DB.days[S.date]={date:S.date,ex:{}});
    (d.ex[p.id]=d.ex[p.id]||[]).push({r:dr.r,k:p.unit==="sec"?0:dr.k,t:Date.now()});
    if(save()){persistRequest();S.rest={t0:Date.now(),id:p.id};S.confirm=null;renderAll();toast("Zapisano serię "+d.ex[p.id].length)}
  }
  else if(a==="delset"){
    const p=EX[S.open],i=+b.dataset.i,key="set:"+p.id+":"+i;
    if(S.confirm!==key){setConfirm(key);renderAll();return}
    const d=DB.days[S.date];
    if(d&&d.ex[p.id]){d.ex[p.id].splice(i,1);if(!d.ex[p.id].length)delete d.ex[p.id];if(!Object.keys(d.ex).length)delete DB.days[S.date];save()}
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
    DB.choice={};save();setConfirm(null);renderAll();toast("Przywrócono domyślne ćwiczenia");
  }
  else if(a==="wipe"){
    if(S.confirm!=="wipe"){setConfirm("wipe");renderAll();return}
    DB.days={};save();setConfirm(null);S.draft={};renderAll();toast("Usunięto wszystkie treningi");
  }
});
document.addEventListener("input",e=>{
  const el=e.target;if(!S.open)return;const dr=draftFor(S.open);
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
