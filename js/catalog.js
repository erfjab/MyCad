// ---------- catalog ----------
const TOOLS={select:['انتخاب','V'],wall:['دیوار','W'],line:['خط','L'],shape:['شکل‌ها','C'],door:['در','D'],window:['پنجره','N'],elevator:['آسانسور','E'],stairs:['پله','S'],car:['پارکینگ','P'],column:['ستون','O'],furn:['المان‌ها','I'],cut:['برش','X'],hatch:['هاشور و کف','H'],text:['متن','T'],measure:['اندازه‌گیری','M']};
// the right bar shows one button per group; the other tools of a group are tabs at the top of its card
const GROUPS=[['select'],['wall','line','shape'],['door','window'],['stairs','elevator'],['car','column'],['furn'],['cut','hatch','text'],['measure']];
const GNAME=['','ترسیم','در و پنجره','پله و آسانسور','پارکینگ و ستون','','ویرایش و نوشتن',''];
const GBREAK=[1,5,6];
const gOf=k=>GROUPS.findIndex(g=>g.includes(k==='dim'?'measure':k));
const gCur=GROUPS.map(g=>g[0]);
const LAYER_OF={shape:'anno',wall:'walls',door:'open',window:'open',elevator:'circ',stairs:'circ',car:'park',column:'struct',furn:'furn',line:'anno',text:'anno',dim:'dims',hatch:'fill'};
const LAYERS={walls:'دیوارها',open:'در و پنجره',circ:'آسانسور و پله',park:'پارکینگ',struct:'سازه',furn:'مبلمان و تجهیزات',anno:'متن و خطوط',dims:'اندازه‌ها',fill:'هاشور و کف'};
const CATS={living:'نشیمن',bed:'خواب',kit:'آشپزخانه',bath:'سرویس',office:'اداری'};
const FURN={
  sofa3:{n:'مبل سه‌نفره',cat:'living',w:2100,d:900,sizes:[[1800,850],[2100,900],[2400,950]]},
  sofa2:{n:'مبل دونفره',cat:'living',w:1500,d:900},
  chair1:{n:'مبل تک',cat:'living',w:900,d:900},
  sofaL:{n:'مبل ال',cat:'living',w:2700,d:1800,sizes:[[2400,1600],[2700,1800],[3000,2000]]},
  ctable:{n:'میز جلومبلی',cat:'living',w:1100,d:600},
  tv:{n:'میز تلویزیون',cat:'living',w:1800,d:450},
  rug:{n:'فرش',cat:'living',w:2000,d:3000,sizes:[[1500,2250],[2000,3000],[2500,3500],[3000,4000]]},
  plant:{n:'گلدان / درخت',cat:'living',w:600,d:600,sizes:[[400,400],[600,600],[1800,1800],[3000,3000]]},
  bed2:{n:'تخت دونفره',cat:'bed',w:1600,d:2000,sizes:[[1400,2000],[1600,2000],[1800,2000]]},
  bed1:{n:'تخت یک‌نفره',cat:'bed',w:900,d:2000,sizes:[[900,2000],[1000,2000],[1200,2000]]},
  crib:{n:'تخت نوزاد',cat:'bed',w:700,d:1300},
  ward:{n:'کمد لباس',cat:'bed',w:1800,d:600,sizes:[[1200,600],[1800,600],[2400,600]]},
  night:{n:'پاتختی',cat:'bed',w:450,d:400},
  dress:{n:'میز آرایش',cat:'bed',w:1000,d:450},
  stove:{n:'اجاق گاز',cat:'kit',w:600,d:600,sizes:[[600,600],[900,600]]},
  fridge:{n:'یخچال',cat:'kit',w:700,d:700,sizes:[[600,650],[700,700],[900,750]]},
  ksink:{n:'سینک ظرفشویی',cat:'kit',w:1000,d:600,sizes:[[800,600],[1000,600],[1200,600]]},
  dish:{n:'ماشین ظرفشویی',cat:'kit',w:600,d:600},
  counter:{n:'کابینت',cat:'kit',w:1200,d:600,sizes:[[600,600],[1200,600],[1800,600],[2400,600]]},
  dining:{n:'میز ناهارخوری',cat:'kit',w:1600,d:900,sizes:[[1200,800],[1600,900],[2000,1000],[2400,1000]]},
  rtable:{n:'میز گرد',cat:'kit',w:1000,d:1000,sizes:[[800,800],[1000,1000],[1200,1200]]},
  wc:{n:'توالت فرنگی',cat:'bath',w:400,d:700},
  wcir:{n:'توالت ایرانی',cat:'bath',w:450,d:750},
  basin:{n:'روشویی',cat:'bath',w:550,d:450},
  tub:{n:'وان',cat:'bath',w:1700,d:750,sizes:[[1500,700],[1700,750],[1800,800]]},
  shower:{n:'دوش',cat:'bath',w:900,d:900,sizes:[[800,800],[900,900],[1200,900]]},
  washer:{n:'لباسشویی',cat:'bath',w:600,d:600},
  desk:{n:'میز کار',cat:'office',w:1400,d:700,sizes:[[1200,600],[1400,700],[1600,800]]},
  chair:{n:'صندلی',cat:'office',w:500,d:500},
  shelf:{n:'کتابخانه',cat:'office',w:900,d:350,sizes:[[900,350],[1800,350],[2700,350]]},
  meet:{n:'میز جلسه',cat:'office',w:2400,d:1100,sizes:[[1800,900],[2400,1100],[3200,1200]]}
};
const PATN={grid:'شطرنجی',lines:'خطی',cross:'ضربدری',tiles:'آجری',solid:'توپر'};
const CARL={single:'تکی',pair:'دو خودرو کنار هم',pairc:'دو خودرو بین دو ستون',row:'ردیفی',tandem:'پشت سر هم'};
const PRESETS={
  wall:[{nm:'تیغه ۱۰',th:100,h:2800},{nm:'داخلی ۱۵',th:150,h:2800},{nm:'بیرونی ۲۵',th:250,h:3000},{nm:'بتنی ۳۰',th:300,h:3000}],
  line:[{nm:'خط دور',dash:'solid',lw:2},{nm:'خط‌چین',dash:'dashed',lw:1},{nm:'محور',dash:'center',lw:1},{nm:'مرز زمین',dash:'solid',lw:3}],
  door:[{nm:'سرویس ۷۰',leaves:1,w:700},{nm:'اتاق ۹۰',leaves:1,w:900},{nm:'ورودی ۱۱۰',leaves:1,w:1100},{nm:'دولنگه مساوی',leaves:2,w1:800,w2:800},{nm:'لنگه و نیم',leaves:2,w1:900,w2:400},{nm:'دولنگه پهن',leaves:2,w1:1000,w2:1000}],
  window:[{nm:'کوچک ۹۰',w:900,panes:1},{nm:'معمولی ۱۵۰',w:1500,panes:2},{nm:'عریض ۲۴۰',w:2400,panes:3},{nm:'نواری ۳۶۰',w:3600,panes:4}],
  elevator:[{nm:'۶۳۰ کیلوگرم',w:1100,d:1400,dw:800},{nm:'۱۰۰۰ کیلوگرم',w:1600,d:1400,dw:900},{nm:'تخت‌بر',w:1400,d:2400,dw:1300},{nm:'خودروبر',w:2700,d:5800,dw:2500}],
  stairs:[{nm:'یو آپارتمانی',kind:'u',w:1100,tread:280,floorH:3200,n:19,n1:10,ld:1100,gap:100},{nm:'یک‌طرفه',kind:'straight',w:1000,tread:280,floorH:3200,n:19},{nm:'ال با پاگرد',kind:'l',w:1000,tread:280,floorH:3200,n:19,n1:7},{nm:'گرد (مارپیچ)',kind:'spiral',w:800,floorH:3200,n:16,sweep:330}],
  car:[{nm:'تک‌واحد',layout:'single'},{nm:'دو خودرو کنار هم',layout:'pair'},{nm:'بین دو ستون',layout:'pairc',clear:4500},{nm:'ردیف سه‌تایی',layout:'row',n:3},{nm:'پشت سر هم',layout:'tandem'},{nm:'سه خودرو بین ستون',layout:'row3c',clear:7000}],
  column:[{nm:'۳۰ × ۳۰',w:300,d:300,round:0},{nm:'۴۰ × ۴۰',w:400,d:400,round:0},{nm:'گرد ۵۰',w:500,d:500,round:1},{nm:'۶۰ × ۳۰',w:600,d:300,round:0}],
  cut:[{nm:'بازشوی در',mode:'gap',gw:900},{nm:'گذرگاه',mode:'gap',gw:1500},{nm:'دو نقطه',mode:'points'},{nm:'حذف تکه',mode:'trim'}],
  hatch:[{nm:'سرامیک ۶۰',pat:'grid',sp:600,ang:0},{nm:'کاشی ۳۰',pat:'grid',sp:300,ang:0},{nm:'آجری',pat:'tiles',sp:300,ang:0},{nm:'مورب',pat:'lines',sp:200,ang:Math.PI/4},{nm:'ضربدری',pat:'cross',sp:300,ang:0},{nm:'توپر',pat:'solid',sp:300,ang:0}],
  text:[{nm:'عنوان',size:600,bold:1},{nm:'نام اتاق',size:350,bold:1},{nm:'برچسب',size:250,bold:0},{nm:'یادداشت',size:180,bold:0}]
};
const LN={solid:'ممتد',dashed:'خط‌چین',center:'محور'};
const SKIND={straight:'یک‌طرفه',l:'ال',u:'یو',spiral:'گرد'};
const PSPEC={wall:p=>`${cm(p.th)} سانت`,line:p=>`${LN[p.dash]}، ${['','نازک','متوسط','ضخیم'][p.lw]}`,door:p=>p.leaves===2?`${cm(p.w1)} + ${cm(p.w2)} سانت`:`${cm(p.w)} سانت`,
  window:p=>`${cm(p.w)} سانت، ${fa(p.panes)} لنگه`,elevator:p=>`${cm(p.w)} × ${cm(p.d)}`,stairs:p=>`${SKIND[p.kind]}، عرض ${cm(p.w)}، ${fa(p.n)} پله`,car:p=>carSpec(p),column:p=>p.round?`قطر ${cm(p.w)}`:`${cm(p.w)} × ${cm(p.d)} سانت`,
  cut:p=>p.mode==='gap'?`بازشوی ${cm(p.gw)} سانت`:p.mode==='points'?'شروع و پایان را بزنید':'بین دو تقاطع',hatch:p=>p.pat==='solid'?'رنگ توپر':`${PATN[p.pat]} ${cm(p.sp)}${p.ang?'، ۴۵ درجه':''}`,text:p=>`${cm(p.size)} سانت${p.bold?'، ضخیم':''}`};
