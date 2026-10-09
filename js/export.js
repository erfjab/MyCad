// ---------- export: PDF / PNG sheet at a chosen scale and paper, or DXF for AutoCAD ----------
const PAPER={A4:[297,210],A3:[420,297],A2:[594,420],A1:[841,594],A0:[1189,841]};
const EXP={fmt:'pdf',paper:'A3',orient:'land',scale:100,tb:1};
const LIGHT={bg:'#FFFFFF',ink:'#111111',mute:'#707070',acc:'#2563EB',grid:'#F3F3F3',grid2:'#E7E7E7',furn:'#5A5A5A'};
function sheetGeom(){let[W_,H_]=PAPER[EXP.paper];if(EXP.orient==='port')[W_,H_]=[H_,W_];const aw=W_-20,ah=H_-20-(EXP.tb?30:0),[x0,y0,x1,y1]=bbox(),bw=x1-x0,bh=y1-y0;
  const N=EXP.scale||Math.ceil(Math.max(bw/aw,bh/ah)*1.04);return{W:W_,H:H_,aw,ah,N,fits:bw/N<=aw&&bh/N<=ah,bb:[x0,y0,x1,y1],pw:bw/N,ph:bh/N}}
function drawPlan(lite){const E=ents().filter(vis).filter(e=>!lite||!['dim','text'].includes(e.t));
  E.filter(e=>e.t==='axes').forEach(e=>drawAxes(e,C.ink));E.filter(e=>e.t==='hatch').forEach(e=>drawHatch(e,C.ink,null));E.filter(e=>e.t==='furn').forEach(e=>drawItem(e,C.furn));E.filter(e=>e.t==='wall').forEach(e=>drawWall(e,C.ink));
  E.filter(e=>e.t==='line').forEach(e=>drawLine(e,C.ink));E.filter(e=>e.t==='shape').forEach(e=>drawShape(e,C.ink));E.filter(e=>['door','window','elevator','stairs','car','column'].includes(e.t)).forEach(e=>drawItem(e,C.ink));
  E.filter(e=>e.t==='text').forEach(e=>drawText(e,C.ink));E.filter(e=>e.t==='dim').forEach(e=>drawDim(e,C.ink))}
function drawSheet(g,k,lite){const G=sheetGeom(),sv=C;C={...LIGHT};try{const{W:Wp,H:Hp,N}=G,mm=v=>v*k;g.fillStyle='#fff';g.fillRect(0,0,mm(Wp),mm(Hp));
  const sw=k/N,[x0,y0,x1,y1]=G.bb,cx=mm(10+G.aw/2),cy=mm(10+G.ah/2);g.save();g.beginPath();g.rect(mm(10),mm(10),mm(Wp-20),mm(Hp-20));g.clip();
  withView(g,mm(Wp),mm(Hp),sw,cx-(x0+x1)/2*sw,cy+(y0+y1)/2*sw,()=>drawPlan(lite));g.restore();
  g.strokeStyle='#111';g.lineWidth=Math.max(.6,mm(.5));g.strokeRect(mm(10),mm(10),mm(Wp-20),mm(Hp-20));
  const bar=N>=200?10000:N>=100?5000:2000,bl=bar/N,bx=mm(16),by=mm(Hp-17);g.lineWidth=Math.max(.4,mm(.25));for(let i=0;i<5;i++){g.fillStyle=i%2?'#fff':'#111';g.fillRect(bx+mm(bl/5*i),by,mm(bl/5),mm(1.6));}g.strokeRect(bx,by,mm(bl),mm(1.6));
  if(!lite){g.fillStyle='#111';g.font=`500 ${mm(2.4)}px ${FONT}`;g.textAlign='center';g.textBaseline='bottom';g.direction='rtl';g.fillText('۰',bx,by-mm(.6));g.fillText(fa(bar/1000)+' متر',bx+mm(bl),by-mm(.6))}
  if(EXP.tb){const tw=Math.min(140,Wp-40),tx=mm(Wp-10-tw),ty=mm(Hp-10-28),rows=[[P.name,P.floors[fl].name],['مقیاس ۱:'+fa(N,0,false),'کاغذ '+EXP.paper],[new Date().toLocaleDateString('fa-IR'),'MyCad']];
    g.fillStyle='#fff';g.fillRect(tx,ty,mm(tw),mm(28));g.strokeRect(tx,ty,mm(tw),mm(28));g.beginPath();g.moveTo(tx,ty+mm(12));g.lineTo(tx+mm(tw),ty+mm(12));g.moveTo(tx,ty+mm(20));g.lineTo(tx+mm(tw),ty+mm(20));g.moveTo(tx+mm(tw/2),ty+mm(12));g.lineTo(tx+mm(tw/2),ty+mm(28));g.stroke();
    if(!lite){g.fillStyle='#111';g.direction='rtl';g.textBaseline='middle';g.textAlign='right';g.font=`700 ${mm(4.2)}px ${FONT}`;g.fillText(rows[0][0],tx+mm(tw-3),ty+mm(4.5));g.font=`500 ${mm(2.8)}px ${FONT}`;g.fillText(rows[0][1],tx+mm(tw-3),ty+mm(9));
      [[rows[1],16],[rows[2],24]].forEach(([r,y])=>{g.textAlign='center';g.fillText(r[0],tx+mm(tw*.75),ty+mm(y));g.fillText(r[1],tx+mm(tw*.25),ty+mm(y))})}}
  return G}finally{C=sv}}
