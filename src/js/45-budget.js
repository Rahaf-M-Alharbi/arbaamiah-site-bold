/* budget calculator: one question per screen, an email gate, then an editable report.
   Rule: start from what the project needs, not from the budget. The answers set the needs; the budget pays for them
   (one-time setup first when the budget includes it, then the monthly package of the budget tier).
   Prices and tiers live at the top, so changing them never touches the logic. Built from the agency's calculator brief
   and merged with the team's version (steppers, setup checkboxes, month-two view, readiness, copy summary). */
(function(){
  var app=document.getElementById('bgApp');if(!app)return;
  var ENDPOINT='https://formsubmit.co/ajax/arbaamia.sa@gmail.com';

  /* ============ prices (SAR): edit here only ============ */
  var PRICES={identity:2000,website:2000,design:100,video:150,mgmt:1000,campaignFee:1000,adSpend:1500};   /* mgmt per platform per month; campaignFee per campaign; adSpend per platform per month (50 a day) */
  var AD_DAILY=50;
  /* monthly packages by operating budget: m platforms managed, d designs, v videos, c campaigns, a ad platforms; fill = the rest goes to extra content */
  var TIERS=[
    {b:2000,m:0,d:10,v:6,c:0,a:0,t:'التركيز على صناعة محتوى منتظم وتوظيفه في أكثر من منصة. لا نوصي بإدارة الحسابات أو إطلاق حملة شهرية ضمن هذه الميزانية.'},
    {b:4000,m:1,d:10,v:6,c:0,a:0,t:'إدارة منصة أساسية مع صناعة محتوى متنوع، ويمكن توجيه المتبقي إلى زيادة إنتاج المحتوى أو تطويره. لا نوصي بحملة شهرية؛ لأن المتبقي لا يغطي تكاليف إطلاقها وتشغيلها.'},
    {b:6000,m:1,d:8,v:4,c:1,a:1,t:'الجمع بين المحتوى والإدارة والحملة الشهرية على منصة واحدة.'},
    {b:8000,m:2,d:10,v:6,c:1,a:1,t:'إدارة منصتين، وصناعة محتوى قابل للتوزيع بينهما، وتشغيل حملة إعلانية شهرية.'},
    {b:10000,m:3,d:15,v:10,c:1,a:2,t:'إدارة ثلاث منصات، وصناعة محتوى متنوع، وتشغيل حملة إعلانية على منصتين.'},
    {b:12000,m:3,d:15,v:10,c:1,a:2,fill:1,t:'تعزيز إنتاج المحتوى، وتوسيع الحضور على ثلاث منصات، مع تشغيل الإعلانات على منصتين.'},
    {b:14000,m:4,d:15,v:12,c:1,a:2,fill:1,t:'توسيع إدارة الحسابات إلى أربع منصات، وزيادة كمية المحتوى، وتعزيز الإنفاق الإعلاني على المنصات المناسبة.'},
    {b:16000,m:4,d:20,v:14,c:1,a:3,fill:1,t:'تعزيز الحضور متعدد المنصات، ورفع إنتاج المحتوى، وتشغيل حملات إعلانية على ثلاث منصات.'},
    {b:18000,m:4,d:20,v:16,c:2,a:3,fill:1,t:'زيادة إنتاج المحتوى، وتشغيل حملتين وفق أهداف مختلفة، وتوسيع الانتشار الإعلاني.'},
    {b:20000,m:4,d:25,v:18,c:2,a:4,fill:1,t:'إدارة حضور العلامة على أربع منصات، وتكثيف إنتاج المحتوى، وتشغيل حملات إعلانية متعددة بحسب أهداف المشروع.'}
  ];

  /* ============ questions ============ */
  var PLATFORMS=[['instagram','إنستغرام'],['tiktok','تيك توك'],['snapchat','سناب شات'],['x','إكس'],['linkedin','لينكدإن'],['other','أخرى']];
  var STAGES=['معلومات المشروع','جاهزية العلامة التجارية','الحضور الرقمي وصناعة المحتوى','الحملات الإعلانية','الميزانية'];
  var Q=[
    {id:'type',stage:0,title:'ما طبيعة نشاطك التجاري؟',opts:[['store','متجر إلكتروني'],['food','مطعم أو مقهى'],['services','شركة خدمات'],['brand','علامة تجارية'],['startup','مشروع ناشئ'],['other','أخرى']]},
    {id:'phase',stage:0,title:'ما المرحلة الحالية لمشروعك؟',opts:[['setup','في مرحلة التأسيس'],['new','بدأ العمل مؤخرا'],['running','مشروع قائم ولديه عملاء'],['growing','مشروع قائم ويرغب في التوسع']]},
    {id:'goal',stage:0,title:'ما هدفك التسويقي الحالي؟',opts:[['sales','زيادة المبيعات'],['newcust','الوصول إلى عملاء جدد'],['aware','زيادة الوعي بالعلامة التجارية'],['launch','إطلاق منتج أو خدمة جديدة'],['presence','تحسين الحضور الرقمي'],['requests','زيادة الطلبات والاستفسارات']]},
    {id:'identity',stage:1,title:'هل تمتلك هوية بصرية معتمدة؟',hint:'الهوية البصرية هي الشعار والألوان والخطوط التي تجعل علامتك معروفة من النظرة الأولى.',opts:[['full','نعم، لدي هوية متكاملة'],['logo','لدي شعار فقط'],['improve','لدي هوية تحتاج إلى تطوير'],['none','لا، أحتاج إلى تصميم هوية']]},
    {id:'website',stage:1,title:'هل لديك موقع إلكتروني؟',opts:[['good','نعم، ويعمل بشكل جيد'],['improve','لدي موقع يحتاج إلى تطوير'],['none','لا أملك موقعا إلكترونيا']]},
    {id:'siteContent',stage:1,show:function(a){return a.website==='none'},title:'هل يتوفر لديك محتوى جاهز للموقع الإلكتروني؟',hint:'المحتوى هنا هو النصوص التي تعرف بنشاطك وخدماتك، والصور التي تظهر في الصفحات.',opts:[['both','نعم، لدي النصوص والصور'],['text','لدي النصوص فقط'],['images','لدي الصور فقط'],['none','لا، أحتاج إلى كتابة المحتوى وتجهيزه']]},
    {id:'accounts',stage:2,title:'هل لديك حسابات على منصات التواصل الاجتماعي؟',opts:[['active','نعم، وحساباتي نشطة'],['inactive','لدي حسابات لكنها غير نشطة'],['some','لدي حسابات على بعض المنصات'],['none','لا أملك حسابات']]},
    {id:'platforms',stage:2,multi:true,title:'ما المنصات التي تستخدمها أو ترغب في العمل عليها؟',hint:'يمكنك اختيار أكثر من منصة.',opts:PLATFORMS},
    {id:'content',stage:2,title:'هل يتوفر لديك محتوى تسويقي حالي؟',opts:[['both','تصاميم ومقاطع فيديو'],['designs','تصاميم فقط'],['videos','مقاطع فيديو فقط'],['old','محتوى قديم يحتاج إلى تحديث'],['none','لا، أحتاج إلى صناعة المحتوى من البداية']]},
    {id:'ctype',stage:2,title:'ما نوع المحتوى الذي تحتاج إليه؟',opts:[['designs','تصاميم ومنشورات'],['videos','مقاطع فيديو مع تعليق صوتي'],['both','تصاميم ومقاطع فيديو'],['per','محتوى مخصص لكل منصة']]},
    {id:'managed',stage:2,title:'هل لديك جهة تتولى إدارة حساباتك؟',hint:'إدارة الحساب تعني التخطيط للمحتوى وجدولته ونشره ومتابعة الحساب بشكل مستمر.',opts:[['all','نعم، جميع الحسابات'],['some','نعم، بعض الحسابات فقط'],['self','لا، أديرها بنفسي'],['need','أحتاج إلى إدارة وتنظيم المحتوى']]},
    {id:'camp',stage:3,title:'هل سبق لك إطلاق حملات إعلانية؟',opts:[['good','نعم، وأحقق نتائج جيدة'],['bad','نعم، لكن النتائج غير مرضية'],['some','سبق لي إطلاق حملات بشكل متقطع'],['none','لا، لم يسبق لي إطلاق حملات']]},
    {id:'adPlatforms',stage:3,multi:true,exclusive:'none',title:'ما المنصات التي ترغب في الإعلان عليها؟',hint:'الإعلان المدفوع هو أن تدفع للمنصة لتعرض إعلانك على جمهور أوسع.',opts:PLATFORMS.slice(0,5).concat([['none','لا أرغب في إطلاق حملات حاليا']])},
    {id:'cgoal',stage:3,show:function(a){return (a.adPlatforms||[]).length>0&&a.adPlatforms.indexOf('none')<0},title:'ما هدفك من الحملات الإعلانية؟',opts:[['sales','زيادة المبيعات'],['visits','زيادة الزيارات للموقع'],['requests','استقبال الطلبات والاستفسارات'],['aware','زيادة الوعي والانتشار'],['promo','الترويج لمنتج أو خدمة محددة']]},
    {id:'budget',stage:4,select:true,title:'كم تبلغ ميزانيتك المخصصة للتسويق؟',hint:'بالريال السعودي.',opts:[[2000,'٢٬٠٠٠ ريال'],[4000,'٤٬٠٠٠ ريال'],[6000,'٦٬٠٠٠ ريال'],[8000,'٨٬٠٠٠ ريال'],[10000,'١٠٬٠٠٠ ريال'],[12000,'١٢٬٠٠٠ ريال'],[14000,'١٤٬٠٠٠ ريال'],[16000,'١٦٬٠٠٠ ريال'],[18000,'١٨٬٠٠٠ ريال'],[20000,'٢٠٬٠٠٠ ريال أو أكثر']]},
    {id:'btype',stage:4,title:'هل هذه الميزانية تشمل تكاليف التأسيس أم هي ميزانية شهرية للتشغيل؟',hint:'التأسيس هو الأعمال التي تدفع مرة واحدة، مثل الهوية والموقع. التشغيل هو ما يدفع كل شهر.',opts:[['both','تشمل التأسيس والتشغيل'],['monthly','ميزانية شهرية للتشغيل فقط'],['separate','لدي ميزانية تأسيس منفصلة']]}
  ];
  var LABELS={};Q.forEach(function(q){LABELS[q.id]={};q.opts.forEach(function(o){LABELS[q.id][o[0]]=o[1]})});
  var COL={designs:'#6c171e',videos:'#17120f',mgmt:'#0d3d3a',campaigns:'#c8873a',ads:'#9a7b64',extra:'#7a4b3a',left:'#d9c2a6'};

  /* ============ state ============ */
  var A={},idx=-1,P=null,C=null,S={},unlocked=false,sending=false;
  var DG='٠١٢٣٤٥٦٧٨٩';
  function ar(n){return String(n).replace(/\d/g,function(d){return DG[d]})}
  function fmt(n){return ar(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,','))}
  function money(n){return fmt(n)+' ر.س'}
  function visible(){return Q.filter(function(q){return !q.show||q.show(A)})}
  function platName(k){var p=PLATFORMS.filter(function(x){return x[0]===k})[0];return p?p[1]:k}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  /* ============ engine ============ */
  function tierFor(avail){var t=null;TIERS.forEach(function(x){if(x.b<=avail)t=x});return t}
  function needsFrom(a){
    var plats=(a.platforms||[]).length,ads=(a.adPlatforms||[]).filter(function(x){return x!=='none'}).length,block=null;
    if(ads>0){
      if(a.cgoal==='visits'&&a.website==='none')block='تؤجل الحملة حتى يجهز الموقع، لأن هدفها زيارات الموقع.';
      else if(a.accounts!=='active'&&a.accounts!=='some'&&a.website!=='good')block='لا توجد حسابات نشطة أو موقع يستقبل زوار الحملة بعد، فنوصي بتجهيزها أولا.'}
    return {ctype:a.ctype==='per'?'both':a.ctype,mgmtWanted:a.managed==='all'?0:Math.min(4,plats||1),adsWanted:Math.min(4,ads),block:block}
  }
  function buildPlan(avail,n){
    var p={mgmt:0,designs:0,videos:0,campaigns:0,ads:0,extra:0,reasons:[],low:false,tier:null},t=tierFor(avail);
    if(!t){
      p.low=true;
      if(n.ctype==='designs')p.designs=Math.floor(avail/PRICES.design);
      else if(n.ctype==='videos')p.videos=Math.floor(avail/PRICES.video);
      else{p.designs=Math.floor(avail*.5/PRICES.design);p.videos=Math.floor(avail*.5/PRICES.video)}
      if(n.adsWanted>0)p.reasons.push('الميزانية المتاحة لا تغطي إطلاق حملة، فنقترح البدء بالمحتوى.');
      return p}
    p.tier=t;
    var d=t.d,v=t.v;                                                         /* a single content type takes over the whole content spend */
    if(n.ctype==='designs'){d=Math.round(d+v*PRICES.video/PRICES.design);v=0}
    else if(n.ctype==='videos'){v=Math.round(v+d*PRICES.design/PRICES.video);d=0}
    p.designs=d;p.videos=v;p.mgmt=Math.min(t.m,n.mgmtWanted);
    if(n.mgmtWanted>0&&t.m===0)p.reasons.push('إدارة الحسابات لا تتسع لها ميزانيتك التشغيلية الحالية، فصناعة المحتوى تأتي أولا.');
    var ads=Math.min(t.a,n.adsWanted);
    if(n.adsWanted>0){
      if(n.block){p.reasons.push(n.block);ads=0}
      else if(t.c===0)p.reasons.push('الميزانية المتاحة لا تغطي إعداد الحملة وتشغيلها، فنقترح الاستثمار في المحتوى والإدارة أو تأجيل الحملة.');
      else if(n.adsWanted>ads)p.reasons.push('الميزانية تكفي للإعلان على '+ar(ads)+' من المنصات التي اخترتها، وميزانية كل منصة تحسب على حدة. يمكن إضافة البقية عند رفع الميزانية.')}
    if(t.c===0)ads=0;
    p.ads=ads;p.campaigns=Math.min(t.c,ads);
    if(t.fill){var base=t.m*PRICES.mgmt+t.d*PRICES.design+t.v*PRICES.video+t.c*PRICES.campaignFee+t.a*PRICES.adSpend;p.extra=Math.max(0,Math.floor((t.b-base)/100)*100)}
    return p
  }
  function setupItems(a){
    var items=[];
    if(a.identity!=='full'){
      items.push({id:'identity',label:{none:'تصميم هوية بصرية متكاملة',logo:'استكمال الهوية البصرية',improve:'تطوير الهوية البصرية'}[a.identity],
        note:{none:'مرة واحدة',logo:'لديك شعار، وسنبني عليه هوية متكاملة',improve:'تقديري، ويراجع نطاق التطوير'}[a.identity],cost:PRICES.identity})}
    if(a.website==='none'){
      var note={both:'لديك النصوص والصور، ويراجع نطاق العمل',text:'لديك النصوص، وسنجهز الصور',images:'لديك الصور، وسنكتب النصوص',none:'تشمل التصميم وكتابة المحتوى وتجهيزه'}[a.siteContent]||'';
      items.push({id:'website',label:'إنشاء موقع إلكتروني متكامل',note:note,cost:PRICES.website,optional:a.type==='food',optNote:'اختياري لنشاطك، فمعظم المطاعم والمقاهي تكتفي بالحسابات'})}
    else if(a.website==='improve')items.push({id:'website',label:'تطوير الموقع الحالي',note:'يحدد السعر بعد مراجعة المتطلبات',cost:0,pending:true});
    if(a.accounts!=='active')items.push({id:'accounts',label:{none:'تأسيس الحسابات وتجهيزها',some:'تأسيس الحسابات الناقصة وتجهيزها',inactive:'تفعيل الحسابات غير النشطة وتجهيزها'}[a.accounts],note:'تحسب ضمن بداية إدارة الحسابات',cost:0});
    return items
  }
  function rebuild(){
    var items=setupItems(A);items.forEach(function(i){if(!(i.id in S))S[i.id]=!i.optional});
    var setupTotal=items.filter(function(i){return S[i.id]}).reduce(function(s,i){return s+i.cost},0),B=A.budget,incl=A.btype==='both',avail=incl?Math.max(0,B-setupTotal):B,needs=needsFrom(A);
    P=buildPlan(avail,needs);
    C={items:items,setupTotal:setupTotal,B:B,incl:incl,avail:avail,next:(incl&&setupTotal>0)?buildPlan(B,needs):null,needs:needs}
  }
  function monthly(p){return p.mgmt*PRICES.mgmt+p.designs*PRICES.design+p.videos*PRICES.video+p.campaigns*PRICES.campaignFee+p.ads*PRICES.adSpend+p.extra}

  /* ============ screens ============ */
  function top(){app.scrollIntoView({block:'start',behavior:'smooth'})}
  function intro(){
    app.innerHTML='<section class="bg-card"><h2 class="bg-big">اعرف أين تستحق ميزانيتك أن تنفق</h2>'+
      '<p class="bg-note-l">أجب عن أسئلة قصيرة عن مشروعك في ست خطوات، وتحصل على خطة تسويقية تناسب وضعه وميزانيته، دون أن تدفع مقابل خدمات لا تحتاجها.</p>'+
      '<ul class="bg-axes"><li><span>١</span>خدمات التأسيس، وتدفع مرة واحدة</li><li><span>٢</span>الخدمات الشهرية، من محتوى وإدارة حسابات</li><li><span>٣</span>الحملات الإعلانية والإنفاق الإعلاني</li></ul>'+
      '<div class="bg-nav"><button type="button" class="bg-go" id="bgStart">ابدأ الآن</button></div></section>';
    document.getElementById('bgStart').onclick=function(){idx=0;step()}
  }
  /* the steps are the five stages; the sixth is the email screen. Questions that depend on an earlier answer appear inside their step as soon as it is given. */
  var STEPS=STAGES.length+1;
  function stepQs(n){return visible().filter(function(q){return q.stage===n})}
  function answered(q){var v=A[q.id];return q.multi?!!(v&&v.length):v!==undefined&&v!==''}
  function qBlock(q){
    var sel=A[q.id];
    if(q.select)return '<fieldset class="bg-fs" data-id="'+q.id+'"><legend class="bg-q">'+q.title+'</legend>'+(q.hint?'<p class="bg-hint">'+q.hint+'</p>':'')+
      '<select class="bg-sel" data-q="'+q.id+'" aria-label="'+q.title+'"><option value="">اختر ميزانيتك</option>'+q.opts.map(function(o){return '<option value="'+o[0]+'"'+(sel===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></fieldset>';function on(v){return q.multi?(sel||[]).indexOf(v)>-1:sel===v}
    return '<fieldset class="bg-fs" data-id="'+q.id+'"><legend class="bg-q">'+q.title+'</legend>'+(q.hint?'<p class="bg-hint">'+q.hint+'</p>':'')+
      '<div class="bg-opts'+(q.grid?' bg-two':'')+(q.multi?' bg-multi':'')+'" role="'+(q.multi?'group':'radiogroup')+'">'+
      q.opts.map(function(o){return '<button type="button" class="bg-opt'+(on(o[0])?' on':'')+'" data-q="'+q.id+'" data-v="'+o[0]+'" role="'+(q.multi?'checkbox':'radio')+'" aria-checked="'+on(o[0])+'"><span class="bg-mark"></span><span>'+o[1]+'</span></button>'}).join('')+'</div></fieldset>'
  }
  function step(keepScroll){
    var qs=stepQs(idx),y=window.scrollY,last=idx===STAGES.length-1;
    app.innerHTML='<section class="bg-card"><div class="bg-prog"><span>الخطوة '+ar(idx+1)+' من '+ar(STEPS)+'</span></div>'+
      '<div class="bg-bar"><i style="width:'+((idx+1)/STEPS*100)+'%"></i></div>'+
      '<h2 class="bg-big">'+STAGES[idx]+'</h2>'+qs.map(qBlock).join('')+'<small class="bg-me" id="bgErr" role="alert"></small>'+
      '<div class="bg-nav"><button type="button" class="bg-btn" id="bgBack">رجوع</button><button type="button" class="bg-go" id="bgNext">'+(last&&unlocked?'شاهد النتيجة':'التالي')+'</button></div></section>';
    document.getElementById('bgBack').onclick=function(){if(idx===0){idx=-1;intro()}else{idx--;step()}};
    document.getElementById('bgNext').onclick=function(){
      var m=stepQs(idx).filter(function(q){return !answered(q)});
      if(m.length){document.getElementById('bgErr').textContent='أجب عن كل أسئلة هذه الخطوة.';var f=app.querySelector('[data-id="'+m[0].id+'"]');f.classList.add('miss');f.scrollIntoView({block:'center',behavior:'smooth'});return}
      advance()};
    [].forEach.call(app.querySelectorAll('.bg-sel'),function(s){s.onchange=function(){A[s.dataset.q]=s.value===''?undefined:Number(s.value)}});
    [].forEach.call(app.querySelectorAll('.bg-opt'),function(b){b.onclick=function(){
      var q=Q.filter(function(x){return x.id===b.dataset.q})[0],raw=b.dataset.v,v=q.id==='budget'?Number(raw):raw;
      if(q.multi){var cur=(A[q.id]||[]).slice();
        if(cur.indexOf(v)>-1)cur=cur.filter(function(x){return x!==v});
        else{if(q.exclusive===v)cur=[v];else{cur=cur.filter(function(x){return x!==q.exclusive});cur.push(v)}}
        A[q.id]=cur}
      else A[q.id]=v;
      var id=q.id;step(true);var f=app.querySelector('.bg-opt[data-q="'+id+'"][data-v="'+raw+'"]');if(f)f.focus({preventScroll:true})}});
    if(keepScroll)window.scrollTo(0,y);else top()
  }
  function advance(){
    if(idx<STAGES.length-1){idx++;step()}
    else if(unlocked){S={};rebuild();result()}
    else{idx=STAGES.length;gate()}
  }
  function gate(){
    app.innerHTML='<section class="bg-card"><div class="bg-prog"><span>الخطوة '+ar(STEPS)+' من '+ar(STEPS)+'</span></div><div class="bg-bar"><i style="width:100%"></i></div><h2 class="bg-big">آخر خطوة قبل نتيجتك</h2><p class="bg-hint">اكتب بريدك لنعرض لك الخطة. سنحتفظ بإجاباتك لنراجعها ونتواصل معك.</p>'+
      '<form class="bg-gate" id="bgGate" novalidate><label for="bgEmail"><span>بريدك الإلكتروني لعرض النتيجة</span></label><input type="email" id="bgEmail" name="email" autocomplete="email" dir="ltr" placeholder="name@company.com">'+
      '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="bg-hp"><small class="bg-me" id="bgErr" role="alert"></small><small>بإرسال بريدك توافق على أن نراسلك.</small>'+
      '<div class="bg-nav"><button type="button" class="bg-btn" id="bgBack">رجوع</button><button type="submit" class="bg-go" id="bgGo">شاهد النتيجة</button></div></form></section>';
    document.getElementById('bgBack').onclick=function(){idx=STAGES.length-1;step()};
    document.getElementById('bgGate').onsubmit=send;
    top()
  }
  function send(e){
    e.preventDefault();var f=e.target,err=document.getElementById('bgErr'),go=document.getElementById('bgGo'),em=f.elements.email;err.textContent='';
    if(f.elements.website.value||sending)return;
    if(!/^\S+@\S+\.\S+$/.test(em.value.trim())){em.setAttribute('aria-invalid','true');err.textContent='اكتب بريدا إلكترونيا صحيحا.';em.focus();return}
    em.removeAttribute('aria-invalid');S={};rebuild();
    var d=new FormData();d.append('email',em.value.trim());
    visible().forEach(function(q){var v=A[q.id];d.append(q.title,q.multi?(v||[]).map(function(x){return LABELS[q.id][x]}).join('، '):LABELS[q.id][v])});
    d.append('التأسيس لمرة واحدة',money(C.setupTotal));d.append('التشغيل الشهري المقترح',money(monthly(P)));
    d.append('_subject','طلب خطة ميزانية من موقع أربعمية');d.append('_template','table');d.append('_captcha','false');
    var local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);sending=true;go.disabled=true;
    (local?Promise.resolve():fetch(ENDPOINT,{method:'POST',body:d,headers:{Accept:'application/json'}}).then(function(x){return x.json().then(function(j){if(!x.ok||j.success==='false'||j.success===false)throw 0})}))
      .then(function(){sending=false;unlocked=true;result()})
      .catch(function(){sending=false;go.disabled=false;err.textContent='تعذر الإرسال. حاول مرة أخرى.'})
  }

  /* ============ report ============ */
  function readiness(){
    var rows=[['الهوية البصرية',{full:1,logo:.5,improve:.5,none:0}[A.identity]],['الموقع الإلكتروني',{good:1,improve:.5,none:0}[A.website]],['حسابات التواصل',{active:1,inactive:.5,some:.5,none:0}[A.accounts]],
      ['المحتوى التسويقي',{both:1,designs:.6,videos:.6,old:.3,none:0}[A.content]],['إدارة الحسابات',{all:1,some:.6,self:.3,need:0}[A.managed]],['الخبرة مع الحملات',{good:1,some:.5,bad:.3,none:0}[A.camp]]];
    var pct=Math.round(rows.reduce(function(s,r){return s+r[1]},0)/rows.length*100);
    return {rows:rows,pct:pct,label:pct<35?'مشروعك في بداية الطريق':pct<70?'جاهزيتك متوسطة، وبعض الأساسيات ناقصة':'مشروعك جاهز للنمو'}
  }
  function priorities(){
    var L=[],it=function(id){return C.items.filter(function(i){return i.id===id&&(i.cost===0||S[i.id])})[0]};
    if(it('identity'))L.push(['الهوية البصرية','تبدأ منها كل المواد التسويقية الأخرى.']);
    if(it('website'))L.push([it('website').pending?'تطوير الموقع الحالي':'الموقع الإلكتروني','يمنح عملاءك مكانا واضحا للتعرف عليك والتواصل معك.']);
    if(it('accounts'))L.push(['تأسيس الحسابات وتجهيزها','حتى يكون للمحتوى والإعلان وجهة جاهزة.']);
    if(P.designs+P.videos>0)L.push(['صناعة المحتوى','محتوى منتظم تعيد توظيفه على أكثر من منصة.']);
    if(P.mgmt>0)L.push(['إدارة الحسابات','تنظيم النشر والمتابعة على '+(P.mgmt===1?'منصة واحدة':ar(P.mgmt)+' منصات')+'.']);
    if(A.camp==='bad'&&A.adPlatforms&&A.adPlatforms.indexOf('none')<0)L.push(['تحليل أداء الحملات السابقة','نفهم سبب ضعف النتائج قبل ضخ ميزانية جديدة.']);
    else if(P.campaigns>0)L.push(['الحملات الإعلانية','حملة بهدف واضح على '+(P.ads===1?'منصة واحدة':ar(P.ads)+' منصات')+'.']);
    if(A.camp==='good'&&P.ads>=2)L.push(['التوسع التسويقي','نتائجك السابقة جيدة، فيمكن التوسع في المنصات والمؤثرين تدريجيا.']);
    return L
  }
  function notNeeded(){
    var L=[];
    if(A.identity==='full')L.push('الهوية البصرية: لديك هوية متكاملة');
    if(A.website==='good')L.push('الموقع الإلكتروني: موقعك يعمل بشكل جيد');
    var web=C.items.filter(function(i){return i.id==='website'&&i.optional})[0];if(web&&!S.website)L.push('الموقع الإلكتروني: اختياري لنشاطك حاليا');
    if(A.accounts==='active')L.push('تأسيس الحسابات: حساباتك نشطة');
    if(A.managed==='all')L.push('إدارة الحسابات: لديك جهة تديرها');else if(P.mgmt===0)L.push('إدارة الحسابات: لا تتسع لها الميزانية حاليا');
    if(P.campaigns===0)L.push('الحملات الإعلانية: '+((A.adPlatforms||[]).indexOf('none')>-1?'لا ترغب بها حاليا':'مؤجلة حاليا'));
    return L
  }
  function recommendation(){
    var t=P.tier;
    if(!t)return 'ركز ميزانية التشغيل على محتوى منتظم أولا، ثم وسع الخدمات عندما تتوفر ميزانية أكبر.';
    if((P.mgmt>0)===(t.m>0)&&(P.campaigns>0)===(t.c>0)&&P.mgmt===Math.min(t.m,C.needs.mgmtWanted))return t.t;
    var parts=[];if(P.designs+P.videos)parts.push('صناعة محتوى منتظم');if(P.mgmt)parts.push('إدارة الحسابات');if(P.campaigns)parts.push('حملة إعلانية شهرية');
    return parts.length?'ركز على '+parts.join(' و')+'، وهي ما يناسب مرحلة مشروعك وميزانيتك.':'حضورك الرقمي جيد. استثمر في دراسة الحملات والتوسع عند توفر ميزانيتها.'
  }
  function donut(){
    var items=[['designs',P.designs*PRICES.design],['videos',P.videos*PRICES.video],['mgmt',P.mgmt*PRICES.mgmt],['campaigns',P.campaigns*PRICES.campaignFee],['ads',P.ads*PRICES.adSpend],['extra',P.extra]].filter(function(x){return x[1]>0}),
        m=monthly(P),total=Math.max(m,C.avail),left=Math.max(0,total-m);if(left>0)items.push(['left',left]);
    if(!items.length)return '';
    var off=25,svg='<svg viewBox="0 0 42 42" class="bg-donut" role="img" aria-label="رسم دائري لتوزيع الميزانية التشغيلية">';
    items.forEach(function(x){var p=x[1]/total*100;svg+='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="'+COL[x[0]]+'" stroke-width="7" stroke-dasharray="'+p+' '+(100-p)+'" stroke-dashoffset="'+off+'"/>';off-=p});
    return '<div class="bg-dw">'+svg+'</svg><div class="bg-mid"><b>'+money(m)+'</b><span>شهريا</span></div></div>'
  }
  function stepRow(key,label,sub,val,cost,min,max,step){
    step=step||1;
    return '<div class="bg-line"><div class="bg-lt">'+label+'<small>'+sub+'</small></div><div class="bg-step" dir="ltr"><button type="button" data-k="'+key+'" data-d="-'+step+'" aria-label="تقليل '+label+'"'+(val<=min?' disabled':'')+'>−</button><output>'+fmt(val)+'</output><button type="button" data-k="'+key+'" data-d="'+step+'" aria-label="زيادة '+label+'"'+(val>=max?' disabled':'')+'>+</button></div><div class="bg-lc">'+fmt(cost)+'</div></div>'
  }
  function result(){
    var m=monthly(P),su=C.setupTotal,remaining=C.incl?C.B-su-m:C.B-m,rd=readiness(),pr=priorities(),nn=notNeeded();
    var contentPlats=(A.platforms||[]).map(platName),adPlats=(A.adPlatforms||[]).filter(function(x){return x!=='none'}).slice(0,P.ads).map(platName),warns=[];
    if(C.incl&&su>C.B)warns.push(['bad','تكاليف التأسيس ('+money(su)+') أكبر من ميزانيتك. يمكنك تأجيل أحد بنود التأسيس أو رفع الميزانية.']);
    else if(P.low)warns.push(['bad','الميزانية المتاحة للتشغيل أقل من الحد الأدنى لمحتوى منتظم ('+money(2000)+').']);
    if(remaining<0&&!(C.incl&&su>C.B))warns.push(['bad','الخطة الحالية تتجاوز الميزانية بمقدار '+money(-remaining)+'. قلل أحد البنود.']);
    P.reasons.forEach(function(r){warns.push(['',r])});
    if(P.ads>0&&P.designs+P.videos===0)warns.push(['','الحملة تحتاج إلى محتوى إعلاني جاهز، فأضف تصاميم أو مقاطع.']);
    if(A.camp==='some'&&P.campaigns>0)warns.push(['','حملاتك السابقة متقطعة. الاستمرارية شهرا بعد شهر تعطي بيانات أوضح لتحسين الأداء.']);
    var tileSetup=(!C.incl&&su>0)?'خارج الميزانية الشهرية':(C.incl&&su>0?'من ميزانيتك':'لا يوجد'),remLabel=C.incl&&su>0?'المتبقي في الشهر الأول':'المتبقي شهريا';
    var h='<div class="bg-rep">'+
      '<section class="bg-card"><h2 class="bg-big">ميزانيتك تستحق أن تستثمر بذكاء</h2><p class="bg-note-l">بناء على إجاباتك، حللنا احتياجات مشروعك وحددنا الخدمات التي تستحق أن تبدأ بها. هدفك الحالي: '+LABELS.goal[A.goal]+'.</p></section>'+
      '<section class="bg-tiles" aria-label="ملخص التكاليف"><div class="bg-tile"><small>تأسيس لمرة واحدة</small><b>'+fmt(su)+'</b><em>'+tileSetup+'</em></div><div class="bg-tile"><small>تشغيل شهري</small><b>'+fmt(m)+'</b><em>ريال</em></div><div class="bg-tile'+(remaining<0?' neg':'')+'"><small>'+remLabel+'</small><b>'+fmt(remaining)+'</b><em>ريال</em></div></section>'+
      (warns.length?'<div class="bg-notes">'+warns.map(function(w){return '<div class="bg-note'+(w[0]?' bad':'')+'">'+w[1]+'</div>'}).join('')+'</div>':'')+
      '<section class="bg-card"><h3 class="bg-h">جاهزية مشروعك</h3><div class="bg-meter"><span class="bg-pct">'+ar(rd.pct)+'٪</span><div class="bg-track" role="img" aria-label="نسبة الجاهزية '+ar(rd.pct)+' بالمئة"><i style="width:'+rd.pct+'%"></i></div></div><p class="bg-sub">'+rd.label+'</p>'+
        '<div class="bg-rows">'+rd.rows.map(function(r){return '<div class="bg-rrow"><span>'+r[0]+'</span><span class="bg-pill '+(r[1]>=1?'good':r[1]>0?'warn':'bad')+'">'+(r[1]>=1?'جاهز':r[1]>0?'يحتاج تطوير':'غير متوفر')+'</span></div>'}).join('')+'</div></section>'+
      '<section class="bg-card"><h3 class="bg-h">أولوياتك التسويقية</h3><ol class="bg-prio">'+pr.map(function(p){return '<li><div>'+p[0]+'<small>'+p[1]+'</small></div></li>'}).join('')+'</ol></section>'+
      (C.items.length?'<section class="bg-card"><h3 class="bg-h">تكاليف التأسيس</h3><p class="bg-sub">تدفع مرة واحدة، وتنفصل عن التشغيل الشهري. '+(C.incl?'تخصم من ميزانية الشهر الأول.':'لا تخصم من ميزانيتك الشهرية.')+'</p>'+
        C.items.map(function(i){return '<label class="bg-chk">'+(i.cost>0?'<input type="checkbox" data-s="'+i.id+'"'+(S[i.id]?' checked':'')+'>':'<span class="bg-nochk"></span>')+'<span class="bg-lt">'+i.label+'<small>'+(i.optional&&!S[i.id]?i.optNote:i.note)+'</small></span><span class="bg-lc">'+(i.pending?'يحدد لاحقا':(i.cost>0?fmt(i.cost):'ضمن الإدارة'))+'</span></label>'}).join('')+
        '<div class="bg-total"><span>إجمالي التأسيس</span><span>'+money(su)+'</span></div><p class="bg-fine">النطاق والاستضافة وأي خصائص برمجية خاصة تراجع حسب المتطلبات.</p></section>':'')+
      '<section class="bg-card"><h3 class="bg-h">خطتك الشهرية</h3><p class="bg-sub">عدل الأعداد كما تشاء، وستتحدث التكلفة فورا.</p>'+donut()+
        stepRow('designs','تصاميم',money(PRICES.design)+' للتصميم',P.designs,P.designs*PRICES.design,0,80)+
        stepRow('videos','مقاطع فيديو مع تعليق صوتي',money(PRICES.video)+' للمقطع',P.videos,P.videos*PRICES.video,0,60)+
        stepRow('mgmt','منصات تحتاج إدارة',money(PRICES.mgmt)+' لكل منصة',P.mgmt,P.mgmt*PRICES.mgmt,0,4)+
        stepRow('campaigns','حملات إعلانية (أتعاب الإعداد والإدارة)',money(PRICES.campaignFee)+' لكل حملة',P.campaigns,P.campaigns*PRICES.campaignFee,0,4)+
        stepRow('ads','منصات الإنفاق الإعلاني',money(PRICES.adSpend)+' لكل منصة ('+ar(AD_DAILY)+' ر.س يوميا)، وتدفع للمنصة الإعلانية',P.ads,P.ads*PRICES.adSpend,0,4)+
        ((P.extra>0||(P.tier&&P.tier.fill))?stepRow('extra','محتوى إضافي أو تطوير','يوجه لما يخدم هدفك',P.extra,P.extra,0,20000,500):'')+
        '<div class="bg-total"><span>إجمالي التشغيل الشهري</span><span>'+money(m)+'</span></div></section>'+
      '<section class="bg-card"><h3 class="bg-h">تفاصيل الخطة</h3>'+
        kv('منصات المحتوى',contentPlats.length?contentPlats.join('، '):'تحدد لاحقا')+kv('منصات الإدارة',P.mgmt?(P.mgmt===1?'منصة واحدة':ar(P.mgmt)+' منصات'):'لا يوجد حاليا')+
        kv('التصاميم والمقاطع شهريا',ar(P.designs)+' تصميم، '+ar(P.videos)+' مقطع')+kv('الحملات والمنصات الإعلانية',(P.campaigns?ar(P.campaigns)+(P.campaigns===1?' حملة':' حملات'):'لا يوجد حاليا')+(adPlats.length?' على '+adPlats.join('، '):''))+
        (C.next?kv('من الشهر الثاني','تتسع الخطة لميزانية '+money(C.B)+': '+ar(C.next.designs)+' تصميم، '+ar(C.next.videos)+' مقطع، إدارة '+ar(C.next.mgmt)+' منصات'+(C.next.campaigns?'، '+ar(C.next.campaigns)+' حملة':'')):'')+'</section>'+
      '<section class="bg-card"><h3 class="bg-h">التوصية</h3><p class="bg-rec">'+recommendation()+'</p><p class="bg-fine">زيادة عدد الحملات أو المنصات لا تعني دائما أنها الخيار الأفضل، فالقرار يعتمد على الجمهور والنتائج والهدف. والإعلان بمعدل '+ar(AD_DAILY)+' ر.س يوميا لكل منصة افتراض مبدئي وليس ضمانا لنتائج الحملة.</p></section>'+
      (nn.length?'<section class="bg-card"><h3 class="bg-h">ما لا تحتاج إليه حاليا</h3><ul class="bg-skip">'+nn.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></section>':'')+
      '<section class="bg-card"><h3 class="bg-h">خطوتك القادمة</h3><p class="bg-note-l">ابدأ بالأولويات التي تهيئ مشروعك للنمو، ثم وسع استثمارك التسويقي تدريجيا.</p><p class="bg-fine">هذه التوصيات تقديرية، ويعتمد نطاق العمل والتكلفة النهائية بعد مراجعة تفاصيل المشروع. ولا تعد ضمانا لأي نتيجة.</p>'+
        '<a class="flipbtn fb--cream bg-cta" href="contact.html"><span class="fb-in"><span class="fb-f">تواصل معنا<i>♠︎</i></span><span class="fb-b" aria-hidden="true">تواصل معنا<i>♠︎</i></span></span></a></section>'+
      '<div class="bg-actions"><button type="button" class="bg-go" id="bgCopy">نسخ ملخص الخطة</button><a class="bg-btn bg-x" id="bgX" target="_blank" rel="noopener" href="https://x.com/intent/post?text='+encodeURIComponent('جربت حاسبة التسويق من @arbaamia وعرفت وين أوزع ميزانيتي التسويقية 🧮 جربها مجانا: https://arbaamia.sa/budget.html')+'">شارك على إكس</a><button type="button" class="bg-btn" id="bgEdit">تعديل إجاباتي</button><button type="button" class="bg-btn" id="bgReset">ابدأ من جديد</button></div></div>';
    var y=window.scrollY;app.innerHTML=h;
    [].forEach.call(app.querySelectorAll('[data-k]'),function(b){b.onclick=function(){adjust(b.dataset.k,Number(b.dataset.d))}});
    [].forEach.call(app.querySelectorAll('[data-s]'),function(c){c.onchange=function(){S[c.dataset.s]=c.checked;var y2=window.scrollY;rebuild();result();window.scrollTo(0,y2);var n=app.querySelector('[data-s="'+c.dataset.s+'"]');if(n)n.focus({preventScroll:true})}});
    document.getElementById('bgCopy').onclick=copySummary;
    document.getElementById('bgEdit').onclick=function(){idx=0;step()};
    document.getElementById('bgReset').onclick=function(){A={};S={};idx=-1;unlocked=false;intro()};
    if(!result.shown){result.shown=true;top()}else window.scrollTo(0,y)
  }
  function kv(a,b){return '<div class="bg-kv"><span>'+a+'</span><span>'+b+'</span></div>'}
  function adjust(k,d){
    var lim={designs:[0,80],videos:[0,60],mgmt:[0,4],campaigns:[0,4],ads:[0,4],extra:[0,20000]}[k];
    P[k]=Math.min(lim[1],Math.max(lim[0],P[k]+d));
    if(P.ads>0&&P.campaigns===0)P.campaigns=1;
    if(P.campaigns===0)P.ads=0;
    if(k==='campaigns'&&P.campaigns>0&&P.ads===0)P.ads=1;
    var y=window.scrollY;result();window.scrollTo(0,y);
    var f=app.querySelector('[data-k="'+k+'"][data-d="'+d+'"]:not(:disabled)')||app.querySelector('[data-k="'+k+'"]:not(:disabled)');if(f)f.focus({preventScroll:true})
  }
  function copySummary(){
    var m=monthly(P),rem=C.incl?C.B-C.setupTotal-m:C.B-m;
    var lines=['خطتي التسويقية من أربعمية','جاهزية المشروع: '+ar(readiness().pct)+'٪','','التأسيس لمرة واحدة: '+money(C.setupTotal)].concat(C.items.filter(function(i){return S[i.id]||i.cost===0}).map(function(i){return '- '+i.label+(i.cost>0?': '+fmt(i.cost):'')}),
      ['','التشغيل الشهري: '+money(m),'- '+ar(P.designs)+' تصميم و'+ar(P.videos)+' مقطع','- إدارة '+ar(P.mgmt)+' منصات','- '+ar(P.campaigns)+' حملة، و'+ar(P.ads)+' منصات إعلانية'],P.extra>0?['- محتوى إضافي: '+fmt(P.extra)]:[],['','المتبقي: '+money(rem),'تقديرات أولية، والتكلفة النهائية بعد مراجعة تفاصيل المشروع.']);
    function done(ok){var t=document.createElement('div');t.className='bg-toast';t.setAttribute('role','status');t.textContent=ok?'تم نسخ الملخص':'تعذر النسخ، حدد النص وانسخه يدويا';document.body.appendChild(t);setTimeout(function(){t.remove()},2200)}
    try{navigator.clipboard.writeText(lines.join('\n')).then(function(){done(true)},function(){done(false)})}catch(e){done(false)}
  }
  intro();
})();
