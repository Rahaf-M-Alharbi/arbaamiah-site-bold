(function(){var AR='0123456789',els=document.querySelectorAll('.stt-i b');function ar(n){return String(n).replace(/\d/g,function(c){return AR[c]})}
function run(e){var n=+e.dataset.n,s=e.dataset.s,t0=null;if(matchMedia('(prefers-reduced-motion: reduce)').matches){e.textContent=ar(n);return}
(function f(ts){if(t0===null)t0=ts;var k=Math.min(1,(ts-t0)/1500);e.textContent=ar(Math.round(n*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(f)})(performance.now())}
if(!('IntersectionObserver' in window)){els.forEach(run);return}
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){run(x.target);io.unobserve(x.target)}})},{threshold:.5});els.forEach(function(e){io.observe(e)})})();