function sheetCanvas(){const G=sheetGeom(),k=96/25.4,Wl=G.W*k,Hl=G.H*k,f=Math.min(200/96,Math.sqrt(30e6/(Wl*Hl))),cv=document.createElement('canvas');cv.width=Math.round(Wl*f);cv.height=Math.round(Hl*f);const g=cv.getContext('2d');g.setTransform(f,0,0,f,0,0);drawSheet(g,k,false);return{cv,G}}
function expUI(pin){const s4=el('div','ds');s4.append(el('p','eb','خروجی گرفتن'));const fm=el('div','seg');[['PDF','pdf'],['DXF اتوکد','dxf'],['تصویر PNG','png']].forEach(([l,v])=>{const b=el('button',EXP.fmt===v?'on':'',l);b.onclick=()=>{EXP.fmt=v;leftUI()};fm.append(b)});s4.append(fm);
  const row=(lab,node)=>{const r=el('div','f');r.append(el('label','',lab),node);s4.append(r)};
  if(EXP.fmt!=='dxf'){row('کاغذ',ddEl(Object.keys(PAPER).map(k=>[`${k} (${fa(PAPER[k][1])} × ${fa(PAPER[k][0])})`,k]),EXP.paper,v=>{EXP.paper=v;leftUI()},'اندازه‌ی کاغذ'));
    const og=el('div','seg');[['افقی','land'],['عمودی','port']].forEach(([l,v])=>{const b=el('button',EXP.orient===v?'on':'',l);b.onclick=()=>{EXP.orient=v;leftUI()};og.append(b)});row('جهت کاغذ',og);
    row('مقیاس',ddEl([[ '۱:۲۰',20],['۱:۵۰',50],['۱:۱۰۰',100],['۱:۲۰۰',200],['۱:۵۰۰',500],['جا شدن در کاغذ',0]],EXP.scale,v=>{EXP.scale=v;leftUI()},'مقیاس'));
    const tr=el('div','opt','<span>جدول مشخصات و مقیاس خطی</span>'),tb=el('button','sw'+(EXP.tb?' on':''));tb.setAttribute('aria-label','جدول مشخصات');tb.onclick=()=>{EXP.tb=EXP.tb?0:1;leftUI()};tr.append(tb);s4.append(tr);
    const G=sheetGeom(),box=el('div','pv sheet'),cv=document.createElement('canvas');box.append(cv);
    box.append(el('small','',G.fits?`نقشه روی کاغذ: ${fa(Math.round(G.pw/10))} × ${fa(Math.round(G.ph/10))} سانت، مقیاس ۱:${fa(G.N,0,false)}`:`<b class="warn">در ۱:${fa(G.N,0,false)} روی ${EXP.paper} جا نمی‌شود.</b> کاغذ بزرگ‌تر یا مقیاس کوچک‌تر انتخاب کنید.`));s4.append(box);
    requestAnimationFrame(()=>{if(!cv.isConnected)return;const w=cv.clientWidth||270,h=Math.min(190,w*G.H/G.W),ww=h*G.W/G.H,dp=Math.min(3,devicePixelRatio||1);cv.style.height=h+'px';cv.width=w*dp;cv.height=h*dp;const g=cv.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.fillStyle=C.bg;g.fillRect(0,0,w,h);g.translate((w-ww)/2,0);g.shadowColor='rgba(0,0,0,.18)';g.shadowBlur=6;g.fillStyle='#fff';g.fillRect(0,0,ww,h);g.shadowBlur=0;drawSheet(g,ww/G.W,true)})}
  else s4.append(el('p','hint','فایل DXF با واحد میلی‌متر و لایه‌های جدا (دیوار، در و پنجره، پله، مبلمان، اندازه‌ها…) ساخته می‌شود و مستقیم در اتوکد باز می‌شود. برای DWG همان را در اتوکد با Save As ذخیره کنید. فایل داخل یک zip تحویل داده می‌شود.'));
  const go=el('button','btn pri',svg('export')+'دریافت فایل '+({pdf:'PDF',dxf:'DXF',png:'PNG'})[EXP.fmt]);go.onclick=()=>doExport(go);const ac=el('div','acts');ac.append(go);s4.append(ac);pin.append(s4)}
