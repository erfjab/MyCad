// ---------- state ----------
const cvEl=$('.cv'),canvas=cvEl.querySelector('canvas'),mainCtx=canvas.getContext('2d');let ctx=mainCtx;
let W=0,Hh=0,s=.05,s0=.05,ox=0,oy=0,fitted=false,C={};
let tool='select',pts=[],chainStart=null,mouse=null,snapPt=null,ghost=null,sel=null,meas=null,cutA=null,drag=null,moving=null,ptype='mouse',lastTap=0;
// selSet holds everything selected; sel is that one entity when exactly one is selected (the card edits it), otherwise null
let selVer=0,selSet=new Set(),selBox=null,dynLock={},gripDrag=null,gripHot=null;
function setSel(list){selVer++;selSet=new Set((list||[]).filter(Boolean));sel=selSet.size===1?[...selSet][0]:null;if(!selSet.size&&tool==='select')rOpen=false}
function unpick(e){selVer++;if(selSet.delete(e))sel=selSet.size===1?[...selSet][0]:null}
const picked=e=>selSet.has(e);
let rOpen=false,lPane=null,saved=true;
const hidden=new Set(),locked=new Set();
const toS=p=>[p[0]*s+ox,oy-p[1]*s],toW=(x,y)=>[(x-ox)/s,(oy-y)/s];
const angDeg=(a,b)=>Math.round((Math.atan2(b[1]-a[1],b[0]-a[0])*R2D+360)%360);
const tolPx=()=>ptype==='touch'?24:12;
const mob=()=>W<760;
function readColors(){const cs=getComputedStyle(app);['bg','ink','mute','acc','warn','grid','grid2','furn'].forEach(k=>C[k]=cs.getPropertyValue('--'+k).trim())}
function dims(e){switch(e.t){case'elevator':return[e.w,e.d];case'column':return[e.w,e.d];case'furn':return[e.w,e.d];case'stairs':return stairDims(e);case'shape':return[e.w,e.d];case'car':{const g=carGeo(e);return[g.W,g.L]}case'door':return[e.w,e.th+2*(e.leaves===2?Math.max(e.w1,e.w2):e.w)];case'window':return[e.w,e.th]}return[0,0]}
const layOf=e=>e.lay||LAYER_OF[e.t],vis=e=>!hidden.has(layOf(e));
const isPath=e=>e.t==='wall'||e.t==='line';
const dimPts=e=>{const L=dist(e.a,e.b)||1,n=[-(e.b[1]-e.a[1])/L,(e.b[0]-e.a[0])/L];return[[e.a[0]+n[0]*e.off,e.a[1]+n[1]*e.off],[e.b[0]+n[0]*e.off,e.b[1]+n[1]*e.off],n]};

// ---------- view ----------
function bbox(){if(ents().length>2000){const X=[],Y=[];ents().forEach(e=>{const p=(e.pts||e.poly||[])[0]||e.c;if(p){X.push(p[0]);Y.push(p[1])}});X.sort((a,b)=>a-b);Y.sort((a,b)=>a-b);const q=(A,t)=>A[Math.floor((A.length-1)*t)],x0=q(X,.01),x1=q(X,.99),y0=q(Y,.01),y1=q(Y,.99),mx=(x1-x0)*.04,my=(y1-y0)*.04;return[x0-mx,y0-my,x1+mx,y1+my]}
  let x0=1e12,y0=1e12,x1=-1e12,y1=-1e12;const ad=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)};
  ents().forEach(e=>{(e.pts||e.poly||[]).forEach(p=>ad(...p));if(e.t==='dim'){const[A,B]=dimPts(e);ad(...A);ad(...B)}if(e.c&&e.t!=='door'&&e.t!=='window'){if(e.t==='text'){ad(e.c[0],e.c[1]);return}const[w,d]=dims(e),r=Math.hypot(w,d)/2;ad(e.c[0]-r,e.c[1]-r);ad(e.c[0]+r,e.c[1]+r)}});
  return x0>x1?[0,0,16000,12000]:[x0,y0,x1,y1]}
function fit(){const[x0,y0,x1,y1]=bbox(),m=mob(),pl=m?14:(lPane?400:84),pr=m?14:(rOpen?400:84),pt=m?62:28,pb=m?80:28,w=W-pl-pr,h=Hh-pt-pb;s=Math.min(w/(x1-x0),h/(y1-y0));s0=s;ox=pl+w/2-(x0+x1)/2*s;oy=pt+h/2+(y0+y1)/2*s}
function zoomAt(x,y,f){const w=toW(x,y);s=Math.max(.004,Math.min(5,s*f));ox=x-w[0]*s;oy=y+w[1]*s;draw();const z=$('[data-zoom]');if(z)z.textContent=fa(Math.round(s/s0*100))+'٪'}

// ---------- drawing ----------
function grid(step,col){ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();const[a0,b1]=toW(0,0),[a1,b0]=toW(W,Hh);
  for(let x=Math.floor(a0/step)*step;x<=a1;x+=step){const X=Math.round(x*s+ox)+.5;ctx.moveTo(X,0);ctx.lineTo(X,Hh)}
  for(let y=Math.floor(b0/step)*step;y<=b1;y+=step){const Y=Math.round(oy-y*s)+.5;ctx.moveTo(0,Y);ctx.lineTo(W,Y)}ctx.stroke()}
function pathOf(P){ctx.beginPath();P.forEach((p,i)=>{const q=toS(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])})}
function drawWall(e,col,alpha){ctx.save();ctx.globalAlpha=alpha||1;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineCap='butt';ctx.lineJoin='miter';ctx.miterLimit=4;ctx.lineWidth=Math.max(1.5,e.th*s);pathOf(e.pts);if(e.closed)ctx.closePath();ctx.stroke();
  if(e.join)for(const[P0,Q]of e.join){const A=toS(P0),B=toS(Q),a=Math.atan2(B[1]-A[1],B[0]-A[0]),h=e.th*s/2;ctx.save();ctx.translate(A[0],A[1]);ctx.rotate(a);ctx.fillRect(-h,-h,2*h,2*h);ctx.restore()}ctx.restore()}
function computeJoins(){const W_=ents().filter(e=>e.t==='wall');for(const e of W_){e.join=[];const ends=[[e.pts[0],e.pts[1]],[e.pts[e.pts.length-1],e.pts[e.pts.length-2]]];for(const en of ends){if(W_.some(o=>o!==e&&[o.pts[0],o.pts[o.pts.length-1]].some(q=>dist(q,en[0])<1)))e.join.push(en)}}}
const BB=new WeakMap();function offView(e){if(ctx!==mainCtx)return false;const P_=e.pts||e.poly,sg=P_[0][0]+P_[0][1]*7+P_[P_.length-1][0]*3+P_[P_.length-1][1]*5+P_.length;let b=BB.get(e);if(!b||b[4]!==sg){let x0=1e12,y0=1e12,x1=-1e12,y1=-1e12;for(const p of e.pts||e.poly){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}b=[x0,y0,x1,y1,sg];BB.set(e,b)}const[a0,b1]=toW(0,0),[a1,b0]=toW(W,Hh);return b[2]<a0||b[0]>a1||b[3]<b0||b[1]>b1}
function drawLine(e,col,alpha){if(e.kind==='import'&&offView(e))return;ctx.save();ctx.globalAlpha=alpha||1;ctx.strokeStyle=col;ctx.lineWidth=[0,1,1.7,2.6][e.lw]||1.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(e.dash==='dashed'?[9,6]:e.dash==='center'?[16,5,3,5]:[]);pathOf(e.pts);ctx.stroke();ctx.restore()}
function drawShape(e,col,alpha){const P=shapePts(e);ctx.save();ctx.globalAlpha=alpha||1;pathOf(P);ctx.closePath();if(e.fill){ctx.fillStyle=col;ctx.globalAlpha*=.1;ctx.fill();ctx.globalAlpha=alpha||1}
  ctx.strokeStyle=col;ctx.lineWidth=[0,1,1.7,2.6][e.lw]||1.5;ctx.lineJoin='round';ctx.setLineDash(e.dash==='dashed'?[9,6]:e.dash==='center'?[16,5,3,5]:[]);ctx.stroke();ctx.restore()}
function blk(e,fn){const Q=toS(e.c);ctx.save();ctx.translate(Q[0],Q[1]);ctx.rotate(-(e.ang||0));ctx.scale(s,s);fn();ctx.restore()}
const lw=px=>ctx.lineWidth=px/s;
function leaf(hx,hy,r,a,dir){lw(2);ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+dir*r*Math.cos(a),hy-r*Math.sin(a));ctx.stroke();lw(1);ctx.setLineDash([4/s,3/s]);ctx.beginPath();if(dir===1)ctx.arc(hx,hy,r,-a,0);else ctx.arc(hx,hy,r,Math.PI,Math.PI+a);ctx.stroke();ctx.setLineDash([])}
function arrowPath(P0){lw(1.3);ctx.beginPath();P0.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));const a=P0[P0.length-2],b=P0[P0.length-1],an=Math.atan2(b[1]-a[1],b[0]-a[0]),hl=170;ctx.moveTo(b[0]-hl*Math.cos(an-.45),b[1]-hl*Math.sin(an-.45));ctx.lineTo(b[0],b[1]);ctx.lineTo(b[0]-hl*Math.cos(an+.45),b[1]-hl*Math.sin(an+.45));ctx.stroke()}
function carBody(cx,cy,col){const cl=4500,cw=1800;ctx.save();ctx.translate(cx,cy);ctx.fillStyle=C.bg;ctx.beginPath();ctx.roundRect(-cw/2,-cl/2,cw,cl,cw*.22);ctx.fill();lw(1.4);ctx.stroke();ctx.fillStyle=col;
  const ws=-cl/2+cl*.27,rf=cl*.08,rw=cl/2-cl*.16,ix=cw/2-cw*.08;lw(1);ctx.beginPath();ctx.moveTo(-ix,ws);ctx.quadraticCurveTo(0,ws-cl*.065,ix,ws);ctx.lineTo(ix*.9,rf);ctx.quadraticCurveTo(0,rf-cl*.02,-ix*.9,rf);ctx.closePath();ctx.moveTo(-ix*.92,rw);ctx.quadraticCurveTo(0,rw+cl*.045,ix*.92,rw);ctx.stroke();ctx.fillRect(-cw/2-120,ws+60,120,200);ctx.fillRect(cw/2,ws+60,120,200);ctx.restore()}

