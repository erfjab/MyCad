const ICONS={
  down:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  select:'<path d="M6 3l12 9-5.5 1.2L15 20l-2.5 1-2.6-6.6L6 18z"/>',
  wall:'<path d="M3 8h18M3 14h18M3 8v6M21 8v6"/><path d="M7 8l-4 4M12 8l-6 6M17 8l-6 6M21 9l-5 5" opacity=".45"/>',
  line:'<path d="M4 19c4-1 3-8 8-9s4-5 8-6"/><circle cx="4" cy="19" r="1.5"/><circle cx="20" cy="4" r="1.5"/>',
  door:'<path d="M3 20h4M17 20h4M7 20V6"/><path d="M7 6a14 14 0 0114 14" stroke-dasharray="2 2"/>',
  window:'<rect x="3" y="9" width="18" height="6"/><path d="M3 12h18M12 9v6"/>',
  elevator:'<rect x="4" y="4" width="16" height="16"/><path d="M4 4l16 16M20 4L4 20"/>',
  stairs:'<rect x="6" y="3" width="12" height="18"/><path d="M6 7h12M6 11h12M6 15h12M12 19V5M10 7l2-2 2 2"/>',
  car:'<rect x="7" y="2.5" width="10" height="19" rx="3"/><path d="M8 8.5c2.5-1.2 5.5-1.2 8 0M8.5 17c2.2.8 4.8.8 7 0"/>',
  column:'<rect x="7" y="7" width="10" height="10" fill="currentColor"/>',
  furn:'<path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3"/><path d="M3 12.5a1.8 1.8 0 013.6 0V15h10.8v-2.5a1.8 1.8 0 013.6 0V18H3z"/><path d="M5 18v2M19 18v2"/>',
  cut:'<circle cx="6" cy="7" r="2.6"/><circle cx="6" cy="17" r="2.6"/><path d="M8.2 8.6L20 18M8.2 15.4L20 6"/>',
  hatch:'<rect x="4" y="4" width="16" height="16"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
  text:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  shape:'<rect x="3" y="11" width="9" height="9"/><circle cx="16" cy="8" r="5"/>',
  measure:'<path d="M3 16.5L16.5 3 21 7.5 7.5 21z"/><path d="M7 12.5l2 2M10 9.5l2 2M13 6.5l2 2"/>',
  dim:'<path d="M4 8v8M20 8v8M4 12h16"/><path d="M7 10.5l-3 1.5 3 1.5M17 10.5l3 1.5-3 1.5"/>',
  file:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
  floors:'<path d="M5 21V4h14v17M3 21h18M5 9.5h14M5 15h14"/><path d="M10 21v-3h4v3"/>',
  plan:'<rect x="3" y="4" width="18" height="16"/><path d="M3 12h8v8M11 4v5M15 12h6"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  view:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  open:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  export:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.7 9.7 0 005.4-1.6"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 017.5-2"/>',
  minus:'<path d="M5 12h14"/>',plus:'<path d="M12 5v14M5 12h14"/>',
  fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  undo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>',
  redo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
  rotate:'<path d="M20 12a8 8 0 11-2.3-5.6"/><path d="M20 4v5h-5"/>',
  flip:'<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 7L4 17h5zM15 7l5 10h-5z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  paste:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  more:'<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
  move:'<path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
  scale:'<rect x="3" y="12" width="9" height="9"/><path d="M12 3h9v9" stroke-dasharray="2 2"/><path d="M10 14l9-9M14 5h5v5"/>',
  magnet:'<path d="M5 3h5v9a2 2 0 004 0V3h5v9a7 7 0 01-14 0z"/><path d="M5 8h5M14 8h5"/>',
  axes:'<path d="M8 7v14M16 7v14M3 12h18M3 18h18" stroke-dasharray="3 2"/><circle cx="8" cy="4.5" r="2.2"/><circle cx="16" cy="4.5" r="2.2"/>',
  ortho:'<path d="M6 4v14h14"/><path d="M3.5 7L6 4l2.5 3M17 15.5l3 2.5-3 2.5"/>',
  polar:'<path d="M4 20h16M4 20L17 7"/><path d="M12 20a8 8 0 00-2.4-5.6" stroke-dasharray="2 2"/><path d="M13.5 6.5L17 7l-.5 3.5"/>',
  pin:'<path d="M12 21s-6-5.5-6-11a6 6 0 0112 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>'
};
const svg=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||''}</svg>`;
const app=document.getElementById('app'),$=s=>app.querySelector(s),$$=s=>[...app.querySelectorAll(s)];
$$('[data-icon]').forEach(e=>e.insertAdjacentHTML('afterbegin',svg(e.dataset.icon)));
const H=Math.PI/2,R2D=180/Math.PI,TAU=Math.PI*2;
const FONT='Vazirmatn, Tahoma, sans-serif';

// ---------- numbers (Persian digits) ----------
const fa=(n,d=0,g=true)=>Number(n).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:g});
const toEn=v=>String(v).replace(/[۰-۹]/g,c=>c.charCodeAt(0)-1776).replace(/[٠-٩]/g,c=>c.charCodeAt(0)-1632).replace(/[٬,\s]/g,'').replace(/٫/g,'.');
const cm=mm=>{const v=Math.round(mm)/10;return fa(v,Number.isInteger(v)?0:1,false)};
const opt={grid:true,snap:true,osnap:true,ortho:false,polar:true,polarInc:45,wallDims:false,unit:'m'};
const fmtLen=mm=>opt.unit==='m'?fa(mm/1000,2)+' م':opt.unit==='cm'?cm(mm)+' سانت':fa(Math.round(mm))+' میلی';
const fmtArea=a=>fa(a/1e6,2)+' متر مربع';
