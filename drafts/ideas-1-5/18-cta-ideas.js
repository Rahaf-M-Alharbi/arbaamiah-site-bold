/* Five closing-section ideas (see 32-cta-ideas.css). Each starts once, shortly before its section is reached. */
(function(){
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches,secs=document.querySelectorAll('.xpi');
  if(!secs.length||!('IntersectionObserver' in window))return;
  var SP=['♠︎','♥︎','♦︎','♣︎'];
  var S=[['A',SP[0],'المحتوى','نكتب ما يشبهك ويُقنع جمهورك.'],['K',SP[1],'التصميم','هوية وحرفة حتى آخر تفصيل.'],['Q',SP[2],'الإعلانات','حملات تصل للناس المناسبين.'],['J',SP[3],'النمو','نقيس ونجرّب ونكبّر ما ينجح.'],['10',SP[0],'جلسة أولى','جلسة أولى علينا، بلا التزام.']];
  function card(s,cls){
    var red=s[1]===SP[1]||s[1]===SP[2];
    return '<button type="button" class="bc '+(cls||'')+'" aria-label="'+s[2]+'"><span class="in"><span class="b">٤٠٠</span><span class="f'+(red?' r':'')+'"><b>'+s[0]+'<i>'+s[1]+'</i></b><strong>'+s[2]+'</strong><span class="p">'+s[1]+'</span></span></span></button>'}
  function q(sec,sel){return sec.querySelector(sel)}
  function show(sec){var b=q(sec,'.xi-btns');if(b)b.classList.add('xi-show')}
  function msg(sec,s){q(sec,'.xi-msg').textContent=s?s[2]+': '+s[3]:''}
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.random()*(i+1)|0,t=a[i];a[i]=a[j];a[j]=t}return a}
  function anim(el,kf,o){return el.animate(kf,{duration:RM?1:o.d,easing:o.e||'ease-out',delay:RM?0:(o.delay||0),fill:o.fill||'none'})}

  var INIT={
    /* 1: flip the four. Click a face-down card to reveal what it is. */
    1:function(sec){
      var row=q(sec,'.xi1-row'),R=[-4,-1.5,1.5,4];
      row.innerHTML=S.slice(0,4).map(function(s,i){return card(s).replace('class="bc ','style="--r:'+R[i]+'deg" class="bc ')}).join('');
      row.addEventListener('click',function(e){var c=e.target.closest('.bc');if(!c)return;c.classList.toggle('on');
        var i=[].indexOf.call(row.children,c);if(c.classList.contains('on')){msg(sec,S[i]);show(sec)}})
    },

    /* 2: swipe the stack. Drag the top card sideways (or click it) and it flies off. */
    2:function(sec){
      var st=q(sec,'.xi2-st'),end=q(sec,'.xi2-end'),stack=[];
      function build(){st.innerHTML=S.slice(0,4).reverse().map(function(s){return card(s,'up')}).join('');stack=[].slice.call(st.children);end.classList.remove('xi-show');lay();msg(sec,S[0])}
      function lay(){stack.forEach(function(c,i){var k=stack.length-1-i;c.style.setProperty('--k',k);c.style.transform='';c.disabled=k!==0});
        var top=stack[stack.length-1];if(top){var t=top.getAttribute('aria-label');msg(sec,S.filter(function(x){return x[2]===t})[0])}}
      function fly(c,dir){
        c.disabled=true;
        var a=anim(c,[{transform:c.style.transform||'none',opacity:1},{transform:'translate('+dir*520+'px,-40px) rotate('+dir*24+'deg)',opacity:0}],{d:380,e:'ease-in',fill:'forwards'});
        a.onfinish=function(){c.remove();stack.pop();if(stack.length)lay();else{msg(sec,null);end.classList.add('xi-show')}}}
      var d=null;
      st.addEventListener('pointerdown',function(e){var c=e.target.closest('.bc');if(!c||c!==stack[stack.length-1])return;c.setPointerCapture(e.pointerId);c.classList.add('drag');d={c:c,id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,m:false}});
      st.addEventListener('pointermove',function(e){if(!d||e.pointerId!==d.id)return;d.dx=e.clientX-d.x;var dy=e.clientY-d.y;if(Math.abs(d.dx)+Math.abs(dy)>6)d.m=true;d.c.style.transform='translate('+d.dx+'px,'+dy*.3+'px) rotate('+d.dx*.06+'deg)'});
      function up(){if(!d)return;var g=d;d=null;g.c.classList.remove('drag');
        if(!g.m||Math.abs(g.dx)>90)fly(g.c,g.dx<0?-1:1);
        else{anim(g.c,[{transform:g.c.style.transform},{transform:'none'}],{d:300,e:'cubic-bezier(.3,1.5,.4,1)'});g.c.style.transform=''}}
      st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
      st.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){var c=stack[stack.length-1];if(c)fly(c,e.key==='ArrowLeft'?-1:1)}});
      q(sec,'.xi2-again').addEventListener('click',build);
      build()
    },

    /* 3: shuffle and deal. The deck riffles, three cards are dealt face-down, pick one. */
    3:function(sec){
      var st=q(sec,'.xi3-st'),deck=q(sec,'.xi3-deck'),row=q(sec,'.xi3-row'),go=q(sec,'.xi3-go'),busy=false,dealt=false;
      deck.innerHTML=[0,1,2,3,4].map(function(){return card(S[0])}).join('');
      function deal(){
        row.innerHTML=shuffle(S.slice()).slice(0,3).map(function(s){return card(s)}).join('');
        st.classList.add('dealt');dealt=true;
        var dr=deck.getBoundingClientRect();
        [].forEach.call(row.children,function(c,i){var r=c.getBoundingClientRect();
          anim(c,[{transform:'translate('+(dr.left+dr.width/2-r.left-r.width/2)+'px,'+(dr.top+dr.height/2-r.top-r.height/2)+'px) rotate('+(i-1)*6+'deg)'},{transform:'none'}],{d:520,delay:i*140,e:'cubic-bezier(.3,1.1,.4,1)',fill:'backwards'})});
        go.textContent='اخلط من جديد ↺';busy=false;msg(sec,null);q(sec,'.xi-msg').textContent='اختر ورقة.'}
      go.addEventListener('click',function(){
        if(busy)return;busy=true;st.classList.remove('dealt');dealt=false;row.innerHTML='';sec.querySelector('.xi-btns').classList.remove('xi-show');q(sec,'.xi-msg').textContent='';
        var cs=[].slice.call(deck.children),n=0;
        cs.forEach(function(c,i){var x=(i%2?1:-1)*(46+i*6);
          var a=anim(c,[{transform:'none'},{transform:'translateX('+x+'px) rotate('+x*.12+'deg)',offset:.4},{transform:'none'}],{d:RM?1:700,delay:i*40,e:'ease-in-out'});
          a.onfinish=function(){if(++n===cs.length)deal()}})});
      row.addEventListener('click',function(e){var c=e.target.closest('.bc');if(!c||!dealt)return;
        [].forEach.call(row.children,function(x){x.classList.toggle('dim',x!==c)});c.classList.add('on');
        var t=c.querySelector('strong').textContent;msg(sec,S.filter(function(s){return s[2]===t})[0]);show(sec)})
    },

    /* 4: the fan. The hand spreads wider the further the pointer is from the middle; click a card to pull it out. */
    4:function(sec){
      var hand=q(sec,'.xi4-hand');
      hand.innerHTML=S.map(function(s,i){return card(s).replace('class="bc ','style="--i:'+i+'" class="bc ')}).join('');
      sec.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;var r=sec.getBoundingClientRect(),n=(e.clientX-r.left)/r.width;hand.style.setProperty('--sp',(4+9*Math.abs(n-.5)*2).toFixed(2)+'deg')},{passive:true});
      hand.addEventListener('click',function(e){var c=e.target.closest('.bc');if(!c)return;
        var was=c.classList.contains('sel');[].forEach.call(hand.children,function(x){x.classList.remove('sel','on')});
        hand.classList.toggle('picked',!was);
        if(!was){c.classList.add('sel','on');msg(sec,S[[].indexOf.call(hand.children,c)]);show(sec)}else msg(sec,null)})
    },

    /* 5: lay it on the table. Drag the card onto the dashed slot; it snaps in and the button appears. */
    5:function(sec){
      var tb=q(sec,'.xi5-tb'),slot=q(sec,'.xi5-slot'),c,d=null,done=false;
      tb.insertAdjacentHTML('afterbegin',card(['A',SP[0],'ورقتك',''],'up'));c=tb.firstChild;
      function near(){var a=c.getBoundingClientRect(),b=slot.getBoundingClientRect();return Math.hypot(a.left+a.width/2-b.left-b.width/2,a.top+a.height/2-b.top-b.height/2)<a.width*.6}
      c.addEventListener('pointerdown',function(e){if(done)return;c.setPointerCapture(e.pointerId);c.classList.add('drag');d={id:e.pointerId,x:e.clientX,y:e.clientY,r:c.getBoundingClientRect(),dx:0,dy:0}});
      c.addEventListener('pointermove',function(e){if(!d||e.pointerId!==d.id)return;d.dx=e.clientX-d.x;d.dy=e.clientY-d.y;c.style.transform='translate('+d.dx+'px,'+d.dy+'px) rotate('+d.dx*.03+'deg)';slot.classList.toggle('hot',near())});
      function up(){if(!d)return;var g=d;d=null;c.classList.remove('drag');
        if(near()){var b=slot.getBoundingClientRect(),tx=b.left+b.width/2-g.r.left-g.r.width/2,ty=b.top+b.height/2-g.r.top-g.r.height/2;
          anim(c,[{transform:c.style.transform},{transform:'translate('+tx+'px,'+ty+'px) scale(1.06)',offset:.7},{transform:'translate('+tx+'px,'+ty+'px)'}],{d:340,fill:'forwards'});
          done=true;slot.classList.remove('hot');slot.classList.add('done');q(sec,'.xi-msg').textContent='وصلت ورقتك. هيا نكمل.';show(sec)}
        else{anim(c,[{transform:c.style.transform},{transform:'none'}],{d:320,e:'cubic-bezier(.3,1.5,.4,1)'});c.style.transform='';slot.classList.remove('hot')}}
      c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
      q(sec,'.xi5-again').addEventListener('click',function(){done=false;c.getAnimations().forEach(function(a){a.cancel()});c.style.transform='';slot.classList.remove('done');q(sec,'.xi-msg').textContent='';sec.querySelector('.xi-btns').classList.remove('xi-show')})
    }
  };
  var boot=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;boot.unobserve(e.target);INIT[e.target.dataset.i](e.target)})},{rootMargin:'400px 0px'});
  secs.forEach(function(s){boot.observe(s)});
})();
