/* budget calculator: one question per screen, an email gate, then an editable report.
   Rule: start from what the project needs, not from the budget. The answers set the needs; the budget pays for them
   (one-time setup first when the budget includes it, then the monthly package of the budget tier).
   Prices and tiers live at the top, so changing them never touches the logic. Built from the agency's calculator brief
   and merged with the team's version (steppers, setup checkboxes, month-two view, readiness, copy summary). */
(function(){
  var app=document.getElementById('bgApp');if(!app)return;
  var ENDPOINT='https://formsubmit.co/ajax/arbaamia.sa@gmail.com';
  /* testing: while false, nothing is sent (the email step just opens the result). Set to true when the form is agreed, then do a real submission test. */
  var SEND_ENABLED=false;

  /* ============ prices (SAR): edit here only ============ */
  var PRICES={identity:2000,website:2000,design:100,video:150,mgmt:1000,campaignFee:1000,adSpend:1500};   /* mgmt per platform per month; campaignFee per campaign; adSpend per platform per month (50 a day) */
  var AD_DAILY=50;
  /* monthly packages by operating budget: m platforms managed, d designs, v videos, c campaigns, a ad platforms; fill = the rest goes to extra content */
  var TIERS=[
    {b:2000,m:0,d:10,v:6,c:0,a:0,t:'نركز على صناعة محتوى منتظم تنشره على أكثر من منصة. لا نوصي بإدارة الحسابات أو بحملة شهرية ضمن هذه الميزانية.'},
    {b:4000,m:1,d:10,v:6,c:0,a:0,t:'ندير منصة أساسية واحدة ونصنع محتوى متنوعا، ويمكن توجيه المتبقي لزيادة المحتوى أو تطويره. لا نوصي بحملة شهرية، لأن المتبقي لا يغطي تكاليف إطلاقها وتشغيلها.'},
    {b:6000,m:1,d:8,v:4,c:1,a:1,t:'محتوى وإدارة حساب وحملة شهرية، على منصة واحدة.'},
    {b:8000,m:2,d:10,v:6,c:1,a:1,t:'إدارة منصتين، ومحتوى يوزع بينهما، وحملة إعلانية شهرية.'},
    {b:10000,m:3,d:15,v:10,c:1,a:2,t:'إدارة ثلاث منصات، ومحتوى متنوع، وحملة إعلانية على منصتين.'},
    {b:12000,m:3,d:15,v:10,c:1,a:2,fill:1,t:'محتوى أكثر، وحضور أوسع على ثلاث منصات، وإعلانات على منصتين.'},
    {b:14000,m:4,d:15,v:12,c:1,a:2,fill:1,t:'إدارة أربع منصات، ومحتوى أكثر، وإنفاق إعلاني أكبر على المنصات الأنسب.'},
    {b:16000,m:4,d:20,v:14,c:1,a:3,fill:1,t:'حضور على عدة منصات، ومحتوى أكثر، وحملات إعلانية على ثلاث منصات.'},
    {b:18000,m:4,d:20,v:16,c:2,a:3,fill:1,t:'محتوى أكثر، وحملتان بهدفين مختلفين، وإعلانات أوسع انتشارا.'},
    {b:20000,m:4,d:25,v:18,c:2,a:4,fill:1,t:'إدارة حضور علامتك على أربع منصات، ومحتوى مكثف، وحملات إعلانية متعددة بحسب أهداف المشروع.'}
  ];

  /* ============ questions ============ */
  var PLATFORMS=[['instagram','إنستغرام'],['tiktok','تيك توك'],['snapchat','سناب شات'],['x','إكس'],['linkedin','لينكدإن'],['other','أخرى']];
  var STAGES=['معلومات المشروع','جاهزية العلامة التجارية','حسابات التواصل الاجتماعي','المحتوى التسويقي','الحملات الإعلانية','الميزانية'];
  var Q=[
    {id:'type',stage:0,title:'ما طبيعة نشاطك التجاري؟',opts:[['store','متجر إلكتروني'],['food','مطعم أو مقهى'],['services','شركة خدمات'],['brand','علامة تجارية'],['startup','مشروع ناشئ'],['other','أخرى']]},
    {id:'phase',stage:0,title:'ما المرحلة الحالية لمشروعك؟',opts:[['setup','مشروعي في مرحلة التأسيس'],['new','بدأت العمل حديثا'],['running','مشروعي قائم ولدي عملاء'],['growing','مشروعي قائم وأريد التوسع']]},
    {id:'goal',stage:0,title:'ما هدفك التسويقي الحالي؟',opts:[['sales','زيادة المبيعات'],['newcust','الوصول إلى عملاء جدد'],['aware','زيادة الوعي بالعلامة التجارية'],['launch','إطلاق منتج أو خدمة جديدة'],['presence','تحسين الحضور الرقمي'],['requests','زيادة الطلبات والاستفسارات']]},
    {id:'identity',stage:1,title:'هل لديك هوية بصرية جاهزة؟',hint:'الهوية البصرية هي الشعار والألوان والخطوط التي يعرف بها عملاؤك علامتك من النظرة الأولى.',opts:[['full','نعم، لدي هوية متكاملة'],['logo','لدي شعار فقط'],['improve','لدي هوية تحتاج إلى تطوير'],['none','لا، أحتاج إلى تصميم هوية']]},
    {id:'website',stage:1,title:'هل لديك موقع إلكتروني؟',opts:[['good','نعم، وهو يعمل جيدا'],['improve','لدي موقع يحتاج إلى تطوير'],['none','لا، ليس لدي موقع']]},
    {id:'siteContent',stage:1,show:function(a){return a.website==='none'},title:'هل لديك نصوص وصور جاهزة للموقع؟',hint:'النصوص هي ما يعرف بنشاطك وخدماتك، والصور هي ما يظهر في صفحات الموقع.',opts:[['both','نعم، لدي النصوص والصور'],['text','لدي النصوص فقط'],['images','لدي الصور فقط'],['none','لا، أحتاج من يكتب المحتوى ويجهزه']]},
    {id:'accounts',stage:2,title:'هل لديك حسابات على منصات التواصل الاجتماعي؟',opts:[['active','نعم، وحساباتي نشطة'],['inactive','لدي حسابات لكنها غير نشطة'],['some','لدي حسابات على بعض المنصات'],['none','ليس لدي حسابات']]},
    {id:'platforms',stage:2,multi:true,title:'ما المنصات التي تستخدمها أو تريد العمل عليها؟',hint:'يمكنك اختيار أكثر من منصة.',opts:PLATFORMS},
    {id:'ctype',stage:3,title:'ما نوع المحتوى الذي تحتاج إليه؟',opts:[['designs','تصاميم ومنشورات'],['videos','مقاطع فيديو مع تعليق صوتي'],['both','تصاميم ومقاطع فيديو'],['per','محتوى مخصص لكل منصة']]},
    {id:'managed',stage:2,title:'هل يدير حساباتك أحد غيرك؟',hint:'إدارة الحساب تعني التخطيط للمحتوى وجدولته ونشره ومتابعة الحساب باستمرار.',opts:[['all','نعم، يدير جميع حساباتي'],['some','نعم، يدير بعضها فقط'],['self','لا، أديرها بنفسي'],['need','أحتاج إلى من يدير حساباتي وينظم محتواها']]},
    {id:'camp',stage:4,title:'هل أطلقت حملات إعلانية من قبل؟',opts:[['good','نعم، ونتائجها جيدة'],['bad','نعم، لكن نتائجها غير مرضية'],['some','أطلقت حملات متقطعة'],['none','لا، لم أطلق حملات من قبل']]},
    {id:'adPlatforms',stage:4,multi:true,exclusive:'none',title:'على أي منصات تريد الإعلان؟',hint:'الإعلان المدفوع أن تدفع للمنصة لتعرض إعلانك على جمهور أوسع. ويمكنك اختيار أكثر من منصة.',opts:PLATFORMS.slice(0,5).concat([['none','لا أريد إطلاق حملات حاليا']])},
    {id:'cgoal',stage:4,multi:true,hint:'يمكنك اختيار أكثر من هدف.',show:function(a){return (a.adPlatforms||[]).length>0&&a.adPlatforms.indexOf('none')<0},title:'ما هدفك من الحملات الإعلانية؟',opts:[['sales','زيادة المبيعات'],['visits','زيادة زيارات الموقع'],['requests','استقبال الطلبات والاستفسارات'],['aware','زيادة الوعي والانتشار'],['promo','الترويج لمنتج أو خدمة محددة']]},
    {id:'budget',stage:5,select:true,title:'كم تخصص للتسويق؟',hint:'اختر المبلغ بالريال السعودي.',opts:[[2000,'٢٬٠٠٠ ريال'],[4000,'٤٬٠٠٠ ريال'],[6000,'٦٬٠٠٠ ريال'],[8000,'٨٬٠٠٠ ريال'],[10000,'١٠٬٠٠٠ ريال'],[12000,'١٢٬٠٠٠ ريال'],[14000,'١٤٬٠٠٠ ريال'],[16000,'١٦٬٠٠٠ ريال'],[18000,'١٨٬٠٠٠ ريال'],[20000,'٢٠٬٠٠٠ ريال أو أكثر']]},
    {id:'btype',stage:5,show:function(a){return setupItems(a).some(function(i){return i.cost>0})},title:'هل تشمل هذه الميزانية تكاليف التأسيس، أم هي ميزانية شهرية للتشغيل؟',hint:'التأسيس: أعمال تدفع مرة واحدة، مثل الهوية والموقع. التشغيل: ما تدفعه كل شهر.',opts:[['both','تشمل التأسيس والتشغيل'],['monthly','ميزانية شهرية للتشغيل فقط'],['separate','لدي ميزانية تأسيس منفصلة']]}
  ];
  var LABELS={};Q.forEach(function(q){LABELS[q.id]={};q.opts.forEach(function(o){LABELS[q.id][o[0]]=o[1]})});
  var COL={setup:'#0d3d3a',designs:'#6c171e',videos:'#17120f',mgmt:'#0d3d3a',campaigns:'#c8873a',ads:'#9a7b64',extra:'#7a4b3a',left:'#d9c2a6'};

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
      if((a.cgoal||[]).indexOf('visits')>-1&&a.website==='none')block='نقترح تأجيل الحملة حتى يجهز الموقع، لأن هدفها زيادة زيارات الموقع.';
      else if(a.accounts!=='active'&&a.accounts!=='some'&&a.website!=='good')block='ليس لديك حسابات نشطة ولا موقع يستقبل زوار الحملة، فنوصي بتجهيز أحدهما قبل إطلاقها.'}
    return {ctype:a.ctype==='per'?'both':a.ctype,mgmtWanted:a.managed==='all'?0:Math.min(4,plats||1),adsWanted:Math.min(4,ads),block:block}
  }
  function buildPlan(avail,n){
    var p={mgmt:0,designs:0,videos:0,campaigns:0,ads:0,extra:0,reasons:[],low:false,tier:null},t=tierFor(avail);
    if(!t){
      p.low=true;
      if(n.ctype==='designs')p.designs=Math.floor(avail/PRICES.design);
      else if(n.ctype==='videos')p.videos=Math.floor(avail/PRICES.video);
      else{p.designs=Math.floor(avail*.5/PRICES.design);p.videos=Math.floor(avail*.5/PRICES.video)}
      if(n.adsWanted>0)p.reasons.push('الميزانية المتاحة لا تكفي لإطلاق حملة، فنقترح أن تبدأ بالمحتوى.');
      return p}
    p.tier=t;
    var d=t.d,v=t.v;                                                         /* a single content type takes over the whole content spend */
    if(n.ctype==='designs'){d=Math.round(d+v*PRICES.video/PRICES.design);v=0}
    else if(n.ctype==='videos'){v=Math.round(v+d*PRICES.design/PRICES.video);d=0}
    p.designs=d;p.videos=v;p.mgmt=Math.min(t.m,n.mgmtWanted);
    if(n.mgmtWanted>0&&t.m===0)p.reasons.push('ميزانيتك التشغيلية الحالية لا تكفي لإدارة الحسابات، فنقترح البدء بصناعة المحتوى.');
    var ads=Math.min(t.a,n.adsWanted);
    if(n.adsWanted>0){
      if(n.block){p.reasons.push(n.block);ads=0}
      else if(t.c===0)p.reasons.push('الميزانية المتاحة لا تكفي لإعداد الحملة وتشغيلها. نقترح أن تستثمر في المحتوى والإدارة، أو تؤجل الحملة.');
      else if(n.adsWanted>ads)p.reasons.push('الميزانية تكفي للإعلان على '+ar(ads)+' من المنصات التي اخترتها، لأن لكل منصة ميزانية إعلانية مستقلة. ويمكنك إضافة البقية عند رفع الميزانية.')}
    if(t.c===0)ads=0;
    p.ads=ads;p.campaigns=Math.min(t.c,ads);
    if(t.fill){var base=t.m*PRICES.mgmt+t.d*PRICES.design+t.v*PRICES.video+t.c*PRICES.campaignFee+t.a*PRICES.adSpend;p.extra=Math.max(0,Math.floor((t.b-base)/100)*100)}
    return p
  }
  function setupItems(a){
    var items=[];
    if(a.identity!=='full'){
      items.push({id:'identity',label:{none:'تصميم هوية بصرية متكاملة',logo:'استكمال الهوية البصرية',improve:'تطوير الهوية البصرية'}[a.identity],
        note:{none:'تدفع مرة واحدة',logo:'لديك شعار، وسنبني عليه هوية متكاملة',improve:'سعر تقديري، ونحدد نطاق التطوير بعد المراجعة'}[a.identity],cost:PRICES.identity})}
    if(a.website==='none'){
      var note={both:'لديك النصوص والصور، ونحدد نطاق العمل بعد المراجعة',text:'لديك النصوص، وسنجهز الصور',images:'لديك الصور، وسنكتب النصوص',none:'تشمل التصميم وكتابة المحتوى وتجهيزه'}[a.siteContent]||'';
      items.push({id:'website',label:'إنشاء موقع إلكتروني متكامل',note:note,cost:PRICES.website,optional:a.type==='food',optNote:'اختياري لنشاطك، فمعظم المطاعم والمقاهي تكتفي بالحسابات'})}
    else if(a.website==='improve')items.push({id:'website',label:'تطوير الموقع الحالي',note:'نحدد السعر بعد مراجعة المتطلبات',cost:0,pending:true});
    if(a.accounts!=='active')items.push({id:'accounts',label:{none:'تأسيس الحسابات وتجهيزها',some:'تأسيس الحسابات الناقصة وتجهيزها',inactive:'تفعيل الحسابات غير النشطة وتجهيزها'}[a.accounts],note:'تدخل ضمن بداية إدارة الحسابات',cost:0});
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
    app.innerHTML='<section class="bg-card"><h2 class="bg-big">اعرف أين تنفق ميزانيتك التسويقية</h2>'+
      '<p class="bg-note-l">أجب عن أسئلة قصيرة، لتحصل على خطة تسويقية تناسب مشروعك وميزانيته، دون أن تدفع مقابل خدمات لا تحتاجها.</p>'+
      '<ul class="bg-axes"><li><span>١</span>خدمات التأسيس: تدفع مرة واحدة</li><li><span>٢</span>الخدمات الشهرية: المحتوى وإدارة الحسابات</li><li><span>٣</span>الحملات الإعلانية: أتعاب الحملة والإنفاق الإعلاني</li></ul>'+
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
      '<select class="bg-sel" data-q="'+q.id+'" aria-label="'+q.title+'"><option value="">اختر المبلغ</option>'+q.opts.map(function(o){return '<option value="'+o[0]+'"'+(sel===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></fieldset>';function on(v){return q.multi?(sel||[]).indexOf(v)>-1:sel===v}
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
      if(m.length){document.getElementById('bgErr').textContent='أجب عن جميع أسئلة هذه الخطوة قبل المتابعة.';var f=app.querySelector('[data-id="'+m[0].id+'"]');f.classList.add('miss');f.scrollIntoView({block:'center',behavior:'smooth'});return}
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
    app.innerHTML='<section class="bg-card"><div class="bg-prog"><span>الخطوة '+ar(STEPS)+' من '+ar(STEPS)+'</span></div><div class="bg-bar"><i style="width:100%"></i></div><h2 class="bg-big">آخر خطوة قبل نتيجتك</h2><p class="bg-hint">اكتب بريدك الإلكتروني لنعرض لك الخطة. سنحتفظ بإجاباتك لنراجعها ونتواصل معك.</p>'+
      '<form class="bg-gate" id="bgGate" novalidate><label for="bgEmail"><span>بريدك الإلكتروني</span></label><input type="email" id="bgEmail" name="email" autocomplete="email" dir="ltr" placeholder="name@company.com">'+
      '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="bg-hp"><small class="bg-me" id="bgErr" role="alert"></small><small>بإرسال بريدك، توافق على أن نتواصل معك عليه.</small>'+
      '<div class="bg-nav"><button type="button" class="bg-btn" id="bgBack">رجوع</button><button type="submit" class="bg-go" id="bgGo">شاهد النتيجة</button></div></form></section>';
    document.getElementById('bgBack').onclick=function(){idx=STAGES.length-1;step()};
    document.getElementById('bgGate').onsubmit=send;
    top()
  }
  function send(e){
    e.preventDefault();var f=e.target,err=document.getElementById('bgErr'),go=document.getElementById('bgGo'),em=f.elements.email;err.textContent='';
    if(f.elements.website.value||sending)return;
    if(!/^\S+@\S+\.\S+$/.test(em.value.trim())){em.setAttribute('aria-invalid','true');err.textContent='اكتب بريدا إلكترونيا صحيحا، مثل name@company.com.';em.focus();return}
    em.removeAttribute('aria-invalid');S={};rebuild();
    var d=new FormData();d.append('email',em.value.trim());
    visible().forEach(function(q){var v=A[q.id];d.append(q.title,q.multi?(v||[]).map(function(x){return LABELS[q.id][x]}).join('، '):LABELS[q.id][v])});
    d.append('التأسيس لمرة واحدة',money(C.setupTotal));d.append('التشغيل الشهري المقترح',money(monthly(P)));
    d.append('_subject','طلب خطة ميزانية من موقع أربعمية');d.append('_template','table');d.append('_captcha','false');
    var local=!SEND_ENABLED||/^(localhost|127\.0\.0\.1)$/.test(location.hostname);sending=true;go.disabled=true;
    (local?Promise.resolve():fetch(ENDPOINT,{method:'POST',body:d,headers:{Accept:'application/json'}}).then(function(x){return x.json().then(function(j){if(!x.ok||j.success==='false'||j.success===false)throw 0})}))
      .then(function(){sending=false;unlocked=true;result()})
      .catch(function(){sending=false;go.disabled=false;err.textContent='تعذر الإرسال. حاول مرة أخرى.'})
  }

  /* ============ report ============ */
  function readiness(){
    var rows=[['الهوية البصرية',{full:1,logo:.5,improve:.5,none:0}[A.identity]],['الموقع الإلكتروني',{good:1,improve:.5,none:0}[A.website]],['حسابات التواصل',{active:1,inactive:.5,some:.5,none:0}[A.accounts]],
      ['إدارة الحسابات',{all:1,some:.6,self:.3,need:0}[A.managed]],['الخبرة مع الحملات',{good:1,some:.5,bad:.3,none:0}[A.camp]]];
    var pct=Math.round(rows.reduce(function(s,r){return s+r[1]},0)/rows.length*100);
    return {rows:rows,pct:pct,label:pct<35?'مشروعك في بداية الطريق':pct<70?'جاهزيتك متوسطة، وبعض الأساسيات ناقصة':'مشروعك جاهز للنمو'}
  }
  function priorities(){
    var L=[],it=function(id){return C.items.filter(function(i){return i.id===id&&(i.cost===0||S[i.id])})[0]};
    if(it('identity'))L.push(['الهوية البصرية','عليها تبنى كل المواد التسويقية الأخرى.']);
    if(it('website'))L.push([it('website').pending?'تطوير الموقع الحالي':'الموقع الإلكتروني','يعطي عملاءك مكانا واضحا يتعرفون فيه عليك ويتواصلون معك.']);
    if(it('accounts'))L.push(['تأسيس الحسابات وتجهيزها','ليكون لمحتواك وإعلاناتك وجهة جاهزة.']);
    if(P.designs+P.videos>0)L.push(['صناعة المحتوى','محتوى منتظم تنشره على أكثر من منصة.']);
    if(P.mgmt>0)L.push(['إدارة الحسابات','تنظيم النشر والمتابعة على '+(P.mgmt===1?'منصة واحدة':ar(P.mgmt)+' منصات')+'.']);
    if(A.camp==='bad'&&A.adPlatforms&&A.adPlatforms.indexOf('none')<0)L.push(['تحليل أداء الحملات السابقة','نعرف سبب ضعف النتائج قبل أن ننفق ميزانية جديدة.']);
    else if(P.campaigns>0)L.push(['الحملات الإعلانية','حملة بهدف واضح على '+(P.ads===1?'منصة واحدة':ar(P.ads)+' منصات')+'.']);
    if(A.camp==='good'&&P.ads>=2)L.push(['التوسع التسويقي','نتائج حملاتك السابقة جيدة، فيمكنك التوسع تدريجيا في المنصات والمؤثرين.']);
    return L
  }
  function notNeeded(){
    var L=[];
    if(A.identity==='full')L.push('الهوية البصرية: لديك هوية متكاملة');
    if(A.website==='good')L.push('الموقع الإلكتروني: موقعك يعمل جيدا');
    var web=C.items.filter(function(i){return i.id==='website'&&i.optional})[0];if(web&&!S.website)L.push('الموقع الإلكتروني: اختياري لنشاطك حاليا');
    if(A.accounts==='active')L.push('تأسيس الحسابات: حساباتك نشطة');
    if(A.managed==='all')L.push('إدارة الحسابات: لديك جهة تديرها');else if(P.mgmt===0)L.push('إدارة الحسابات: الميزانية الحالية لا تكفيها');
    if(P.campaigns===0)L.push('الحملات الإعلانية: '+((A.adPlatforms||[]).indexOf('none')>-1?'لا تريدها حاليا':'مؤجلة حاليا'));
    return L
  }
  function recommendation(){
    var t=P.tier;
    if(!t)return 'ابدأ بمحتوى منتظم ضمن ميزانية التشغيل، ثم وسع الخدمات عندما تزيد الميزانية.';
    if((P.mgmt>0)===(t.m>0)&&(P.campaigns>0)===(t.c>0)&&P.mgmt===Math.min(t.m,C.needs.mgmtWanted))return t.t;
    var parts=[];if(P.designs+P.videos)parts.push('صناعة محتوى منتظم');if(P.mgmt)parts.push('إدارة الحسابات');if(P.campaigns)parts.push('حملة إعلانية شهرية');
    return parts.length?'ركز على '+parts.join(' و')+'، فهي الأنسب لمرحلة مشروعك وميزانيتك.':'حضورك الرقمي جيد. ادرس الحملات الإعلانية، وابدأ بها عندما تتوفر ميزانيتها.'
  }
  function donut(){
    var items=[['designs',P.designs*PRICES.design],['videos',P.videos*PRICES.video],['mgmt',P.mgmt*PRICES.mgmt],['campaigns',P.campaigns*PRICES.campaignFee],['ads',P.ads*PRICES.adSpend],['extra',P.extra]].filter(function(x){return x[1]>0}),
        m=monthly(P),total=Math.max(m,C.avail),left=Math.max(0,total-m);if(left>0)items.push(['left',left]);
    if(!items.length)return '';
    var off=25,svg='<svg viewBox="0 0 42 42" class="bg-donut" role="img" aria-label="رسم دائري لتوزيع الميزانية التشغيلية">';
    items.forEach(function(x){var p=x[1]/total*100;svg+='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="'+COL[x[0]]+'" stroke-width="7" stroke-dasharray="'+p+' '+(100-p)+'" stroke-dashoffset="'+off+'"/>';off-=p});
    return '<div class="bg-dw">'+svg+'</svg><div class="bg-mid"><b>'+money(m)+'</b><span>شهريا</span></div></div>'
  }
  /* where the budget goes, by area. Shows amounts and shares only: unit prices stay out of the report on purpose. */
  function allocRows(su,remaining){
    var rows=[],setupNames=C.items.filter(function(i){return S[i.id]}).map(function(i){return i.label});
    if(su>0)rows.push(['setup',C.incl?'التأسيس (مرة واحدة)':'التأسيس (خارج الميزانية الشهرية)',su,setupNames.join('، '),C.incl]);
    [['designs','تصاميم ومقاطع فيديو',P.designs*PRICES.design+P.videos*PRICES.video,'محتوى منتظم لحساباتك وإعلاناتك'],
     ['mgmt','إدارة الحسابات',P.mgmt*PRICES.mgmt,'تخطيط المحتوى ونشره ومتابعة الحسابات'],
     ['campaigns','إعداد الحملات وإدارتها',P.campaigns*PRICES.campaignFee,'أتعاب إعداد الحملات وتحسينها'],
     ['ads','الإنفاق الإعلاني',P.ads*PRICES.adSpend,'تدفعه مباشرة للمنصة الإعلانية'],
     ['extra','محتوى إضافي أو تطوير',P.extra,'نوجهه لما يخدم هدفك']].forEach(function(r){if(r[2]>0)rows.push([r[0],r[1],r[2],r[3],true])});
    if(remaining>0)rows.push(['left','المتبقي',remaining,'احتياطي للنمو أو لتوسيع الخدمات',true]);
    return rows
  }
  function allocCard(m,su,remaining){
    var rows=allocRows(su,remaining),base=C.B||1;
    return '<section class="bg-card"><h3 class="bg-h">كيف توزع ميزانيتك</h3><p class="bg-sub">هذا توزيع مقترح لميزانيتك على مجالات التسويق، وليس تسعيرا لكل خدمة.'+(C.incl&&su>0&&C.next?' وبعد التأسيس تصبح ميزانيتك كلها ('+money(C.B)+') للتشغيل من الشهر الثاني.':'')+'</p>'+donut()+
      rows.map(function(r){var pct=r[4]?Math.round(r[2]/base*100):0,c=COL[r[0]]||'#0d3d3a';
        return '<div class="bg-line"><div class="bg-lt"><span class="bg-dot" style="background:'+c+'"></span>'+r[1]+(r[3]?'<small>'+r[3]+'</small>':'')+(r[4]?'<span class="bg-bar" aria-hidden="true"><span style="width:'+Math.min(100,pct)+'%;background:'+c+'"></span></span>':'')+'</div><div class="bg-lc">'+money(r[2])+(r[4]?'<small>'+ar(pct)+'٪</small>':'')+'</div></div>'}).join('')+
      '<div class="bg-total"><span>'+(C.incl?'إجمالي ميزانيتك':'إجمالي التشغيل الشهري')+'</span><span>'+money(C.incl?C.B:m)+'</span></div></section>'
  }
  function result(){
    var m=monthly(P),su=C.setupTotal,remaining=C.incl?C.B-su-m:C.B-m,rd=readiness(),pr=priorities(),nn=notNeeded();
    var contentPlats=(A.platforms||[]).map(platName),adPlats=(A.adPlatforms||[]).filter(function(x){return x!=='none'}).slice(0,P.ads).map(platName),warns=[];
    if(C.incl&&su>C.B)warns.push(['bad','تكاليف التأسيس ('+money(su)+') أعلى من ميزانيتك. يمكنك تأجيل أحد بنود التأسيس أو زيادة الميزانية.']);
    else if(P.low)warns.push(['bad','الميزانية المتاحة للتشغيل أقل من الحد الأدنى للمحتوى المنتظم ('+money(2000)+').']);
    if(remaining<0&&!(C.incl&&su>C.B))warns.push(['bad','الخطة الحالية أعلى من ميزانيتك بمقدار '+money(-remaining)+'. قلل أحد البنود أو ارفع الميزانية.']);
    P.reasons.forEach(function(r){warns.push(['',r])});
    if(P.ads>0&&P.designs+P.videos===0)warns.push(['','تحتاج الحملة إلى محتوى إعلاني، فأضف تصاميم أو مقاطع فيديو.']);
    if(A.camp==='some'&&P.campaigns>0)warns.push(['','حملاتك السابقة كانت متقطعة. الاستمرار شهرا بعد شهر يعطي بيانات أوضح لتحسين الأداء.']);
    var tileSetup=(!C.incl&&su>0)?'خارج الميزانية الشهرية':(C.incl&&su>0?'من ميزانيتك':'لا يوجد'),remLabel=C.incl&&su>0?'المتبقي في الشهر الأول':'المتبقي شهريا';
    var h='<div class="bg-rep">'+
      '<section class="bg-card"><h2 class="bg-big">هذه خطتك التسويقية</h2><p class="bg-note-l">بناء على إجاباتك، حددنا الخدمات التي يحتاجها مشروعك، وما تبدأ به منها. هدفك الحالي: '+LABELS.goal[A.goal]+'.</p></section>'+
      '<section class="bg-tiles" aria-label="ملخص التكاليف"><div class="bg-tile"><small>تأسيس لمرة واحدة</small><b>'+fmt(su)+'</b><em>'+tileSetup+'</em></div><div class="bg-tile"><small>تشغيل شهري</small><b>'+fmt(m)+'</b><em>ريال</em></div><div class="bg-tile'+(remaining<0?' neg':'')+'"><small>'+remLabel+'</small><b>'+fmt(remaining)+'</b><em>ريال</em></div></section>'+
      (warns.length?'<div class="bg-notes">'+warns.map(function(w){return '<div class="bg-note'+(w[0]?' bad':'')+'">'+w[1]+'</div>'}).join('')+'</div>':'')+
      '<section class="bg-card"><h3 class="bg-h">جاهزية مشروعك</h3><div class="bg-meter"><span class="bg-pct">'+ar(rd.pct)+'٪</span><div class="bg-track" role="img" aria-label="نسبة الجاهزية '+ar(rd.pct)+' بالمئة"><i style="width:'+rd.pct+'%"></i></div></div><p class="bg-sub">'+rd.label+'</p>'+
        '<div class="bg-rows">'+rd.rows.map(function(r){return '<div class="bg-rrow"><span>'+r[0]+'</span><span class="bg-pill '+(r[1]>=1?'good':r[1]>0?'warn':'bad')+'">'+(r[1]>=1?'جاهز':r[1]>0?'يحتاج تطوير':'لا يوجد')+'</span></div>'}).join('')+'</div></section>'+
      '<section class="bg-card"><h3 class="bg-h">أولوياتك التسويقية</h3><ol class="bg-prio">'+pr.map(function(p){return '<li><div>'+p[0]+'<small>'+p[1]+'</small></div></li>'}).join('')+'</ol></section>'+
      allocCard(m,su,remaining)+
      
      '<section class="bg-card"><h3 class="bg-h">التوصية</h3><p class="bg-rec">'+recommendation()+'</p><p class="bg-fine">زيادة عدد الحملات أو المنصات ليست دائما الخيار الأفضل، فالقرار يعتمد على الجمهور والهدف والنتائج. أما الإنفاق بمعدل '+ar(AD_DAILY)+' ر.س يوميا لكل منصة فهو افتراض مبدئي، ولا يضمن نتائج الحملة.</p></section>'+
      (nn.length?'<details class="bg-card bg-more"><summary class="bg-h">ما لا تحتاجه الآن</summary><ul class="bg-skip">'+nn.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></details>':'')+
      '<section class="bg-card"><h3 class="bg-h">خطوتك القادمة</h3><p class="bg-note-l">ابدأ بالأولويات التي تجهز مشروعك للنمو، ثم وسع الإنفاق التسويقي تدريجيا.</p><p class="bg-fine">هذه التوصيات تقديرية. نحدد نطاق العمل والتكلفة النهائية بعد مراجعة تفاصيل مشروعك، ولا نضمن نتيجة بعينها.</p><p class="bg-fine">الأسعار المعروضة افتراضية لغرض التوضيح فقط، ولا يعتمد عليها عند طلب الخدمات أو التعاقد.</p>'+
        '<a class="flipbtn fb--cream bg-cta" href="contact.html"><span class="fb-in"><span class="fb-f">تواصل معنا<i>♠︎</i></span><span class="fb-b" aria-hidden="true">تواصل معنا<i>♠︎</i></span></span></a></section>'+
      '<div class="bg-actions"><button type="button" class="bg-go" id="bgCopy">نسخ ملخص الخطة</button><a class="bg-btn bg-x" id="bgX" target="_blank" rel="noopener" href="https://x.com/intent/post?text='+encodeURIComponent('جربت حاسبة التسويق من @arbaamia وعرفت وين أوزع ميزانيتي التسويقية 🧮 جربها مجانا: https://arbaamia.sa/budget.html')+'">شارك على إكس</a><button type="button" class="bg-btn" id="bgEdit">تعديل إجاباتي</button><button type="button" class="bg-btn" id="bgReset">ابدأ من جديد</button></div></div>';
    var y=window.scrollY;app.innerHTML=h;
    document.getElementById('bgCopy').onclick=copySummary;
    document.getElementById('bgEdit').onclick=function(){idx=0;step()};
    document.getElementById('bgReset').onclick=function(){A={};S={};idx=-1;unlocked=false;intro()};
    if(!result.shown){result.shown=true;top()}else window.scrollTo(0,y)
  }
  function kv(a,b){return '<div class="bg-kv"><span>'+a+'</span><span>'+b+'</span></div>'}
  function copySummary(){
    var m=monthly(P),rem=C.incl?C.B-C.setupTotal-m:C.B-m;
    var lines=['خطتي التسويقية من أربعمية','جاهزية المشروع: '+ar(readiness().pct)+'٪','','توزيع الميزانية:'].concat(allocRows(C.setupTotal,rem).map(function(r){return '- '+r[1]+': '+money(r[2])}),
      ['','تقديرات أولية، ونحدد التكلفة النهائية بعد مراجعة مشروعك.']);
    function done(ok){var t=document.createElement('div');t.className='bg-toast';t.setAttribute('role','status');t.textContent=ok?'تم نسخ الملخص':'تعذر النسخ. حدد النص وانسخه يدويا.';document.body.appendChild(t);setTimeout(function(){t.remove()},2200)}
    try{navigator.clipboard.writeText(lines.join('\n')).then(function(){done(true)},function(){done(false)})}catch(e){done(false)}
  }
  intro();
})();
