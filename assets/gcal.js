/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — Google Calendar sync (browser only, no server)
   Uses Google Identity Services to get a short-lived access token,
   then calls the Calendar API directly. Nothing is stored on any
   server; your events only load after you sign in.

   Storage:
     brain2GCal1       {clientId, calendars:[ids], defaultCal, lastCal, calList:[{id,summary,backgroundColor,primary}], email}
     brain2GCalCache1  {from, to, at, events:[normalized]}  (last fetch, so the
                        page shows your week instantly; refreshed on demand)
     sessionStorage brain2GCalTok {token, exp, scope}  (≈1 hour, this tab only)

   Google Drive backup (optional, cfg.drive): the same sign-in also asks for
   "drive.file" — access only to files this site creates — and keeps one file,
   "Brain 2.0 backup.json", in your Drive. cfg.driveFileId remembers it.
   Saved PDFs go in a folder this site creates, "Brain 2.0 PDFs", with one
   sub-folder per page (cfg.pdfFolders remembers their ids). You can move or
   rename that folder in Drive; it is found by id, not by where it sits.

   Google tokens last about an hour and can only be renewed from a click
   (browsers block the sign-in popup otherwise), so after that the page
   shows the cached events and a "Refresh" button.
   ───────────────────────────────────────────────────────────── */