function carSpec(p){const g=carGeo(p);return p.layout==='pairc'||p.layout==='row3c'?`${fa((p.clear||4500)/1000,1)} متر بین ستون‌ها`:`${fa(g.W/1000,1)} × ${fa(g.L/1000,1)} متر`}
const SHAPE={k:'shape',l:'شکل',type:'seg',opts:[['صاف','straight'],['قوس','arc'],['منحنی','curve']],tool:1};
const ROT={k:'ang',l:'چرخش',type:'num',u:'°',min:0,max:359,step:15};
const FIELDS={
  wall:[SHAPE,{k:'th',l:'ضخامت',type:'num',u:'cm',min:50,max:800,step:10},{k:'h',l:'ارتفاع',type:'num',u:'cm',min:2000,max:8000,step:50}],
  line:[SHAPE,{k:'dash',l:'نوع خط',type:'seg',opts:[['ممتد','solid'],['خط‌چین','dashed'],['محور','center']]},{k:'lw',l:'ضخامت',type:'seg',opts:[['نازک',1],['متوسط',2],['ضخیم',3]]}],
  door:[{k:'leaves',l:'تعداد لنگه',type:'seg',opts:[['یک‌لنگه',1],['دولنگه',2]]},{k:'w',l:'عرض در',type:'num',u:'cm',min:500,max:3000,step:10,when:o=>o.leaves!==2},{k:'w1',l:'لنگه‌ی اول',type:'num',u:'cm',min:200,max:1500,step:10,when:o=>o.leaves===2},{k:'w2',l:'لنگه‌ی دوم',type:'num',u:'cm',min:200,max:1500,step:10,when:o=>o.leaves===2},{k:'h',l:'ارتفاع',type:'num',u:'cm',min:1800,max:3500,step:10},{k:'swing',l:'زاویه‌ی باز شدن',type:'num',u:'°',min:30,max:180,step:5},{k:'flip',l:'سمت لولا',type:'seg',opts:[['راست',false],['چپ',true]]},{k:'side',l:'باز شدن به',type:'seg',opts:[['این طرف',1],['آن طرف',-1]],sel:1}],
  window:[{k:'w',l:'عرض',type:'num',u:'cm',min:300,max:8000,step:50},{k:'sill',l:'ارتفاع از کف',type:'num',u:'cm',min:0,max:2000,step:50},{k:'panes',l:'تعداد لنگه',type:'num',u:'',min:1,max:8,step:1}],
  elevator:[{k:'w',l:'عرض کابین',type:'num',u:'cm',min:800,max:3500,step:10},{k:'d',l:'عمق کابین',type:'num',u:'cm',min:800,max:7000,step:10},{k:'dw',l:'عرض در',type:'num',u:'cm',min:600,max:3000,step:10},ROT],
  stairs:[{k:'kind',l:'نوع پله',type:'seg',opts:[['یک‌طرفه','straight'],['ال (L)','l'],['یو (U)','u'],['گرد','spiral']]},
    {k:'floorH',l:'ارتفاع طبقه',type:'num',u:'cm',min:2000,max:6000,step:50},{k:'n',l:'تعداد پله',type:'num',u:'عدد',min:3,max:40,step:1},
    {k:'tread',l:'کف پله (عمق)',type:'num',u:'cm',min:220,max:400,step:5,when:o=>o.kind!=='spiral'},{k:'w',l:'عرض پله',type:'num',u:'cm',min:600,max:3000,step:10},
    {k:'n1',l:'پله‌ها تا پاگرد',type:'num',u:'عدد',min:2,max:38,step:1,when:o=>o.kind==='l'||o.kind==='u'},
    {k:'ld',l:'عمق پاگرد',type:'num',u:'cm',min:800,max:3000,step:10,when:o=>o.kind==='u'},{k:'gap',l:'چشمه‌ی وسط',type:'num',u:'cm',min:0,max:2000,step:10,when:o=>o.kind==='u'},
    {k:'sweep',l:'زاویه‌ی گردش',type:'num',u:'°',min:90,max:360,step:15,when:o=>o.kind==='spiral'},
    {k:'turn',l:'جهت چرخش',type:'seg',opts:[['به راست',1],['به چپ',-1]],when:o=>o.kind!=='straight'},
    {k:'dir',l:'فلش',type:'seg',opts:[['بالا','up'],['پایین','down']]},{k:'cut',l:'نمایش',type:'seg',opts:[['کامل',0],['خط برش',1]]},ROT],
  shape:[{k:'kind',l:'شکل',type:'seg',opts:[['مستطیل','rect'],['مربع','square'],['دایره','circle'],['بیضی','ellipse'],['چندضلعی','poly']]},
    {k:'sides',l:'تعداد ضلع',type:'num',u:'عدد',min:3,max:12,step:1,when:o=>o.kind==='poly'},
    {k:'as',l:'رسم به صورت',type:'seg',opts:[['خط','line'],['دیوار','wall']],tool:1},{k:'th',l:'ضخامت دیوار',type:'num',u:'cm',min:50,max:600,step:10,tool:1,when:o=>o.as==='wall'},
    {k:'w',l:'عرض',type:'num',u:'cm',min:50,max:50000,step:50,sel:1,when:o=>o.kind==='rect'||o.kind==='ellipse'},{k:'d',l:'طول',type:'num',u:'cm',min:50,max:50000,step:50,sel:1,when:o=>o.kind==='rect'||o.kind==='ellipse'},
    {k:'w',l:'ضلع',type:'num',u:'cm',min:50,max:50000,step:50,sel:1,when:o=>o.kind==='square'},{k:'w',l:'قطر',type:'num',u:'cm',min:50,max:50000,step:50,sel:1,when:o=>o.kind==='circle'||o.kind==='poly'},
    {k:'dash',l:'نوع خط',type:'seg',opts:[['ممتد','solid'],['خط‌چین','dashed'],['محور','center']],when:o=>o.as!=='wall'},{k:'lw',l:'ضخامت',type:'seg',opts:[['نازک',1],['متوسط',2],['ضخیم',3]],when:o=>o.as!=='wall'},
    {k:'fill',l:'زمینه',type:'seg',opts:[['خالی',0],['کم‌رنگ',1]],when:o=>o.as!=='wall'},{...ROT,sel:1}],
  car:[{k:'n',l:'تعداد خودرو',type:'num',u:'عدد',min:2,max:12,step:1,when:o=>o.layout==='row'},{k:'clear',l:'فاصله‌ی آزاد ستون‌ها',type:'num',u:'cm',min:2500,max:9000,step:50,when:o=>o.layout==='pairc'||o.layout==='row3c'},ROT],
  column:[{k:'w',l:'عرض',type:'num',u:'cm',min:100,max:2000,step:10},{k:'d',l:'عمق',type:'num',u:'cm',min:100,max:2000,step:10},{k:'round',l:'شکل',type:'seg',opts:[['چهارگوش',0],['گرد',1]]},ROT],
  furn:[{k:'w',l:'عرض',type:'num',u:'cm',min:200,max:6000,step:10},{k:'d',l:'عمق',type:'num',u:'cm',min:200,max:6000,step:10},ROT],
  cut:[{k:'mode',l:'روش برش',type:'seg',opts:[['دو نقطه','points'],['بازشو','gap'],['حذف تکه','trim']]},{k:'gw',l:'عرض بازشو',type:'num',u:'cm',min:100,max:8000,step:50,when:o=>o.mode==='gap'}],
  hatch:[{k:'mode',l:'محدوده',type:'seg',opts:[['مستطیل','rect'],['چندضلعی','poly'],['انتخاب اتاق','room']],tool:1},{k:'sp',l:'فاصله',type:'num',u:'cm',min:50,max:5000,step:50,when:o=>o.pat!=='solid'},{k:'ang',l:'زاویه',type:'num',u:'°',min:0,max:179,step:15,when:o=>o.pat!=='solid'}],
  text:[{k:'str',l:'متن',type:'text'},{k:'sub',l:'زیرنویس (مثلاً مساحت)',type:'text'},{k:'size',l:'ارتفاع حروف',type:'num',u:'cm',min:50,max:3000,step:10},{k:'bold',l:'وزن',type:'seg',opts:[['معمولی',0],['ضخیم',1]]},ROT],
  dim:[{k:'off',l:'فاصله‌ی خط اندازه',type:'num',u:'cm',min:-20000,max:20000,step:50}]
};
const DEF={wall:{shape:'straight',th:200,h:3000},line:{shape:'straight',dash:'solid',lw:2},door:{leaves:1,w:900,w1:800,w2:800,h:2100,swing:90,flip:false},window:{w:1500,sill:900,panes:2},elevator:{w:1600,d:1400,dw:900,ang:0},
  stairs:{kind:'u',w:1100,tread:280,floorH:3200,n:19,n1:10,ld:1100,gap:100,turn:1,sweep:330,dir:'up',cut:1,ang:0},shape:{kind:'rect',as:'line',th:200,sides:6,dash:'solid',lw:2,fill:0},car:{layout:'single',n:3,clear:4500,ang:0},column:{w:400,d:400,round:0,ang:0},furn:{kind:'sofa3',w:2100,d:900,ang:0},cut:{mode:'gap',gw:900},
  hatch:{mode:'room',pat:'grid',sp:600,ang:0},text:{str:'اتاق',sub:'',size:350,bold:1,ang:0},measure:{mode:'dist'}};
