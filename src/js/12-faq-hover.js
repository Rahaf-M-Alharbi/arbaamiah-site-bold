(function(){var L=document.querySelector('.fq-l');if(!L)return;var D=[].slice.call(L.querySelectorAll('details'));
function set(d,on){d.classList.toggle('is-open',on)}
D.forEach(function(d){var m=d.querySelector('summary');
 m.addEventListener('click',function(e){e.preventDefault();if(e.detail>0&&matchMedia('(hover:hover)').matches)return;var on=!d.classList.contains('is-open');D.forEach(function(x){set(x,false)});set(d,on)});
 d.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){D.forEach(function(x){set(x,x===d)})}});
 d.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')set(d,false)});
});})();