function furnShape(k,w,d){const B=C.bg,x0=-w/2,y0=-d/2;ctx.fillStyle=B;
  const bx=(x,y,ww,hh,r=0)=>{ctx.beginPath();r?ctx.roundRect(x,y,ww,hh,Math.min(r,ww/2,hh/2)):ctx.rect(x,y,ww,hh);ctx.fill();ctx.stroke()};
  const ln=(...q)=>{ctx.beginPath();ctx.moveTo(q[0],q[1]);for(let i=2;i<q.length;i+=2)ctx.lineTo(q[i],q[i+1]);ctx.stroke()};
  const ci=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.stroke()};
  const el2=(x,y,rx,ry)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);ctx.fill();ctx.stroke()};
  const solid=(x,y,ww,hh)=>{ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(x,y,ww,hh);ctx.fillStyle=B};
  const chair=(x,y,a)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);const c=440;bx(-c/2,-c/2+50,c,c-50,80);solid(-c/2+30,-c/2,c-60,70);ctx.restore()};
  lw(1.2);
  switch(k){
    case'sofa3':case'sofa2':case'chair1':{const n={sofa3:3,sofa2:2,chair1:1}[k],bd=Math.min(230,d*.26),aw=Math.min(190,w*.17);bx(x0,y0,w,d,70);ln(x0+aw,y0+bd,w/2-aw,y0+bd);ln(x0+aw,y0+bd,x0+aw,d/2);ln(w/2-aw,y0+bd,w/2-aw,d/2);lw(.7);for(let i=1;i<n;i++){const x=x0+aw+i*(w-2*aw)/n;ln(x,y0+bd,x,d/2-30)}break}
    case'sofaL':{const t=Math.min(900,d*.5,w*.4),bd=220,aw=180;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(w/2,y0);ctx.lineTo(w/2,d/2);ctx.lineTo(w/2-t,d/2);ctx.lineTo(w/2-t,y0+t);ctx.lineTo(x0,y0+t);ctx.closePath();ctx.fill();ctx.stroke();ln(x0+aw,y0+t,x0+aw,y0+bd,w/2-bd,y0+bd,w/2-bd,d/2-aw);ln(w/2-t,d/2-aw,w/2,d/2-aw);lw(.7);ln((x0+aw+w/2-t)/2,y0+bd,(x0+aw+w/2-t)/2,y0+t-30);ln(w/2-t,y0+t,w/2-bd,y0+bd);ln(w/2-t,(y0+t+d/2-aw)/2,w/2-bd-30,(y0+t+d/2-aw)/2);break}
    case'ctable':bx(x0,y0,w,d,60);lw(.6);bx(x0+60,y0+60,w-120,d-120,30);break;
    case'tv':bx(x0,y0,w,d,20);solid(-w*.36,y0+60,w*.72,55);break;
    case'rug':{lw(.9);bx(x0,y0,w,d);lw(.5);ctx.setLineDash([60,40]);ctx.strokeRect(x0+120,y0+120,w-240,d-240);ctx.setLineDash([]);ctx.beginPath();for(let x=x0+40;x<w/2;x+=90){ctx.moveTo(x,y0);ctx.lineTo(x,y0-70);ctx.moveTo(x,d/2);ctx.lineTo(x,d/2+70)}ctx.stroke();break}
    case'plant':{const r=Math.min(w,d)/2;lw(.9);for(let i=0;i<8;i++){const a=i*TAU/8;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.52,Math.sin(a)*r*.52,r*.46,r*.2,a,0,TAU);ctx.fill();ctx.stroke()}lw(1.2);ci(0,0,r*.2);break}
    case'bed2':case'bed1':case'crib':{bx(x0,y0,w,d,30);solid(x0,y0,w,70);if(k==='crib'){lw(.6);ctx.beginPath();for(let y=y0+140;y<d/2-60;y+=110){ctx.moveTo(x0,y);ctx.lineTo(x0+70,y);ctx.moveTo(w/2,y);ctx.lineTo(w/2-70,y)}ctx.stroke();break}
      const n=w>=1300?2:1,pw=(w-120-(n-1)*80)/n;for(let i=0;i<n;i++)bx(x0+60+i*(pw+80),y0+130,pw,Math.min(380,d*.19),90);const fy=y0+d*.34;ln(x0,fy,w/2,fy);lw(.7);ln(w/2-w*.32,fy,w/2,fy+w*.32);break}
    case'ward':{bx(x0,y0,w,d);lw(.6);ctx.setLineDash([50,40]);ln(x0+40,0,w/2-40,0);ctx.setLineDash([]);for(let x=x0+150;x<w/2-100;x+=170)ln(x-60,-d*.26,x+60,d*.26);lw(1);const nd=Math.max(1,Math.round(w/500));for(let i=1;i<nd;i++){const x=x0+i*w/nd;ln(x,d/2-70,x,d/2)}break}
    case'night':{const m=Math.min(w,d);bx(x0,y0,w,d,20);ci(0,0,m*.26);lw(.7);ln(-m*.18,0,m*.18,0);ln(0,-m*.18,0,m*.18);break}
    case'dress':bx(x0,y0,w,d,20);solid(-w*.3,y0,w*.6,45);ci(0,d/2+210,170);break;
    case'stove':{bx(x0,y0,w,d,20);const r=Math.min(w,d)*.13,xs=w>=800?[-w*.3,0,w*.3]:[-w*.22,w*.22];for(const x of xs)for(const y of[-d*.2,d*.14]){ci(x,y,r);lw(.6);ci(x,y,r*.4);lw(1.2)}lw(.8);ln(x0+40,d/2-50,w/2-40,d/2-50);break}
    case'fridge':bx(x0,y0,w,d,30);lw(.8);ln(x0,d/2-90,w/2,d/2-90);lw(2.4);ln(x0+70,d/2-45,x0+w*.4,d/2-45);lw(.6);ln(x0+60,y0+60,w/2-60,d/2-150);ln(w/2-60,y0+60,x0+60,d/2-150);break;
    case'ksink':{bx(x0,y0,w,d,20);const bw=Math.min(w*.46,520);bx(x0+70,y0+90,bw,d-170,70);ci(x0+70+bw/2,0,32);ci(x0+70+bw/2,y0+48,26);lw(.6);for(let x=x0+bw+160;x<w/2-60;x+=70)ln(x,y0+110,x,d/2-110);break}
    case'dish':bx(x0,y0,w,d,20);lw(.6);for(let i=1;i<4;i++)ln(x0+60,y0+i*d/4-30,w/2-60,y0+i*d/4-30);lw(1.2);ln(x0,d/2-70,w/2,d/2-70);break;
    case'counter':bx(x0,y0,w,d);lw(.6);ln(x0,d/2-60,w/2,d/2-60);break;
    case'dining':case'meet':{const nS=Math.max(1,Math.floor(w/650));for(let i=0;i<nS;i++){const x=x0+(i+.5)*w/nS;chair(x,y0-260,0);chair(x,d/2+260,Math.PI)}if(w>=1500||k==='meet'){chair(x0-260,0,-H);chair(w/2+260,0,H)}lw(1.3);bx(x0,y0,w,d,k==='meet'?d/2:40);break}
    case'rtable':{const r=Math.min(w,d)/2,n=r>=550?6:4;for(let i=0;i<n;i++){const a=i*TAU/n;chair(Math.sin(a)*(r+260),-Math.cos(a)*(r+260),a)}lw(1.3);ci(0,0,r);break}
    case'wc':{bx(x0,y0,w,180,30);el2(0,y0+180+(d-180)/2-10,w*.42,(d-180)/2);lw(.6);el2(0,y0+180+(d-180)/2+10,w*.28,(d-180)/2-90);break}
    case'wcir':{bx(x0,y0,w,d,140);lw(.8);el2(0,d*.05,w*.23,d*.3);ci(0,-d*.2,32);lw(1.1);bx(-w*.44,d*.02,w*.16,d*.32,40);bx(w*.28,d*.02,w*.16,d*.32,40);break}
    case'basin':{ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(w/2,y0);ctx.lineTo(w/2,0);ctx.quadraticCurveTo(w/2,d/2,0,d/2);ctx.quadraticCurveTo(x0,d/2,x0,0);ctx.closePath();ctx.fill();ctx.stroke();lw(.7);el2(0,d*.06,w*.32,d*.27);ci(0,y0+55,24);break}
    case'tub':{bx(x0,y0,w,d,60);lw(.7);bx(x0+80,y0+80,w-160,d-160,Math.min(240,d*.35));ci(x0+260,0,34);break}
    case'shower':{bx(x0,y0,w,d,20);lw(.6);ln(x0,y0,w/2,d/2);ln(w/2,y0,x0,d/2);lw(1.2);ci(0,0,45);break}
    case'washer':{const m=Math.min(w,d);bx(x0,y0,w,d,30);ci(0,d*.07,m*.31);lw(.6);ci(0,d*.07,m*.19);ln(x0+50,y0+80,w/2-50,y0+80);break}
    case'desk':{chair(0,d/2+300,Math.PI);lw(1.3);bx(x0,y0,w,d,20);lw(2.2);ln(-w*.2,y0+90,w*.2,y0+90);break}
    case'chair':{const c=Math.min(w,d);bx(-c/2,-c/2+c*.12,c,c*.88,c*.18);solid(-c/2+c*.07,-c/2,c*.86,c*.16);break}
    case'shelf':{bx(x0,y0,w,d);lw(.6);const n=Math.max(1,Math.round(w/300));for(let i=1;i<n;i++)ln(x0+i*w/n,y0,x0+i*w/n,d/2);break}
    default:bx(x0,y0,w,d)}}

