// ---------- pointer: mouse + touch (two fingers pan and zoom; with the select tool one finger works like the mouse, in drawing tools it pans) ----------
const ptrs=new Map();let pinch=null;
const pos=ev=>{const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top]};
function hover(x,y){mouse=toW(x,y);snapPt=['wall','line','measure','hatch','shape'].includes(tool)?endpointSnap(mouse):null;updateGhost();if(tool==='measure'&&meas&&!meas.fin)liveReadout();if(tool==='select'&&ptype!=='touch'){const gp=gripAt(x,y),was=gripHot;gripHot=gp;if(gp){canvas.style.cursor='crosshair';return}if(was)draw();const h=hit(mouse);canvas.style.cursor=h?(picked(h)?'move':'pointer'):'default'}}
function unmove(){if(gripDrag){gripRestore(gripDrag.e,gripDrag.o);gripDrag=null;computeJoins()}if(moving){moving.L.forEach((e,i)=>setGeom(e,moving.G[i],[0,0]));moving=null}}
canvas.addEventListener('pointerdown',ev=>{const[x,y]=pos(ev);ptype=ev.pointerType;canvas.setPointerCapture(ev.pointerId);ptrs.set(ev.pointerId,[x,y]);
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,m:[(a[0]+b[0])/2,(a[1]+b[1])/2],s,ox,oy};unmove();selBox=null;drag=null;return}
  if(ptrs.size>2)return;
  const p=toW(x,y);
  if(ev.button===1||ev.button===2){ev.preventDefault();drag={x,y,ox,oy,moved:false};return}
  if(ev.button!==0)return;
  if(tool==='select'){
    const gp=gripAt(x,y);if(gp){gripDrag={...gp,o:gripSnap(gp.e),moved:false};draw();return}
    const h=hit(p);
    if(h&&ev.shiftKey){picked(h)?unpick(h):setSel([...selSet,h]);refresh();draw();return}
    // dragging a selected item moves the whole selection
    if(h&&picked(h)){const L=[...selSet];moving={L,G:L.map(geomOf),start:p,moved:false,tap:h};draw();return}
    // anywhere else a drag draws a selection box, even when it starts on an item; a plain click adds that item (like AutoCAD) or, on empty space, clears the selection
    selBox={a:[x,y],b:[x,y],shift:ev.shiftKey,moved:false,pick:h};return}
  if(ptype==='touch'){drag={x,y,ox,oy,moved:false,tap:true};return}
  // trim with the mouse: a click removes one piece, a drag removes every piece the line passes over
  if(tool==='cut'&&DEF.cut.mode==='trim'){fence={a:p,b:p,x,y,moved:false};return}
  hover(x,y);act(p)});
canvas.addEventListener('pointermove',ev=>{const[x,y]=pos(ev);if(ptrs.has(ev.pointerId))ptrs.set(ev.pointerId,[x,y]);
  if(pinch&&ptrs.size>=2){const[a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),m=[(a[0]+b[0])/2,(a[1]+b[1])/2];s=Math.max(.004,Math.min(5,pinch.s*d/pinch.d));const w=[(pinch.m[0]-pinch.ox)/pinch.s,(pinch.oy-pinch.m[1])/pinch.s];ox=m[0]-w[0]*s;oy=m[1]+w[1]*s;draw();return}
  if(gripDrag){const gd=gripDrag;let p=toW(x,y);if(!gd.moved&&Math.hypot(...[0,1].map(i=>toS(gd.g.p)[i]-[x,y][i]))<3)return;gd.moved=true;p=(!BOXY(gd.e)&&endpointSnap(p,gd.e))||gridSnap(p);gripSet(gd.e,gd.g,gd.o,p);if(gd.e.t==='wall')computeJoins();draw();return}
  if(moving){const p=toW(x,y);let d=[p[0]-moving.start[0],p[1]-moving.start[1]];if(!moving.moved&&Math.hypot(d[0],d[1])*s<(ptype==='touch'?10:4))return;moving.moved=true;if(opt.snap)d=d.map(v=>Math.round(v/50)*50);moving.L.forEach((e,i)=>setGeom(e,moving.G[i],d));if(moving.L.some(e=>e.t==='wall'))computeJoins();draw();return}
  if(fence){fence.b=toW(x,y);mouse=fence.b;if(Math.hypot(x-fence.x,y-fence.y)>4)fence.moved=true;draw();return}
  if(selBox){selBox.b=[x,y];if(Math.hypot(x-selBox.a[0],y-selBox.a[1])>(ptype==='touch'?10:4))selBox.moved=true;draw();return}
  if(drag){if(Math.hypot(x-drag.x,y-drag.y)>(drag.tap?8:3))drag.moved=true;if(drag.moved){ox=drag.ox+x-drag.x;oy=drag.oy+y-drag.y;canvas.style.cursor='grabbing';draw()}return}
  hover(x,y);draw()});
