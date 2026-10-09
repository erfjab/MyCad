// ---------- anchored cards ----------
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
function place(pop,btn,side){if(!btn)return;const A=app.getBoundingClientRect(),B=btn.getBoundingClientRect(),bar=btn.closest('.bar').getBoundingClientRect(),arw=pop.querySelector('.arw');
  if(mob()){pop.style.top=pop.style.left=pop.style.right='';arw.style.top='';const bx=B.left-A.left+B.width/2-pop.offsetLeft;arw.hidden=bx<12||bx>pop.offsetWidth-12;arw.style.left=(bx-6)+'px';return}
  arw.hidden=false;arw.style.left='';const ph=pop.offsetHeight,by=B.top-A.top+B.height/2,top=Math.max(10,Math.min(A.height-ph-10,by-26));pop.style.top=top+'px';arw.style.top=Math.max(12,Math.min(ph-24,by-top-6))+'px';
  if(side==='r'){pop.style.right=(A.right-bar.left+12)+'px';pop.style.left='auto'}else{pop.style.left=(bar.right-A.left+12)+'px';pop.style.right='auto'}}
function head(pin,icon,title,sub,onClose){pin=pin.parentNode.querySelector('.ph');const h=el('div','dh',`<span class="di">${svg(icon)}</span><div><b>${title}</b><small>${sub}</small></div>`),x=el('button','x',svg('close'));x.title='بستن';x.setAttribute('aria-label','بستن');x.onclick=onClose;h.append(x);pin.append(h);return pin}
const getV=(o,f)=>f.k==='ang'?Math.round(((o.ang||0)*R2D%360+360)%360):f.u==='cm'?Math.round(o[f.k])/10:o[f.k];
function numField(f,o,onSet){const box=el('div','num'),pl=el('button','','+'),mi=el('button','','−'),inp=el('input');inp.type='text';inp.inputMode='decimal';const v=getV(o,f);inp.value=fa(v,Number.isInteger(v)?0:1,false);inp.setAttribute('aria-label',f.l);pl.setAttribute('aria-label','بیشتر');mi.setAttribute('aria-label','کمتر');
  const st=f.u==='cm'?f.step/10:f.step,lo=f.u==='cm'?f.min/10:f.min,hi=f.u==='cm'?f.max/10:f.max;
  const set=x=>{x=+x;if(isNaN(x))return;x=Math.max(lo,Math.min(hi,x));onSet(f.k==='ang'?x/R2D:f.u==='cm'?Math.round(x*10):Math.round(x))};
  pl.onclick=()=>set(getV(o,f)+st);mi.onclick=()=>set(getV(o,f)-st);inp.onchange=()=>set(toEn(inp.value));inp.onkeydown=ev=>{if(ev.key==='Enter')inp.blur()};
  box.append(pl,inp);if(f.u)box.append(el('i','',f.u==='cm'?'سانت':f.u));box.append(mi);return box}
function ddEl(opts,val,onPick,label){const w=el('div','dd'),cur=opts.find(o=>o[1]===val),b=el('button','ddb',`<span>${cur?cur[0]:'—'}</span>`+svg('chev'));b.setAttribute('aria-label',label);b.setAttribute('aria-haspopup','listbox');const L=el('div','ddl');L.hidden=true;L.setAttribute('role','listbox');
  opts.forEach(([l,v])=>{const it=el('button',v===val?'on':'',`<span>${l}</span>`+svg('check'));it.setAttribute('role','option');it.onclick=ev=>{ev.stopPropagation();L.hidden=true;w.classList.remove('open');if(v!==val)onPick(v)};L.append(it)});
  b.onclick=ev=>{ev.stopPropagation();const o=L.hidden;$$('.ddl').forEach(x=>{x.hidden=true;x.parentNode.classList.remove('open')});L.hidden=!o;w.classList.toggle('open',o);if(o)L.scrollIntoView({block:'nearest'})};w.append(b,L);return w}
