// ---------- pointer: mouse + touch (pinch to zoom, one finger to pan) ----------
const ptrs=new Map();let pinch=null;
const pos=ev=>{const r=canvas.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top]};
function hover(x,y){mouse=toW(x,y);snapPt=['wall','line','measure','hatch','shape'].includes(tool)?endpointSnap(mouse):null;updateGhost();if(tool==='measure'&&meas&&!meas.fin)liveReadout();if(tool==='select'&&ptype!=='touch'){const h=hit(mouse);canvas.style.cursor=h?(h===sel?'move':'pointer'):'default'}}
canvas.addEventListener('pointerdown',ev=>{const[x,y]=pos(ev);ptype=ev.pointerType;canvas.setPointerCapture(ev.pointerId);ptrs.set(ev.pointerId,[x,y]);
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,m:[(a[0]+b[0])/2,(a[1]+b[1])/2],s,ox,oy};if(moving){setGeom(moving.e,moving.g,[0,0]);moving=null}drag=null;return}
  if(ptrs.size>2)return;
  const p=toW(x,y);
  if(ev.button===1||ev.button===2){ev.preventDefault();drag={x,y,ox,oy,moved:false};return}
  if(ev.button!==0)return;
  if(tool==='select'){const h=hit(p);if(h&&(h===sel||ptype!=='touch')){if(h!==sel){sel=h;rOpen=true;refresh()}moving={e:h,g:geomOf(h),start:p,moved:false};draw();return}}
  if(ptype==='touch'){drag={x,y,ox,oy,moved:false,tap:true};return}
  if(tool==='select'){drag={x,y,ox,oy,moved:false,deselect:true};return}
  hover(x,y);act(p)});
canvas.addEventListener('pointermove',ev=>{const[x,y]=pos(ev);if(ptrs.has(ev.pointerId))ptrs.set(ev.pointerId,[x,y]);
  if(pinch&&ptrs.size>=2){const[a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),m=[(a[0]+b[0])/2,(a[1]+b[1])/2];s=Math.max(.004,Math.min(5,pinch.s*d/pinch.d));const w=[(pinch.m[0]-pinch.ox)/pinch.s,(pinch.oy-pinch.m[1])/pinch.s];ox=m[0]-w[0]*s;oy=m[1]+w[1]*s;draw();return}
  if(moving){const p=toW(x,y);let d=[p[0]-moving.start[0],p[1]-moving.start[1]];if(!moving.moved&&Math.hypot(d[0],d[1])*s<4)return;moving.moved=true;if(opt.snap)d=d.map(v=>Math.round(v/50)*50);setGeom(moving.e,moving.g,d);if(moving.e.t==='wall')computeJoins();draw();return}
  if(drag){if(Math.hypot(x-drag.x,y-drag.y)>(drag.tap?8:3))drag.moved=true;if(drag.moved){ox=drag.ox+x-drag.x;oy=drag.oy+y-drag.y;canvas.style.cursor='grabbing';draw()}return}
  hover(x,y);draw()});
function up(ev){const[x,y]=pos(ev);ptrs.delete(ev.pointerId);
  if(pinch){if(ptrs.size<2)pinch=null;drag=null;return}
  if(moving){const m=moving;moving=null;if(m.moved){const fin=geomOf(m.e);commit(()=>setGeom(m.e,fin,[0,0]),()=>setGeom(m.e,m.g,[0,0]));refresh()}draw();return}
  if(drag){const d=drag;drag=null;canvas.style.cursor=tool==='select'?'default':'crosshair';
    if(d.tap&&!d.moved){const p=toW(x,y),now=Date.now();mouse=p;snapPt=['wall','line','measure','hatch','shape'].includes(tool)?endpointSnap(p):null;
      if(now-lastTap<320&&drafting()){lastTap=0;finishDraft();return}lastTap=now;if(mob()&&rOpen&&tool!=='select')rOpen=false;act(p);if(ptype==='touch'){mouse=null;ghost=null;draw()}}
    else if(d.deselect&&!d.moved){sel=null;refresh();draw()}}}
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',ev=>{ptrs.delete(ev.pointerId);pinch=null;drag=null;if(moving){setGeom(moving.e,moving.g,[0,0]);moving=null;draw()}});
canvas.addEventListener('dblclick',()=>{if(drafting())finishDraft()});
canvas.addEventListener('pointerleave',ev=>{if(!drag&&!moving&&ev.pointerType==='mouse'){mouse=null;ghost=null;snapPt=null;draw()}});
canvas.addEventListener('contextmenu',ev=>ev.preventDefault());
canvas.addEventListener('wheel',ev=>{ev.preventDefault();const[x,y]=pos(ev);zoomAt(x,y,Math.exp(-ev.deltaY*.0015))},{passive:false});
let lastW=0;new ResizeObserver(()=>{const r=cvEl.getBoundingClientRect();if(!r.width)return;const crossed=lastW&&((lastW<760)!==(r.width<760));W=r.width;Hh=r.height;lastW=W;const d=devicePixelRatio||1;canvas.width=Math.round(W*d);canvas.height=Math.round(Hh*d);mainCtx.setTransform(d,0,0,d,0,0);
  if(!fitted){if(!mob())lPane='file';fit();fitted=true;refresh()}else if(crossed){if(mob()){lPane=null;rOpen=false}fit();refresh()}else refresh();draw()}).observe(cvEl);

document.addEventListener('keydown',ev=>{if(ev.target.matches('input,textarea,select'))return;
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyZ'){ev.preventDefault();ev.shiftKey?redo():undo();return}
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyY'){ev.preventDefault();redo();return}
  if((ev.ctrlKey||ev.metaKey)&&ev.code==='KeyD'){ev.preventDefault();if(sel)duplicate(sel);return}
  if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
  const map={KeyV:'select',KeyW:'wall',KeyL:'line',KeyD:'door',KeyN:'window',KeyE:'elevator',KeyS:'stairs',KeyP:'car',KeyO:'column',KeyI:'furn',KeyX:'cut',KeyH:'hatch',KeyT:'text',KeyM:'measure',KeyC:'shape'};
  if(map[ev.code]){setTool(map[ev.code]);ev.preventDefault();return}
  if(ev.code==='KeyR'){if(sel&&tool==='select'&&sel.c&&sel.t!=='door'&&sel.t!=='window')apply(sel.t,sel,{ang:((sel.ang||0)+H)%TAU});else if(DEF[tool]&&'ang'in DEF[tool])apply(tool,null,{ang:((DEF[tool].ang||0)+H)%TAU});ev.preventDefault();return}
  if(ev.code==='KeyF'){if(sel&&sel.t==='door')apply('door',sel,{flip:!sel.flip});else if(tool==='door')apply('door',null,{flip:!DEF.door.flip});return}
  if(ev.key==='Enter'){if(drafting())finishDraft();return}
  if(ev.key==='Escape'){esc();return}
  if((ev.key==='Delete'||ev.key==='Backspace')&&sel){delEnt(sel);draw();ev.preventDefault()}});

loadPrefs();readColors();toolsInit();computeJoins();bootStorage();
if(document.fonts&&document.fonts.load)Promise.all([document.fonts.load(`500 12px Vazirmatn`),document.fonts.load(`700 12px Vazirmatn`),document.fonts.load(`800 12px Vazirmatn`)]).then(()=>{draw();refresh()}).catch(()=>{});
