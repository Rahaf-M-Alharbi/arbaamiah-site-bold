(function(){
  var Q=[
    {t:'فريقك يجنن حافظي عليه متعاونين وصبورين',n:'شركة مظلة التميز للسيارات',r:'عميل'},
    {t:'يعطيك العافية جميل جدا ومحتواك مميز',n:'محمد الوائلي',r:'عميل'},
    {t:'ماشاء الله جميلة التصاميم جدا بصراحة أبدعتم',n:'نما ستور',r:'عميل'},
    {t:'جميل جدا شكرا لكم وبإذن الله لنا تعامل ثاني وراح اوصي بكم للمعارف',n:'متجر نظارات',r:'عميل'},
    {t:'جودة التصوير وشغل الفيديوهات ممتازة جدا بالإضافة لجودة voiceover التعامل معكم مريح من ناحية التعديلات. كل الشكر لك ولفريقك.',n:'نظارات كليفي',r:'عميل'},
    {t:'والله الخدمة رائعة من البداية في اخذ التفاصيل يعني حتى فيه اسئلة سألتيني محد عمره سألني وفي الاحترافية عجبني التصميم لكل الصور وبإذن الله التعامل معك بإستمرار لأي تصميم واوصي كل اللي اعرفهم بالمجال او غيره',n:'عبوق للعود ودهن العود',r:'عميل'}
  ],i=0,box=document.getElementById('cstQ'),p=document.getElementById('cstP'),n=document.getElementById('cstN'),r=document.getElementById('cstR'),pg=document.getElementById('cstPg'),av=document.querySelector('.cst-by i'),timer;
  if(!box)return;
  function show(k,animate){
    i=(k+Q.length)%Q.length;
    function set(){p.textContent=Q[i].t;p.classList.toggle('long',Q[i].t.length>90);n.textContent=Q[i].n;av.textContent=Q[i].n.charAt(0);r.textContent=Q[i].r;pg.textContent='0'+(i+1)+' / 0'+Q.length;box.classList.remove('out')}
    if(!animate){set();return}
    box.classList.add('out');setTimeout(set,350);
  }
  function go(d){show(i+d,true);clearInterval(timer);timer=setInterval(function(){show(i+1,true)},9000)}
  document.getElementById('cstPrev').addEventListener('click',function(){go(-1)});
  document.getElementById('cstNext').addEventListener('click',function(){go(1)});
  /* every quote gets the height of the tallest one, so the card and the controls under it stay put while the quotes change */
  function fit(){
    box.style.minHeight='';
    var cur=i,mx=0;
    Q.forEach(function(q,k){i=k;p.textContent=q.t;p.classList.toggle('long',q.t.length>90);n.textContent=q.n;r.textContent=q.r;mx=Math.max(mx,box.offsetHeight)});
    box.style.minHeight=mx+'px';
    show(cur,false);
  }
  fit();
  window.addEventListener('resize',fit);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  show(0,false);timer=setInterval(function(){show(i+1,true)},9000);
})();
