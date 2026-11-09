(function(){
  var S={s:'♠︎',h:'♥︎',d:'♦︎',c:'♣︎'};
  var D=[
    {ic:'content',t:'محتوى',p:'حكايات تكسب الانتباه وتحافظ عليه.',r:'A',s:'s'},
    {ic:'design',t:'تصميم',p:'هوية وحرفة حتى آخر تفصيلة.',r:'K',s:'h'},
    {ic:'ads',t:'إعلانات',p:'وصول مدفوع مبني على ما تقوله الأرقام.',r:'Q',s:'d'},
    {ic:'growth',t:'نمو',p:'حصة سوقية تُكسب بخطوة مدروسة بعد خطوة.',r:'A',s:'c'}
  ];
  var story=document.getElementById('story'),stage=story.querySelector('.stage'),layer=document.getElementById('hand');
  var slots=D.map(function(d,i){
    var s=document.createElement('div'),b=document.createElement('button'),ix=d.r+'<i>'+S[d.s]+'</i>';
    s.className='slot';s.style.zIndex=i+1;s.style.setProperty('--i',i);
    b.type='button';b.setAttribute('data-suit',S[d.s]);
    b.className='card pk'+((d.s==='h'||d.s==='d')?' red':'');
    b.innerHTML=PlayingCard.corners(d.r,d.s)+
      '<div class="med"><svg class="ic" viewBox="0 0 48 48"><use href="#l-'+d.ic+'"/></svg></div>'+
      '<div class="body"><h4>'+d.t+'</h4><span class="rule"></span><p>'+d.p+'</p></div>';
    s.appendChild(b);layer.appendChild(s);return s;
  });
  var mini=document.getElementById('mini'),n=slots.length,mid=(n-1)/2,A=[],W,H,w,h,state='pre',started=false;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* hero cards: dealt in from below the screen when the page opens (timed), dropped away once you scroll past the hero.
     Positions are the resting fan (A); "pre" and "out" are the same fan pushed down off the stage. */
  function layout(){
    W=stage.clientWidth;H=stage.clientHeight;
    w=slots[0].offsetWidth;h=w*1.4;
    for(var i=0;i<n;i++){
      var r=(i-mid)*7,rad=r*Math.PI/180;
      A[i]={x:W/2+(i-mid)*w*.8+1.26*w*Math.sin(rad),y:H+1.06*w-1.26*w*Math.cos(rad),r:r};
    }
  }
  function place(){
    slots.forEach(function(sl,i){
      var a=A[i],dy=state==='in'?0:(state==='pre'?h*1.4:h*1.1),dr=state==='out'?(i-mid)*10:0;
      sl.style.transform='translate('+(a.x-w/2)+'px,'+(a.y-h/2+dy)+'px) rotate('+(a.r+dr)+'deg)';
      sl.style.opacity=state==='in'?1:0;
    });
    layer.classList.toggle('out',state==='out');
  }
  function update(){
    if(!started)return;
    mini.classList.toggle('on',stage.getBoundingClientRect().bottom<H*.3);
  }
  var tick=false;
  function req(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;update()})}}
  function start(){
    if(started)return;started=true;
    if(reduce)layer.classList.add('no-anim');
    state='in';place();update();
  }
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',function(){layer.classList.add('no-anim');layout();place();update();requestAnimationFrame(function(){if(!reduce)layer.classList.remove('no-anim')})});
  layout();place();
  /* wait for the page loader to lift, then deal */
  var ldr=document.getElementById('ldr');
  if(!ldr||ldr.classList.contains('done'))requestAnimationFrame(function(){requestAnimationFrame(start)});
  else{
    var mo=new MutationObserver(function(){if(ldr.classList.contains('done')){mo.disconnect();start()}});
    mo.observe(ldr,{attributes:true,attributeFilter:['class']});
    setTimeout(start,7000);
  }
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){var was=layer.classList.contains('no-anim');layer.classList.add('no-anim');layout();place();void layer.offsetWidth;if(!was&&!reduce)layer.classList.remove('no-anim')});
})();
