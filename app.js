const names={gdp:"Real GDP growth",unemployment:"Unemployment rate",inflation:"CPI inflation",rate:"Federal funds rate"};
const el=id=>document.getElementById(id);
const quarter=date=>date.slice(0,4)+" Q"+(1+Math.floor((Number(date.slice(5,7))-1)/3));
async function load(path){const response=await fetch(path);if(!response.ok)throw Error(path+" unavailable");return response.json()}
async function init(){
 const [records,history]=await Promise.all([load("data/quarters.json"),load("data/history.json")]);
 const rows=records.map(row=>{const last=new Date(row.date+"T00:00:00Z");last.setUTCMonth(last.getUTCMonth()+3,0);const day=last.toISOString().slice(0,10);return {...row,admin:history.bands.find(b=>b.start<=day&&(!b.end||b.end>day)).label}});
 for(const id of ["start","end"])for(const row of rows)el(id).add(new Option(quarter(row.date),row.date));
 for(const band of history.bands)el("president").add(new Option(band.label,band.label));
 for(const id of ["indicator","x","y"])for(const [key,title] of Object.entries(names))el(id).add(new Option(title,key));
 function defaults(){el("president").value="";el("start").selectedIndex=0;el("end").selectedIndex=rows.length-1;el("indicator").value="gdp";el("x").value="unemployment";el("y").value="inflation"}
 async function update(event){if(el("start").value>el("end").value){const other=event?.target.id==="end"?"start":"end";el(other).value=event.target.value}
 const visible=rows.filter(r=>r.date>=el("start").value&&r.date<=el("end").value&&(!el("president").value||r.admin===el("president").value));
 el("status").textContent=visible.length?visible.length+" quarters · "+quarter(visible[0].date)+" – "+quarter(visible.at(-1).date):"No quarters match these filters.";
 if(!visible.length){for(const id of ["timeline","comparison","scatter"])el(id).replaceChildren();return}
 try{await draw(visible,{...history,indicator:el("indicator").value,x:el("x").value,y:el("y").value})}catch(e){el("status").textContent="Chart unavailable: "+e.message}}
 defaults();document.querySelectorAll("select").forEach(s=>s.onchange=update);el("reset").onclick=()=>{defaults();update()};await update()
}
init().catch(e=>el("status").textContent="Unable to load local observations. Serve this directory over HTTP. "+e.message);