let furnCat='living';
const ROOMS=['نشیمن','پذیرایی','آشپزخانه','اتاق خواب','حمام','سرویس','راهرو','انباری','بالکن','پارکینگ','لابی','دفتر'];
const MMODES=[['dist','فاصله'],['path','طول مسیر'],['area','مساحت'],['room','مساحت اتاق'],['angle','زاویه'],['dim','اندازه‌گذاری']];
function hintFor(t){const o=DEF[t]||{};return({select:'روی هر المان بزنید تا ویرایش شود. با کشیدن جابه‌جا می‌شود.',
  wall:{straight:'نقطه‌ی شروع را بزنید و در هر گوشه کلیک کنید. با دوبار کلیک، Enter یا «پایان» تمام کنید.',arc:'شروع، پایان و بعد نقطه‌ای را که قوس از آن می‌گذرد بزنید.',curve:'نقاط مسیر منحنی را بزنید و با دوبار کلیک یا «پایان» تمام کنید.'}[o.shape],
  line:{straight:'نقطه‌ی شروع را بزنید و در هر گوشه کلیک کنید. با دوبار کلیک یا «پایان» تمام کنید.',arc:'شروع، پایان و بعد نقطه‌ای روی قوس را بزنید.',curve:'نقاط منحنی را بزنید و با دوبار کلیک یا «پایان» تمام کنید.'}[o.shape],
  door:'روی دیوار کلیک کنید. در به سمتی باز می‌شود که نشانگر آن‌جاست. F لولا را عوض می‌کند.',window:'روی دیوار کلیک کنید.',elevator:'برای گذاشتن کلیک کنید. R نود درجه می‌چرخاند.',stairs:'جای اولین پله را بزنید، بعد نشانگر را به سمتی که پله بالا می‌رود ببرید و دوباره بزنید. تعداد و ارتفاع پله‌ها از روی ارتفاع طبقه حساب می‌شود.',
  shape:{rect:'یک گوشه و بعد گوشه‌ی مقابل را بزنید.',square:'یک گوشه و بعد گوشه‌ی مقابل را بزنید؛ ضلع‌ها برابر می‌مانند.',circle:'مرکز را بزنید، بعد نقطه‌ای روی محیط.',ellipse:'دو گوشه‌ی کادر دور بیضی را بزنید.',poly:'مرکز را بزنید، بعد جای یکی از رأس‌ها.'}[DEF.shape.kind],
  car:'برای گذاشتن کلیک کنید. ابعاد هر واحد ثابت است. R می‌چرخاند.',column:'برای گذاشتن کلیک کنید.',furn:'یک المان انتخاب کنید و روی نقشه کلیک کنید. R می‌چرخاند.',
  cut:{points:'روی دیوار، نقطه‌ی شروع برش و بعد پایان آن را بزنید.',gap:'روی دیوار بزنید تا بازشویی به این عرض بریده شود.',trim:'نشانگر را روی تکه‌ی بین دو تقاطع ببرید و بزنید تا حذف شود.'}[o.mode],
  hatch:{rect:'دو گوشه‌ی مقابل را بزنید.',poly:'گوشه‌ها را بزنید و با دوبار کلیک یا «پایان» ببندید.',room:'داخل یک اتاق بزنید تا کفش پر شود.'}[o.mode],
  text:'جای متن را روی نقشه بزنید.',
  measure:{dist:'دو نقطه را بزنید.',path:'نقاط مسیر را بزنید و با دوبار کلیک یا «پایان» تمام کنید.',area:'گوشه‌های محدوده را بزنید و با دوبار کلیک یا «پایان» ببندید.',room:'داخل اتاق بزنید تا مساحت و ابعادش را ببینید.',angle:'نقطه‌ی اول، رأس زاویه و نقطه‌ی دوم را بزنید.',dim:'دو نقطه را بزنید، بعد جای خط اندازه را.'}[DEF.measure.mode]})[t]}

