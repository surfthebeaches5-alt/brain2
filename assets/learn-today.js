/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — what the Today page shows from Personal Curriculum and Courses.

   Reads what those pages save ("study1", see assets/study.js) and answers:
     B2Learn.today() → { rows:[…], test:{…}|null, reg:{…}|null }
        rows   at most two to-dos: one from Personal Curriculum and one from Courses. On each side it is
               the to-do whose day is today or has passed (the longest-missed first; row.missed says so).
               When nothing is planned for today, it is the next to-do with no day yet of the study or
               course that is furthest behind in its current unit. A to-do planned for a later day waits.
        reg    a course whose registration is open, or opens within two weeks, and is not marked done.
        test   a course with a test date: weeks to go, days since the last practice test, whether one
               is due (none for two weeks) and whether one was taken today.
     B2Learn.events(from,to) → what goes on the calendar between two dates ("YYYY-MM-DD", both included):
               every to-do on its day, done or not, each test day, and for Personal Curriculum each
               unit's first day and the final project's due date.
     B2Learn.tick(row) → marks that to-do done, exactly as ticking it on its own page would.
     B2Learn.change(row,{done:…}|{due:…}) → marks a to-do done or not, or moves it to another day.
     B2Learn.registered(id) → marks that course as registered for.

   A to-do's day is "due" on the item. The date arithmetic (a unit runs for its weeks or until its due
   date, one after another from the start date) is the same as in assets/study.js and has to stay the same.
   ───────────────────────────────────────────────────────────── */
