// ---------- storage: every project lives in this browser (IndexedDB); preferences in localStorage ----------
const DB_NAME='mycad',DB_STORE='projects',LAST_KEY='mycad.last',PREF_KEY='mycad.prefs';
let dbP=null,myList=[],saveT=0,saving=false;
function idb(){return dbP||(dbP=new Promise((res,rej)=>{if(!window.indexedDB)return rej(Error('no-idb'));const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(DB_STORE))d.createObjectStore(DB_STORE,{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
async function tx(mode,fn){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction(DB_STORE,mode),st=t.objectStore(DB_STORE),q=fn(st);t.oncomplete=()=>res(q&&q.result);t.onerror=t.onabort=()=>rej(t.error)})}
const dbGet=id=>tx('readonly',st=>st.get(id)),dbPut=rec=>tx('readwrite',st=>st.put(rec)),dbDel=id=>tx('readwrite',st=>st.delete(id)),dbAll=()=>tx('readonly',st=>st.getAll());
const lsGet=k=>{try{return localStorage.getItem(k)}catch(_){return null}},lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(_){}};
const htmlEsc=t=>String(t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const cleanFloors=fs=>fs.map(f=>({name:f.name,ents:f.ents.map(e=>{const{join,...r}=e;return r})}));
function projRec(pr){return{id:pr.id,name:pr.name,file:pr.file||'',desc:pr.desc||'',imported:pr.imported||null,floors:cleanFloors(pr.floors),created:pr.created||Date.now(),updated:Date.now()}}
function recProj(r){return{...r,hist:r.floors.map(()=>({undo:[],redo:[]}))}}
function saveStatus(t){const n=$('[data-saved]');if(n)n.textContent=t||(saved?'ذخیره شده در همین مرورگر':'در حال ذخیره…')}
// called after every change; saves shortly after the last one
function markDirty(){saved=false;saveStatus();clearTimeout(saveT);saveT=setTimeout(saveNow,500)}
async function saveNow(){clearTimeout(saveT);if(saved||saving)return;saving=true;const pr=P;try{if(!pr.id){pr.id=newId();pr.created=Date.now();delete pr.sample}await dbPut(projRec(pr));if(pr===P){saved=true;lsSet(LAST_KEY,pr.id)}saveStatus();await refreshList()}
  catch(e){console.error(e);saveStatus('ذخیره نشد: حافظه‌ی مرورگر در دسترس نیست');flash(e&&e.name==='QuotaExceededError'?'حافظه‌ی مرورگر پر است. چند پروژه‌ی قدیمی را پاک کنید.':'ذخیره در این مرورگر ممکن نشد.')}finally{saving=false;if(!saved&&pr===P)markDirty()}}
async function refreshList(){try{const all=await dbAll();myList=all.map(r=>({id:r.id,name:r.name,file:r.file,updated:r.updated,n:r.floors.reduce((a,f)=>a+f.ents.length,0)})).sort((a,b)=>b.updated-a.updated)}catch(_){myList=[]}if(lPane==='file')leftUI()}
async function openSaved(id){if(!saved)await saveNow();const r=await dbGet(id);if(!r){flash('این پروژه پیدا نشد.');return refreshList()}hidden.clear();locked.clear();loadProject(recProj(r));saved=true;lsSet(LAST_KEY,id);saveStatus()}
async function deleteSaved(id){const it=myList.find(x=>x.id===id);if(!confirm(`پروژه‌ی «${it?it.name:''}» از این مرورگر پاک شود؟ این کار برگشت ندارد.`))return;await dbDel(id);if(P.id===id){lsSet(LAST_KEY,null);saved=true;loadProject(sampleCopy(0))}await refreshList();flash('پروژه پاک شد.')}
function newProject(){if(!saved)saveNow();hidden.clear();locked.clear();loadProject({name:'پروژه‌ی جدید',file:'',desc:'',floors:[{name:'طبقه‌ی اول',ents:[]}],hist:[{undo:[],redo:[]}]});markDirty()}
function renameProject(v){v=v.trim();if(!v||v===P.name)return;P.name=v;if(!P.imported)P.file=v+'.mycad';markDirty()}
// a .mycad file is the project as JSON: a backup that survives clearing the browser and moves between devices
function backupProject(){const data=JSON.stringify({app:'MyCad',version:1,project:projRec(P)});saveFile(fileBase()+'.mycad',new Blob([data],{type:'application/json'}))}
async function openBackup(file){try{const j=JSON.parse(await file.text()),r=j&&j.project;if(!r||!Array.isArray(r.floors))throw Error('bad');if(!saved)await saveNow();hidden.clear();locked.clear();loadProject(recProj({...r,id:null}));markDirty();flash('پروژه از فایل پشتیبان باز شد.')}catch(e){flash('این فایل پشتیبان MyCad نیست یا خراب است.')}}
const fileBase=()=>((P.file||P.name||'mycad').replace(/\.(dwg|dxf|mycad)$/i,'').replace(/[\\/:*?"<>|]+/g,'-').trim()||'mycad');
function savePrefs(){lsSet(PREF_KEY,JSON.stringify({opt,mode:app.dataset.mode||'light',exp:EXP}))}
function loadPrefs(){try{const p=JSON.parse(lsGet(PREF_KEY)||'null');if(p){Object.assign(opt,p.opt||{});if(p.exp)Object.assign(EXP,p.exp);if(p.mode)app.dataset.mode=p.mode;return}}catch(_){}if(matchMedia('(prefers-color-scheme: dark)').matches)app.dataset.mode='dark'}
addEventListener('pagehide',()=>{savePrefs();if(!saved)saveNow()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){savePrefs();if(!saved)saveNow()}});
async function bootStorage(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});await refreshList();const last=lsGet(LAST_KEY);if(last&&myList.some(x=>x.id===last))await openSaved(last)}catch(e){console.warn('storage unavailable',e)}}