app.addEventListener('click',()=>{$$('.ddl').forEach(x=>{if(!x.hidden){x.hidden=true;x.parentNode.classList.remove('open')}});requestAnimationFrame(()=>$$('.pop').forEach(fades))});
function rightUI(){const pop=$('[data-rpop]'),pin=pop.querySelector('.pin');
  const target=tool==='select'?sel:null,type=target?target.t:(tool!=='select'?tool:null),anchor=type?(type==='dim'?'measure':type):null;
  const ga=anchor?gOf(anchor):-1;$$('[data-tools] .ib').forEach(b=>{const g=+b.dataset.group;b.classList.toggle('on',g===gOf(tool));b.classList.toggle('open',g===ga&&gOf(tool)!==ga);b.classList.toggle('po',rOpen&&g===ga)});
  pillUI();
  if(!type||!rOpen){pop.classList.add('shut');return}
  const key=type+(target?'s':'t'),keep=pop.dataset.key===key?pin.scrollTop:0;pop.dataset.key=key;
  pin.innerHTML='';pop.querySelector('.ph').innerHTML='';const isSel=!!target,o=isSel?target:DEF[type];
  const title=type==='furn'?FURN[o.kind].n:type==='dim'?'اندازه':TOOLS[type][0];
  head(pin,type==='dim'?'dim':type,title,isSel?'انتخاب‌شده، ویرایش همین المان':type==='measure'?'فاصله، مساحت، زاویه و اندازه‌گذاری':'تنظیمات المان بعدی',()=>{rOpen=false;rightUI();if(!mob())draw()});
  const grp=GROUPS[gOf(type)];if(!isSel&&grp.length>1){const tb=el('div','tabs');grp.forEach(k=>{const b=el('button',k===type?'on':'',svg(k)+`<span>${TOOLS[k][0]}</span>`);b.onclick=()=>setTool(k);tb.append(b)});pop.querySelector('.ph').append(tb)}
  if(type==='measure')measureUI(pin);else editUI(pin,type,o,isSel,target);
  pop.classList.remove('shut');pin.scrollTop=keep;place(pop,$(`[data-group="${ga}"]`),'r');fades(pop)}
