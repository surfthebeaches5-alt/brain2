/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — language lessons (shared by Today and Languages)
   brain2Lessons1 { key: {s:'done'|'skip', date:'YYYY-MM-DD', at:'HH:MM', mins, lang, title,
                          ch?, ticked?[], logId?, t} }
     key = the lesson's start time (from the calendar), or "manual:<id>" for one typed in.
   A 'done' entry is the permanent record of a lesson you took: it is never removed on its own, so
   the list on Languages › Log outlives any challenge. 'skip' (didn't happen) is forgotten after
   four months. Counting a lesson adds its minutes to that day's study time for the language —
   the day log of a running challenge that covers the day, else the quick log — and undo takes
   exactly those minutes back.
   ───────────────────────────────────────────────────────────── */
(function(){
  var SK='brain2Lessons1';
  function get(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
  function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
  function pad(n){return (n<10?'0':'')+n;}
  function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function endOf(c){var p=String(c.start).split('-');return iso(new Date(+p[0],+p[1]-1,+p[2]+(+c.length||75)-1));}
  function all(){var s=get(SK);return s&&typeof s==='object'&&!Array.isArray(s)?s:{};}
  function save(a){
    Object.keys(a).forEach(function(k){var x=a[k];if(x&&x.s==='skip'&&x.t&&Date.now()-x.t>120*864e5)delete a[k];});
    return set(SK,a);
  }
  /* add (sign +1) or take back (sign −1) a lesson's minutes */
  function log(st,sign){
    var db=get('langChallenge1'),ch=null;
    if(db&&Array.isArray(db.challenges)){
      if(sign<0)ch=st.ch?db.challenges.filter(function(c){return c.id===st.ch;})[0]||null:null;
      else{var cand=db.challenges.filter(function(c){return !c.endedAt&&c.lang===st.lang&&c.start&&st.date>=c.start&&st.date<=endOf(c);});
        ch=cand.filter(function(c){return c.id===db.active;})[0]||cand[0]||null;}
    }
    if(ch){
      ch.days=ch.days||{};var d=ch.days[st.date]||(ch.days[st.date]={done:[]});if(!Array.isArray(d.done))d.done=[];
      var before=+d.minutes||0,after=Math.max(0,before+sign*st.mins);
      if(after)d.minutes=after;else delete d.minutes;
      if(sign>0){(Array.isArray(d.sessions)?d.sessions:(d.sessions=[])).push({at:st.at,min:st.mins,what:'lesson'});st.ch=ch.id;st.ticked=[];}
      else if(Array.isArray(d.sessions)){for(var i=d.sessions.length-1;i>=0;i--){var x=d.sessions[i];if(x&&x.what==='lesson'&&x.at===st.at&&+x.min===st.mins){d.sessions.splice(i,1);break;}}if(!d.sessions.length)delete d.sessions;}
      /* the "minutes logged" rule ticks itself when the lesson takes the day over the line (and unticks on undo) */
      (ch.tasks||[]).forEach(function(t){var a=t.auto,j=d.done.indexOf(t.id);if(!a||a.kind!=='minutes')return;
        if(sign>0&&before<a.min&&after>=a.min&&j<0){d.done.push(t.id);st.ticked.push(t.id);}
        if(sign<0&&(st.ticked||[]).indexOf(t.id)>=0&&after<a.min&&j>=0)d.done.splice(j,1);});
      set('langChallenge1',db);return;
    }
    if(sign<0&&!st.logId)return;   /* its challenge is gone: nothing left to take back */
    var lp=get('langPortal5')||{};lp.hours=lp.hours&&typeof lp.hours==='object'?lp.hours:{};lp.log=Array.isArray(lp.log)?lp.log:[];
    if(sign>0){st.logId='l_'+Date.now()+Math.floor(Math.random()*1000);
      lp.log.unshift({id:st.logId,lang:st.lang,skill:'lesson',skillLabel:'Lesson',resource:'--',note:st.title||'',mins:st.mins,date:new Date(st.date+'T'+(st.at||'12:00')+':00').toISOString()});
      lp.hours[st.lang]=(+lp.hours[st.lang]||0)+st.mins/60;}
    else{var n=lp.log.length;lp.log=lp.log.filter(function(x){return x.id!==st.logId;});if(lp.log.length<n)lp.hours[st.lang]=Math.max(0,(+lp.hours[st.lang]||0)-st.mins/60);}
    set('langPortal5',lp);
  }
  window.B2Lessons={
    KEY:SK,all:all,
    /* st: {date, at, mins, lang, title} */
    count:function(key,st){var a=all();if(a[key])return a[key];st.s='done';st.t=Date.now();st.mins=Math.max(1,Math.round(+st.mins||0));log(st,1);a[key]=st;save(a);return st;},
    skip:function(key,date){var a=all();if(!a[key]){a[key]={s:'skip',date:date,t:Date.now()};save(a);}},
    undo:function(key){var a=all(),st=a[key];if(!st)return;if(st.s==='done')log(st,-1);delete a[key];save(a);},
    /* every lesson taken, newest first */
    list:function(){var a=all();return Object.keys(a).filter(function(k){return a[k]&&a[k].s==='done';}).map(function(k){return Object.assign({key:k},a[k]);})
      .sort(function(x,y){return (y.date+(y.at||''))<(x.date+(x.at||''))?-1:1;});}
  };
})();
