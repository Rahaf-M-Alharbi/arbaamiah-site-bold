/* budget calculator: eight questions, one per screen, an email gate, then a plan in cards.
   The rules and prices live in 44-budget-engine.js (BudgetEngine.DEFAULTS); this file only asks, shows and sends.
   Hidden settings: open the page with #admin (or press Ctrl+Shift+A) to change prices and rules in this browser and see the plan react. */
(function(){
  var app=document.getElementById('bgApp'),E=window.BudgetEngine;if(!app||!E)return;
  var ENDPOINT='https://formsubmit.co/ajax/arbaamia.sa@gmail.com';
  var SHEET='https://script.google.com/macros/s/AKfycbzgH9xcnkBraiDwWaS_0ZKPG4xVApXExBcYE0cY8AqRMJllmgr4tZqXXMgbu7jiAdgY/exec';  /* Google Sheet (Apps Script web app): every request is also added there as a row */
  function toSheet(d){var s=new FormData();d.forEach(function(v,k){if(k.charAt(0)!=='_')s.append(k,v)});s.append('_form','budget');
    try{fetch(SHEET,{method:'POST',body:s,mode:'no-cors',keepalive:true}).catch(function(){})}catch(x){}}
  /* while false, nothing is sent (the gate just opens the result). On localhost nothing is sent either. */
  var SEND_ENABLED=true;
  var STORE='bgSettings',MIN_BUDGET=1000,MAX_BUDGET=200000;

  /* ============ questions ============ */
  var PLATFORMS=[['instagram','إنستغرام'],['tiktok','تيك توك'],['snapchat','سناب شات'],['x','إكس'],['linkedin','لينكدإن'],['whatsapp','واتساب للأعمال']];
  var Q=[
    {id:'type',title:'ما طبيعة مشروعك؟',opts:[['store','متجر إلكتروني'],['food','مطعم أو مقهى'],['services','شركة خدمات'],['brand','علامة تجارية'],['startup','مشروع ناشئ'],['other','أخرى']]},
    {id:'goals',multi:true,title:'ما الهدف الأساسي الذي تسعى لتحقيقه؟',hint:'يمكنك اختيار أكثر من هدف.',opts:[['sales','زيادة المبيعات'],['requests','زيادة الطلبات والاستفسارات'],['newcust','الوصول إلى عملاء جدد'],['aware','زيادة الوعي بالعلامة التجارية'],['launch','إطلاق منتج أو خدمة جديدة'],['presence','بناء حضور قوي على منصات التواصل']]},
    {id:'identity',title:'ما وضع هويتك البصرية الحالية؟',hint:'الهوية البصرية هي الشعار والألوان والخطوط التي تجعل علامتك معروفة من النظرة الأولى.',opts:[['full','لدي هوية بصرية متكاملة وجاهزة'],['logo','لدي شعار فقط وأحتاج إلى تطوير الهوية'],['partial','لدي هوية وأحتاج إلى استكمالها'],['none','لا أملك هوية بصرية']]},
    {id:'site',title:'ما وضع موقعك الإلكتروني؟',opts:[['ready','لدي موقع جاهز ويعمل بشكل جيد'],['improve','لدي موقع وأحتاج إلى تطويره'],['none','لا أملك موقعا إلكترونيا'],['notNeeded','لا أحتاج إلى موقع حاليا']]},
    {id:'accounts',title:'ما وضع حساباتك على منصات التواصل الاجتماعي؟',opts:[['own','لدي حسابات جاهزة وأديرها بنفسي'],['managed','لدي حسابات وأرغب في إدارة جهة متخصصة لها'],['inactive','لدي حسابات غير نشطة وأحتاج إلى إعادة تشغيلها'],['none','لا أملك حسابات وأحتاج إلى تأسيسها']]},
    {id:'platforms',multi:true,title:'ما المنصات التي ترغب في العمل عليها؟',hint:'اختر منصة أو أكثر. لا ندير كل منصة تختارها، بل نقترح الأنسب لنشاطك وهدفك وميزانيتك.',opts:PLATFORMS},
    {id:'ads',title:'ما احتياجك الإعلاني؟',hint:'الإنفاق الإعلاني مبلغ تدفعه للمنصة لتعرض إعلانك على جمهور أوسع، ويختلف عن أتعاب إعداد الحملة وإدارتها.',opts:[['want','أريد إطلاق حملات إعلانية'],['one','أريد حملة واحدة'],['multi','أريد أكثر من حملة'],['recommend','أرغب في الإعلان لكن أحتاج إلى توصية'],['none','لا أريد إعلانات حاليا']]},
    {id:'budget',budget:true,title:'ما الميزانية التي خصصتها للتسويق؟',hint:'هذه إجمالي المبلغ المتاح للتوزيع، وتشمل التأسيس والخدمات التسويقية والإنفاق الإعلاني.',steps:[2000,4000,6000,8000,10000,12000,14000,16000,18000,20000]}
  ];
  var LABELS={};Q.forEach(function(q){if(q.opts){LABELS[q.id]={};q.opts.forEach(function(o){LABELS[q.id][o[0]]=o[1]})}});

  /* ============ state ============ */
  var A={goals:[],platforms:[]},idx=-1,PL=null,unlocked=false,sending=false,sheetSent='',autoTimer=null,S=loadSettings();
  var DG='٠١٢٣٤٥٦٧٨٩';
  function ar(n){return String(n).replace(/\d/g,function(d){return DG[d]})}
  function fmt(n){return ar(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,','))}
  function money(n){return fmt(n)+' ريال'}
  function pn(k){return E.platformName[k]||k}
  function names(l){return l.map(pn).join('، ')}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function loadSettings(){try{var raw=localStorage.getItem(STORE);if(raw)return E.merge(E.DEFAULTS,JSON.parse(raw))}catch(e){}return E.clone(E.DEFAULTS)}
  function saveSettings(){try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}}
  function top(){app.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}

  /* ============ screens ============ */
  function intro(){
    app.innerHTML='<section class="bg-card panel"><h2 class="bg-big">اعرف أين تنفق ميزانيتك التسويقية</h2>'+
      '<p class="bg-note-l">أجب عن ثمانية أسئلة قصيرة، لنحلل مشروعك ونوزع ميزانيتك كما يفعل مسوق محترف: نبدأ بما يحتاجه مشروعك فعلا، ونؤجل ما لا يخدمك الآن.</p>'+
      '<ul class="bg-axes"><li><span>١</span>التأسيس: الهوية والموقع عندما يحتاجهما مشروعك</li><li><span>٢</span>المحتوى وإدارة الحسابات على المنصات الأنسب لنشاطك</li><li><span>٣</span>الحملات الإعلانية: أتعاب الحملة والإنفاق الإعلاني</li></ul>'+
      '<div class="bg-nav"><button type="button" class="bg-go btn btn--wine" id="bgStart">ابدأ الآن</button></div></section>';
    document.getElementById('bgStart').onclick=function(){idx=0;step()}
  }
  function later(fn){clearTimeout(autoTimer);autoTimer=setTimeout(fn,260)}
  function answered(q){
    var v=A[q.id];
    if(q.budget)return typeof v==='number'&&v>=MIN_BUDGET&&v<=MAX_BUDGET;
    return q.multi?!!(v&&v.length):v!==undefined&&v!==''
  }
  function qBlock(q){
    var sel=A[q.id],head='<legend class="bg-q">'+q.title+'</legend>'+(q.hint?'<p class="bg-hint">'+q.hint+'</p>':'');
    if(q.budget){
      var custom=q.steps.indexOf(sel)<0&&typeof sel==='number';
      return '<fieldset class="bg-fs" data-id="'+q.id+'">'+head+
        '<div class="bg-opts bg-chips" role="radiogroup">'+q.steps.map(function(n){var on=sel===n;return '<button type="button" class="bg-opt bg-chip'+(on?' on':'')+'" data-q="budget" data-v="'+n+'" role="radio" aria-checked="'+on+'">'+fmt(n)+' ريال</button>'}).join('')+'</div>'+
        '<label class="bg-cust" for="bgCustom"><span>أو أدخل مبلغا مخصصا بالريال</span></label>'+
        '<input type="text" inputmode="numeric" id="bgCustom" class="bg-in-num" autocomplete="off" placeholder="مثال: ٧٥٠٠" value="'+(custom?fmt(sel).replace(/,/g,''):'')+'" dir="rtl">'+
        '<small class="bg-hint" id="bgBudgetNote" aria-live="polite">'+(typeof sel==='number'?'ميزانيتك: '+money(sel):'')+'</small></fieldset>'
    }
    function on(v){return q.multi?(sel||[]).indexOf(v)>-1:sel===v}
    return '<fieldset class="bg-fs" data-id="'+q.id+'">'+head+
      '<div class="bg-opts'+(q.multi?' bg-multi':'')+'" role="'+(q.multi?'group':'radiogroup')+'">'+
      q.opts.map(function(o){return '<button type="button" class="bg-opt'+(on(o[0])?' on':'')+'" data-q="'+q.id+'" data-v="'+o[0]+'" role="'+(q.multi?'checkbox':'radio')+'" aria-checked="'+on(o[0])+'"><span class="bg-mark"></span><span>'+o[1]+'</span></button>'}).join('')+'</div></fieldset>'
  }
  /* one question per screen. A single-choice answer moves on by itself; multi-choice and budget use the next button. */
  function step(keepScroll){
    var q=Q[idx],y=window.scrollY,total=Q.length+1;
    app.innerHTML='<section class="bg-card panel bg-q-card"><div class="bg-prog"><span>السؤال '+ar(idx+1)+' من '+ar(Q.length)+'</span></div>'+
      '<div class="bg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+(idx+1)+'" aria-label="التقدم"><i style="width:'+((idx+1)/total*100)+'%"></i></div>'+
      qBlock(q)+'<small class="bg-me" id="bgErr" role="alert"></small>'+
      '<div class="bg-nav"><button type="button" class="bg-btn btn btn--light" id="bgBack">رجوع</button><button type="button" class="bg-go btn btn--wine" id="bgNext">'+(idx===Q.length-1&&unlocked?'شاهد النتيجة':'التالي')+'</button></div></section>';
    document.getElementById('bgBack').onclick=function(){clearTimeout(autoTimer);if(idx===0){idx=-1;intro()}else{idx--;step()}};
    document.getElementById('bgNext').onclick=function(){
      clearTimeout(autoTimer);
      if(!answered(q)){
        document.getElementById('bgErr').textContent=q.budget?'اختر ميزانيتك، أو اكتب مبلغا لا يقل عن '+money(MIN_BUDGET)+'.':'اختر إجابة قبل المتابعة.';
        var f=app.querySelector('[data-id="'+q.id+'"]');f.classList.add('miss');f.scrollIntoView({block:'center',behavior:'smooth'});return}
      advance()};
    [].forEach.call(app.querySelectorAll('.bg-opt'),function(b){b.onclick=function(){
      var raw=b.dataset.v,v=q.budget?Number(raw):raw;
      if(q.multi){var cur=(A[q.id]||[]).slice();cur=cur.indexOf(v)>-1?cur.filter(function(x){return x!==v}):cur.concat(v);A[q.id]=cur}
      else A[q.id]=v;
      step(true);var f=app.querySelector('.bg-opt[data-v="'+raw+'"]');if(f)f.focus({preventScroll:true});
      if(!q.multi&&!q.budget)later(advance)}});
    var cu=document.getElementById('bgCustom');
    if(cu)cu.oninput=function(){
      /* halalas are dropped: everything after a decimal point ("." or Arabic "٫") is ignored, so 5000.50 reads as 5000, not 500050 */
      var digits=cu.value.replace(/[٠-٩]/g,function(d){return DG.indexOf(d)}).split(/[.٫]/)[0].replace(/\D/g,''),n=digits?Number(digits):NaN;
      A.budget=isFinite(n)&&n>=MIN_BUDGET&&n<=MAX_BUDGET?n:undefined;
      [].forEach.call(app.querySelectorAll('.bg-chip'),function(c){var on=Number(c.dataset.v)===A.budget;c.classList.toggle('on',on);c.setAttribute('aria-checked',on)});
      document.getElementById('bgBudgetNote').textContent=A.budget?'ميزانيتك: '+money(A.budget):(digits?'اكتب مبلغا بين '+money(MIN_BUDGET)+' و'+money(MAX_BUDGET)+'.':'')};
    if(keepScroll)window.scrollTo(0,y);else top()
  }
  function advance(){
    if(idx<Q.length-1){idx++;step()}
    else if(unlocked)showResult();
    else{idx=Q.length;gate()}
  }
  function gate(){
    app.innerHTML='<section class="bg-card panel"><div class="bg-prog"><span>آخر خطوة</span></div><div class="bg-bar"><i style="width:100%"></i></div><h2 class="bg-big">آخر خطوة قبل خطتك</h2><p class="bg-hint">اكتب اسمك وبريدك الإلكتروني لنعرض لك الخطة. سنحتفظ بإجاباتك لنراجعها ونتواصل معك.</p>'+
      '<form class="bg-gate" id="bgGate" novalidate><label for="bgName"><span>اسمك</span></label><input type="text" id="bgName" name="name" autocomplete="name" placeholder="الاسم الكامل" required><label for="bgEmail"><span>بريدك الإلكتروني</span></label><input type="email" id="bgEmail" name="email" autocomplete="email" dir="ltr" placeholder="name@company.com">'+
      '<input type="text" name="website" tabindex="-1" autocomplete="off" data-lpignore="true" data-1p-ignore data-bwignore aria-hidden="true" class="bg-hp"><small class="bg-me" id="bgErr" role="alert"></small><small>بإرسال بياناتك، توافق على أن نتواصل معك عليه.</small>'+
      '<div class="bg-nav"><button type="button" class="bg-btn btn btn--light" id="bgBack">رجوع</button><button type="submit" class="bg-go btn btn--wine" id="bgGo">شاهد خطتي</button></div></form></section>';
    document.getElementById('bgBack').onclick=function(){idx=Q.length-1;step()};
    document.getElementById('bgGate').onsubmit=send;
    top()
  }
  function send(e){
    e.preventDefault();var f=e.target,err=document.getElementById('bgErr'),go=document.getElementById('bgGo'),em=f.elements.email,nm=f.elements.name;err.textContent='';
    if(f.elements.website.value||sending)return;
    if(!nm.value.trim()){nm.setAttribute('aria-invalid','true');err.textContent='اكتب اسمك لنعرف من نخاطب.';nm.focus();return}
    nm.removeAttribute('aria-invalid');
    if(!/^\S+@\S+\.\S+$/.test(em.value.trim())){em.setAttribute('aria-invalid','true');err.textContent='اكتب بريدا إلكترونيا صحيحا، مثل name@company.com.';em.focus();return}
    em.removeAttribute('aria-invalid');PL=E.plan(A,S);
    var d=new FormData();d.append('الاسم',nm.value.trim());d.append('email',em.value.trim());
    Q.forEach(function(q){var v=A[q.id];d.append(q.title,q.budget?money(v):q.multi?(v||[]).map(function(x){return LABELS[q.id][x]}).join('، '):LABELS[q.id][v])});
    /* the figures sent to us always use the real prices: a visitor who changed them in the hidden settings (#admin) only changes what their own screen shows */
    var REAL=E.plan(A,E.DEFAULTS);
    d.append('التأسيس',money(REAL.foundationCost));d.append('المحتوى',money(REAL.contentCost));d.append('الإنفاق الإعلاني',money(REAL.adSpend));
    if(JSON.stringify(S)!==JSON.stringify(E.DEFAULTS))d.append('ملاحظة','عدل الزائر إعدادات الحاسبة في متصفحه؛ الأرقام أعلاه بالأسعار الأصلية');
    d.append('_subject','طلب خطة ميزانية من موقع أربعمية');d.append('_template','table');d.append('_captcha','false');
    var local=!SEND_ENABLED||/^(localhost|127\.0\.0\.1)$/.test(location.hostname);sending=true;go.disabled=true;
    /* the Sheet gets one row per distinct request: pressing "try again" after the email failed does not add the same row again */
    var sheetKey=JSON.stringify([nm.value.trim(),em.value.trim(),A]);
    if(!local&&sheetKey!==sheetSent){toSheet(d);sheetSent=sheetKey}
    (local?Promise.resolve():fetch(ENDPOINT,{method:'POST',body:d,headers:{Accept:'application/json'}}).then(function(x){return x.json().then(function(j){if(!x.ok||j.success==='false'||j.success===false)throw 0})}))
      .then(function(){sending=false;unlocked=true;showResult()})
      .catch(function(){sending=false;go.disabled=false;err.textContent='تعذر الإرسال. حاول مرة أخرى.'})
  }

  /* ============ report ============ */
  var SEG=[['foundation','التأسيس','bg-c1'],['content','صناعة المحتوى','bg-c2'],['mgmt','إدارة الحسابات','bg-c3'],['fees','أتعاب الحملات','bg-c4'],['ads','الإنفاق الإعلاني','bg-c5'],['left','المتبقي','bg-c6']];
  function segValues(p){return {foundation:p.foundationCost,content:p.contentCost,mgmt:p.mgmtCost,fees:p.campaignFee,ads:p.adSpend,left:p.remaining}}
  function donut(p){
    var v=segValues(p),R=54,C=2*Math.PI*R,off=0,arcs=SEG.map(function(s,i){
      var n=v[s[0]];if(n<=0)return '';var len=n/p.budget*C,o='<circle class="bg-seg '+s[2]+'" cx="70" cy="70" r="'+R+'" fill="none" stroke-width="16" stroke-dasharray="'+len.toFixed(2)+' '+(C-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 70 70)"/>';off+=len;return o}).join('');
    return '<svg class="bg-donut" viewBox="0 0 140 140" role="img" aria-label="توزيع الميزانية"><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="rgba(244,218,191,.12)" stroke-width="16"/>'+arcs+
      '<text x="70" y="66" text-anchor="middle" class="bg-dn">'+fmt(p.budget)+'</text><text x="70" y="86" text-anchor="middle" class="bg-dl">ريال</text></svg>'
  }
  function pct(n,t){return t?ar(Math.round(n/t*100))+'٪':'٠٪'}
  function summary(p){
    var v=segValues(p);
    return '<section class="bg-card panel bg-sum"><h3 class="bg-h">ملخص الميزانية</h3><div class="bg-sumrow">'+donut(p)+'<div class="bg-leg">'+
      SEG.map(function(s,i){return '<div class="bg-lg'+(v[s[0]]?'':' z')+'"><i class="'+s[2]+'"></i><span>'+s[1]+'</span><b>'+(v[s[0]]?fmt(v[s[0]]):'٠')+'</b><em>'+pct(v[s[0]],p.budget)+'</em></div>'}).join('')+
      '<div class="bg-lg bg-tot"><span>الميزانية الإجمالية</span><b>'+money(p.budget)+'</b></div></div></div>'+
      '<div class="bg-stack" role="img" aria-label="شريط توزيع الميزانية">'+SEG.map(function(s,i){return v[s[0]]>0?'<i class="'+s[2]+'" style="flex:'+v[s[0]]+'"></i>':''}).join('')+'</div></section>'
  }
  function foundationCard(p){
    var rows=p.foundation.map(function(f){return '<li class="ok">'+f.label+'</li>'}).concat(p.foundationDeferred.map(function(f){return '<li class="wait">'+f.label+'<small>مؤجل إلى المرحلة الثانية</small></li>'}));
    return '<section class="bg-card panel"><h3 class="bg-h">التأسيس</h3>'+(rows.length?'<ul class="bg-list">'+rows.join('')+'</ul>':'<p class="bg-note-l">لا يحتاج مشروعك إلى تأسيس الآن، فهويتك '+(A.site==='notNeeded'?'جاهزة ولا تحتاج إلى موقع حاليا.':'وموقعك جاهزان.')+'</p>')+'</section>'
  }
  function contentCard(p){
    var c=p.content,where=p.managed.concat(p.republish,p.selfPublish);
    if(!c)return '<section class="bg-card panel"><h3 class="bg-h">خطة المحتوى</h3><p class="bg-note-l">لا توجد ميزانية للمحتوى في هذه المرحلة.</p></section>';
    return '<section class="bg-card panel"><h3 class="bg-h">خطة المحتوى</h3><div class="bg-stats"><div><b>'+ar(c.v)+'</b><span>مقطع فيديو</span></div><div><b>'+ar(c.p)+'</b><span>بوست</span></div><div><b>'+ar(c.s)+'</b><span>ستوري</span></div></div>'+
      kv('المنصات المستهدفة',where.length?names(where):'تحدد لاحقا')+(p.campaigns?'<p class="bg-fine">يكفي هذا المحتوى لتغذية الحملة الإعلانية إلى جانب النشر المنتظم.</p>':'')+'</section>'
  }
  function mgmtCard(p){
    var h='<section class="bg-card panel"><h3 class="bg-h">إدارة الحسابات</h3>';
    if(A.accounts==='own')h+='<p class="bg-note-l">تدير حساباتك بنفسك، فلا نحتسب رسوم إدارة. نسلمك المحتوى جاهزا للنشر.</p>'+kv('تنشر عليها',names(p.selfPublish));
    else{
      h+=p.managed.length?kv('منصات تحت الإدارة',chips(p.managed)):'<p class="bg-note-l">لا إدارة مستقلة في هذه المرحلة، ونسلمك المحتوى جاهزا لتنشره على حساباتك'+(A.accounts==='none'?' بعد أن تنشئها.':A.accounts==='inactive'?' بعد أن تعيد تشغيلها.':'.')+'</p>';
      if(p.republish.length)h+=kv('يعاد نشر المحتوى عليها دون إدارة مستقلة',chips(p.republish));
      if(p.managed.length&&A.accounts==='none')h+='<p class="bg-fine">نبدأ بتأسيس الحسابات وربطها بالهوية.</p>';
      if(p.managed.length&&A.accounts==='inactive')h+='<p class="bg-fine">نبدأ بإعادة تشغيل الحسابات وتحديث بياناتها.</p>'}
    if(p.whatsapp)h+='<p class="bg-fine">واتساب للأعمال قناة لاستقبال الطلبات، نربطه بالمحتوى والحملة دون إدارة مستقلة.</p>';
    if(p.notRecommended.length)h+='<p class="bg-fine">لا ننصح حاليا بـ '+names(p.notRecommended)+' لنشاطك.</p>';
    return h+'</section>'
  }
  function chips(l){return '<span class="bg-pills">'+l.map(function(k){return '<span class="bg-pill">'+pn(k)+'</span>'}).join('')+'</span>'}
  function kv(k,v){return '<div class="bg-kv"><span>'+k+'</span><span>'+v+'</span></div>'}
  function campaignCard(p){
    var h='<section class="bg-card panel"><h3 class="bg-h">الحملات الإعلانية</h3>';
    if(p.campaigns){
      h+='<div class="bg-stats"><div><b>'+ar(p.campaigns)+'</b><span>'+(p.campaigns===1?'حملة':'حملتان')+'</span></div><div><b>'+fmt(p.campaignFee)+'</b><span>أتعاب الإعداد والإدارة</span></div><div><b>'+fmt(p.adSpend)+'</b><span>الإنفاق الإعلاني</span></div></div>'+
        p.adPlatforms.map(function(x){return kv(pn(x.id),money(x.amount))}).join('')+'<p class="bg-fine">الإنفاق الإعلاني يدفع للمنصة مباشرة، ومنفصل عن أتعاب الإعداد والإدارة.</p>'}
    else h+=(A.ads==='none'?'<p class="bg-note-l">لا ترغب بالإعلانات حاليا، فلم نحتسب أي حملة.</p>':'<div class="bg-postponed"><b>الحملة مؤجلة</b><p>'+ar(PL.adReason)+'</p></div>');
    return h+'</section>'
  }
  function stepsCard(p){
    var L=[],f=p.foundation.map(function(x){return x.label});
    L.push(['إكمال التأسيس',f.length?f.join(' و'):(p.foundationDeferred.length?'مؤجل إلى المرحلة الثانية':'مشروعك جاهز ولا يحتاج إلى تأسيس'),f.length?'':'done']);
    L.push(['تجهيز الحسابات',A.accounts==='none'?'إنشاء الحسابات وربطها بالهوية':A.accounts==='inactive'?'إعادة تشغيل الحسابات وتحديث بياناتها':'مراجعة الحسابات وتجهيزها للنشر','']);
    L.push(['إنتاج المحتوى',p.content?ar(p.content.v)+' فيديو و'+ar(p.content.p)+' بوست'+(p.content.s?' و'+ar(p.content.s)+' ستوري':''):'عند اكتمال التأسيس','']);
    L.push(['بدء النشر',p.managed.length?'جدول نشر منتظم على '+names(p.managed):A.accounts==='own'?'تنشر المحتوى الجاهز على حساباتك':'نشر المحتوى على المنصات المختارة','']);
    L.push(['إطلاق الحملة',p.campaigns?'عند جاهزية التأسيس والمحتوى الإعلاني':'مؤجلة'+(A.ads==='none'?': لا ترغب بالإعلانات حاليا':''),p.campaigns?'':'off']);
    var h='<section class="bg-card panel"><h3 class="bg-h">الخطوات القادمة</h3><ol class="bg-tl">'+L.map(function(x){return '<li class="'+x[2]+'"><div><b>'+x[0]+'</b><small>'+x[1]+'</small></div></li>'}).join('')+'</ol>';
    if(!p.campaigns&&A.ads!=='none')h+='<p class="bg-fine">سبب تأجيل الحملة: '+ar(p.adReason)+'</p>';
    return h+'</section>'
  }
  function readCard(p){
    var L=p.insights.slice();
    return L.length?'<section class="bg-card panel"><h3 class="bg-h">قراءة المسوق لحالتك</h3><ul class="bg-skip">'+L.map(function(x){return '<li>'+ar(x)+'</li>'}).join('')+'</ul></section>':''
  }
  function deferredCard(p){
    var d=p.deferred.filter(function(x){return x.title!=='الحملة الإعلانية'});
    return d.length?'<section class="bg-card panel"><h3 class="bg-h">خدمات نقترح تأجيلها</h3><ul class="bg-list">'+d.map(function(x){return '<li class="wait">'+ar(x.title)+'<small>'+ar(x.reason)+'</small></li>'}).join('')+'</ul></section>':''
  }
  function showResult(){PL=E.plan(A,S);result()}
  function result(){
    var p=PL,alerts=p.alerts.map(function(t){return '<div class="bg-note bad">'+ar(t)+'</div>'}).join('');
    var h='<div class="bg-rep"><section class="bg-card panel bg-head"><span class="bg-eb">خطتك التسويقية</span><h2 class="bg-big">خطتك التسويقية المقترحة</h2><p class="bg-note-l">بناء على إجاباتك، حللنا مشروعك ووزعنا ميزانيتك على ما يحتاجه فعلا. الأرقام تقديرية وقابلة للتعديل بعد مراجعة تفاصيل مشروعك.</p></section>'+
      (alerts?'<div class="bg-notes">'+alerts+'</div>':'');
    if(p.foundationBlocked)h+=readCard(p)+deferredCard(p);
    else h+=summary(p)+readCard(p)+foundationCard(p)+contentCard(p)+mgmtCard(p)+campaignCard(p)+deferredCard(p)+stepsCard(p);
    h+='<section class="bg-card panel"><h3 class="bg-h">خطوتك القادمة</h3><p class="bg-fine">هذه التوصيات تقديرية، ويعتمد نطاق العمل والتكلفة النهائية بعد مراجعة تفاصيل المشروع. زيادة عدد الحملات أو المنصات لا تعني دائما أنها الخيار الأفضل، فالقرار يعتمد على الجمهور والنتائج والهدف. الأسعار المعروضة افتراضية لغرض التوضيح فقط، ولا يعتمد عليها عند طلب الخدمات أو التعاقد.</p>'+
      '<a class="flipbtn fb--cream bg-cta" href="contact.html"><span class="fb-in"><span class="fb-f">تواصل معنا<i>♠︎</i></span><span class="fb-b" aria-hidden="true">تواصل معنا<i>♠︎</i></span></span></a></section>'+
      '<div class="bg-actions"><button type="button" class="bg-go btn btn--wine" id="bgCopy">نسخ ملخص الخطة</button><a class="bg-btn bg-x btn btn--light" id="bgX" target="_blank" rel="noopener" href="https://x.com/intent/post?text='+encodeURIComponent('جربت حاسبة التسويق من @arbaamia وعرفت وين أوزع ميزانيتي التسويقية 🧮 جربها مجانا: https://arbaamia.sa/budget.html')+'">شارك على إكس</a><button type="button" class="bg-btn btn btn--light" id="bgEdit">تعديل إجاباتي</button><button type="button" class="bg-btn btn btn--light" id="bgReset">ابدأ من جديد</button></div></div>';
    var y=window.scrollY;app.innerHTML=h;
    document.getElementById('bgCopy').onclick=copySummary;
    document.getElementById('bgEdit').onclick=function(){idx=0;step()};
    document.getElementById('bgReset').onclick=function(){A={goals:[],platforms:[]};idx=-1;unlocked=false;PL=null;result.shown=false;intro()};
    if(!result.shown){result.shown=true;top()}else window.scrollTo(0,y)
  }
  function copySummary(){
    var p=PL,lines=['خطتي التسويقية من أربعمية (تقدير مبدئي)','ميزانيتي: '+money(p.budget),''];
    if(p.foundation.length){lines.push('التأسيس: '+money(p.foundationCost));p.foundation.forEach(function(f){lines.push('- '+f.label)});lines.push('')}
    if(p.content)lines.push('المحتوى: '+ar(p.content.v)+' فيديو، '+ar(p.content.p)+' بوست'+(p.content.s?'، '+ar(p.content.s)+' ستوري':''));
    if(p.mgmtCount)lines.push('إدارة الحسابات: '+names(p.managed));
    if(p.campaigns)lines.push(ar(p.campaigns)+' حملة إعلانية، أتعابها '+money(p.campaignFee)+' وإنفاقها الإعلاني '+money(p.adSpend));
    else if(A.ads!=='none')lines.push('الحملة الإعلانية: مؤجلة');
    if(p.remaining>0)lines.push('المتبقي: '+money(p.remaining));
    lines.push('','تقديرات أولية، والتكلفة النهائية بعد مراجعة تفاصيل المشروع.');
    function done(ok){var t=document.createElement('div');t.className='bg-toast';t.setAttribute('role','status');t.textContent=ok?'تم نسخ الملخص':'تعذر النسخ. حدد النص وانسخه يدويا.';document.body.appendChild(t);setTimeout(function(){t.remove()},2200)}
    try{navigator.clipboard.writeText(lines.join('\n')).then(function(){done(true)},function(){done(false)})}catch(e){done(false)}
  }

  /* ============ hidden settings ============ */
  /* [path, label, scale]: scale turns a stored fraction into a percent for the field */
  var FIELDS=[
    ['التأسيس',[['prices.identityNew','هوية جديدة'],['prices.identityDev','استكمال أو تطوير الهوية'],['prices.siteNew','موقع جديد'],['prices.siteDev','تطوير موقع قائم']]],
    ['المحتوى',[['prices.video','سعر الفيديو'],['prices.post','سعر البوست'],['prices.story','سعر الستوري'],['content.targetVideos','فيديوهات الباقة الكاملة'],['content.targetPosts','بوستات الباقة الكاملة'],['content.targetStories','ستوريات الباقة الكاملة'],['content.minReserve','محتوى محجوز عند تقسيم التأسيس']]],
    ['الإدارة',[['prices.mgmtPlatform','إدارة المنصة شهريا'],['mgmt.noneBelowBudget','لا إدارة تحت ميزانية'],['mgmt.singleBelowBudget','منصة واحدة تحت ميزانية'],['mgmt.maxSharePct','أعلى حصة للإدارة (٪)'],['mgmt.maxPlatformsWithAds','أعلى منصات مدارة مع حملة'],['mgmt.maxPlatformsNoAds','أعلى منصات مدارة بلا حملة']]],
    ['الحملات',[['prices.campaignFee','أتعاب إعداد وإدارة حملة'],['ads.minSpendPerPlatform','أقل إنفاق إعلاني لكل منصة'],['ads.maxAdPlatforms','أعلى منصات إعلانية'],['ads.campaignMinVideos','أقل فيديوهات لحملة'],['ads.campaignMinPosts','أقل بوستات لحملة'],['ads.twoCampaignsMinRemaining','أقل متبق لحملتين'],['ads.recommendMinBudget','أقل ميزانية لتوصية الإعلان'],['ads.ratioGood','نسبة الإعلان: أداء سابق جيد (٪)',100],['ads.ratioNone','نسبة الإعلان: بلا بيانات (٪)',100],['ads.ratioWeak','نسبة الإعلان: أداء ضعيف (٪)',100]]]
  ];
  function getPath(o,p){return p.split('.').reduce(function(a,k){return a[k]},o)}
  function setPath(o,p,v){var k=p.split('.'),l=k.pop(),t=k.reduce(function(a,x){return a[x]},o);t[l]=v}
  var adminEl=null,lastFocus=null;
  function adminOpen(){
    if(adminEl)return;lastFocus=document.activeElement;
    adminEl=document.createElement('div');adminEl.className='bg-adm';adminEl.setAttribute('role','dialog');adminEl.setAttribute('aria-modal','true');adminEl.setAttribute('aria-labelledby','bgAdmT');
    adminEl.innerHTML='<div class="bg-adm-in"><div class="bg-adm-h"><h2 id="bgAdmT">إعدادات الحاسبة</h2><button type="button" class="bg-btn btn btn--light" id="bgAdmX" aria-label="إغلاق">إغلاق</button></div>'+
      '<p class="bg-fine">تحفظ التعديلات في هذا المتصفح فقط وتنعكس فورا على النتائج. لتثبيتها للجميع انسخ الإعدادات وضعها في DEFAULTS داخل 44-budget-engine.js.</p>'+
      FIELDS.map(function(g){return '<fieldset class="bg-adm-g"><legend>'+g[0]+'</legend>'+g[1].map(function(f){var id='bgf-'+f[0].replace(/\./g,'-'),sc=f[2]||1;return '<label for="'+id+'"><span>'+f[1]+'</span><input type="number" step="any" id="'+id+'" data-p="'+f[0]+'" data-sc="'+sc+'" value="'+Math.round(getPath(S,f[0])*sc*100)/100+'"></label>'}).join('')+'</fieldset>'}).join('')+
      '<fieldset class="bg-adm-g"><legend>أداء الإعلانات السابق</legend><label for="bgf-hist"><span>الافتراضي للحاسبة</span><select id="bgf-hist"><option value="none">لا توجد بيانات</option><option value="good">جيد</option><option value="weak">ضعيف</option></select></label></fieldset>'+
      '<fieldset class="bg-adm-g"><legend>كل الإعدادات (JSON)</legend><textarea id="bgAdmJ" dir="ltr" rows="10" spellcheck="false" aria-label="الإعدادات بصيغة JSON"></textarea><small class="bg-me" id="bgAdmE" role="alert"></small><div class="bg-nav"><button type="button" class="bg-go btn btn--wine" id="bgAdmApply">تطبيق</button><button type="button" class="bg-btn btn btn--light" id="bgAdmCopy">نسخ</button><button type="button" class="bg-btn btn btn--light" id="bgAdmReset">إعادة الضبط</button></div></fieldset></div>';
    document.body.appendChild(adminEl);
    var hist=document.getElementById('bgf-hist'),ta=document.getElementById('bgAdmJ');hist.value=S.ads.history;
    function sync(){ta.value=JSON.stringify(S,null,2)}
    function changed(skip){if(!skip)saveSettings();sync();if(PL&&unlocked&&idx>=Q.length-1&&app.querySelector('.bg-rep')){var y=window.scrollY;PL=E.plan(A,S);result();window.scrollTo(0,y)}}
    sync();
    [].forEach.call(adminEl.querySelectorAll('input[data-p]'),function(i){i.oninput=function(){var n=parseFloat(i.value);if(isFinite(n)){setPath(S,i.dataset.p,n/Number(i.dataset.sc));changed()}}});
    hist.onchange=function(){S.ads.history=hist.value;changed()};
    document.getElementById('bgAdmApply').onclick=function(){try{S=E.merge(E.DEFAULTS,JSON.parse(ta.value));document.getElementById('bgAdmE').textContent='';saveSettings();adminClose();adminOpen();changed()}catch(e){document.getElementById('bgAdmE').textContent='صيغة JSON غير صحيحة.'}};
    document.getElementById('bgAdmCopy').onclick=function(){try{navigator.clipboard.writeText(ta.value)}catch(e){ta.select()}};
    document.getElementById('bgAdmReset').onclick=function(){S=E.clone(E.DEFAULTS);try{localStorage.removeItem(STORE)}catch(e){}adminClose();adminOpen();changed(true)};
    document.getElementById('bgAdmX').onclick=adminClose;
    adminEl.addEventListener('keydown',function(e){
      if(e.key==='Escape'){adminClose();return}
      if(e.key!=='Tab')return;
      var f=[].filter.call(adminEl.querySelectorAll('button,input,select,textarea'),function(x){return !x.disabled}),a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});
    document.getElementById('bgAdmX').focus()
  }
  function adminClose(){if(!adminEl)return;adminEl.remove();adminEl=null;if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  addEventListener('keydown',function(e){if(e.ctrlKey&&e.shiftKey&&(e.key==='A'||e.key==='a')){e.preventDefault();adminEl?adminClose():adminOpen()}});
  addEventListener('hashchange',function(){if(location.hash==='#admin')adminOpen()});
  if(location.hash==='#admin')adminOpen();
  intro();
})();
