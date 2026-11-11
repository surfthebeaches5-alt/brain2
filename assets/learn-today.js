/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — what the Today page shows from Personal Curriculum and Courses.

   Reads what those pages save ("study1", see assets/study.js) and answers two questions:
     B2Learn.today() → { rows:[…], test:{…}|null }
        rows   at most two to-dos: one from Personal Curriculum and one from Courses. On each side it
               is the next to-do of the study or course that is furthest behind in its current unit.
        test   a course with a test date: weeks to go, days since the last practice test, whether one
               is due (none for two weeks) and whether one was taken today.
     B2Learn.tick(row) → marks that to-do done, exactly as ticking it on its own page would.

   The date arithmetic (a unit runs for its weeks or until its due date, one after another from the
   start date) is the same as in assets/study.js and has to stay the same.
   ───────────────────────────────────────────────────────────── */
(function(){
  var KEY='study1';
  function load(){try{var d=JSON.parse(localStorage.getItem(KEY));return d&&d.v===1?d:null;}catch(e){return null;}}
  function pd(v){var q=String(v||'').split('-'),d=new Date(+q[0],+q[1]-1,+q[2]);if(isNaN(d))d=new Date();d.setHours(0,0,0,0);return d;}
  function addDays(d,n){var z=new Date(d);z.setDate(z.getDate()+n);return z;}
  function span(x){var st=pd(x.start),out=[],prev=null;
    (x.units||[]).forEach(function(u){var from=prev?addDays(prev,1):st,to;
      if(u.due){to=pd(u.due);if(from>to)from=to;}else to=addDays(from,Math.max(1,u.w||1)*7-1);
      out.push({from:from,to:to});prev=to;});
    var end=prev||addDays(st,6);if(x.pdue&&pd(x.pdue)>end)end=pd(x.pdue);if(x.end&&x.start&&pd(x.end)>=st)end=pd(x.end);
    return {dated:!!x.start,units:out,from:st,to:end};}
  function nowUnit(x,sp,t){if(!sp.dated)return -1;for(var i=0;i<sp.units.length;i++)if(t>=sp.units[i].from&&t<=sp.units[i].to)return i;return -1;}
  function nextOf(x){for(var u=0;u<(x.units||[]).length;u++)for(var i=0;i<(x.units[u].items||[]).length;i++)if(!x.units[u].items[i].done)return {u:u,i:i};return null;}
  function running(x,sp,t){
    if(x.status==='Finished'||x.status==='Queued'||x.status==='On hold')return false;
    if(sp.dated)return t>=sp.from&&t<=sp.to;
    return !!nextOf(x);                                   /* no dates yet, but there is something left to do */
  }
  function today(){
    var d=load(),t=pd(''),out={rows:[],test:null};if(!d)return out;
    [['pc',d.pc],['co',d.co]].forEach(function(side){var best=null;
      (side[1]||[]).forEach(function(x){if(!x||!Array.isArray(x.units))return;var sp=span(x);if(!running(x,sp,t))return;
        var u=nowUnit(x,sp,t);if(u<0){var k=nextOf(x);if(!k)return;u=k.u;}
        var its=x.units[u].items||[],i=-1;its.forEach(function(q,n){if(!q.done&&i<0)i=n;});
        if(i<0){var k2=nextOf(x);if(!k2)return;u=k2.u;i=k2.i;its=x.units[u].items;}
        var c={pg:side[0],id:x.id,title:x.title||'',unit:x.units[u].name||'',u:u,i:i,text:its[i].t||'',kind:its[i].k||'',url:its[i].url||'',
               ratio:its.filter(function(q){return q.done;}).length/its.length,end:sp.dated?+sp.units[u].to:Infinity};
        if(!best||c.ratio<best.ratio||(c.ratio===best.ratio&&c.end<best.end))best=c;});
      if(best)out.rows.push(best);});
    (d.co||[]).some(function(x){
      if(!x||!x.testDate||x.status==='Finished')return false;var td=pd(x.testDate);if(td<t)return false;
      var last=0;(x.scores||[]).forEach(function(z){if(z&&z.at>last)last=z.at;});
      var ago=last?Math.floor((Date.now()-last)/86400000):null;
      out.test={id:x.id,title:x.title||'',weeks:Math.max(0,Math.ceil((td-t)/604800000)),ago:ago,due:ago==null||ago>=14,doneToday:ago===0};
      return true;});
    return out;
  }
  function tick(row){
    var d=load();if(!d||!row)return false;
    var x=(row.pg==='pc'?d.pc:d.co||[]).filter(function(z){return z&&z.id===row.id;})[0];
    var it=x&&x.units&&x.units[row.u]&&x.units[row.u].items&&x.units[row.u].items[row.i];
    if(!it||it.t!==row.text)return false;                 /* it changed since the page was drawn: leave it */
    it.done=true;
    try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){return false;}
    return true;
  }
  window.B2Learn={today:today,tick:tick};
})();