(function(){
  var CFG_KEY='brain2GCal1', CACHE_KEY='brain2GCalCache1', TOK_KEY='brain2GCalTok';
  var SCOPES='https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly';
  var DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file', DRIVE='https://www.googleapis.com/drive/v3', DRIVE_UP='https://www.googleapis.com/upload/drive/v3';
  var DRIVE_NAME='Brain 2.0 backup.json';
  var API='https://www.googleapis.com/calendar/v3';

  function lsGet(k,fb){try{var r=localStorage.getItem(k);return r?JSON.parse(r):fb;}catch(e){return fb;}}
  function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

  // the Google Cloud "Brain 2.0 website" client — not a secret: Google only accepts it from the site's own address
  var DEFAULT_CLIENT_ID='659511814841-r8ml0h6l60661u3kv6bhlts5mplmq23f.apps.googleusercontent.com';
  var cfg=lsGet(CFG_KEY,{}), tokenClient=null, gisReady=null, pending=null;
  if(cfg.clientId===undefined)cfg.clientId=DEFAULT_CLIENT_ID;   // '' means the user disconnected on purpose

  function tok(){try{var t=JSON.parse(sessionStorage.getItem(TOK_KEY)||'null');return t&&t.exp>Date.now()+60000?t.token:null;}catch(e){return null;}}
  function setTok(t,secs,scope){try{sessionStorage.setItem(TOK_KEY,JSON.stringify({token:t,exp:Date.now()+(secs||3500)*1000,scope:scope||''}));}catch(e){}}
  /* the current sign-in includes permission for the Drive backup file */
  function tokDrive(){try{var t=JSON.parse(sessionStorage.getItem(TOK_KEY)||'null');return !!(t&&t.exp>Date.now()+60000&&String(t.scope||'').indexOf(DRIVE_SCOPE)>=0);}catch(e){return false;}}
  function scopes(){return SCOPES+(cfg.drive?' '+DRIVE_SCOPE:'');}
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
      client_id:cfg.clientId, scope:scopes(),
      callback:function(r){
        var p=pending;pending=null;
        if(r&&r.access_token){setTok(r.access_token,r.expires_in,r.scope);if(p)p.res(r.access_token);}
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
      /* ask again (consent) the first time, and the first time after the Drive backup is switched on */
      tokenClient.requestAccessToken({prompt:cfg.everConnected&&(!cfg.drive||cfg.driveGranted)?'':'consent'});
    }).then(function(t){
      cfg.everConnected=true;if(cfg.drive&&tokDrive())cfg.driveGranted=true;lsSet(CFG_KEY,cfg);
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
    /* the first web link on the event (a video call or classroom): its location, else its description */
    var join=/https?:\/\/[^\s<>"']+/.exec((ev.location||'')+' '+(ev.hangoutLink||'')+' '+(ev.description||''));
    return {id:ev.id,calId:cal.id,source:'google',ro:cal.write===false,join:join?join[0]:'',title:ev.summary||'(no title)',date:dk(s),endDate:dk(allDay?new Date(e.getTime()-86400000):e),
      time:allDay?'':hm(s),endTime:allDay?'':hm(e),allDay:allDay,startAt:allDay?'':s.toISOString(),endAt:allDay?'':e.toISOString(),location:ev.location||'',link:ev.htmlLink||'',recurring:!!ev.recurringEventId,
      color:cal.backgroundColor||'#8e71d3',calName:cal.summary||''};
  }

  /* timed events keep their exact instant (startAt/endAt), so saved events show in the
     time zone you're in now, not the one you were in when they were fetched */
  function localize(ev){
    if(!ev||ev.allDay||!ev.startAt)return ev;
    var s=new Date(ev.startAt),e=new Date(ev.endAt||ev.startAt);if(isNaN(s)||isNaN(e))return ev;
    return Object.assign({},ev,{date:dk(s),endDate:dk(e),time:hm(s),endTime:hm(e)});
  }
  function calendars(){
    /* every calendar you can see; write:false marks the ones shared with you as view-only */
    return api('/users/me/calendarList?minAccessRole=reader&maxResults=250').then(function(j){
      var list=(j.items||[]).map(function(c){return {id:c.id,summary:c.summaryOverride||c.summary,backgroundColor:c.backgroundColor,primary:!!c.primary,selected:c.selected!==false,write:c.accessRole==='owner'||c.accessRole==='writer'};});
      /* remember the writable calendars so pickers work before the next sign-in */
      cfg.calList=list.filter(function(c){return c.write;}).map(function(c){return {id:c.id,summary:c.summary,backgroundColor:c.backgroundColor,primary:c.primary};});lsSet(CFG_KEY,cfg);
      return list;
    });
  }
  /* events between two Date objects across the chosen calendars; result is cached */
  function events(from,to){
    return calendars().then(function(cals){
      /* unless you've chosen in settings: your own calendars that are ticked in Google (view-only ones are opt-in) */
      var want=cfg.calendars&&cfg.calendars.length?cfg.calendars:cals.filter(function(c){return c.write&&(c.primary||c.selected);}).map(function(c){return c.id;});
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
  /* start/end for {date:'YYYY-MM-DD', time:'HH:MM'|'', endTime?, endDate?} — no time means all day */
  function when(e){
    var p=e.date.split('-');
    if(e.time){
      var t=e.time.split(':'),s=new Date(+p[0],+p[1]-1,+p[2],+t[0],+t[1]);
      var end=e.endTime?(function(){var q=e.endTime.split(':');return new Date(+p[0],+p[1]-1,+p[2],+q[0],+q[1]);})():new Date(s.getTime()+3600000);
      if(end<=s)end=new Date(s.getTime()+3600000);
      var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {start:{dateTime:s.toISOString(),timeZone:tz},end:{dateTime:end.toISOString(),timeZone:tz}};
    }
    var last=new Date((e.endDate&&e.endDate>e.date?e.endDate:e.date)+'T00:00:00');last.setDate(last.getDate()+1);
    return {start:{date:e.date},end:{date:dk(last)}};
  }
  /* create: {title, date:'YYYY-MM-DD', time:'HH:MM'|'' , endTime?, location?} */
  function create(e,calId){
    var w=when(e),body={summary:e.title,location:e.location||undefined,start:w.start,end:w.end};
    return api('/calendars/'+encodeURIComponent(calId||cfg.defaultCal||'primary')+'/events',{method:'POST',body:body});
  }
  /* edit an event: title, date/times and, if toCalId differs, move it to that calendar first.
     Reads the event and writes it back whole so switching all-day ⇄ timed works cleanly. */
  function update(calId,id,e,toCalId){
    var target=toCalId&&toCalId!==calId?toCalId:calId;
    var moved=target!==calId
      ?api('/calendars/'+encodeURIComponent(calId)+'/events/'+encodeURIComponent(id)+'/move?destination='+encodeURIComponent(target),{method:'POST'})
      :Promise.resolve();
    var path='/calendars/'+encodeURIComponent(target)+'/events/'+encodeURIComponent(id);
    return moved.then(function(){return api(path);}).then(function(ev){
      var w=when(e);ev.summary=e.title;ev.start=w.start;ev.end=w.end;
      if(e.location!==undefined)ev.location=e.location||undefined;
      return api(path,{method:'PUT',body:ev});
    });
  }
  function remove(calId,id){
    return api('/calendars/'+encodeURIComponent(calId)+'/events/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){
      var c=lsGet(CACHE_KEY,null);
      if(c&&c.events){c.events=c.events.filter(function(e){return !(e.id===id&&e.calId===calId);});lsSet(CACHE_KEY,c);}
      return r;
    });
  }

  /* ── Google Drive backup file ── */
  function driveErr(r,j){
    var e=j&&j.error||{},msg=e.message||('Google Drive error '+r.status),why=JSON.stringify(e.errors||e.details||'');
    if(r.status===401){clearTok();return Object.assign(new Error('Needs a quick refresh from Google.'),{code:'auth'});}
    if(r.status===403&&/accessNotConfigured|SERVICE_DISABLED|has not been used in project|is disabled/i.test(msg+why))
      return Object.assign(new Error('Google Drive isn’t switched on for your Google project yet.'),{code:'drive-off'});
    if(r.status===403&&/insufficient/i.test(msg+why)){cfg.driveGranted=false;lsSet(CFG_KEY,cfg);clearTok();return Object.assign(new Error('Google needs you to allow the Drive backup. Sign in again.'),{code:'auth'});}
    return Object.assign(new Error(msg),{status:r.status});
  }
  function dfetch(url,opts){
    var t=tok();
    if(!t||!tokDrive())return Promise.reject(Object.assign(new Error('Needs a quick refresh from Google.'),{code:'auth'}));
    opts=opts||{};
    return fetch(url,{method:opts.method||'GET',headers:Object.assign({'Authorization':'Bearer '+t},opts.headers||{}),body:opts.body})
      .then(function(r){
        if(r.ok)return opts.text?r.text():(r.status===204?null:r.json());
        return r.json().catch(function(){return null;}).then(function(j){throw driveErr(r,j);});
      });
  }
  /* the backup file's {id, modifiedTime, size}, or null if there isn't one yet */
  function driveFind(){
    var q="name='"+DRIVE_NAME+"' and trashed=false";
    return dfetch(DRIVE+'/files?spaces=drive&orderBy=modifiedTime desc&pageSize=1&fields='+encodeURIComponent('files(id,modifiedTime,size)')+'&q='+encodeURIComponent(q))
      .then(function(j){var f=j&&j.files&&j.files[0]||null;if(f&&cfg.driveFileId!==f.id){cfg.driveFileId=f.id;lsSet(CFG_KEY,cfg);}return f;});
  }
  /* save text as the backup file (replaces its contents; Drive keeps earlier versions for a while) */
  function driveSave(text){
    function create(){
      var b='b2'+Date.now().toString(36)+Math.random().toString(36).slice(2);
      var body='--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:DRIVE_NAME,mimeType:'application/json'})+
        '\r\n--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+text+'\r\n--'+b+'--';
      return dfetch(DRIVE_UP+'/files?uploadType=multipart&fields=id,modifiedTime,size',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body:body});
    }
    function put(id){
      return dfetch(DRIVE_UP+'/files/'+encodeURIComponent(id)+'?uploadType=media&fields=id,modifiedTime,size',{method:'PATCH',headers:{'Content-Type':'application/json; charset=UTF-8'},body:text});
    }
    var go=cfg.driveFileId?put(cfg.driveFileId).catch(function(e){if(e.status===404){cfg.driveFileId='';return driveFind().then(function(f){return f?put(f.id):create();});}throw e;})
      :driveFind().then(function(f){return f?put(f.id):create();});
    return go.then(function(f){if(f&&f.id&&cfg.driveFileId!==f.id){cfg.driveFileId=f.id;lsSet(CFG_KEY,cfg);}return f;});
  }
  /* → {text, modifiedTime} of the backup file, or null */
  function driveLoad(){
    return driveFind().then(function(f){if(!f)return null;
      return dfetch(DRIVE+'/files/'+encodeURIComponent(f.id)+'?alt=media',{text:true}).then(function(t){return {text:t,modifiedTime:f.modifiedTime};});});
  }

  /* ── PDFs: "Brain 2.0 PDFs" › <sub-folder> › <name>.pdf ── */
  var FOLDER_MIME='application/vnd.google-apps.folder',PDF_ROOT='Brain 2.0 PDFs';
  function q1(q){return dfetch(DRIVE+'/files?spaces=drive&pageSize=1&fields='+encodeURIComponent('files(id,name)')+'&q='+encodeURIComponent(q)).then(function(j){return j&&j.files&&j.files[0]||null;});}
  function lit(s){return "'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";}
  /* the folder's id: remembered → still there? → else found by name → else created */
  function folder(key,name,parent){
    var map=cfg.pdfFolders||(cfg.pdfFolders={}),known=map[key];
    function keep(id){map[key]=id;lsSet(CFG_KEY,cfg);return id;}
    function find(){
      return q1('name='+lit(name)+" and mimeType='"+FOLDER_MIME+"' and trashed=false"+(parent?' and '+lit(parent)+' in parents':'')).then(function(f){
        if(f)return keep(f.id);
        return dfetch(DRIVE+'/files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({name:name,mimeType:FOLDER_MIME},parent?{parents:[parent]}:{}))}).then(function(n){return keep(n.id);});
      });
    }
    if(!known)return find();
    return dfetch(DRIVE+'/files/'+encodeURIComponent(known)+'?fields=id,trashed').then(function(f){return f&&!f.trashed?known:find();},function(e){if(e.status===404)return find();throw e;});
  }
  /* save (or replace, when a PDF with that name is already there) and return {id, webViewLink} */
  function drivePdf(blob,name,sub){
    var file=String(name||'Brain 2.0').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim()+'.pdf';
    return folder('root',PDF_ROOT,'').then(function(root){return sub?folder('sub:'+sub,sub,root):root;}).then(function(dir){
      return q1('name='+lit(file)+' and '+lit(dir)+" in parents and trashed=false").then(function(old){
        if(old)return dfetch(DRIVE_UP+'/files/'+encodeURIComponent(old.id)+'?uploadType=media&fields=id,webViewLink',{method:'PATCH',headers:{'Content-Type':'application/pdf'},body:blob});
        var b='b2'+Date.now().toString(36)+Math.random().toString(36).slice(2);
        var body=new Blob(['--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:file,mimeType:'application/pdf',parents:[dir]})+'\r\n--'+b+'\r\nContent-Type: application/pdf\r\n\r\n',blob,'\r\n--'+b+'--']);
        return dfetch(DRIVE_UP+'/files?uploadType=multipart&fields=id,webViewLink',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body:body});
      });
    });
  }

  /* ── Notes as Google Docs: "Brain 2.0 Notes" › <group> › <folder> › <name> ──
     A note written on the Personal Curriculum or Courses page is kept as a Google Doc too.
     o = {id (once it has one), name, html, group, folderKey, folderName}. Returns {id, webViewLink}.
     The Doc is a copy of the note: saving the note again replaces the Doc's contents. */
  var DOC_MIME='application/vnd.google-apps.document',NOTES_ROOT='Brain 2.0 Notes';
  function driveDoc(o){
    var name=String(o.name||'').replace(/\s+/g,' ').trim()||'Untitled',b='b2'+Date.now().toString(36)+Math.random().toString(36).slice(2);
    function body(meta){return '--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+b+'\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n'+o.html+'\r\n--'+b+'--';}
    var head={'Content-Type':'multipart/related; boundary='+b};
    function create(){
      return folder('notes',NOTES_ROOT,'').then(function(root){return folder('notes:'+o.group,o.group,root);})
        .then(function(g){return folder('notes:'+o.group+':'+o.folderKey,String(o.folderName||'Untitled').replace(/\s+/g,' ').trim()||'Untitled',g);})
        .then(function(dir){return dfetch(DRIVE_UP+'/files?uploadType=multipart&fields=id,webViewLink',{method:'POST',headers:head,body:body({name:name,mimeType:DOC_MIME,parents:[dir]})});});
    }
    if(!o.id)return create();
    return dfetch(DRIVE_UP+'/files/'+encodeURIComponent(o.id)+'?uploadType=multipart&fields=id,webViewLink,trashed',{method:'PATCH',headers:head,body:body({name:name})})
      .then(function(f){return f&&f.trashed?create():f;},function(e){if(e.status===404)return create();throw e;});
  }
  /* move a file this site made to the Drive trash (it can be restored from there for 30 days) */
  function driveTrash(id){
    return dfetch(DRIVE+'/files/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed:true})}).catch(function(e){if(e.status===404)return null;throw e;});
  }

  window.GCal={
    configured:function(){return !!cfg.clientId;},
    connected:function(){return !!tok();},
    everConnected:function(){return !!cfg.everConnected;},
    config:function(){return Object.assign({},cfg);},
    setConfig:function(c){cfg=Object.assign({},cfg,c);lsSet(CFG_KEY,cfg);tokenClient=null;if(cfg.clientId)loadGIS().then(initClient).catch(function(){});},
    disconnect:function(){var t=tok();clearTok();if(t&&window.google&&google.accounts&&google.accounts.oauth2)google.accounts.oauth2.revoke(t,function(){});cfg.everConnected=false;lsSet(CFG_KEY,cfg);},
    cached:function(){var c=lsGet(CACHE_KEY,null);if(c&&Array.isArray(c.events))c.events=c.events.map(localize);return c;},
    localize:localize,
    /* Drive backup: on = switched on in settings; ready = this sign-in can use it right now */
    drive:{on:function(){return !!cfg.drive;},ready:function(){return !!cfg.drive&&!!tok()&&tokDrive();},
      setOn:function(v){cfg.drive=!!v;if(!v){cfg.driveGranted=false;}lsSet(CFG_KEY,cfg);tokenClient=null;if(cfg.clientId)loadGIS().then(initClient).catch(function(){});},
      save:driveSave,load:driveLoad,find:driveFind,fileName:DRIVE_NAME,savePdf:drivePdf,saveDoc:driveDoc,trash:driveTrash},
    /* writable calendars from the last fetch: [{id,summary,backgroundColor,primary}] */
    calList:function(){return (cfg.calList||[]).slice();},
    signIn:signIn, calendars:calendars, events:events, create:create, update:update, remove:remove,
    origin:location.origin
  };
  if(cfg.clientId)loadGIS().then(initClient).catch(function(){});
})();
