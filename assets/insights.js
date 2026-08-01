(function(){
  var lang = 'en';
  try { lang = localStorage.getItem('integrysLang') || 'en'; } catch(e){}

  function apply(l){
    lang = l;
    var ar = l === 'ar';
    document.documentElement.lang = l;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    var lbl = document.getElementById('langLabel');
    if (lbl) lbl.textContent = ar ? 'English' : 'العربية';
    document.querySelectorAll('[data-en]').forEach(function(el){
      var t = el.getAttribute('data-' + l);
      if (t === null) return;
      if (t.indexOf('<') > -1) el.innerHTML = t; else el.textContent = t;
    });
    document.querySelectorAll('[data-en-ph]').forEach(function(el){
      var p = el.getAttribute(ar ? 'data-ar-ph' : 'data-en-ph');
      if (p) el.placeholder = p;
    });
    try { localStorage.setItem('integrysLang', l); } catch(e){}
  }
  window.toggleLang = function(){ apply(lang === 'en' ? 'ar' : 'en'); };
  if (lang === 'ar') apply('ar');

  function boot(){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll('.bar i').forEach(function(b){
          b.style.width = (b.dataset.w || '0') + '%';
        });
        e.target.querySelectorAll('[data-count]').forEach(function(n){
          var to = parseFloat(n.dataset.count), suf = n.dataset.suffix || '', t0 = null;
          function tick(ts){
            if (!t0) t0 = ts;
            var p = Math.min((ts - t0) / 1100, 1);
            var e2 = 1 - Math.pow(1 - p, 3);
            n.textContent = (to % 1 ? (to*e2).toFixed(1) : Math.round(to*e2).toLocaleString()) + suf;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });
    var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
