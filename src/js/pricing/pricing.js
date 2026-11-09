/* ============================================================
   EDIT HERE — all prices and rules live in this one block.
   type: 'once'  = one-time price
         'unit'  = price × quantity (qty stepper shown)
         'month' = price × number of months chosen
   Prices below are PLACEHOLDERS (SAR). Replace with your real ones.
   ============================================================ */
var CONFIG = {
  currency: 'ر.س',
  vat: 0.15,                 // set 0 to hide VAT line
  rushSurcharge: 0.25,       // +25% on subtotal
  monthOptions: [1, 3, 6, 12],
  defaultMonths: 3,
  bundleDiscount: { 2: 0.05, 3: 0.10, 4: 0.15 },  // by number of services chosen
  ctaHref: 'contact.html',

  services: [
    { suit:'♠', name:'المحتوى', blurb:'حكايات تكسب الانتباه', items:[
      { id:'c1', name:'استراتيجية المحتوى',   desc:'ما تقوله علامتك، ولمن، ومتى.',  type:'once',  price:3500 },
      { id:'c2', name:'كتابة صوت العلامة',    desc:'سعر النص الواحد (منشور أو صفحة).', type:'unit',  price:400,  unitLabel:'نص', max:50 },
      { id:'c3', name:'إنتاج الصورة والفيديو', desc:'تصوير ومونتاج. سعر الفيديو الواحد.', type:'unit',  price:2500, unitLabel:'فيديو', max:30 }
    ]},
    { suit:'♥', name:'التصميم', blurb:'هوية وحرفة', items:[
      { id:'d1', name:'الهوية البصرية',        desc:'شعار وألوان وخطوط ودليل استخدام.', type:'once',  price:8000 },
      { id:'d2', name:'تصميم المنصات والمواقع', desc:'سعر الصفحة الواحدة.',              type:'unit',  price:1500, unitLabel:'صفحة', max:30 },
      { id:'d3', name:'المطبوعات والتغليف',     desc:'سعر القطعة الواحدة.',              type:'unit',  price:1200, unitLabel:'قطعة', max:30 }
    ]},
    { suit:'♦', name:'الإعلانات', blurb:'وصول مدفوع مبني على الأرقام', items:[
      { id:'a1', name:'إدارة الحملات المدفوعة', desc:'رسوم الإدارة شهرياً (الميزانية الإعلانية منفصلة).', type:'month', price:3000 },
      { id:'a2', name:'تحسين التحويل',          desc:'اختبارات متواصلة، شهرياً.',          type:'month', price:1500 },
      { id:'a3', name:'تقارير الأداء',           desc:'تقرير واجتماع مراجعة شهري.',        type:'month', price:800 }
    ]},
    { suit:'♣', name:'النمو', blurb:'خطوة مدروسة بعد خطوة', items:[
      { id:'g1', name:'تحليل السوق',    desc:'المنافسون والفرص.',          type:'once',  price:4000 },
      { id:'g2', name:'خطة النمو',      desc:'أهداف قابلة للقياس وخطوات.', type:'once',  price:5000 },
      { id:'g3', name:'القياس والتحسين', desc:'مراجعة وتعديل مستمر، شهرياً.', type:'month', price:2500 }
    ]}
  ]
};