function fades(pop){const pin=pop.querySelector('.pin'),h=pop.querySelector('.ph');pop.style.setProperty('--hh',(h?h.offsetHeight+1:0)+'px');pop.classList.toggle('mt',pin.scrollTop>4);pop.classList.toggle('mb',pin.scrollTop+pin.clientHeight<pin.scrollHeight-4)}
$$('.pop .pin').forEach(p=>p.addEventListener('scroll',()=>fades(p.parentNode),{passive:true}));
function editUI(pin,type,o,isSel,target){const tgt=isSel?target:null;
  if(type==='furn'){const sc=el('div','ds');sc.append(el('p','eb','دسته'));sc.append(ddEl(Object.entries(CATS).map(([k,v])=>[v,k]),furnCat,c=>{furnCat=c;rightUI()},'دسته‌ی المان‌ها'));
    const lib=el('div','lib');for(const k in FURN){if(FURN[k].cat!==furnCat)continue;const b=el('button',o.kind===k?'on':'');b.append(thumb(k));b.append(el('span','',FURN[k].n));b.title=FURN[k].n;b.onclick=()=>apply('furn',tgt,{kind:k});lib.append(b)}sc.append(lib);pin.append(sc);
    const it=FURN[o.kind];if(it.sizes){const sz=el('div','ds');sz.append(el('p','eb','اندازه‌های رایج'));const ch=el('div','chips');it.sizes.forEach(([w,d])=>{const c=el('button','chip'+(o.w===w&&o.d===d?' on':''),`${cm(w)} × ${cm(d)}`);c.onclick=()=>apply('furn',tgt,{w,d});ch.append(c)});sz.append(ch);pin.append(sz)}}
  if(PVT.includes(type)){const sv=el('div','ds');sv.append(pvEl(type,o));if(type==='furn')pin.append(sv);else pin.prepend(sv)}
  const pres=PRESETS[type]||[],pi=pres.findIndex(p=>Object.keys(p).every(k=>k==='nm'||o[k]===p[k]));
  if(pres.length){const sp=el('div','ds');sp.append(el('p','eb',type==='car'?'قالب‌های آماده (طبق ضوابط)':'قالب‌های آماده'));const g=el('div','presets');pres.forEach((p,i)=>{const b=el('button','pre'+(i===pi?' on':''),`<b>${p.nm}</b><span>${PSPEC[type](p)}</span>`);b.onclick=()=>{const patch={...p};delete patch.nm;apply(type,tgt,patch)};g.append(b)});sp.append(g);pin.append(sp)}
  const sc=el('div','ds');sc.append(el('p','eb',`${type==='text'?'متن':type==='cut'?'برش':type==='dim'?'خط اندازه':'تنظیم دستی'}${pi<0&&pres.length?'<span class="cu">● سفارشی</span>':''}`));const fs=el('div','fields');
  FIELDS[type].forEach(f=>{if((f.sel&&!isSel)||(f.tool&&isSel)||(f.when&&!f.when(o)))return;const wide=f.type==='text'||(f.type==='seg'&&f.opts.length>2);const row=el('div','f'+(wide?' wide':''));row.append(el('label','',f.l));
    const hl=k=>()=>{if(pvKey!==k){pvKey=k;pvRender()}};row.onmouseenter=hl(f.k);row.onmouseleave=hl(null);row.addEventListener('focusin',hl(f.k));
    if(f.type==='dd'){row.className='f wide';row.append(ddEl(f.opts,o[f.k],v=>apply(type,tgt,{[f.k]:v}),f.l))}
    else if(f.type==='seg'){const sg=el('div','seg'+(f.opts.length>3?' wrap':''));if(f.opts.length===4)sg.style.gridTemplateColumns='repeat(4,1fr)';f.opts.forEach(([lab,v])=>{const b=el('button',o[f.k]===v?'on':'',lab);b.onclick=()=>{apply(type,tgt,{[f.k]:v});if(!isSel&&['shape','mode','kind','as'].includes(f.k)){pts=[];cutA=null;pillUI()}};sg.append(b)});row.append(sg)}
    else if(f.type==='text'){const bx=el('div','txtbox'),inp=el('input','txt');inp.id=`f-${type}-${f.k}`;inp.value=o[f.k]||'';inp.setAttribute('aria-label',f.l);let before=o[f.k]||'';
      inp.oninput=()=>{o[f.k]=inp.value;draw()};inp.onchange=()=>{if(isSel&&before!==inp.value){const nv=inp.value,ov=before,k=f.k;commit(()=>target[k]=nv,()=>target[k]=ov);before=nv}};
      bx.append(inp);row.append(bx);fs.append(row);if(f.k==='str'){const ch=el('div','chips');ROOMS.forEach(r=>{const c=el('button','chip',r);c.onclick=()=>apply(type,tgt,{str:r});ch.append(c)});fs.append(ch)}return}
    else row.append(numField(f,o,v=>apply(type,tgt,{[f.k]:v})));
    fs.append(row)});
  sc.append(fs);const dv=derived(type,o,isSel);if(dv)sc.append(el('p','derived',dv));
  if(type==='stairs'){const b=el('button','btn',svg('check')+'تنظیم راحت از روی ارتفاع طبقه');b.onclick=()=>apply('stairs',tgt,autoStairs(o));const r=el('div','acts');r.append(b);sc.append(r)}
  pin.append(sc);
  const sa=el('div','ds');
  if(isSel){const acts=el('div','acts');const Bt=(ic,lab,fn,cls)=>{const b=el('button','btn'+(cls?' '+cls:''),svg(ic)+lab);b.onclick=fn;acts.append(b)};
    if(type==='door')Bt('flip','برعکس',()=>apply(type,target,{flip:!target.flip}));
    if(target.c&&type!=='door'&&type!=='window')Bt('rotate','چرخش',()=>apply(type,target,{ang:((target.ang||0)+H)%TAU}));
    Bt('copy','تکثیر',()=>duplicate(target));Bt('trash','حذف',()=>{delEnt(target);draw()},'del');sa.append(acts);sa.append(el('p','hint','برای جابه‌جایی، آن را روی نقشه بکشید.'))}
  else sa.append(el('p','hint',hintFor(type)));
  pin.append(sa)}
