/* budget engine: pure functions, no DOM. The calculator page (45-budget.js) and scripts/budget-engine.test.mjs both use it.
   A marketer's order of decisions, in this sequence:
   1. setup (identity, website) is priced first; if it would leave no room for content it is split into phases
   2. content, then a campaign when it can be launched properly, then account management, then upgrades
   3. what is left goes to ad spend (or stays visible as "remaining")
   Every price and rule lives in DEFAULTS, so a change there reaches every result. */
(function(root){
  var DEFAULTS={
    prices:{identityNew:2000,identityDev:1600,siteNew:2000,siteDev:1600,video:150,post:100,story:50,mgmtPlatform:1000,campaignFee:1000},
    ads:{
      minSpendPerPlatform:1500,       /* ad spend, paid to the platform, never below this per platform */
      maxAdPlatforms:2,               /* even when three or more platforms are chosen */
      twoCampaignsMinRemaining:18000, /* the budget left after setup that allows two separate campaigns */
      recommendMinBudget:6000,        /* "I want ads but need advice": below this the advice is to wait */
      campaignMinVideos:6,campaignMinPosts:6, /* least content a campaign needs */
      history:'none',                 /* none | good | weak: past ad performance, not asked of the visitor */
      ratioGood:.6,ratioNone:.5,ratioWeak:.4  /* guide for the ad share of what is left after setup */
    },
    mgmt:{
      noneBelowBudget:4000,           /* under this, no separate account management */
      singleBelowBudget:6000,         /* under this, one platform at most */
      maxSharePct:40,                 /* management never takes more than this share of the whole budget */
      maxPlatformsWithAds:2,maxPlatformsNoAds:3
    },
    content:{
      targetVideos:10,targetPosts:10,targetStories:15,   /* the full package */
      minReserve:1300,                                   /* content money kept back when setup is phased */
      /* the ladder, [videos, posts, stories]. Sorted by cost at run time; the engine picks the highest rung the money allows. */
      tiers:[[2,2,3],[3,3,4],[4,4,6],[6,6,0],[6,6,10],[8,8,10],[10,10,10],[10,10,15],[12,12,20],[15,15,25]]
    },
    /* which setup item comes first when only one fits */
    foundationOrder:{store:['site','identity'],food:['identity','site'],services:['site','identity'],brand:['identity','site'],startup:['identity','site'],other:['identity','site']},
    /* how well each platform suits each activity, 0 to 5. Below 2 the platform is not recommended. */
    platformScores:{
      store:{instagram:5,tiktok:4,snapchat:4,x:1,linkedin:0},
      food:{instagram:5,snapchat:4,tiktok:4,x:2,linkedin:0},
      services:{instagram:4,linkedin:4,x:3,snapchat:3,tiktok:2},
      brand:{instagram:5,tiktok:4,x:3,snapchat:3,linkedin:2},
      startup:{instagram:4,linkedin:4,x:4,tiktok:3,snapchat:2},
      other:{instagram:4,tiktok:3,snapchat:3,x:3,linkedin:3}
    }
  };
  var PLAT_ORDER=['instagram','tiktok','snapchat','x','linkedin'];
  var PLAT_NAME={instagram:'إنستغرام',tiktok:'تيك توك',snapchat:'سناب شات',x:'إكس',linkedin:'لينكدإن',whatsapp:'واتساب للأعمال'};
  var CONTENT_ONLY=['aware','presence'],CONVERSION_ONLY=['sales','requests','launch'];

  function clone(o){return JSON.parse(JSON.stringify(o))}
  /* deep merge of saved settings onto the defaults; unknown keys are ignored, wrong types fall back */
  function merge(base,patch){
    var out=clone(base);
    (function walk(o,p){
      if(!p||typeof p!=='object')return;
      Object.keys(o).forEach(function(k){
        if(!(k in p))return;
        if(Array.isArray(o[k])){if(Array.isArray(p[k]))o[k]=clone(p[k])}
        else if(o[k]&&typeof o[k]==='object')walk(o[k],p[k]);
        else if(typeof o[k]===typeof p[k]&&(typeof p[k]!=='number'||isFinite(p[k])))o[k]=p[k]
      })
    })(out,patch);
    return out
  }
  /* thousands separators; the page turns the digits Arabic-Indic */
  function f(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',')}
  function has(list,v){return (list||[]).indexOf(v)>-1}
  function down(n,step){return Math.floor(n/step+1e-9)*step}

  function ladder(S){
    var P=S.prices,T=S.content.tiers.map(function(t){return {v:t[0],p:t[1],s:t[2],cost:t[0]*P.video+t[1]*P.post+t[2]*P.story}});
    T.sort(function(a,b){return a.cost-b.cost});
    var last=T.length-1;
    function first(fn,dflt){for(var i=0;i<T.length;i++)if(fn(T[i]))return i;return dflt}
    var campaignMin=first(function(t){return t.v>=S.ads.campaignMinVideos&&t.p>=S.ads.campaignMinPosts},last),
      full=first(function(t){return t.v>=S.content.targetVideos&&t.p>=S.content.targetPosts&&t.s>=S.content.targetStories},last),
      viable=first(function(t){return t.cost>=S.content.minReserve},0);
    return {T:T,campaignMin:campaignMin,full:full,std:Math.max(campaignMin,full-1),viable:viable,max:last}
  }

  /* platform fit: base score by activity, nudged by the stated goals */
  function platformScore(S,type,id,goals){
    var s=(S.platformScores[type]||S.platformScores.other)[id]||0;
    if((has(goals,'aware')||has(goals,'newcust'))&&id==='tiktok')s+=1;
    if(has(goals,'requests')&&id==='linkedin'&&(type==='services'||type==='startup'))s+=.5;
    if(has(goals,'launch')&&(id==='instagram'||id==='x'))s+=.5;
    return s
  }

  /* what the visitor mostly wants decides the order in which the budget is filled */
  function focusOf(a){
    var g=a.goals||[];
    if(g.length&&g.every(function(x){return has(CONTENT_ONLY,x)}))return 'content';
    if((a.ads==='want'||a.ads==='one'||a.ads==='multi')&&g.length&&g.every(function(x){return has(CONVERSION_ONLY,x)}))return 'ads';
    return 'balanced'
  }

  function plan(a,S){
    S=S||DEFAULTS;
    var P=S.prices,B=Math.round(a.budget),LD=ladder(S),T=LD.T,goals=a.goals||[],focus=focusOf(a),
      out={budget:B,focus:focus,foundation:[],foundationDeferred:[],alerts:[],insights:[],deferred:[],
        content:null,contentCost:0,mgmtCount:0,mgmtCost:0,managed:[],republish:[],selfPublish:[],suggested:false,notRecommended:[],whatsapp:false,
        campaigns:0,campaignFee:0,adSpend:0,adPlatforms:[],adReason:'',remaining:B};

    /* ---------- 1. setup ---------- */
    var idn=a.identity==='none'?{key:'identity',label:'تصميم هوية بصرية جديدة',cost:P.identityNew}
      :a.identity==='logo'?{key:'identity',label:'تطوير الهوية البصرية انطلاقا من الشعار',cost:P.identityDev}
      :a.identity==='partial'?{key:'identity',label:'استكمال الهوية البصرية',cost:P.identityDev}:null,
      sit=a.site==='none'?{key:'site',label:'إنشاء موقع إلكتروني جديد',cost:P.siteNew}
      :a.site==='improve'?{key:'site',label:'تطوير الموقع الإلكتروني القائم',cost:P.siteDev}:null,
      needs=[],rem=B;
    (S.foundationOrder[a.type]||S.foundationOrder.other).forEach(function(k){var n=k==='identity'?idn:sit;if(n)needs.push(n)});
    /* the first item is funded if it fits; the next only if enough is left to still make content */
    needs.forEach(function(n){
      if(n.cost<=rem&&(!out.foundation.length||rem-n.cost>=S.content.minReserve)){out.foundation.push(n);rem-=n.cost}
      else out.foundationDeferred.push(n)
    });
    out.foundationCost=B-rem;
    if(out.foundationDeferred.length){
      var all=needs.reduce(function(s,n){return s+n.cost},0),names=out.foundationDeferred.map(function(n){return n.label}).join(' و');
      if(!out.foundation.length)out.alerts.push('ميزانيتك لا تكفي لأي من خدمات التأسيس التي يحتاجها مشروعك. أقل مبلغ للبدء هو '+f(Math.min.apply(null,needs.map(function(n){return n.cost})))+' ريال، وتكلفة التأسيس كاملا '+f(all)+' ريال.');
      else if(all>B)out.alerts.push('التأسيس الذي يحتاجه مشروعك ('+f(all)+' ريال) أكبر من ميزانيتك. نقترح تنفيذه على مراحل: نبدأ الآن بالأهم، ونؤجل '+names+' إلى المرحلة الثانية.');
      else out.alerts.push('التأسيس كاملا يستهلك الميزانية تقريبا ولا يترك مساحة كافية للمحتوى. نقترح تنفيذه على مراحل: نبدأ الآن بالأهم، ونؤجل '+names+' إلى المرحلة الثانية.');
      out.foundationDeferred.forEach(function(n){out.deferred.push({title:n.label,reason:'مؤجل إلى المرحلة الثانية حتى لا يستهلك التأسيس ميزانية المحتوى.'})})
    }
    if(needs.length&&!out.foundation.length){
      out.foundationBlocked=true;out.remaining=B;
      if(a.ads!=='none'){out.adReason='الحملة تبدأ بعد اكتمال التأسيس.';out.deferred.push({title:'الحملة الإعلانية',reason:out.adReason})}
      out.insights.push('الأولوية الآن لتأسيس المشروع قبل أي إنفاق تسويقي، فالمحتوى والإعلان بلا هوية أو وجهة واضحة يضيعان.');
      return out
    }
    var R1=rem;
    out.afterFoundation=R1;

    /* ---------- platforms ---------- */
    var picked=(a.platforms||[]).filter(function(p){return PLAT_ORDER.indexOf(p)>-1});
    out.whatsapp=has(a.platforms,'whatsapp');
    var scored=function(list){return list.map(function(p){return {id:p,score:platformScore(S,a.type,p,goals)}}).sort(function(x,y){return y.score-x.score||PLAT_ORDER.indexOf(x.id)-PLAT_ORDER.indexOf(y.id)})};
    if(!picked.length){   /* only WhatsApp (or nothing) was chosen: WhatsApp receives orders, content still needs a home */
      picked=scored(PLAT_ORDER).slice(0,2).map(function(x){return x.id});out.suggested=true}
    var ranked=scored(picked),suitable=ranked.filter(function(x){return x.score>=2}).map(function(x){return x.id});
    out.notRecommended=ranked.filter(function(x){return x.score<2}).map(function(x){return x.id});
    if(!suitable.length){suitable=ranked.map(function(x){return x.id});out.notRecommended=[]}   /* the visitor insisted: nothing better to offer */

    /* ---------- campaign decision ---------- */
    var mode=a.ads,c=0,reason='',
      identityBlocked=a.identity==='none'&&!out.foundation.some(function(f){return f.key==='identity'}),
      siteBlocked=a.site==='none'&&!out.foundation.some(function(f){return f.key==='site'}),
      fee=P.campaignFee,minAd=S.ads.minSpendPerPlatform,
      needFor=function(k){return T[k===2?LD.std:LD.campaignMin].cost+k*(fee+minAd)};
    if(mode==='none')reason='لا ترغب بالإعلانات حاليا.';
    else if(identityBlocked)reason='الحملة تحتاج إلى هوية بصرية تظهر بها، وهي مؤجلة إلى المرحلة الثانية.';
    else if(siteBlocked)reason='لا توجد وجهة تستقبل العملاء بعد، فالإعلان بلا موقع يهدر الميزانية. الموقع مؤجل إلى المرحلة الثانية.';
    else{
      c=(mode==='multi'&&R1>=S.ads.twoCampaignsMinRemaining)?2:1;
      if(c===2&&R1<needFor(2))c=1;
      if(R1<needFor(1)){c=0;reason='الحد الأدنى لإطلاق حملة هو '+f(needFor(1))+' ريال بعد التأسيس، وهذا يشمل المحتوى وأتعاب الحملة والإنفاق الإعلاني. المتاح لك '+f(R1)+' ريال، وتحتاج إلى '+f(needFor(1)-R1)+' ريال إضافية.'}
      else if(mode==='recommend'&&B<S.ads.recommendMinBudget){c=0;reason='ننصح بالتركيز على التأسيس والمحتوى أولا، وبدء الإعلان عندما تصل الميزانية إلى '+f(S.ads.recommendMinBudget)+' ريال على الأقل.'}
    }
    var adsOn=c>0,adsMinIdx=c===2?LD.std:LD.campaignMin;

    /* ---------- sequencer ---------- */
    var st={rem:R1,tier:-1,mgmt:0,camp:0,ad:0},
      history=S.ads.history,ratio=history==='good'?S.ads.ratioGood:history==='weak'?S.ads.ratioWeak:S.ads.ratioNone,
      cur=function(){return st.tier<0?0:T[st.tier].cost};
    function toTier(maxI){
      for(var i=maxI;i>=0;i--)if(T[i].cost>cur()&&T[i].cost-cur()<=st.rem){st.rem-=T[i].cost-cur();st.tier=i;return}
    }
    function mgmtStep(limit){
      var wants=a.accounts!=='own',cap=Math.floor(S.mgmt.maxSharePct/100*B/P.mgmtPlatform+1e-9),
        target=Math.min(suitable.length,st.camp>0?S.mgmt.maxPlatformsWithAds:S.mgmt.maxPlatformsNoAds,cap);
      if(B<S.mgmt.noneBelowBudget)target=0;else if(B<S.mgmt.singleBelowBudget)target=Math.min(target,1);
      if(!wants)target=0;
      if(limit!=null)target=Math.min(target,limit);
      while(st.mgmt<target&&st.rem>=P.mgmtPlatform){st.mgmt++;st.rem-=P.mgmtPlatform}
    }
    var step={
      cmin:function(){toTier(adsOn?adsMinIdx:LD.viable)},
      camp:function(){
        if(!adsOn)return;
        var need=c*(fee+minAd);
        if(st.rem<need||st.tier<adsMinIdx){adsOn=false;c=0;reason='الأولوية في خطتك للمحتوى، ولا تتسع الميزانية بعده لحملة بالحد الأدنى. أجلناها بدل إطلاق حملة ناقصة.';return}
        st.rem-=need;st.camp=c;st.ad=c*minAd
      },
      mgmt:function(){mgmtStep()},
      mgmt1:function(){mgmtStep(1)},
      tostd:function(){toTier(LD.std)},
      tofull:function(){toTier(LD.full)},
      tomax:function(){toTier(LD.max)},
      agrow:function(){
        if(!st.camp)return;
        var cap=Math.max(st.ad,Math.round(ratio*R1/100)*100),add=down(Math.min(st.rem,cap-st.ad),100);
        if(add>0){st.ad+=add;st.rem-=add}
      },
      aall:function(){
        if(!st.camp||history==='weak')return;   /* after weak results, the extra is not poured into ads */
        var add=down(st.rem,100);if(add>0){st.ad+=add;st.rem-=add}
      }
    };
    var order={
      balanced:['cmin','camp','mgmt','tostd','agrow','tofull','aall','tomax','mgmt'],
      content:['cmin','tostd','tofull','camp','mgmt1','agrow','tomax','mgmt','aall'],
      ads:['cmin','camp','mgmt1','tostd','agrow','mgmt','tofull','aall','tomax']
    }[focus];
    order.forEach(function(k){step[k]()});

    /* ---------- result ---------- */
    out.content=st.tier>=0?{v:T[st.tier].v,p:T[st.tier].p,s:T[st.tier].s}:null;
    out.contentCost=cur();
    out.mgmtCount=st.mgmt;out.mgmtCost=st.mgmt*P.mgmtPlatform;
    out.campaigns=st.camp;out.campaignFee=st.camp*fee;out.adSpend=st.ad;out.remaining=st.rem;
    out.adReason=st.camp?'':reason;

    var manageable=a.accounts!=='own';
    if(manageable){out.managed=suitable.slice(0,st.mgmt);out.republish=suitable.slice(st.mgmt)}
    else out.selfPublish=suitable.slice();
    if(st.camp){
      var cand=suitable.slice(),k=Math.max(1,Math.min(S.ads.maxAdPlatforms,cand.length,Math.floor(st.ad/minAd)));
      var base=down(st.ad/k,100),list=cand.slice(0,k).map(function(id,i){return {id:id,amount:base}});
      list[0].amount+=st.ad-base*k;out.adPlatforms=list
    }

    /* ---------- deferred services, with the reason ---------- */
    if(manageable&&st.mgmt===0)out.deferred.push({title:'إدارة الحسابات',reason:B<S.mgmt.noneBelowBudget?'الميزانية أقل من الحد المناسب لإدارة مستقلة، فوجهناها للتأسيس والمحتوى.':'وجهنا الميزانية إلى '+(adsOn?'المحتوى والحملة':'المحتوى')+' أولا، ويمكن إضافة الإدارة عند رفع الميزانية.'});
    if(manageable&&st.mgmt>0&&suitable.length>st.mgmt)out.deferred.push({title:'إدارة '+PLAT_NAME[suitable[st.mgmt]]+(suitable.length-st.mgmt>1?' وغيرها':''),reason:st.camp&&suitable.length>=3?'ننصح بإدارة منصتين مع الحملة، ويعاد نشر المحتوى نفسه على بقية المنصات دون إدارة مستقلة.':'لا تتسع لها الميزانية بإتقان الآن، ويعاد نشر المحتوى عليها.'});
    if(mode==='multi'&&st.camp===1)out.deferred.push({title:'الحملة الثانية',reason:'الحملتان المنفصلتان تحتاجان إلى '+f(S.ads.twoCampaignsMinRemaining)+' ريال أو أكثر بعد التأسيس مع جاهزية المحتوى. نقترح حملة واحدة مركزة تعطي نتيجة أوضح.'});
    if(mode!=='none'&&!st.camp)out.deferred.push({title:'الحملة الإعلانية',reason:out.adReason});

    /* ---------- the marketer's reading ---------- */
    var I=out.insights,ready=!out.foundation.length&&!out.foundationDeferred.length;
    if(ready&&needs.length===0)I.push('هويتك وموقعك جاهزان، فلم نخصم أي مبلغ للتأسيس ووجهنا الميزانية كلها إلى المحتوى والإدارة والإعلان.');
    else if(out.foundation.length)I.push('بدأنا بالتأسيس لأن المحتوى والإعلان يحتاجان إلى أساس واضح يستقبل العميل ('+out.foundation.map(function(f){return f.label}).join(' و')+')، ثم وزعنا المتبقي.');
    if(focus==='content')I.push('هدفك بناء الحضور والوعي، فجعلنا للمحتوى أكبر حصة ممكنة'+(st.mgmt<Math.min(suitable.length,2)&&manageable?'، وقدمناه على إدارة الحسابات':'')+'.');
    else if(focus==='ads')I.push('هدفك المبيعات والطلبات، فأعطينا الحملة أولوية قبل التوسع في الإدارة، وأبقينا محتوى كافيا يغذيها.');
    if(out.suggested)I.push('اخترت واتساب فقط، وهو قناة لاستقبال الطلبات لا منصة محتوى. اقترحنا '+suitable.map(function(p){return PLAT_NAME[p]}).join(' و')+' لنشر المحتوى، ويربط الجميع برقم واتساب للأعمال.');
    else if(out.whatsapp)I.push('واتساب للأعمال قناة الاستقبال: نربطه بالمحتوى والحملة دون إدارة مستقلة.');
    if(out.notRecommended.length)I.push('لا ننصح حاليا بـ '+out.notRecommended.map(function(p){return PLAT_NAME[p]}).join(' و')+' لنشاطك، فجمهورها لا يتقاطع كثيرا مع عملائك. الأفضل تركيز الميزانية على المنصات الأقوى.');
    if(picked.length>=3&&suitable.length>=3&&st.mgmt>0)I.push('اخترت '+picked.length+' منصات، لكن الجودة أهم من العدد. ندير '+(st.mgmt===1?'منصة واحدة':'منصتين')+' بإتقان، ونعيد نشر المحتوى على الباقي.');
    if(st.camp)I.push('الإنفاق الإعلاني ('+f(st.ad)+' ريال) يدفع للمنصة مباشرة ومنفصل عن أتعاب الحملة، ولا يقل عن '+f(minAd)+' ريال لكل منصة.');
    if(st.camp&&history==='weak')I.push('أداء إعلاناتك السابق ضعيف، فنراجع الأسباب أولا ولا نتجاوز الحد الأدنى للإنفاق على كل منصة قبل ظهور نتائج.');
    if(!st.camp&&mode!=='none'&&reason)I.push('الحملة مؤجلة: '+reason);
    if(st.rem>=100)I.push('بقي '+f(st.rem)+' ريال دون توزيع'+(mode==='none'?'. إن غيرت رأيك بشأن الإعلان فهذا المبلغ يقرب الحملة من الإطلاق.':'، ويمكن إضافته عند رفع الميزانية أو إعادة توزيعه.'));
    return out
  }

  /* the rules from the brief, checked against a finished plan. Returns the list of broken rules (empty when the plan is sound). */
  function validate(pl,a,S){
    S=S||DEFAULTS;var P=S.prices,bad=[],T=ladder(S).T;
    function no(m){bad.push(m)}
    var spent=pl.foundationCost+pl.contentCost+pl.mgmtCost+pl.campaignFee+pl.adSpend;
    if(spent+pl.remaining!==pl.budget)no('total '+spent+' + remaining '+pl.remaining+' != budget '+pl.budget);
    if(spent>pl.budget)no('over budget');
    if(pl.remaining<0)no('negative remaining');
    pl.foundation.forEach(function(f){
      if(f.key==='identity'&&a.identity==='full')no('identity charged though ready');
      if(f.key==='site'&&(a.site==='ready'||a.site==='notNeeded'))no('site charged though not needed')
    });
    var kinds=pl.foundation.map(function(f){return f.key});
    if(kinds.length!==kinds.filter(function(k,i){return kinds.indexOf(k)===i}).length)no('setup item twice');
    if(pl.foundationBlocked&&(pl.contentCost||pl.mgmtCost||pl.campaigns))no('spending while setup is blocked');
    if(a.accounts==='own'&&pl.mgmtCount)no('management charged on self-run accounts');
    if(pl.mgmtCount&&pl.budget<S.mgmt.noneBelowBudget)no('management under the minimum budget');
    if(pl.mgmtCount>1&&pl.budget<S.mgmt.singleBelowBudget)no('more than one platform under the second threshold');
    if(pl.mgmtCost>pl.budget*S.mgmt.maxSharePct/100+1e-6)no('management over its share');
    if(pl.campaigns&&pl.mgmtCount>S.mgmt.maxPlatformsWithAds)no('too many managed platforms with a campaign');
    if(pl.mgmtCount>S.mgmt.maxPlatformsNoAds)no('too many managed platforms');
    if(a.ads==='none'&&(pl.campaigns||pl.adSpend||pl.campaignFee))no('campaign launched though refused');
    if(pl.campaigns){
      if(pl.campaignFee!==pl.campaigns*P.campaignFee)no('campaign fee wrong');
      if(pl.adPlatforms.length<1||pl.adPlatforms.length>S.ads.maxAdPlatforms)no('ad platform count');
      pl.adPlatforms.forEach(function(x){if(x.amount<S.ads.minSpendPerPlatform)no('platform below minimum ad spend')});
      if(pl.adPlatforms.reduce(function(s,x){return s+x.amount},0)!==pl.adSpend)no('ad split does not add up');
      if(!pl.content||pl.content.v<S.ads.campaignMinVideos||pl.content.p<S.ads.campaignMinPosts)no('campaign without minimum content');
      if(pl.campaigns===2&&pl.afterFoundation<S.ads.twoCampaignsMinRemaining)no('two campaigns under the threshold');
      if(a.identity==='none'&&!pl.foundation.some(function(f){return f.key==='identity'}))no('campaign without identity');
      if(a.site==='none'&&!pl.foundation.some(function(f){return f.key==='site'}))no('campaign without a destination')
    }else if(pl.adSpend||pl.campaignFee)no('ad money without a campaign');
    if(!pl.campaigns&&a.ads!=='none'&&!pl.adReason)no('postponed campaign has no reason');
    if(pl.content){var hit=T.some(function(t){return t.v===pl.content.v&&t.p===pl.content.p&&t.s===pl.content.s});if(!hit)no('content is not a ladder rung')}
    if(pl.contentCost!==(pl.content?pl.content.v*P.video+pl.content.p*P.post+pl.content.s*P.story:0))no('content cost mismatch');
    return bad
  }

  root.BudgetEngine={DEFAULTS:DEFAULTS,plan:plan,validate:validate,merge:merge,clone:clone,ladder:ladder,focusOf:focusOf,platformName:PLAT_NAME,platformOrder:PLAT_ORDER}
})(typeof window!=='undefined'?window:globalThis);
