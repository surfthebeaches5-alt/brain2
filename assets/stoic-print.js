/* ─────────────────────────────────────────────────────────────
   Stoic Workbook — shared module tools (loaded by every module page)
   · keeps the module toolbar visible under the Brain 2.0 top bar
   · "Save PDF" menu: this exercise / all exercises / whole module
   · prints every answer in full (textareas are swapped for plain text
     while printing, so long answers never get cut off)
   · Import: load a file made with Export back into this module
   Answers stay in the module's own key: blussomly_stoic_m{N}_v1.
   ───────────────────────────────────────────────────────────── */
(function(){
  var file=location.pathname.split('/').pop()||'';
  var m=file.match(/^module-(\d+)/); if(!m)return;
  var N=m[1], STORE='blussomly_stoic_m'+N+'_v1';

  var css=
  /* screen: toolbar sits under the shared top bar; jumps land below both */
  '.toolbar{top:var(--b2-nav-h,64px)!important;z-index:60!important}'+
  '.page{scroll-margin-top:140px!important}'+
  '.sp-wrap{position:relative;display:inline-block}'+
  '.sp-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:80;width:290px;background:var(--cream-card,#FBF7F0);border:1px solid var(--line,rgba(214,76,99,.3));border-radius:14px;box-shadow:0 18px 40px -18px rgba(150,40,60,.45);padding:8px;display:none}'+
  '.sp-menu.open{display:block}'+
  '.sp-menu button{display:block;width:100%;text-align:left;background:none;border:none;border-radius:9px;padding:9px 11px;cursor:pointer;font:600 13px var(--font-body,sans-serif);color:var(--coral-deep,#C23A54)}'+
  '.sp-menu button small{display:block;font-weight:500;font-size:11.5px;color:var(--coral-mid,#DD5B70);margin-top:1px}'+
  '.sp-menu button:hover{background:rgba(214,76,99,.08)}'+
  '.sp-menu .sp-tip{font-size:11px;color:var(--coral-soft,#E796A6);padding:6px 11px 3px;border-top:1px solid var(--line-soft,rgba(214,76,99,.18));margin-top:4px}'+
  '.pans{display:none}'+
  '@media print{'+
    '@page{margin:12mm}'+
    '.b2-nav,.b2-dock,.b2-links,.sr-pill,.sp-menu,.toolbar,#toast{display:none!important}'+
    '.runfoot{display:none!important}'+
    '.page{break-after:auto!important;page-break-after:auto!important;break-before:page;margin:0!important}'+
    '.page.sp-first{break-before:auto}'+
    'body.sp-ex .wrap>p,body.sp-one .wrap>p{display:none!important}'+
    'body.sp-ex .page:not([data-sp-ex]){display:none!important}'+
    'body.sp-one .page:not(.sp-keep){display:none!important}'+
    'textarea.sp-hide{display:none!important}'+
    '.pans{display:block;white-space:pre-wrap;word-wrap:break-word;height:auto!important;overflow:visible!important;resize:none}'+
    '.lines,.pans.lines{-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
    '.ring-field,.tt-box,.imap-card,.prompt-block{break-inside:avoid}'+
  '}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var pages=[].slice.call(document.querySelectorAll('section.page[id]'));
  pages.forEach(function(p){ if(/^p-ex\d/.test(p.id))p.setAttribute('data-sp-ex',''); });
  function label(id){var o=document.querySelector('#jump option[value="'+id+'"]');return o?o.textContent.replace(/\s*\(\d+\/\d+\)\s*$/,'').trim():'';}

  /* the section you're looking at, and — if it's an exercise — all of its pages */
  function current(){
    var y=Math.max(150,Math.min(innerHeight*0.4,320)),cur=pages[0];
    pages.forEach(function(p){ if(p.getBoundingClientRect().top<=y)cur=p; });
    return cur;
  }
  function group(sec){
    var g=sec.id.match(/^p-ex(\d+)/);
    if(!g)return [sec];
    var re=new RegExp('^p-ex'+g[1]+'(?!\\d)');
    return pages.filter(function(p){return re.test(p.id);});
  }

  /* textareas → plain text blocks while printing */
  function prep(){
    unprep();
    [].slice.call(document.querySelectorAll('textarea')).forEach(function(t){
      var d=document.createElement('div');
      d.className='pans '+t.className;
      d.textContent=t.value;
      var cs=getComputedStyle(t);
      d.style.minHeight=t.value?'0':(parseInt(t.style.minHeight)||parseInt(cs.minHeight)||28)+'px';
      if(t.style.textAlign)d.style.textAlign=t.style.textAlign;
      t.classList.add('sp-hide');
      t.parentNode.insertBefore(d,t.nextSibling);
    });
  }
  function markFirst(){
    pages.forEach(function(p){p.classList.remove('sp-first');});
    var first=pages.filter(function(p){return getComputedStyle(p).display!=='none';})[0];
    if(first)first.classList.add('sp-first');
  }
  function unprep(){
    [].slice.call(document.querySelectorAll('.pans')).forEach(function(d){d.remove();});
    [].slice.call(document.querySelectorAll('textarea.sp-hide')).forEach(function(t){t.classList.remove('sp-hide');});
    document.body.classList.remove('sp-ex','sp-one');
    pages.forEach(function(p){p.classList.remove('sp-keep','sp-first');});
  }
  window.addEventListener('beforeprint',function(){ if(!document.querySelector('.pans'))prep(); markFirst(); });
  window.addEventListener('afterprint',unprep);

  function scope(s){
    prep();
    if(s==='ex')document.body.classList.add('sp-ex');
    if(s==='one'){group(current()).forEach(function(p){p.classList.add('sp-keep');});document.body.classList.add('sp-one');}
    markFirst();
  }
  function printScope(s){ scope(s); setTimeout(function(){window.print();},50); }
  window.StoicPrint={scope:scope,reset:unprep};

  /* Save PDF menu (replaces the plain Print button) */
  var old=document.getElementById('btnPrint');
  if(old){
    var btn=old.cloneNode(true);btn.textContent='Save PDF';btn.title='Print or save as PDF';
    var wrap=document.createElement('span');wrap.className='sp-wrap';
    old.parentNode.replaceChild(wrap,old);wrap.appendChild(btn);
    var menu=document.createElement('div');menu.className='sp-menu';wrap.appendChild(menu);
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var sec=current(),isEx=sec&&/^p-ex\d/.test(sec.id),name=label(sec.id)||'this section';
      menu.innerHTML=
        '<button data-s="one">'+(isEx?'This exercise':'This page')+'<small></small></button>'+
        '<button data-s="ex">All exercises in Module '+N+'<small>just the pages you write on</small></button>'+
        '<button data-s="all">Whole module<small>reading pages and exercises</small></button>'+
        '<div class="sp-tip">In the print window, choose “Save as PDF” as the printer.</div>';
      menu.querySelector('[data-s="one"] small').textContent=name;
      menu.classList.toggle('open');
    });
    menu.addEventListener('click',function(e){
      var b=e.target.closest('button[data-s]');if(!b)return;
      menu.classList.remove('open');printScope(b.getAttribute('data-s'));
    });
    document.addEventListener('click',function(e){ if(!wrap.contains(e.target))menu.classList.remove('open'); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape')menu.classList.remove('open'); });
  }

  /* Import — pairs with the module's Export button */
  var exp=document.getElementById('btnExport');
  if(exp){
    var imp=document.createElement('button');imp.className='tbtn';imp.id='btnImport';imp.textContent='Import';imp.title='Load answers from an exported file';
    var inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.style.display='none';
    exp.parentNode.insertBefore(imp,exp.nextSibling);exp.parentNode.insertBefore(inp,imp.nextSibling);
    imp.addEventListener('click',function(){inp.click();});
    inp.addEventListener('change',function(){
      var f=inp.files&&inp.files[0];if(!f)return;
      var r=new FileReader();
      r.onload=function(){
        var d;try{d=JSON.parse(r.result);}catch(e){alert('That file isn’t an answers export.');return;}
        if(!d||typeof d!=='object'||typeof d.text!=='object'){alert('That file isn’t an answers export.');return;}
        if(!confirm('Replace the answers in Module '+N+' with the ones in this file?'))return;
        try{localStorage.setItem(STORE,JSON.stringify(d));}catch(e){}
        location.reload();
      };
      r.readAsText(f);inp.value='';
    });
  }
})();