// ---------- geometry ----------
const dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
function proj(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1;return{t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2,L:Math.sqrt(L2)}}
function segD(p,a,b){const t=Math.max(0,Math.min(1,proj(p,a,b).t));return dist(p,[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])}
function plen(P){let L=0;for(let i=1;i<P.length;i++)L+=dist(P[i-1],P[i]);return L}
function locate(P,p){let best={d:1e18,s:0,pt:P[0],i:0},acc=0;for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],L=dist(a,b),t=Math.max(0,Math.min(1,proj(p,a,b).t)),q=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],d=dist(p,q);if(d<best.d)best={d,s:acc+t*L,pt:q,i:i-1};acc+=L}return best}
function pointAt(P,s){let acc=0;for(let i=1;i<P.length;i++){const L=dist(P[i-1],P[i]);if(acc+L>=s-1e-9){const t=L?(s-acc)/L:0;return[P[i-1][0]+t*(P[i][0]-P[i-1][0]),P[i-1][1]+t*(P[i][1]-P[i-1][1])]}acc+=L}return P[P.length-1].slice()}
function slice(P,s0,s1){const out=[pointAt(P,s0)];let acc=0;for(let i=1;i<P.length;i++){acc+=dist(P[i-1],P[i]);if(acc>s0+1e-6&&acc<s1-1e-6)out.push(P[i].slice())}out.push(pointAt(P,s1));return out}
function segInt(a,b,c,d){const r=[b[0]-a[0],b[1]-a[1]],q=[d[0]-c[0],d[1]-c[1]],den=r[0]*q[1]-r[1]*q[0];if(Math.abs(den)<1e-9)return null;const t=((c[0]-a[0])*q[1]-(c[1]-a[1])*q[0])/den,u=((c[0]-a[0])*r[1]-(c[1]-a[1])*r[0])/den;return(t<-1e-6||t>1+1e-6||u<-1e-6||u>1+1e-6)?null:t}
function rayInt(p,d,a,b){const q=[b[0]-a[0],b[1]-a[1]],den=d[0]*q[1]-d[1]*q[0];if(Math.abs(den)<1e-9)return null;const t=((a[0]-p[0])*q[1]-(a[1]-p[1])*q[0])/den,u=((a[0]-p[0])*d[1]-(a[1]-p[1])*d[0])/den;return(t<=0||u<0||u>1)?null:t}
function circ3(a,b,c){const d=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]));if(Math.abs(d)<1e-6)return null;const A=a[0]**2+a[1]**2,B=b[0]**2+b[1]**2,Cc=c[0]**2+c[1]**2;return[(A*(b[1]-c[1])+B*(c[1]-a[1])+Cc*(a[1]-b[1]))/d,(A*(c[0]-b[0])+B*(a[0]-c[0])+Cc*(b[0]-a[0]))/d]}
function arcPts(a,b,m){const c=circ3(a,b,m);if(!c)return[a.slice(),b.slice()];const r=dist(c,a),A=Math.atan2(a[1]-c[1],a[0]-c[0]),nm=x=>((x-A)%TAU+TAU)%TAU;const sb=nm(Math.atan2(b[1]-c[1],b[0]-c[0])),sm=nm(Math.atan2(m[1]-c[1],m[0]-c[0]));const sw=sm<sb?sb:sb-TAU,n=Math.max(10,Math.ceil(Math.abs(sw)*r/250));
  return Array.from({length:n+1},(_,i)=>{const t=A+sw*i/n;return[c[0]+r*Math.cos(t),c[1]+r*Math.sin(t)]})}