(function(){
  var KEY='study1';
  function load(){try{var d=JSON.parse(localStorage.getItem(KEY));return d&&d.v===1?d:null;}catch(e){return null;}}
  function pd(v){var q=String(v||'').split('-'),d=new Date(+q[0],+q[1]-1,+q[2]);if(isNaN(d))d=new Date();d.setHours(0,0,0,0);return d;}
  function addDays(d,n){var z=new Date(d);z.setDate(z.getDate()+n);return z;}
  function iso(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
  function okDay(v){return /^\d{4}-\d\d-\d\d$/.test(v||'');}
  function span(x){var st=pd(x.start),out=[],prev=null;
    (x.units||[]).forEach(function(u){var from=prev?addDays(prev,1):st,to;
      if(u.due){to=pd(u.due);if(from>to)from=to;}else to=addDays(from,Math.max(1,u.w||1)*7-1);
      out.push({from:from,to:to});prev=to;});
    var end=prev||addDays(st,6);if(x.pdue&&pd(x.pdue)>end)end=pd(x.pdue);if(x.end&&x.start&&pd(x.end)>=st)end=pd(x.end);
    return {dated:!!x.start,units:out,from:st,to:end};}
  function nowUnit(x,sp,t){if(!sp.dated)return -1;for(var i=0;i<sp.units.length;i++)if(t>=sp.units[i].from&&t<=sp.units[i].to)return i;return -1;}
  /* the next to-do that is not done and is not waiting for a later day */
  function free(it,tk){return it&&!it.done&&!(okDay(it.due)&&it.due>tk);}
  function nextOf(x,tk){for(var u=0;u<(x.units||[]).length;u++)for(var i=0;i<(x.units[u].items||[]).length;i++)if(free(x.units[u].items[i],tk))return {u:u,i:i};return null;}
  function running(x,sp,t,tk){
    if(x.status==='Finished'||x.status==='Queued'||x.status==='On hold')return false;
    if(sp.dated)return t>=sp.from&&t<=sp.to;
    return !!nextOf(x,tk);                                /* no dates yet, but there is something left to do */
  }
  function rowOf(pg,x,u,i,tk){var it=x.units[u].items[i],due=okDay(it.due)?it.due:'';
    return {pg:pg,id:x.id,title:x.title||'',unit:x.units[u].name||'',u:u,i:i,text:it.t||'',kind:it.k||'',url:it.url||'',due:due,missed:!!due&&due<tk};}
  function today(){
    var d=load(),t=pd(''),tk=iso(t),out={rows:[],test:null,reg:null};if(!d)return out;
    [['pc',d.pc],['co',d.co]].forEach(function(side){var best=null,planned=null;
      (side[1]||[]).forEach(function(x){if(!x||!Array.isArray(x.units)||x.status==='Finished')return;
        /* anything whose day is today or has passed comes first, the oldest first */
        x.units.forEach(function(un,u){(un.items||[]).forEach(function(it,i){if(it&&!it.done&&okDay(it.due)&&it.due<=tk&&(!planned||it.due<planned.due))planned={x:x,u:u,i:i,due:it.due};});});
        var sp=span(x);if(!running(x,sp,t,tk))return;
        var u=nowUnit(x,sp,t);if(u<0){var k=nextOf(x,tk);if(!k)return;u=k.u;}
        var its=x.units[u].items||[],i=-1;its.forEach(function(q,n){if(free(q,tk)&&i<0)i=n;});
        if(i<0){var k2=nextOf(x,tk);if(!k2)return;u=k2.u;i=k2.i;its=x.units[u].items;}
        var c={x:x,u:u,i:i,ratio:its.filter(function(q){return q.done;}).length/its.length,end:sp.dated?+sp.units[u].to:Infinity};
        if(!best||c.ratio<best.ratio||(c.ratio===best.ratio&&c.end<best.end))best=c;});
      var pick=planned||best;if(pick)out.rows.push(rowOf(side[0],pick.x,pick.u,pick.i,tk));});
    (d.co||[]).some(function(x){
      if(!x||!x.testDate||x.status==='Finished')return false;var td=pd(x.testDate);if(td<t)return false;
      var last=0;(x.scores||[]).forEach(function(z){if(z&&z.at>last)last=z.at;});
      var ago=last?Math.floor((Date.now()-last)/86400000):null;
      out.test={id:x.id,title:x.title||'',weeks:Math.max(0,Math.ceil((td-t)/604800000)),ago:ago,due:ago==null||ago>=14,doneToday:ago===0};
      return true;});
    (d.co||[]).some(function(x){
      if(!x||x.regDone||x.status==='Finished'||(!x.regOpen&&!x.regClose))return false;
      var o=x.regOpen?pd(x.regOpen):null,c=x.regClose?pd(x.regClose):null;
      if(c&&t>c)return false;
      if(o&&t<o){var days=Math.round((o-t)/86400000);if(days>14)return false;out.reg={id:x.id,title:x.title||'',open:false,days:days,date:x.regOpen,url:x.regUrl||''};return true;}
      out.reg={id:x.id,title:x.title||'',open:true,left:c?Math.round((c-t)/86400000):null,date:x.regClose||'',url:x.regUrl||''};return true;});
    return out;
  }
  function events(from,to){
    var d=load(),out=[],tk=iso(pd(''));if(!d)return out;
    function inR(k){return okDay(k)&&k>=from&&k<=to;}
    [['pc',d.pc],['co',d.co]].forEach(function(side){(side[1]||[]).forEach(function(x){
      if(!x||!Array.isArray(x.units))return;var pg=side[0],title=x.title||'';
      x.units.forEach(function(un,u){(un.items||[]).forEach(function(it,i){if(!it||!inR(it.due))return;
        var r=rowOf(pg,x,u,i,tk);out.push({kind:'todo',pg:pg,id:x.id,date:it.due,title:r.text,course:title,done:!!it.done,row:r});});});
      if(x.status==='Finished')return;
      if(inR(x.testDate))out.push({kind:'test',pg:pg,id:x.id,date:x.testDate,title:'Test day · '+title,course:title});
      if(pg==='pc'&&x.start&&x.units.length){var sp=span(x);
        sp.units.forEach(function(r,u){var k=iso(r.from);if(inR(k))out.push({kind:'unit',pg:pg,id:x.id,date:k,title:'Unit '+(u+1)+' begins · '+title,course:title});});
        var e=iso(sp.to);if(inR(e))out.push({kind:'project',pg:pg,id:x.id,date:e,title:'Final project due · '+title,course:title});}
    });});
    return out;
  }
  function registered(id){var d=load();if(!d)return false;var x=(d.co||[]).filter(function(z){return z&&z.id===id;})[0];if(!x)return false;
    x.regDone=true;try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){return false;}return true;}
  function change(row,patch){
    var d=load();if(!d||!row||!patch)return false;
    var x=(row.pg==='pc'?d.pc:d.co||[]).filter(function(z){return z&&z.id===row.id;})[0];
    var it=x&&x.units&&x.units[row.u]&&x.units[row.u].items&&x.units[row.u].items[row.i];
    if(!it||it.t!==row.text)return false;                 /* it changed since the page was drawn: leave it */
    if('done' in patch)it.done=!!patch.done;
    if('due' in patch){if(okDay(patch.due))it.due=patch.due;else delete it.due;}
    try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){return false;}
    return true;
  }
  function tick(row){return change(row,{done:true});}
  window.B2Learn={today:today,events:events,tick:tick,change:change,registered:registered};
})();