async function saveFile(name,blob){
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);flash('فایل آماده شد: '+name)}
let jsPDFp=null;function loadJsPDF(){return jsPDFp||(jsPDFp=new Promise((res,rej)=>{if(window.jspdf)return res(window.jspdf.jsPDF);const sc=document.createElement('script');sc.src='lib/jspdf/jspdf.umd.min.js';sc.onload=()=>res(window.jspdf.jsPDF);sc.onerror=()=>{jsPDFp=null;rej(new Error('jspdf'))};document.head.append(sc)}))}
async function doExport(btn){const old=btn.innerHTML;btn.disabled=true;btn.textContent='در حال ساخت فایل…';await new Promise(r=>setTimeout(r,30));
  const base=fileBase()+'-'+(fl+1);try{
    if(EXP.fmt==='dxf'){await saveFile(base+'-dxf.zip',zipBlob([{name:base+'.dxf',data:new TextEncoder().encode(dxfText())}]))}
    else{const{cv,G}=sheetCanvas();if(EXP.fmt==='png'){const b=await new Promise(r=>cv.toBlob(r,'image/png'));await saveFile(`${base}-${EXP.paper}-1-${G.N}.png`,b)}
      else{const jsPDF=await loadJsPDF(),doc=new jsPDF({orientation:G.W>G.H?'landscape':'portrait',unit:'mm',format:[G.W,G.H],compress:true});doc.addImage(cv.toDataURL('image/png'),'PNG',0,0,G.W,G.H,undefined,'FAST');await saveFile(`${base}-${EXP.paper}-1-${G.N}.pdf`,doc.output('blob'))}}}
  catch(e){flash(e&&e.message==='jspdf'?'کتابخانه‌ی PDF بارگیری نشد؛ PNG را امتحان کنید.':'ساخت فایل ناموفق بود.')}finally{btn.disabled=false;btn.innerHTML=old}}
