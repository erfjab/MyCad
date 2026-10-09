// ---------- DWG / DXF import ----------
// DWG/DXF database (from libredwg) -> MyCad entities. Blocks and dimensions are exploded; units are guessed and converted to mm.
function dwgImport(db){const BR={};((db.tables&&db.tables.BLOCK_RECORD&&db.tables.BLOCK_RECORD.entries)||[]).forEach(b=>BR[b.name]=b);
  const LAY={};((db.tables&&db.tables.LAYER&&db.tables.LAYER.entries)||[]).forEach(l=>LAY[l.name]=l);
  const ST={};((db.tables&&db.tables.STYLE&&db.tables.STYLE.entries)||[]).forEach(t=>ST[(t.name||'').toUpperCase()]=t.font||t.fontFile||t.primaryFontFile||'');
  const legacy=e=>/naskh|nasim|sadeh|tahrir|farsi|puya|zar|titr|yekan|nazanin|lotus|traffic|homa|koodak/i.test(ST[(e.styleName||'').toUpperCase()]||'')&&!/[\u0600-\u06FF]/.test(e.text||'');
  const raw=[],MAXN=150000;let n=0;
  const mul=(A,B)=>[A[0]*B[0]+A[2]*B[1],A[1]*B[0]+A[3]*B[1],A[0]*B[2]+A[2]*B[3],A[1]*B[2]+A[3]*B[3],A[0]*B[4]+A[2]*B[5]+A[4],A[1]*B[4]+A[3]*B[5]+A[5]];
  const ap=(M,p)=>[M[0]*p.x+M[2]*p.y+M[4],M[1]*p.x+M[3]*p.y+M[5]],I=[1,0,0,1,0,0];
  const ocs=e=>e.extrusionDirection&&e.extrusionDirection.z<0?[-1,0,0,1,0,0]:I;
  const det=M=>M[0]*M[3]-M[1]*M[2];
  const arcP=(c,r,a0,a1,ccw=true)=>{if(!ccw){[a0,a1]=[-a1,-a0]}while(a1<=a0)a1+=Math.PI*2;const k=Math.max(8,Math.ceil((a1-a0)/(Math.PI/36))),o=[];for(let i=0;i<=k;i++){const t=a0+(a1-a0)*i/k;o.push({x:c.x+r*Math.cos(t),y:c.y+r*Math.sin(t)})}return o};
  const bulgeP=(V,closed)=>{const o=[];const N=V.length;for(let i=0;i<N;i++){const a=V[i],b=V[(i+1)%N];o.push({x:a.x,y:a.y});if(i===N-1&&!closed)break;const bu=a.bulge||0;if(Math.abs(bu)>1e-9){const th=4*Math.atan(bu),dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);if(L<1e-12)continue;const r=L/(2*Math.sin(th/2)),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,h=r*Math.cos(th/2),cx=mx-dy/L*h,cy=my+dx/L*h,s0=Math.atan2(a.y-cy,a.x-cx),k=Math.max(4,Math.ceil(Math.abs(th)/(Math.PI/36)));for(let j=1;j<k;j++){const t=s0+th*j/k;o.push({x:cx+Math.abs(r)*Math.cos(t)*Math.sign(r)*Math.sign(r),y:cy+Math.abs(r)*Math.sin(t)})}}}if(closed&&o.length)o.push({...o[0]});return o};
  const ltype=t=>{t=(t||'').toUpperCase();return/CENT|DASHDOT|PHANTOM/.test(t)?'center':/DASH|HIDDEN|DOT/.test(t)?'dashed':'solid'};
  const clean=s=>String(s||'').replace(/%%[pP]/g,'±').replace(/%%[cC]/g,'Ø').replace(/%%[dD]/g,'°').replace(/%%[uUoO]/g,'').replace(/\\U\+([0-9A-Fa-f]{4})/g,(m,h)=>String.fromCharCode(parseInt(h,16))).replace(/\\P/g,' ').replace(/\\[ACHQTWfFpL][^;]*;/g,'').replace(/\\[~]/g,' ').replace(/\\[OoLlKk]/g,'').replace(/[{}]/g,'').trim();
  function walk(list,M,layer,depth){for(const e of list){if(n>MAXN)return;if(e.isVisible===false)continue;let lay=e.layer==='0'&&layer?layer:e.layer;const L=LAY[lay];if(L&&(L.off||L.frozen))continue;const O=mul(M,ocs(e)),lw=(e.lineweight||0)>=50?2:1,dash=ltype(e.lineType);
    const pl=(P,closed)=>{if(P.length<2)return;n++;raw.push({t:'line',lay,pts:P.map(p=>ap(O,p)),dash,lw,closed})};
    switch(e.type){
      case'LINE':pl([e.startPoint,e.endPoint]);break;
      case'LWPOLYLINE':case'POLYLINE2D':{const cl=!!(e.flag&1);if(e.vertices&&e.vertices.length)pl(bulgeP(e.vertices,cl),cl);break}
      case'ARC':pl(arcP(e.center,e.radius,e.startAngle,e.endAngle));break;
      case'CIRCLE':pl(arcP(e.center,e.radius,0,Math.PI*2),true);break;
      case'ELLIPSE':{const c=e.center,mj=e.majorAxisEndPoint,a=Math.hypot(mj.x,mj.y),b=a*e.axisRatio,r=Math.atan2(mj.y,mj.x);let a0=e.startAngle,a1=e.endAngle;while(a1<=a0)a1+=Math.PI*2;const k=48,P=[];for(let i=0;i<=k;i++){const t=a0+(a1-a0)*i/k,x=a*Math.cos(t),y=b*Math.sin(t);P.push({x:c.x+x*Math.cos(r)-y*Math.sin(r),y:c.y+x*Math.sin(r)+y*Math.cos(r)})}pl(P);break}
      case'SPLINE':{const P=(e.fitPoints&&e.fitPoints.length>1)?e.fitPoints:(e.controlPoints||[]);pl(P);break}
      case'SOLID':{const P=[e.corner1,e.corner2,e.corner4||e.corner3,e.corner3].filter(Boolean);n++;raw.push({t:'hatch',lay,poly:P.map(p=>ap(O,p)),pat:'solid',sp:300,ang:0});break}
      case'HATCH':{const solid=e.solidFill||/^SOLID/i.test(e.patternName||'');for(const bp of e.boundaryPaths||[]){let P=[];if(bp.vertices&&bp.vertices.length)P=bulgeP(bp.vertices,true);else for(const ed of bp.edges||[]){if(ed.type===1)P.push(ed.start,ed.end);else if(ed.type===2)P.push(...arcP(ed.center,ed.radius,ed.startAngle,ed.endAngle,ed.isCCW!==0&&ed.isCCW!==false));else if(ed.type===3&&ed.center){P.push(ed.center)}else if(ed.controlPoints)P.push(...ed.controlPoints)}
        if(P.length>=3){n++;raw.push({t:'hatch',lay,poly:P.map(p=>ap(O,p)),pat:solid?'solid':'lines',scale:(e.patternScale||1)*Math.sqrt(Math.abs(det(M))),ang:(e.patternAngle||0)+(/ANSI3/i.test(e.patternName||'')?Math.PI/4:0)})}}break}
      case'TEXT':case'ATTRIB':{const s=clean(e.text);if(!s)break;const h=(e.textHeight||1),useEnd=(e.halign||e.valign)&&e.endPoint&&(e.endPoint.x||e.endPoint.y),p=useEnd?e.endPoint:e.startPoint;n++;raw.push({t:'text',lay,qt:legacy(e),str:s,h,p:ap(O,p),rot:(e.rotation||0),M:O,al:useEnd?(e.halign===1||e.halign===4?1:e.halign===2?2:0):0,va:useEnd?(e.valign||0):0});break}
      case'MTEXT':{const s=clean(e.text);if(!s)break;const at=e.attachmentPoint||1,rot=e.direction?Math.atan2(e.direction.y,e.direction.x):(e.rotation||0);n++;raw.push({t:'text',lay,qt:legacy(e),str:s,h:e.textHeight||1,p:ap(O,e.insertionPoint),rot,M:O,al:(at-1)%3,va:3-Math.floor((at-1)/3)});break}
      case'INSERT':case'DIMENSION':{const b=BR[e.name];if(!b||!b.entities||depth>8)break;let T=I;if(e.type==='INSERT'){const ip=e.insertionPoint,c=Math.cos(e.rotation||0),s=Math.sin(e.rotation||0),bp=b.basePoint||{x:0,y:0},xs=e.xScale||1,ys=e.yScale||1;T=mul([1,0,0,1,ip.x,ip.y],mul([c,s,-s,c,0,0],mul([xs,0,0,ys,0,0],[1,0,0,1,-bp.x,-bp.y])))}
        walk(b.entities,mul(O,T),lay,depth+1);if(e.attribs)walk(e.attribs.map(a=>({...a,type:'ATTRIB'})),M,lay,depth+1);break}}}}
  walk(db.entities||[],I,null,0);
  // units: header INSUNITS is often wrong; guess from the typical line length (rooms are metres apart)
  const Ls=raw.filter(r=>r.t==='line').map(r=>Math.hypot(r.pts[1][0]-r.pts[0][0],r.pts[1][1]-r.pts[0][1])).filter(v=>v>0).sort((a,b)=>a-b),med=Ls.length?Ls[Ls.length>>1]:1000;
  const U=med<8?1000:med<300?10:1,unit=U===1000?'متر':U===10?'سانتی‌متر':'میلی‌متر';
  const ents=[];const sc=p=>[p[0]*U,p[1]*U];
  for(const r of raw){if(r.t==='line')ents.push({t:'line',lay:r.lay,pts:r.pts.map(sc),dash:r.dash,lw:r.lw,kind:'import'});
    else if(r.t==='hatch')ents.push({t:'hatch',lay:r.lay,poly:r.poly.map(sc),pat:r.pat,sp:Math.max(40,Math.min(3000,3.175*(r.scale||1)*U)),ang:r.ang||0});
    else{const M=r.M,sx=Math.hypot(M[0],M[1]),h=r.h*sx*U,ang=Math.atan2(M[1],M[0])+(r.rot||0)*(det(M)<0?-1:1),w=r.str.length*h*.6,d=[Math.cos(ang),Math.sin(ang)],nn=[-d[1],d[0]],p=sc(r.p);
      const dx=r.al===0?w/2:r.al===2?-w/2:0,dy=r.va===3?-h/2:r.va===1?h/2:r.va===0?h/2:0;ents.push({t:'text',lay:r.lay,qt:r.qt?1:0,c:[p[0]+d[0]*dx+nn[0]*dy,p[1]+d[1]*dx+nn[1]*dy],str:r.str,sub:'',size:Math.max(1,h),bold:0,ang})}}
  const layers={};ents.forEach(e=>layers[e.lay]=1);return{ents,unit,U,layers:Object.keys(layers).sort(),truncated:n>MAXN}}

