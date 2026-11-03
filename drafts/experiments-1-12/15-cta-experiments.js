/* CTA experiments. Each one starts only when its section is near the viewport and sleeps while it is off-screen,
   so nothing here costs anything until you scroll down to it. */
(function(){
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches,all=document.querySelectorAll('.xp');
  if(!all.length||!('IntersectionObserver' in window))return;

  /* .in marks sections on screen: CSS pauses marquee/seal animations without it */
  var vis=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('in',e.isIntersecting)})});
  all.forEach(function(s){vis.observe(s)});

  /* run init(section) once, shortly before the section is reached */
  var boot=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;boot.unobserve(e.target);INIT[e.target.dataset.xp](e.target)})},{rootMargin:'400px 0px'});
  function lazy(cls,n){var s=document.querySelector('.'+cls)||document.getElementById('xp8t');if(s){s.dataset.xp=n;boot.observe(s)}}
  /* run fn on each animation frame (at most once per frame) while the section is on screen */
  function whileOn(sec,start,stop){new IntersectionObserver(function(es){(es[0].isIntersecting?start:stop)()}).observe(sec)}

  var INIT={

    /* 1: click a face-down card to flip it */
    p1:function(sec){sec.addEventListener('click',function(e){var c=e.target.closest('.xp1-c');if(c)c.classList.toggle('on')})},

    /* 5: spotlight follows the pointer; drifts on its own until the first move, and only while visible */
    p5:function(s){
      var moved=false,on=false,px=0,py=0,dirty=false,t0=performance.now();
      function set(x,y){s.style.setProperty('--mx',x+'px');s.style.setProperty('--my',y+'px')}
      function frame(t){
        if(!on)return;
        if(dirty){dirty=false;var r=s.getBoundingClientRect();set(px-r.left,py-r.top)}
        else if(!moved&&!RM){var w=s.clientWidth,h=s.clientHeight,k=(t-t0)/1400;set(w*(.5+.32*Math.cos(k)),h*(.45+.25*Math.sin(k*1.3)))}
        requestAnimationFrame(frame)}
      s.addEventListener('pointermove',function(e){moved=true;px=e.clientX;py=e.clientY;dirty=true},{passive:true});
      whileOn(s,function(){if(!on){on=true;requestAnimationFrame(frame)}},function(){on=false});
    },

    /* 6: button leans toward the pointer; click throws suit confetti on a canvas that exists only during the burst */
    p6:function(sec){
      var b=sec.querySelector('.xp6-b'),cv=sec.querySelector('.xp6-cv'),cx=cv.getContext('2d'),parts=[],run=false,ev=null,pend=false;
      var G=['♠︎','♥︎','♦︎','♣︎'],C=['#6c171e','#0d3d3a','#17120f','#b8434b'];
      function lean(){pend=false;if(!ev)return;var r=b.getBoundingClientRect(),dx=ev.clientX-(r.left+r.width/2),dy=ev.clientY-(r.top+r.height/2);
        b.style.transform=Math.hypot(dx,dy)<r.width*1.4?'translate('+dx*.28+'px,'+dy*.28+'px)':''}
      sec.addEventListener('pointermove',function(e){ev=e;if(!pend){pend=true;requestAnimationFrame(lean)}},{passive:true});
      sec.addEventListener('pointerleave',function(){ev=null;b.style.transform=''});
      function frame(){
        cx.clearRect(0,0,cv.width,cv.height);
        parts=parts.filter(function(p){return p.l>0&&p.y<cv.height+60});
        parts.forEach(function(p){p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.l--;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.font='700 '+p.s+'px serif';cx.fillText(p.t,0,0);cx.restore()});
        if(parts.length)requestAnimationFrame(frame);else{run=false;cv.style.display='none';cv.width=cv.height=0}}
      b.addEventListener('click',function(){
        var d=Math.min(1.5,devicePixelRatio||1),s=sec.getBoundingClientRect(),r=b.getBoundingClientRect(),ox=(r.left+r.width/2-s.left)*d,oy=(r.top+r.height/2-s.top)*d;
        cv.width=sec.clientWidth*d;cv.height=sec.clientHeight*d;cv.style.display='block';cx.textAlign='center';
        for(var i=0;i<70;i++){var a=Math.random()*6.283,v=(6+Math.random()*16)*d;parts.push({x:ox,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-8*d,g:.35*d,r:0,vr:(Math.random()-.5)*.4,s:Math.round((22+Math.random()*40)*d),t:G[i%4],c:C[i%4],l:170})}
        if(!run){run=true;requestAnimationFrame(frame)}
        setTimeout(function(){var f=document.getElementById('contact');if(f)f.scrollIntoView({behavior:RM?'auto':'smooth'})},1200)});
    },

    /* 7: words fill in as you scroll; the scroll listener exists only while the section is on screen */
    p7:function(sec){
      var t=document.getElementById('xp7t');
      (function wrap(n){[].slice.call(n.childNodes).forEach(function(c){
        if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;
          if(/^\s+$/.test(w))f.appendChild(document.createTextNode(w));else{var s=document.createElement('span');s.className='w';s.textContent=w;f.appendChild(s)}});n.replaceChild(f,c)}
        else if(c.nodeType===1)wrap(c)})})(t);
      var ws=[].slice.call(t.querySelectorAll('.w')),btn=sec.querySelector('.xp7-btn'),bg=sec.querySelector('.xp7-bg'),span=0,lastK=-1,lastP=-1,tick=false;
      function upd(){tick=false;
        var p=Math.max(0,Math.min(1,-sec.getBoundingClientRect().top/span)),k=Math.min(ws.length,Math.ceil(p*1.25*ws.length));
        if(k!==lastK){ws.forEach(function(w,i){w.classList.toggle('on',i<k)});lastK=k}
        if(Math.abs(p-lastP)>.002){bg.style.setProperty('--p',p);btn.classList.toggle('on',p>.92);lastP=p}}
      function req(){if(!tick){tick=true;requestAnimationFrame(upd)}}
      function size(){span=sec.offsetHeight-innerHeight;req()}
      whileOn(sec,function(){size();addEventListener('scroll',req,{passive:true});addEventListener('resize',size)},
                  function(){removeEventListener('scroll',req);removeEventListener('resize',size)});
    },

    /* 8: follow the ace. Show it, flip all face-down, shuffle with swapping arcs, let the user pick; their pick is the ace. */
    p8:function(st){
      var sec=st.closest('.xp8'),cs=[].slice.call(st.querySelectorAll('.xp8-c')),go=document.getElementById('xp8s'),rs=document.getElementById('xp8r'),cta=sec.querySelector('.xp8-cta'),
          msg=document.getElementById('xp8m'),M0=msg.textContent,pos=[0,1,2],ready=false,
          F=cs.map(function(c){var f=c.querySelector('.f');return[f.innerHTML,f.className]});
      function X(sl){return(sl-1)*cs[0].offsetWidth*1.3}
      function T(x,y,r,sc){return'translate3d('+x+'px,'+y+'px,0) rotate('+(r||0)+'deg)'+(sc?' scale('+sc+')':'')}
      function layout(){cs.forEach(function(c,i){c.style.transform=T(X(pos[i]),0)})}
      function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
      function swap(a,b,d){
        var ca=cs[a],cb=cs[b],xa=X(pos[a]),xb=X(pos[b]),lift=cs[0].offsetWidth*.45,o={duration:d,easing:'ease-in-out'};
        pos[a]=[pos[b],pos[b]=pos[a]][0];
        ca.style.zIndex=3;cb.style.zIndex=2;ca.style.transform=T(xb,0);cb.style.transform=T(xa,0);
        if(RM)return Promise.resolve();
        return Promise.all([
          ca.animate([{transform:T(xa,0)},{transform:T((xa+xb)/2,-lift,-6,1.06),offset:.5},{transform:T(xb,0)}],o).finished,
          cb.animate([{transform:T(xb,0)},{transform:T((xa+xb)/2,lift*.35,5,.94),offset:.5},{transform:T(xa,0)}],o).finished])}
      function restore(){cs.forEach(function(c,i){var f=c.querySelector('.f');f.innerHTML=F[i][0];f.className=F[i][1]})}
      layout();addEventListener('resize',layout);

      async function run(){
        go.hidden=true;rs.hidden=true;cta.hidden=true;ready=false;restore();
        cs.forEach(function(c){c.classList.remove('win','ready','dn');c.disabled=true});
        msg.textContent='تابع الآص بعينك…';cs[1].classList.add('hl');
        await sleep(RM?200:1300);cs[1].classList.remove('hl');
        cs.forEach(function(c){c.classList.add('dn')});await sleep(RM?100:700);
        for(var k=0,n=RM?2:8;k<n;k++){
          var i=Math.random()*3|0,j=(i+1+(Math.random()*2|0))%3;
          await swap(i,j,Math.max(260,560-k*40))}
        msg.textContent='أين الآص؟ اختر ورقة.';
        cs.forEach(function(c){c.disabled=false;c.classList.add('ready')});ready=true}

      async function choose(k){
        ready=false;
        cs.forEach(function(c){c.classList.remove('ready');c.disabled=true});
        if(k!==1){var a=cs[k].querySelector('.f'),b=cs[1].querySelector('.f'),h=a.innerHTML,n=a.className;a.innerHTML=b.innerHTML;a.className=b.className;b.innerHTML=h;b.className=n}
        cs[k].classList.remove('dn');cs[k].classList.add('win');
        await sleep(RM?0:800);
        cs.forEach(function(c){if(c!==cs[k])c.classList.remove('dn')});
        msg.textContent='أي ورقة تختارها، هي الرابحة. ابدأ اللعب الآن.';
        cta.hidden=false;rs.hidden=false}

      go.addEventListener('click',run);
      st.addEventListener('click',function(e){var c=e.target.closest('.xp8-c');if(c&&ready)choose(cs.indexOf(c))});
      rs.addEventListener('click',function(){
        restore();pos=[0,1,2];layout();cs.forEach(function(c){c.classList.remove('win','ready','dn');c.style.zIndex=''});
        cta.hidden=true;rs.hidden=true;go.hidden=false;msg.textContent=M0});
    },

    /* 9: bold draw. Click or drag the top card up: it flies out of the deck, flips and lands on it. */
    p9:function(st){
      var top=document.getElementById('xp9top'),card=document.getElementById('xp9c'),face=card.querySelector('.f'),h=document.getElementById('xp9h'),p=document.getElementById('xp9p'),again=document.getElementById('xp9a'),
          O=[['A','ابدأ اليوم.','احكِ لنا عن شركتك، ونكمل من هناك.'],['K','ردّ خلال يوم.','فريق صغير، ورد سريع، بلا وسطاء.'],['Q','جلسة أولى علينا.','نسمعك ونقترح عليك، من غير التزام.'],['J','خطة خلال أسبوع.','نقرأ طاولتك ثم نضع في يدك الخطوة الأولى.'],['10','ورقتك الرابحة.','نحدد معك الحركة التي تغيّر الجولة.']],
          SU=['♠︎','♥︎','♦︎','♣︎'],drawn=false,d=null,from=null;
      function T(x,y,s,r){return'translate('+x+'px,'+y+'px) rotate('+r+'deg) scale('+s+')'}
      function draw(){
        if(drawn)return;drawn=true;
        var fr=top.getBoundingClientRect(),o=O[Math.random()*O.length|0],su=SU[Math.random()*4|0];
        face.className='f'+(su==='♥︎'||su==='♦︎'?' r':'');
        face.innerHTML='<b>'+o[0]+'<i>'+su+'</i></b><span class="p">'+su+'</span>';
        h.textContent=o[1];p.textContent=o[2];
        top.style.transform='';st.classList.add('drawn');card.classList.add('on');
        var to=card.getBoundingClientRect(),dx=fr.left+fr.width/2-(to.left+to.width/2),dy=fr.top+fr.height/2-(to.top+to.height/2),s=fr.width/to.width;
        from=[dx,dy,s];
        if(!RM){
          card.animate([{transform:T(dx,dy,s,0)},{transform:T(dx*.4,dy*.4-90,1.12,-12),offset:.5},{transform:'rotate(-4deg)'}],{duration:900,easing:'cubic-bezier(.3,.8,.3,1)'});
          card.firstChild.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(180deg)',offset:.15},{transform:'rotateY(0deg)'}],{duration:900,easing:'ease-out'})}
        card.removeAttribute('aria-hidden')}
      /* drag the top card up past a threshold (or just click it) to draw */
      top.addEventListener('pointerdown',function(e){if(drawn)return;top.setPointerCapture(e.pointerId);top.classList.add('drag');d={id:e.pointerId,x:e.clientX,y:e.clientY,m:false,dx:0,dy:0}});
      top.addEventListener('pointermove',function(e){
        if(!d||e.pointerId!==d.id)return;d.dx=e.clientX-d.x;d.dy=Math.min(0,e.clientY-d.y);
        if(Math.abs(d.dx)+Math.abs(d.dy)>6)d.m=true;
        top.style.transform='translate('+d.dx*.6+'px,'+d.dy+'px) rotate('+d.dx*.05+'deg)'});
      function up(){
        if(!d)return;var g=d;d=null;top.classList.remove('drag');
        if(!g.m||-g.dy>70||Math.abs(g.dx)>110)draw();
        else{top.animate([{transform:top.style.transform},{transform:'none'}],{duration:RM?1:300,easing:'cubic-bezier(.3,1.5,.4,1)'});top.style.transform=''}}
      top.addEventListener('pointerup',up);top.addEventListener('pointercancel',up);
      top.addEventListener('click',function(e){if(e.detail===0)draw()});
      again.addEventListener('click',function(){
        if(!drawn)return;st.classList.remove('drawn');drawn=false;card.setAttribute('aria-hidden','true');
        /* the card stays put just long enough to fade away while the deck glides back to the centre */
        var a=card.animate([{opacity:1,transform:'rotate(-4deg)'},{opacity:0,transform:'rotate(-10deg) translateY(36px) scale(.92)'}],{duration:RM?1:450,easing:'ease-in'});
        a.onfinish=function(){card.classList.remove('on')};
        top.focus()})
    }
    ,

    /* 10: hold & draw. Tap cards to hold them, press draw; the hand always ends as a royal flush (held junk gets fixed too). */
    p10:function(row){
      var sec=row.closest('.xp10'),H=document.getElementById('xp10h'),msg=document.getElementById('xp10m'),go=document.getElementById('xp10d'),again=document.getElementById('xp10r'),cta=sec.querySelector('a.xp9-cta'),
          START=[['K','♠︎'],['3','♦︎'],['Q','♠︎'],['8','♣︎'],['A','♠︎']],END=[['K','♠︎'],['J','♠︎'],['Q','♠︎'],['10','♠︎'],['A','♠︎']],
          M0=msg.textContent,H0=H.innerHTML,cards=[];
      function face(c,v){var f=c.querySelector('.f');f.className='f'+(v[1]==='♥︎'||v[1]==='♦︎'?' r':'');f.innerHTML='<b>'+v[0]+'<i>'+v[1]+'</i></b><span class="p">'+v[1]+'</span>'}
      START.forEach(function(v,i){
        var c=document.createElement('button');c.type='button';c.className='xp10-c';c.style.setProperty('--i',i);
        c.innerHTML='<span class="in"><span class="f"></span><span class="b"></span></span><span class="xp10-hd">احتفظ</span>';
        face(c,v);row.appendChild(c);cards.push(c)});
      function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
      row.addEventListener('click',function(e){var c=e.target.closest('.xp10-c');if(c&&!go.disabled)c.classList.toggle('held')});
      go.addEventListener('click',async function(){
        go.disabled=true;var fixedHeld=false;
        for(var i=0;i<5;i++){
          if(START[i][0]===END[i][0]&&START[i][1]===END[i][1])continue;
          if(cards[i].classList.contains('held'))fixedHeld=true;
          cards[i].classList.remove('held');cards[i].classList.add('dn');
          await sleep(RM?0:260);face(cards[i],END[i]);cards[i].classList.remove('dn');await sleep(RM?0:200)}
        await sleep(RM?0:300);row.classList.add('win');
        H.innerHTML='رويال <em>فلاش</em>';
        msg.textContent=fixedHeld?'حتى الورقة التي تمسّكت بها، عدّلناها لك. هذه يدك.':'يد رابحة من أول سحبة. هذه يدك.';
        go.hidden=true;cta.hidden=false;again.hidden=false});
      again.addEventListener('click',function(){
        row.classList.remove('win');cards.forEach(function(c,i){c.classList.remove('held');face(c,START[i])});
        H.innerHTML=H0;msg.textContent=M0;go.disabled=false;go.hidden=false;cta.hidden=true;again.hidden=true});
    }
    ,

    /* 11: slot reels. Three strips of suits spin and stop one after another on three spades. */
    p11:function(m){
      var sec=m.closest('.xp11'),ws=[].slice.call(m.querySelectorAll('.xp11-w')),ss=ws.map(function(w){return w.firstChild}),lv=document.getElementById('xp11l'),go=document.getElementById('xp11d'),again=document.getElementById('xp11r'),cta=sec.querySelector('a.xp9-cta'),msg=document.getElementById('xp11m'),M0=msg.textContent,
          SU=['♠︎','♥︎','♦︎','♣︎'],N=30,busy=false;
      function fill(s,last){var h='';for(var i=0;i<N-1;i++){var u=SU[Math.random()*4|0];h+='<i'+(u==='♥︎'||u==='♦︎'?' class="r"':'')+'>'+u+'</i>'}s.innerHTML=h+'<i>♠︎</i>';s.style.transform=last?'translateY('+(-(N-1)/N*100)+'%)':'none'}
      ss.forEach(function(s){fill(s,true)});
      var END='translateY('+(-(N-1)/N*100)+'%)';
      async function spin(){
        if(busy)return;busy=true;go.disabled=true;lv.classList.add('pull');setTimeout(function(){lv.classList.remove('pull')},300);
        again.hidden=true;cta.hidden=true;msg.textContent='…';ws.forEach(function(w){w.classList.remove('win')});
        var done=ss.map(function(s,i){
          fill(s,false);
          if(RM){s.style.transform=END;return Promise.resolve()}
          return s.animate([{transform:'none'},{transform:END}],{duration:1500+i*650,easing:'cubic-bezier(.12,.7,.2,1)',fill:'forwards'}).finished.then(function(){s.style.transform=END})});
        await Promise.all(done);
        ss.forEach(function(s){s.getAnimations().forEach(function(a){a.cancel()});s.style.transform=END});
        ws.forEach(function(w){w.classList.add('win')});
        msg.textContent='ثلاث بستوني. الجولة لك.';go.hidden=true;cta.hidden=false;again.hidden=false;busy=false}
      go.addEventListener('click',spin);lv.addEventListener('click',function(){if(!go.hidden)spin()});
      again.addEventListener('click',function(){go.hidden=false;go.disabled=false;cta.hidden=true;again.hidden=true;msg.textContent=M0;spin()});
    }
    ,

    /* 12: scratch-off. A foil canvas over the card; scratching clears it, and about 40% cleared reveals everything. */
    p12:function(card){
      var sec=card.closest('.xp12'),cv=document.getElementById('xp12c'),cx=cv.getContext('2d'),f=document.getElementById('xp12f'),msg=document.getElementById('xp12m'),M0=msg.textContent,
          cta=sec.querySelector('a.xp9-cta'),skip=document.getElementById('xp12k'),again=document.getElementById('xp12r'),
          OF=[['A','ابدأ اليوم.','احكِ لنا عن شركتك، ونكمل من هناك.'],['K','ردّ خلال يوم.','فريق صغير، ورد سريع، بلا وسطاء.'],['Q','جلسة أولى علينا.','نسمعك ونقترح عليك، من غير التزام.'],['J','خطة خلال أسبوع.','نقرأ طاولتك ثم نضع في يدك الخطوة الأولى.']],
          GX=16,GY=22,seen,count,down=false,lx=0,ly=0,open=false,dpr=Math.min(1.5,devicePixelRatio||1);
      function foil(){
        var w=cv.width,h=cv.height,g=cx.createLinearGradient(0,0,w,h);
        cx.globalCompositeOperation='source-over';
        g.addColorStop(0,'#b9b3a6');g.addColorStop(.35,'#ece6d6');g.addColorStop(.6,'#aaa498');g.addColorStop(1,'#d9d3c3');cx.fillStyle=g;cx.fillRect(0,0,w,h);
        cx.strokeStyle='rgba(108,23,30,.35)';cx.lineWidth=2*dpr;var st=34*dpr;
        for(var i=-h;i<w;i+=st){cx.beginPath();cx.moveTo(i,0);cx.lineTo(i+h,h);cx.stroke();cx.beginPath();cx.moveTo(i+h,0);cx.lineTo(i,h);cx.stroke()}
        cx.fillStyle='#17120f';cx.textAlign='center';cx.textBaseline='middle';cx.font='700 '+(w*.2)+'px "Thmanyah Serif Display",serif';cx.fillText('اكشط',w/2,h*.46);
        cx.font='700 '+(w*.12)+'px serif';cx.fillText('♠︎',w/2,h*.66)}
      function size(){cv.width=card.clientWidth*dpr;cv.height=card.clientHeight*dpr;foil()}
      function newOffer(){var o=OF[Math.random()*OF.length|0],su=['♠︎','♥︎','♦︎','♣︎'][Math.random()*4|0];f.innerHTML='<b>'+o[0]+'<i>'+su+'</i></b><h3>'+o[1]+'</h3><p>'+o[2]+'</p>'}
      function arm(){seen=new Uint8Array(GX*GY);count=0;open=false;cv.classList.remove('gone');cta.hidden=true;again.hidden=true;skip.hidden=false;msg.textContent=M0;newOffer();size()}
      function reveal(){if(open)return;open=true;cv.classList.add('gone');cta.hidden=false;again.hidden=false;skip.hidden=true;msg.textContent='هذه ورقتك. ابدأ اللعب.'}
      function mark(x,y){var gx=Math.min(GX-1,Math.max(0,x/cv.width*GX|0)),gy=Math.min(GY-1,Math.max(0,y/cv.height*GY|0)),k=gy*GX+gx;if(!seen[k]){seen[k]=1;count++}}
      function pos(e){var r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height]}
      function scratch(x,y){
        cx.globalCompositeOperation='destination-out';cx.lineCap=cx.lineJoin='round';cx.lineWidth=46*dpr;
        cx.beginPath();cx.moveTo(lx,ly);cx.lineTo(x,y);cx.stroke();
        for(var t=0;t<=1;t+=.25)mark(lx+(x-lx)*t,ly+(y-ly)*t);lx=x;ly=y;
        if(count>GX*GY*.4)reveal()}
      cv.addEventListener('pointerdown',function(e){if(open)return;down=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}var p=pos(e);lx=p[0];ly=p[1];scratch(lx+.1,ly)});
      cv.addEventListener('pointermove',function(e){if(!down)return;var p=pos(e);scratch(p[0],p[1])});
      function up(){down=false}cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
      skip.addEventListener('click',reveal);again.addEventListener('click',arm);
      arm();
    }
  };
  lazy('xp1','p1');lazy('xp5','p5');lazy('xp6','p6');lazy('xp7','p7');lazy('xp8-stage','p8');lazy('xp9-stage','p9');lazy('xp10-row','p10');lazy('xp11-m','p11');lazy('xp12-card','p12');
})();
