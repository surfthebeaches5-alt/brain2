/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — "in numbers": what the other pages recorded between two dates.
   Read-only. Used by Weekly Audit and Monthly Planner so "Look back" starts
   from what actually happened instead of from memory.

   B2Stats.range('YYYY-MM-DD','YYYY-MM-DD') → {lang, fit, lib, bills, tasks}
     (a source is null when its page has never been used)
   B2Stats.render(el, from, to, {title, onPick(text)})  draws the card body.

   Sources: langChallenge1 + langPortal5 (minutes, cards, pages, days complete),
   fitnessTracker1_day_<date> (active days, minutes), mediaTracker3 (finished),
   finTrackerState2 (statements due in the range and whether they're paid),
   brain2Tasks1 (tasks ticked off).
   ───────────────────────────────────────────────────────────── */
(function(){
  function ls(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function pad(n){return (n<10?'0':'')+n;}
  function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function pd(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
  function each(from,to,fn){for(var d=pd(from),e=pd(to),n=0;d<=e&&n<400;d.setDate(d.getDate()+1),n++)fn(iso(d),d);}
  function hm(mins){mins=Math.round(mins);var h=Math.floor(mins/60),m=mins%60;return h?h+'h'+(m?' '+m+'m':''):m+'m';}
  function plural(n,w){return n+' '+w+(n===1?'':'s');}

  function lang(from,to){
    var C=ls('langChallenge1'),P=ls('langPortal5'),chs=C&&Array.isArray(C.challenges)?C.challenges:[],log=P&&Array.isArray(P.log)?P.log:[];
    if(!chs.length&&!log.length)return null;
    var r={mins:0,cards:0,pages:0,complete:0,days:0};
    chs.forEach(function(c){
      var ids=(Array.isArray(c.tasks)?c.tasks:[]).map(function(t){return t.id;}),days=c.days||{},len=+c.length||75;
      var end=c.start?iso(new Date(pd(c.start).getFullYear(),pd(c.start).getMonth(),pd(c.start).getDate()+len-1)):'';
      Object.keys(days).forEach(function(k){if(k<from||k>to)return;var d=days[k]||{};r.mins+=Math.max(0,+d.minutes||0);r.cards+=+d.cards||0;r.pages+=Math.max(0,+d.pages||0);});
      if(c.endedAt||!c.start||!ids.length)return;
      each(from,to,function(k){if(k<c.start||k>end||k>iso(new Date()))return;r.days++;
        var done=days[k]&&Array.isArray(days[k].done)?days[k].done:[];if(ids.every(function(id){return done.indexOf(id)>=0;}))r.complete++;});
    });
    log.forEach(function(e){var d=new Date(e.date);if(isNaN(d))return;var k=iso(d);if(k>=from&&k<=to)r.mins+=Math.max(0,+e.mins||0);});
    return r;
  }
  function fit(from,to){
    var any=false;try{for(var i=0;i<localStorage.length;i++)if(/^fitnessTracker1_day_/.test(localStorage.key(i))){any=true;break;}}catch(e){}
    if(!any)return null;
    var r={days:0,mins:0};
    each(from,to,function(k){var d=ls('fitnessTracker1_day_'+k);if(!d||typeof d!=='object')return;
      var acts=Array.isArray(d.acts)?d.acts:[],names=d.doneNames?Object.keys(d.doneNames).filter(function(x){return d.doneNames[x];}):[];
      if((d.nonneg&&d.nonneg.workout)||acts.length||names.length)r.days++;
      acts.forEach(function(a){r.mins+=Math.max(0,+a.minutes||0);});});
    return r;
  }
  function lib(from,to){
    var M=ls('mediaTracker3');if(!M||typeof M!=='object')return null;
    var out=[];['books','screen','music','videos','articles'].forEach(function(sec){(Array.isArray(M[sec])?M[sec]:[]).forEach(function(it){
      if(it&&it.status==='done'&&it.date&&it.date>=from&&it.date<=to)out.push({title:String(it.title||'Untitled'),sec:sec});});});
    return {items:out};
  }
  function bills(from,to){
    var S=ls('finTrackerState2'),cards=S&&Array.isArray(S.cards)?S.cards.filter(function(c){return c&&c.active&&c.day;}):[];
    if(!cards.length)return null;
    /* only from the first statement you ever ticked: earlier due dates were never tracked */
    var first='';cards.forEach(function(c){(Array.isArray(c.paidDates)?c.paidDates:[]).forEach(function(k){if(!first||k<first)first=k;});});
    if(!first)return null;
    var r={due:0,paid:0,unpaid:[]},today=iso(new Date());
    each(from,to,function(k,d){if(k>today||k<first)return;var dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
      cards.forEach(function(c){if(Math.min(parseInt(c.day,10)||1,dim)!==d.getDate())return;r.due++;
        if(Array.isArray(c.paidDates)&&c.paidDates.indexOf(k)>=0)r.paid++;else r.unpaid.push(String(c.name||'Card'));});});
    return r;
  }
  function tasks(from,to){
    var T=ls('brain2Tasks1');if(!Array.isArray(T)||!T.length)return null;
    return {done:T.filter(function(t){return t&&t.done&&t.doneOn&&t.doneOn>=from&&t.doneOn<=to;}).length};
  }
  function range(from,to){return {lang:lang(from,to),fit:fit(from,to),lib:lib(from,to),bills:bills(from,to),tasks:tasks(from,to)};}

  var CSS='.nm-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}'+
    '.nm{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;width:100%;text-align:left;background:var(--warm);border:1px solid transparent;border-radius:14px;padding:14px 16px;font:inherit;color:inherit;cursor:default;}'+
    'button.nm{cursor:pointer;transition:border-color .15s;}button.nm:hover{border-color:var(--accent-line);}'+
    '.nm b{display:block;font-family:var(--b2-serif);font-size:26px;font-weight:600;letter-spacing:-.4px;line-height:1.1;}'+
    '.nm.zero b{color:var(--muted);}'+
    '.nm span{display:block;font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin-top:5px;}'+
    '.nm small{display:block;font-size:12px;color:var(--muted);font-weight:550;margin-top:6px;line-height:1.4;}'+
    '.nm small.bad{color:var(--over);font-weight:650;}'+
    '.nm-none{color:var(--muted);font-size:13px;line-height:1.55;}'+
    '.nm-tip{font-size:11.5px;color:var(--muted);margin-top:10px;}'+
    '@media print{.nm-tip{display:none;}.nm{border-color:var(--line);}}';
  function css(){if(document.getElementById('b2-nm-css'))return;var st=document.createElement('style');st.id='b2-nm-css';st.textContent=CSS;document.head.appendChild(st);}

  /* tiles: {big, label, small, bad, win} — win is the sentence a click offers as a "win" */
  function tiles(s){
    var t=[];
    if(s.lang){var l=s.lang,bits=[];if(l.cards)bits.push(plural(l.cards,'card'));if(l.pages)bits.push(plural(l.pages,'page'));if(l.days)bits.push(l.complete+' of '+l.days+' days complete');
      t.push({big:hm(l.mins),zero:!l.mins,label:'Language study',small:bits.join(' · '),win:l.mins?'Studied languages for '+hm(l.mins)+(l.cards?' and did '+plural(l.cards,'flashcard'):''):''});}
    if(s.fit)t.push({big:String(s.fit.days),zero:!s.fit.days,label:s.fit.days===1?'Active day':'Active days',small:s.fit.mins?hm(s.fit.mins)+' of activity logged':'',win:s.fit.days?'Moved on '+plural(s.fit.days,'day'):''});
    if(s.lib){var n=s.lib.items.length,names=s.lib.items.map(function(x){return x.title;});
      t.push({big:String(n),zero:!n,label:'Finished in Library',small:names.slice(0,3).join(' · ')+(n>3?' · +'+(n-3)+' more':''),win:n?'Finished '+names.slice(0,3).join(', ')+(n>3?' and '+(n-3)+' more':''):''});}
    if(s.bills&&s.bills.due)t.push({big:s.bills.paid+' / '+s.bills.due,zero:false,label:'Bills paid',small:s.bills.unpaid.length?s.bills.unpaid.slice(0,2).join(', ')+(s.bills.unpaid.length>2?' +'+(s.bills.unpaid.length-2):'')+' not marked paid':'All marked paid',bad:!!s.bills.unpaid.length,
      win:s.bills.paid===s.bills.due?'Every bill paid':''});
    if(s.tasks)t.push({big:String(s.tasks.done),zero:!s.tasks.done,label:s.tasks.done===1?'Task done':'Tasks done',small:'',win:s.tasks.done?'Ticked off '+plural(s.tasks.done,'task'):''});
    return t;
  }
  function render(el,from,to,opts){
    if(!el)return;css();opts=opts||{};
    var t=(from&&to&&from<=to)?tiles(range(from,to)):[],pick=typeof opts.onPick==='function';
    if(!t.length){el.innerHTML='<div class="nm-none">Nothing to show yet. As you use Languages, Fitness, Library, Finances and your task list, the numbers for these dates appear here.</div>';return;}
    el.innerHTML='<div class="nm-row">'+t.map(function(x,i){var can=pick&&x.win;
      return '<'+(can?'button type="button" data-nm="'+i+'" title="Add this as a win"':'div')+' class="nm'+(x.zero?' zero':'')+'"><b>'+esc(x.big)+'</b><span>'+esc(x.label)+'</span>'+(x.small?'<small'+(x.bad?' class="bad"':'')+'>'+esc(x.small)+'</small>':'')+'</'+(can?'button':'div')+'>';}).join('')+'</div>'+
      (pick&&t.some(function(x){return x.win;})?'<div class="nm-tip">Click a number to add it to your wins.</div>':'');
    if(pick)el.onclick=function(e){var b=e.target.closest('[data-nm]');if(b&&t[+b.getAttribute('data-nm')])opts.onPick(t[+b.getAttribute('data-nm')].win);};
  }
  window.B2Stats={range:range,render:render};
})();