function spline(P){if(P.length<3)return P.map(p=>p.slice());const out=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
  for(let k=0;k<14;k++){const t=k/14,t2=t*t,t3=t2*t;out.push([0,1].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}out.push(P[P.length-1].slice());return out}
function loop(P){const Q=[P[P.length-2],...P.slice(0,-1),P[0],P[1]],out=[];for(let i=1;i<Q.length-2;i++){const p0=Q[i-1],p1=Q[i],p2=Q[i+1],p3=Q[i+2];for(let k=0;k<14;k++){const t=k/14,t2=t*t,t3=t2*t;out.push([0,1].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}out.push(out[0].slice());return out}
function inPoly(p,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){if(((P[i][1]>p[1])!==(P[j][1]>p[1]))&&p[0]<(P[j][0]-P[i][0])*(p[1]-P[i][1])/(P[j][1]-P[i][1])+P[i][0])c=!c}return c}
function area(P){let a=0;for(let i=0,j=P.length-1;i<P.length;j=i++)a+=(P[j][0]+P[i][0])*(P[j][1]-P[i][1]);return Math.abs(a/2)}
function centroid(P){let a=0,x=0,y=0;for(let i=0,j=P.length-1;i<P.length;j=i++){const f=P[j][0]*P[i][1]-P[i][0]*P[j][1];a+=f;x+=(P[j][0]+P[i][0])*f;y+=(P[j][1]+P[i][1])*f}if(Math.abs(a)<1e-6)return[P.reduce((s,p)=>s+p[0],0)/P.length,P.reduce((s,p)=>s+p[1],0)/P.length];return[x/(3*a),y/(3*a)]}
function offOf(a,b,c){const L=dist(a,b)||1,n=[-(b[1]-a[1])/L,(b[0]-a[0])/L];return(c[0]-a[0])*n[0]+(c[1]-a[1])*n[1]}
function carGeo(e){const c=e.clear||4500,L={single:[1,1,2500,0],pair:[2,1,2500,0],pairc:[2,1,c/2,500],row3c:[3,1,c/3,500],row:[e.n||3,1,2500,0],tandem:[1,2,2500,0]}[e.layout||'single']||[1,1,2500,0];const[nx,ny,bw,col]=L;return{nx,ny,bw,col,bl:5000,W:nx*bw+2*col,L:ny*5000}}
// Stair geometry in the item's local frame (x right, y down; walking up = -y at ang 0). n counts risers, so a flight shows n-1 treads.
// Returns outlines, tread lines [p,q,riserIndex,forward], walk line, overall size and where the first step (foot) sits.
function stairGeo(e){const n=Math.max(3,e.n|0),t=e.tread||280,w=e.w||1100,k=e.kind||'straight',tr=e.turn===-1?-1:1,n1=Math.min(n-2,Math.max(2,e.n1||Math.ceil(n/2)));
  const O=[],L=[];let walk,core=null,sp=t,full=false;
  if(k==='l'){const a=n1-1,m=n-n1-1,yL=-a*t,x2=w/2+m*t;O.push([[-w/2,0],[w/2,0],[w/2,yL],[x2,yL],[x2,yL-w],[-w/2,yL-w]]);
    for(let i=1;i<=a;i++)L.push([[-w/2,-i*t],[w/2,-i*t],i+1,[0,-1]]);for(let j=0;j<m;j++)L.push([[w/2+j*t,yL],[w/2+j*t,yL-w],n1+1+j,[1,0]]);
    walk=[[0,-t*.5],[0,yL-w/2],[x2-t*.35,yL-w/2]]}
  else if(k==='u'){const g=Math.max(0,e.gap??100),ld=e.ld||w,a=n1-1,m=n-n1-1,yL=-a*t,yE=yL+m*t,X=w+g/2,x1=-(w+g)/2,x2=(w+g)/2;
    O.push([[-X,yL-ld],[X,yL-ld],[X,yL],[-X,yL]],[[-X,0],[-g/2,0],[-g/2,yL],[-X,yL]],[[g/2,yL],[X,yL],[X,yE],[g/2,yE]]);
    for(let i=1;i<a;i++)L.push([[-X,-i*t],[-g/2,-i*t],i+1,[0,-1]]);for(let j=1;j<m;j++)L.push([[g/2,yL+j*t],[X,yL+j*t],n1+1+j,[0,1]]);
    walk=[[x1,-t*.5],[x1,yL-ld/2],[x2,yL-ld/2],[x2,yE-t*.35]]}
  else if(k==='spiral'){const rc=150,R=rc+w,rw=rc+w*.55,T=n-1,sw=Math.min(360,Math.max(90,e.sweep||330))/R2D,D=sw/T,P=(r,u)=>[rw-r*Math.cos(u),-r*Math.sin(u)];full=sw>TAU-1e-3;sp=D*rw;
    const arc=(r,u0,u1,st)=>{const N=Math.max(2,Math.ceil(Math.abs(u1-u0)/(TAU/72))),o=[];for(let i=0;i<=N;i++)o.push(P(r,u0+(u1-u0)*i/N));return o};
    if(full)O.push(arc(R,0,TAU).slice(0,-1));else O.push([...arc(R,0,sw),...arc(rc,sw,0)]);
    for(let i=full?0:1;i<T;i++){const u=i*D;L.push([P(rc,u),P(R,u),i+1,[Math.sin(u),-Math.cos(u)]])}
    core={c:[rw,0],r:rc};walk=arc(rw,D*.5,Math.min(sw,TAU-.3)-D*.35)}
  else{const T=n-1;O.push([[-w/2,0],[w/2,0],[w/2,-T*t],[-w/2,-T*t]]);for(let i=1;i<T;i++)L.push([[-w/2,-i*t],[w/2,-i*t],i+1,[0,-1]]);walk=[[0,-t*.5],[0,-T*t+t*.35]]}
  if(k!=='straight'&&tr===-1){const mx=p=>[-p[0],p[1]];O.forEach((P,i)=>O[i]=P.map(mx));L.forEach(l=>{l[0]=mx(l[0]);l[1]=mx(l[1]);l[3]=mx(l[3])});walk=walk.map(mx);if(core)core.c=mx(core.c)}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;O.flat().forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])});
  const cx=(x0+x1)/2,cy=(y0+y1)/2,sh=p=>[p[0]-cx,p[1]-cy];O.forEach((P,i)=>O[i]=P.map(sh));L.forEach(l=>{l[0]=sh(l[0]);l[1]=sh(l[1])});walk=walk.map(sh);if(core)core.c=sh(core.c);
  const R_=(e.floorH||3200)/n;return{O,L,walk,core,full,sp,n,R:R_,W:x1-x0,D:y1-y0,foot:[-cx,-cy],kc:Math.max(2,Math.round(1150/R_))}}
