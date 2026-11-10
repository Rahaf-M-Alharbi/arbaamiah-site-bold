(function(){
  /* the nine services as small playing cards: rank + suit corners, a title and one line */
  var R=['A','K','Q','J','10','9','8','7','6'],SU=['s','h','d','c','s','h','d','c','s'];
  var P=[
    ['كتابة المحتوى','نبرز فكرتك بكلمات تستحق القراءة وتلفت الانتباه'],
    ['الاستراتيجيات التسويقية','نفهم علامتك وجمهورك وسوقك لنضع استراتيجية تصلك بأهدافك'],
    ['صناعة الأفكار الإبداعية','أفكار تلفت انتباه جمهورك وتحقق أهدافك'],
    ['التصميم الإبداعي','نصمم الأفكار والكلمات بإبداع يلفت النظر'],
    ['التصوير','بعدسة إبداعية نلتقط زوايا مشروعك ونبرز تفاصيل منتجاتك'],
    ['التعليق الصوتي','نبرة مناسبة لهويتك وأداء صوتي متقن يجذب فئتك'],
    ['الإعلانات','إعلانات تخطف الانتباه وتحول الفضول إلى اهتمام حقيقي'],
    ['النمو','نتابع الأداء ونقيس النتائج، ثم نبني عليها خططنا'],
    ['تطوير المواقع','مواقع سريعة وواضحة تعكس هويتك وتحول الزائر إلى عميل']
  ];
  /* the services page (data-full) shows each service with its full description */
  var F=['نبرز فكرتك وتوجهك بكلمات تستحق القراءة وتلفت الانتباه وتجعلك أقرب لفئتك المستهدفة.','نفهم العلامة التجارية وجمهورها والسوق الذي تنافس فيه، ثم نحدد الفرص ونقاط القوة، لنضع استراتيجية واضحة تصلها بأهدافها.','نبتكر أفكارا إبداعية لإيصال رسالتك بشكل يلفت انتباه جمهورك ويحقق أهدافك.','نصمم الأفكار والكلمات بإبداع يلفت النظر، ويعبر عنك ويجذب الجمهور كل مرة.','بعدسة إبداعية نلتقط زوايا المشاريع والعلامات التجارية ونقدمها بصور مميزة تبرز تفاصيل منتجاتها.','نختار النبرة المناسبة لهويتك ونقدم رسالتك بأداء صوتي متقن يجذب الفئات المستهدفة.','نصمم إعلانات تخطف الانتباه وتحول الفضول إلى اهتمام حقيقي لتجربة منتجك.','لأن الاستدامة هدفنا، نتابع الأداء باستمرار ونقيس النتائج والأرقام، ثم نبني عليها خططنا الاستراتيجية.','نبني موقعك بتصميم واضح وتجربة سلسة وأداء سريع، ليكون واجهة علامتك الأقوى وقناة حقيقية لتحويل الزوار إلى عملاء.'];
  /* DRAFT, for review: what the client gets from each service (services page only, same order as above) */
  var G=[
    ['نصوص تسويقية وإعلانية بهوية صوت واضحة','محتوى مواقع وصفحات هبوط ومتاجر','سيناريوهات فيديو ونصوص تعليق صوتي','محتوى منصات التواصل وتقويم نشر شهري'],
    ['دراسة السوق وتحليل المنافسين','تحديد الجمهور المستهدف والرسائل الرئيسية','خطة تسويقية بأهداف ومؤشرات قياس','خارطة طريق زمنية بمراحل واضحة'],
    ['أفكار حملات وهويات محتوى أصلية','جلسات عصف ذهني مع فريقك','مفاهيم إبداعية جاهزة للتنفيذ','أفكار مخصصة للمواسم والمناسبات'],
    ['هوية بصرية متكاملة وشعار','تصاميم منصات التواصل والإعلانات','عروض تقديمية وملفات تعريفية','تصاميم مطبوعات وعبوات'],
    ['تصوير منتجات بمشاهد احترافية','تصوير محتوى للمنصات والريلز','تصوير فعاليات وجلسات عمل','مونتاج وتجهيز المواد للنشر'],
    ['تسجيل تعليق صوتي بأصوات مناسبة لعلامتك','أداء بنبرات متعددة حسب هدف المحتوى','تنقية صوتية ومعالجة احترافية','تسليم بصيغ جاهزة للإعلانات والفيديو'],
    ['حملات إعلانية على المنصات الرقمية','تصميم الإعلانات وكتابة نصوصها','استهداف دقيق للجمهور المناسب','تحسين مستمر للحملات بناء على النتائج'],
    ['تقارير أداء دورية واضحة','قياس الوصول والتفاعل والتحويل','قراءة النتائج وتحديد ما ينجح','توصيات وخطط تطوير للمرحلة التالية'],
    ['تصميم واجهات وتجربة استخدام مدروسة','مواقع تعريفية وصفحات هبوط ومتاجر إلكترونية','موقع متجاوب مع الجوال وسريع التحميل','تهيئة لمحركات البحث وربط أدوات التحليل']
  ];
  var stack=document.getElementById('stack');
  stack.innerHTML=''; /* drop the plain-HTML copy (scripts/sync-services.mjs) before drawing the cards */
  var full=stack.hasAttribute('data-full');
  if(full)P.forEach(function(p,i){p[1]=F[i]});

  if(!full){
    /* home: the services as a plain numbered list of names, no cards and no descriptions */
    stack.className+=' sol';
    stack.innerHTML=P.map(function(p,i){return '<div class="sol-r"><span class="sol-n">'+(i<9?'0':'')+(i+1)+'</span><h4>'+p[0]+'</h4></div>'}).join('');
    return;
  }
  var K=['content','growth','content','design','design','content','ads','growth','web'];/* which box on the contact form each service ticks */
  /* TEMP review: layouts to compare, pick with ?layout=rows|split|fan|ed|table|hz, then delete the others and the switcher */
  var L=(location.search.match(/layout=(\w+)/)||[])[1]||'rows';
  var sw=document.createElement('nav');sw.className='sv-sw';sw.setAttribute('dir','rtl');
  sw.innerHTML=[['rows','١ قائمة'],['split','٢ ورقة'],['fan','٣ رزمة'],['ed','٤ صفحات'],['table','٥ طاولة'],['hz','٦ تبويب']].map(function(o){return '<a href="?layout='+o[0]+'"'+(o[0]===L?' class="on"':'')+'>'+o[1]+'</a>'}).join('');
  document.body.appendChild(sw);
  function more(i){return '<span class="svc-l">ماذا تحصل عليه</span><ul class="svc-get">'+G[i].map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul><a class="svc-o" href="contact.html?svc='+K[i]+'&amp;n='+encodeURIComponent(P[i][0])+'">اطلب الخدمة<i>←</i></a>'}
  function num(i){return (i<9?'0':'')+(i+1)}
  function rowHtml(p,i){return '<div class="sv-r"><button class="sv-h" type="button" aria-expanded="false"><span class="sol-n">'+num(i)+'</span><h4>'+p[0]+'</h4><span class="sv-pl">+</span></button><div class="sv-d"><p>'+p[1]+'</p><div class="sv-g">'+more(i)+'</div></div></div>'}
  function toggleRow(e){var b=e.target.closest&&e.target.closest('.sv-h');if(!b)return;var r=b.closest('.sv-r'),o=r.classList.toggle('open');b.setAttribute('aria-expanded',o)}
  var SUIT={s:'♠\uFE0E',h:'♥\uFE0E',d:'♦\uFE0E',c:'♣\uFE0E'};
  function card(i,cls){var s=SU[i];return '<article class="card pk svc open'+((s==='h'||s==='d')?' red':'')+(cls?' '+cls:'')+'">'+PlayingCard.corners(R[i],s)+'<div class="body"><h4>'+P[i][0]+'</h4><span class="rule"></span><p>'+P[i][1]+'</p>'+more(i)+'</div></article>'}
  if(L==='fan'){
    stack.className+=' sv-fan';
    stack.innerHTML='<div class="sv-rail" tabindex="0">'+P.map(function(p,i){return card(i)}).join('')+'</div><div class="sv-nav"><button type="button" data-d="1" aria-label="التالي">→</button><span class="sv-ct">01 / 09</span><button type="button" data-d="-1" aria-label="السابق">←</button></div>';
    var rail=stack.querySelector('.sv-rail'),ct=stack.querySelector('.sv-ct');
    function cur(){var w=rail.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(rail).columnGap||0);return Math.min(P.length-1,Math.round(Math.abs(rail.scrollLeft)/w))}
    rail.addEventListener('scroll',function(){ct.textContent=num(cur())+' / 09'},{passive:true});
    stack.querySelector('.sv-nav').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(!b)return;var w=rail.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(rail).columnGap||0);rail.scrollBy({left:-b.dataset.d*w,behavior:'smooth'})});
    return;
  }
  if(L==='ed'){
    stack.className+=' sv-ed';
    stack.innerHTML=P.map(function(p,i){var s=SU[i];return '<section class="sv-s'+((s==='h'||s==='d')?' red':'')+'"><div class="sv-big" aria-hidden="true"><b>'+R[i]+'</b><i>'+SUIT[s]+'</i></div><div class="sv-t"><span class="sol-n">'+num(i)+'</span><h4>'+p[0]+'</h4><p>'+p[1]+'</p>'+more(i)+'</div></section>'}).join('');
    return;
  }
  if(L==='table'){
    stack.className+=' sv-table';
    /* each card flips in place: the front is rank, suit and name; the back is what you get and the order button */
    stack.innerHTML=P.map(function(p,i){var s=SU[i],red=(s==='h'||s==='d')?' red':'';return '<div class="sv-k"><div class="sv-in"><div class="sv-f card pk'+red+'" role="button" tabindex="0" aria-label="'+p[0]+'">'+PlayingCard.corners(R[i],s)+'<span class="sv-kc"><i>'+SUIT[s]+'</i><b>'+p[0]+'</b></span></div><div class="sv-b card pk'+red+'">'+PlayingCard.corners(R[i],s)+'<div class="sv-bb"><h4>'+p[0]+'</h4><ul class="svc-get">'+G[i].map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul><a class="svc-o" href="contact.html?svc='+K[i]+'&amp;n='+encodeURIComponent(p[0])+'">اطلب الخدمة<i>←</i></a></div></div></div></div>'}).join('');
    function flip(k){var on=!k.classList.contains('flip');[].forEach.call(stack.querySelectorAll('.sv-k.flip'),function(o){o.classList.remove('flip')});if(on)k.classList.add('flip')}
    stack.addEventListener('click',function(e){var k=e.target.closest&&e.target.closest('.sv-k');if(!k||(e.target.closest&&e.target.closest('a')))return;flip(k)});
    stack.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var f=e.target.closest&&e.target.closest('.sv-f');if(!f)return;e.preventDefault();flip(f.closest('.sv-k'))});
    return;
  }
  if(L==='hz'){
    stack.className+=' sv-hz';
    stack.innerHTML='<div class="sv-chips" role="tablist">'+P.map(function(p,i){return '<button type="button" role="tab" data-i="'+i+'" aria-selected="'+(i===0)+'">'+p[0]+'</button>'}).join('')+'</div><div class="sv-panel"></div>';
    var pn=stack.querySelector('.sv-panel');
    function showH(i){
      var s=SU[i];
      pn.innerHTML='<div class="sv-pn'+((s==='h'||s==='d')?' red':'')+'"><span class="sv-wm" aria-hidden="true">'+R[i]+SUIT[s]+'</span><div class="sv-pa"><span class="sol-n">'+num(i)+'</span><h4>'+P[i][0]+'</h4><p>'+P[i][1]+'</p></div><div class="sv-pb">'+more(i)+'</div></div>';
      [].forEach.call(stack.querySelectorAll('.sv-chips button'),function(b){b.setAttribute('aria-selected',+b.dataset.i===i)});
    }
    stack.querySelector('.sv-chips').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(b)showH(+b.dataset.i)});
    showH(0);
    return;
  }
  if(L==='rows'){
    stack.className+=' sv-rows';
    stack.innerHTML=P.map(rowHtml).join('');
    stack.addEventListener('click',toggleRow);
    return;
  }
  if(L==='split'){
    stack.className+=' sv-split';
    stack.innerHTML='<div class="sv-tabs" role="tablist">'+P.map(function(p,i){return '<button type="button" role="tab" data-i="'+i+'" aria-selected="'+(i===0)+'"><span class="sol-n">'+num(i)+'</span>'+p[0]+'</button>'}).join('')+'</div><div class="sv-view"></div>';
    var view=stack.querySelector('.sv-view');
    function show(i){
      view.innerHTML=card(i);
      [].forEach.call(stack.querySelectorAll('.sv-tabs button'),function(b){b.setAttribute('aria-selected',+b.dataset.i===i)});
    }
    stack.querySelector('.sv-tabs').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(b)show(+b.dataset.i)});
    show(0);
    return;
  }
  /* unknown ?layout falls back to the list */
  stack.className+=' sv-rows';
  stack.innerHTML=P.map(rowHtml).join('');
  stack.addEventListener('click',toggleRow);
})();
