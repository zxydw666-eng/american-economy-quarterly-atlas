(function(){
  const config={background:'transparent',view:{stroke:null},axis:{labelColor:'#9fb2bd',titleColor:'#c6d4db',domainColor:'#3b5363',tickColor:'#3b5363',gridColor:'#203747',labelFont:'DM Sans',titleFont:'DM Sans'},title:{color:'#eaf1f4',font:'Noto Serif SC',anchor:'start',fontSize:14}};
  const timelineMeta={gdp:{label:'实际 GDP 同比增长率',color:'#67d3bd'},unemployment:{label:'失业率',color:'#79aee9'},inflation:{label:'CPI 同比通胀率',color:'#efa86e'},rate:{label:'有效联邦基金利率',color:'#b7a2ed'}};
  let timelineView=null,distributionView=null,rankingView=null;
  const chartPlotWidth=host=>Math.max(660,host.clientWidth-24);
  const quantile=(sorted,p)=>{const position=(sorted.length-1)*p,base=Math.floor(position),rest=position-base;return sorted[base+1]===undefined?sorted[base]:sorted[base]+rest*(sorted[base+1]-sorted[base])};
  window.drawTimeline=async function(rows,history){
    timelineView?.finalize();timelineView=null;const host=document.getElementById('timeline');host.replaceChildren();if(!rows.length){host.textContent='所选时期没有数据。';return}
    const start=rows[0].date,last=new Date(rows.at(-1).date+'T00:00:00Z');last.setUTCMonth(last.getUTCMonth()+3);const end=last.toISOString().slice(0,10),width=chartPlotWidth(host);
    const x=field=>({field,type:'temporal',scale:{type:'utc'},axis:{title:null,format:'%Y',tickCount:8,grid:false}});
    const bands=history.bands.filter(b=>b.start<end&&(!b.end||b.end>start)).map(b=>({start:b.start<start?start:b.start,end:!b.end||b.end>end?end:b.end,party:b.party}));
    const recessions=history.recessions.filter(r=>r.start<end&&r.end>start).map(r=>({start:r.start<start?start:r.start,end:r.end>end?end:r.end}));
    const values=rows.map(r=>({...r,quarter:r.date.slice(0,4)+' Q'+(Math.floor((Number(r.date.slice(5,7))-1)/3)+1)}));
    const spec={vconcat:Object.entries(timelineMeta).map(([key,meta])=>({title:meta.label+' · %',width,height:100,layer:[
      {data:{values:bands},mark:{type:'rect',opacity:.13},encoding:{x:x('start'),x2:{field:'end'},color:{field:'party',scale:{domain:['民主党','共和党'],range:['#63a8ec','#ed8279']},legend:null}}},
      {data:{values:recessions},mark:{type:'rect',color:'#89939b',opacity:.23},encoding:{x:x('start'),x2:{field:'end'}}},
      {data:{values},mark:{type:'line',strokeWidth:2,color:meta.color,point:{filled:true,size:18,opacity:.001}},encoding:{x:x('date'),y:{field:key,type:'quantitative',title:null,scale:{zero:false}},tooltip:[{field:'quarter',title:'季度'},{field:'admin',title:'总统'},{field:key,title:meta.label,format:'.2f'}]}}
    ]})),spacing:14,resolve:{scale:{x:'shared'}}};
    timelineView=(await vegaEmbed(host,{...spec,config},{actions:false,renderer:'svg'})).view;
  };
  window.drawDistribution=async function(rows,stats,metric,meta){
    distributionView?.finalize();distributionView=null;const host=document.getElementById('profile-chart');host.replaceChildren();
    const summaries=[],outliers=[];
    for(const stat of stats.sort((a,b)=>a.index-b.index)){
      const values=rows.filter(r=>r.admin===stat.admin&&Number.isFinite(r[metric])).map(r=>r[metric]).sort((a,b)=>a-b);if(!values.length)continue;
      const q1=quantile(values,.25),median=quantile(values,.5),q3=quantile(values,.75),iqr=q3-q1,lower=q1-1.5*iqr,upper=q3+1.5*iqr,inside=values.filter(v=>v>=lower&&v<=upper),mean=values.reduce((a,b)=>a+b,0)/values.length;
      summaries.push({admin:stat.admin,party:stat.party,partial:stat.partial,n:values.length,min:values[0],q1,median,mean,q3,max:values.at(-1),whiskerLow:inside[0],whiskerHigh:inside.at(-1)});
      for(const value of values.filter(v=>v<lower||v>upper))outliers.push({admin:stat.admin,party:stat.party,value});
    }
    if(!summaries.length){host.innerHTML='<div class="empty-state">当前选择没有该指标的有效季度数据。</div>';return}
    const order=summaries.map(d=>d.admin),width=chartPlotWidth(host),color={field:'party',type:'nominal',scale:{domain:['民主党','共和党'],range:['#63a8ec','#ed8279']},legend:null},y={field:'admin',type:'nominal',sort:order,title:null,axis:{labelLimit:175,labelPadding:10}},tooltip=[{field:'admin',title:'总统'},{field:'n',title:'有效季度数'},{field:'min',title:'最小值',format:'.2f'},{field:'q1',title:'第25百分位',format:'.2f'},{field:'median',title:'中位数',format:'.2f'},{field:'mean',title:'平均值',format:'.2f'},{field:'q3',title:'第75百分位',format:'.2f'},{field:'max',title:'最大值',format:'.2f'}];
    const spec={width,height:{step:43},layer:[
      {data:{values:summaries},mark:{type:'rule',strokeWidth:2},encoding:{y,x:{field:'whiskerLow',type:'quantitative',title:meta.axis},x2:{field:'whiskerHigh'},color,opacity:{condition:{test:'datum.partial',value:.48},value:.9},tooltip}},
      {data:{values:summaries},mark:{type:'bar',height:20,cornerRadius:2},encoding:{y,x:{field:'q1',type:'quantitative',title:meta.axis},x2:{field:'q3'},color,opacity:{condition:{test:'datum.partial',value:.48},value:.78},tooltip}},
      {data:{values:summaries},mark:{type:'tick',thickness:3,size:25,color:'#f4f8fa'},encoding:{y,x:{field:'median',type:'quantitative',title:meta.axis},tooltip}},
      {data:{values:summaries},mark:{type:'point',shape:'diamond',filled:true,size:100,color:'#e7bf66',stroke:'#071622',strokeWidth:1},encoding:{y,x:{field:'mean',type:'quantitative',title:meta.axis},tooltip}},
      {data:{values:outliers},mark:{type:'point',filled:false,size:45,strokeWidth:1.5},encoding:{y,x:{field:'value',type:'quantitative',title:meta.axis},color,tooltip:[{field:'admin',title:'总统'},{field:'value',title:'离群季度值',format:'.2f'}]}}
    ]};
    distributionView=(await vegaEmbed(host,{...spec,config},{actions:false,renderer:'svg'})).view;
  };
  window.drawRanking=async function(data,metric,direction,meta){
    rankingView?.finalize();rankingView=null;const host=document.getElementById('ranking');host.replaceChildren();const valid=data.filter(d=>Number.isFinite(d[metric]));if(!valid.length){host.textContent='当前筛选没有该指标的数据。';return}
    const sorted=[...valid].sort((a,b)=>direction==='desc'?b[metric]-a[metric]:a[metric]-b[metric]);const values=sorted.map((d,i)=>({...d,rank:i+1,value:d[metric],display:meta.format(d[metric]),coverage:meta.coverage?meta.coverage(d):'',metricPartial:metric==='approval'?d.approvalPartial:d.partial}));const width=chartPlotWidth(host);
    const spec={data:{values},width,height:{step:35},encoding:{y:{field:'admin',type:'nominal',sort:sorted.map(d=>d.admin),title:null,axis:{labelLimit:170}},tooltip:[{field:'rank',title:'名次'},{field:'admin',title:'总统'},{field:'display',title:meta.label},{field:'coverage',title:'覆盖'}]},layer:[
      {mark:{type:'bar',height:17,cornerRadiusEnd:2},encoding:{x:{field:'value',type:'quantitative',title:meta.axis,scale:{zero:meta.zero??false}},color:{field:'party',scale:{domain:['民主党','共和党'],range:['#63a8ec','#ed8279']},legend:null},opacity:{condition:{test:'datum.metricPartial',value:.55},value:.9}}},
      {mark:{type:'text',align:'left',dx:6,color:'#edf3f5',fontWeight:600},encoding:{x:{field:'value',type:'quantitative'},text:{field:'display'}}}
    ]};
    rankingView=(await vegaEmbed(host,{...spec,config},{actions:false,renderer:'svg'})).view;
  };
})();