/* ---------- logic (no need to edit) ---------- */
(function(){
  var fmt = function(n){ return Math.round(n).toLocaleString('ar-SA-u-nu-latn'); };
  var $ = function(id){ return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { items:{}, months:CONFIG.defaultMonths, rush:false };   // items[id] = qty (absent = unselected)
  var byId = {}, rows = {}, cards = [];
  CONFIG.services.forEach(function(s,si){ s.items.forEach(function(it){ it.svc = si; byId[it.id] = it; }); });

  function monthLabel(m){ return m===1 ? 'شهر' : m===2 ? 'شهران' : m+(m<=10 ? ' أشهر' : ' شهراً'); }

  /* service cards */
  CONFIG.services.forEach(function(s){
    var card = document.createElement('section');
    card.className = 'svc'; card.dataset.suit = s.suit;
    var html = '<div class="svc-head"><span class="suit">'+s.suit+'︎</span><div class="t"><h2>'+s.name+'</h2><p>'+s.blurb+'</p></div><span class="badge"></span></div><div class="items">';
    s.items.forEach(function(it){
      var unit = it.type==='unit' ? '/ '+it.unitLabel : it.type==='month' ? '/ شهر' : 'سعر ثابت';
      html += '<label class="item" data-id="'+it.id+'">'+
        '<input type="checkbox" aria-label="'+it.name+'">'+
        '<div><div class="name">'+it.name+'</div><div class="desc">'+it.desc+'</div>'+
        (it.type==='unit' ? '<div class="qty"><button type="button" data-d="1" aria-label="زِد">+</button><output>1</output><button type="button" data-d="-1" aria-label="أنقص">−</button><span>'+it.unitLabel+'</span></div>' : '')+
        '</div><div class="pr"><b>'+fmt(it.price)+' '+CONFIG.currency+'</b><small>'+unit+'</small><em></em></div></label>';
    });
    card.innerHTML = html + '</div>';
    $('services').appendChild(card);
    cards.push(card);
  });
  Object.keys(byId).forEach(function(id){ rows[id] = document.querySelector('.item[data-id="'+id+'"]'); });

  /* option controls */
  CONFIG.monthOptions.forEach(function(m){
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role','radio'); b.dataset.m = m; b.textContent = monthLabel(m);
    b.setAttribute('aria-checked', m===state.months);
    $('months').appendChild(b);
  });
  $('rushPct').textContent = Math.round(CONFIG.rushSurcharge*100);
  $('cur').textContent = CONFIG.currency;
  $('cta').href = CONFIG.ctaHref;

  function setItem(id, on, qty){
    var row = rows[id];
    row.querySelector('input').checked = on;
    row.classList.toggle('on', on);
    if (on) state.items[id] = qty || state.items[id] || 1; else delete state.items[id];
    var out = row.querySelector('output');
    if (out) out.textContent = state.items[id] || 1;
  }

  /* events */
  $('services').addEventListener('click', function(e){
    var btn = e.target.closest('button[data-d]');
    if (!btn) return;
    e.preventDefault();
    var id = btn.closest('.item').dataset.id, it = byId[id];
    setItem(id, true, Math.min(it.max||99, Math.max(1, (state.items[id]||1) + Number(btn.dataset.d))));
    render();
  });
  $('services').addEventListener('change', function(e){
    var row = e.target.closest('.item'); if (!row) return;
    setItem(row.dataset.id, e.target.checked); render();
  });
  $('months').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    state.months = Number(b.dataset.m);
    [].forEach.call($('months').children, function(x){ x.setAttribute('aria-checked', x===b); });
    render();
  });
  $('rush').addEventListener('change', function(e){ state.rush = e.target.checked; render(); });
  $('clear').addEventListener('click', function(){ Object.keys(state.items).forEach(function(id){ setItem(id,false); }); render(); });
  $('lines').addEventListener('click', function(e){
    var b = e.target.closest('button[data-rm]'); if (!b) return;
    setItem(b.dataset.rm, false); render();
  });
  $('sumToggle').addEventListener('click', function(){
    var open = $('sum').classList.toggle('open');
    this.setAttribute('aria-expanded', open);
  });

  /* animated number */
  var shown = 0, raf;
  function showTotal(target){
    cancelAnimationFrame(raf);
    if (reduce){ shown = target; paint(target); return; }
    var from = shown, t0 = performance.now(), dur = 450;
    (function step(t){
      var p = Math.min(1, (t-t0)/dur), v = from + (target-from)*(1-Math.pow(1-p,3));
      paint(v);
      if (p<1) raf = requestAnimationFrame(step); else shown = target;
    })(t0);
  }
  function paint(v){ $('total').textContent = fmt(v); $('barTotal').textContent = fmt(v)+' '+CONFIG.currency; }

  /* the formula */
  function render(){
    var lines = [], subtotal = 0, svcCount = {}, ids = Object.keys(state.items);
    ids.forEach(function(id){
      var it = byId[id], q = state.items[id], cost, label = it.name;
      if (it.type==='once'){ cost = it.price; }
      else if (it.type==='unit'){ cost = it.price*q; label += ' × '+q; }
      else { cost = it.price*state.months; label += ' × '+monthLabel(state.months); }
      subtotal += cost; svcCount[it.svc] = (svcCount[it.svc]||0) + 1;
      rows[id].querySelector('em').textContent = '= '+fmt(cost)+' '+CONFIG.currency;
      lines.push('<div class="line"><button type="button" data-rm="'+id+'" aria-label="إزالة">×</button><span>'+label+'</span><span>'+fmt(cost)+'</span></div>');
    });

    var nSvc = Object.keys(svcCount).length;
    var rate = CONFIG.bundleDiscount[nSvc] || 0;
    var rush = state.rush ? subtotal*CONFIG.rushSurcharge : 0;
    var disc = subtotal*rate;
    var net = subtotal + rush - disc;
    var vat = net*CONFIG.vat;
    var total = net + vat;

    cards.forEach(function(c,i){
      var n = svcCount[i] || 0;
      c.classList.toggle('has', n>0);
      c.querySelector('.badge').textContent = n+' مختار';
    });

    $('lines').innerHTML = ids.length ? lines.join('') : '<div class="empty"><i>♠︎</i>اختر خدمة لتبدأ الحساب</div>';
    $('clear').hidden = !ids.length;

    var calc = '';
    if (ids.length){
      calc += '<div class="row"><span>المجموع</span><span>'+fmt(subtotal)+'</span></div>';
      if (rush) calc += '<div class="row"><span>تسليم مستعجل</span><span>+'+fmt(rush)+'</span></div>';
      if (disc) calc += '<div class="row disc"><span>خصم الباقة ('+Math.round(rate*100)+'٪ لـ'+nSvc+' خدمات)</span><span>−'+fmt(disc)+'</span></div>';
      if (CONFIG.vat) calc += '<div class="row"><span>ضريبة القيمة المضافة ('+Math.round(CONFIG.vat*100)+'٪)</span><span>'+fmt(vat)+'</span></div>';
    }
    $('calc').innerHTML = calc;

    var nudge = '', next = CONFIG.bundleDiscount[nSvc+1];
    if (nSvc>0 && next) nudge = 'أضف خدمة من فئة أخرى واحصل على خصم '+Math.round(next*100)+'٪ على الباقة.';
    else if (nSvc>0 && rate) nudge = 'وصلت لأعلى خصم باقة: '+Math.round(rate*100)+'٪.';
    $('nudge').textContent = nudge; $('nudge').hidden = !nudge;

    showTotal(total);
  }
  render();
})();
