/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — Google Calendar sync (browser only, no server)
   Uses Google Identity Services to get a short-lived access token,
   then calls the Calendar API directly. Nothing is stored on any
   server; your events only load after you sign in.

   Storage:
     brain2GCal1       {clientId, calendars:[ids], defaultCal, email}
     brain2GCalCache1  {from, to, at, events:[normalized]}  (last fetch, so the
                        page shows your week instantly; refreshed on demand)
     sessionStorage brain2GCalTok {token, exp}  (≈1 hour, this tab only)

   Google tokens last about an hour and can only be renewed from a click
   (browsers block the sign-in popup otherwise), so after that the page
   shows the cached events and a "Refresh" button.
   ───────────────────────────────────────────────────────────── */
(function(){
  var CFG_KEY='brain2GCal1', CACHE_KEY='brain2GCalCache1', TOK_KEY='brain2GCalTok';
  var SCOPES='https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly';
  var API='https://www.googleapis.com/calendar/v3';

  function lsGet(k,fb){try{var r=localStorage.getItem(k);return r?JSON.parse(r):fb;}catch(e){return fb;}}
  function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

  var cfg=lsGet(CFG_KEY,{}), tokenClient=null, gisReady=null, pending=null;

  function tok(){try{var t=JSON.parse(sessionStorage.getItem(TOK_KEY)||'null');return t&&t.exp>Date.now()+60000?t.token:null;}catch(e){return null;}}
  function setTok(t,secs){try{sessionStorage.setItem(TOK_KEY,JSON.stringify({token:t,exp:Date.now()+(secs||3500)*1000}));}catch(e){}}
  function clearTok(){try{sessionStorage.removeItem(TOK_KEY);}catch(e){}}

  function loadGIS(){
    if(gisReady)return gisReady;
    gisReady=new Promise(function(res,rej){
      if(window.google&&google.accounts&&google.accounts.oauth2)return res();
      var s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';s.async=true;
      s.onload=function(){res();};s.onerror=function(){gisReady=null;rej(new Error('Could not load Google sign-in.'));};
      document.head.appendChild(s);
    });
    return gisReady;
  }
  function initClient(){
    if(tokenClient||!cfg.clientId||!(window.google&&google.accounts&&google.accounts.oauth2))return tokenClient;
    tokenClient=google.accounts.oauth2.initTokenClient({
      client_id:cfg.clientId, scope:SCOPES,
      callback:function(r){
        var p=pending;pending=null;
        if(r&&r.access_token){setTok(r.access_token,r.expires_in);if(p)p.res(r.access_token);}
        else if(p)p.rej(new Error((r&&r.error_description)||(r&&r.error)||'Google sign-in was cancelled.'));
      },
      error_callback:function(e){var p=pending;pending=null;if(p)p.rej(new Error(e&&e.type==='popup_closed'?'Sign-in window was closed.':'Google sign-in failed.'));}
    });
    return tokenClient;
  }
  /* Must be called from a click: opens Google's sign-in popup (or flashes and closes if already allowed). */
  function signIn(){
    if(!cfg.clientId)return Promise.reject(new Error('Add your Google client ID first.'));
    if(!initClient())return Promise.reject(new Error('Google sign-in is still loading — try again in a second.'));
    return new Promise(function(res,rej){
      pending={res:res,rej:rej};
      tokenClient.requestAccessToken({prompt:cfg.everConnected?'':'consent'});
    }).then(function(t){
      cfg.everConnected=true;lsSet(CFG_KEY,cfg);
      return t;
    });
  }
  function api(path,opts){
    var t=tok();
    if(!t)return Promise.reject(Object.assign(new Error('Needs a quick refresh from Google.'),{code:'auth'}));
    opts=opts||{};
    return fetch(API+path,{method:opts.method||'GET',headers:Object.assign({'Authorization':'Bearer '+t},opts.body?{'Content-Type':'application/json'}:{}),body:opts.body?JSON.stringify(opts.body):undefined})
      .then(function(r){
        if(r.status===401){clearTok();throw Object.assign(new Error('Needs a quick refresh from Google.'),{code:'auth'});}
        if(r.status===204)return null;
        return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||('Google Calendar error '+r.status));return j;});
      });
  }

  /* ── dates ── */
  function pad(n){return String(n).padStart(2,'0');}
  function dk(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function hm(d){return pad(d.getHours())+':'+pad(d.getMinutes());}
  function normalize(ev,cal){
    var allDay=!!(ev.start&&ev.start.date);
    var s=allDay?new Date(ev.start.date+'T00:00:00'):new Date(ev.start.dateTime);
    var e=allDay?new Date(ev.end.date+'T00:00:00'):new Date(ev.end.dateTime);
    return {id:ev.id,calId:cal.id,source:'google',title:ev.summary||'(no title)',date:dk(s),endDate:dk(allDay?new Date(e.getTime()-86400000):e),
      time:allDay?'':hm(s),endTime:allDay?'':hm(e),allDay:allDay,location:ev.location||'',link:ev.htmlLink||'',
      color:cal.backgroundColor||'#8e71d3',calName:cal.summary||''};
  }

  function calendars(){
    return api('/users/me/calendarList?minAccessRole=writer&maxResults=100').then(function(j){
      return (j.items||[]).map(function(c){return {id:c.id,summary:c.summaryOverride||c.summary,backgroundColor:c.backgroundColor,primary:!!c.primary,selected:c.selected!==false};});
    });
  }
  /* events between two Date objects across the chosen calendars; result is cached */
  function events(from,to){
    return calendars().then(function(cals){
      var want=cfg.calendars&&cfg.calendars.length?cfg.calendars:cals.filter(function(c){return c.primary||c.selected;}).map(function(c){return c.id;});
      var prim=cals.find(function(c){return c.primary;});
      if(prim&&!cfg.email){cfg.email=prim.id;lsSet(CFG_KEY,cfg);}
      var use=cals.filter(function(c){return want.indexOf(c.id)>=0;});
      return Promise.all(use.map(function(c){
        var q='?singleEvents=true&orderBy=startTime&maxResults=500&timeMin='+encodeURIComponent(from.toISOString())+'&timeMax='+encodeURIComponent(to.toISOString());
        return api('/calendars/'+encodeURIComponent(c.id)+'/events'+q).then(function(j){return (j.items||[]).filter(function(e){return e.status!=='cancelled';}).map(function(e){return normalize(e,c);});});
      })).then(function(lists){
        var all=[].concat.apply([],lists);
        lsSet(CACHE_KEY,{from:from.toISOString(),to:to.toISOString(),at:Date.now(),events:all});
        return all;
      });
    });
  }
  /* create: {title, date:'YYYY-MM-DD', time:'HH:MM'|'' , endTime?, location?} */
  function create(e,calId){
    var body={summary:e.title,location:e.location||undefined};
    if(e.time){
      var p=e.date.split('-'),t=e.time.split(':');
      var s=new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1]);
      var end=e.endTime?(function(){var q=e.endTime.split(':');return new Date(+p[0],+p[1]-1,+p[2],+q[0],+q[1]);})():new Date(s.getTime()+3600000);
      var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
      body.start={dateTime:s.toISOString(),timeZone:tz};body.end={dateTime:end.toISOString(),timeZone:tz};
    }else{
      var d=new Date(e.date+'T00:00:00');d.setDate(d.getDate()+1);
      body.start={date:e.date};body.end={date:dk(d)};
    }
    return api('/calendars/'+encodeURIComponent(calId||cfg.defaultCal||'primary')+'/events',{method:'POST',body:body});
  }
  function remove(calId,id){
    return api('/calendars/'+encodeURIComponent(calId)+'/events/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){
      var c=lsGet(CACHE_KEY,null);
      if(c&&c.events){c.events=c.events.filter(function(e){return !(e.id===id&&e.calId===calId);});lsSet(CACHE_KEY,c);}
      return r;
    });
  }

  window.GCal={
    configured:function(){return !!cfg.clientId;},
    connected:function(){return !!tok();},
    everConnected:function(){return !!cfg.everConnected;},
    config:function(){return Object.assign({},cfg);},
    setConfig:function(c){cfg=Object.assign({},cfg,c);lsSet(CFG_KEY,cfg);tokenClient=null;if(cfg.clientId)loadGIS().then(initClient).catch(function(){});},
    disconnect:function(){var t=tok();clearTok();if(t&&window.google&&google.accounts&&google.accounts.oauth2)google.accounts.oauth2.revoke(t,function(){});cfg.everConnected=false;lsSet(CFG_KEY,cfg);},
    cached:function(){return lsGet(CACHE_KEY,null);},
    signIn:signIn, calendars:calendars, events:events, create:create, remove:remove,
    origin:location.origin
  };
  if(cfg.clientId)loadGIS().then(initClient).catch(function(){});
})();
