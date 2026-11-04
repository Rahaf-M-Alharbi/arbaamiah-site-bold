(function(){
  var S={s:'♠\uFE0E',h:'♥\uFE0E',d:'♦\uFE0E',c:'♣\uFE0E'};
  var P=[
    {n:'I',s:'s',t:'المحتوى',c:'أفكار وكلمات تستحق أن تُقرأ.',d:[['كتابة المحتوى','كلمات تُبرز فكرتك وتلفت الانتباه.'],['صناعة الأفكار الإبداعية','أفكار تستوقف جمهورك وتخدم هدفك.']]},
    {n:'II',s:'h',t:'التصميم',c:'ما تراه العين قبل أن تقرأ.',d:[['التصميم الإبداعي','نحوّل الفكرة والكلمات إلى تصميم يلفت النظر.'],['التصوير','عدسة تُبرز تفاصيل مشروعك ومنتجاتك.']]},
    {n:'III',s:'d',t:'الإعلانات',c:'من الفضول إلى الاهتمام.',d:[['الإعلانات','إعلانات تلفت الانتباه وتحوّل الفضول إلى اهتمام حقيقي.'],['التعليق الصوتي','صوت ونبرة تناسبان هويتك وتصلان إلى فئتك.']]},
    {n:'IV',s:'c',t:'النمو',c:'نبني على ما تقوله الأرقام.',d:[['الاستراتيجيات التسويقية','نفهم علامتك وجمهورك وسوقك، ثم نضع الاتجاه.'],['النمو','نتابع الأداء ونقيس النتائج، ونبني عليها الخطوة التالية.']]}
  ];
  var stack=document.getElementById('stack');
  P.forEach(function(p,i){
    var red=(p.s==='h'||p.s==='d')?' red':'',a=document.createElement('article');
    a.className='pnl';a.style.setProperty('--i',i);
    a.innerHTML='<div class="lt"><div class="top"><span class="rn">'+p.n+'</span><span class="st'+red+'">'+S[p.s]+'</span></div>'+
      '<div class="pm"><h3>'+p.t+'</h3><p class="cap">'+p.c+'</p></div></div>'+
      '<span class="sx a'+red+'" aria-hidden="true">'+S[p.s]+'</span><span class="sx b'+red+'" aria-hidden="true">'+S[p.s]+'</span>'+
      '<span class="big" aria-hidden="true">'+S[p.s]+'</span>'+
      '<ul class="dl">'+p.d.map(function(x,j){return '<li><b>0'+(j+1)+'</b><div><span>'+x[0]+'</span><small>'+x[1]+'</small></div></li>'}).join('')+'</ul>';
    stack.appendChild(a);
  });
})();
