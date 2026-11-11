/* Email links: a click on any mailto: link opens a small card with the address and three choices (open the mail app, open Gmail in the browser, copy the address), because many computers have no mail app set up and a bare mailto: link then does nothing. Links stay real mailto: links, so no-script visitors and crawlers still get them. */
(function(){
  var box,cur,lastFocus;
  function close(){if(!box)return;box.hidden=true;if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  function build(){
    box=document.createElement('div');box.className='ml';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','البريد الإلكتروني');box.lang='ar';box.dir='rtl';
    box.innerHTML='<p class="ml-a" dir="ltr"></p><div class="ml-b"><a class="ml-o" href="#">فتح تطبيق البريد</a><a class="ml-g" href="#" target="_blank" rel="noopener">فتح Gmail</a><button type="button" class="ml-c">نسخ البريد</button></div><p class="ml-s" role="status" aria-live="polite"></p>';
    document.body.appendChild(box);
    box.querySelector('.ml-c').addEventListener('click',copy);
    box.addEventListener('click',function(e){if(e.target.closest('.ml-o,.ml-g'))setTimeout(close,0)});
  }
  function copy(){
    var s=box.querySelector('.ml-s');
    function ok(){s.textContent='تم نسخ البريد';setTimeout(close,900)}
    function fallback(){
      var t=document.createElement('textarea');t.value=cur;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0';
      document.body.appendChild(t);t.select();var r=false;try{r=document.execCommand('copy')}catch(e){}t.remove();
      if(r)ok();else{s.textContent='حدد البريد وانسخه يدويا';var a=box.querySelector('.ml-a'),g=getSelection(),rg=document.createRange();rg.selectNodeContents(a);g.removeAllRanges();g.addRange(rg)}
    }
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(cur).then(ok,fallback);else fallback();
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="mailto:"]');
    if(a){
      if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;
      e.preventDefault();if(!box)build();
      cur=decodeURIComponent(a.getAttribute('href').slice(7).split('?')[0]);lastFocus=a;
      box.querySelector('.ml-a').textContent=cur;box.querySelector('.ml-s').textContent='';
      box.querySelector('.ml-o').href='mailto:'+cur;
      box.querySelector('.ml-g').href='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(cur);
      box.hidden=false;box.querySelector('.ml-o').focus();return;
    }
    if(box&&!box.hidden&&!box.contains(e.target))close();
  });
  /* Escape closes; Tab stays inside the open card */
  document.addEventListener('keydown',function(e){
    if(!box||box.hidden)return;
    if(e.key==='Escape'){close();return}
    if(e.key!=='Tab')return;
    var f=box.querySelectorAll('a,button'),first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
})();
