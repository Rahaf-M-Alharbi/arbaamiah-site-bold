(function(){
  /* the eight services as small playing cards: rank + suit corners, a title and one line */
  var R=['A','K','Q','J','10','9','8','7'],SU=['s','h','d','c','s','h','d','c'];
  var P=[
    ['كتابة المحتوى','نبرز فكرتك بكلمات تستحق القراءة وتلفت الانتباه.'],
    ['الاستراتيجيات التسويقية','نفهم علامتك وجمهورك وسوقك لنضع استراتيجية تصلك بأهدافك.'],
    ['صناعة الأفكار الإبداعية','أفكار تلفت انتباه جمهورك وتحقق أهدافك.'],
    ['التصميم الإبداعي','نصمّم الأفكار والكلمات بإبداع يلفت النظر.'],
    ['التصوير','بعدسة إبداعية نلتقط زوايا مشروعك ونبرز تفاصيل منتجاتك.'],
    ['التعليق الصوتي','نبرة مناسبة لهويتك وأداء صوتي متقن يجذب فئتك.'],
    ['الإعلانات','إعلانات تخطف الانتباه وتحوّل الفضول إلى اهتمام حقيقي.'],
    ['النمو','نتابع الأداء ونقيس النتائج، ثم نبني عليها خططنا.']
  ];
  var stack=document.getElementById('stack');
  P.forEach(function(p,i){
    var s=SU[i],a=document.createElement('article');
    a.className='card pk svc'+((s==='h'||s==='d')?' red':'');
    a.innerHTML=PlayingCard.corners(R[i],s)+'<div class="body"><h4>'+p[0]+'</h4><span class="rule"></span><p>'+p[1]+'</p></div>';
    stack.appendChild(a);
  });
})();
