(function(){
  var S={s:'♠︎',h:'♥︎',d:'♦︎',c:'♣︎'};
  var D=[
    {ic:'content',t:'محتوى',p:'حكايات تكسب الانتباه وتحافظ عليه.',r:'A',s:'s'},
    {ic:'design',t:'تصميم',p:'هوية وحرفة حتى آخر تفصيلة.',r:'K',s:'h'},
    {ic:'ads',t:'إعلانات',p:'وصول مدفوع مبني على ما تقوله الأرقام.',r:'Q',s:'d'},
    {ic:'growth',t:'نمو',p:'حصة سوقية تكسب بخطوة مدروسة بعد خطوة.',r:'A',s:'c'}
  ];
  var story=document.getElementById('story'),stage=story.querySelector('.stage'),layer=document.getElementById('hand');
  var slots=D.map(function(d,i){
    var s=document.createElement('div'),b=document.createElement('button'),ix=d.r+'<i>'+S[d.s]+'</i>';
    s.className='slot';s.style.zIndex=i+1;s.style.setProperty('--i',i);
    b.type='button';b.setAttribute('data-suit',S[d.s]);
    b.className='card pk'+((d.s==='h'||d.s==='d')?' red':'');
    b.innerHTML=PlayingCard.corners(d.r,d.s)+
      '<div class="med"><svg class="ic" viewBox="0 0 48 48"><use href="#l-'+d.ic+'"/></svg></div>'+
      '<div class="body"><h4 aria-level="2">'+d.t+'</h4><span class="rule"></span><p>'+d.p+'</p></div>';
    s.appendChild(b);layer.appendChild(s);return s;
  });
  var mini=document.getElementById('mini'),n=slots.length,mid=(n-1)/2,A=[],W,H,w,h,state='pre',started=false,pan=0,panMax=0;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* hero cards: dealt in from below the screen when the page opens (timed), dropped away once you scroll past the hero.
     Positions are the resting fan (A); "pre" and "out" are the same fan pushed down off the stage. */
  function r2(i){return (i-mid)*7*Math.PI/180}
  function layout(){
    W=stage.clientWidth;H=stage.clientHeight;
    w=slots[0].offsetWidth;h=w*1.4;
    /* the fan rests fully inside the stage: lift it until the lowest card edge (plus its shadow) clears the bottom */
    var lift=0,gap=Math.max(16,w*.08);
    for(var i=0;i<n;i++){
      var r=(i-mid)*7,rad=r*Math.PI/180;
      A[i]={x:W/2+(i-mid)*w*.8+1.26*w*Math.sin(rad),y:H+1.06*w-1.26*w*Math.cos(rad),r:r};
      lift=Math.max(lift,A[i].y+h/2*Math.cos(rad)+w/2*Math.abs(Math.sin(rad))-(H-gap));
    }
    /* never lift into the tagline: if the full fan does not fit under it, the cards sit lower and the bottom is cut by the stage */
    var meta=stage.querySelector('.hero-meta'),cta=stage.querySelector('.hero-cta');
    if(meta){
      var mb=meta.getBoundingClientRect().bottom;
      if(cta&&getComputedStyle(cta).position==='static')mb=Math.max(mb,cta.getBoundingClientRect().bottom);
      var floor=mb-stage.getBoundingClientRect().top+20,room=1e9;
      for(i=0;i<n;i++){var q=r2(i);room=Math.min(room,A[i].y-(h/2*Math.cos(q)+w/2*Math.abs(Math.sin(q)))-floor)}
      lift=Math.max(0,Math.min(lift,room));
    }
    for(i=0;i<n;i++)A[i].y-=lift;
    /* narrow screens: the fan is wider than the stage, so it can be dragged sideways; panMax is how far it may move either way to bring an end card fully into view */
    var lo=1e9,hi=-1e9;
    for(i=0;i<n;i++){var e=h/2*Math.abs(Math.sin(A[i].r*Math.PI/180))+w/2*Math.cos(A[i].r*Math.PI/180);lo=Math.min(lo,A[i].x-e);hi=Math.max(hi,A[i].x+e)}
    panMax=Math.max(0,(hi-lo-(W-32))/2);
    pan=Math.max(-panMax,Math.min(panMax,pan));
    layer.classList.toggle('pan',panMax>0);
  }
  function place(){
    slots.forEach(function(sl,i){
      var a=A[i],dy=state==='in'?0:(state==='pre'?h*1.4:h*1.1),dr=state==='out'?(i-mid)*10:0;
      sl.style.transform='translate('+(a.x+pan-w/2)+'px,'+(a.y-h/2+dy)+'px) rotate('+(a.r+dr)+'deg)';
      sl.style.opacity=state==='in'?1:0;
    });
    layer.classList.toggle('out',state==='out');
  }
  function update(){
    if(!started)return;
    mini.classList.toggle('on',stage.getBoundingClientRect().bottom<H*.3);
  }
  /* drag, swipe, trackpad or Tab moves the fan sideways (only when it overflows); vertical swipes still scroll the page */
  function setPan(v){pan=Math.max(-panMax,Math.min(panMax,v));place()}
  var dx0,pan0,drag=false,moved=false,pid;
  stage.addEventListener('pointerdown',function(e){
    if(!panMax||(e.pointerType==='mouse'&&e.button)||!e.target.closest('.card,.cards'))return;
    drag=true;moved=false;pid=e.pointerId;dx0=e.clientX;pan0=pan;
  });
  stage.addEventListener('pointermove',function(e){
    if(!drag||e.pointerId!==pid)return;
    var d=e.clientX-dx0;
    if(!moved&&Math.abs(d)<6)return;
    if(!moved){moved=true;layer.classList.add('no-anim','drag');try{stage.setPointerCapture(pid)}catch(_){}}
    setPan(pan0+d);
  });
  function end(e){
    if(!drag||e.pointerId!==pid)return;
    drag=false;layer.classList.remove('drag');
    if(!reduce)layer.classList.remove('no-anim');
  }
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  stage.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  stage.addEventListener('wheel',function(e){
    if(!panMax||Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;
    e.preventDefault();setPan(pan-e.deltaX);
  },{passive:false});
  layer.addEventListener('focusin',function(e){
    var i=slots.indexOf(e.target.closest('.slot'));
    if(panMax&&i>-1)setPan(W/2-A[i].x);
  });
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
