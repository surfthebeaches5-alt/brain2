/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — shared navigation
   Include right after <body> on every page:
     <script src="../assets/shell.js"></script>
   Adds the top bar: six spaces (Today · Plan · Money · Library ·
   Learning · Life), each opening a menu of its pages, plus the
   quick-link dock on the right (brain2QuickLinks1, editable via +).
   Also hides each page's old "‹ Brain 2.0" back pill.
   ───────────────────────────────────────────────────────────── */
/* Site icons for link tiles: the site's own icon first, then DuckDuckGo's icon service,
   else the letter tile underneath shows. (DuckDuckGo answers unknown sites with a grey
   placeholder that never errors, so it goes last.) What worked is remembered per site. */
(function(){
  var KEY='brain2FavCache1',cache={};
  try{cache=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(cache));}catch(e){}}
  function hostOf(u){try{return new URL(/^https?:\/\//i.test(u)?u:'https://'+u).hostname.replace(/^www\./,'');}catch(e){return '';}}
  function list(h){
    var root=h.split('.').slice(-2).join('.'),c=['https://'+h+'/apple-touch-icon.png','https://'+h+'/favicon.ico'];
    if(root!==h)c.push('https://'+root+'/favicon.ico');
    c.push('https://icons.duckduckgo.com/ip3/'+h+'.ico');
    return c;
  }
  window.B2Fav=function(u){
    var h=hostOf(u);if(!h)return '';
    var known=cache[h];
    if(known==='none')return '';
    var c=known?[known]:list(h);
    return '<img src="'+c[0].replace(/"/g,'&quot;')+'" alt="" loading="lazy" data-h="'+h.replace(/"/g,'&quot;')+'" data-c="'+c.slice(1).join(' ').replace(/"/g,'&quot;')+'" onload="B2FavOk(this)" onerror="B2FavNext(this)">';
  };
  window.B2FavOk=function(img){
    if(img.naturalWidth<8){window.B2FavNext(img);return;}
    img.classList.add('ok');   /* quick-link tiles show the site's first letter until an icon has really loaded */
    var h=img.getAttribute('data-h');if(h&&cache[h]!==img.src){cache[h]=img.src;save();}
  };
  window.B2FavNext=function(img){
    var rest=(img.getAttribute('data-c')||'').split(' ').filter(Boolean),h=img.getAttribute('data-h');
    if(!rest.length){if(h&&cache[h]){delete cache[h];save();}img.remove();return;}
    img.setAttribute('data-c',rest.slice(1).join(' '));img.src=rest[0];
  };
})();
(function(){
  var LINKS_KEY='brain2QuickLinks1';
  var ROOT=new URL('..',document.currentScript.src).href;   // site root

  var P=function(d){return '<svg viewBox="0 0 24 24">'+d+'</svg>';};
  var I={
    calendar:P('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>'),
    audit:P('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 11h7M8.5 15h7"/>'),
    monthly:P('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16M4 14h16"/>'),
    pivot:P('<path d="M12 3l1.7 5L19 9.5l-5.3 1.5L12 16l-1.7-5L5 9.5 10.3 8Z"/>'),
    finances:P('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>'),
    wishlist:P('<path d="M12 4l2.3 4.8 5.2.7-3.8 3.6 1 5.1-4.7-2.6-4.7 2.6 1-5.1L5 9.5l5.2-.7Z"/>'),
    lang:P('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.4 2.4 13.6 0 16M12 4c-2.4 2.4-2.4 13.6 0 16"/>'),
    classes:P('<path d="M3 8l9-4 9 4-9 4Z"/><path d="M7 10v5c0 1 5 3 5 3s5-2 5-3v-5"/>'),
    seasons:P('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
    book:P('<path d="M12 7c-2-1.4-4.6-2-8-2v13c3.4 0 6 .6 8 2 2-1.4 4.6-2 8-2V5c-3.4 0-6 .6-8 2Z"/><path d="M12 7v13"/>'),
    fitness:P('<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>'),
    meals:P('<path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M9 6.5c0-1 .6-1.5 1-2M13 6.5c0-1 .6-1.5 1-2"/>'),
    travel:P('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
    passport:P('<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>'),
    guide:P('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>'),
    stoic:P('<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z"/><path d="M5 19c4-4 7-6 11-8"/>'),
    backup:P('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>')
  };
  var CARET='<svg class="b2-caret" viewBox="0 0 10 10"><path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var SPACES=[
    {label:'Today',p:''},
    {label:'Plan',pages:[
      {p:'weekly-audit/',label:'Weekly Audit',sub:'Brain dump, wins, life wheel',icon:'audit'},
      {p:'monthly/',label:'Monthly Planner',sub:'Focus & goals',icon:'monthly'},
      {p:'reset-2026/',label:'Season Reset',sub:'Reset any time',icon:'pivot'}]},
    {label:'Money',pages:[
      {p:'finances/',label:'Finances',sub:'Cards, due dates, accounts',icon:'finances'},
      {p:'wishlist/',label:'Wishlist',sub:'Things you want',icon:'wishlist'}]},
    {label:'Library',p:'media/'},
    {label:'Learning',pages:[
      {p:'language-portal/',label:'Languages',sub:'75-day challenge & flashcards',icon:'lang'},
      {p:'learn/overview/',label:'Overview',sub:'Each season at a glance',icon:'seasons'},
      {p:'learn/personal/',label:'Personal Curriculum',sub:'What I study on my own',icon:'book'},
      {p:'learn/courses/',label:'Courses',sub:'Online courses & the FSOT',icon:'classes'}]},
    {label:'Life',pages:[
      {p:'fitness/',label:'Fitness',sub:'Weekly plan & habits',icon:'fitness'},
      {p:'meals/',label:'Meals & Groceries',sub:'Staples & shopping',icon:'meals'},
      {p:'dc-guide/',label:'Out in DC',sub:"What's around · plan something",icon:'passport'},
      {p:'stoic/',label:'Stoic Workbook',sub:'8 modules',icon:'stoic'},
      {sep:true},
      {p:'backup/',label:'Backup',sub:'Export & restore your data',icon:'backup'}]}
  ];
  // first visit only — after that it's whatever you keep (edit with the + button)
  var DEFAULT_LINKS=[];

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function lsGet(k,fb){try{var r=localStorage.getItem(k);return r?JSON.parse(r):fb;}catch(e){return fb;}}
  function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function host(u){try{return new URL(u).hostname.replace(/^www\./,'');}catch(e){return '';}}

  // which page is this? path after the site root, without index.html
  var here=location.href.split('#')[0].split('?')[0];
  var rel=here.indexOf(ROOT)===0?here.slice(ROOT.length).replace(/index\.html$/,''):'';
  function isHere(p){return p===''?rel==='':rel.indexOf(p)===0;}

  /* ── build the bar ── */
  var html='<a class="b2-logo" href="'+ROOT+'">Brain <em>2.0</em></a><div class="b2-spaces">';
  SPACES.forEach(function(s,i){
    var on=s.pages?s.pages.some(function(pg){return pg.p&&isHere(pg.p);}):isHere(s.p);
    if(!s.pages){html+='<div class="b2-sp'+(on?' on':'')+'"><a href="'+ROOT+s.p+'">'+s.label+'</a></div>';return;}
    html+='<div class="b2-sp'+(on?' on':'')+'" data-i="'+i+'"><a role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">'+s.label+CARET+'</a><div class="b2-menu">'+
      s.pages.map(function(pg){
        if(pg.sep)return '<div class="b2-menu-sep"></div>';
        return '<a href="'+ROOT+pg.p+'"'+(isHere(pg.p)?' class="cur"':'')+'><span class="b2-mi">'+I[pg.icon]+'</span><span>'+esc(pg.label)+'<small>'+esc(pg.sub)+'</small></span></a>';
      }).join('')+'</div></div>';
  });
  html+='</div><div class="b2-dock" id="b2-dock"></div>';

  var nav=document.createElement('nav');
  nav.className='b2-nav';nav.setAttribute('aria-label','Brain 2.0');
  nav.innerHTML=html;
  document.body.insertBefore(nav,document.body.firstChild);
  document.body.classList.add('b2-shell');

  /* ── menus: open on hover (with a short grace period) and on click/keyboard ── */
  var sps=nav.querySelectorAll('.b2-sp[data-i]'),closeT=null;
  function closeAll(except){sps.forEach(function(sp){if(sp!==except){sp.classList.remove('open');sp.firstChild.setAttribute('aria-expanded','false');}});}
  function open(sp){clearTimeout(closeT);closeAll(sp);sp.classList.add('open');sp.firstChild.setAttribute('aria-expanded','true');}
  sps.forEach(function(sp){
    sp.addEventListener('mouseenter',function(){open(sp);});
    sp.addEventListener('mouseleave',function(){closeT=setTimeout(function(){sp.classList.remove('open');},180);});
    // hovering already opened it, so a click must not toggle it shut again; outside click / Esc closes
    sp.firstChild.addEventListener('click',function(e){e.preventDefault();open(sp);});
    sp.firstChild.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(sp);var a=sp.querySelector('.b2-menu a');if(a)a.focus();}});
  });
  document.addEventListener('click',function(e){if(!nav.contains(e.target)){closeAll();closeLinks();}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeAll();closeLinks();}});

  /* ── quick-link dock ── */
  var dock=nav.querySelector('#b2-dock'),panel=null;
  function links(){var l=lsGet(LINKS_KEY,null);if(!Array.isArray(l)){l=DEFAULT_LINKS.slice();lsSet(LINKS_KEY,l);}return l;}
  function fav(u){return window.B2Fav?window.B2Fav(u):'';}
  function renderDock(){
    var l=links();
    dock.innerHTML=l.map(function(q){
      return '<a href="'+esc(q.url)+'" target="_blank" rel="noopener" aria-label="'+esc(q.name)+'">'+esc((q.name||host(q.url)||'?').charAt(0).toUpperCase())+fav(q.url)+'<span class="b2-tip">'+esc(q.name||host(q.url))+'</span></a>';
    }).join('')+'<button type="button" class="b2-plus" aria-label="Edit quick links" title="Edit quick links">+</button>';
    dock.querySelector('.b2-plus').addEventListener('click',function(e){e.stopPropagation();panel&&panel.classList.contains('open')?closeLinks():openLinks();});
    if(panel)dock.appendChild(panel);
  }
  function renderPanel(){
    var l=links();
    panel.innerHTML='<h4>Quick links</h4>'+
      (l.length?l.map(function(q,i){
        return '<div class="b2-lrow">'+fav(q.url)+'<span title="'+esc(q.url)+'">'+esc(q.name||host(q.url))+'</span>'+
          '<button type="button" data-a="up" data-i="'+i+'" title="Move left">‹</button><button type="button" data-a="down" data-i="'+i+'" title="Move right">›</button>'+
          '<button type="button" class="x" data-a="del" data-i="'+i+'" title="Remove">×</button></div>';
      }).join(''):'<div class="b2-lempty">No links yet.</div>')+
      '<form class="b2-lform"><input name="n" placeholder="Name" maxlength="40" autocomplete="off"><input name="u" placeholder="https://…" autocomplete="off"><button type="submit">Add</button></form>';
    panel.querySelectorAll('button[data-a]').forEach(function(b){
      b.addEventListener('click',function(){
        var l=links(),i=+b.getAttribute('data-i'),a=b.getAttribute('data-a');
        if(a==='del')l.splice(i,1);
        else{var j=a==='up'?i-1:i+1;if(j<0||j>=l.length)return;var t=l[i];l[i]=l[j];l[j]=t;}
        lsSet(LINKS_KEY,l);renderDock();renderPanel();
      });
    });
    panel.querySelector('form').addEventListener('submit',function(e){
      e.preventDefault();
      var n=this.n.value.trim(),u=this.u.value.trim();if(!u){this.u.focus();return;}
      if(!/^[a-z][a-z0-9+.-]*:/i.test(u))u='https://'+u;
      var l=links();l.push({id:'q'+Date.now().toString(36),name:n||host(u),url:u});lsSet(LINKS_KEY,l);
      renderDock();renderPanel();panel.querySelector('input[name=n]').focus();
    });
  }
  function openLinks(){
    closeAll();
    if(!panel){panel=document.createElement('div');panel.className='b2-links';panel.addEventListener('click',function(e){e.stopPropagation();});dock.appendChild(panel);}
    renderPanel();panel.classList.add('open');
    var f=panel.querySelector('input[name=n]');if(f)f.focus();
  }
  function closeLinks(){if(panel)panel.classList.remove('open');}
  renderDock();
  window.addEventListener('storage',function(e){if(e.key===LINKS_KEY)renderDock();});

  /* ── each page's old back pill is replaced by the bar ── */
  function upgradeHeader(){
    document.querySelectorAll('.topbar a.back-btn, a#backLink').forEach(function(a){
      var h=a.getAttribute('href');
      if(h==='../'||h==='..'||h==='../index.html')a.classList.add('b2-back-hidden');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',upgradeHeader);else upgradeHeader();

  /* opened from downloaded files (file://), a folder link shows a folder listing instead of the page,
     so point links at the folder's index.html; on the published site this never runs */
  if(location.protocol==='file:'){
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href]');if(!a||a.target==='_blank')return;
      var u=new URL(a.getAttribute('href'),location.href);
      if(u.protocol==='file:'&&/\/$/.test(u.pathname)){e.preventDefault();location.href=u.href.replace(/\/(\?|#|$)/,'/index.html$1');}
    },true);
  }

  window.B2={root:ROOT};
})();

/* ─────────────────────────────────────────────────────────────
   Always the newest version.
   Browsers keep a copy of each page for a while, so a page can open from an
   old copy after the site has been updated. Every published version has one
   stamp: it is the ?v=… on this script and the "v" in version.json.
   When a page opens, the stamp it was built with is compared with the site's
   current one (asked fresh, never from a copy). If the site is newer, the
   page fetches itself fresh and reloads, once. While a page stays open, the
   check repeats when you come back to the tab; then it only offers a
   "Refresh" bar, so nothing you have open is interrupted.
   ───────────────────────────────────────────────────────────── */
(function(){
  var me=document.currentScript&&document.currentScript.src||'',m=/[?&]v=([\w.-]+)/.exec(me);
  if(!m||!/^https?:$/.test(location.protocol))return;
  var BUILD=m[1],ROOT=new URL('..',me).href,KEY='b2-updated-to',busy=false,last=0,shown=false;
  function fresh(){
    /* cache:'reload' replaces the browser's saved copy of this page before reloading */
    fetch(location.href,{cache:'reload'}).catch(function(){}).then(function(){location.reload();});
  }
  function bar(){
    if(shown||!document.body)return;shown=true;
    var b=document.createElement('div');
    b.setAttribute('role','status');
    b.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2000;display:flex;align-items:center;gap:12px;background:#241f17;color:#fffdf9;padding:10px 10px 10px 16px;border-radius:14px;box-shadow:0 14px 34px rgba(36,31,23,.3);font:600 13px/1.3 "Plus Jakarta Sans",system-ui,sans-serif;max-width:calc(100vw - 32px);';
    b.innerHTML='<span>A newer version of Brain 2.0 is ready.</span><button type="button" style="height:30px;padding:0 12px;border-radius:9px;border:0;background:#fffdf9;color:#241f17;font:inherit;font-weight:700;cursor:pointer">Refresh</button>';
    b.querySelector('button').onclick=fresh;
    document.body.appendChild(b);
  }
  function check(onOpen){
    if(busy||shown||Date.now()-last<30000)return;busy=true;last=Date.now();
    fetch(ROOT+'version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
      busy=false;
      if(!j||!j.v||j.v===BUILD)return;
      var tried=null;try{tried=sessionStorage.getItem(KEY);}catch(e){}
      /* reload by itself only when the page has just opened, and only once per version (no loops) */
      if(onOpen&&tried!==j.v){try{sessionStorage.setItem(KEY,j.v);}catch(e){bar();return;}fresh();}
      else bar();
    }).catch(function(){busy=false;});
  }
  check(true);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')check(false);});
  window.addEventListener('focus',function(){check(false);});
  window.addEventListener('pageshow',function(e){if(e.persisted)check(false);});
  setInterval(function(){if(document.visibilityState==='visible')check(false);},15*60000);
})();
