/* ─────────────────────────────────────────────────────────────
   Stoic Workbook — "continue where you left off"
   Loaded at the end of each stoic/module-*.html. Remembers which
   section (section.page[id]) you were reading, per module and
   overall, in localStorage `stoicResume1`:
     { last:{file,module,title,section,label,at}, byModule:{file:{section,label,at}} }
   When you come back to a module, a small button offers to jump
   back to that section. The landing page reads `last`.
   ───────────────────────────────────────────────────────────── */
(function(){
  var KEY='stoicResume1';
  var file=location.pathname.split('/').pop()||'';
  var num=(file.match(/module-(\d+)/)||[])[1]||'';
  var jump=document.getElementById('jump');
  function label(id){
    if(jump){for(var i=0;i<jump.options.length;i++)if(jump.options[i].value===id)return jump.options[i].text;}
    var h=document.querySelector('#'+id+' h1,#'+id+' h2');return h?h.textContent.trim():'';
  }
  var title=(jump&&jump.options[1])?jump.options[1].text.replace(/^Module\s*\d+\s*·\s*/,''):document.title;
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{byModule:{}};}catch(e){return {byModule:{}};}}
  function save(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){}}

  var pages=[].slice.call(document.querySelectorAll('section.page[id]'));
  if(!pages.length)return;
  var saved=(load().byModule||{})[file];

  /* ── offer to jump back (only if they'd stopped past the first section) ── */
  if(saved&&saved.section&&saved.section!==pages[0].id&&!location.hash&&document.getElementById(saved.section)){
    var css=document.createElement('style');
    css.textContent='.sr-pill{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:450;display:flex;align-items:center;gap:12px;'+
      'background:#fff;border:1.5px solid var(--coral,#d64c63);border-radius:999px;padding:9px 10px 9px 18px;box-shadow:0 10px 30px rgba(194,58,84,.18);'+
      'font:600 13px "Plus Jakarta Sans",system-ui,sans-serif;color:#1a1612;max-width:calc(100vw - 32px);}'+
      '.sr-pill b{color:var(--coral,#d64c63);font-weight:700;}'+
      '.sr-pill span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'+
      '.sr-go{border:none;background:var(--coral,#d64c63);color:#fff;font:700 12.5px "Plus Jakarta Sans",system-ui,sans-serif;padding:8px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;}'+
      '.sr-x{border:none;background:transparent;color:#9a8f86;font-size:17px;cursor:pointer;padding:0 4px;line-height:1;}'+
      '@media print{.sr-pill{display:none}}';
    document.head.appendChild(css);
    var pill=document.createElement('div');pill.className='sr-pill';pill.setAttribute('role','status');
    pill.innerHTML='<span>Continue where you left off · <b></b></span><button class="sr-go" type="button">Continue →</button><button class="sr-x" type="button" aria-label="Dismiss">×</button>';
    pill.querySelector('b').textContent=saved.label||label(saved.section);
    pill.querySelector('.sr-go').onclick=function(){var t=document.getElementById(saved.section);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});pill.remove();};
    pill.querySelector('.sr-x').onclick=function(){pill.remove();};
    document.body.appendChild(pill);
    setTimeout(function(){if(pill.parentNode)pill.style.transition='opacity .4s';},100);
  }

  /* ── remember the section in view ── */
  var current=null,timer=null;
  function record(id){
    if(!id||id===current)return;current=id;
    clearTimeout(timer);
    timer=setTimeout(function(){
      var d=load();d.byModule=d.byModule||{};
      var rec={section:id,label:label(id),at:Date.now()};
      d.byModule[file]=rec;
      d.last={file:file,module:num,title:title,section:id,label:rec.label,at:rec.at};
      save(d);
    },1200);   // only count a section you actually stayed on
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      var best=null;entries.forEach(function(e){if(e.isIntersecting&&(!best||e.intersectionRatio>best.intersectionRatio))best=e;});
      if(best)record(best.target.id);
    },{rootMargin:'-35% 0px -55% 0px',threshold:[0,.01]});
    pages.forEach(function(p){io.observe(p);});
  }
  // typing in a section counts too
  document.addEventListener('input',function(e){var s=e.target.closest&&e.target.closest('section.page[id]');if(s){current=null;record(s.id);}});
})();
