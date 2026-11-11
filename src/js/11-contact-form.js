/* contact form: checks fields, shows errors under them, then a thank-you state.
   Requests go to FormSubmit (formsubmit.co), which emails them to the address in ENDPOINT. The first submission sends an activation email to that address; click it once. Empty ENDPOINT = nothing is sent. */
(function(){
  var ENDPOINT='https://formsubmit.co/ajax/arbaamia.sa@gmail.com';
  var SHEET='https://script.google.com/macros/s/AKfycbzgH9xcnkBraiDwWaS_0ZKPG4xVApXExBcYE0cY8AqRMJllmgr4tZqXXMgbu7jiAdgY/exec';  /* Google Sheet (Apps Script web app): every request is also added there as a row */
  function toSheet(d){var s=new FormData();d.forEach(function(v,k){if(k.charAt(0)!=='_')s.append(k,v)});s.append('_form','contact');
    try{fetch(SHEET,{method:'POST',body:s,mode:'no-cors',keepalive:true}).catch(function(){})}catch(x){}}
  var LABELS={content:'المحتوى',design:'التصميم',ads:'الإعلانات',growth:'النمو',web:'تطوير المواقع',consult:'استشارة مجانية'};
  var f=document.getElementById('ctfForm'),m=document.getElementById('ctfMsg');if(!f)return;
  var btn=f.querySelector('button[type=submit]');
  /* arriving from a service's "اطلب الخدمة" button: tick that service and name it in the message */
  try{var q=new URLSearchParams(location.search),k=q.get('svc'),n=q.get('n'),box=k&&f.querySelector('input[name=svc][value="'+k+'"]');
    if(box)box.checked=true;
    if(n&&f.elements.msg&&!f.elements.msg.value)f.elements.msg.value='أرغب في طلب خدمة: '+n+'.\n'}catch(x){}
  var rules={name:function(v){return v.trim()?'':'اكتب اسمك.'},email:function(v){return /^\S+@\S+\.\S+$/.test(v.trim())?'':'اكتب بريدا إلكترونيا صحيحا.'}};
  if(f.elements.phone.required)rules.phone=function(v){return /^\+?\d{9,15}$/.test(v.replace(/[\s().-]/g,''))?'':'اكتب رقم جوال صحيحا.'};
  function check(n){var el=f.elements[n],e=rules[n](el.value),out=f.querySelector('.ctf-err[data-for='+n+']');
    out.textContent=e;if(e)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');return !e}
  Object.keys(rules).forEach(function(n){f.elements[n].addEventListener('blur',function(){check(n)});f.elements[n].addEventListener('input',function(){if(f.elements[n].getAttribute('aria-invalid'))check(n)})});
  f.addEventListener('submit',function(e){
    e.preventDefault();m.textContent='';
    if(f.elements.website.value)return;               /* trap field: bots fill it */
    var ok=Object.keys(rules).map(check).every(Boolean);
    if(!ok){var bad=f.querySelector('[aria-invalid]');if(bad)bad.focus();return}
    function done(){f.classList.add('ctf-done');f.innerHTML='<div class="ctf-ok" role="status"><i>♠︎</i><b>'+(f.dataset.ok||'وصلتنا ورقتك.')+'</b><span>'+(f.dataset.ok2||'نقرأ طلبك ونعود إليك قريبا.')+'</span></div>'}
    if(!ENDPOINT){done();return}
    btn.disabled=true;
    var d=new FormData(f);d.delete('svc');d.delete('website');d.append('الخدمات',Array.prototype.map.call(f.querySelectorAll('input[name=svc]:checked'),function(c){return LABELS[c.value]}).join('، ')||'—');d.append('_subject',f.dataset.subject||'طلب جديد من موقع أربعمية');d.append('_template','table');d.append('_captcha','false');
    toSheet(d);
    fetch(ENDPOINT,{method:'POST',body:d,headers:{Accept:'application/json'}}).then(function(r){return r.json().then(function(j){if(!r.ok||j.success==='false'||j.success===false)throw 0;done()})}).catch(function(){btn.disabled=false;m.textContent='تعذر الإرسال. حاول مرة أخرى.'});
  });
})();
