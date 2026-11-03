/* "Pick your card" closing section: press one of three face-down cards to reveal a free consultation (see 32-cta-ideas.css). Each starts once, shortly before its section is reached. */
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
    }
  };
  var boot=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;boot.unobserve(e.target);INIT[e.target.dataset.i](e.target)})},{rootMargin:'400px 0px'});
  secs.forEach(function(s){boot.observe(s)});
})();