let dwgLib=null;
async function loadDwgLib(){if(dwgLib)return dwgLib;const m=await import(new URL('lib/libredwg/dist/libredwg-web.js',document.baseURI).href);dwgLib={m,lib:await m.LibreDwg.create(new URL('lib/libredwg/wasm',document.baseURI).href)};return dwgLib}
async function openCad(file){const st=t=>{const n=$('[data-saved]');if(n)n.textContent=t};const name=file.name,ext=(name.split('.').pop()||'').toLowerCase();
  if(ext==='mycad'||ext==='json')return openBackup(file);
  if(!['dwg','dxf'].includes(ext)){flash('فقط فایل‌های DWG، DXF و پشتیبان MyCad باز می‌شوند.');return}
  try{st('در حال آماده کردن خواننده‌ی DWG…');const{m,lib}=await loadDwgLib();st('در حال خواندن '+name+'…');await new Promise(r=>setTimeout(r,30));
    const buf=await file.arrayBuffer(),dwg=lib.dwg_read_data(ext==='dxf'?new TextDecoder().decode(buf):buf,ext==='dxf'?m.Dwg_File_Type.DXF:m.Dwg_File_Type.DWG);if(!dwg)throw Error('read');
    const db=lib.convert(dwg);try{lib.dwg_free(dwg)}catch(_){}const r=dwgImport(db);if(!r.ents.length)throw Error('empty');
    if(!saved)await saveNow();const pr={name:name.replace(/\.[^.]+$/,''),file:name,desc:'باز شده از '+ext.toUpperCase(),imported:{unit:r.unit,layers:r.layers},floors:[{name:'فضای مدل',ents:r.ents}]};pr.hist=[{undo:[],redo:[]}];
    hidden.clear();locked.clear();lPane=null;leftUI();loadProject(pr);markDirty();flash(`${fa(r.ents.length)} المان از ${fa(r.layers.length)} لایه باز شد. واحد نقشه: ${r.unit}.`)}
  catch(x){console.error(x);st('باز نشد');flash(x&&x.message==='empty'?'در این فایل چیزی برای نمایش پیدا نشد.':'این فایل باز نشد. شاید نسخه‌اش پشتیبانی نمی‌شود یا خواننده‌ی DWG در این مرورگر بار نشد.')}}
