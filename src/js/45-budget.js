/* budget calculator: one question per screen, an email gate, then an editable report.
   Rule: the setup (identity, website) is paid first, then the rest of the budget is split by a marketer's priorities:
   content on the platforms that suit the goal, account management when the budget allows, and an ad campaign when it can be launched properly.
   Prices live at the top, so changing them never touches the logic. Engine and report follow the team's version (steppers, setup checkboxes, month-two view, copy summary). */
(function(){
  var app=document.getElementById('bgApp');if(!app)return;
  var ENDPOINT='https://formsubmit.co/ajax/arbaamia.sa@gmail.com';
  /* while false, nothing is sent (the gate just opens the result). On localhost nothing is sent either. */
  var SEND_ENABLED=true;

  /* ============ prices (SAR): edit here only ============ */
  var PRICES={identity:2000,website:2000,partial:.8,design:100,video:150,story:50,tweet:50,mgmt:1000,campaignFee:1000,adSpend:1500};   /* partial: improving or finishing costs 80% of building from scratch; mgmt per platform per month; adSpend per platform per month (50 a day) */
  /* platform order by priority: the default, and the one for reach goals where video leads */
  var PRIORITY={dflt:['instagram','tiktok','x','linkedin','snapchat','other'],video:['tiktok','instagram','x','linkedin','snapchat','other']};
  /* share of the content budget that goes to video, by goal */
  var VIDEO_SHARE={sales:.55,requests:.55,newcust:.65,aware:.7,launch:.65};
  var VIDEO_PLATS=['instagram','tiktok','snapchat'];
  var MIN_PLAN=500;   /* the least that still pays for a plan: 5 posts */

  /* ============ questions ============ */
  var PLATFORMS=[['instagram','إنستغرام'],['tiktok','تيك توك'],['snapchat','سناب شات'],['x','إكس'],['linkedin','لينكدإن']];
  var STAGES=['معلومات المشروع','جاهزية العلامة التجارية','الحضور الرقمي والمحتوى','الإعلانات','الميزانية'];
  var Q=[
    {id:'type',stage:0,title:'ما طبيعة نشاطك التجاري؟',opts:[['store','متجر إلكتروني'],['food','مطعم أو مقهى'],['services','شركة خدمات'],['brand','علامة تجارية'],['startup','مشروع ناشئ'],['other','أخرى']]},
    {id:'goal',stage:0,title:'ما هدفك التسويقي الأهم الآن؟',opts:[['sales','زيادة المبيعات'],['requests','زيادة الطلبات والاستفسارات'],['newcust','الوصول إلى عملاء جدد'],['aware','زيادة الوعي بالعلامة التجارية'],['launch','إطلاق منتج أو خدمة جديدة']]},
    {id:'identity',stage:1,title:'هل لديك هوية بصرية؟',hint:'الهوية البصرية هي الشعار والألوان والخطوط التي تجعل علامتك معروفة من النظرة الأولى.',opts:[['full','نعم، متكاملة'],['partial','لدي شعار فقط، أو هوية تحتاج إلى تطوير'],['none','لا، أحتاج إلى تصميم هوية']]},
    {id:'website',stage:1,title:'هل لديك موقع إلكتروني؟',opts:[['good','نعم، ويعمل بشكل جيد'],['improve','لدي موقع يحتاج إلى تطوير'],['none','لا أملك موقعا']]},
    {id:'accounts',stage:2,title:'ما وضع حساباتك على منصات التواصل؟',opts:[['managed','نشطة وتديرها جهة أخرى'],['self','نشطة وأديرها بنفسي'],['inactive','موجودة لكنها غير نشطة'],['none','لا أملك حسابات']]},
    {id:'platforms',stage:2,multi:true,title:'ما المنصات التي تريد العمل عليها؟',hint:'يمكنك اختيار أكثر من منصة. سنقترح التركيز على الأنسب منها لنشاطك.',opts:PLATFORMS},
    {id:'ads',stage:3,title:'ماذا عن الإعلانات المدفوعة؟',hint:'الإعلان المدفوع هو مبلغ تدفعه للمنصة لتعرض إعلانك على جمهور أوسع.',opts:[['good','جربتها ونتائجها جيدة'],['bad','جربتها ونتائجها ضعيفة'],['none','لم أجربها وأرغب بها'],['no','لا أريد إعلانات حاليا']]},
    {id:'budget',stage:4,select:true,title:'كم تبلغ ميزانيتك المخصصة للتسويق؟',hint:'الميزانية الشهرية للتسويق، وتشمل أسعار الخدمات والإنفاق على الإعلانات، وأي تأسيس يحتاجه مشروعك مثل الهوية أو الموقع.',opts:[[2000,'٢٬٠٠٠ ريال'],[4000,'٤٬٠٠٠ ريال'],[6000,'٦٬٠٠٠ ريال'],[8000,'٨٬٠٠٠ ريال'],[10000,'١٠٬٠٠٠ ريال'],[12000,'١٢٬٠٠٠ ريال'],[14000,'١٤٬٠٠٠ ريال'],[16000,'١٦٬٠٠٠ ريال'],[18000,'١٨٬٠٠٠ ريال'],[20000,'٢٠٬٠٠٠ ريال أو أكثر']]}
  ];
  var LABELS={};Q.forEach(function(q){LABELS[q.id]={};q.opts.forEach(function(o){LABELS[q.id][o[0]]=o[1]})});

  /* ============ state ============ */
  var A={},idx=-1,P=null,C=null,S={},unlocked=false,sending=false;
  var DG='٠١٢٣٤٥٦٧٨٩';
  function ar(n){return String(n).replace(/\d/g,function(d){return DG[d]})}
  function fmt(n){return ar(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,','))}
  function money(n){return fmt(n)+' ر.س'}
  /* the questions in asking order: by stage, then as listed */
  function visible(){return Q.map(function(q,i){return [q,i]}).filter(function(x){return !x[0].show||x[0].show(A)}).sort(function(a,b){return a[0].stage-b[0].stage||a[1]-b[1]}).map(function(x){return x[0]})}
  function platName(k){var p=PLATFORMS.filter(function(x){return x[0]===k})[0];return p?p[1]:k}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  /* ============ engine ============ */
  function pw(n){return n===1?'منصة واحدة':n===2?'منصتين':ar(n)+' منصات'}
  function needsFrom(a){
    var sel=(a.platforms&&a.platforms.length)?a.platforms:['instagram'];
    var order=(a.goal==='newcust'||a.goal==='aware')?PRIORITY.video:PRIORITY.dflt;
    var plats=sel.slice().sort(function(x,y){return order.indexOf(x)-order.indexOf(y)});
    return {plats:plats,platCount:Math.min(4,plats.length),managed:a.accounts==='managed',adsWanted:a.ads!=='no',adsExp:a.ads,
      block:a.type==='store'&&a.website==='none'}   /* a store without a site gets no campaign until the site is ready */
  }
  /* the n platforms to work on: the first, then one more video platform when the first is one, then the rest in order */
  function pickN(list,n){
    if(n>=list.length)return list.slice();
    if(n<=0)return [];
    var rest=list.slice(1),out=[list[0]];
    if(n>=2){
      var vid=VIDEO_PLATS.indexOf(list[0])>-1?rest.filter(function(x){return VIDEO_PLATS.indexOf(x)>-1})[0]:null,pick=vid||rest[0];
      out.push(pick);rest.splice(rest.indexOf(pick),1)}
    while(out.length<n)out.push(rest.shift());
    return out
  }
  /* the target monthly package: video first, then posts, then tweets, then stories */
  var CKEYS=['videos','designs','tweets','stories'];
  function cprice(){return {videos:PRICES.video,designs:PRICES.design,tweets:PRICES.tweet,stories:PRICES.story}}
  function pkgCost(t){var pr=cprice();return CKEYS.reduce(function(s,k){return s+t[k]*pr[k]},0)}
  function contentTargets(list){
    var hasX=list.indexOf('x')>-1,onlyX=hasX&&list.length===1;
    if(onlyX)return {videos:8,designs:6,tweets:30,stories:0};
    return {videos:15,designs:10,tweets:hasX?20:0,stories:7}
  }
  function fillContent(cb,t,ads,onlyX){
    var pr=cprice(),out={videos:0,designs:0,tweets:0,stories:0};
    if(ads){
      /* with a campaign: 10 videos and 10 posts (or tweets) first, then the rest of the package in order */
      var b10=10*pr.videos+10*(onlyX?pr.tweets:pr.designs),base=cb>=b10?10:6;
      out.videos=base;if(onlyX)out.tweets=base;else out.designs=base;
      var left=cb-CKEYS.reduce(function(s,k){return s+out[k]*pr[k]},0);
      CKEYS.forEach(function(k){while(t[k]>0&&left>=pr[k]&&out[k]<t[k]){out[k]++;left-=pr[k]}});
      return out}
    var full=pkgCost(t),f=Math.min(2,cb/full);
    CKEYS.forEach(function(k){out[k]=Math.floor(t[k]*f)});
    var left2=cb-CKEYS.reduce(function(s,k){return s+out[k]*pr[k]},0);
    CKEYS.forEach(function(k){while(t[k]>0&&left2>=pr[k]&&out[k]<Math.ceil(t[k]*f)){out[k]++;left2-=pr[k]}});
    return out
  }
  /* the monthly plan for the money left after setup: management, then the campaign, then content with what remains */
  function allocate(avail,n){
    var p={mgmt:0,contentList:[],designs:0,videos:0,stories:0,tweets:0,campaigns:0,ads:0,adSpend:0,reasons:[]},fee=PRICES.campaignFee,per=PRICES.mgmt;
    /* 1) platforms and management: a small budget goes to content, management comes with a larger one */
    var focus2=n.adsWanted&&n.platCount>=3&&avail>=4000&&!n.block;   /* three platforms and a campaign: focus on two and keep the rest for the campaign */
    var maxP=focus2?2:Math.min(4,n.platCount),top1=platName(n.plats[0]||'instagram'),second=n.plats.length>1?platName(pickN(n.plats,2)[1]):'',m=0,cp=maxP,platMsg='';
    if(avail<4000){
      cp=1;
      if(n.platCount>1)platMsg='اخترت '+ar(n.platCount)+' منصات، لكن ميزانيتك لا تكفي لتوزيعها عليها كلها. ننصحك بالتركيز على '+top1+' الآن، ثم التوسع لبقية المنصات عند رفع الميزانية.'}
    else if(avail<6000){
      m=n.managed?0:1;cp=Math.min(2,maxP);
      if(n.platCount>=2&&!n.managed)platMsg='اخترت '+ar(n.platCount)+' منصات، لكن إدارة كل منصة ستستهلك ميزانيتك كلها. الأفضل إدارة '+top1+' فقط، ونشر المحتوى نفسه على '+second+'.'}
    else{
      m=n.managed?0:maxP;
      while(m>1&&m*per>avail*.4)m--;
      if(!n.managed&&m>0&&m<maxP)platMsg='ميزانيتك تكفي لإدارة '+pw(m)+' بإتقان، وننشر المحتوى نفسه على بقية منصاتك.'}
    var m0=m,contentList=pickN(n.plats,cp),targets=contentTargets(contentList),pkg=pkgCost(targets),onlyX=contentList.length===1&&contentList[0]==='x',postPrice=onlyX?PRICES.tweet:PRICES.design;
    /* 2) ads: 10 videos and 10 posts before a campaign when possible, otherwise lighten content, then management, to still launch it */
    var k=0,c=0,spend=0,rem=avail-m*per,redM=false,redC=false;
    if(n.adsWanted){
      if(n.block)p.reasons.push('الحملات تبدأ بعد جاهزية الموقع، لأن الإعلان بلا موقع يهدر الميزانية. صرفنا ميزانيتها في هذه الفترة على المحتوى.');
      else if(avail>=4000){
        var cc=(avail>=18000&&n.adsExp!=='bad')?2:1,share=({good:.6,none:.5,bad:.4})[n.adsExp]||.5,kCap=n.platCount>=3?2:Math.min(4,n.platCount),tries=[[10,0],[6,0]];
        for(var ti=0;ti<tries.length&&!k;ti++){
          var cnt=tries[ti][0],mmin=tries[ti][1],minC=cnt*PRICES.video+cnt*postPrice;
          for(var mm=m0;mm>=mmin&&!k;mm--){
            var r2=avail-mm*per;
            for(var kk=kCap;kk>=1;kk--){
              var pool=r2-cc*fee,lo=PRICES.adSpend*kk,hi=Math.floor((pool-minC)/100)*100,ad=Math.max(Math.round(pool*share/100)*100,lo);   /* never below the minimum per platform */
              if(ad>hi)ad=hi;
              if(ad>=lo){k=kk;c=cc;spend=ad;m=mm;rem=r2;redM=mm<m0;redC=cnt<10;break}}}}}
      if(k>0){
        var dropM=redM&&m===0;
        if(focus2&&dropM)p.reasons.push('اخترت '+ar(n.platCount)+' منصات وتحتاج حملة، فننصحك بالنشر على منصتين فقط، والاستغناء عن إدارة الحساب لتنشر المحتوى والمقاطع بنفسك، ونوجه الميزانية لإطلاق الحملة لأنها مهمة أيضا.');
        else if(focus2)p.reasons.push('اخترت '+ar(n.platCount)+' منصات وتحتاج حملة، فننصحك بتحديد منصتين فقط للإدارة والمحتوى، ونوفر الباقي للحملة لأنها مهمة أيضا.');
        else if(k<n.platCount)p.reasons.push(n.platCount>=3&&k===2?'اخترت '+ar(n.platCount)+' منصات، وننصحك بالإعلان على منصتين فقط ليتركز الإنفاق ويعطي نتيجة أفضل.':'ميزانيتك تكفي للإعلان على '+pw(k)+' الآن، ويمكن إضافة غيرها عند رفع الميزانية.');
        if(dropM&&!focus2)p.reasons.push('ننصحك بالاستغناء عن إدارة الحساب، وأن تنشر المحتوى والمقاطع بنفسك، ونوجه الميزانية لإطلاق الحملة.');
        else if(redM&&!dropM)p.reasons.push('خففنا عدد المنصات المدارة لنتمكن من إطلاق الحملة.');
        if(redC)p.reasons.push('خففنا عدد المحتوى قليلا لنتمكن من إطلاق الحملة، مع إبقاء عدد جيد منه.')}
      else{
        if(platMsg)p.reasons.push(platMsg);
        if(!n.block)p.reasons.push('الميزانية المتاحة لا تكفي لإطلاق حملة الآن، فنقترح البدء بالمحتوى وتأجيل الحملة أو رفع الميزانية.')}}
    if(!n.adsWanted&&platMsg)p.reasons.push(platMsg);
    if(n.adsWanted&&n.block&&platMsg)p.reasons.push(platMsg);
    /* 3) content: what remains up to the package; with a campaign, anything above the package goes to ad spend */
    var cb=Math.max(0,rem-c*fee-spend);
    if(k>0&&cb>pkg){var extra=Math.floor((cb-pkg)/100)*100;spend+=extra;cb-=extra}
    else cb=Math.min(cb,pkg*2);
    var out=fillContent(cb,targets,k>0,onlyX);
    p.videos=out.videos;p.designs=out.designs;p.tweets=out.tweets;p.stories=out.stories;
    p.mgmt=m;p.contentList=contentList;p.ads=k;p.campaigns=c;p.adSpend=spend;
    return p
  }
  function setupItems(a){
    var items=[],part=Math.round(PRICES.identity*PRICES.partial);
    if(a.identity==='partial')items.push({id:'identity',label:'استكمال الهوية البصرية وتطويرها',note:'أقل بـ ٢٠٪ من تصميم هوية جديدة، ويراجع النطاق',cost:part});
    if(a.identity==='none')items.push({id:'identity',label:'تصميم هوية بصرية متكاملة',note:'مرة واحدة',cost:PRICES.identity});
    if(a.website==='none')items.push({id:'website',label:'إنشاء موقع إلكتروني متكامل',note:'يشمل التصميم وكتابة المحتوى وإنشاء الموقع',cost:PRICES.website,optional:a.type==='food',optNote:'اختياري لنشاطك، فمعظم المطاعم والمقاهي تكتفي بالحسابات'});
    if(a.website==='improve')items.push({id:'website',label:'تطوير الموقع الحالي',note:'أقل بـ ٢٠٪ من إنشاء موقع جديد، ويحدد السعر النهائي بعد مراجعة المتطلبات',cost:Math.round(PRICES.website*PRICES.partial)});
    if(a.accounts==='none'||a.accounts==='inactive')items.push({id:'accounts',label:a.accounts==='none'?'تأسيس الحسابات وتجهيزها':'تفعيل الحسابات وتجهيزها',note:'تجهيز الحسابات قبل بدء النشر',cost:0});
    return items
  }
  /* setup is paid first and the rest goes to the plan; when it is too little for a plan, the report says so */
  function rebuild(){
    var items=setupItems(A);items.forEach(function(i){if(!(i.id in S))S[i.id]=!i.optional});
    var setupTotal=items.filter(function(i){return S[i.id]}).reduce(function(s,i){return s+i.cost},0),B=A.budget,needs=needsFrom(A);
    needs.block=needs.block&&!!S.website;
    var R=B-setupTotal,fits=R>=MIN_PLAN;
    P=fits?allocate(R,needs):{mgmt:0,contentList:[],designs:0,videos:0,stories:0,tweets:0,campaigns:0,ads:0,adSpend:0,reasons:[]};
    C={items:items,setupTotal:setupTotal,B:B,needs:needs,R:R,fits:fits,next:(setupTotal>0||needs.block)?allocate(B,Object.assign({},needs,{block:false})):null}
  }
  function contentCount(p){return p.designs+p.videos+p.stories+p.tweets}
  function monthly(p){return p.mgmt*PRICES.mgmt+p.designs*PRICES.design+p.videos*PRICES.video+p.stories*PRICES.story+p.tweets*PRICES.tweet+p.campaigns*PRICES.campaignFee+p.adSpend}

  /* ============ screens ============ */
  function top(){app.scrollIntoView({block:'start',behavior:'smooth'})}
  function intro(){
    app.innerHTML='<section class="bg-card"><h2 class="bg-big">اعرف أين تنفق ميزانيتك التسويقية</h2>'+
      '<p class="bg-note-l">أجب عن أسئلة قصيرة، لتحصل على خطة تسويقية تناسب مشروعك وميزانيته، دون أن تدفع مقابل خدمات لا تحتاجها.</p>'+
      '<ul class="bg-axes"><li><span>١</span>خدمات التأسيس: تدفع مرة واحدة</li><li><span>٢</span>الخدمات الشهرية: المحتوى وإدارة الحسابات</li><li><span>٣</span>الحملات الإعلانية: أتعاب الحملة والإنفاق الإعلاني</li></ul>'+
      '<div class="bg-nav"><button type="button" class="bg-go" id="bgStart">ابدأ الآن</button></div></section>';
    document.getElementById('bgStart').onclick=function(){idx=0;step()}
  }
  /* one question per screen, then the email screen. A single-choice answer moves on by itself; multi-choice questions use the next button. */
  var autoTimer=null;
  function stepCount(){return visible().length+1}
  function stepQs(n){var q=visible()[n];return q?[q]:[]}
  function later(fn){clearTimeout(autoTimer);autoTimer=setTimeout(fn,260)}
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
    var qs=stepQs(idx),y=window.scrollY,last=idx===visible().length-1,total=stepCount();
    app.innerHTML='<section class="bg-card"><div class="bg-prog"><span>الخطوة '+ar(idx+1)+' من '+ar(total)+'</span></div>'+
      '<div class="bg-bar"><i style="width:'+((idx+1)/total*100)+'%"></i></div>'+
      '<h2 class="bg-big">'+STAGES[qs[0].stage]+'</h2>'+qs.map(qBlock).join('')+'<small class="bg-me" id="bgErr" role="alert"></small>'+
      '<div class="bg-nav"><button type="button" class="bg-btn" id="bgBack">رجوع</button><button type="button" class="bg-go" id="bgNext">'+(last&&unlocked?'شاهد النتيجة':'التالي')+'</button></div></section>';
    document.getElementById('bgBack').onclick=function(){clearTimeout(autoTimer);if(idx===0){idx=-1;intro()}else{idx--;step()}};
    document.getElementById('bgNext').onclick=function(){
      clearTimeout(autoTimer);
      var m=stepQs(idx).filter(function(q){return !answered(q)});
      if(m.length){document.getElementById('bgErr').textContent='أجب عن جميع أسئلة هذه الخطوة قبل المتابعة.';var f=app.querySelector('[data-id="'+m[0].id+'"]');f.classList.add('miss');f.scrollIntoView({block:'center',behavior:'smooth'});return}
      advance()};
    [].forEach.call(app.querySelectorAll('.bg-sel'),function(s){s.onchange=function(){A[s.dataset.q]=s.value===''?undefined:Number(s.value);if(s.value!=='')later(advance)}});
    [].forEach.call(app.querySelectorAll('.bg-opt'),function(b){b.onclick=function(){
      var q=Q.filter(function(x){return x.id===b.dataset.q})[0],raw=b.dataset.v,v=q.id==='budget'?Number(raw):raw;
      if(q.multi){var cur=(A[q.id]||[]).slice();
        if(cur.indexOf(v)>-1)cur=cur.filter(function(x){return x!==v});
        else{if(q.exclusive===v)cur=[v];else{cur=cur.filter(function(x){return x!==q.exclusive});cur.push(v)}}
        A[q.id]=cur}
      else A[q.id]=v;
      var id=q.id;step(true);var f=app.querySelector('.bg-opt[data-q="'+id+'"][data-v="'+raw+'"]');if(f)f.focus({preventScroll:true});
      if(!q.multi)later(advance)}});
    if(keepScroll)window.scrollTo(0,y);else top()
  }
  function advance(){
    if(idx<visible().length-1){idx++;step()}
    else if(unlocked){S={};rebuild();result()}
    else{idx=visible().length;gate()}
  }
  function gate(){
    app.innerHTML='<section class="bg-card"><div class="bg-prog"><span>الخطوة '+ar(stepCount())+' من '+ar(stepCount())+'</span></div><div class="bg-bar"><i style="width:100%"></i></div><h2 class="bg-big">آخر خطوة قبل نتيجتك</h2><p class="bg-hint">اكتب اسمك وبريدك الإلكتروني لنعرض لك الخطة. سنحتفظ بإجاباتك لنراجعها ونتواصل معك.</p>'+
      '<form class="bg-gate" id="bgGate" novalidate><label for="bgName"><span>اسمك</span></label><input type="text" id="bgName" name="name" autocomplete="name" placeholder="الاسم الكامل" required><label for="bgEmail"><span>بريدك الإلكتروني</span></label><input type="email" id="bgEmail" name="email" autocomplete="email" dir="ltr" placeholder="name@company.com">'+
      '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="bg-hp"><small class="bg-me" id="bgErr" role="alert"></small><small>بإرسال بياناتك، توافق على أن نتواصل معك عليه.</small>'+
      '<div class="bg-nav"><button type="button" class="bg-btn" id="bgBack">رجوع</button><button type="submit" class="bg-go" id="bgGo">شاهد النتيجة</button></div></form></section>';
    document.getElementById('bgBack').onclick=function(){idx=visible().length-1;step()};
    document.getElementById('bgGate').onsubmit=send;
    top()
  }
  function send(e){
    e.preventDefault();var f=e.target,err=document.getElementById('bgErr'),go=document.getElementById('bgGo'),em=f.elements.email,nm=f.elements.name;err.textContent='';
    if(f.elements.website.value||sending)return;
    if(!nm.value.trim()){nm.setAttribute('aria-invalid','true');err.textContent='اكتب اسمك لنعرف من نخاطب.';nm.focus();return}
    nm.removeAttribute('aria-invalid');
    if(!/^\S+@\S+\.\S+$/.test(em.value.trim())){em.setAttribute('aria-invalid','true');err.textContent='اكتب بريدا إلكترونيا صحيحا، مثل name@company.com.';em.focus();return}
    em.removeAttribute('aria-invalid');S={};rebuild();
    var d=new FormData();d.append('الاسم',nm.value.trim());d.append('email',em.value.trim());
    visible().forEach(function(q){var v=A[q.id];d.append(q.title,q.multi?(v||[]).map(function(x){return LABELS[q.id][x]}).join('، '):LABELS[q.id][v])});
    d.append('التأسيس لمرة واحدة',money(C.setupTotal));d.append('التشغيل الشهري المقترح',money(monthly(P)));
    d.append('_subject','طلب خطة ميزانية من موقع أربعمية');d.append('_template','table');d.append('_captcha','false');
    var local=!SEND_ENABLED||/^(localhost|127\.0\.0\.1)$/.test(location.hostname);sending=true;go.disabled=true;
    (local?Promise.resolve():fetch(ENDPOINT,{method:'POST',body:d,headers:{Accept:'application/json'}}).then(function(x){return x.json().then(function(j){if(!x.ok||j.success==='false'||j.success===false)throw 0})}))
      .then(function(){sending=false;unlocked=true;result()})
      .catch(function(){sending=false;go.disabled=false;err.textContent='تعذر الإرسال. حاول مرة أخرى.'})
  }

  /* ============ report ============ */
  /* the readiness rows: each is 1 (ready), between 0 and 1 (needs work) or 0 (missing) */
  function readiness(){
    var rows=[['الهوية البصرية',{full:1,partial:.5,none:0}[A.identity]],['الموقع الإلكتروني',{good:1,improve:.5,none:0}[A.website]],['حسابات التواصل',{managed:1,self:.7,inactive:.4,none:0}[A.accounts]]];
    if(A.ads!=='no')rows.push(['الخبرة مع الإعلانات',{good:1,bad:.4,none:.2}[A.ads]]);
    var pct=Math.round(rows.reduce(function(s,r){return s+r[1]},0)/rows.length*100);
    return {rows:rows,pct:pct,label:pct<35?'مشروعك في بداية الطريق':pct<70?'جاهزيتك متوسطة، وبعض الأساسيات ناقصة':'مشروعك جاهز للنمو'}
  }
  function priorities(){
    var L=[],on=function(id){return C.items.filter(function(i){return i.id===id&&(i.cost===0||S[i.id])})[0]};
    if(on('identity'))L.push(['الهوية البصرية','تبدأ منها كل المواد التسويقية الأخرى.']);
    if(on('website'))L.push([A.website==='improve'?'تطوير الموقع الإلكتروني':'إنشاء الموقع الإلكتروني','يمنح عملاءك مكانا واضحا للتعرف عليك والتواصل معك.']);
    if(on('accounts'))L.push(['تجهيز الحسابات','حتى يكون للمحتوى والإعلان وجهة جاهزة.']);
    if(contentCount(P)>0)L.push(['صناعة المحتوى','محتوى منتظم تعيد توظيفه على أكثر من منصة.']);
    if(P.mgmt>0)L.push(['إدارة الحسابات','تنظيم النشر والمتابعة على '+pw(P.mgmt)+'.']);
    if(P.campaigns>0)L.push(A.ads==='bad'?['تحليل الحملات السابقة','نفهم سبب ضعف النتائج قبل رفع الإنفاق، ونبدأ بحملة تجريبية.']:['الحملات الإعلانية','حملة بهدف واضح على '+pw(Math.max(1,P.ads))+'.']);
    if(A.ads==='good'&&P.ads>=2)L.push(['التوسع التسويقي','نتائجك السابقة جيدة، فيمكن التوسع تدريجيا في المنصات والمؤثرين.']);
    if(!L.length)L.push(['رفع الميزانية أو انتظار الشهر القادم','حتى تبدأ الخطة.']);
    return L
  }
  /* why the plan looks the way it does, in plain words */
  function why(){
    var L=[],vc=P.videos*PRICES.video,cc=vc+P.designs*PRICES.design+P.tweets*PRICES.tweet+P.stories*PRICES.story;
    if(!C.needs.managed&&P.mgmt>0)L.push('وزعنا الإدارة على المنصات التي اخترتها، لأن كل منصة تحتاج من يتابعها باستمرار.');
    if(vc>0){var vs=Math.round(vc/cc*100);L.push('خصصنا '+ar(vs)+'٪ من ميزانية المحتوى للفيديو، لأنه '+(vs>=55?'الأقوى في الوصول لعملاء جدد.':'مناسب لهدفك، مع بوستات تخدم العروض والرسائل المباشرة.'))}
    if(P.campaigns>0&&A.ads==='none')L.push('بما أنك لم تجرب الإعلان من قبل، نبدأ بعدد محدود من المنصات ونكبر الإنفاق عندما تظهر النتائج.');
    if(P.campaigns>0&&A.ads==='bad')L.push('بدأنا بمنصة واحدة لنختبر ونحلل سبب ضعف النتائج، قبل أن نصرف أكثر.');
    if(P.campaigns>0)L.push('أبقينا ميزانية كافية للمحتوى الذي يغذي الحملة.');
    return L
  }
  function notNeeded(){
    var L=[],web=C.items.filter(function(i){return i.id==='website'&&i.optional})[0];
    if(A.identity==='full')L.push('الهوية البصرية: لديك هوية متكاملة');
    if(A.website==='good')L.push('الموقع الإلكتروني: موقعك يعمل بشكل جيد');
    if(web&&!S.website)L.push('الموقع الإلكتروني: اختياري لنشاطك حاليا');
    if(A.accounts==='managed')L.push('إدارة الحسابات: لديك جهة تديرها');
    else if(C.fits&&P.mgmt===0)L.push('إدارة الحسابات: لا تتسع لها الميزانية حاليا');
    if(C.fits&&P.campaigns===0)L.push('الحملات الإعلانية: '+(A.ads==='no'?'لا ترغب بها حاليا':'مؤجلة حاليا'));
    return L
  }
  /* one plan, in words: "15 videos, 10 posts, 2 platforms managed, 1 campaign" */
  function describe(p){
    var t=[ar(p.videos)+' مقطع',ar(p.designs)+' بوست'];
    if(p.tweets)t.push(ar(p.tweets)+' تغريدة');
    if(p.stories)t.push(ar(p.stories)+' ستوري');
    t.push(p.mgmt?'إدارة '+pw(p.mgmt):'بلا إدارة');
    t.push(p.campaigns===1?'حملة واحدة':p.campaigns?ar(p.campaigns)+' حملات':'بلا حملات');
    return t.join('، ')
  }
  function stepRow(key,label,sub,val,cost,max){
    return '<div class="bg-line"><div class="bg-lt">'+label+(sub?'<small>'+sub+'</small>':'')+'</div><div class="bg-step" dir="ltr">'+
      '<button type="button" data-k="'+key+'" data-d="-1" aria-label="تقليل '+label+'"'+(val<=0?' disabled':'')+'>−</button><output>'+ar(val)+'</output>'+
      '<button type="button" data-k="'+key+'" data-d="1" aria-label="زيادة '+label+'"'+(val>=max?' disabled':'')+'>+</button></div><div class="bg-lc">'+fmt(cost)+'</div></div>'
  }
  function kv(k,v){return '<div class="bg-kv"><span>'+k+'</span><span>'+v+'</span></div>'}
  function result(){
    var m=C.fits?monthly(P):0,su=C.setupTotal,R=C.R,B=C.B,n=C.needs,pr=priorities(),rd=readiness(),wy=why(),nn=notNeeded(),warns=[],over=R<0||m>R;
    if(R<0)warns.push(['bad','تكاليف التأسيس ('+money(su)+') أكبر من ميزانيتك ('+money(B)+'). ارفع ميزانيتك، أو أجل أحد بنود التأسيس للشهر القادم.']);
    else if(!C.fits)warns.push(['bad','المتبقي بعد التأسيس ('+money(R)+') لا يكفي حتى لـ ٥ بوستات، فلا نقترح خطة. ارفع ميزانيتك، أو ابدأ بالتأسيس الآن وانتظر الشهر القادم لتبدأ الخطة بميزانية '+money(B)+'.']);
    else{
      if(m>R)warns.push(['bad','الخطة تتجاوز المتاح بمقدار '+money(m-R)+'. قلل أحد البنود.']);
      var seen={};P.reasons.forEach(function(r){if(!seen[r]){seen[r]=1;warns.push(['',r])}});
      if(P.campaigns>0&&P.designs+P.videos===0)warns.push(['','الحملة تحتاج إلى محتوى إعلاني، فأضف تصاميم أو مقاطع.'])}
    var names=function(l){return l.map(platName).join('، ')},showTweets=P.tweets>0||P.contentList.indexOf('x')>-1,nextM=C.next?monthly(C.next):m;
    var h='<div class="bg-rep">'+
      '<section class="bg-card"><h2 class="bg-big">ميزانيتك تستحق أن تستثمر بذكاء</h2><p class="bg-note-l">بناء على إجاباتك، حللنا احتياجات مشروعك وحددنا الخدمات التي تستحق أن تبدأ بها. هدفك الأهم: '+LABELS.goal[A.goal]+'.</p></section>'+
      '<section class="bg-tiles" aria-label="ملخص التكاليف"><div class="bg-tile"><small>تأسيس لمرة واحدة</small><b>'+fmt(su)+'</b><em>'+(su?'في الشهر الأول':'لا يوجد')+'</em></div><div class="bg-tile"><small>تشغيل شهري</small><b>'+fmt(m)+'</b><em>'+(su&&C.fits?'في الشهر الأول':'شامل الإعلان')+'</em></div><div class="bg-tile'+(over?' neg':'')+'"><small>ميزانيتك الشهرية</small><b>'+fmt(B)+'</b><em>'+(over?'الخطة تتجاوزها':'ريال')+'</em></div></section>'+
      (warns.length?'<div class="bg-notes">'+warns.map(function(w){return '<div class="bg-note'+(w[0]?' bad':'')+'">'+w[1]+'</div>'}).join('')+'</div>':'')+
      (C.fits||su>0?'<section class="bg-card"><h3 class="bg-h">كيف تدفع ميزانيتك</h3><p class="bg-sub">ميزانيتك الشهرية تغطي الخدمات والإنفاق على الإعلانات معا.</p>'+
        (su>0?kv('الشهر الأول','تأسيس '+fmt(su)+(C.fits?' + تشغيل '+fmt(m)+' = '+fmt(su+m):'')+' ريال')+(C.fits?kv('من الشهر الثاني','تشغيل '+fmt(nextM)+' ريال'):''):kv('كل شهر','تشغيل '+fmt(m)+' ريال'))+'</section>':'')+
      '<section class="bg-card"><h3 class="bg-h">جاهزية مشروعك</h3><div class="bg-meter"><span class="bg-pct">'+ar(rd.pct)+'٪</span><div class="bg-track" role="img" aria-label="نسبة الجاهزية '+ar(rd.pct)+'٪"><i style="width:'+rd.pct+'%"></i></div></div><p class="bg-sub">'+rd.label+'</p>'+
        rd.rows.map(function(r){return '<div class="bg-kv"><span>'+r[0]+'</span><span class="bg-pill '+(r[1]>=1?'good':r[1]>0?'warn':'bad')+'">'+(r[1]>=1?'جاهز':r[1]>0?'يحتاج تطوير':'غير متوفر')+'</span></div>'}).join('')+'</section>'+
      '<section class="bg-card"><h3 class="bg-h">أولوياتك التسويقية</h3><ol class="bg-prio">'+pr.map(function(p){return '<li><div>'+p[0]+'<small>'+p[1]+'</small></div></li>'}).join('')+'</ol></section>'+
      (C.items.length?'<section class="bg-card"><h3 class="bg-h">تكاليف التأسيس</h3><p class="bg-sub">تدفع مرة واحدة في الشهر الأول، ثم تبدأ الخطة بما يتبقى من ميزانيتك.</p>'+C.items.map(function(i){
        return '<label class="bg-chk">'+(i.cost>0?'<input type="checkbox" data-s="'+i.id+'"'+(S[i.id]?' checked':'')+'>':'<span class="bg-nochk"></span>')+'<span class="bg-lt">'+i.label+'<small>'+(i.optional&&!S[i.id]?i.optNote:i.note)+'</small></span><span class="bg-lc">'+(i.cost>0?fmt(i.cost):'ضمن الإدارة')+'</span></label>'}).join('')+
        '<div class="bg-total"><span>إجمالي التأسيس</span><span>'+money(su)+'</span></div><p class="bg-fine">النطاق والاستضافة وأي خصائص برمجية خاصة تراجع حسب المتطلبات.</p></section>':'')+
      (C.fits?'<section class="bg-card"><h3 class="bg-h">'+(su>0?'خطتك الشهرية للشهر الأول':'خطتك الشهرية')+'</h3><p class="bg-sub">عدل الأعداد كما تشاء، وستتحدث التكلفة فورا.</p>'+
        stepRow('videos','مقاطع فيديو','مع تعليق صوتي، '+fmt(PRICES.video)+' ريال للمقطع',P.videos,P.videos*PRICES.video,80)+stepRow('designs','بوستات',fmt(PRICES.design)+' ريال للبوست',P.designs,P.designs*PRICES.design,80)+(showTweets?stepRow('tweets','تغريدات',fmt(PRICES.tweet)+' ريال للتغريدة',P.tweets,P.tweets*PRICES.tweet,100):'')+stepRow('stories','ستوري',fmt(PRICES.story)+' ريال للستوري',P.stories,P.stories*PRICES.story,60)+
        stepRow('mgmt','منصات تحتاج إدارة',fmt(PRICES.mgmt)+' ريال لكل منصة',P.mgmt,P.mgmt*PRICES.mgmt,4)+stepRow('campaigns','حملات إعلانية','أتعاب الإعداد والإدارة، '+fmt(PRICES.campaignFee)+' ريال لكل حملة',P.campaigns,P.campaigns*PRICES.campaignFee,4)+
        (P.adSpend>0?'<div class="bg-line"><div class="bg-lt">الإنفاق الإعلاني<small>يدفع للمنصات الإعلانية'+(P.ads?'، نحو '+fmt(P.adSpend/P.ads)+' ريال لكل منصة':'')+'</small></div><div class="bg-lc">'+fmt(P.adSpend)+'</div></div>':'')+
        '<div class="bg-total"><span>إجمالي التشغيل الشهري</span><span>'+money(m)+'</span></div></section>'+
      '<section class="bg-card"><h3 class="bg-h">تفاصيل الخطة</h3>'+
        kv('منصات المحتوى',P.contentList.length?names(P.contentList):'لا يوجد')+kv('منصات الإدارة',P.mgmt?names(pickN(n.plats,P.mgmt)):'لا يوجد')+
        kv('الخطة شهريا',describe(P))+(P.campaigns?kv('المنصات الإعلانية',names(pickN(n.plats,Math.max(1,P.ads)))+' بإنفاق '+fmt(P.adSpend)+' ريال'):'')+(su>0&&C.next?kv('من الشهر الثاني',describe(C.next)):'')+'</section>':'')+
      (wy.length?'<section class="bg-card"><h3 class="bg-h">لماذا هذا التوزيع؟</h3><ul class="bg-skip">'+wy.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></section>':'')+
      (nn.length?'<section class="bg-card"><h3 class="bg-h">ما لا تحتاج إليه حاليا</h3><ul class="bg-skip">'+nn.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></section>':'')+
      '<section class="bg-card"><h3 class="bg-h">خطوتك القادمة</h3><p class="bg-note-l">ابدأ بالأولويات التي تهيئ مشروعك للنمو، ثم وسع استثمارك التسويقي تدريجيا.</p><p class="bg-fine">هذه التوصيات تقديرية، ويعتمد نطاق العمل والتكلفة النهائية بعد مراجعة تفاصيل المشروع. زيادة عدد الحملات أو المنصات لا تعني دائما أنها الخيار الأفضل، فالقرار يعتمد على الجمهور والنتائج والهدف. الأسعار المعروضة افتراضية لغرض التوضيح فقط، ولا يعتمد عليها عند طلب الخدمات أو التعاقد.</p>'+
        '<a class="flipbtn fb--cream bg-cta" href="contact.html"><span class="fb-in"><span class="fb-f">تواصل معنا<i>♠︎</i></span><span class="fb-b" aria-hidden="true">تواصل معنا<i>♠︎</i></span></span></a></section>'+
      '<div class="bg-actions"><button type="button" class="bg-go" id="bgCopy">نسخ ملخص الخطة</button><a class="bg-btn bg-x" id="bgX" target="_blank" rel="noopener" href="https://x.com/intent/post?text='+encodeURIComponent('جربت حاسبة التسويق من @arbaamia وعرفت وين أوزع ميزانيتي التسويقية 🧮 جربها مجانا: https://arbaamia.sa/budget.html')+'">شارك على إكس</a><button type="button" class="bg-btn" id="bgEdit">تعديل إجاباتي</button><button type="button" class="bg-btn" id="bgReset">ابدأ من جديد</button></div></div>';
    var y=window.scrollY;app.innerHTML=h;
    [].forEach.call(app.querySelectorAll('[data-k]'),function(b){b.onclick=function(){adjust(b.dataset.k,Number(b.dataset.d))}});
    [].forEach.call(app.querySelectorAll('[data-s]'),function(c){c.onchange=function(){S[c.dataset.s]=c.checked;var y2=window.scrollY;rebuild();result();window.scrollTo(0,y2);var x=app.querySelector('[data-s="'+c.dataset.s+'"]');if(x)x.focus({preventScroll:true})}});
    document.getElementById('bgCopy').onclick=copySummary;
    document.getElementById('bgEdit').onclick=function(){idx=0;step()};
    document.getElementById('bgReset').onclick=function(){A={};S={};idx=-1;unlocked=false;intro()};
    if(!result.shown){result.shown=true;top()}else window.scrollTo(0,y)
  }
  /* the steppers edit the plan itself; the campaign and its ad spend move together */
  function adjust(k,d){
    var lim={designs:[0,80],videos:[0,80],stories:[0,60],tweets:[0,100],mgmt:[0,4],campaigns:[0,4]}[k];
    P[k]=Math.min(lim[1],Math.max(lim[0],P[k]+d));
    if(k==='campaigns'&&P.campaigns>0&&P.adSpend===0)P.adSpend=PRICES.adSpend;
    if(P.campaigns===0)P.adSpend=0;
    if(P.adSpend>0&&!P.ads)P.ads=1;
    if(P.adSpend===0)P.ads=0;
    var y=window.scrollY;result();window.scrollTo(0,y);
    var f=app.querySelector('[data-k="'+k+'"][data-d="'+d+'"]:not(:disabled)')||app.querySelector('[data-k="'+k+'"]:not(:disabled)');if(f)f.focus({preventScroll:true})
  }
  function copySummary(){
    var m=monthly(P),lines=['خطتي التسويقية من أربعمية (تقدير مبدئي)','ميزانيتي الشهرية: '+money(C.B),''];
    if(C.setupTotal>0){lines.push('التأسيس لمرة واحدة: '+money(C.setupTotal));C.items.filter(function(i){return i.cost>0&&S[i.id]}).forEach(function(i){lines.push('- '+i.label)});lines.push('')}
    if(C.fits){
      lines.push('الخطة التسويقية'+(C.setupTotal>0?' للشهر الأول':'')+': '+money(m));
      lines.push('- '+ar(P.videos)+' مقطع، '+ar(P.designs)+' بوست'+(P.tweets?'، '+ar(P.tweets)+' تغريدة':'')+(P.stories?'، '+ar(P.stories)+' ستوري':''));
      if(P.mgmt)lines.push('- إدارة '+pw(P.mgmt));
      if(P.campaigns)lines.push('- '+ar(P.campaigns)+' حملة إعلانية (مع إنفاقها الإعلاني)');
      if(C.next)lines.push('من الشهر الثاني: خطة بميزانية '+money(monthly(C.next)))}
    else lines.push('المتبقي بعد التأسيس لا يكفي لخطة، فأحتاج لرفع الميزانية أو انتظار الشهر القادم.');
    lines.push('','تقديرات أولية، والتكلفة النهائية بعد مراجعة تفاصيل المشروع.');
    function done(ok){var t=document.createElement('div');t.className='bg-toast';t.setAttribute('role','status');t.textContent=ok?'تم نسخ الملخص':'تعذر النسخ. حدد النص وانسخه يدويا.';document.body.appendChild(t);setTimeout(function(){t.remove()},2200)}
    try{navigator.clipboard.writeText(lines.join('\n')).then(function(){done(true)},function(){done(false)})}catch(e){done(false)}
  }
  intro();
})();
