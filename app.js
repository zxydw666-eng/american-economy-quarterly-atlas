const $=id=>document.getElementById(id);
const quarter=date=>date.slice(0,4)+' Q'+(Math.floor((Number(date.slice(5,7))-1)/3)+1);
const fmt=(value,digits=1)=>Number.isFinite(value)?value.toFixed(digits):'—';
const DEMOCRATS=new Set(['Harry S. Truman','John F. Kennedy','Lyndon B. Johnson','Jimmy Carter','Bill Clinton','Barack Obama','Joe Biden']);
const WIKI={'Harry S. Truman':'Harry_S._Truman','Dwight D. Eisenhower':'Dwight_D._Eisenhower','John F. Kennedy':'John_F._Kennedy','Lyndon B. Johnson':'Lyndon_B._Johnson','Richard Nixon':'Richard_Nixon','Gerald Ford':'Gerald_Ford','Jimmy Carter':'Jimmy_Carter','Ronald Reagan':'Ronald_Reagan','George H. W. Bush':'George_H._W._Bush','Bill Clinton':'Bill_Clinton','George W. Bush':'George_W._Bush','Barack Obama':'Barack_Obama','Donald Trump I':'Donald_Trump','Joe Biden':'Joe_Biden','Donald Trump II':'Donald_Trump'};
const METRICS={
  gdp:{label:'平均 GDP 同比增长',short:'GDP 增长',direction:'desc',format:v=>fmt(v,2)+'%',coverage:d=>d.quarters+' 个季度'},unemployment:{label:'平均失业率',short:'失业率',direction:'asc',format:v=>fmt(v,2)+'%',coverage:d=>d.quarters+' 个季度'},inflation:{label:'平均 CPI 同比通胀率',short:'通胀率',direction:'asc',format:v=>fmt(v,2)+'%',coverage:d=>d.quarters+' 个季度'},rate:{label:'平均联邦基金利率',short:'政策利率',direction:'asc',format:v=>fmt(v,2)+'%',coverage:d=>d.rateQuarters+' 个有效季度'},approval:{label:'平均公众支持率',short:'支持率',direction:'desc',format:v=>fmt(v,1)+'%',coverage:d=>d.approvalPartial?'截至 2025 年末':'Gallup 全任期平均'},recessionShare:{label:'任内衰退月份占比',short:'衰退月份',direction:'asc',format:v=>fmt(v,1)+'%',coverage:d=>d.months+' 个观察月'},recessionRate:{label:'每四年新发生衰退',short:'衰退频率',direction:'asc',format:v=>fmt(v,2)+' 次',coverage:d=>d.newRecessions+' 次 / '+d.months+' 月'}
};
const DISTRIBUTION_METRICS=['gdp','unemployment','inflation','rate'];
async function load(path){const response=await fetch(path);if(!response.ok)throw new Error(path+' 加载失败');return response.json()}
function party(admin){return DEMOCRATS.has(admin)?'民主党':'共和党'}
function initials(name){return name.replace(/\b(S\.|F\.|B\.|H\.|W\.|J\.|I{1,2})\b/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('')}
function monthStart(date){return date.slice(0,7)+'-01'}
function addMonth(date){const d=new Date(date+'T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);return d.toISOString().slice(0,10)}
function endOfQuarter(date){const d=new Date(date+'T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+3,0);return d.toISOString().slice(0,10)}
function buildAdminStats(rows,history,approvalData){
  const coverageStart=rows[0].date,coverageEnd=addMonth(addMonth(addMonth(rows.at(-1).date)));
  return history.bands.map((band,index)=>{
    const observedStart=band.start<coverageStart?coverageStart:monthStart(band.start),observedEnd=!band.end||band.end>coverageEnd?coverageEnd:monthStart(band.end),q=rows.filter(r=>r.admin===band.label);
    const average=key=>{const v=q.map(r=>r[key]).filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};let months=0,recessionMonths=0,newRecessions=0;
    for(let cursor=observedStart;cursor<observedEnd;cursor=addMonth(cursor)){months++;const recession=history.recessions.find(r=>r.start<=cursor&&cursor<r.end);if(recession)recessionMonths++;if(recession?.start===cursor)newRecessions++}
    const approval=approvalData.records.find(record=>record.label===band.label);
    return {admin:band.label,party:party(band.label),start:band.start,end:band.end,index,gdp:average('gdp'),unemployment:average('unemployment'),inflation:average('inflation'),rate:average('rate'),approval:approval?.average??null,approvalPartial:approval?.status==='partial',recessionShare:months?100*recessionMonths/months:null,recessionRate:months?48*newRecessions/months:null,newRecessions,recessionMonths,months,quarters:q.length,rateQuarters:q.filter(r=>Number.isFinite(r.rate)).length,partial:band.start<coverageStart||!band.end||band.end>coverageEnd};
  });
}
// Presidential Portraits, Library of Congress
const PORTRAITS = {
  "Harry S. Truman": "https://tile.loc.gov/storage-services/service/pnp/cph/3c10000/3c17000/3c17100/3c17122r.jpg",
  "Dwight D. Eisenhower": "https://tile.loc.gov/storage-services/service/pnp/cph/3c10000/3c17000/3c17100/3c17123r.jpg",
  "John F. Kennedy": "https://tile.loc.gov/storage-services/service/pnp/ppmsca/38600/38698r.jpg",
  "Lyndon B. Johnson": "https://tile.loc.gov/storage-services/service/pnp/cph/3a50000/3a53000/3a53300/3a53305r.jpg",
  "Richard Nixon": "https://tile.loc.gov/storage-services/service/pnp/cph/3a50000/3a53000/3a53300/3a53306r.jpg",
  "Gerald Ford": "https://tile.loc.gov/storage-services/service/pnp/ppmsc/02800/02800r.jpg",
  "Jimmy Carter": "https://tile.loc.gov/storage-services/service/pnp/cph/3b50000/3b52000/3b52000/3b52090r.jpg",
  "Ronald Reagan": "https://tile.loc.gov/storage-services/service/pnp/cph/3a50000/3a53000/3a53300/3a53308r.jpg",
  "George H. W. Bush": "https://tile.loc.gov/storage-services/service/pnp/cph/3b40000/3b46000/3b46100/3b46147r.jpg",
  "Bill Clinton": "https://tile.loc.gov/storage-services/service/pnp/cph/3c00000/3c07000/3c07700/3c07700r.jpg",
  "George W. Bush": "https://tile.loc.gov/storage-services/service/pnp/ppbd/00300/00371r.jpg",
  "Barack Obama": "https://tile.loc.gov/storage-services/service/pnp/ppbd/00300/00358r.jpg",
  "Donald Trump I": "https://tile.loc.gov/storage-services/service/pnp/ppbd/00600/00608r.jpg",
  "Joe Biden": "https://tile.loc.gov/storage-services/service/pnp/ppbd/01200/01261r.jpg",
  "Donald Trump II": "https://tile.loc.gov/storage-services/service/pnp/ppbd/11600/11614r.jpg"
};
function attachPortrait(container,admin,className=''){
  const fallback=document.createElement('span');fallback.className='portrait-fallback '+className;fallback.textContent=initials(admin);container.append(fallback);
  const img=document.createElement('img');img.alt=admin;img.className=className;img.onload=()=>fallback.replaceWith(img);img.onerror=()=>{img.onerror=null;fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+WIKI[admin]).then(r=>r.json()).then(data=>{if(data.thumbnail)img.src=data.thumbnail.source}).catch(()=>{})};
  img.src=PORTRAITS[admin];
}
function renderStrip(history,stats,rows){const host=$('president-strip');host.replaceChildren();const firstYear=Number(rows[0].date.slice(0,4));const position=date=>{const d=new Date(date+'T00:00:00Z'),m=d.getUTCMonth(),q=Math.floor(m/3),a=Date.UTC(d.getUTCFullYear(),q*3,1),b=Date.UTC(d.getUTCFullYear(),q*3+3,1);return Math.max(0,Math.min(rows.length,(d.getUTCFullYear()-firstYear)*4+q+(d-a)/(b-a)))};for(const band of history.bands){const stat=stats.find(s=>s.admin===band.label),tile=document.createElement('div'),left=position(band.start),right=band.end?position(band.end):rows.length;tile.className='president-tile';tile.dataset.left=left;tile.dataset.right=right;tile.style.left=100*left/rows.length+'%';tile.style.width=100*(right-left)/rows.length+'%';tile.style.setProperty('--party',stat.party==='民主党'?'var(--dem)':'var(--rep)');tile.title=band.label+' · '+stat.party+' · '+band.start+'—'+(band.end||'至今');attachPortrait(tile,band.label);const caption=document.createElement('small');caption.innerHTML='<b>'+band.label+'</b><br><span>'+stat.party+'</span>';tile.append(caption);host.append(tile)}}
async function init(){
  const [raw,history,approvalData]=await Promise.all([load('data/quarters.json'),load('data/history.json'),load('data/approval.json')]);history.bands=history.bands.map(b=>({...b,party:party(b.label)}));const rows=raw.map(row=>{const day=endOfQuarter(row.date),admin=history.bands.find(b=>b.start<=day&&(!b.end||day<b.end)).label;return{...row,admin,party:party(admin)}}),stats=buildAdminStats(rows,history,approvalData);
  renderStrip(history,stats,rows);
  const start=$('start-range'),end=$('end-range');start.min=end.min=0;start.max=end.max=rows.length;start.value=0;end.value=rows.length;
  async function updateTimeline(changed){if(Number(start.value)>=Number(end.value)){if(changed===start)start.value=Number(end.value)-1;else end.value=Number(start.value)+1}const lo=Number(start.value),hi=Number(end.value),visible=rows.slice(lo,hi);$('start-label').textContent=quarter(visible[0].date);$('end-label').textContent=quarter(visible.at(-1).date);start.setAttribute('aria-valuetext',quarter(visible[0].date));end.setAttribute('aria-valuetext',quarter(visible.at(-1).date));$('range-selected').style.left=100*lo/rows.length+'%';$('range-selected').style.width=100*(hi-lo)/rows.length+'%';for(const tile of $('president-strip').children){const left=Number(tile.dataset.left),right=Number(tile.dataset.right),a=Math.max(0,Math.min(100,100*(lo-left)/(right-left))),b=Math.max(0,Math.min(100,100*(hi-left)/(right-left)));tile.style.setProperty('--shade-start',a+'%');tile.style.setProperty('--shade-end',b+'%')} $('timeline-status').textContent=visible.length+' 个季度 · '+quarter(visible[0].date)+'—'+quarter(visible.at(-1).date);await drawTimeline(visible,history)}
  start.oninput=()=>updateTimeline(start);end.oninput=()=>updateTimeline(end);$('reset-time').onclick=()=>{start.value=0;end.value=rows.length;updateTimeline()};
  let partyFilter='全部';const selected=new Set(stats.map(s=>s.admin));for(const stat of stats){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=true;box.value=stat.admin;box.dataset.party=stat.party;box.onchange=()=>{box.checked?selected.add(box.value):selected.delete(box.value);updateComparison()};label.append(box,stat.admin);$('president-options').append(label)}
  const boxes=()=>[...$('president-options').querySelectorAll('input')],allowed=stat=>partyFilter==='全部'||stat.party===partyFilter,updatePickerVisibility=()=>{for(const box of boxes())box.parentElement.hidden=partyFilter!=='全部'&&box.dataset.party!==partyFilter},currentSelection=()=>new Set([...selected].filter(name=>allowed(stats.find(s=>s.admin===name))));
  async function updateComparison(){const current=currentSelection(),profileMetric=$('profile-metric').value,profileMeta=METRICS[profileMetric];$('president-picker-label').textContent='选择总统 · '+current.size+' 位';const keys=[...$('ranking-metrics').querySelectorAll('input:checked')].map(x=>x.value);$('ranking-note').textContent='各指标按全部有数据的任期排名，未选中的任期淡显。并列名次共享位置；缺失值断开。空心点表示覆盖不完整。';drawRankChanges(stats,keys,METRICS,current);await drawDistribution(rows.filter(r=>current.has(r.admin)),stats.filter(s=>current.has(s.admin)),profileMetric,{...profileMeta,axis:profileMeta.short+'（%）'})}
  for(const button of document.querySelectorAll('.party-button'))button.onclick=()=>{partyFilter=button.dataset.party;document.querySelectorAll('.party-button').forEach(b=>b.classList.toggle('active',b===button));updatePickerVisibility();updateComparison()};$('select-visible').onclick=()=>{for(const box of boxes())if(!box.parentElement.hidden){box.checked=true;selected.add(box.value)}updateComparison()};$('clear-presidents').onclick=()=>{for(const box of boxes())if(!box.parentElement.hidden){box.checked=false;selected.delete(box.value)}updateComparison()};
  for(const key of DISTRIBUTION_METRICS)$('profile-metric').add(new Option(METRICS[key].short,key));$('profile-metric').value='gdp';$('profile-metric').onchange=updateComparison;
  for(const [key,meta] of Object.entries(METRICS)){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.value=key;box.checked=['gdp','unemployment','approval','recessionShare'].includes(key);box.onchange=updateComparison;label.append(box,meta.short);if(key==='inflation'||key==='rate'){const direction=document.createElement('select');direction.setAttribute('aria-label',meta.short+'排序方向');direction.add(new Option('低值在前','asc'));direction.add(new Option('高值在前','desc'));direction.value=meta.direction;direction.onchange=()=>{meta.direction=direction.value;updateComparison()};label.append(direction)}$('ranking-metrics').append(label)}await Promise.all([updateTimeline(),updateComparison()]);
}
init().catch(error=>{console.error(error);$('timeline-status').textContent='页面加载失败：'+error.message});
