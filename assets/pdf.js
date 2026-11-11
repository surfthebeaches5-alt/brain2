/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — save a page's PDF straight to Google Drive.
   The "PDF" buttons use the browser's own print window (sharpest result).
   A browser can't hand that file to a website, so for Drive the same printable
   document is drawn into a PDF here instead: each sheet is a high-resolution
   picture of the page (looks the same; the text can't be selected or searched).

   B2PDF.toDrive({
     build()      → the printable element (docs)  or  {pages:[elements]} (one element per sheet)
     cleanup()    undo whatever build() did
     name         file name, without ".pdf"
     folder       sub-folder inside "Brain 2.0 PDFs"
     landscape, margin:[top/bottom mm, left/right mm]      (docs)
     sheet:[width in, height in]                           (pages; default Letter)
   })
   Needs assets/gcal.js (Google sign-in + Drive) and the Drive backup switched on.
   html2canvas and jsPDF are fetched only when you save.
   ───────────────────────────────────────────────────────────── */
(function(){
  var LIBS=['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
  var PX=96/25.4,loading=null,busy=false,pill=null,pillT=null;
  function load(){
    if(loading)return loading;
    loading=Promise.all(LIBS.map(function(src){return new Promise(function(res,rej){
      var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('Couldn’t load the PDF tools. Check your connection and try again.'));};document.head.appendChild(s);});}))
      .catch(function(e){loading=null;throw e;});
    return loading;
  }
  /* small status bar, bottom centre */
  function say(html,kind,stay){
    if(!pill){pill=document.createElement('div');pill.setAttribute('role','status');
      pill.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1900;background:#241f17;color:#fffdf9;padding:11px 16px;border-radius:14px;box-shadow:0 14px 34px rgba(36,31,23,.3);font:600 13px/1.4 "Plus Jakarta Sans",system-ui,sans-serif;max-width:calc(100vw - 32px);';
      document.body.appendChild(pill);}
    pill.innerHTML=html;pill.style.display='block';pill.style.background=kind==='bad'?'#8f2f43':'#241f17';
    clearTimeout(pillT);if(!stay)pillT=setTimeout(function(){pill.style.display='none';},kind==='bad'?9000:7000);
  }
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  /* the top bar is left out of the working copy: it isn't in the PDF, and its icons would try to load again */
  function skip(n){return !!(n.classList&&(n.classList.contains('b2-nav')||n.classList.contains('b2-dock')))||n.tagName==='SCRIPT';}
  function shot(el,o){return window.html2canvas(el,Object.assign({scale:2.5,backgroundColor:'#ffffff',useCORS:true,logging:false,ignoreElements:skip},o||{}));}

  /* a flowing document → sheets, cut only between lines/rows, never through one */
  function fromDoc(src,opt,step){
    var land=!!opt.landscape,PW=(land?11:8.5)*96,PH=(land?8.5:11)*96,m=opt.margin||[12,12],my=m[0]*PX,mx=m[1]*PX,cw=Math.round(PW-2*mx),ch=Math.floor(PH-2*my);
    var host=document.createElement('div');host.style.cssText='position:absolute;left:-30000px;top:0;width:'+cw+'px;background:#fff;';
    var el=src.cloneNode(true);el.removeAttribute('id');el.style.display='block';host.appendChild(el);document.body.appendChild(host);
    var done=function(){host.remove();};
    /* where the sheets end at shrink factor k (the document is laid out 1/k wider and drawn k smaller) */
    function plan(k){
      host.style.width=Math.round(cw/k)+'px';
      var top=host.getBoundingClientRect().top,H=Math.ceil(host.getBoundingClientRect().height),lim=ch/k,solid=[];
      /* things a page break may not cut through: a line, a row, a block that fits on a page… */
      [].forEach.call(el.querySelectorAll('li,tr,p,h1,h2,h3,h4,img,svg,[class*="-blk"],[class*="goal"],[class*="-ev"],[class*="focus"],[class*="rate"],[class*="info"]>div'),function(n){
        var r=n.getBoundingClientRect();if(r.height>0&&r.height<lim*0.6)solid.push([r.top-top,r.bottom-top]);});
      /* …and a heading stays with the start of what it introduces */
      [].forEach.call(el.querySelectorAll('h2,h3,h4,[class*="-part"]'),function(n){
        var nx=n.nextElementSibling;if(!nx)return;var a=n.getBoundingClientRect(),b=nx.getBoundingClientRect();
        if(b.height>0)solid.push([a.top-top,Math.min(b.bottom,b.top+40)-top]);});
      function safe(y){for(var i=0;i<solid.length;i++)if(solid[i][0]<y-0.5&&solid[i][1]>y+0.5)return false;return true;}
      var cuts=[0],y=0;
      while(H-y>lim+1){var c=y+lim;for(var t=c;t>y+lim*0.4;t--){if(safe(t)){c=t;break;}}cuts.push(c);y=c;}
      cuts.push(H);
      return {k:k,cuts:cuts,need:Math.ceil((H-1)/lim)};
    }
    return (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(function(){
      /* tidy breaks can cost an extra sheet; shrink a little (to 82% at most) to stay on the natural number of sheets */
      var P=plan(1),want=P.need,ks=[0.94,0.88,0.82];
      for(var q=0;q<ks.length&&P.cuts.length-1>want;q++){var T=plan(ks[q]);if(T.cuts.length-1<P.cuts.length-1||T.cuts.length-1<=want)P=T;}
      plan(P.k);
      var k=P.k,cuts=P.cuts,hw=Math.round(cw/k);
      var doc=new window.jspdf.jsPDF({orientation:land?'landscape':'portrait',unit:'pt',format:'letter',compress:true}),i=0;
      function next(){
        if(i>=cuts.length-1)return doc;
        var y0=cuts[i],h=cuts[i+1]-y0;step(i+1,cuts.length-1);
        return shot(host,{y:y0,height:h,width:hw,windowWidth:Math.max(hw,document.documentElement.clientWidth)}).then(function(cv){
          if(i>0)doc.addPage();
          doc.addImage(cv.toDataURL('image/jpeg',0.92),'JPEG',mx*0.75,my*0.75,cw*0.75,h*k*0.75,undefined,'FAST');
          i++;return next();});
      }
      return next();
    }).then(function(doc){done();return doc.output('blob');},function(e){done();throw e;});
  }
  /* ready-made pages (one element per sheet), each scaled to fit its sheet */
  function fromPages(pages,opt,step){
    var sh=opt.sheet||[8.5,11],W=sh[0]*72,Hh=sh[1]*72,mg=(opt.sheetMargin==null?0.45:opt.sheetMargin)*72;
    var doc=new window.jspdf.jsPDF({orientation:W>Hh?'landscape':'portrait',unit:'pt',format:[W,Hh],compress:true}),i=0;
    function next(){
      if(i>=pages.length)return doc;
      step(i+1,pages.length);
      return shot(pages[i],{scale:2}).then(function(cv){
        if(i>0)doc.addPage([W,Hh]);
        var k=Math.min((W-2*mg)/cv.width,(Hh-2*mg)/cv.height),w=cv.width*k,h=cv.height*k;
        doc.addImage(cv.toDataURL('image/jpeg',0.9),'JPEG',(W-w)/2,mg,w,h,undefined,'FAST');
        i++;return next();});
    }
    return (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(next).then(function(doc){return doc.output('blob');});
  }
  function toDrive(opt){
    if(busy)return Promise.resolve();
    var G=window.GCal;
    if(!G||!G.configured()){say('Connect Google on the Today page first, then try again.','bad');return Promise.resolve();}
    if(!G.drive.on()){say('Turn on Google Drive on the <a href="'+esc(opt.backupUrl||'../backup/')+'" style="color:inherit">Backup page</a> first. Saving PDFs uses the same permission.','bad');return Promise.resolve();}
    busy=true;say('Getting ready…',null,true);
    /* sign-in has to start inside the click, before anything slow */
    var signed=G.drive.ready()?Promise.resolve():G.signIn();
    var built=null;
    return signed.then(load).then(function(){
      built=opt.build();
      var step=function(i,n){say('Making the PDF… page '+i+' of '+n,null,true);};
      return built&&built.pages?fromPages(built.pages,opt,step):fromDoc(built,opt,step);
    }).then(function(blob){
      try{opt.cleanup&&opt.cleanup();}catch(e){}built=null;
      say('Saving to Google Drive…',null,true);
      return G.drive.savePdf(blob,opt.name,opt.folder);
    }).then(function(f){
      busy=false;
      say('Saved to Google Drive: Brain 2.0 PDFs › '+esc(opt.folder)+(f&&f.webViewLink?' · <a href="'+esc(f.webViewLink)+'" target="_blank" rel="noopener" style="color:inherit">Open</a>':''));
      return f;
    }).catch(function(e){
      busy=false;try{if(built)opt.cleanup&&opt.cleanup();}catch(x){}
      say(e&&e.code==='drive-off'?'Google Drive isn’t switched on for your Google project yet. Open the <a href="'+esc(opt.backupUrl||'../backup/')+'" style="color:inherit">Backup page</a> for the one-time step.':esc(e&&e.message||'Couldn’t save the PDF.'),'bad');
    });
  }
  /* the cloud icon used on "Drive" buttons */
  var ICON='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="m8 17 4-4 4 4"/><path d="M20 16.6A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/></svg>';
  window.B2PDF={toDrive:toDrive,icon:ICON,make:function(opt){return load().then(function(){var b=opt.build();var p=b&&b.pages?fromPages(b.pages,opt,function(){}):fromDoc(b,opt,function(){});return p.then(function(x){opt.cleanup&&opt.cleanup();return x;});});}};
})();