function drawItem(e,col,alpha){ctx.save();ctx.globalAlpha=alpha||1;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineCap='round';ctx.lineJoin='round';
  blk(e,()=>{const w=e.w;
    if(e.t==='furn')furnShape(e.kind,e.w,e.d);
    else if(e.t==='door'){const h=e.th,a=(e.swing||90)/R2D;ctx.fillStyle=C.bg;ctx.fillRect(-w/2,-h/2-3/s,w,h+6/s);ctx.scale(e.flip?-1:1,e.side||1);lw(1.3);ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(-w/2,h/2);ctx.moveTo(w/2,-h/2);ctx.lineTo(w/2,h/2);ctx.stroke();if(e.leaves===2){leaf(-w/2,-h/2,e.w1,a,1);leaf(w/2,-h/2,e.w2,a,-1)}else leaf(-w/2,-h/2,w,a,1)}
    else if(e.t==='window'){const h=e.th,n=e.panes||1;ctx.fillStyle=C.bg;ctx.fillRect(-w/2,-h/2-3/s,w,h+6/s);lw(1.3);ctx.strokeRect(-w/2,-h/2,w,h);lw(1);ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(w/2,0);for(let i=1;i<n;i++){const x=-w/2+i*w/n;ctx.moveTo(x,-h/2);ctx.lineTo(x,h/2)}ctx.stroke()}
    else if(e.t==='elevator'){const d=e.d;ctx.fillStyle=C.bg;ctx.fillRect(-w/2,-d/2,w,d);lw(1.4);ctx.strokeRect(-w/2,-d/2,w,d);const iw=w/2-100,id=d/2-100;lw(1);ctx.strokeRect(-iw,-id,2*iw,2*id);ctx.beginPath();ctx.moveTo(-iw,-id);ctx.lineTo(iw,id);ctx.moveTo(iw,-id);ctx.lineTo(-iw,id);ctx.stroke();lw(3);ctx.beginPath();ctx.moveTo(-e.dw/2,d/2);ctx.lineTo(e.dw/2,d/2);ctx.stroke()}
    else if(e.t==='stairs'){const G=stairGeo(e),poly=P=>{ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath()},seg=l=>{ctx.moveTo(l[0][0],l[0][1]);ctx.lineTo(l[1][0],l[1][1])},kc=e.cut?G.kc:1e9;
      ctx.fillStyle=C.bg;G.O.forEach(P=>{poly(P);ctx.fill()});if(G.full&&G.core){ctx.beginPath();ctx.arc(G.core.c[0],G.core.c[1],G.core.r+e.w,0,TAU);ctx.fill()}
      lw(1);ctx.beginPath();G.L.filter(l=>l[2]<=kc).forEach(seg);ctx.stroke();
      if(e.cut){const rest=G.L.filter(l=>l[2]>kc);ctx.save();ctx.globalAlpha*=.4;ctx.setLineDash([70,50]);ctx.beginPath();rest.forEach(seg);ctx.stroke();ctx.restore();
        const b=rest[0];if(b){const f=b[3],sp=G.sp,p=[b[0][0]-f[0]*sp*.5,b[0][1]-f[1]*sp*.5],q=[b[1][0]-f[0]*sp*.5,b[1][1]-f[1]*sp*.5],A=[p[0]-f[0]*sp*.3,p[1]-f[1]*sp*.3],B=[q[0]+f[0]*sp*.3,q[1]+f[1]*sp*.3],M=[(A[0]+B[0])/2,(A[1]+B[1])/2],Lb=dist(A,B)||1,u=[(B[0]-A[0])/Lb,(B[1]-A[1])/Lb],nn=[-u[1],u[0]],z=Math.min(110,sp*.45);
          ctx.fillStyle=C.bg;lw(1.3);ctx.beginPath();[A,[M[0]-u[0]*z,M[1]-u[1]*z],[M[0]+nn[0]*z*1.3-u[0]*z*.3,M[1]+nn[1]*z*1.3-u[1]*z*.3],[M[0]-nn[0]*z*1.3+u[0]*z*.3,M[1]-nn[1]*z*1.3+u[1]*z*.3],[M[0]+u[0]*z,M[1]+u[1]*z],B].forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}}
      lw(1.4);G.O.forEach(P=>{poly(P);ctx.stroke()});if(G.core){ctx.fillStyle=col;ctx.beginPath();ctx.arc(G.core.c[0],G.core.c[1],G.core.r,0,TAU);ctx.fill()}
      const wk=e.dir==='down'?G.walk.slice().reverse():G.walk;arrowPath(wk);ctx.fillStyle=col;ctx.beginPath();ctx.arc(wk[0][0],wk[0][1],45,0,TAU);ctx.fill();
      if(170*s>5){const f0=G.walk[0],tp=[G.foot[0],G.foot[1]+230];ctx.save();ctx.translate(tp[0],tp[1]);ctx.rotate(e.ang||0);ctx.font=`700 170px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='rtl';ctx.fillStyle=col;ctx.fillText(e.dir==='down'?'پایین':'بالا',0,0);ctx.restore()}}
    else if(e.t==='car'){const g=carGeo(e);ctx.save();lw(1);ctx.globalAlpha*=.55;ctx.strokeRect(-g.W/2+g.col,-g.L/2,g.W-2*g.col,g.L);ctx.beginPath();for(let i=1;i<g.nx;i++){const x=-g.W/2+g.col+i*g.bw;ctx.moveTo(x,-g.L/2);ctx.lineTo(x,g.L/2)}for(let j=1;j<g.ny;j++){const y=-g.L/2+j*5000;ctx.moveTo(-g.W/2+g.col,y);ctx.lineTo(g.W/2-g.col,y)}ctx.stroke();ctx.restore();
      for(let i=0;i<g.nx;i++)for(let j=0;j<g.ny;j++)carBody(-g.W/2+g.col+(i+.5)*g.bw,-g.L/2+(j+.5)*5000,col);
      if(g.col){ctx.fillStyle=col;ctx.fillRect(-g.W/2,-g.L/2,g.col,g.col);ctx.fillRect(g.W/2-g.col,-g.L/2,g.col,g.col)}}
    else if(e.t==='column'){if(e.round){ctx.beginPath();ctx.ellipse(0,0,w/2,e.d/2,0,0,7);ctx.fill()}else ctx.fillRect(-w/2,-e.d/2,w,e.d)}
  });ctx.restore()}
function textMetrics(e){ctx.font=`${e.bold?700:500} ${e.size*s}px ${FONT}`;let w=ctx.measureText(e.str||' ').width/s;if(e.sub){ctx.font=`500 ${e.size*.62*s}px ${FONT}`;w=Math.max(w,ctx.measureText(e.sub).width/s)}return w}
function drawText(e,col,alpha){const px=e.size*s;if(px<2.5)return;ctx.save();ctx.globalAlpha=alpha||1;const Q=toS(e.c);ctx.translate(Q[0],Q[1]);ctx.rotate(-(e.ang||0));ctx.font=`${e.bold?700:500} ${px}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=col;ctx.direction=/[\u0600-\u06FF]/.test(e.str||'')?'rtl':'ltr';
  if(e.qt){const w=e.str.length*px*.55;ctx.strokeStyle=col;ctx.globalAlpha*=.45;ctx.lineWidth=1;ctx.setLineDash([3,2]);ctx.strokeRect(-w/2,-px*.45,w,px*.9);ctx.restore();return}
  if(e.sub){ctx.fillText(e.str||' ',0,-px*.36);ctx.font=`500 ${px*.62}px ${FONT}`;ctx.globalAlpha*=.72;ctx.fillText(e.sub,0,px*.5)}else ctx.fillText(e.str||' ',0,0);ctx.restore()}
function drawHatch(e,col,selCol,alpha){const Pp=e.poly;if(Pp.length<3)return;ctx.save();ctx.globalAlpha=alpha||1;pathOf(Pp);ctx.closePath();
  if(e.pat==='solid'){ctx.globalAlpha*=.14;ctx.fillStyle=col;ctx.fill();ctx.globalAlpha=alpha||1}
  else{ctx.save();ctx.clip();ctx.strokeStyle=col;ctx.globalAlpha*=.32;ctx.lineWidth=1;const xs=Pp.map(p=>p[0]),ys=Pp.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,R=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))/2+e.sp,sp=Math.max(e.sp,1/s*3);
    const fam=(a,fn)=>{const u=[Math.cos(a),Math.sin(a)],n=[-u[1],u[0]],bn=cx*n[0]+cy*n[1],bu=cx*u[0]+cy*u[1];for(let k=Math.floor((bn-R)/sp);k<=Math.ceil((bn+R)/sp);k++)fn(k,u,n,bu)};
    const seg=(a,b)=>{const A=toS(a),B=toS(b);ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1])};
    ctx.beginPath();
    if(e.pat==='tiles'){fam(e.ang,(k,u,n,bu)=>{const o=k*sp;seg([n[0]*o+u[0]*(bu-R),n[1]*o+u[1]*(bu-R)],[n[0]*o+u[0]*(bu+R),n[1]*o+u[1]*(bu+R)]);for(let j=Math.floor((bu-R)/(2*sp));j<=Math.ceil((bu+R)/(2*sp));j++){const uu=j*2*sp+(k%2?sp:0);seg([n[0]*o+u[0]*uu,n[1]*o+u[1]*uu],[n[0]*(o+sp)+u[0]*uu,n[1]*(o+sp)+u[1]*uu])}})}
    else{const fams=e.pat==='grid'?[e.ang,e.ang+H]:e.pat==='cross'?[e.ang+Math.PI/4,e.ang-Math.PI/4]:[e.ang];fams.forEach(a=>fam(a,(k,u,n,bu)=>{const o=k*sp;seg([n[0]*o+u[0]*(bu-R),n[1]*o+u[1]*(bu-R)],[n[0]*o+u[0]*(bu+R),n[1]*o+u[1]*(bu+R)])}))}
    ctx.stroke();ctx.restore()}
  if(selCol){pathOf(Pp);ctx.closePath();ctx.strokeStyle=selCol;ctx.globalAlpha=alpha||1;ctx.lineWidth=2;ctx.stroke()}ctx.restore()}
function label(txt,a,b,col,lift=7,alpha=1,bold=600){const A=toS(a),B=toS(b);let r=Math.atan2(B[1]-A[1],B[0]-A[0]);if(r>H+1e-3)r-=Math.PI;if(r<-H-1e-3)r+=Math.PI;ctx.save();ctx.globalAlpha=alpha;ctx.translate((A[0]+B[0])/2,(A[1]+B[1])/2);ctx.rotate(r);ctx.font=`${bold} 11.5px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='rtl';const tw=ctx.measureText(txt).width;ctx.fillStyle=C.bg;ctx.fillRect(-tw/2-4,-lift-16,tw+8,17);ctx.fillStyle=col;ctx.fillText(txt,0,-lift-7.5);ctx.restore();return tw}
function tick(Pt,u,n){ctx.moveTo(Pt[0]-(u[0]+n[0])*5,Pt[1]-(u[1]+n[1])*5);ctx.lineTo(Pt[0]+(u[0]+n[0])*5,Pt[1]+(u[1]+n[1])*5)}
function dimLine(a,b,col){const A=toS(a),B=toS(b),L=dist(A,B)||1,u=[(B[0]-A[0])/L,(B[1]-A[1])/L],n=[-u[1],u[0]];ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);tick(A,u,n);tick(B,u,n);ctx.stroke();label(fmtLen(dist(a,b)),a,b,col)}
function drawDim(e,col,alpha){const L=dist(e.a,e.b);if(L<1)return;const[A2,B2]=dimPts(e),a=toS(e.a),b=toS(e.b),A=toS(A2),B=toS(B2),Ls=dist(A,B)||1,u=[(B[0]-A[0])/Ls,(B[1]-A[1])/Ls],n=[-u[1],u[0]];ctx.save();ctx.globalAlpha=alpha||1;ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();
  if(Math.abs(e.off)*s>2){const sg=[A[0]-a[0],A[1]-a[1]],sl=Math.hypot(...sg)||1,v=[sg[0]/sl,sg[1]/sl];for(const[p,q]of[[a,A],[b,B]]){ctx.moveTo(p[0]+v[0]*4,p[1]+v[1]*4);ctx.lineTo(q[0]+v[0]*6,q[1]+v[1]*6)}}
  ctx.moveTo(A[0]-u[0]*6,A[1]-u[1]*6);ctx.lineTo(B[0]+u[0]*6,B[1]+u[1]*6);ctx.stroke();ctx.lineWidth=1.6;ctx.beginPath();tick(A,u,n);tick(B,u,n);ctx.stroke();ctx.restore();if(Ls>28)label(fmtLen(L),A2,B2,col,3,alpha||1)}
function markX(p){const Q=toS(p);ctx.strokeStyle=C.acc;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(Q[0]-6,Q[1]-6);ctx.lineTo(Q[0]+6,Q[1]+6);ctx.moveTo(Q[0]+6,Q[1]-6);ctx.lineTo(Q[0]-6,Q[1]+6);ctx.stroke()}
function cutStroke(e,Pp){ctx.save();ctx.strokeStyle=C.acc;ctx.globalAlpha=.55;ctx.lineCap='butt';ctx.lineWidth=Math.max(6,(e.th||0)*s+6);pathOf(Pp);ctx.stroke();ctx.restore()}
function badge(lines,wp,col){const Q=toS(wp);ctx.save();ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 14px ${FONT}`;const w1=ctx.measureText(lines[0]).width;ctx.font=`500 11px ${FONT}`;const w2=lines[1]?ctx.measureText(lines[1]).width:0,bw=Math.max(w1,w2)+20,bh=lines[1]?42:26;
  ctx.fillStyle=col||C.acc;ctx.beginPath();ctx.roundRect(Q[0]-bw/2,Q[1]-bh/2,bw,bh,8);ctx.fill();ctx.fillStyle='#fff';ctx.font=`800 14px ${FONT}`;ctx.fillText(lines[0],Q[0],Q[1]-(lines[1]?7:0));if(lines[1]){ctx.font=`500 11px ${FONT}`;ctx.globalAlpha=.9;ctx.fillText(lines[1],Q[0],Q[1]+11)}ctx.restore()}
