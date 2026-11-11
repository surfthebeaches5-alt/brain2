/* ─────────────────────────────────────────────────────────────
   Stoic Workbook — shared module tools (loaded by every module page)
   · keeps the module toolbar visible under the Brain 2.0 top bar
   · "Save PDF" menu: this exercise / all exercises / whole module
   · prints every answer in full (textareas are swapped for plain text
     while printing, so long answers never get cut off)
   · one workbook page per sheet of paper: a page that would run over is
     scaled down just enough to fit (never below 55%)
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
  '.sp-menu .sp-drv{display:flex;align-items:center;gap:7px;padding:8px 11px 4px;font:600 12px var(--font-body,sans-serif);color:var(--coral-deep,#C23A54);cursor:pointer;border-top:1px solid var(--line-soft,rgba(214,76,99,.18));margin-top:4px}'+
  '.sp-menu .sp-tip{font-size:11px;color:var(--coral-soft,#E796A6);padding:6px 11px 3px;border-top:1px solid var(--line-soft,rgba(214,76,99,.18));margin-top:4px}'+
  '.pans{display:none}'+
  /* measuring mode: lay the pages out on screen exactly as they will print, to find each one's scale */
  'body.sp-fit .wrap{width:'+946+'px!important;max-width:none!important;padding:0!important;margin:0!important}'+
  'body.sp-fit .page{box-shadow:none!important;border:none!important;border-radius:0!important;padding:34px 40px!important;margin:0!important}'+
  'body.sp-fit .toolbar,body.sp-fit .runfoot,body.sp-fit .b2-nav{display:none!important}'+
  'body.sp-fit textarea.sp-hide{display:none!important}'+
  'body.sp-fit .pans{display:block;white-space:pre-wrap;word-wrap:break-word;height:auto!important;overflow:visible!important}'+
  'body.sp-fit.sp-ex .page:not([data-sp-ex]){display:none!important}'+
  'body.sp-fit.sp-one .page:not(.sp-keep){display:none!important}'+
  '@media print{'+
    /* a sheet with Letter's proportions but wide enough (946px inside the margins) that the pages keep
       their designed two-column layout, not the narrow-screen one; printers scale it to Letter */
    '@page{size:10.75in 13.91in;margin:.45in}'+
    '.b2-nav,.b2-dock,.b2-links,.sr-pill,.sp-menu,.toolbar,#toast{display:none!important}'+
    '.runfoot{display:none!important}'+
    '.page{break-after:auto!important;page-break-after:auto!important;break-before:page;break-inside:avoid;margin:0!important}'+
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
  /* load every picture up front, so a page's real height is known when it's measured for printing */
  [].forEach.call(document.querySelectorAll('img[loading="lazy"]'),function(i){i.loading='eager';});
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
  /* The sheet (see @page below) leaves 946 × 1249 px inside its margins. Scale any workbook page that
     is taller than that so it prints on one sheet. */
  var SHEET_H=1236,MIN_Z=0.55,locked=[];
  /* Browsers judge "is this a narrow screen?" by ordinary paper width when printing, which would
     collapse the pages' columns. Pin every style that a narrow-screen rule would change to the value
     it has right now (the wide layout), for as long as the print lasts. */
  function lockLayout(){
    unlockLayout();
    [].forEach.call(document.styleSheets,function(sh){
      var rules;try{rules=sh.cssRules;}catch(e){return;}
      [].forEach.call(rules||[],function(r){
        if(!r.media||!r.cssRules||!/max-width/.test(r.media.mediaText)||/print/.test(r.media.mediaText))return;
        [].forEach.call(r.cssRules,function(q){
          if(!q.selectorText||!q.style)return;
          var els;try{els=document.querySelectorAll(q.selectorText);}catch(e){return;}
          [].forEach.call(els,function(el){
            if(!el.closest('section.page'))return;
            var cs=getComputedStyle(el);
            [].forEach.call(q.style,function(pn){
              var v=cs.getPropertyValue(pn);
              /* resolved track sizes → proportions, so the grid still fills a scaled page */
              if(pn==='grid-template-columns')v=v.replace(/(\d+(?:\.\d+)?)px/g,'$1fr');
              locked.push([el,pn,el.style.getPropertyValue(pn),el.style.getPropertyPriority(pn)]);
              el.style.setProperty(pn,v,'important');
            });
          });
        });
      });
    });
  }
  function unlockLayout(){
    for(var i=locked.length-1;i>=0;i--){var l=locked[i];if(l[2])l[0].style.setProperty(l[1],l[2],l[3]);else l[0].style.removeProperty(l[1]);}
    locked=[];
  }
  /* apply every print-only style rule on screen (for measuring, and for drawing the Drive copy) */
  function emulate(on,forDrawing){
    var st=document.getElementById('sp-emul');if(st)st.remove();
    if(!on)return;
    var css='';
    [].forEach.call(document.styleSheets,function(sh){
      var rules;try{rules=sh.cssRules;}catch(e){return;}
      [].forEach.call(rules||[],function(r){
        if(r.media&&r.cssRules&&/^\s*print\s*$/.test(r.media.mediaText))[].forEach.call(r.cssRules,function(q){if(q.type===1)css+=q.cssText+'\n';});
      });
    });
    st=document.createElement('style');st.id='sp-emul';
    st.textContent=css+(forDrawing?'section.page,section.page *{hyphens:manual!important;-webkit-hyphens:manual!important}':'');
    document.head.appendChild(st);
  }
  function fit(){
    var sy=window.scrollY;
    document.body.classList.add('sp-fit');
    emulate(true);
    lockLayout();
    pages.forEach(function(p){
      p.style.zoom='';
      if(getComputedStyle(p).display==='none')return;
      if(p.getBoundingClientRect().height<=SHEET_H)return;
      var lo=MIN_Z,hi=1;
      for(var i=0;i<7;i++){var z=(lo+hi)/2;p.style.zoom=z;if(p.getBoundingClientRect().height<=SHEET_H)lo=z;else hi=z;}
      p.style.zoom=lo.toFixed(3);
    });
    emulate(false);
    document.body.classList.remove('sp-fit');
    window.scrollTo(0,sy);
  }
  function unprep(){
    [].slice.call(document.querySelectorAll('.pans')).forEach(function(d){d.remove();});
    [].slice.call(document.querySelectorAll('textarea.sp-hide')).forEach(function(t){t.classList.remove('sp-hide');});
    document.body.classList.remove('sp-ex','sp-one');
    pages.forEach(function(p){p.classList.remove('sp-keep','sp-first');p.style.zoom='';});
    unlockLayout();
  }
  window.addEventListener('beforeprint',function(){ if(!document.querySelector('.pans')){prep();fit();} markFirst(); });
  window.addEventListener('afterprint',unprep);

  function scope(s){
    prep();
    if(s==='ex')document.body.classList.add('sp-ex');
    if(s==='one'){group(current()).forEach(function(p){p.classList.add('sp-keep');});document.body.classList.add('sp-one');}
    fit();
    markFirst();
  }
  function printScope(s){ scope(s); setTimeout(function(){window.print();},50); }
  /* the same pages, saved to Google Drive: each sheet is drawn from the page as it's laid out for print */
  var toDrive=false;
  function driveScope(s){
    if(!window.B2PDF)return printScope(s);
    var what=s==='one'?(label(current().id)||'Page'):s==='ex'?'Exercises':'Whole module';
    window.B2PDF.toDrive({
      build:function(){
        scope(s);
        pages.forEach(function(p){p.style.zoom='';});            /* drawn at full size, then fitted to the sheet */
        document.body.classList.add('sp-fit');emulate(true,true);
        return {pages:pages.filter(function(p){return getComputedStyle(p).display!=='none';})};
      },
      cleanup:function(){emulate(false);document.body.classList.remove('sp-fit');unprep();},
      name:'Stoic Module '+N+' - '+what,folder:'Stoic Workbook',sheet:[10.75,13.91]
    });
  }
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
        (window.B2PDF?'<label class="sp-drv"><input type="checkbox" id="sp-drv"'+(toDrive?' checked':'')+'> Save to Google Drive instead</label>':'')+
        '<div class="sp-tip">In the print window, choose “Save as PDF” as the printer.</div>';
      menu.querySelector('[data-s="one"] small').textContent=name;
      menu.classList.toggle('open');
    });
    menu.addEventListener('change',function(e){if(e.target&&e.target.id==='sp-drv')toDrive=e.target.checked;});
    menu.addEventListener('click',function(e){
      var b=e.target.closest('button[data-s]');if(!b)return;
      menu.classList.remove('open');(toDrive?driveScope:printScope)(b.getAttribute('data-s'));
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