function measureUI(pin){const o=DEF.measure,s1=el('div','ds');s1.append(el('p','eb','نوع اندازه‌گیری'));s1.append(ddEl(MMODES.map(([v,l])=>[l,v]),o.mode,v=>{o.mode=v;meas=null;refresh();draw()},'نوع اندازه‌گیری'));s1.append(mexEl(o.mode));pin.append(s1);
  const inf=measInfo(),s2=el('div','ds');s2.append(el('div','readout',inf.big));s2.lastChild.dataset.liveBig='';const sm=el('p','derived',inf.small);sm.dataset.liveSmall='';s2.append(sm);
  const acts=el('div','acts');
  if(meas&&meas.fin&&meas.mode==='dist'){const b=el('button','btn pri',svg('dim')+'ثبت روی نقشه');b.onclick=()=>{const[a,c]=meas.pts;meas=null;addEnt({t:'dim',a,b:c,off:0});flash('اندازه روی نقشه ثبت شد.');draw()};acts.append(b)}
  if(meas&&meas.fin&&(meas.mode==='room'||meas.mode==='area')){const b=el('button','btn pri',svg('text')+'برچسب مساحت');b.onclick=()=>{const Pp=meas.pts,t={t:'text',c:gridSnap(centroid(Pp)),str:'اتاق',sub:fmtAreaFixed(area(Pp)),size:320,bold:1,ang:0};meas=null;addEnt(t);tool='select';sel=t;rOpen=true;refresh();draw();};acts.append(b)}
  if(meas&&(meas.fin||meas.pts.length)){const b=el('button','btn','پاک کردن');b.onclick=()=>{meas=null;refresh();draw()};acts.append(b)}
  if(acts.children.length)s2.append(acts);pin.append(s2);
  const s3=el('div','ds');s3.append(el('p','eb','نمایش و واحد'));const sw=(k,lab)=>{const r=el('div','opt',`<span>${lab}</span>`),b=el('button','sw'+(opt[k]?' on':''));b.setAttribute('aria-label',lab);b.onclick=()=>{opt[k]=!opt[k];refresh();draw()};r.append(b);return r};
  s3.append(sw('wallDims','طول همه‌ی دیوارها روی نقشه'));s3.append(unitSeg());
  const ac=el('div','acts'),ad=el('button','btn',svg('dim')+'اندازه‌گذاری خودکار');ad.onclick=autoDims;ac.append(ad);const nd=ents().filter(e=>e.t==='dim');if(nd.length){const cl=el('button','btn del',svg('trash')+`حذف اندازه‌ها (${fa(nd.length)})`);cl.onclick=()=>{delMany(ents().filter(e=>e.t==='dim'));draw()};ac.append(cl)}s3.append(ac);pin.append(s3)}
const MEX={
  dist:['<circle cx="40" cy="60" r="3.5" class="r"/><circle cx="220" cy="25" r="3.5" class="r"/><path d="M40 60L220 25" class="rl"/><path d="M40 60H220V25" class="rd"/><text x="128" y="34" class="tx">۴٫۷۰ م</text>','فاصله‌ی مستقیم بین دو نقطه، با فاصله‌ی افقی و عمودی'],
  path:['<path d="M30 65L80 25L150 55L230 20" class="rl"/><circle cx="30" cy="65" r="3.5" class="r"/><circle cx="80" cy="25" r="3.5" class="r"/><circle cx="150" cy="55" r="3.5" class="r"/><circle cx="230" cy="20" r="3.5" class="r"/><text x="200" y="62" class="tx">جمع ۹٫۸۰ م</text>','جمع طول یک مسیر شکسته، مثل لوله‌کشی یا مسیر حرکت'],
  area:['<path d="M40 70L60 15L170 10L225 50L150 75Z" class="ra"/><text x="135" y="47" class="tx">۲۳٫۵ م²</text>','مساحت و محیط هر محدوده‌ی دلخواه'],
  room:['<rect x="30" y="8" width="200" height="68" class="wl"/><rect x="38" y="16" width="184" height="52" class="ra"/><text x="130" y="47" class="tx">۱۴٫۴ م²</text>','یک کلیک داخل اتاق، مساحت و ابعادش را می‌دهد'],
  angle:['<path d="M60 70L230 70M60 70L170 12" class="rl"/><path d="M100 70A40 40 0 0 0 95.5 51.5" class="rl"/><text x="130" y="60" class="tx">۲۸°</text>','زاویه‌ی بین دو امتداد، با رأس در وسط'],
  dim:['<rect x="40" y="45" width="180" height="30" class="wl"/><path d="M40 42V18M220 42V18M34 24H226" class="rl"/><path d="M36 28l8-8M216 28l8-8" class="rl"/><text x="130" y="16" class="tx">۶٫۰۰ م</text>','خط اندازه‌ی دائمی روی نقشه، مثل نقشه‌های معماری']};