function wallDims(){for(const e of ents()){if(e.t!=='wall'||!vis(e))continue;const lift=e.th*s/2+3;if(e.pts.length===2){const[a,b]=e.pts,Ls=dist(toS(a),toS(b));if(Ls<56)continue;label(fmtLen(dist(a,b)),a,b,C.mute,lift,1,500)}else{const L=plen(e.pts),i=Math.floor(e.pts.length/2);label(fmtLen(L),e.pts[i-1],e.pts[i],C.mute,lift,1,500)}}}
function draw(){if(!W)return;ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,Hh);
  if(opt.grid){const st=[50,100,250,500,1000,2500,5000,10000],g=st.find(v=>v*s>=14)||10000;grid(g,C.grid);grid(g*(g===250||g===2500?4:5),C.grid2)}
  const E=ents().filter(vis),col=e=>picked(e)?C.acc:C.ink;
  E.filter(e=>e.t==='hatch').forEach(e=>drawHatch(e,C.ink,picked(e)?C.acc:null));
  E.filter(e=>e.t==='furn').forEach(e=>drawItem(e,picked(e)?C.acc:C.furn));
  E.filter(e=>e.t==='wall').forEach(e=>drawWall(e,col(e)));
  E.filter(e=>e.t==='line').forEach(e=>drawLine(e,col(e)));
  E.filter(e=>e.t==='shape').forEach(e=>drawShape(e,col(e)));
  E.filter(e=>['door','window','elevator','stairs','car','column'].includes(e.t)).forEach(e=>drawItem(e,col(e)));
  E.filter(e=>e.t==='text').forEach(e=>drawText(e,col(e)));
  E.filter(e=>e.t==='dim').forEach(e=>drawDim(e,col(e)));
  if(opt.wallDims)wallDims();
  drawGrips();drawPreview();drawMeasure();drawBox();
  if(snapPt&&['wall','line','measure','hatch','shape'].includes(tool)){const Q=toS(snapPt);ctx.strokeStyle=C.acc;ctx.lineWidth=1.5;ctx.strokeRect(Q[0]-6,Q[1]-6,12,12)}
  dynUI();selbarUI()}
// selection box: dragged left to right it is a window (blue, takes what is fully inside); right to left a crossing (green, dashed, takes whatever it touches)
function drawBox(){if(!selBox||!(selBox.moved||selBox.click))return;const[x0,y0]=selBox.a,[x1,y1]=selBox.b,cross=x1<x0,col=cross?'#16A34A':C.acc;ctx.save();ctx.fillStyle=col;ctx.globalAlpha=.08;ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.setLineDash(cross?[6,4]:[]);ctx.strokeRect(x0+.5,y0+.5,x1-x0,y1-y0);ctx.restore()}
function drawPreview(){const m=mouse||(ptype==='touch'&&dynFields()&&Object.keys(dynLock).length?[pts[0][0]+1,pts[0][1]]:null);if(!m)return;const q=()=>dynPt(snapPt||pathPt(m));
  if(tool==='wall'||tool==='line'){const o=DEF[tool],pv=tool==='wall'?(Pp=>drawWall({pts:Pp,th:o.th},C.acc,.35)):(Pp=>drawLine({pts:Pp,dash:o.dash,lw:o.lw},C.acc,.8));
    if(!pts.length){if(!snapPt){const Q=toS(q());ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(Q[0],Q[1],3.5,0,7);ctx.fill()}return}
    const b=q();
    if(o.shape==='straight'){pv([pts[0],b]);label(fmtLen(dist(pts[0],b)),pts[0],b,C.acc)}
    else if(o.shape==='arc'){if(pts.length===1){pv([pts[0],b]);label(fmtLen(dist(pts[0],b)),pts[0],b,C.acc)}else pv(arcPts(pts[0],pts[1],b))}
    else{pv(spline([...pts,b]));pts.forEach(p=>{const Q=toS(p);ctx.fillStyle=C.acc;ctx.fillRect(Q[0]-3,Q[1]-3,6,6)})}}
  else if(tool==='hatch'){const o=DEF.hatch;let Pp=null;
    if(o.mode==='room')Pp=roomAt(m);else if(o.mode==='rect'&&pts.length){const b=q();Pp=[pts[0],[b[0],pts[0][1]],b,[pts[0][0],b[1]]]}else if(o.mode==='poly'&&pts.length)Pp=[...pts,q()];
    if(Pp&&Pp.length>=2)drawHatch({poly:Pp,pat:o.pat,sp:o.sp,ang:o.ang},C.acc,C.acc,.8)}
  else if(tool==='cut'){const o=DEF.cut;
    if(o.mode==='points'&&cutA){const r=locate(cutA.e.pts,m),a=Math.min(cutA.s,r.s),b=Math.max(cutA.s,r.s);cutStroke(cutA.e,slice(cutA.e.pts,a,b));markX(pointAt(cutA.e.pts,cutA.s));markX(r.pt);return}
    const w=nearestPath(m);if(!w)return;const r=locate(w.pts,m),L=plen(w.pts);
    if(o.mode==='gap'){const a=Math.max(0,r.s-o.gw/2),b=Math.min(L,r.s+o.gw/2);cutStroke(w,slice(w.pts,a,b))}
    else if(o.mode==='trim'){const[a,b]=trimRange(w,r.s);cutStroke(w,slice(w.pts,a,b))}
    else markX(r.pt)}
  else if(tool==='text'&&ptype!=='touch')drawText({...DEF.text,c:q()},C.acc,.6);
  else if(tool==='shape'){const o=DEF.shape;if(!pts.length){if(!snapPt){const Q=toS(q());ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(Q[0],Q[1],3.5,0,7);ctx.fill()}return}
    const b=q(),sh=shapeFrom(pts[0],b,o),A=toS(pts[0]);ctx.fillStyle=C.acc;ctx.fillRect(A[0]-3,A[1]-3,6,6);if(!sh)return;const P=shapePts(sh);
    if(o.as==='wall')drawWall({pts:[...P,P[0]],th:o.th,closed:true},C.acc,.35);else drawShape(sh,C.acc,.85);
    if(o.kind==='circle'||o.kind==='poly'){ctx.save();ctx.strokeStyle=C.acc;ctx.setLineDash([4,4]);ctx.lineWidth=1;pathOf([pts[0],b]);ctx.stroke();ctx.restore()}
    const M=shapeMeasure(sh);badge([o.kind==='circle'?'قطر '+fmtLen(sh.w):o.kind==='poly'?'قطر '+fmtLen(sh.w)+'، '+fa(o.sides)+' ضلع':o.kind==='square'?'ضلع '+fmtLen(sh.w):fmtLen(sh.w)+' × '+fmtLen(sh.d),fmtArea(M.A)],sh.c)}
  else if(tool==='measure'&&DEF.measure.mode==='room'&&(!meas||meas.fin===true&&meas.mode!=='room')){const Pp=roomAt(m);if(Pp){ctx.save();pathOf(Pp);ctx.closePath();ctx.strokeStyle=C.acc;ctx.setLineDash([5,4]);ctx.lineWidth=1.3;ctx.stroke();ctx.restore()}}
  if(tool==='stairs'&&pts.length){const A=toS(pts[0]);ctx.fillStyle=C.acc;ctx.beginPath();ctx.arc(A[0],A[1],4.5,0,7);ctx.fill()}
  if(ghost)drawItem(ghost,C.acc,ghost.ok===false?.3:.85);
  if(tool==='stairs'&&pts.length&&ghost&&mouse){const G=stairGeo(ghost),Q=toS(mouse);badge([`${fmtLen(G.W)} × ${fmtLen(G.D)}`,`${fa(G.n)} پله، هر پله ${cm(G.R)} سانت`],toW(Q[0],Q[1]-44))}}

// ---------- measuring ----------
function measPts(){if(!meas)return[];const live=(!meas.fin&&mouse)?(snapPt||gridSnap(mouse)):null;return live&&meas.mode!=='room'?[...meas.pts,live]:meas.pts}
function angleOf(Pp){const[a,v,b]=Pp,t1=Math.atan2(a[1]-v[1],a[0]-v[0]),t2=Math.atan2(b[1]-v[1],b[0]-v[0]);let d=((t2-t1)%TAU+TAU)%TAU;const ccw=d<=Math.PI;return{deg:(ccw?d:TAU-d)*R2D,t1,ccw}}
function measInfo(){const m=meas,mode=m?m.mode:DEF.measure.mode,Pp=measPts();const blank={big:'—',small:hintFor('measure')};if(!m)return blank;
  if(mode==='dist'){if(Pp.length<2)return blank;const[a,b]=Pp;return{big:fmtLen(dist(a,b)),small:`افقی ${fmtLen(Math.abs(b[0]-a[0]))}، عمودی ${fmtLen(Math.abs(b[1]-a[1]))}، زاویه ${fa(angDeg(a,b))}°`}}
  if(mode==='path'){if(Pp.length<2)return blank;return{big:fmtLen(plen(Pp)),small:`${fa(Pp.length-1)} قطعه${m.fin?'':'، ادامه دهید یا «پایان»'}`}}
  if(mode==='area'||mode==='room'){if(Pp.length<3)return{big:'—',small:Pp.length?'دست‌کم سه نقطه لازم است.':blank.small};const xs=Pp.map(p=>p[0]),ys=Pp.map(p=>p[1]);return{big:fmtArea(area(Pp)),small:(mode==='room'?`${fmtLen(Math.max(...xs)-Math.min(...xs))} × ${fmtLen(Math.max(...ys)-Math.min(...ys))}، `:'')+`محیط ${fmtLen(plen([...Pp,Pp[0]]))}`}}
  if(mode==='angle'){if(Pp.length<3)return blank;const g=angleOf(Pp);return{big:fa(g.deg,1)+'°',small:`مکمل ${fa(180-g.deg,1)}°، متمم تا ۳۶۰: ${fa(360-g.deg,1)}°`}}
  if(mode==='dim'){if(Pp.length<2)return blank;return{big:fmtLen(dist(Pp[0],Pp[1])),small:Pp.length<3?'حالا جای خط اندازه را بزنید.':''}}
  return blank}