// DXF: replay the same drawing code into a recorder that turns canvas paths into polylines and texts (1 screen px = 25 mm)
function dxfCollect(){const K=25,out=[];let lay='0';const R={lineWidth:1,fillStyle:'#000',strokeStyle:'#000',font:'10px x',textAlign:'start',textBaseline:'alphabetic',globalAlpha:1,lineCap:'butt',lineJoin:'miter',miterLimit:10,direction:'rtl'};
  let m=[1,0,0,1,0,0],stack=[],path=[],cur=null,lp=[0,0];const T=(x,y)=>[(m[0]*x+m[2]*y+m[4])*K,-(m[1]*x+m[3]*y+m[5])*K],props=Object.keys(R);
  const mv=(x,y)=>{cur=[T(x,y)];path.push(cur);lp=[x,y]},ln=(x,y)=>{if(!cur)return mv(x,y);cur.push(T(x,y));lp=[x,y]};
  const arcPts_=(x,y,rx,ry,rot,a0,a1,ccw)=>{if(!ccw){while(a1<a0)a1+=TAU;if(a1-a0>TAU)a1=a0+TAU}else{while(a1>a0)a1-=TAU;if(a0-a1>TAU)a1=a0-TAU}const n=Math.max(6,Math.ceil(Math.abs(a1-a0)/(Math.PI/24))),c=Math.cos(rot),sn=Math.sin(rot);
    for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n,px=rx*Math.cos(t),py=ry*Math.sin(t),X=x+px*c-py*sn,Y=y+px*sn+py*c;(i===0&&!cur)?mv(X,Y):ln(X,Y)}};
  const emit=(fill)=>{const sc=Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]))*K,w=fill?0:R.lineWidth*sc;path.forEach(P=>{if(P.length<2)return;out.push({t:'pl',lay,pts:P,closed:!!P.closed||fill,w:w>=40?w:0})})};
  Object.assign(R,{save(){stack.push([m.slice(),props.map(k=>R[k])])},restore(){const a=stack.pop();if(a){m=a[0];props.forEach((k,i)=>R[k]=a[1][i])}},
    translate(x,y){m=[m[0],m[1],m[2],m[3],m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]},rotate(a){const c=Math.cos(a),s_=Math.sin(a);m=[m[0]*c+m[2]*s_,m[1]*c+m[3]*s_,-m[0]*s_+m[2]*c,-m[1]*s_+m[3]*c,m[4],m[5]]},
    scale(x,y){m=[m[0]*x,m[1]*x,m[2]*y,m[3]*y,m[4],m[5]]},setTransform(){},beginPath(){path=[];cur=null},moveTo:mv,lineTo:ln,closePath(){if(cur){cur.closed=true;cur=null}},
    arc(x,y,r,a0,a1,ccw){arcPts_(x,y,r,r,0,a0,a1,ccw)},ellipse(x,y,rx,ry,rot,a0,a1,ccw){arcPts_(x,y,rx,ry,rot,a0,a1,ccw)},
    rect(x,y,w,h){mv(x,y);ln(x+w,y);ln(x+w,y+h);ln(x,y+h);R.closePath()},
    roundRect(x,y,w,h,r){r=Math.max(0,Math.min(+r||0,Math.abs(w)/2,Math.abs(h)/2));if(!r||w<0||h<0)return R.rect(x,y,w,h);mv(x+r,y);ln(x+w-r,y);arcPts_(x+w-r,y+r,r,r,0,-H,0);ln(x+w,y+h-r);arcPts_(x+w-r,y+h-r,r,r,0,0,H);ln(x+r,y+h);arcPts_(x+r,y+h-r,r,r,0,H,Math.PI);ln(x,y+r);arcPts_(x+r,y+r,r,r,0,Math.PI,Math.PI*1.5);R.closePath()},
    quadraticCurveTo(cx,cy,x,y){const[x0,y0]=lp;for(let i=1;i<=10;i++){const t=i/10,u=1-t;ln(u*u*x0+2*u*t*cx+t*t*x,u*u*y0+2*u*t*cy+t*t*y)}},
    stroke(){emit(false)},fill(){if(R.fillStyle!==C.bg)emit(true)},clip(){},setLineDash(){},getLineDash(){return[]},
    fillRect(x,y,w,h){if(R.fillStyle===C.bg)return;const sp=path,sc_=cur;path=[];cur=null;R.rect(x,y,w,h);emit(true);path=sp;cur=sc_},
    strokeRect(x,y,w,h){const sp=path,sc_=cur;path=[];cur=null;R.rect(x,y,w,h);emit(false);path=sp;cur=sc_},
    measureText(t){const z=parseFloat((/([\d.]+)px/.exec(R.font)||[0,10])[1]);return{width:String(t).length*z*.5}},
    fillText(str,x,y){if(R.fillStyle===C.bg)return;const z=parseFloat((/([\d.]+)px/.exec(R.font)||[0,10])[1]),sc=Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]))*K;out.push({t:'tx',lay,p:T(x,y),h:z*sc*.72,rot:-Math.atan2(m[1],m[0])*R2D,str:String(str),al:R.textAlign})}});
  const sv=[C,mouse,ghost];C={...LIGHT};mouse=null;ghost=null;const D={walls:'A-WALL',open:'A-DOOR-WIND',circ:'A-STAIR-LIFT',park:'A-PARKING',struct:'S-COLUMN',axes:'S-GRID',furn:'A-FURNITURE',anno:'A-ANNO',dims:'A-DIMS',fill:'A-HATCH'};
  try{withView(R,1e6,1e6,1/K,0,0,()=>{for(const e of ents()){if(!vis(e))continue;lay=e.lay||D[LAYER_OF[e.t]]||'0';if(e.t==='hatch'){out.push({t:'pl',lay,pts:e.poly.map(p=>p.slice()),closed:true,w:0});continue}
      if(e.t==='wall'){const L=plen(e.pts),cuts=ents().filter(o=>(o.t==='door'||o.t==='window')&&vis(o)).map(o=>{const r=locate(e.pts,o.c);return r.d<e.th/2+20?[Math.max(0,r.s-o.w/2),Math.min(L,r.s+o.w/2)]:null}).filter(Boolean).sort((a,b)=>a[0]-b[0]);
        if(cuts.length){let s0=0;const parts=[];cuts.forEach(([a,b])=>{if(a-s0>1)parts.push([s0,a]);s0=Math.max(s0,b)});if(L-s0>1)parts.push([s0,L]);parts.forEach(([a,b])=>drawWall({...e,closed:false,join:null,pts:slice(e.pts,a,b)},C.ink));continue}}
      drawEnt(e,C.ink)}})}finally{[C,mouse,ghost]=sv}
  return{out,layers:D}}