function up(ev){const[x,y]=pos(ev);ptrs.delete(ev.pointerId);
  if(pinch){if(ptrs.size<2)pinch=null;drag=null;return}
  if(gripDrag){const g=gripDrag;gripDrag=null;if(g.moved){const fin=gripSnap(g.e);commit(()=>gripRestore(g.e,fin),()=>gripRestore(g.e,g.o));refresh()}draw();return}
  if(moving){const m=moving;moving=null;if(m.moved){const F=m.L.map(geomOf);commit(()=>m.L.forEach((e,i)=>setGeom(e,F[i],[0,0])),()=>m.L.forEach((e,i)=>setGeom(e,m.G[i],[0,0])));refresh()}else tapItem(m.tap);draw();return}
  if(fence){const f=fence;fence=null;if(f.moved)fenceTrim(f.a,toW(x,y));else{hover(x,y);act(f.a)}draw();return}
  if(selBox){const b=selBox;selBox=null;if(b.moved){b.b=[x,y];boxSelect(b)}else if(b.pick){setSel([...selSet,b.pick]);tapItem(b.pick);refresh()}else if(!b.shift){setSel([]);refresh()}draw();return}
  if(drag){const d=drag;drag=null;canvas.style.cursor=tool==='select'?'default':'crosshair';
    if(d.tap&&!d.moved){const p=toW(x,y),now=Date.now();mouse=p;snapPt=['wall','line','measure','hatch','shape'].includes(tool)?endpointSnap(p):null;
      if(now-lastTap<320&&drafting()){lastTap=0;finishDraft();return}lastTap=now;if(mob()&&rOpen&&tool!=='select')rOpen=false;act(p);if(ptype==='touch'){mouse=null;ghost=null;draw()}}}}
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',ev=>{ptrs.delete(ev.pointerId);pinch=null;drag=null;fence=null;if(moving||selBox||gripDrag){unmove();selBox=null;draw()}});
canvas.addEventListener('dblclick',()=>{if(drafting())finishDraft()});
// a second click (or tap) on the same item opens its edit card; it no longer opens on its own
let tapE=null,tapT=0;function tapItem(e){const now=Date.now();if(e&&e===tapE&&now-tapT<400){rOpen=true;if(mob())lPane=null;refresh();tapE=null;return}tapE=e;tapT=now}
canvas.addEventListener('pointerleave',ev=>{if(!drag&&!moving&&!selBox&&!gripDrag&&!fence&&ev.pointerType==='mouse'){gripHot=null;mouse=null;ghost=null;snapPt=null;draw()}});
canvas.addEventListener('contextmenu',ev=>ev.preventDefault());
canvas.addEventListener('wheel',ev=>{ev.preventDefault();const[x,y]=pos(ev);zoomAt(x,y,Math.exp(-ev.deltaY*.0015))},{passive:false});
let lastW=0;new ResizeObserver(()=>{const r=cvEl.getBoundingClientRect();if(!r.width)return;const crossed=lastW&&((lastW<760)!==(r.width<760));W=r.width;Hh=r.height;lastW=W;const d=devicePixelRatio||1;canvas.width=Math.round(W*d);canvas.height=Math.round(Hh*d);mainCtx.setTransform(d,0,0,d,0,0);
  if(!fitted){if(!mob())lPane='file';fit();fitted=true;refresh()}else if(crossed){if(mob()){lPane=null;rOpen=false}fit();refresh()}else refresh();draw()}).observe(cvEl);

document.addEventListener('keydown',ev=>{if(ev.target.matches('input,textarea,select'))return;
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyZ'){ev.preventDefault();ev.shiftKey?redo():undo();return}
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyY'){ev.preventDefault();redo();return}
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyD'){ev.preventDefault();if(selSet.size)duplicate([...selSet]);return}
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyA'){ev.preventDefault();if(tool!=='select')setTool('select');setSel(ents().filter(e=>vis(e)&&!locked.has(layOf(e))));refresh();draw();return}
  if((ev.ctrlKey||ev.metaKey)&&(ev.code==='KeyC'||ev.code==='KeyX')){if(selSet.size){ev.preventDefault();copySel(ev.code==='KeyX')}return}
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyV'){if(clip){ev.preventDefault();paste()}return}
  if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
  // while drawing, typing a number (or Tab) opens the size fields next to the cursor
  if(dynFields()&&(/^[0-9۰-۹٠-٩.٫]$/.test(ev.key)||ev.key==='Tab')){ev.preventDefault();dynFocus(ev.key==='Tab'?'':ev.key);return}
  const map={KeyV:'select',KeyW:'wall',KeyL:'line',KeyD:'door',KeyN:'window',KeyE:'elevator',KeyS:'stairs',KeyP:'car',KeyO:'column',KeyI:'furn',KeyX:'cut',KeyH:'hatch',KeyT:'text',KeyM:'measure',KeyC:'shape'};
  if(map[ev.code]){setTool(map[ev.code]);ev.preventDefault();return}
  if(ev.code==='KeyR'){if(sel&&tool==='select'&&sel.c&&sel.t!=='door'&&sel.t!=='window')apply(sel.t,sel,{ang:((sel.ang||0)+H)%TAU});else if(DEF[tool]&&'ang'in DEF[tool])apply(tool,null,{ang:((DEF[tool].ang||0)+H)%TAU});ev.preventDefault();return}
  if(ev.code==='KeyF'){if(sel&&sel.t==='door')apply('door',sel,{flip:!sel.flip});else if(tool==='door')apply('door',null,{flip:!DEF.door.flip});return}
  if(ev.key==='Enter'){if(drafting())finishDraft();return}
  if(ev.key==='Escape'){esc();return}
  if((ev.key==='Delete'||ev.key==='Backspace')&&selSet.size){delMany([...selSet]);draw();ev.preventDefault()}});

loadPrefs();readColors();toolsInit();computeJoins();bootStorage();
if(document.fonts&&document.fonts.load)Promise.all([document.fonts.load(`500 12px Vazirmatn`),document.fonts.load(`700 12px Vazirmatn`),document.fonts.load(`800 12px Vazirmatn`)]).then(()=>{draw();refresh()}).catch(()=>{});
