(function () {
  const names = {gdp:'Real GDP growth', unemployment:'Unemployment', inflation:'CPI inflation', rate:'Federal funds rate'};
  const colors = {gdp:'#61d5c4',unemployment:'#8eb6ff',inflation:'#ffbc85',rate:'#c1a5ef'};
  const config = {background:'transparent',view:{stroke:null},axis:{labelColor:'#aebed0',titleColor:'#c4d0dd',domainColor:'#516176',tickColor:'#516176',gridColor:'#283a50',labelFontSize:11,titleFontSize:12},title:{color:'#e2eaf2',anchor:'start',fontSize:14,offset:7}};
  const metric = key => ({field:key,type:'quantitative',title:names[key]+' (%)',format:'.2f'});
  let generation = 0, active = [];
  window.draw = async function draw(rows, s) {
    const version = ++generation;
    active.forEach(view => view.finalize());
    active = [];
    const ids = ['timeline','comparison','scatter'];
    const containers = ids.map(id => document.getElementById(id));
    containers.forEach(el => el.replaceChildren());
    if (!rows.length) {containers.forEach(el => el.textContent='No quarters in this selection.'); return;}
    const data = rows.map(r=>({...r,quarter:r.date.slice(0,4)+' Q'+(1+Math.floor((Number(r.date.slice(5,7))-1)/3))}));
    const first = data[0].date, last = new Date(data.at(-1).date);
    last.setUTCMonth(last.getUTCMonth()+3);
    const end = last.toISOString().slice(0,10);
    const width = el => Math.max(150,el.clientWidth-70);
    const date = field => ({field,type:'temporal',scale:{type:'utc',domain:[first,end]},axis:{title:null,format:'%Y',tickCount:6,grid:false}});
    const rect = (values,color) => ({data:{values:values.filter(d=>d.start<end && (!d.end || d.end>first)).map(d=>({...d,start:d.start<first?first:d.start,end:!d.end||d.end>end?end:d.end}))},mark:{type:'rect',color},encoding:{x:date('start'),x2:{field:'end'},tooltip:{field:'label'}}});
    const tooltip = [{field:'quarter',title:'Quarter'},{field:'admin',title:'Administration'}];
    const focus = 'datum.quarter === focusDate';
    const params = [{name:'focusDate',value:''},{name:'focusAdmin',value:''}];
    const timeline = {params,vconcat:Object.keys(names).map(k=>({title:names[k]+' · %',width:width(containers[0]),height:90,layer:[
      rect(s.bands.filter((_,i)=>i%2===0),'#20324a'),rect(s.recessions,'#4c5262'),
      {data:{values:data},mark:{type:'line',color:colors[k],strokeWidth:2,point:data.length<4},encoding:{x:date('date'),y:{...metric(k),title:null}}},
      {data:{values:data.filter(d=>d[k]!=null)},mark:{type:'circle',color:'#fff',size:48},encoding:{x:date('date'),y:metric(k),opacity:{condition:{test:focus,value:1},value:0.002},tooltip:[...tooltip,metric(k)]}}
    ]})),spacing:12};
    const k=s.indicator;
    const valid=data.filter(r=>Number.isFinite(r[k]));
    const admins=[...new Set(valid.map(r=>r.admin))];
    const summaries=admins.map(admin=>{
      const values=valid.filter(r=>r.admin===admin).map(r=>r[k]).sort((a,b)=>a-b);
      const q=p=>{const i=(values.length-1)*p;return values[Math.floor(i)]+(values[Math.ceil(i)]-values[Math.floor(i)])*(i%1)};
      return {admin,n:values.length,min:values[0],q1:q(.25),median:q(.5),q3:q(.75),max:values.at(-1)};
    });
    const x=field=>({field,type:'quantitative',title:names[k]+' (%)',scale:{zero:false}});
    const summary={params,data:{values:summaries},width:Math.max(100,containers[1].clientWidth-155),height:{step:24},encoding:{y:{field:'admin',type:'nominal',sort:admins,title:null,axis:{labelLimit:145}},tooltip:[{field:'admin'},{field:'n',title:'Observed quarters'},...['min','q1','median','q3','max'].map(field=>({field,type:'quantitative',format:'.2f'}))]},layer:[
      {mark:{type:'rule',color:'#7898ad'},encoding:{x:x('min'),x2:{field:'max'}}},
      {mark:{type:'bar',height:13},encoding:{x:x('q1'),x2:{field:'q3'},color:{condition:{test:'datum.admin === focusAdmin',value:'#fff'},value:colors[k]}}},
      {mark:{type:'tick',color:'#182333',height:16,thickness:2},encoding:{x:x('median')}}
    ]};
    const scatter={params:[...params,{name:'region',select:{type:'interval'}}],data:{values:data.filter(r=>Number.isFinite(r[s.x])&&Number.isFinite(r[s.y]))},width:width(containers[2]),height:270,mark:{type:'circle',size:62},encoding:{x:metric(s.x),y:metric(s.y),color:{condition:{test:focus,value:'#fff'},value:colors[s.y]},opacity:{condition:{param:'region',value:.78},value:.12},tooltip:[...tooltip,metric(s.x),...(s.x===s.y?[]:[metric(s.y)])]}};
    const views=await Promise.all([timeline,summary,scatter].map(async(spec,i)=>{
      if(i===1&&!valid.length){containers[i].textContent='No reported observations for this indicator.';return null;}
      const mount=document.createElement('div');containers[i].appendChild(mount);
      const {view}=await vegaEmbed(mount,{...spec,config},{actions:false,renderer:'svg'});return view;
    }));
    if(version!==generation){views.filter(Boolean).forEach(v=>v.finalize());return;}
    active=views.filter(Boolean);
    function highlight(d){for(const v of active)v.signal('focusDate',d?.quarter||'').signal('focusAdmin',d?.admin||'').runAsync();}
    for(const v of active){v.addEventListener('mouseover',(_,item)=>highlight(item?.datum));v.addEventListener('mouseout',()=>highlight(null));}
  };
})();