function drawMeasure(){if(tool!=='measure'||!meas)return;const Pp=measPts(),R=C.acc,mode=meas.mode;ctx.save();
  if(mode==='dist'&&Pp.length>=2){const[a,b]=Pp;if(Math.abs(b[0]-a[0])>1&&Math.abs(b[1]-a[1])>1){const A=toS(a),K=toS([b[0],a[1]]),B=toS(b);ctx.strokeStyle=R;ctx.globalAlpha=.4;ctx.setLineDash([4,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...K);ctx.lineTo(...B);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;label(fmtLen(Math.abs(b[0]-a[0])),a,[b[0],a[1]],R,-20,.75,500);label(fmtLen(Math.abs(b[1]-a[1])),[b[0],a[1]],b,R,-20,.75,500)}dimLine(a,b,R)}
  if(mode==='path'&&Pp.length>=2){pathOf(Pp);ctx.strokeStyle=R;ctx.lineWidth=2;ctx.stroke();for(let i=1;i<Pp.length;i++)if(dist(toS(Pp[i-1]),toS(Pp[i]))>60)label(fmtLen(dist(Pp[i-1],Pp[i])),Pp[i-1],Pp[i],R,5,.85,500);const e=toS(Pp[Pp.length-1]);badge(['جمع '+fmtLen(plen(Pp))],toW(e[0],e[1]-30))}
  if((mode==='area'||mode==='room')&&Pp.length>=2){pathOf(Pp);ctx.closePath();ctx.fillStyle=R;ctx.globalAlpha=.1;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=R;ctx.lineWidth=1.6;ctx.stroke();
    if(Pp.length>=3){if(mode==='room'){label(fmtLen(dist(Pp[0],Pp[1])),Pp[0],Pp[1],R,-22,1,600);label(fmtLen(dist(Pp[1],Pp[2])),Pp[1],Pp[2],R,-22,1,600)}badge([fmtArea(area(Pp)),'محیط '+fmtLen(plen([...Pp,Pp[0]]))],centroid(Pp))}}
  if(mode==='angle'&&Pp.length>=2){ctx.strokeStyle=R;ctx.lineWidth=1.8;pathOf(Pp.slice(0,3));ctx.stroke();if(Pp.length>=3){const g=angleOf(Pp),V=toS(Pp[1]),rr=34;ctx.beginPath();ctx.arc(V[0],V[1],rr,-g.t1,-(g.t1+(g.ccw?1:-1)*g.deg/R2D),g.ccw);ctx.stroke();const bi=g.t1+(g.ccw?1:-1)*g.deg/R2D/2;badge([fa(g.deg,1)+'°'],toW(V[0]+Math.cos(bi)*(rr+30),V[1]-Math.sin(bi)*(rr+30)))}}
  if(mode==='dim'&&Pp.length>=2){drawDim({a:Pp[0],b:Pp[1],off:Pp[2]?offOf(Pp[0],Pp[1],Pp[2]):0},R)}
  ctx.fillStyle=R;meas.pts.forEach(p=>{const Q=toS(p);ctx.fillRect(Q[0]-3.5,Q[1]-3.5,7,7)});ctx.restore()}
function liveReadout(){const b=$('[data-live-big]');if(!b)return;const inf=measInfo();b.textContent=inf.big;$('[data-live-small]').textContent=inf.small}

// ---------- snapping + picking ----------
const gridSnap=p=>opt.snap?[Math.round(p[0]/50)*50,Math.round(p[1]/50)*50]:p.slice();
function endpointSnap(p,skip){if(!opt.snap)return null;let best=null,bd=tolPx()/s;for(const e of ents())if(isPath(e)&&vis(e)&&e!==skip)for(const q of[e.pts[0],e.pts[e.pts.length-1]]){const d=dist(p,q);if(d<bd){bd=d;best=q}}return best?best.slice():null}
function pathPt(m){let p=gridSnap(m);const o=DEF[tool];if(pts.length&&o&&o.shape==='straight'){const a0=pts[0],dx=p[0]-a0[0],dy=p[1]-a0[1],a=Math.atan2(dy,dx),q=Math.round(a/H)*H;if(Math.abs(a-q)<.1){const L=Math.hypot(dx,dy);p=gridSnap([a0[0]+Math.round(Math.cos(q))*L,a0[1]+Math.round(Math.sin(q))*L])}}return p}
function nearestWall(p){let best=null,bd=1e12;for(const e of ents()){if(e.t!=='wall'||!vis(e))continue;const r=locate(e.pts,p),d=r.d-e.th/2;if(d<bd){bd=d;best=e}}return bd<tolPx()/s?best:null}
function nearestPath(p){let best=null,bd=1e12;for(const e of ents()){if(!isPath(e)||!vis(e)||locked.has(layOf(e)))continue;const d=locate(e.pts,p).d-(e.th||0)/2;if(d<bd){bd=d;best=e}}return bd<tolPx()/s?best:null}
function toLocal(e,p){const dx=p[0]-e.c[0],dy=p[1]-e.c[1],c=Math.cos(e.ang||0),sn=Math.sin(e.ang||0);return[dx*c+dy*sn,-dx*sn+dy*c]}
function hit(p){const tol=tolPx()/s*.6,ok=e=>vis(e)&&!locked.has(layOf(e));let pick=null;
  for(const e of ents()){if(!ok(e)||e.t!=='dim')continue;const[A,B]=dimPts(e);if(segD(p,A,B)<=tol*1.3)pick=e}if(pick)return pick;
  for(const e of ents()){if(!ok(e)||e.t!=='text')continue;const[l0,l1]=toLocal(e,p),w=textMetrics(e);if(Math.abs(l0)<=w/2+tol&&Math.abs(l1)<=e.size*(e.sub?1.1:.6)+tol)pick=e}if(pick)return pick;
  for(const e of ents()){if(!ok(e)||!e.c||e.t==='text'||e.t==='furn')continue;const[l0,l1]=toLocal(e,p),[w,d]=dims(e);if(Math.abs(l0)<=w/2+tol&&Math.abs(l1)<=d/2+tol)pick=e}if(pick)return pick;
  for(const e of ents()){if(!ok(e)||!isPath(e))continue;if(locate(e.pts,p).d<=(e.th||0)/2+tol)pick=e}if(pick)return pick;
  for(const e of ents()){if(!ok(e)||e.t!=='furn')continue;const[l0,l1]=toLocal(e,p);if(Math.abs(l0)<=e.w/2+tol&&Math.abs(l1)<=e.d/2+tol)pick=e}if(pick)return pick;
  for(const e of ents()){if(ok(e)&&e.t==='hatch'&&inPoly(p,e.poly))pick=e}return pick}
function roomAt(p){const dirs=[[1,0],[-1,0],[0,1],[0,-1]],h=[];for(const d of dirs){let best=1e12,th=0;for(const e of ents()){if(e.t!=='wall'||!vis(e))continue;for(let i=1;i<e.pts.length;i++){const t=rayInt(p,d,e.pts[i-1],e.pts[i]);if(t!=null&&t<best){best=t;th=e.th}}}if(best>1e11)return null;h.push(best-th/2)}
  if(h.some(v=>v<=0))return null;return[[p[0]-h[1],p[1]-h[3]],[p[0]+h[0],p[1]-h[3]],[p[0]+h[0],p[1]+h[2]],[p[0]-h[1],p[1]+h[2]]]}
function crossings(e){const A=e.pts,out=[];let acc=0;for(let i=1;i<A.length;i++){const L=dist(A[i-1],A[i]);for(const o of ents()){if(o===e||!isPath(o)||!vis(o))continue;const B=o.pts;for(let j=1;j<B.length;j++){const t=segInt(A[i-1],A[i],B[j-1],B[j]);if(t!=null)out.push(acc+t*L)}}acc+=L}return out}
function trimRange(e,sv){const L=plen(e.pts),v=[0,...crossings(e).filter(x=>x>1&&x<L-1).sort((a,b)=>a-b),L];for(let i=0;i<v.length-1;i++)if(sv>=v[i]&&sv<=v[i+1])return[v[i],v[i+1]];return[0,L]}
// ---------- grips: handles on the selected items, dragged to reshape them like AutoCAD ----------
// corners resize boxes (the opposite corner stays put); vertices move the corners of walls, lines and hatches; the two ends move a dimension
const BOXY=e=>!!e.c&&(e.t==='shape'||e.t==='furn'||e.t==='column'||e.t==='elevator');
const GMIN={column:100,elevator:800,furn:200};
function grips(e){if(isPath(e)){if(e.kind==='arc'||e.kind==='curve')return[];const n=e.pts.length;return e.pts.map((p,i)=>({p,id:'v'+i,i})).filter(g=>!(e.closed&&g.i===n-1))}
  if(e.t==='hatch')return e.poly.map((p,i)=>({p,id:'v'+i,i}));
  if(e.t==='dim')return[{p:e.a,id:'a',k:'a'},{p:e.b,id:'b',k:'b'}];
  if(BOXY(e)){const c=Math.cos(e.ang||0),sn=Math.sin(e.ang||0);const mid=Math.min(e.w,e.d)*s>=56;return[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]].filter(([sx,sy])=>mid||(sx&&sy)).map(([sx,sy])=>{const x=sx*e.w/2,y=sy*e.d/2;return{p:[e.c[0]+x*c-y*sn,e.c[1]+x*sn+y*c],id:sx+','+sy,sx,sy}})}
  return[]}
const gripSnap=e=>JSON.parse(JSON.stringify({pts:e.pts,poly:e.poly,a:e.a,b:e.b,c:e.c,w:e.w,d:e.d,ang:e.ang}));
function gripRestore(e,o){const c=JSON.parse(JSON.stringify(o));for(const k in c)if(c[k]!==undefined&&k!=='ang')e[k]=c[k]}
function gripSet(e,g,o,p){
  if(isPath(e)){e.pts[g.i]=p;if(e.closed&&g.i===0)e.pts[e.pts.length-1]=p.slice();return}
  if(e.t==='hatch'){e.poly[g.i]=p;return}if(e.t==='dim'){e[g.k]=p;return}
  // a side grip (sx or sy is 0) changes one dimension only
  const L=toLocal(o,p),Ox=-g.sx*o.w/2,Oy=-g.sy*o.d/2,mn=GMIN[e.t]||50;let w=g.sx?Math.max(mn,g.sx*(L[0]-Ox)):o.w,d=g.sy?Math.max(mn,g.sy*(L[1]-Oy)):o.d;
  if(e.t==='shape'&&['square','circle','poly'].includes(e.kind))w=d=g.sx&&g.sy?Math.max(w,d):g.sx?w:d;
  w=Math.round(w/10)*10;d=Math.round(d/10)*10;const cx=g.sx?Ox+g.sx*w/2:0,cy=g.sy?Oy+g.sy*d/2:0,c=Math.cos(o.ang||0),sn=Math.sin(o.ang||0);
  e.w=w;e.d=d;e.c=[o.c[0]+cx*c-cy*sn,o.c[1]+cx*sn+cy*c]}
