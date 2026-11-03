(function(){
  var S={s:'♠︎',h:'♥︎',d:'♦︎',c:'♣︎'};
  var D=[
    {ic:'content',t:'محتوى',p:'حكايات تكسب الانتباه وتحافظ عليه.',r:'A',s:'s'},
    {ic:'design',t:'تصميم',p:'هوية وحرفة حتى آخر تفصيلة.',r:'K',s:'h'},
    {ic:'ads',t:'إعلانات',p:'وصول مدفوع مبني على ما تقوله الأرقام.',r:'Q',s:'d'},
    {ic:'growth',t:'نمو',p:'حصة سوقية تُكسب بخطوة مدروسة بعد خطوة.',r:'A',s:'c'}
  ];
  var story=document.getElementById('story'),stage=story.querySelector('.stage'),layer=document.getElementById('hand'),
      sec=document.getElementById('sec2'),fade=stage.querySelectorAll('.wm,.sub');
  var slots=D.map(function(d,i){
    var s=document.createElement('div'),b=document.createElement('button'),ix=d.r+'<i>'+S[d.s]+'</i>';
    s.className='slot';s.style.zIndex=i+1;
    b.type='button';b.setAttribute('data-suit',S[d.s]);
    b.className='card pk'+((d.s==='h'||d.s==='d')?' red':'');
    b.innerHTML=PlayingCard.corners(d.r,d.s)+
      '<div class="med"><svg class="ic" viewBox="0 0 48 48"><use href="#l-'+d.ic+'"/></svg></div>'+
      '<div class="body"><h4>'+d.t+'</h4><span class="rule"></span><p>'+d.p+'</p></div>';
    s.appendChild(b);(i===3?document.getElementById('flyer'):layer).appendChild(s);return s;
  });
  var n2=document.getElementById('next2'),swapped=false,heroHTML='',bigHTML='',cardEl=null,FLY=3,mini=document.getElementById('mini'),big=document.getElementById('bigcard'),REST=[-2,1.5,-1,2],n=slots.length,mid=(n-1)/2,A=[],B=[],C=[],G=[],W,H,w,h,range;
  cardEl=slots[3].firstChild;heroHTML=cardEl.innerHTML;bigHTML=big.innerHTML;
  var SEG=[[.04,.30],[.30,.56],[.56,.90]];
  function clamp(x){return Math.max(0,Math.min(1,x))}
  function inOut(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function back(t){var c1=1.5,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
  function mix(a,b,e){return {x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e,r:a.r+(b.r-a.r)*e,s:a.s+(b.s-a.s)*e,ry:a.ry+(b.ry-a.ry)*e}}
  function layout(){
    W=stage.clientWidth;H=stage.clientHeight;
    w=slots[0].offsetWidth;h=w*1.4;
    var g=Math.max(16,W*.045),gap=Math.max(10,W*.018),i,w2;
    var sB=Math.min(1.12,(W-2*g)/(4*w*1.04));
    for(i=0;i<n;i++){
      var r=(i-mid)*7,rad=r*Math.PI/180;
      A[i]={x:W/2+(i-mid)*w*.8+1.26*w*Math.sin(rad),y:H+1.06*w-1.26*w*Math.cos(rad),r:r,s:1,ry:0};
      B[i]={x:W/2+(i-mid)*w*1.04*sB,y:H*.52,r:0,s:sB,ry:0};
      C[i]={x:W/2+(i-mid)*5,y:H*.5-(i-mid)*4,r:(i-mid)*3,s:sB*.9,ry:180};
    }
    if(W>=760){
      var Wg=W/2-1.5*g,top=108,Hh=H-132;
      w2=Math.min((Wg-gap)/2,(Hh-gap)/2/1.4,w*1.25);
      var gx0=g+(Wg-(2*w2+gap))/2,gy0=top+(Hh-(2*1.4*w2+gap))/2;
      for(i=0;i<n;i++)G[i]={x:gx0+w2/2+(i%2)*(w2+gap),y:gy0+.7*w2+Math.floor(i/2)*(1.4*w2+gap),r:REST[i],s:w2/w,ry:360};
    }else{
      var secB=sec.offsetTop+sec.offsetHeight+20,avail=Math.max(120,H-28-secB);
      w2=Math.min((W-2*g-gap)/2,(avail-gap)/2/1.4);
      var x0=(W-(2*w2+gap))/2,y0=secB+Math.max(0,(avail-(2*1.4*w2+gap))/2);
      for(i=0;i<n;i++){
        var row=Math.floor(i/2);
        G[i]={x:x0+w2/2+(i%2)*(w2+gap),y:y0+.7*w2+row*(1.4*w2+gap),r:REST[i],s:w2/w,ry:360};
      }
    }
    range=story.offsetHeight-H;
  }
  function loc(p,k,i){
    var a=SEG[k][0],len=SEG[k][1]-a,st=len*.1;
    return clamp((p-a-i*st)/(len-(n-1)*st));
  }
  function update(){
    var sr=story.getBoundingClientRect(),
        P=range>0?clamp((-sr.top)/range):0,
        p=clamp(P/.94),f=clamp(p/.2),t=clamp((p-.8)/.12),
        dd=(H-sr.bottom)/H,r=clamp(dd/1.6);
    mini.classList.toggle('on',t>=.5);
    slots.forEach(function(sl,i){
      var t1=loc(p,0,i),t2=loc(p,1,i),t3=loc(p,2,i),dir=(i%2?-1:1);
      var s=mix(A[i],B[i],inOut(t1));
      s.y-=Math.sin(Math.PI*t1)*H*.04;
      s=mix(s,C[i],inOut(t2));
      s.y+=dir*Math.sin(Math.PI*t2)*H*.14;
      s.x+=dir*Math.sin(Math.PI*t2)*W*.05;
      s=mix(s,G[i],back(t3));
      if(i===FLY){
        var bw0=w*s.s,bw,cx=s.x,cy=s.y,rot=s.r,ang=0,lift=0,tr,
            nr=n2.getBoundingClientRect(),pre=H*.9-nr.top,
            m=inOut(clamp(pre/(.55*H))),fp=clamp((pre-.55*H)/H),g=0;
        cx+=(W/2-cx)*m;cy+=(H/2-cy)*m;rot*=(1-m);
        bw=bw0*(1+.25*m);
        ang=720*inOut(fp);lift=Math.sin(Math.PI*fp)*160;
        if(g>0){
          tr=big.getBoundingClientRect();
          cx+=(tr.left+tr.width/2-cx)*g;cy+=(tr.top+tr.height/2-cy)*g;
          bw+=(tr.width-bw)*g;
        }
        var want=ang>=180;
        if(want!==swapped){swapped=want;cardEl.innerHTML=want?bigHTML:heroHTML;cardEl.classList.toggle('swapped',want)}
        /* the card keeps its normal size and is scaled like the other three: resizing it (width, height, --w) every frame
           made the browser re-lay out and redraw its text at a new font size on each scroll frame, which stuttered on the first pass */
        if(cardEl.style.borderRadius!==w*.07+'px')cardEl.style.borderRadius=w*.07+'px';
        sl.style.visibility=g>=1?'hidden':'visible';
        big.classList.toggle('on',g>=1);
        sl.style.transform='translate('+(cx-w/2)+'px,'+(cy-h/2)+'px) translateZ('+lift+'px) rotate('+rot+'deg) rotateY('+s.ry+'deg) rotate3d(1,1,0,'+ang+'deg) scale('+(bw/w)+')';
        return;
      }
      sl.style.transform='translate('+(s.x-w/2)+'px,'+(s.y-h/2)+'px) rotate('+s.r+'deg) rotateY('+s.ry+'deg) scale('+s.s+')';
    });
    for(var k=0;k<fade.length;k++){fade[k].style.opacity=1-f;fade[k].style.transform='translateY('+(-f*40)+'px)';fade[k].style.pointerEvents=f>.3?'none':''}
    sec.style.opacity=t;sec.style.transform='translateY('+((1-t)*30)+'px)';
  }
  var tick=false;
  function req(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;update()})}}
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',function(){layout();update()});
  layout();update();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){layout();update()});
})();