function dxfText(){const{out,layers}=dxfCollect(),L=[],g=(c,v)=>L.push(c,typeof v==='number'?(Math.round(v*1000)/1000).toString():v);
  const enc=t=>{const ar=/[؀-ۿ]/.test(t);if(ar){t=[...t].reverse().join('').replace(/[۰-۹0-9٫٬.,/]+/g,r=>[...r].reverse().join(''))}return t.replace(/[^\x20-\x7e]/g,c=>'\\U+'+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0'))};
  const COL={'A-WALL':7,'A-DOOR-WIND':4,'A-STAIR-LIFT':3,'A-PARKING':8,'S-COLUMN':1,'S-GRID':5,'A-FURNITURE':8,'A-ANNO':2,'A-DIMS':6,'A-HATCH':9};
  g(0,'SECTION');g(2,'HEADER');g(9,'$ACADVER');g(1,'AC1009');g(9,'$INSUNITS');g(70,4);g(0,'ENDSEC');
  g(0,'SECTION');g(2,'TABLES');g(0,'TABLE');g(2,'LTYPE');g(70,1);g(0,'LTYPE');g(2,'CONTINUOUS');g(70,0);g(3,'Solid line');g(72,65);g(73,0);g(40,0);g(0,'ENDTAB');
  const names=[...new Set([...Object.values(layers),...out.map(o=>o.lay)])].filter(n=>n&&n!=='0');g(0,'TABLE');g(2,'LAYER');g(70,names.length+1);['0',...names].forEach(n=>{g(0,'LAYER');g(2,n);g(70,0);g(62,COL[n]||7);g(6,'CONTINUOUS')});g(0,'ENDTAB');
  g(0,'TABLE');g(2,'STYLE');g(70,1);g(0,'STYLE');g(2,'STANDARD');g(70,0);g(40,0);g(41,1);g(50,0);g(71,0);g(42,250);g(3,'txt');g(4,'');g(0,'ENDTAB');g(0,'ENDSEC');
  g(0,'SECTION');g(2,'ENTITIES');
  for(const o of out){if(o.t==='pl'){g(0,'POLYLINE');g(8,o.lay);g(66,1);g(10,0);g(20,0);g(30,0);g(70,o.closed?1:0);if(o.w){g(40,o.w);g(41,o.w)}o.pts.forEach(p=>{g(0,'VERTEX');g(8,o.lay);g(10,p[0]);g(20,p[1]);g(30,0)});g(0,'SEQEND');g(8,o.lay)}
    else{const h=o.al==='center'?1:o.al==='left'||o.al==='start'?2:0;g(0,'TEXT');g(8,o.lay);g(10,o.p[0]);g(20,o.p[1]);g(30,0);g(40,Math.max(1,o.h));g(1,enc(o.str));g(50,(o.rot+360)%360);g(72,h);g(73,2);g(11,o.p[0]);g(21,o.p[1]);g(31,0)}}
  g(0,'ENDSEC');g(0,'EOF');return L.join('\r\n')+'\r\n'}
function zipBlob(files){const tb=new Uint32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0}),crc=d=>{let c=0xFFFFFFFF;for(let i=0;i<d.length;i++)c=tb[(c^d[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
  const parts=[],cen=[],te=new TextEncoder(),dt=new Date(),dd=((dt.getFullYear()-1980)<<9)|((dt.getMonth()+1)<<5)|dt.getDate();let off=0;
  for(const f of files){const nm=te.encode(f.name),c=crc(f.data),lh=new DataView(new ArrayBuffer(30)),ch=new DataView(new ArrayBuffer(46));
    [[0,0x04034b50,4],[4,20,2],[6,0,2],[8,0,2],[10,0,2],[12,dd,2],[14,c,4],[18,f.data.length,4],[22,f.data.length,4],[26,nm.length,2],[28,0,2]].forEach(([o,v,z])=>z===4?lh.setUint32(o,v,true):lh.setUint16(o,v,true));
    [[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0,2],[10,0,2],[12,0,2],[14,dd,2],[16,c,4],[20,f.data.length,4],[24,f.data.length,4],[28,nm.length,2],[30,0,2],[32,0,2],[34,0,2],[36,0,2],[38,0,4],[42,off,4]].forEach(([o,v,z])=>z===4?ch.setUint32(o,v,true):ch.setUint16(o,v,true));
    parts.push(lh,nm,f.data);cen.push(ch,nm);off+=30+nm.length+f.data.length}
  const cs=cen.reduce((a,x)=>a+x.byteLength,0),eo=new DataView(new ArrayBuffer(22));eo.setUint32(0,0x06054b50,true);eo.setUint16(8,files.length,true);eo.setUint16(10,files.length,true);eo.setUint32(12,cs,true);eo.setUint32(16,off,true);
  return new Blob([...parts,...cen,eo],{type:'application/zip'})}