function gripAt(x,y){if(tool!=='select'||!selSet.size||selSet.size>200)return null;const tol=ptype==='touch'?16:8;let best=null,bd=tol;
  for(const e of selSet){if(!vis(e)||locked.has(layOf(e)))continue;for(const g of grips(e)){const Q=toS(g.p),dd=Math.max(Math.abs(Q[0]-x),Math.abs(Q[1]-y));if(dd<=bd){bd=dd;best={e,g}}}}return best}
function drawGrips(){if(tool!=='select'||!selSet.size||selSet.size>200)return;const hot=gripDrag||gripHot;ctx.save();
  for(const e of selSet){if(!vis(e))continue;for(const g of grips(e)){const Q=toS(g.p),h=hot&&hot.e===e&&hot.g.id===g.id;const r=h?4.5:3.5;ctx.fillStyle=h?C.acc:C.bg;ctx.strokeStyle=C.acc;ctx.lineWidth=1.3;ctx.fillRect(Q[0]-r,Q[1]-r,2*r,2*r);ctx.strokeRect(Q[0]-r+.5,Q[1]-r+.5,2*r-1,2*r-1)}}
  ctx.restore();if(!gripDrag||!gripDrag.moved)return;const{e,g}=gripDrag;
  if(isPath(e)||e.t==='hatch'){const P=e.pts||e.poly,n=P.length,cl=e.closed||e.t==='hatch';[[g.i-1,g.i],[g.i,g.i+1]].forEach(([a,b])=>{if(cl){a=(a+n)%n;b=(b+n)%n}if(a<0||b>=n||a===b)return;if(dist(toS(P[a]),toS(P[b]))>40)label(fmtLen(dist(P[a],P[b])),P[a],P[b],C.acc,e.th?e.th*s/2+4:7)})}
  else if(e.t==='dim')label(fmtLen(dist(e.a,e.b)),e.a,e.b,C.acc);
  else{const Q=toS(e.c);badge([e.t==='shape'&&e.kind==='circle'?'قطر '+fmtLen(e.w):fmtLen(e.w)+' × '+fmtLen(e.d)],toW(Q[0],Q[1]))}}

// outline of an entity in world units, for box selection: [points, closed]
function outline(e){if(isPath(e))return[e.pts,!!e.closed];if(e.t==='hatch')return[e.poly,true];if(e.t==='shape')return[shapePts(e),true];if(e.t==='dim'){const[A,B]=dimPts(e);return[[e.a,A,B,e.b],false]}
  let w,d;if(e.t==='text'){w=textMetrics(e);d=e.size*(e.sub?2.2:1.2)}else[w,d]=dims(e);const c=Math.cos(e.ang||0),sn=Math.sin(e.ang||0),T=([x,y])=>[e.c[0]+x*c-y*sn,e.c[1]+x*sn+y*c];
  return[[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(T),true]}
function inBox(e,x0,y0,x1,y1,cross){const[P,cl]=outline(e);if(!P||!P.length)return false;const inR=p=>p[0]>=x0&&p[0]<=x1&&p[1]>=y0&&p[1]<=y1;
  if(!cross)return P.every(inR);if(P.some(inR))return true;const R=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],n=P.length;
  for(let i=0;i<(cl?n:n-1);i++)for(let j=0;j<4;j++)if(segInt(P[i],P[(i+1)%n],R[j],R[(j+1)%4])!=null)return true;
  return!!e.c&&e.t!=='shape'&&inPoly([(x0+x1)/2,(y0+y1)/2],P)}
function boxSelect(b){const[x0,y1]=toW(Math.min(b.a[0],b.b[0]),Math.min(b.a[1],b.b[1])),[x1,y0]=toW(Math.max(b.a[0],b.b[0]),Math.max(b.a[1],b.b[1])),cross=b.b[0]<b.a[0];
  const found=new Set(ents().filter(e=>vis(e)&&!locked.has(layOf(e))&&inBox(e,x0,y0,x1,y1,cross)));
  setSel(b.shift?[...selSet].filter(e=>!found.has(e)):[...selSet,...found]);refresh();draw()}

// ---------- typed dimensions while drawing (like AutoCAD's dynamic input): type a number, Tab to the next field, Enter to place ----------
const UF=()=>({m:1000,cm:10,mm:1})[opt.unit],UN=()=>({m:'متر',cm:'سانت',mm:'میلی'})[opt.unit];
function dynFields(){if(!pts.length)return null;const o=DEF[tool]||{};
  if((tool==='wall'||tool==='line')&&(o.shape==='straight'||(o.shape==='arc'&&pts.length===1)))return[['len','طول'],['ang','زاویه']];
  if(tool==='shape')return o.kind==='rect'||o.kind==='ellipse'?[['w','عرض'],['d','طول']]:[['w',o.kind==='square'?'ضلع':'قطر']];
  if(tool==='hatch'&&o.mode==='rect')return[['w','عرض'],['d','طول']];
  return null}
// the point the mouse stands for once the typed values are applied; the mouse still picks the direction
function dynPt(b){const F=dynFields();if(!F)return b;const a=pts[0],dx=b[0]-a[0],dy=b[1]-a[1],k=dynLock;
  if(F[0][0]==='len'){const L=k.len??Math.hypot(dx,dy),A=k.ang!=null?k.ang/R2D:Math.atan2(dy,dx);return[a[0]+L*Math.cos(A),a[1]+L*Math.sin(A)]}
  const sx=dx<0?-1:1,sy=dy<0?-1:1;if(F.length===2)return[a[0]+sx*(k.w??Math.abs(dx)),a[1]+sy*(k.d??Math.abs(dy))];
  if(k.w==null)return b;if(DEF.shape.kind==='square')return[a[0]+sx*k.w,a[1]+sy*k.w];const A=Math.atan2(dy,dx);return[a[0]+k.w/2*Math.cos(A),a[1]+k.w/2*Math.sin(A)]}
function dynLive(c){const a=pts[0],dx=c[0]-a[0],dy=c[1]-a[1],r=Math.hypot(dx,dy),k=DEF.shape.kind;
  return{len:r,ang:(Math.atan2(dy,dx)*R2D+360)%360,w:tool!=='shape'||k==='rect'||k==='ellipse'?Math.abs(dx):k==='square'?Math.max(Math.abs(dx),Math.abs(dy)):2*r,d:Math.abs(dy)}}
const faN=(n,d)=>Number(n).toLocaleString('fa-IR',{maximumFractionDigits:d,useGrouping:false});
const dynFmt=(k,v)=>k==='ang'?faN(v,1):faN(v/UF(),{m:3,cm:1,mm:0}[opt.unit]);
let dynSig='';
function dynUI(){const bx=$('[data-dyn]');if(!bx)return;const F=dynFields(),foc=bx.contains(document.activeElement);
  const tch=ptype==='touch';bx.classList.toggle('tch',tch);if(!F||(!mouse&&!foc&&!tch)){if(foc)document.activeElement.blur();bx.hidden=true;return}
  const sig=tool+F.map(f=>f[0]+f[1]).join()+opt.unit;
  if(sig!==dynSig){dynSig=sig;bx.innerHTML='';F.forEach(([k,l])=>{const r=el('label','dyf'),inp=el('input');inp.dataset.k=k;inp.inputMode='decimal';inp.dir='ltr';inp.autocomplete='off';inp.spellcheck=false;inp.setAttribute('aria-label',l);
    inp.oninput=()=>{const cp=inp.selectionStart,fv=inp.value.replace(/[0-9]/g,c=>'۰۱۲۳۴۵۶۷۸۹'[c]).replace(/\./g,'٫');if(fv!==inp.value){inp.value=fv;inp.setSelectionRange(cp,cp)}const v=parseFloat(toEn(inp.value));if(!inp.value.trim()||isNaN(v))delete dynLock[k];else dynLock[k]=k==='ang'?v:v*UF();r.classList.toggle('on',k in dynLock);draw()};
    inp.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Enter'){ev.preventDefault();dynCommit()}
      else if(ev.key==='Tab'){ev.preventDefault();const all=$$('[data-dyn] input'),nx=all[(all.indexOf(inp)+(ev.shiftKey?all.length-1:1))%all.length];nx.focus();nx.select()}
      else if(ev.key==='Escape'){ev.preventDefault();inp.blur();esc()}};
    r.append(el('span','',l),inp,el('i','',k==='ang'?'°':UN()));bx.append(r)})}
  const a=pts[0],live=dynLive(dynPt(mouse?snapPt||pathPt(mouse):a));
  $$('[data-dyn] input').forEach(inp=>{const k=inp.dataset.k;inp.parentNode.classList.toggle('on',k in dynLock);if(inp!==document.activeElement&&!(k in dynLock))inp.value=dynFmt(k,live[k])});
  bx.hidden=false;const Q=toS(mouse||a);bx.style.left=Math.min(Q[0]+22,W-bx.offsetWidth-8)+'px';bx.style.top=Math.min(Q[1]+22,Hh-bx.offsetHeight-8)+'px'}
// called when a digit or Tab is pressed while drawing: jump into the first field that is not set yet
function dynFocus(ch){dynUI();const all=$$('[data-dyn] input');if(!all.length)return;const inp=all.find(i=>!(i.dataset.k in dynLock))||all[0];inp.focus();if(ch){inp.value=ch;inp.oninput()}else inp.select()}
function dynCommit(){if(!dynFields())return;const a=pts[0],p=dynPt(mouse?snapPt||pathPt(mouse):[a[0]+1,a[1]]);
  if(dist(a,p)<10){flash('اندازه را وارد کنید.');return}if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();act(p,true)}

const PLACE=['elevator','car','column','furn'];
function updateGhost(){ghost=null;if(!mouse)return;
  if(tool==='door'||tool==='window'){const w=nearestWall(mouse),o=DEF[tool];if(!w){ghost={t:tool,...o,c:gridSnap(mouse),ang:0,th:150,side:1,ok:false};return}
    const r=locate(w.pts,mouse),a=w.pts[r.i],b=w.pts[r.i+1],L=dist(a,b),pr=proj(mouse,a,b),half=o.w/2/L;let t=Math.max(half,Math.min(1-half,pr.t));if(opt.snap&&w.pts.length===2)t=Math.round(t*L/50)*50/L;
    const cr=(b[0]-a[0])*(mouse[1]-a[1])-(b[1]-a[1])*(mouse[0]-a[0]);ghost={t:tool,...o,c:[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],ang:Math.atan2(b[1]-a[1],b[0]-a[0]),th:w.th,side:cr>0?-1:1,ok:true};return}
  if(tool==='stairs'){const o=DEF.stairs;if(!pts.length){ghost=stairAt(gridSnap(mouse),o.ang);return}const a=pts[0],m=gridSnap(mouse);let ang=o.ang;
    if(dist(a,m)*s>14){const st=Math.PI/12;ang=Math.round((Math.atan2(m[1]-a[1],m[0]-a[0])-H)/st)*st;ang=((ang%TAU)+TAU)%TAU}ghost=stairAt(a,ang);return}
  if(PLACE.includes(tool))ghost={t:tool,...DEF[tool],c:gridSnap(mouse)}}

