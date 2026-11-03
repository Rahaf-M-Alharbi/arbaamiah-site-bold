(function(){
  var Q=[
    {t:'لعبوا أوراقنا بذكاء، وخرجنا من الجولة بعلامة تُعرف من النظرة الأولى.',n:'خالد العتيبي',r:'مؤسس · اسم الشركة (نص تجريبي)'},
    {t:'قرأوا السوق قبل أن يوزّعوا أول ورقة، فجاءت النتائج أرقاماً لا وعوداً.',n:'سارة القحطاني',r:'مديرة التسويق · اسم الشركة (نص تجريبي)'},
    {t:'فريق واحد يحكي ويصمّم ويقيس، ولم نعد نحتاج إلى غيره.',n:'فهد الدوسري',r:'الرئيس التنفيذي · اسم الشركة (نص تجريبي)'}
  ],i=0,box=document.getElementById('cstQ'),p=document.getElementById('cstP'),n=document.getElementById('cstN'),r=document.getElementById('cstR'),pg=document.getElementById('cstPg'),av=document.querySelector('.cst-by i'),timer;
  if(!box)return;
  function show(k,animate){
    i=(k+Q.length)%Q.length;
    function set(){p.textContent=Q[i].t;n.textContent=Q[i].n;av.textContent=Q[i].n.charAt(0);r.textContent=Q[i].r;pg.textContent='0'+(i+1)+' / 0'+Q.length;box.classList.remove('out')}
    if(!animate){set();return}
    box.classList.add('out');setTimeout(set,350);
  }
  function go(d){show(i+d,true);clearInterval(timer);timer=setInterval(function(){show(i+1,true)},9000)}
  document.getElementById('cstPrev').addEventListener('click',function(){go(-1)});
  document.getElementById('cstNext').addEventListener('click',function(){go(1)});
  show(0,false);timer=setInterval(function(){show(i+1,true)},9000);
})();
