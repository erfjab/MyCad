// ---------- X Y points (UTM) ----------
// one point per row, in metres; the shape keeps its form but is moved to the middle of the current view, not to its real coordinates
const ptNum=v=>{v=String(v).replace(/[۰-۹]/g,c=>c.charCodeAt(0)-1776).replace(/[٠-٩]/g,c=>c.charCodeAt(0)-1632).replace(/٫/g,'.').trim();return v&&isFinite(v)?+v:null};
function ptRow(x='',y=''){const box=$('[data-ptrows]'),r=el('div','ptr'),n=el('span'),del=el('button','ic',svg('close'));
  const inp=v=>{const i=el('input');i.inputMode='decimal';i.value=v;i.spellcheck=false;
    // Enter goes to the next row, making one at the end
    i.onkeydown=ev=>{if(ev.key!=='Enter')return;ev.preventDefault();const nx=r.nextElementSibling||ptRow();nx.querySelectorAll('input')[[...r.querySelectorAll('input')].indexOf(i)].focus()};
    // a pasted list (rows of "X Y", or "number X Y") fills this row and the ones after it
    i.onpaste=ev=>{const t=ev.clipboardData.getData('text');if(!/[\s,;،]/.test(t.trim()))return;ev.preventDefault();let cur=r;
      t.split(/\r?\n/).map(l=>l.split(/[\s,;،]+/).map(ptNum).filter(v=>v!==null)).filter(a=>a.length>=2).forEach(a=>{const[X,Y]=a.length===2?a:a.slice(1,3),[ix,iy]=(cur||(cur=ptRow())).querySelectorAll('input');ix.value=X;iy.value=Y;cur=cur.nextElementSibling});ptCount()};
    i.oninput=ptCount;return i};
  del.title='حذف ردیف';del.setAttribute('aria-label',del.title);del.onclick=()=>{r.remove();if(box.children.length<2)ptRow();ptCount()};
  r.append(n,inp(x),inp(y),del);box.append(r);ptCount();return r}
function ptRead(){return[...$$('[data-ptrows] .ptr:not(.ph)')].map(r=>[...r.querySelectorAll('input')].map(i=>ptNum(i.value))).filter(p=>p[0]!==null&&p[1]!==null)}
function ptCount(){$$('[data-ptrows] .ptr:not(.ph) span').forEach((s,i)=>s.textContent=fa(i+1));const n=ptRead().length,c=$('[data-ptcount]'),g=$('[data-ptgo]');c.textContent=n?fa(n)+' نقطه':'هنوز نقطه‌ای نیست';c.classList.toggle('ok',n>=2);g.disabled=n<2}
function pointsDlg(){const d=$('[data-ptdlg]'),cl=d.querySelector('[data-ptclose]');
  if(!d.querySelector('.ptr:not(.ph)'))for(let i=0;i<4;i++)ptRow();ptCount();
  d.querySelector('[data-ptadd]').onclick=()=>ptRow().querySelector('input').focus();
  cl.onclick=()=>cl.classList.toggle('on');d.querySelector('[data-ptcancel]').onclick=d.querySelector('[data-ptx]').onclick=()=>d.close();
  d.querySelector('[data-ptgo]').onclick=()=>{const P=ptRead();if(P.length<2){flash('دست‌کم دو نقطه لازم است.');return}
    const X=P.map(p=>p[0]),Y=P.map(p=>p[1]),mx=(Math.min(...X)+Math.max(...X))/2,my=(Math.min(...Y)+Math.max(...Y))/2,c=toW(W/2,Hh/2);
    const pts=P.map(([x,y])=>[Math.round(c[0]+(x-mx)*1000),Math.round(c[1]+(y-my)*1000)]),shut=cl.classList.contains('on')&&P.length>2;
    if(shut&&dist(pts[0],pts[pts.length-1])>1)pts.push(pts[0].slice());
    const e={t:'line',pts,dash:'solid',lw:2,kind:'points',closed:shut};d.close();if(tool!=='select')setTool('select');addEnt(e);setSel([e]);
    const bx=pts.map(p=>p[0]),by=pts.map(p=>p[1]),pad=Math.max(Math.max(...bx)-Math.min(...bx),Math.max(...by)-Math.min(...by),1000)*.1;
    fit([Math.min(...bx)-pad,Math.min(...by)-pad,Math.max(...bx)+pad,Math.max(...by)+pad]);refresh();draw();flash(fa(P.length)+' نقطه روی نقشه آمد.')};
  d.showModal();d.querySelector('.ptr:not(.ph) input').focus()}