// ---------- history ----------
function commit(doFn,undoFn){doFn();hist().undo.push({doFn,undoFn});hist().redo=[];computeJoins();markDirty()}
function addMany(list){const L=ents();commit(()=>list.forEach(e=>L.push(e)),()=>list.forEach(e=>{const i=L.indexOf(e);if(i>=0)L.splice(i,1);unpick(e)}));refresh()}
const addEnt=e=>addMany([e]);
function delMany(list){const L=ents(),idx=list.map(e=>L.indexOf(e));commit(()=>list.forEach(e=>{const j=L.indexOf(e);if(j>=0)L.splice(j,1);unpick(e)}),()=>list.map((e,k)=>[e,idx[k]]).sort((a,b)=>a[1]-b[1]).forEach(([e,i])=>L.splice(Math.min(i,L.length),0,e)));refresh()}
const delEnt=e=>delMany([e]);
function replaceEnt(e,parts){const L=ents(),i=L.indexOf(e);commit(()=>{const j=L.indexOf(e);if(j>=0)L.splice(j,1,...parts);unpick(e)},()=>{const j=L.indexOf(parts[0]);if(parts.length&&j>=0)L.splice(j,parts.length,e);else L.splice(i,0,e)});refresh()}
function setProps(e,patch){const old={};for(const k in patch)old[k]=e[k];commit(()=>Object.assign(e,patch),()=>Object.assign(e,old))}
function undo(){const a=hist().undo.pop();if(!a)return;a.undoFn();hist().redo.push(a);computeJoins();refresh();draw();markDirty()}
function redo(){const a=hist().redo.pop();if(!a)return;a.doFn();hist().undo.push(a);computeJoins();refresh();draw();markDirty()}
const geomOf=e=>JSON.parse(JSON.stringify({c:e.c,pts:e.pts,poly:e.poly,a:e.a,b:e.b}));
const mv=(p,d)=>[p[0]+d[0],p[1]+d[1]];
function setGeom(e,g,d){if(g.c)e.c=mv(g.c,d);if(g.pts)e.pts=g.pts.map(p=>mv(p,d));if(g.poly)e.poly=g.poly.map(p=>mv(p,d));if(g.a){e.a=mv(g.a,d);e.b=mv(g.b,d)}}
function duplicate(list){const cp=[].concat(list).map(e=>{const c=JSON.parse(JSON.stringify(e));delete c.join;setGeom(c,geomOf(c),[600,-600]);return c});addMany(cp);setSel(cp);refresh();draw()}
function cutWall(e,a,b){const L=plen(e.pts);if(b-a<1)return;const parts=[];if(a>1)parts.push({...e,pts:slice(e.pts,0,a)});if(b<L-1)parts.push({...e,pts:slice(e.pts,b,L)});parts.forEach(p=>delete p.join);replaceEnt(e,parts)}
function autoDims(){const Ws=ents().filter(e=>e.t==='wall'&&vis(e));if(!Ws.length){flash('دیواری پیدا نشد.');return}let x0=1e12,y0=1e12,x1=-1e12,y1=-1e12;Ws.forEach(e=>e.pts.forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])}));
  const g=Math.max(900,Math.max(x1-x0,y1-y0)*.07),uniq=a=>[...new Set(a.map(v=>Math.round(v/10)*10))].sort((p,q)=>p-q),out=[{t:'dim',a:[x0,y0],b:[x1,y0],off:-g*1.8},{t:'dim',a:[x0,y0],b:[x0,y1],off:g*1.8}];
  const ex=[],ey=[];Ws.forEach(e=>[e.pts[0],e.pts[e.pts.length-1]].forEach(p=>{if(Math.abs(p[1]-y0)<5)ex.push(p[0]);if(Math.abs(p[0]-x0)<5)ey.push(p[1])}));
  const cx=uniq(ex),cy=uniq(ey);if(cx.length>2)for(let i=1;i<cx.length;i++)out.push({t:'dim',a:[cx[i-1],y0],b:[cx[i],y0],off:-g});if(cy.length>2)for(let i=1;i<cy.length;i++)out.push({t:'dim',a:[x0,cy[i-1]],b:[x0,cy[i]],off:g});
  addMany(out);flash(`${fa(out.length)} اندازه اضافه شد.`);draw()}

// ---------- copy and paste (Ctrl C, Ctrl X, Ctrl V): pasted items land around the pointer, or the middle of the screen ----------
let clip=null;
function copySel(cut){if(!selSet.size)return;const L=[...selSet];clip=L.map(e=>{const c=JSON.parse(JSON.stringify(e));delete c.join;return c});if(cut){delMany(L);draw()}flash(fa(clip.length)+(cut?' المان برداشته شد.':' المان کپی شد.'));refresh()}
function paste(){if(!clip)return;const cp=clip.map(e=>JSON.parse(JSON.stringify(e)));let x0=1e12,y0=1e12,x1=-1e12,y1=-1e12;cp.forEach(e=>outline(e)[0].forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}));
  const at=mouse&&ptype!=='touch'?mouse:toW(W/2,Hh/2),d=gridSnap([at[0]-(x0+x1)/2,at[1]-(y0+y1)/2]);cp.forEach(e=>setGeom(e,geomOf(e),d));addMany(cp);if(tool!=='select')setTool('select');setSel(cp);refresh();draw()}

// ---------- actions ----------
function finishable(){const o=DEF[tool]||{};if(tool==='wall'||tool==='line')return pts.length>0&&(o.shape==='straight'||(o.shape==='curve'&&pts.length>=2));if(tool==='hatch')return o.mode==='poly'&&pts.length>=3;if(tool==='measure')return!!meas&&!meas.fin&&((meas.mode==='path'&&meas.pts.length>=2)||(meas.mode==='area'&&meas.pts.length>=3));return false}
function drafting(){return pts.length>0||!!cutA||(tool==='measure'&&!!meas&&!meas.fin&&meas.pts.length>0)}
function finishDraft(){const o=DEF[tool];
  if((tool==='wall'||tool==='line')&&o.shape==='curve'&&pts.length>=2)addEnt(tool==='wall'?{t:'wall',pts:spline(pts),th:o.th,h:o.h,kind:'curve'}:{t:'line',pts:spline(pts),dash:o.dash,lw:o.lw,kind:'curve'});
  if(tool==='hatch'&&o.mode==='poly'&&pts.length>=3)addEnt({t:'hatch',poly:pts.map(p=>p.slice()),pat:o.pat,sp:o.sp,ang:o.ang});
  if(tool==='measure'&&meas&&!meas.fin){if(finishable())meas.fin=true;else meas=null}
  pts=[];chainStart=null;cutA=null;dynLock={};refresh();draw()}
function act(p,exact){
  if(tool==='select'){setSel([hit(p)]);refresh();draw();return}
  const q=exact?p.slice():dynPt(snapPt?snapPt.slice():pathPt(p)),o=DEF[tool];dynLock={};
  if(tool==='wall'||tool==='line'){const mk=Pp=>tool==='wall'?{t:'wall',pts:Pp,th:o.th,h:o.h,kind:o.shape}:{t:'line',pts:Pp,dash:o.dash,lw:o.lw,kind:o.shape};
    if(o.shape==='straight'){if(!pts.length){pts=[q];chainStart=q}else{if(dist(pts[0],q)<10)return;addEnt(mk([pts[0],q]));if(chainStart&&dist(q,chainStart)<1){pts=[];chainStart=null}else pts=[q]}}
    else if(o.shape==='arc'){if(pts.length<2){if(pts.length&&dist(pts[0],q)<10)return;pts.push(q)}else{addEnt(mk(arcPts(pts[0],pts[1],q)));pts=[]}}
    else{if(pts.length&&dist(pts[pts.length-1],q)<10)return;pts.push(q)}
    refresh();draw();return}
  if(tool==='door'||tool==='window'){mouse=p;updateGhost();if(ghost&&ghost.ok){const g={...ghost};delete g.ok;addEnt(g)}else flash('روی یک دیوار کلیک کنید.');draw();return}
  if(PLACE.includes(tool)){addEnt({t:tool,...o,c:gridSnap(p)});draw();return}
  if(tool==='stairs'){if(!pts.length){pts=[gridSnap(p)];mouse=p;updateGhost();refresh();draw();return}mouse=p;updateGhost();const g={...ghost};delete g.ok;DEF.stairs.ang=g.ang;pts=[];addEnt(g);updateGhost();draw();return}
  if(tool==='shape'){if(!pts.length){pts=[q];refresh();draw();return}const sh=shapeFrom(pts[0],q,o);if(!sh)return;pts=[];
    if(o.as==='wall'){const P=shapePts(sh);addEnt({t:'wall',pts:[...P,P[0].slice()],th:o.th,h:3000,closed:true,kind:'shape'})}else addEnt(sh);draw();return}
  if(tool==='text'){addEnt({t:'text',...o,c:gridSnap(p)});draw();return}
  if(tool==='measure'){const mode=DEF.measure.mode;
    if(mode==='room'){const Pp=roomAt(p);if(Pp)meas={mode,pts:Pp,fin:true};else flash('این‌جا اتاق بسته‌ای پیدا نشد.');refresh();draw();return}
    if(!meas||meas.fin||meas.mode!==mode)meas={mode,pts:[],fin:false};
    if(mode==='area'&&meas.pts.length>=3&&dist(q,meas.pts[0])<tolPx()/s){meas.fin=true;refresh();draw();return}
    meas.pts.push(q);
    if(mode==='dist'&&meas.pts.length===2)meas.fin=true;
    if(mode==='angle'&&meas.pts.length===3)meas.fin=true;
    if(mode==='dim'&&meas.pts.length===3){const[a,b,c]=meas.pts;meas=null;if(dist(a,b)>10){addEnt({t:'dim',a,b,off:Math.round(offOf(a,b,c)/50)*50});flash('اندازه روی نقشه ثبت شد.')}}
    refresh();draw();return}
  if(tool==='hatch'){if(o.mode==='room'){const Pp=roomAt(p);if(Pp)addEnt({t:'hatch',poly:Pp,pat:o.pat,sp:o.sp,ang:o.ang});else flash('این‌جا اتاق بسته‌ای پیدا نشد.')}
    else if(o.mode==='rect'){if(!pts.length)pts=[q];else{const a=pts[0];if(Math.abs(q[0]-a[0])>10&&Math.abs(q[1]-a[1])>10)addEnt({t:'hatch',poly:[a,[q[0],a[1]],q,[a[0],q[1]]],pat:o.pat,sp:o.sp,ang:o.ang});pts=[]}}
    else{if(pts.length>=3&&dist(q,pts[0])<tolPx()/s){finishDraft();return}pts.push(q)}refresh();draw();return}
  if(tool==='cut'){
    if(o.mode==='points'){if(!cutA){const w=nearestPath(p);if(!w){flash('روی یک دیوار یا خط بزنید.');return}cutA={e:w,s:locate(w.pts,p).s}}else{const b=locate(cutA.e.pts,p).s;cutWall(cutA.e,Math.min(cutA.s,b),Math.max(cutA.s,b));cutA=null}refresh();draw();return}
    const w=nearestPath(p);if(!w){flash('روی یک دیوار یا خط بزنید.');return}const r=locate(w.pts,p),L=plen(w.pts);
    if(o.mode==='gap')cutWall(w,Math.max(0,r.s-o.gw/2),Math.min(L,r.s+o.gw/2));else{const[a,b]=trimRange(w,r.s);cutWall(w,a,b)}draw()}}
