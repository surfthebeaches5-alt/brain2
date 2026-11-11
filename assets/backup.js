/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — backup helpers (shared by Today and Backup & Restore)
   A backup is every localStorage section in one JSON document:
     {app:'brain2', format:1, exportedAt, origin, data:{key: rawString}}
   brain2BackupMeta1 {fileAt, driveAt, driveSize}  when this browser last
   saved a backup file / saved to Google Drive (not part of a backup).
   ───────────────────────────────────────────────────────────── */
(function(){
  var META='brain2BackupMeta1';
  /* browser/site machinery, not your data */
  var SKIP={sbCollapsed:1,brain2SidebarCollapsed:1,brain2auth:1,brain2GCalCache1:1,brain2BackupMeta1:1,brain2FavCache1:1,langTimer1:1,studyTest1:1};
  function meta(){try{var m=JSON.parse(localStorage.getItem(META)||'null');return m&&typeof m==='object'?m:{};}catch(e){return {};}}
  function setMeta(m){try{localStorage.setItem(META,JSON.stringify(m));}catch(e){}}
  function keys(){var out=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(!SKIP[k])out.push(k);}return out.sort();}
  function build(pretty){
    var data={};keys().forEach(function(k){data[k]=localStorage.getItem(k);});
    return JSON.stringify({app:'brain2',format:1,exportedAt:new Date().toISOString(),origin:location.origin,data:data},null,pretty?2:0);
  }
  var busy=null;
  /* save to Google Drive now (needs a Google sign-in that includes the Drive permission) */
  function driveNow(){
    if(busy)return busy;
    var text=build(false);
    busy=window.GCal.drive.save(text).then(function(f){
      var m=meta();m.driveAt=Date.now();m.driveSize=text.length;setMeta(m);busy=null;return f;
    },function(e){busy=null;throw e;});
    return busy;
  }
  window.B2Backup={
    SKIP:SKIP,keys:keys,build:build,meta:meta,
    markFile:function(){var m=meta();m.fileAt=Date.now();setMeta(m);},
    /* most recent backup of either kind, ms (0 = never) */
    lastAt:function(){var m=meta();return Math.max(+m.fileAt||0,+m.driveAt||0);},
    driveNow:driveNow,
    /* once a day, quietly, whenever Google is signed in with the Drive permission */
    auto:function(){
      if(!window.GCal||!GCal.drive.ready()||!keys().length)return Promise.resolve(false);
      if(Date.now()-(+meta().driveAt||0)<20*3600000)return Promise.resolve(false);
      return driveNow().then(function(){return true;});
    }
  };
})();
