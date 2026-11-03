/* contact form: checks fields, shows errors under them, then a thank-you state.
   Set ENDPOINT to a real URL (e.g. a form service) to actually send the request; while it is empty nothing is sent. */
(function(){
  var ENDPOINT='';
  var f=document.getElementById('ctfForm'),m=document.getElementById('ctfMsg');if(!f)return;
  var btn=f.querySelector('button[type=submit]');
  var rules={name:function(v){return v.trim()?'':'اكتب اسمك.'},email:function(v){return /^\S+@\S+\.\S+$/.test(v.trim())?'':'اكتب بريداً إلكترونياً صحيحاً.'}};
  function check(n){var el=f.elements[n],e=rules[n](el.value),out=f.querySelector('.ctf-err[data-for='+n+']');
    out.textContent=e;if(e)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');return !e}
  Object.keys(rules).forEach(function(n){f.elements[n].addEventListener('blur',function(){check(n)});f.elements[n].addEventListener('input',function(){if(f.elements[n].getAttribute('aria-invalid'))check(n)})});
  f.addEventListener('submit',function(e){
    e.preventDefault();m.textContent='';
    if(f.elements.website.value)return;               /* trap field: bots fill it */
    var ok=Object.keys(rules).map(check).every(Boolean);
    if(!ok){var bad=f.querySelector('[aria-invalid]');if(bad)bad.focus();return}
    function done(){f.classList.add('ctf-done');f.innerHTML='<div class="ctf-ok" role="status"><i>♠︎</i><b>وصلتنا ورقتك.</b><span>نقرأ طلبك ونعود إليك قريباً.</span></div>'}
    if(!ENDPOINT){done();return}
    btn.disabled=true;
    fetch(ENDPOINT,{method:'POST',body:new FormData(f)}).then(function(r){if(!r.ok)throw 0;done()}).catch(function(){btn.disabled=false;m.textContent='تعذّر الإرسال. حاول مرة أخرى.'});
  });
})();
