/* PlayingCard component. PlayingCard.corners(rank,suit) -> the two corner indexes; PlayingCard.html({rank,suit,html}) -> corners + body;
   PlayingCard.create({rank,suit,html,cls}) -> a ready .pk element; PlayingCard.logo({name,src}) -> logo slot or image for the body. */
window.PlayingCard=(function(){
  var SUIT={s:'♠\uFE0E',h:'♥\uFE0E',d:'♦\uFE0E',c:'♣\uFE0E'};
  function corners(rank,suit){var ix=rank+'<i>'+SUIT[suit]+'</i>';return '<span class="pk-ix">'+ix+'</span><span class="pk-ix b">'+ix+'</span>'}
  function html(o){return corners(o.rank,o.suit)+(o.html||'')}
  function logo(o){var n=o.name||o.n||'';return o.src?'<img class="pk-logo" src="'+o.src+'" alt="'+n+'">':'<div class="pk-slot">'+n+'</div>'}
  function create(o){var e=document.createElement(o.tag||'div');e.className='pk'+(o.cls?' '+o.cls:'');e.innerHTML=html(o);return e}
  return {SUIT:SUIT,corners:corners,html:html,logo:logo,create:create};
})();
(function(){var b=document.getElementById('bigcard');if(b)b.innerHTML=PlayingCard.html({rank:'A',suit:'s',html:PlayingCard.logo({name:'شعار ١'})})})();
