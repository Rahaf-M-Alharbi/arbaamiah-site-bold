(function(){if(!('IntersectionObserver' in window))return;
function go(){document.documentElement.classList.add('dkr');
[['.dk-head',{threshold:.35}],['.wk-head',{rootMargin:'0px 0px -20% 0px'}],['.cst',{threshold:.3}],['.pr',{rootMargin:'0px 0px -25% 0px'}]].forEach(function(a){var el=document.querySelector(a[0]);if(!el)return;
var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){el.classList.add('on');io.disconnect()}},a[1]);io.observe(el)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
