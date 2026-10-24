/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — shared shell
   Include right after <body> on every page:
     <script src="../assets/shell.js"></script>
   Injects the sidebar, hides the old "‹ Brain 2.0" back pill,
   remembers the collapsed state, and adds a Cmd/Ctrl+K jump menu
   over every page plus the quick links saved on Home.
   ───────────────────────────────────────────────────────────── */
(function(){
  var COLLAPSE_KEY='brain2SidebarCollapsed';
  var LINKS_KEY='brain2QuickLinks1';

  var script=document.currentScript;
  var ROOT=new URL('..',script.src).href;            // site root, e.g. https://x.github.io/brain2/

  var P=function(d){return '<svg viewBox="0 0 24 24">'+d+'</svg>';};
  var ICONS={
    home:P('<path d="M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5"/>'),
    audit:P('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 11h7M8.5 15h7"/>'),
    monthly:P('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16M4 14h16"/>'),
    calendar:P('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>'),
    fitness:P('<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>'),
    meals:P('<path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M9 6.5c0-1 .6-1.5 1-2M13 6.5c0-1 .6-1.5 1-2"/>'),
    learning:P('<path d="M3 8l9-4 9 4-9 4Z"/><path d="M7 10v5c0 1 5 3 5 3s5-2 5-3v-5"/>'),
    media:P('<path d="M5 4.5h5.5a2 2 0 0 1 2 2V20a1.6 1.6 0 0 0-1.6-1.6H5Z"/><path d="M19 4.5h-4.5a2 2 0 0 0-2 2V20a1.6 1.6 0 0 1 1.6-1.6H19Z"/>'),
    lang:P('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.4 2.4 13.6 0 16M12 4c-2.4 2.4-2.4 13.6 0 16"/>'),
    stoic:P('<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z"/><path d="M5 19c4-4 7-6 11-8"/>'),
    finances:P('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>'),
    wishlist:P('<path d="M12 4l2.3 4.8 5.2.7-3.8 3.6 1 5.1-4.7-2.6-4.7 2.6 1-5.1L5 9.5l5.2-.7Z"/>'),
    travel:P('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
    passport:P('<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>'),
    guide:P('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>'),
    pivot:P('<path d="M12 3l1.7 5L19 9.5l-5.3 1.5L12 16l-1.7-5L5 9.5 10.3 8Z"/>'),
    backup:P('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>'),
    link:P('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    search:P('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
    burger:P('<path d="M4 7h16M4 12h12M4 17h16"/>'),
    collapse:P('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>')
  };

  var NAV=[
    {group:'Daily',items:[
      {p:'',label:'Home',icon:'home',keys:'dashboard today'},
      {p:'calendar/',label:'Calendar',icon:'calendar',keys:'events schedule'},
      {p:'finances/',label:'Finances',icon:'finances',keys:'cards bills payments due money'},
      {p:'fitness/',label:'Fitness',icon:'fitness',keys:'workout'},
      {p:'meals/',label:'Meals',icon:'meals',keys:'groceries food'}
    ]},
    {group:'Growth',items:[
      {p:'media/',label:'Books & Screen',icon:'media',keys:'media movies books reading watching tv goodreads'},
      {p:'language-portal/',label:'Languages',icon:'lang',keys:'spanish portuguese anki duolingo flashcards 75'},
      {p:'learning/',label:'Learning',icon:'learning',keys:'classes courses school'},
      {p:'stoic/',label:'Stoic Workbook',icon:'stoic',keys:'stoicism'}
    ]},
    {group:'Plan',items:[
      {p:'weekly-audit/',label:'Weekly Audit',icon:'audit',keys:'review brain dump'},
      {p:'monthly/',label:'Monthly Planner',icon:'monthly',keys:'goals'},
      {p:'reset-2026/',label:'Mid-Year Pivot',icon:'pivot',keys:'reset vision'}
    ]},
    {group:'Life',items:[
      {p:'wishlist/',label:'Wishlist',icon:'wishlist',keys:'shopping'},
      {p:'travel/',label:'Travel',icon:'travel',keys:'trips'},
      {p:'passport/',label:'DC Passport',icon:'passport',keys:'map spots'},
      {p:'dc-guide/',label:'DC Guide',icon:'guide',keys:'events'}
    ]}
  ];
  var FOOT={p:'backup/',label:'Backup',icon:'backup',keys:'export import restore'};

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function lsGet(k,fb){try{var r=localStorage.getItem(k);return r?JSON.parse(r):fb;}catch(e){return fb;}}
  function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

  // which section is this page? match the longest prefix after the root
  var here=location.href.split('#')[0].split('?')[0];
  var rel=here.indexOf(ROOT)===0?here.slice(ROOT.length):'';
  rel=rel.replace(/index\.html$/,'');
  function isActive(p){return p===''?rel==='':rel.indexOf(p)===0;}

  var body=document.body;
  body.classList.add('b2-shell');
  if(lsGet(COLLAPSE_KEY,false))body.classList.add('b2-collapsed');

  function linkHtml(it){
    return '<a class="b2-link'+(isActive(it.p)?' active':'')+'" href="'+ROOT+it.p+'" title="'+esc(it.label)+'">'+ICONS[it.icon]+'<span>'+esc(it.label)+'</span></a>';
  }
  var isMac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent);
  var html='<div class="b2-sb-top">'+
      '<button class="b2-icon-btn b2-collapse-btn" type="button" aria-label="Collapse sidebar" title="Collapse sidebar">'+ICONS.collapse+'</button>'+
      '<a class="b2-logo" href="'+ROOT+'">Brain <em>2.0</em></a></div>'+
    '<button class="b2-jump" type="button" title="Jump to… ('+(isMac?'⌘':'Ctrl ')+'K)">'+ICONS.search+'<span>Jump to…</span><span class="b2-kbd">'+(isMac?'⌘K':'Ctrl K')+'</span></button>'+
    '<nav class="b2-nav" aria-label="Brain 2.0">';
  NAV.forEach(function(g,i){
    if(i)html+='<div class="b2-rule"></div>';
    html+='<div class="b2-group">'+g.group+'</div>'+g.items.map(linkHtml).join('');
  });
  html+='</nav><div class="b2-sb-foot">'+linkHtml(FOOT)+'</div>';

  var sb=document.createElement('aside');
  sb.className='b2-sb';
  sb.innerHTML=html;
  var scrim=document.createElement('div');
  scrim.className='b2-scrim';
  body.insertBefore(scrim,body.firstChild);
  body.insertBefore(sb,body.firstChild);

  sb.querySelector('.b2-collapse-btn').addEventListener('click',function(){
    var c=body.classList.toggle('b2-collapsed');
    lsSet(COLLAPSE_KEY,c);
    window.dispatchEvent(new Event('resize'));       // let maps/charts re-measure
  });
  scrim.addEventListener('click',function(){body.classList.remove('b2-drawer');});

  /* ── header clean-up once the page's markup exists ── */
  function upgradeHeader(){
    document.querySelectorAll('.topbar a.back-btn, a#backLink').forEach(function(a){
      var h=a.getAttribute('href');
      if(h==='../'||h==='..'||h==='../index.html')a.classList.add('b2-back-hidden');
    });
    var bar=document.querySelector('.topbar');
    if(!bar)return;
    var left=bar.querySelector('.topbar-left')||bar;
    var mb=document.createElement('button');
    mb.type='button';mb.className='b2-icon-btn b2-menu-btn';mb.setAttribute('aria-label','Open menu');mb.innerHTML=ICONS.burger;
    mb.addEventListener('click',function(){body.classList.add('b2-drawer');});
    left.insertBefore(mb,left.firstChild);
  }

  /* ── jump menu ── */
  var palBg,palInput,palList,palItems=[],palSel=0;
  function allEntries(){
    var out=[];
    NAV.forEach(function(g){g.items.forEach(function(it){out.push({sec:'Pages',label:it.label,href:ROOT+it.p,icon:it.icon,keys:it.keys||''});});});
    out.push({sec:'Pages',label:FOOT.label,href:ROOT+FOOT.p,icon:FOOT.icon,keys:FOOT.keys});
    (lsGet(LINKS_KEY,null)||[]).forEach(function(l){
      if(l&&l.url)out.push({sec:'Quick links',label:l.name||l.url,href:l.url,icon:'link',keys:l.url,ext:true});
    });
    return out;
  }
  function buildPalette(){
    palBg=document.createElement('div');
    palBg.className='b2-palette-bg';
    palBg.innerHTML='<div class="b2-palette" role="dialog" aria-label="Jump to"><input type="text" placeholder="Jump to a page or quick link…" aria-label="Search"><div class="b2-pal-list"></div></div>';
    body.appendChild(palBg);
    palInput=palBg.querySelector('input');
    palList=palBg.querySelector('.b2-pal-list');
    palBg.addEventListener('mousedown',function(e){if(e.target===palBg)closePalette();});
    palInput.addEventListener('input',renderPalette);
    palInput.addEventListener('keydown',function(e){
      if(e.key==='ArrowDown'){e.preventDefault();palSel=Math.min(palSel+1,palItems.length-1);markSel();}
      else if(e.key==='ArrowUp'){e.preventDefault();palSel=Math.max(palSel-1,0);markSel();}
      else if(e.key==='Enter'){e.preventDefault();go(palItems[palSel]);}
      else if(e.key==='Escape'){e.preventDefault();closePalette();}
    });
  }
  function renderPalette(){
    var q=palInput.value.trim().toLowerCase();
    palItems=allEntries().filter(function(e){return !q||(e.label+' '+e.keys).toLowerCase().indexOf(q)>=0;});
    palSel=0;
    if(!palItems.length){palList.innerHTML='<div class="b2-pal-empty">Nothing matches “'+esc(q)+'”</div>';return;}
    var h='',sec='';
    palItems.forEach(function(e,i){
      if(e.sec!==sec){sec=e.sec;h+='<div class="b2-pal-sec">'+esc(sec)+'</div>';}
      h+='<a class="b2-pal-item" data-i="'+i+'" href="'+esc(e.href)+'"'+(e.ext?' target="_blank" rel="noopener"':'')+'>'+ICONS[e.icon]+'<span>'+esc(e.label)+'</span>'+(e.ext?'<span class="b2-pal-hint">↗</span>':'')+'</a>';
    });
    palList.innerHTML=h;
    palList.querySelectorAll('.b2-pal-item').forEach(function(a){
      a.addEventListener('mouseenter',function(){palSel=+a.getAttribute('data-i');markSel();});
      a.addEventListener('click',function(){closePalette();});
    });
    markSel();
  }
  function markSel(){
    palList.querySelectorAll('.b2-pal-item').forEach(function(a){
      var on=+a.getAttribute('data-i')===palSel;a.classList.toggle('sel',on);if(on)a.scrollIntoView({block:'nearest'});
    });
  }
  function go(e){
    if(!e)return;closePalette();
    if(e.ext)window.open(e.href,'_blank','noopener');else location.href=e.href;
  }
  function openPalette(){
    if(!palBg)buildPalette();
    body.classList.remove('b2-drawer');
    palBg.classList.add('open');palInput.value='';renderPalette();
    palInput.focus();
  }
  function closePalette(){if(palBg)palBg.classList.remove('open');}
  window.B2={openJump:openPalette,root:ROOT};

  sb.querySelector('.b2-jump').addEventListener('click',openPalette);
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&!e.altKey&&(e.key==='k'||e.key==='K')){e.preventDefault();openPalette();}
    else if(e.key==='Escape'&&body.classList.contains('b2-drawer'))body.classList.remove('b2-drawer');
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',upgradeHeader);
  else upgradeHeader();
})();