let toastT=0;function flash(m){const t=$('[data-toast]');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2200)}

// ---------- live preview inside each card: shows the click order and highlights the setting under the pointer ----------
let pvKey=null,pvCur=null;
function withView(g,w,h,sc,x0,y0,fn){const sv=[ctx,s,ox,oy,W,Hh];ctx=g;s=sc;ox=x0;oy=y0;W=w;Hh=h;try{fn()}finally{[ctx,s,ox,oy,W,Hh]=sv}}
function drawEnt(e,col){({wall:drawWall,line:drawLine,shape:drawShape,text:drawText,dim:drawDim})[e.t]?({wall:drawWall,line:drawLine,shape:drawShape,text:drawText,dim:drawDim})[e.t](e,col):e.t==='hatch'?drawHatch(e,col,null):drawItem(e,e.t==='furn'?C.furn:col)}
const PVT=['wall','line','shape','door','window','elevator','stairs','car','column','furn','text','hatch','cut'];
function pvScene(type,o){const E=[],D=[],N=[],Dm_=(k,a,b,off)=>D.push({k,a,b,off});
  if(type==='wall'||type==='line'){const sh=o.shape||o.kind||'straight';let P,K;
    if(sh==='arc'){K=[[0,0],[5000,0],[2500,1600]];P=arcPts(...K)}else if(sh==='curve'){K=[[0,0],[1500,1400],[3200,300],[5000,1500]];P=spline(K)}else{K=[[0,0],[4200,0],[4200,2600]];P=K}
    if(o.pts&&o.pts.length>1){P=o.pts;K=[]}
    E.push(type==='wall'?{t:'wall',pts:P,th:o.th}:{t:'line',pts:P,dash:o.dash,lw:o.lw});K.forEach((p,i)=>N.push([p,i+1]));
    if(type==='wall'&&!o.pts)Dm_('th',[1400,-o.th/2],[1400,o.th/2],0)}
  else if(type==='shape'){const k=o.kind,two=k==='rect'||k==='ellipse',e={t:'shape',kind:k,c:[0,0],w:o.w||(two?4000:3000),d:o.d||(two?2600:3000),ang:0,sides:o.sides,lw:o.lw||2,dash:o.dash||'solid',fill:o.fill};
    if(o.as==='wall'&&!o.c){const P=shapePts(e);E.push({t:'wall',pts:[...P,P[0]],th:o.th,closed:true})}else E.push(e);const w=e.w,d=e.d;
    if(k==='circle'||k==='poly'){N.push([[0,0],1],[k==='poly'?[0,d/2]:[w/2,0],2]);Dm_('w',[-w/2,-d/2],[w/2,-d/2],-500)}else{N.push([[-w/2,-d/2],1],[[w/2,d/2],2]);Dm_('w',[-w/2,-d/2],[w/2,-d/2],-500);if(k!=='square')Dm_('d',[w/2,-d/2],[w/2,d/2],-500)}}
  else if(type==='door'||type==='window'){const w=o.w,th=type==='door'?200:250;E.push({t:'wall',pts:[[-w/2-800,0],[w/2+800,0]],th},{t:type,...o,c:[0,0],ang:0,th,side:o.side||1});
    if(type==='door'&&o.leaves===2){Dm_('w1',[-w/2,0],[-w/2+o.w1,0],-650);Dm_('w2',[-w/2+o.w1,0],[w/2,0],-650)}else Dm_('w',[-w/2,0],[w/2,0],-650)}
  else if(type==='cut'){E.push({t:'wall',pts:[[0,0],[5000,0]],th:200});if(o.mode==='trim'){E.push({t:'wall',pts:[[1400,-900],[1400,900]],th:200},{t:'wall',pts:[[3800,-900],[3800,900]],th:200})}
    return{E,D,N,cut:o.mode==='gap'?[2500-o.gw/2,2500+o.gw/2]:o.mode==='points'?[1500,3700]:[1500,3700],pts:o.mode==='points'?[[[1500,0],1],[[3700,0],2]]:o.mode==='trim'?[[[2600,0],1]]:[[[2500,0],1]],gw:o.mode==='gap'?o.gw:0}}
  else if(type==='text'){const e={t:'text',...o,c:[0,0],ang:0};E.push(e);const tw=Math.max(1,(o.str||' ').length)*o.size*.5;Dm_('size',[tw/2+250,-o.size/2],[tw/2+250,o.size/2],0)}
  else if(type==='hatch'){const P=Rect(-1800,-1200,1800,1200);E.push({t:'hatch',poly:P,pat:o.pat,sp:o.sp,ang:o.ang},{t:'line',pts:[...P,P[0]],dash:'solid',lw:1});if(o.pat!=='solid'){const a=o.ang||0,n=[-Math.sin(a),Math.cos(a)];Dm_('sp',[n[0]*o.sp,n[1]*o.sp],[n[0]*o.sp*2,n[1]*o.sp*2],0)}}
  else{const e={t:type,...o,c:[0,0],ang:0};E.push(e);const[w,d]=dims(e);
    if(type==='stairs'){const G=stairGeo(e);Dm_('w',[-w/2,-d/2],[w/2,-d/2],-450);Dm_('n',[w/2,-d/2],[w/2,d/2],-450);const l=G.L.filter(l=>l[3][1]===-1);if(l.length>1&&o.kind!=='spiral'){const m=x=>[(x[0][0]+x[1][0])/2,-(x[0][1]+x[1][1])/2];Dm_('tread',m(l[0]),m(l[1]),0)}
      if(o.kind==='u'){const P=G.O[0],x=Math.min(...P.map(p=>p[0]));Dm_('ld',[x,-P[0][1]],[x,-P[3][1]],-450)}}
    else if(type==='elevator'){Dm_('dw',[-o.dw/2,-d/2],[o.dw/2,-d/2],-300);Dm_('w',[-w/2,-d/2],[w/2,-d/2],-900);Dm_('d',[w/2,-d/2],[w/2,d/2],-400)}
    else if(type==='car'){Dm_(o.layout==='pairc'||o.layout==='row3c'?'clear':'n',[-w/2,-d/2],[w/2,-d/2],-500);Dm_('_L',[w/2,-d/2],[w/2,d/2],-500)}
    else{Dm_('w',[-w/2,-d/2],[w/2,-d/2],-450);Dm_('d',[w/2,-d/2],[w/2,d/2],-450)}}
  return{E,D,N}}
const PVCAP={wall:{straight:'به ترتیب نقطه‌های ۱، ۲ و ۳ را بزنید',arc:'۱ شروع، ۲ پایان، ۳ نقطه‌ای که قوس از آن می‌گذرد',curve:'نقاط ۱ تا ۴ را بزنید، بعد «پایان»'},shape:{rect:'گوشه‌ی ۱ و بعد گوشه‌ی مقابل ۲',square:'گوشه‌ی ۱ و بعد گوشه‌ی مقابل ۲',ellipse:'دو گوشه‌ی کادر: ۱ و ۲',circle:'مرکز ۱، بعد نقطه‌ی ۲ روی محیط',poly:'مرکز ۱، بعد جای رأس ۲'},cut:{gap:'روی دیوار در نقطه‌ی ۱ بزنید',points:'شروع ۱ و پایان ۲ برش',trim:'تکه‌ی بین دو تقاطع را بزنید'}};
function pvCaption(type,o){if(pvKey){const f=(FIELDS[type]||[]).find(f=>f.k===pvKey&&(!f.when||f.when(o)));if(f){if(f.type==='num'){const v=getV(o,f);return`<b>${f.l}</b>: ${fa(v,Number.isInteger(v)?0:1,false)} ${f.u==='cm'?'سانت':f.u}`}const op=(f.opts||[]).find(x=>x[1]===o[f.k]);return`<b>${f.l}</b>: ${op?op[0]:''}`}}
  const c=PVCAP[type];if(c)return typeof c==='string'?c:(c[type==='cut'?o.mode:type==='shape'?o.kind:(o.shape||o.kind||'straight')]||'');if(type==='line')return PVCAP.wall[o.shape||o.kind||'straight']||'';
  if(type==='stairs')return'فلش جهت بالا رفتن است؛ نقطه جای اولین پله';return'نشانگر را روی هر تنظیم ببرید تا این‌جا مشخص شود'}
function pvEl(type,o){const box=el('div','pv'),cv=document.createElement('canvas'),cap=el('small','');box.append(cv,cap);pvCur={cv,type,o,cap};requestAnimationFrame(pvRender);return box}
function pvRender(){if(!pvCur||!pvCur.cv.isConnected)return;const{cv,type,o,cap}=pvCur,w=cv.clientWidth||270,h=cv.clientHeight||130,dp=Math.min(3,devicePixelRatio||1);cv.width=w*dp;cv.height=h*dp;const g=cv.getContext('2d');g.setTransform(dp,0,0,dp,0,0);
  cap.innerHTML=pvCaption(type,o);const S=pvScene(type,o);let x0=1e12,y0=1e12,x1=-1e12,y1=-1e12;const ad=p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])};
  S.E.forEach(e=>{(e.pts||e.poly||[]).forEach(ad);if(e.c){const[a,b]=e.t==='text'?[(e.str||' ').length*e.size*.5,e.size]:dims(e);ad([-a/2,-b/2]);ad([a/2,b/2]);if(['furn','car'].includes(e.t)){ad([-a/2-400,-b/2-400]);ad([a/2+400,b/2+400])}}});
  const pad=Math.max(x1-x0,y1-y0)*.18+300;x0-=pad;y0-=pad;x1+=pad;y1+=pad;const sc=Math.min(w/(x1-x0),h/(y1-y0)),X=w/2-(x0+x1)/2*sc,Y=h/2+(y0+y1)/2*sc;
  withView(g,w,h,sc,X,Y,()=>{g.fillStyle=C.bg;g.fillRect(0,0,w,h);S.E.forEach(e=>drawEnt(e,C.ink));
    if(S.cut){const wl=S.E[0];cutStroke(wl,slice(wl.pts,S.cut[0],S.cut[1]));if(S.gw)S.D.push({k:'gw',a:[S.cut[0],0],b:[S.cut[1],0],off:-550})}
    S.D.forEach(d=>drawDim({a:d.a,b:d.b,off:d.off},d.k===pvKey?C.acc:C.mute));
    (S.pts||S.N).forEach(([p,n])=>{const Q=toS(p);g.fillStyle=C.acc;g.beginPath();g.arc(Q[0],Q[1],8,0,TAU);g.fill();g.fillStyle='#fff';g.font=`700 10.5px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(fa(n),Q[0],Q[1]+.5)})})}
