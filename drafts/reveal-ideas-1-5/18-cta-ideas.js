/* Five "press a card, reveal a free consultation" ideas (1 and 5 are the originals; 2-4 are variants of them) (see 32-cta-ideas.css). Each starts once, shortly before its section is reached. */
(function(){
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches,secs=document.querySelectorAll('.xpi');
  if(!secs.length||!('IntersectionObserver' in window))return;
  var SP=['♠︎','♥︎','♦︎','♣︎'];
  var SV=[['A',SP[0],'المحتوى'],['K',SP[1],'التصميم'],['Q',SP[2],'الإعلانات'],['J',SP[3],'النمو'],['10',SP[0],'جلسة أولى']];
  var WIN='استشارة مجانية: ٣٠ دقيقة علينا، بلا التزام.';
  function faceS(s){return '<span class="f'+(s[1]===SP[1]||s[1]===SP[2]?' r':'')+'"><b>'+s[0]+'<i>'+s[1]+'</i></b><strong>'+s[2]+'</strong><span class="p">'+s[1]+'</span></span>'}
  function faceP(t,sub){return '<span class="f pz"><b>★</b><strong>'+t+'</strong><small>'+sub+'</small><span class="p">★</span></span>'}
  function card(face,cls,label,st){return '<button type="button" class="bc '+(cls||'')+'" aria-label="'+(label||'ورقة')+'"'+(st?' style="'+st+'"':'')+'><span class="in"><span class="b">٤٠٠</span>'+face+'</span></button>'}
  function q(sec,sel){return sec.querySelector(sel)}
  function msg(sec,t){q(sec,'.xi-msg').textContent=t||''}
  function show(sec){q(sec,'.xi-btns').classList.add('xi-show')}
  function hide(sec){q(sec,'.xi-btns').classList.remove('xi-show');msg(sec,'')}
  function win(sec){msg(sec,WIN);show(sec)}
  function anim(el,kf,o){return el.animate(kf,{duration:RM?1:o.d,easing:o.e||'ease-out',delay:RM?0:(o.delay||0),fill:o.fill||'none'})}
  function wait(fn,ms){setTimeout(fn,RM?0:ms)}
  /* a puff of stars and suits from the middle of an element */
  function burst(el){
    if(RM)return;
    var r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,G=['★'].concat(SP);
    for(var i=0;i<18;i++){
      var s=document.createElement('span'),a=i/18*6.283+Math.random()*.3,d=r.width*(.7+Math.random()*.7);
      s.className='xi-burst';s.textContent=G[i%G.length];s.style.fontSize=(18+Math.random()*20|0)+'px';document.body.appendChild(s);
      var k=s.animate([{transform:'translate('+cx+'px,'+cy+'px) scale(.3) rotate(0)',opacity:1},{transform:'translate('+(cx+Math.cos(a)*d)+'px,'+(cy+Math.sin(a)*d+30)+'px) scale(1) rotate('+(Math.random()*160-80|0)+'deg)',opacity:0}],{duration:900+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)'});
      k.onfinish=(function(n){return function(){n.remove()}})(s)}}

  /* top card of a pile rises, turns over, and the gift is shown */
  function pull(sec,t){
    anim(t,[{transform:'translate(0,0)'},{transform:'translate(0,-34%) scale(1.12)',offset:.45},{transform:'translate(0,-16%) scale(1.2)'}],{d:900,fill:'forwards'});
    wait(function(){t.classList.add('on');wait(function(){burst(t);win(sec)},600)},350)}

  var INIT={
    /* 1: pick one of three. The one you press turns out to be the gift; the others show a service. */
    1:function(sec){
      var row=q(sec,'.xi1-row'),R=[-3,0,3];
      function build(){
        row.classList.remove('picked');
        row.innerHTML=[SV[0],SV[1],SV[2]].map(function(s,i){return card(faceS(s),'','ورقة '+(i+1),'--r:'+R[i]+'deg')}).join('')}
      row.addEventListener('click',function(e){
        var c=e.target.closest('.bc');if(!c||row.classList.contains('picked'))return;
        row.classList.add('picked');
        c.querySelector('.f').outerHTML=faceP('هديّتك','استشارة مجانية');c.classList.add('on');
        wait(function(){burst(c);win(sec);
          [].forEach.call(row.children,function(x){if(x!==c)x.classList.add('on','dim')})},650)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    },

    /* 2: fan out. Press the deck, it fans into five face-down cards; the one you pick moves to the middle and turns over. */
    2:function(sec){
      var fan=q(sec,'.xi2-fan');
      function build(){
        fan.className='xi2-fan';
        fan.innerHTML=[0,1,2,3,4].map(function(i){return card(faceS(SV[i]),'','ورقة '+(i+1),'--i:'+i+';--k:'+(4-i))}).join('')}
      fan.addEventListener('click',function(e){
        if(fan.classList.contains('picked'))return;
        if(!fan.classList.contains('fanned')){fan.classList.add('fanned');return}
        var c=e.target.closest('.bc');if(!c)return;
        fan.classList.add('picked');
        [].forEach.call(fan.children,function(x){if(x!==c)x.classList.add('gone')});
        c.querySelector('.f').outerHTML=faceP('هديّتك','استشارة مجانية');c.classList.add('sel');
        c.style.transform='translate(0,-4%) scale(1.25)';
        wait(function(){c.classList.add('on');wait(function(){burst(c);win(sec)},550)},500)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    },

    /* 3: three piles. Press a pile; its top card rises and turns over, the other two turn over too. */
    3:function(sec){
      var row=q(sec,'.xi3-piles');
      function build(){
        row.classList.remove('picked');
        row.innerHTML=[0,1,2].map(function(p){return '<div class="pile" role="button" tabindex="0" aria-label="رزمة '+(p+1)+'">'+[3,2,1,0].map(function(k){return card(faceS(SV[(p+k)%5]),'','ورقة','--k:'+k)}).join('')+'</div>'}).join('')}
      function pick(p){
        if(row.classList.contains('picked'))return;row.classList.add('picked');
        var t=p.lastChild;t.querySelector('.f').outerHTML=faceP('هديّتك','استشارة مجانية');
        pull(sec,t);
        wait(function(){[].forEach.call(row.children,function(o){if(o!==p){o.lastChild.classList.add('on','dim')}})},900)}
      row.addEventListener('click',function(e){var p=e.target.closest('.pile');if(p)pick(p)});
      row.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){var p=e.target.closest('.pile');if(p){e.preventDefault();pick(p)}}});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    },

    /* 4: cut the deck. Press it; the deck splits in two and the card in the middle rises and turns over. */
    4:function(sec){
      var cut=q(sec,'.xi4-cut');
      function half(cls,n){return '<div class="hf '+cls+'">'+[2,1,0].slice(3-n).map(function(k){return card(faceS(SV[(k+1)%5]),'','ورقة','--k:'+k)}).join('')+'</div>'}
      function build(){
        cut.className='xi4-cut';
        cut.innerHTML=card(faceP('هديّتك','استشارة مجانية'),'mid','اسحب ورقة','--k:0')+half('a',3)+half('b',3)}
      cut.addEventListener('click',function(){
        if(cut.classList.contains('open'))return;cut.classList.add('open');
        wait(function(){pull(sec,q(cut,'.mid'))},700)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    },

    /* 5: pull from the deck. Press the pile; the top card rises, turns over, and it is the gift. */
    5:function(sec){
      var dk=q(sec,'.xi5-dk');
      function build(){
        dk.classList.remove('drawn');
        dk.innerHTML=[4,3,2,1,0].map(function(k){return card(k?faceS(SV[k%5]):faceP('هديّتك','استشارة مجانية'),'',k?'ورقة':'اسحب ورقة','--k:'+k)}).join('')}
      dk.addEventListener('click',function(){
        if(dk.classList.contains('drawn'))return;dk.classList.add('drawn');
        var t=dk.lastChild;
        anim(t,[{transform:'translate(0,0)'},{transform:'translate(0,-34%) scale(1.12)',offset:.45},{transform:'translate(0,-16%) scale(1.2)'}],{d:900,fill:'forwards'});
        wait(function(){t.classList.add('on');wait(function(){burst(t);win(sec)},600)},350)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    }
  };
  var boot=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;boot.unobserve(e.target);INIT[e.target.dataset.i](e.target)})},{rootMargin:'400px 0px'});
  secs.forEach(function(s){boot.observe(s)});
})();
