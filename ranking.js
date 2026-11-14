(function(){
  const palette=['#67d3bd','#79aee9','#efa86e','#b7a2ed','#ed8279','#e7bf66','#c2dd88','#ed98c4','#58c9e5','#e49d56','#a8baff','#b2c8c9','#d6a7e0','#91ce9e','#f4b9a3'];
  function rankMetric(data,key,direction){
    const valid=data.filter(d=>Number.isFinite(d[key])).sort((a,b)=>direction==='desc'?b[key]-a[key]:a[key]-b[key]);
    let previous,rank;return valid.map((d,i)=>{if(i===0||d[key]!==previous)rank=i+1;previous=d[key];return {...d,rank}});
  }
  window.rankMetric=rankMetric;
  window.drawRankChanges=function(data,keys,meta){
    const host=document.getElementById('ranking');host.replaceChildren();
    if(!data.length||!keys.length){host.textContent='请选择总统和至少一个指标。';return}
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),width=Math.max(860,document.querySelector('main').clientWidth-20),top=85,bottom=top+Math.max(330,(data.length-1)*29),left=70,right=width-65;
    svg.setAttribute('viewBox',`0 0 ${width} ${bottom+55}`);svg.style.width=width+'px';svg.setAttribute('role','img');svg.setAttribute('aria-label','总统多指标排名变化图，第1名在最上方');
    const make=(tag,attrs,parent=svg)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e};
    const label=(text,x,y,attrs={})=>{const e=make('text',{x,y,fill:'#b8cbd5','font-size':12,'text-anchor':'middle',...attrs});e.textContent=text;return e};
    const x=i=>keys.length===1?(left+right)/2:left+i*(right-left)/(keys.length-1),y=rank=>data.length===1?top:top+(rank-1)*(bottom-top)/(data.length-1),ranks=keys.map(k=>new Map(rankMetric(data,k,meta[k].direction).map(d=>[d.admin,d.rank])));
    keys.forEach((k,i)=>{make('line',{x1:x(i),x2:x(i),y1:top,y2:bottom,stroke:'#496273'});label(meta[k].short,x(i),25,{'font-size':14,fill:'#edf3f5'});label(meta[k].direction==='desc'?'高值在前':'低值在前',x(i),46);for(let rank=1;rank<=data.length;rank++){make('line',{x1:x(i)-5,x2:x(i)+5,y1:y(rank),y2:y(rank),stroke:'#78909d'});label(rank,x(i)-12,y(rank)+4,{'text-anchor':'end','font-size':11})}});
    const groups=[];const highlight=name=>groups.forEach(g=>{g.style.opacity=!name||g.dataset.admin===name?'1':'.12'});
    const tooltip=document.createElement('div');tooltip.className='rank-tooltip';tooltip.hidden=true;
    for(const d of data){const color=palette[d.index%palette.length],g=make('g',{'data-admin':d.admin});groups.push(g);let path='';keys.forEach((k,i)=>{const rank=ranks[i].get(d.admin);if(rank===undefined){path='';return}if(i>0&&ranks[i-1].has(d.admin)){make('line',{x1:x(i-1),y1:y(ranks[i-1].get(d.admin)),x2:x(i),y2:y(rank),stroke:color,'stroke-width':2.5,opacity:.8},g)}});
      keys.forEach((k,i)=>{const rank=ranks[i].get(d.admin);if(rank===undefined)return;const partial=k==='approval'?d.approvalPartial:d.partial,c=make('circle',{cx:x(i),cy:y(rank),r:5,fill:partial?'#071622':color,stroke:color,'stroke-width':2,tabindex:0},g);const text=`${d.admin} · ${meta[k].short} · 第${rank}名 · ${meta[k].format(d[k])} · ${meta[k].coverage(d)}`;const title=make('title',{},c);title.textContent=text;c.addEventListener('pointerenter',()=>{highlight(d.admin);tooltip.textContent=text;tooltip.hidden=false});c.addEventListener('pointerleave',()=>{highlight(null);tooltip.hidden=true});c.addEventListener('focus',()=>{highlight(d.admin);tooltip.textContent=text;tooltip.hidden=false});c.addEventListener('blur',()=>{highlight(null);tooltip.hidden=true})});
      g.addEventListener('pointerenter',()=>highlight(d.admin));g.addEventListener('pointerleave',()=>highlight(null));
    }
    host.append(svg,tooltip);const legend=document.createElement('div');legend.className='rank-legend';for(const d of data){const b=document.createElement('button');b.type='button';b.textContent=d.admin;b.style.setProperty('--legend-color',palette[d.index%palette.length]);b.onpointerenter=b.onfocus=()=>highlight(d.admin);b.onpointerleave=b.onblur=()=>highlight(null);legend.append(b)}host.append(legend);
  };
})();
