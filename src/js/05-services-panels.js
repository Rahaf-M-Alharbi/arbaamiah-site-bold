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
  function more(i){return '<span class="svc-l">ماذا تحصل عليه</span><ul class="svc-get">'+G[i].map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul><a class="svc-o" href="contact.html?svc='+K[i]+'&amp;n='+encodeURIComponent(P[i][0])+'">اطلب الخدمة<i>←</i></a>'}
  function num(i){return (i<9?'0':'')+(i+1)}
  /* pick a service on one side, its card on the other */
  function card(i){var s=SU[i];return '<article class="card pk svc open'+((s==='h'||s==='d')?' red':'')+'">'+PlayingCard.corners(R[i],s)+'<div class="body"><h4>'+P[i][0]+'</h4><span class="rule"></span><p>'+P[i][1]+'</p>'+more(i)+'</div></article>'}
  stack.className+=' sv-split';
  stack.innerHTML='<div class="sv-tabs" role="tablist">'+P.map(function(p,i){return '<button type="button" role="tab" data-i="'+i+'" aria-selected="'+(i===0)+'"><span class="sol-n">'+num(i)+'</span>'+p[0]+'</button>'}).join('')+'</div><div class="sv-view"></div>';
  var view=stack.querySelector('.sv-view');
  var phone=window.matchMedia('(max-width:860px)'),cur=0;
  function show(i){cur=i;
    view.innerHTML=card(i);
    var tabs=stack.querySelectorAll('.sv-tabs button');
    var top=tabs[i].getBoundingClientRect().top;
    if(phone.matches)tabs[i].after(view);else stack.appendChild(view);
    if(phone.matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
      window.scrollBy(0,tabs[i].getBoundingClientRect().top-top); /* the old card closed above this row: keep the row where the finger is */
      view.classList.remove('opening');void view.offsetWidth;view.classList.add('opening');
    }
    [].forEach.call(stack.querySelectorAll('.sv-tabs button'),function(b){b.setAttribute('aria-selected',+b.dataset.i===i)});
  }
  view.addEventListener('animationend',function(){view.classList.remove('opening')}); /* overflow:hidden is only for the unfold; it would clip the card's shadow */
  phone.addEventListener('change',function(){show(cur)});
  stack.querySelector('.sv-tabs').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(b)show(+b.dataset.i)});
  show(0);
})();
