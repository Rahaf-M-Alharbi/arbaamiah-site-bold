/* service pages (service-*.html): deal the deliverable cards when they scroll into view, show the nav bar after the first
   screen starts to scroll, and run the "how we work" marker. Reduced-motion visitors get the cards dealt and the marker still. */
(function(){
  var h=document.querySelector('.lp-hand');
  if(h){
    var go=function(){h.classList.add('dealt')};
    if(matchMedia('(prefers-reduced-motion:reduce)').matches||!('IntersectionObserver' in window))go();
    else new IntersectionObserver(function(e,o){if(e[0].isIntersecting){go();o.disconnect()}},{threshold:.15}).observe(h);
  }
  var m=document.getElementById('mini');
  if(m){var f=function(){m.classList.toggle('on',scrollY>60)};addEventListener('scroll',f,{passive:true});f()}
})();
/* how-we-work lift: a marker slides to the chosen step (hover, tap, keyboard) */
(function(){
  var ol=document.querySelector('.lp-steps');if(!ol)return;
  var li=[].slice.call(ol.children),suit=['♠︎','♥︎','♦︎','♣︎'],cur=0;
  ol.classList.add('lp-elev');
  var m=document.createElement('span');m.className='lp-elev-mk';m.setAttribute('aria-hidden','true');ol.appendChild(m);
  function place(){var e=li[cur];m.style.transform='translateY('+(e.offsetTop+(e.offsetHeight-m.offsetHeight)/2)+'px)';m.textContent=suit[cur%4]}
  function pick(i){cur=i;li.forEach(function(x,k){x.classList.toggle('on',k===i)});place()}
  li.forEach(function(x,i){
    x.tabIndex=0;
    x.addEventListener('mouseenter',function(){pick(i)});
    x.addEventListener('focus',function(){pick(i)});
    x.addEventListener('click',function(){pick(i)});
  });
  addEventListener('resize',place);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(place);
  pick(0);
  /* scroll-linked: the marker rides down the rows as the sheet appears and stays pinned */
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var sheet=ol.closest('.lp-sh'),nx=sheet&&sheet.nextElementSibling,tk=false;
  function centre(e){return e.offsetTop+(e.offsetHeight-m.offsetHeight)/2}
  function link(){
    tk=false;
    var vh=innerHeight,p;
    if(nx){var mb=parseFloat(getComputedStyle(sheet).marginBottom)||0;
      var S=vh*.5+sheet.offsetHeight+mb,E=vh*.9;
      p=(S-nx.getBoundingClientRect().top)/(S-E)}
    else{var r=ol.getBoundingClientRect();p=(vh*.85-r.top)/(vh*.55+r.height*.5)}
    p=Math.max(0,Math.min(1,p));
    var f=p*(li.length-1),a=Math.floor(f),b=Math.min(li.length-1,a+1),t=f-a;
    m.style.transform='translateY('+(centre(li[a])+(centre(li[b])-centre(li[a]))*t)+'px)';
    var k=Math.round(f);if(k!==cur){cur=k;li.forEach(function(x,j){x.classList.toggle('on',j===k)});m.textContent=suit[k%4]}
  }
  function req(){if(!tk){tk=true;requestAnimationFrame(link)}}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);link();
})();
