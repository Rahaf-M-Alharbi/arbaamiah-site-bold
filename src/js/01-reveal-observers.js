(function(){if(!('IntersectionObserver' in window))return;
function go(){document.documentElement.classList.add('dkr');
[['.dk-head',{threshold:.35}],['.wk-head',{rootMargin:'0px 0px -20% 0px'}],['.cst',{threshold:.3}],['.pr',{rootMargin:'0px 0px -25% 0px'}]].forEach(function(a){var el=document.querySelector(a[0]);if(!el)return;
var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){el.classList.add('on');io.disconnect()}},a[1]);io.observe(el)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
(function(){var c=document.querySelectorAll('.rl-c');if(!('IntersectionObserver' in window)){c.forEach(function(e){e.classList.add('on')});return}
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('on');io.unobserve(x.target)}})},{threshold:.25});c.forEach(function(e){io.observe(e)})})();