function mexEl(m){const[g,cap]=MEX[m],w=el('div','mex',`<svg viewBox="0 0 260 84" aria-hidden="true"><style>.r{fill:var(--acc)}.rl{fill:none;stroke:var(--acc);stroke-width:2}.rd{fill:none;stroke:var(--acc);stroke-width:1;stroke-dasharray:4 3;opacity:.5}.ra{fill:var(--accsoft);stroke:var(--acc);stroke-width:2}.wl{fill:none;stroke:var(--ink);stroke-width:5}.tx{fill:var(--ink);font:700 13px Vazirmatn,Tahoma,sans-serif;text-anchor:middle;direction:rtl}</style>${g}</svg><small>${cap}</small>`);return w}
function unitSeg(){const r=el('div','f'),sg=el('div','seg');r.append(el('label','','واحد اندازه'));[['متر','m'],['سانت','cm'],['میلی','mm']].forEach(([l,v])=>{const b=el('button',opt.unit===v?'on':'',l);b.onclick=()=>{opt.unit=v;refresh();draw()};sg.append(b)});r.append(sg);return r}
function derived(t,o,isSel){
  if(t==='wall'&&isSel)return`طول <b>${fmtLen(plen(o.pts))}</b>${o.kind&&o.kind!=='straight'?'، '+(o.kind==='arc'?'قوس':'منحنی'):''}`;
  if(t==='line'&&isSel)return`طول <b>${fmtLen(plen(o.pts))}</b>`;
  if(t==='hatch'&&isSel)return`مساحت <b>${fmtArea(area(o.poly))}</b>، محیط ${fmtLen(plen([...o.poly,o.poly[0]]))}`;
  if(t==='dim')return isSel?`طول <b>${fmtLen(dist(o.a,o.b))}</b>`:'';
  if(t==='door'&&o.leaves===2)return`عرض کل بازشو <b>${cm(o.w1+o.w2)} سانت</b> (${cm(o.w1)} + ${cm(o.w2)})`;
  if(t==='stairs'){const G=stairGeo(o),sp=o.kind==='spiral',T=sp?G.sp:o.tread,bl=2*G.R+T,ok=bl>=600&&bl<=650,steep=G.R>(sp?210:185);
    return`ابعاد کل <b>${fmtLen(G.W)} × ${fmtLen(G.D)}</b><br>ارتفاع هر پله <b>${cm(G.R)} سانت</b>${sp?`، کف روی خط حرکت ${cm(T)} سانت`:''}<br>قاعده‌ی گام (دو ارتفاع + کف): ${cm(bl)} سانت <span class="${ok&&!steep?'ok':'bad'}">${steep?'⚠ پله تند است؛ تعداد را بیشتر کنید':ok?'✓ راحت':'⚠ خارج از ۶۰ تا ۶۵'}</span>`}
  if(t==='shape'&&isSel){const M=shapeMeasure(o);return`مساحت <b>${fmtArea(M.A)}</b>، محیط ${fmtLen(M.Pm)}`}
  if(t==='car'){const g=carGeo(o),note={single:'هر واحد پارکینگ ۲٫۵ × ۵ متر است.',pair:'دو واحد کنار هم بدون ستون: ۵ × ۵ متر.',pairc:`فاصله‌ی آزاد بین دو ستون برای دو خودرو حداقل ۴٫۵ متر. الان ${fa(o.clear/1000,2)} متر.`,row3c:`سه خودرو بین دو ستون؛ فاصله‌ی آزاد را طبق ضوابط محل تنظیم کنید. الان ${fa(o.clear/1000,2)} متر.`,row:`${fa(g.nx)} واحد کنار هم، هر کدام ۲٫۵ متر.`,tandem:'پارکینگ مزاحم: دو خودرو پشت سر هم.'}[o.layout];return`${note}<br>ابعاد کل <b>${fa(g.W/1000,2)} × ${fa(g.L/1000,2)} متر</b>، ابعاد خودرو ثابت است`}
  if(t==='window')return`عرض هر لنگه ${cm(o.w/o.panes)} سانت`;
  if(t==='elevator')return`مساحت کابین ${fmtArea(o.w*o.d)}`;
  if(t==='furn')return`${FURN[o.kind].n}، <b>${cm(o.w)} × ${cm(o.d)} سانت</b>`;
  if(t==='cut'&&o.mode==='trim')return'تکه‌ی بین نزدیک‌ترین دیوارها یا خط‌های متقاطع حذف می‌شود.';
  return''}
