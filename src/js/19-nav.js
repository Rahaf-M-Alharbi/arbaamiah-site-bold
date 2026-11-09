/* Navigation bar: the menu button opens and closes the page links on narrow screens (they sit in a dropdown under the bar). */
(function(){
  var m=document.getElementById('mini'),b=m&&m.querySelector('.mini-m');if(!b)return;
  function set(o){m.classList.toggle('open',o);b.setAttribute('aria-expanded',o?'true':'false')}
  b.addEventListener('click',function(){set(!m.classList.contains('open'))});
  m.addEventListener('click',function(e){if(e.target.closest('.mini-l a'))set(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
  document.addEventListener('click',function(e){if(!m.contains(e.target))set(false)});
})();
