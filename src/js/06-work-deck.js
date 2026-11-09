(function(){
  var AR='0123456789';
  function ar(n){return String(n).replace(/\d/g,function(c){return AR[c]})}
  var inited=false;
  var deck=document.getElementById('wkDeck'),num=document.getElementById('wkNum'),
      bL=document.getElementById('wkPrev'),bR=document.getElementById('wkNext'),
      cards=[],n=0,win=3,act=0,cw=300,gap=18,step=318,pk=14,sp=0,tk=false,curT=0,scrollOff=0,dealt=false,steered=false,
      still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bL.setAttribute('aria-label','تحريك الأوراق لليسار');bR.setAttribute('aria-label','تحريك الأوراق لليمين');
  /* the cards are written in index.html in project order (good for crawlers, screen readers and no-JS); the visual order runs the other way, so the first project is the rightmost card */
  cards=[].slice.call(deck.querySelectorAll('.wc')).reverse();n=cards.length;act=n-3;
  cards.forEach(function(c){c.setAttribute('aria-hidden','true');c._h=true});
  deck.setAttribute('role','group');deck.setAttribute('aria-roledescription','عرض دوار');
  num.setAttribute('aria-live','polite');num.setAttribute('aria-atomic','true');
  function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
  function measure(){
    var dw=deck.clientWidth;
    win=dw<760?1:3;
    if(win===3){gap=Math.max(14,dw*.014);cw=Math.min(360,(dw-2*gap-150)/3);step=cw+gap}
    else{gap=0;cw=Math.min(dw*.68,340);step=cw*.9}
    pk=Math.max(9,cw*.045);
    deck.style.setProperty('--cw',cw+'px');
    if(!inited){inited=true;if(win===1)act=n-1}/* phone: start on the first project (the rightmost card in the order) */
    act=clamp(act,0,n-win);
  }
  /* rel is the distance from the first window slot. Inside the window cards lie flat and fully visible;
     before it they fan out behind the first slot (left pile), after it behind the last slot (right pile). */
  function pose(rel){
    var w1=win-1,x0=-(w1/2)*step,d=0,x,y=0,r=0,sc=1;
    if(rel<0){d=-rel;var k=Math.min(d,4);x=x0-k*pk;y=k*5;r=-k*2.4;sc=1-k*.012}
    else if(rel>w1){d=rel-w1;var k2=Math.min(d,4);x=x0+w1*step+k2*pk;y=k2*5;r=k2*2.4;sc=1-k2*.012}
    else{x=x0+rel*step}
    return {x:x,y:y,r:r,s:sc,z:100-Math.round(Math.min(d,9)*10)};
  }
  /* every style write goes through put(): a value the card already has is skipped, so scrolling past does not restyle cards that did not move */
  function put(c,k,v){var m=c._v||(c._v={});if(m[k]!==v){m[k]=v;c.style.setProperty(k,v)}}
  function render(t,delay){
    curT=t;
    var te=t+scrollOff;if(te<0&&t>=0)te=0;
    cards.forEach(function(c,i){
      if(i===snatchI)return;
      var p=pose(i-te);
      put(c,'--x',p.x.toFixed(1)+'px');put(c,'--y',p.y+'px');
      put(c,'--r',p.r.toFixed(2)+'deg');put(c,'--s',p.s.toFixed(3));
      put(c,'--o','1');put(c,'--d',delay?(i*70)+'ms':'0ms');
      c._x=p.x;tiltOne(c);
      put(c,'z-index',String(p.z));
      var on=i-te>-.5&&i-te<win-.5;
      c.classList.toggle('top',on);
      if(c._h===on){c._h=!on;if(on)c.removeAttribute('aria-hidden');else c.setAttribute('aria-hidden','true')}/* cards waiting in the piles are hidden from screen readers; only the visible ones are read */
    });
  }
  function settle(){
    var lo=n-act-win+1,hi=n-act;
    num.textContent=win===1?ar(hi)+' / '+ar(n):ar(lo)+'–'+ar(hi)+' / '+ar(n);
    bL.style.opacity=act>=n-win?.35:1;bR.style.opacity=act<=0?.35:1;
    render(act,false);
  }
  /* phone: the card that leaves the window is flicked off to the side it ends up on (left pile when moving forward, right pile when moving back), then tucks into its pile */
  var snatchI=-1;
  var tapDir=-1;/* direction a tap keeps moving in: -1 forward through the projects, +1 back; it flips only at the first or last card, so taps never ping-pong between two cards */
  function snatch(i,dir){
    var c=cards[i];snatchI=i;c.classList.add('snatch');
    put(c,'--x',(dir*cw*1.2).toFixed(1)+'px');put(c,'--r',(dir*16).toFixed(2)+'deg');put(c,'--s','1.000');put(c,'--d','0ms');put(c,'z-index','200');
    setTimeout(function(){snatchI=-1;c.classList.remove('snatch');render(curT,false)},240);
  }
  /* the scroll slide hides cards in the side piles that drag/arrows could never reach (the first project sat hidden in the right pile); on the first use, fold the slide into the position and stop sliding */
  function steer(){
    if(steered)return;steered=true;
    if(scrollOff){act=clamp(Math.round(act+scrollOff),0,n-win);scrollOff=0;render(act,false)}
  }
  function go(i){
    steer();
    var old=act;act=clamp(i,0,n-win);if(act!==old)tapDir=act<old?-1:1;settle();
    if(win===1&&act!==old&&!still&&dealt&&snatchI<0)snatch(old,act>old?-1:1);
  }
  bL.addEventListener('click',function(){go(act+1)});
  bR.addEventListener('click',function(){go(act-1)});
  deck.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){go(act+1);e.preventDefault()}
    else if(e.key==='ArrowRight'){go(act-1);e.preventDefault()}
  });
  var down=false,dragging=false,pid=-1,sx=0,dx=0,lastX=0,lastT=0,vx=0,moved=0,tgt=-1;
  deck.addEventListener('pointerdown',function(e){
    if(down||(e.pointerType==='mouse'&&e.button!==0))return;
    if(e.target.closest&&e.target.closest('a'))return;/* a project link is a plain click: no drag, no pointer capture *//* one pointer at a time; right/middle click does not start a drag */
    steer();
    down=true;pid=e.pointerId;sx=lastX=e.clientX;lastT=e.timeStamp;dx=0;vx=0;moved=0;
    var el=e.target.closest&&e.target.closest('.wc');tgt=el?cards.indexOf(el):-1;
    try{deck.setPointerCapture(e.pointerId)}catch(x){}
  });
  deck.addEventListener('pointermove',function(e){
    if(!down||e.pointerId!==pid)return;
    dx=e.clientX-sx;moved=Math.max(moved,Math.abs(dx));
    var dt=Math.max(1,e.timeStamp-lastT);vx=.8*vx+.2*((e.clientX-lastX)/dt);lastX=e.clientX;lastT=e.timeStamp;
    if(moved>5){
      if(!dragging){dragging=true;deck.classList.add('drag');cards.forEach(function(c){c.classList.add('nt')})}
      if(win===1){
        /* phone: the top card follows the finger (with resistance at the ends); the others stay put */
        var edge=(dx>0&&act<=0)||(dx<0&&act>=n-1),mx=edge?dx*.3:dx,top=cards[act];
        put(top,'--x',mx.toFixed(1)+'px');put(top,'--r',(mx/cw*14).toFixed(2)+'deg');put(top,'--d','0ms');put(top,'z-index','150');
        return;
      }
      var m=n-win,t=act-dx/step;
      t=t<0?t*.25:(t>m?m+(t-m)*.25:t);
      render(t,false);
    }
  });
  function end(e){
    if(!down||e.pointerId!==pid)return;down=false;dragging=false;deck.classList.remove('drag');
    cards.forEach(function(c){c.classList.remove('nt')});
    if(moved<=5||e.type==='pointercancel'){/* a cancel means the browser took the gesture (a vertical page scroll): spring back, never change card */
      if(e&&e.type==='pointerup'&&tgt>-1){
        if(tgt<act)go(tgt);else if(tgt>act+win-1)go(tgt-(win-1));
        else if(win===1){var nx=act+tapDir;if(nx<0||nx>n-1){tapDir=-tapDir;nx=act+tapDir}go(nx)}/* phone: tap = next card in the current direction; at either end the direction turns around */
        else settle();
      }else settle();
      return;
    }
    if(win===1){/* phone: one card per swipe; far enough or fast enough moves it, otherwise it springs back */
      go(Math.abs(dx)>step*.25||Math.abs(vx)>.5?(dx>0?act-1:act+1):act);return;
    }
    var to=Math.round(clamp(act-dx/step-vx*160/step,0,n-win));
    if(to===act&&Math.abs(dx)>step*.3)to=clamp(act+(dx>0?-1:1),0,n-win);
    go(to);
  }
  deck.addEventListener('pointerup',end);
  deck.addEventListener('pointercancel',end);
  var wt=0;
  deck.addEventListener('wheel',function(e){
    if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Math.abs(e.deltaX)>12){
      var now=Date.now();if(now-wt<450)return;wt=now;
      go(act+(e.deltaX>0?1:-1));
    }
  },{passive:true});/* passive: the browser scrolls the page at once instead of waiting for this handler. It no longer calls preventDefault, so the sideways swipe's back/forward gesture is switched off while the pointer is over the deck instead (below) */
  var root=document.documentElement;
  deck.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')root.style.overscrollBehaviorX='none'});
  deck.addEventListener('pointerleave',function(){root.style.overscrollBehaviorX=''});
  /* scroll tilt: each card leans toward the centre like a curved surface, and the whole row swings a little as the page scrolls; the side piles keep their stacks */
  function tiltOne(c){
    var lean=clamp((c._x||0)/step,-3,3)*-6;
    put(c,'--ry',(still?0:lean+sp*16).toFixed(2)+'deg');
  }
  var vis=true;/* the scroll effects only matter while the section is on (or near) the screen */
  function onScroll(){
    if(tk||!vis)return;tk=true;
    requestAnimationFrame(function(){
      tk=false;
      var r=deck.getBoundingClientRect(),h=window.innerHeight;
      sp=clamp((r.top+r.height/2-h/2)/(h*.6),-1,1);
      /* the row slides along as the section scrolls past: two card steps in total, the piles trade cards */
      var q=clamp((h-r.top)/(h+r.height),0,1);
      scrollOff=(still||win===1||steered)?0:-(clamp(q,.2,.8)-.2)/.6*2;/* phone: no scroll slide, so the card on top is always the one the taps and drags work on */
      if(dealt)render(curT,false);else cards.forEach(tiltOne);
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  /* only a width change re-measures: phone browsers fire resize while the address bar slides, which must not interrupt a drag or flick */
  var rw=deck.clientWidth,rt=0;
  window.addEventListener('resize',function(){
    if(rt)return;
    rt=requestAnimationFrame(function(){rt=0;var w=deck.clientWidth;if(w===rw)return;rw=w;measure();settle()});
  });
  measure();
  /* deal in once when the section first scrolls into view */
  cards.forEach(function(c){c.classList.add('nt');put(c,'--x','0px');put(c,'--y','80px');put(c,'--r','0deg');put(c,'--s','0.8');put(c,'--o','0')});
  deck.classList.add('ready');/* from here the stylesheet stops treating the deck as the plain no-JS list */
  function deal(){
    dealt=true;
    measure();
    cards.forEach(function(c){c.classList.remove('nt')});
    var lo=n-act-win+1,hi=n-act;
    num.textContent=win===1?ar(hi)+' / '+ar(n):ar(lo)+'–'+ar(hi)+' / '+ar(n);
    bL.style.opacity=act>=n-win?.35:1;bR.style.opacity=act<=0?.35:1;
    render(act,true);
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){io.disconnect();deal()}},{threshold:.25});
    io.observe(deck);
    new IntersectionObserver(function(en){vis=en[0].isIntersecting;if(vis)onScroll()},{rootMargin:'120px 0px'}).observe(deck);
  }else deal();
})();