function apply(type,target,patch){const o=target||DEF[type];
  if(type==='door'){if(patch.leaves===2&&!('w1'in patch)){patch.w1=o.w1||800;patch.w2=o.w2||800}const lv=patch.leaves??o.leaves;if(lv===2)patch.w=(patch.w1??o.w1)+(patch.w2??o.w2);else if(patch.leaves===1&&!('w'in patch))patch.w=900}
  if(type==='furn'&&patch.kind&&!('w'in patch)){patch.w=FURN[patch.kind].w;patch.d=FURN[patch.kind].d}
  if(type==='stairs'){if('floorH'in patch&&!('n'in patch))Object.assign(patch,autoStairs({...o,...patch}),{tread:patch.tread??o.tread});const c={...o,...patch};
    if(('n'in patch||'kind'in patch)&&!('n1'in patch))patch.n1=Math.ceil(c.n/2);if('n1'in patch)patch.n1=Math.min(c.n-2,Math.max(2,patch.n1))}
  if(type==='shape'){const k=patch.kind??o.kind,eq=['square','circle','poly'].includes(k);if(eq&&'w'in patch)patch.d=patch.w;else if(eq&&patch.kind&&target)patch.d=patch.w=Math.max(o.w,o.d)}
  if(target)setProps(target,patch);else Object.assign(DEF[type],patch);updateGhost();rightUI();draw()}
function thumb(k){const it=FURN[k],c=document.createElement('canvas'),dp=Math.min(3,devicePixelRatio||1),W0=64,H0=44;c.width=W0*dp;c.height=H0*dp;const g=c.getContext('2d');
  const ex=['dining','meet','rtable'].includes(k)?1000:0,ey=k==='desk'?600:0,sc=Math.min((W0-8)/(it.w+ex),(H0-6)/(it.d+ex+ey));const sv=[ctx,s];ctx=g;s=sc;g.setTransform(dp*sc,0,0,dp*sc,dp*W0/2,dp*(H0/2-ey*sc/2));g.strokeStyle=C.furn;g.lineCap='round';g.lineJoin='round';furnShape(k,it.w,it.d);ctx=sv[0];s=sv[1];return c}
function pillUI(){const p=$('[data-pill]');if(!drafting()){p.hidden=true;return}p.hidden=false;const o=DEF[tool]||{};
  const msg=tool==='measure'?({path:'نقطه‌ی بعدی مسیر',area:'گوشه‌ی بعدی',angle:meas&&meas.pts.length===1?'رأس زاویه را بزنید':'نقطه‌ی دوم',dist:'نقطه‌ی دوم',dim:meas&&meas.pts.length===1?'نقطه‌ی دوم':'جای خط اندازه'})[meas.mode]:tool==='cut'?'پایان برش را بزنید':tool==='stairs'?'به سمت بالا رفتن پله بزنید':tool==='shape'?({circle:'نقطه‌ای روی محیط',poly:'جای یک رأس'}[o.kind]||'گوشه‌ی مقابل'):tool==='hatch'?(o.mode==='rect'?'گوشه‌ی مقابل':'گوشه‌ی بعدی'):o.shape==='arc'?(pts.length===1?'پایان قوس':'نقطه‌ای روی قوس'):o.shape==='curve'?'نقطه‌ی بعدی منحنی':'گوشه‌ی بعدی';
  p.innerHTML=`<span>${msg}</span>`+(finishable()?'<button class="ok" data-fin>پایان</button>':'')+'<button data-cancel>لغو</button>';const f=p.querySelector('[data-fin]');if(f)f.onclick=finishDraft;p.querySelector('[data-cancel]').onclick=esc}
