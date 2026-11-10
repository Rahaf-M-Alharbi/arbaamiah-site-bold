/* account form: five questions, an account and an email. The answers go to the team through FormSubmit (same ENDPOINT as the contact form),
   and /api/assess (functions/api/assess.js) returns an approximate review built from public web information, shown with a disclaimer. Question wording lives in quiz.html. */
(function(){
  var f=document.getElementById('qzForm');if(!f)return;
  var ENDPOINT='https://formsubmit.co/ajax/arbaamia.sa@gmail.com';
  var err=document.getElementById('qzErr'),btn=f.querySelector('button[type=submit]');
  f.addEventListener('submit',function(e){
    e.preventDefault();err.textContent='';
    if(f.elements.website.value)return;               /* trap field: bots fill it */
    var miss=[].filter.call(f.querySelectorAll('fieldset.qz-q'),function(s){return !s.querySelector('input:checked')});
    if(miss.length){err.textContent='أجب عن كل الأسئلة.';miss[0].scrollIntoView({block:'center'});return}
    var em=f.elements.email;
    if(!/^\S+@\S+\.\S+$/.test(em.value.trim())){em.setAttribute('aria-invalid','true');err.textContent='اكتب بريدا إلكترونيا صحيحا.';em.focus();return}
    em.removeAttribute('aria-invalid');btn.disabled=true;
    var d=new FormData();
    d.append('email',em.value.trim());d.append('الحساب',f.elements.account.value.trim()||'—');
    [].forEach.call(f.querySelectorAll('fieldset.qz-q'),function(s){d.append(s.querySelector('legend').textContent.replace(/^[٠-٩]+/,''),s.querySelector('input:checked').value)});
    d.append('_subject','طلب تقييم حساب من موقع أربعمية');d.append('_template','table');d.append('_captcha','false');
    var qa=[].map.call(f.querySelectorAll('fieldset.qz-q'),function(s){return {q:s.querySelector('legend').textContent.replace(/^[٠-٩]+/,''),a:s.querySelector('input:checked').value}}),account=f.elements.account.value.trim();
    /* the team always gets the answers; the client gets the approximate review if the assessment call works */
    /* on localhost nothing is sent to the team's inbox, so tests don't fill it */
    var local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var sent=local?Promise.resolve():fetch(ENDPOINT,{method:'POST',body:d,headers:{Accept:'application/json'}}).then(function(r){return r.json().then(function(j){if(!r.ok||j.success==='false'||j.success===false)throw 0})});
    f.innerHTML='<div class="qz-done" role="status"><i>♠︎</i><b>نراجع حسابك الآن</b><span>نبحث عن المعلومات المتاحة ونجهز تقديرك. يستغرق هذا نحو نصف دقيقة.</span></div>';
    var rev=fetch('/api/assess',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({account:account,answers:qa,website:f.elements.website?f.elements.website.value:''})}).then(function(r){if(!r.ok)throw 0;return r.json()});
    Promise.all([sent.catch(function(){return 0}),rev.catch(function(){return null})]).then(function(x){show(x[1])});
  });
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.textContent=h;return e}
  /* answers are plain text from the server: only textContent is used */
  function show(R){
    var box=document.getElementById('qzBox');box.innerHTML='';box.id='qzBox';
    if(!R||!R.summary){box.appendChild(el('p','qz-ok','وصلتنا إجاباتك.'));box.appendChild(el('p','qz-note','تعذر تجهيز التقدير الآن، وفريقنا يراجع حسابك ويرسل لك تقييما على بريدك قريبا.'));return}
    box.appendChild(el('p','qz-ok','تقديرك المبدئي'));
    box.appendChild(el('p','qz-note',R.summary));
    if(!R.found)box.appendChild(el('p','qz-note qz-warn','لم نجد معلومات عامة كافية عن حسابك، فاعتمد هذا التقدير على إجاباتك فقط.'));
    var ul=el('ul','qz-ax');
    [['المحتوى',R.content],['التسويق',R.marketing],['الهوية',R.identity]].forEach(function(a){var li=el('li'),h=el('h3',null,a[0]);h.appendChild(el('em',null,a[1].rating));li.appendChild(h);li.appendChild(el('p',null,a[1].note));ul.appendChild(li)});
    box.appendChild(ul);
    if(R.next_steps&&R.next_steps.length){var st=el('div','qz-steps');st.appendChild(el('b',null,'خطواتك التالية'));var ol=el('ol');R.next_steps.forEach(function(t){ol.appendChild(el('li',null,t))});st.appendChild(ol);box.appendChild(st)}
    var a=el('a');a.href='contact.html';a.className='flipbtn fb--cream qz-cta';a.innerHTML='<span class="fb-in"><span class="fb-f">تواصل معنا<i>♠︎</i></span><span class="fb-b" aria-hidden="true">تواصل معنا<i>♠︎</i></span></span>';box.appendChild(a);
    box.appendChild(el('p','qz-disc','تنبيه: هذا تقدير تقريبي مبني على معلومات متاحة على الإنترنت وعلى إجاباتك، وقد لا يكون دقيقا أو كاملا. لا يعد نصيحة مهنية ولا ضمانا لأي نتيجة.'));
  }
})();