function stairDims(e){const G=stairGeo(e);return[G.W,G.D]}
// place a stair so its first step lands on `foot`
function stairAt(foot,ang,props){const e={t:'stairs',...(props||DEF.stairs),ang},G=stairGeo(e),c=Math.cos(ang),sn=Math.sin(ang),lx=G.foot[0],ly=-G.foot[1];e.c=[foot[0]-(lx*c-ly*sn),foot[1]-(lx*sn+ly*c)];return e}
function autoStairs(o){const sp=o.kind==='spiral',n=Math.max(3,Math.round((o.floorH||3200)/(sp?195:172))),R=(o.floorH||3200)/n,p={n,n1:Math.ceil(n/2)};if(!sp)p.tread=Math.max(250,Math.min(320,Math.round((630-2*R)/10)*10));return p}
// shapes: rectangle, square, circle, ellipse, regular polygon
function shapePts(e){const k=e.kind,hw=e.w/2,hd=e.d/2,c=Math.cos(e.ang||0),sn=Math.sin(e.ang||0),T=p=>[e.c[0]+p[0]*c-p[1]*sn,e.c[1]+p[0]*sn+p[1]*c];let L;
  if(k==='rect'||k==='square')L=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]];
  else if(k==='poly'){const n=Math.max(3,e.sides|0);L=Array.from({length:n},(_,i)=>{const a=H+i*TAU/n;return[hw*Math.cos(a),hw*Math.sin(a)]})}
  else L=Array.from({length:72},(_,i)=>{const a=i*TAU/72;return[hw*Math.cos(a),hd*Math.sin(a)]});return L.map(T)}
function shapeFrom(a,b,o){const dx=b[0]-a[0],dy=b[1]-a[1],k=o.kind;let c,w,d,ang=0;
  if(k==='rect'||k==='ellipse'){w=Math.abs(dx);d=Math.abs(dy);c=[(a[0]+b[0])/2,(a[1]+b[1])/2]}
  else if(k==='square'){const m=Math.max(Math.abs(dx),Math.abs(dy));w=d=m;c=[a[0]+Math.sign(dx||1)*m/2,a[1]+Math.sign(dy||1)*m/2]}
  else{const r=Math.hypot(dx,dy);w=d=2*r;c=a.slice();if(k==='poly')ang=Math.atan2(dy,dx)-H}
  if(w<50||d<50)return null;return{t:'shape',kind:k,c,w:Math.round(w),d:Math.round(d),ang,sides:o.sides,lw:o.lw,dash:o.dash,fill:o.fill}}
function shapeMeasure(e){const a=e.w/2,b=e.d/2;if(e.kind==='circle'||e.kind==='ellipse')return{A:Math.PI*a*b,Pm:Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)))};const P=shapePts(e);return{A:area(P),Pm:plen([...P,P[0]])}}
