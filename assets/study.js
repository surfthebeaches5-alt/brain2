/* Brain 2.0 — Overview, Personal Curriculum and Courses (learn/).
   One script for the three pages; each page says which one it is with window.STUDY_PAGE. */
(function(){
'use strict';
var KINDS=['Read','Watch','Listen','Do','Write'];
function I(t,k,done){return {t:t,k:k,done:!!done};}
/* Turns what the current Classes page has saved (formal classes, online courses, self-study topics,
   course ideas and resources) into Courses, Personal Curriculum studies and Ideas.
   It only reads: get(key) returns the saved value for a key, or null. Nothing is written. */
function convertAll(get){
  var MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function arr(v){return Array.isArray(v)?v:[];}
  function str(v){return v==null?'':String(v).trim();}
  function dt(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(str(s));return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
  function day(s){var d=dt(s);return d?MS[d.getMonth()]+' '+d.getDate():'';}
  function iso(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
  function weeks(a,b){var x=dt(a),y=dt(b);return x&&y&&y>=x?Math.max(1,Math.round(((y-x)/86400000+1)/7)):1;}
  function host(u){try{return new URL(u).hostname.replace(/^www\./,'');}catch(e){return '';}}
  function html(t){return str(t).split('\n').map(function(l){return '<div>'+(l.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})||'<br>')+'</div>';}).join('');}
  function base(id,title){return {id:id,title:str(title)||'Untitled',sub:'',theme:'',platform:'',status:'Active',url:'',testDate:'',end:'',start:'',why:'',weeks:[0,0,0,0,0,0,0,0],goals:[],units:[],project:'',pw:0,unitNotes:{},notes:[],mats:[],sets:[],scores:[]};}
  var KIND={video:'Video',playlist:'Video',podcast:'Podcast',article:'Article',book:'Book'};
  var TODO={read:'Read',watch:'Watch',listen:'Listen','do':'Do',write:'Write'};
  var lib=arr((get('learnLibrary1')||{}).items),used={};
  function mat(x,t,url,kind,src,unit){url=str(url);if(url&&x.mats.some(function(m){return m.url===url;}))return;
    x.mats.push({t:str(t)||host(url)||'Untitled',kind:kind||'Link',src:str(src)||host(url),unit:unit==null?null:unit,url:url});}
  /* resources that were filed under this class, course or topic */
  function shelf(x,track,id){lib.forEach(function(i,n){if(arr(i.links).some(function(l){return l&&l.track===track&&l.id===id;})){used[n]=1;mat(x,i.title,i.url,KIND[i.type],i.author);}});}

  var CO=[],PC=[],IDEAS=[];
  /* formal classes: modules become units (kept on their due dates), tasks become to-dos */
  arr((get('classTracker1')||{}).classes).forEach(function(c){
    if(!c||typeof c!=='object')return;var x=base('f-'+c.id,c.name);
    x.theme='Classes';x.platform=str(c.inst);x.start=str(c.start);x.end=str(c.end);x.status=dt(c.end)&&dt(c.end)<new Date()?'Finished':'Active';
    arr(c.modules).forEach(function(m){x.units.push({name:str(m.title)||'Unit',q:str(m.objective||m.obj),w:1,due:str(m.due),
      items:arr(m.tasks).map(function(t){return {t:str(t.label||t.text),k:'Do',done:!!t.done,due:str(t.due)};})});});
    arr(c.links).forEach(function(l){mat(x,l.label,l.url,'Link');});shelf(x,'formal',c.id);
    var det=[['Code',c.code],['Institution',c.inst],['Instructor',[str(c.instr),str(c.email)].filter(Boolean).join(' · ')],['Format',c.format]].filter(function(r){return str(r[1]);}).map(function(r){return r[0]+': '+str(r[1]);}).join('\n');
    if(str(c.notes))x.notes.push({title:'Class notes',date:day(c.start),text:html(c.notes),unit:null});
    if(det)x.notes.push({title:'Class details',date:day(c.start),text:html(det),unit:null});
    CO.push(x);});
  /* online courses and certificates: each course inside becomes a unit, its modules become to-dos */
  arr(get('profDevData2')).forEach(function(p){
    if(!p||typeof p!=='object')return;var x=base('o-'+p.id,p.name);
    x.theme=str(p.category);x.platform=str(p.platform);x.status={active:'Active',queued:'Queued',hold:'On hold',done:'Finished'}[p.status]||'Active';
    x.url=str(p.url);x.end=str(p.targetDate);x.start=str(p.startDate||p.start);x.why=str(p.purpose);
    arr(p.courses).forEach(function(c,i){var mods=arr(c.modules),pct=+c.pct||0;
      x.units.push({name:str(c.name)||'Unit '+(i+1),q:'',w:1,items:mods.length?mods.map(function(m){return {t:str(m.name),k:/video|watch/i.test(str(m.name))?'Watch':'Do',done:!!m.done};})
        :[{t:'Complete this course'+(!c.done&&pct>0&&pct<100?' ('+pct+'% so far)':''),k:'Do',done:!!c.done}]});
      if(str(c.link))mat(x,c.name,c.link,'Link','',i);});
    arr(p.links).forEach(function(l){mat(x,l.label,l.url,'Link');});shelf(x,'online',p.id);
    if(str(p.notes))x.notes.push({title:'Notes',date:'',text:html(p.notes),unit:null});
    CO.push(x);});
  /* self-study: planned topics become studies, catalog entries become ideas */
  arr(get('curriculum1')).forEach(function(s){
    if(!s||typeof s!=='object')return;
    if(s.status==='catalog'){IDEAS.push({t:str(s.title),sub:str(s.subtitle),theme:str(s.theme),note:str(s.why),added:''});return;}
    var x=base('s-'+s.id,s.title),us=arr(s.units);
    x.sub=str(s.subtitle);x.theme=str(s.theme);x.why=str(s.why);x.goals=arr(s.goals).map(str).filter(Boolean);
    x.status={next:'Queued',done:'Finished'}[s.status]||'Active';x.start=str(s.start)||str((us[0]||{}).start);
    us.forEach(function(u,i){x.units.push({name:str(u.title)||'Unit '+(i+1),q:str(u.question),w:weeks(u.start,u.end),
      items:arr(u.todos).map(function(t){var it={t:str(t.text),k:TODO[t.kind]||'Do',done:!!t.done};if(str(t.url)){it.url=str(t.url);mat(x,t.text,t.url,{Read:'Article',Watch:'Video',Listen:'Podcast'}[it.k],'',i);}return it;})});});
    var pj=s.project||{},lastEnd=(us[us.length-1]||{}).end;x.project=str(pj.text);
    if(dt(pj.due)&&dt(lastEnd)&&dt(pj.due)>dt(lastEnd))x.pdue=str(pj.due);
    arr(s.notes).forEach(function(n){x.notes.push({title:str(n.title)||'Note',date:day(n.date),text:html(n.text),unit:null});});
    shelf(x,'self',s.id);PC.push(x);});
  var loose=[];lib.forEach(function(i,n){if(!used[n])loose.push({t:str(i.title),url:str(i.url),kind:KIND[i.type]||'Link',src:str(i.author)||host(str(i.url))});});
  return {PC:PC,CO:CO,IDEAS:IDEAS,loose:loose};
}

var MK={Video:'▶',Podcast:'♪',Book:'📖',Article:'📄',Link:'🔗'};
function M(t,kind,src,unit,url){return {t:t,kind:kind,src:src,unit:unit==null?null:unit,url:url||''};}
/* notes are simple rich text: plain lines become paragraphs */
function toHtml(t){return String(t||'').split('\n').map(function(l){return '<div>'+(esc(l)||'<br>')+'</div>';}).join('');}
/* ── your data ──
   Kept in this browser under "study1". The first time, what the old Classes page saved is converted;
   that old data is only read and stays exactly as it is. */
var KEY='study1',HOME=new URL('..',document.currentScript.src).href;
function readOld(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function loadDB(){var d=readOld(KEY);
  if(!d||d.v!==1){var r=convertAll(readOld),ss=readOld('learnSeasons1');
    d={v:1,pc:r.PC,co:r.CO,ideas:r.IDEAS,seasons:null,focus:{},cur:{},made:Date.now()};
    if(Array.isArray(ss))ss.forEach(function(z){if(z&&z.name&&z.focus)d.focus[z.name]=z.focus;});
    try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){}}
  /* resources that belonged to no class or course are not carried over (they live on the Languages page) */
  if(d.loose)delete d.loose;
  ['pc','co','ideas'].forEach(function(k){if(!Array.isArray(d[k]))d[k]=[];});d.focus=d.focus||{};d.cur=d.cur||{};return d;}
var DB=loadDB(),PC=DB.pc,CO=DB.co,IDEAS=DB.ideas,saveFail=false;
function save(){DB.cur={pc:S.cur.pc,co:S.cur.co};try{localStorage.setItem(KEY,JSON.stringify(DB));saveFail=false;}catch(e){if(!saveFail){saveFail=true;say('This change could not be saved: the browser’s storage is full.');}}}
var S={page:window.STUDY_PAGE||'pc',tab:{pc:'study',co:'plan'},cur:{pc:DB.cur.pc||(PC[0]||{}).id,co:DB.cur.co||(CO[0]||{}).id},note:{pc:0,co:0},noteOpen:false,unit:{},season:null};
function go(pg,q){location.href=HOME+'learn/'+{ov:'overview',pc:'personal',co:'courses'}[pg]+'/'+(q||'');}

/* ── helpers ── */
function $(s,r){return (r||document).querySelector(s);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function list(){return S.page==='pc'?PC:CO;}
function cur(){var l=list(),id=S.cur[S.page];for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return l[0];}
function counts(x){var d=0,t=0;x.units.forEach(function(u){u.items.forEach(function(i){t++;if(i.done)d++;});});return {d:d,t:t};}
function nextOf(x){for(var u=0;u<x.units.length;u++)for(var i=0;i<x.units[u].items.length;i++)if(!x.units[u].items[i].done)return {u:u,i:i};return null;}
function folderUnused(x){return (S.page==='pc'?'Brain 2.0 › Personal Curriculum › ':'Brain 2.0 › Courses › ')+x.title;}
var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function testOf(x){if(!x.testDate)return null;var p=x.testDate.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);if(isNaN(d))return null;return {label:MONTHS[d.getMonth()],weeks:Math.max(0,Math.ceil((d-new Date())/604800000))};}
function subOf(x){return x.theme||'';}
function lines(t){return String(t||'').split('\n').map(function(l){return l.replace(/^\s*[-•*]\s*/,'').trim();}).filter(Boolean);}
function blank(title){var d=new Date();return {id:'n'+Date.now(),title:title,sub:'',end:'',pw:0,start:d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2),theme:'',platform:'',status:'Active',url:'',testDate:'',why:'',weeks:[0,0,0,0,0,0,0,0],goals:[],units:[],project:'',unitNotes:{},notes:[],mats:[],sets:[],scores:[]};}
/* the fill-in form, the same kind the current Classes page uses */
var FORM=(function(){
  var now=null;
  function field(f){
    if(f.row)return '<div class="fld-row">'+f.row.map(field).join('')+'</div>';
    var id='ff-'+f.name,lab='<label for="'+id+'">'+esc(f.label)+(f.opt?' <span class="hint">('+esc(f.opt)+')</span>':'')+'</label>',ph=f.placeholder?' placeholder="'+esc(f.placeholder)+'"':'',c;
    if(f.type==='textarea')c='<textarea id="'+id+'"'+ph+(f.rows?' rows="'+f.rows+'"':'')+'>'+esc(f.value||'')+'</textarea>';
    else if(f.type==='select')c='<select id="'+id+'">'+f.options.map(function(o){return '<option'+(o===f.value?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';
    else c='<input id="'+id+'" type="'+(f.type||'text')+'" value="'+esc(f.value==null?'':f.value)+'"'+ph+(f.list?' list="'+id+'-dl"':'')+'>'+(f.list?'<datalist id="'+id+'-dl">'+f.list.map(function(o){return '<option value="'+esc(o)+'">';}).join('')+'</datalist>':'');
    return '<div class="fld">'+lab+c+'</div>';
  }
  function names(fs,out){fs.forEach(function(f){if(f.row)names(f.row,out);else out.push(f.name);});return out;}
  function open(o){now=o;$('#formBody').innerHTML='<h3>'+esc(o.title)+'</h3>'+o.fields.map(field).join('')+
      '<div class="modal-foot">'+(o.onDelete?'<button class="btn del" data-form="del">'+esc(o.deleteLabel||'Delete')+'</button>':'')+
      '<div><button class="btn" data-form="cancel">Cancel</button><button class="btn dark" data-form="save">'+esc(o.saveLabel||'Save')+'</button></div></div>';
    $('#formModal').classList.add('show');var f=$('#formBody input,#formBody textarea');if(f)f.focus();}
  function close(){now=null;$('#formModal').classList.remove('show');}
  function save(){if(!now)return;var v={};names(now.fields,[]).forEach(function(n){v[n]=$('#ff-'+n).value;});var o=now;if(o.onSave(v)!==false&&now===o)close();}
  function del(btn){if(!now||!now.onDelete)return;if(!btn.getAttribute('data-armed')){btn.setAttribute('data-armed','1');btn.textContent='Click again to delete';return;}var o=now;o.onDelete();if(now===o)close();}
  document.addEventListener('click',function(e){var b=e.target.closest('[data-form]');if(b){var k=b.getAttribute('data-form');if(k==='save')save();else if(k==='del')del(b);else close();return;}
    if(e.target.id==='formModal')close();});
  document.addEventListener('keydown',function(e){if(!now)return;if(e.key==='Escape')close();else if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();save();}});
  return {open:open,close:close};
})();
/* the forms */
function themes(){var t=S.page==='pc'?[]:['Tests','Certifications','Career','Self-exploration'];(S.page==='pc'?PC.concat(IDEAS):CO).forEach(function(z){if(z.theme&&t.indexOf(z.theme)<0)t.push(z.theme);});return t.sort();}
function mainForm(x){
  var pc=S.page==='pc',isNew=!x,v=x||blank('');
  var f=pc?[{name:'title',label:'What do you want to study?',placeholder:'e.g. The history of jazz',value:v.title},
      {name:'sub',label:'Subtitle',opt:'optional',value:v.sub},
      {row:[{name:'theme',label:'Theme',opt:'optional',placeholder:'Pick one or type a new one',value:v.theme,list:themes()},{name:'start',label:'Start date',type:'date',value:v.start}]},
      {name:'why',label:'Why this, and why now?',type:'textarea',value:v.why},
      {name:'goals',label:'By the end I want to…',opt:'one per line',type:'textarea',value:v.goals.join('\n')},
      {name:'project',label:'Final project',opt:'optional',type:'textarea',rows:2,placeholder:'Something you make to show what you learned',value:v.project}]
    :[{name:'title',label:'Course name',placeholder:'e.g. Intro to Data Analysis',value:v.title},
      {row:[{name:'theme',label:'Theme',opt:'optional',placeholder:'Pick one or type a new one',value:v.theme,list:themes()},{name:'platform',label:'Platform',opt:'optional',placeholder:'e.g. Coursera',value:v.platform}]},
      {row:[{name:'start',label:'Start date',type:'date',value:v.start},{name:'end',label:'End date',type:'date',value:v.end}]},
      {row:[{name:'status',label:'Status',type:'select',options:['Active','Queued','On hold','Finished'],value:v.status},{name:'testDate',label:'Test date',opt:'if it ends in a test',type:'date',value:v.testDate}]},
      {name:'url',label:'Course link',opt:'optional',placeholder:'https://…',value:v.url},
      {name:'why',label:'Why I’m taking it',type:'textarea',value:v.why},
      {name:'goals',label:'Goals',opt:'one per line',type:'textarea',value:v.goals.join('\n')}];
  if(isNew)f.push({name:'units',label:'Units',opt:'one per line; set how many weeks each takes afterwards',type:'textarea',rows:3});
  FORM.open({title:isNew?(pc?'Start a new study':'Add a course'):(pc?'Edit study':'Edit course'),fields:f,saveLabel:isNew?(pc?'Start studying':'Add course'):'Save',
    deleteLabel:pc?'Delete study':'Delete course',
    onDelete:isNew?null:function(){var l=list();l.splice(l.indexOf(x),1);if(!l.length)l.push(blank('Untitled'));S.cur[S.page]=l[0].id;render();},
    onSave:function(o){if(!o.title.trim()){$('#ff-title').focus();return false;}
      v.title=o.title.trim();v.why=o.why.trim();v.goals=lines(o.goals);v.start=o.start||'';if(pc)v.sub=(o.sub||'').trim();else v.end=o.end||'';
      v.theme=o.theme.trim();if(pc){v.project=o.project.trim();}else{v.platform=o.platform.trim();v.status=o.status;v.url=o.url.trim();v.testDate=o.testDate;}
      if(isNew){lines(o.units).forEach(function(n,i){v.units.push({name:n,q:'',w:1,items:[]});});list().push(v);S.cur[S.page]=v.id;S.tab[S.page]=pc?'study':'plan';S.noteOpen=false;}
      render();}});
}
function hostOf(u){try{return new URL(u).hostname.replace(/^www\./,'');}catch(e){return '';}}
function link(u){u=String(u||'').trim();if(!u)return '';if(!/^https?:\/\//i.test(u))u='https://'+u;return hostOf(u)?u:'';}
function unitOpts(x){return ['Whole '+(S.page==='pc'?'study':'course')].concat(x.units.map(function(u,i){return 'Unit '+(i+1)+' · '+u.name;}));}
function unitLabel(x,n){return n!=null&&x.units[n]?'Unit '+(n+1):'';}
/* a link on a to-do is also kept as a material of that unit */
function keepLink(x,ui,title,url,k){if(!url||x.mats.some(function(m){return m.url===url;}))return;
  var h=hostOf(url),kind=/youtu\.?be|vimeo/.test(h)?'Video':/spotify|podcast|overcast/.test(h)?'Podcast':({Read:'Article',Watch:'Video',Listen:'Podcast'}[k]||'Link');
  x.mats.unshift(M(title,kind,h,ui,url));}
function matForm(x,mi,unit){
  var m=mi==null?null:x.mats[mi],opts=unitOpts(x),at=m?m.unit:unit;
  FORM.open({title:m?'Edit material':'Add a material',saveLabel:m?'Save':'Add',deleteLabel:'Delete',
    fields:[{name:'t',label:'Title',placeholder:'e.g. The Death and Life of Great American Cities',value:m?m.t:''},
      {name:'url',label:'Link',opt:'optional',placeholder:'https://…',value:m?m.url:''},
      {row:[{name:'kind',label:'Kind',type:'select',options:Object.keys(MK),value:m?m.kind:'Video'},{name:'unit',label:'For',type:'select',options:opts,value:opts[at==null?0:at+1]}]},
      {name:'src',label:'Author or source',opt:'optional',placeholder:'Who made it',value:m?m.src:''}].concat(m?[]:[{name:'todo',label:'Also put it on the to-do list',type:'select',options:['Yes','No'],value:unit==null?'No':'Yes'}]),
    onDelete:m?function(){x.mats.splice(mi,1);render();}:null,
    onSave:function(o){var u=link(o.url),t=o.t.trim()||hostOf(u);if(!t){$('#ff-t').focus();return false;}
      var v={t:t,kind:o.kind,src:o.src.trim()||hostOf(u),unit:opts.indexOf(o.unit)>0?opts.indexOf(o.unit)-1:null,url:u};
      if(m)x.mats[mi]=v;else{x.mats.unshift(v);
        if(o.todo==='Yes'&&x.units.length){var tu=v.unit==null?selUnit(x):v.unit,it=I(v.t,{Video:'Watch',Podcast:'Listen',Book:'Read',Article:'Read'}[v.kind]||'Do');it.url=v.url;x.units[tu].items.push(it);S.unit[x.id]=tu;}}
      render();}});
}
function whyForm(x){
  var pc=S.page==='pc',f=[{name:'why',label:pc?'Why this, and why now?':'Why I’m taking it',type:'textarea',value:x.why},{name:'goals',label:pc?'By the end I want to…':'Goals',opt:'one per line',type:'textarea',value:x.goals.join('\n')}];
  if(pc)f.push({name:'project',label:'Final project',opt:'optional',type:'textarea',rows:2,value:x.project});
  FORM.open({title:'Why & goals',fields:f,onSave:function(o){x.why=o.why.trim();x.goals=lines(o.goals);if(pc)x.project=o.project.trim();render();}});
}
function unitForm(x,ui){
  var u=ui==null?null:x.units[ui];
  FORM.open({title:u?'Edit unit':'Add a unit',saveLabel:u?'Save':'Add unit',deleteLabel:'Delete unit',
    fields:[{row:[{name:'name',label:'Unit name',value:u?u.name:''},(u&&u.due?{name:'due',label:'Due date',type:'date',value:u.due}:{name:'w',label:'How many weeks',type:'number',value:u?(u.w||1):1})]},{name:'q',label:'Guiding question',opt:'optional',type:'textarea',rows:2,placeholder:'What do you want to understand?',value:u?u.q:''}],
    onDelete:u?function(){x.units.splice(ui,1);var n={};Object.keys(x.unitNotes).forEach(function(k){k=+k;if(k<ui)n[k]=x.unitNotes[k];else if(k>ui)n[k-1]=x.unitNotes[k];});x.unitNotes=n;
      x.mats.forEach(function(m){if(m.unit===ui)m.unit=null;else if(m.unit>ui)m.unit--;});x.notes.forEach(function(m){if(m.unit===ui)m.unit=null;else if(m.unit>ui)m.unit--;});delete S.unit[x.id];render();}:null,
    onSave:function(o){if(!o.name.trim()){$('#ff-name').focus();return false;}
      var w=Math.max(1,parseInt(o.w,10)||1);if(u){u.name=o.name.trim();u.q=o.q.trim();if(u.due){if(o.due)u.due=o.due;}else u.w=w;}else{x.units.push({name:o.name.trim(),q:o.q.trim(),w:w,items:[]});S.unit[x.id]=x.units.length-1;}render();}});
}
function todoForm(x,ui,ii){
  var it=x.units[ui].items[ii];
  FORM.open({title:'Edit to-do',deleteLabel:'Delete to-do',
    fields:[{name:'t',label:'To-do',type:'textarea',rows:2,value:it.t},{row:[{name:'k',label:'Kind',type:'select',options:KINDS,value:it.k},{name:'url',label:'Link',opt:'optional',placeholder:'https://…',value:it.url||''}]}],
    onDelete:function(){x.units[ui].items.splice(ii,1);render();},
    onSave:function(o){if(!o.t.trim()){$('#ff-t').focus();return false;}it.t=o.t.trim();it.k=o.k;it.url=link(o.url);keepLink(x,ui,it.t,it.url,it.k);render();}});
}
function scoreForm(x){
  FORM.open({title:'Add a practice test score',saveLabel:'Add score',
    fields:[{row:[{name:'score',label:'Score',placeholder:'e.g. 74%'},{name:'label',label:'Which test',type:'select',options:['Test 1','Test 2','Test 3','Test 4','Another test'],value:'Test 1'}]},{name:'note',label:'Note',opt:'optional',type:'textarea',rows:2,placeholder:'What went well, what to review'}],
    onSave:function(o){if(!o.score.trim()){$('#ff-score').focus();return false;}x.scores.unshift({d:today(),at:Date.now(),score:o.score.trim(),label:o.label+(o.note.trim()?' · '+o.note.trim():'')});render();}});
}
function ideaForm(n){
  var i=IDEAS[n];
  FORM.open({title:'Edit idea',deleteLabel:'Delete idea',
    fields:[{name:'t',label:'Idea',value:i.t},{name:'sub',label:'Subtitle',opt:'optional',value:i.sub||''},{name:'theme',label:'Theme',opt:'optional',placeholder:'Pick one or type a new one',value:i.theme,list:themes()},{name:'note',label:'Note',opt:'optional',type:'textarea',value:i.note}],
    onDelete:function(){IDEAS.splice(n,1);render();},
    onSave:function(o){if(!o.t.trim()){$('#ff-t').focus();return false;}i.t=o.t.trim();i.sub=o.sub.trim();i.theme=o.theme.trim();i.note=o.note.trim();render();}});
}
var MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function pd(v){var q=String(v||'').split('-'),d=new Date(+q[0],+q[1]-1,+q[2]);if(isNaN(d)){d=new Date();}d.setHours(0,0,0,0);return d;}
function addDays(d,n){var z=new Date(d);z.setDate(z.getDate()+n);return z;}
function fd(d){return MS[d.getMonth()]+' '+d.getDate();}
function wk(n){return n+(n===1?' week':' weeks');}
/* each unit runs for its number of weeks, one after another, from the start date */
function span(x){var st=pd(x.start),out=[],prev=null;
  x.units.forEach(function(u){var from=prev?addDays(prev,1):st,to;
    if(u.due){to=pd(u.due);if(from>to)from=to;}else to=addDays(from,Math.max(1,u.w||1)*7-1);
    out.push({from:from,to:to,w:Math.max(1,Math.round(((to-from)/86400000+1)/7))});prev=to;});
  var end=prev||addDays(st,6);if(x.pdue&&pd(x.pdue)>end)end=pd(x.pdue);if(x.end&&x.start&&pd(x.end)>=st)end=pd(x.end);
  return {dated:!!x.start,units:out,weeks:Math.max(1,Math.round(((end-st)/86400000+1)/7)),from:st,to:end};}
function nowUnit(x){var sp=span(x),t=pd('');if(!sp.dated)return -1;for(var i=0;i<sp.units.length;i++)if(t>=sp.units[i].from&&t<=sp.units[i].to)return i;return -1;}
function selUnit(x){var k=S.unit[x.id];if(k==null||k>=x.units.length){k=nowUnit(x);if(k<0)k=0;}return k;}

/* ── the left column: title, the unit you are on with its to-dos, and the syllabus ── */
function outline(x){
  var pc=S.page==='pc',c=counts(x),nx=nextOf(x),sp=span(x),now=nowUnit(x),sel=selUnit(x),tst=testOf(x),t=pd(''),h='';
  var eb=[pc?'Personal curriculum':'Course',subOf(x)].filter(Boolean).join(' · ');
  var when=!sp.dated?'No start date yet'+(x.end?' · ends '+fd(pd(x.end)):''):x.units.length||x.end?fd(sp.from)+' – '+fd(sp.to)+' · '+wk(sp.weeks)+(t<sp.from?' · starts '+fd(sp.from):t>sp.to?' · finished':' · week '+(Math.floor((t-sp.from)/604800000)+1)+' of '+sp.weeks):'Starts '+fd(sp.from);
  h+='<div class="card"><div class="chead"><div style="min-width:0"><div class="eb">'+esc(eb)+'</div><h2>'+esc(x.title)+'</h2>'+(x.sub?'<div class="subt">'+esc(x.sub)+'</div>':'')+'</div><div class="acts"><button class="btn sm" data-act="gdrive" title="Open this '+(pc?'study':'course')+'’s folder in Google Drive"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="m8 17 4-4 4 4"/><path d="M20 16.6A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/></svg>Drive</button><button class="btn sm" data-act="editmain">Edit</button></div></div>'+
     '<div class="meta">'+(!pc&&x.platform?'<span>'+esc(x.platform)+'</span>':'')+(!pc&&x.status&&x.status!=='Active'?'<span class="chip w">'+esc(x.status)+'</span>':'')+'<span>'+when+'</span><span>'+c.d+' of '+c.t+' to-dos done</span></div>';
  if(tst){var sc=x.scores&&x.scores[0];
    h+='<div class="stats"><div><b>'+wk(tst.weeks)+'</b><span>until the test · '+esc(tst.label)+'</span></div><div><b>'+(sc?esc(sc.score):'–')+'</b><span>latest practice test</span></div><div><b>'+(x.scores?x.scores.length:0)+'</b><span>practice tests taken</span></div></div>';}
  h+='</div>';
  /* the unit you are on */
  var u=x.units[sel];
  if(u){var r=sp.units[sel],lab=(sel===now?'Now · ':'')+'Unit '+(sel+1)+' of '+x.units.length+(sp.dated&&sel!==now&&t<r.from?' · starts '+fd(r.from):'');
    h+='<div class="card"><div class="chead"><div style="min-width:0"><div class="eb">'+esc(lab)+'</div><h2 style="font-size:22px">'+esc(u.name)+'</h2><div class="meta"><span>'+(sp.dated?fd(r.from)+' – '+fd(r.to)+' · ':'')+wk(r.w)+(u.due?' · due '+fd(r.to):'')+'</span></div></div><button class="btn" data-act="editunit" data-u="'+sel+'">Edit unit</button></div>';
    h+=u.q?'<div class="qbox">'+esc(u.q)+'</div>':'<div style="height:14px"></div>';
    u.items.forEach(function(it,ii){h+='<div class="it'+(it.done?' on':'')+'" data-act="tick" data-u="'+sel+'" data-i="'+ii+'"><span class="ck">'+(it.done?'✓':'')+'</span><span class="tx">'+esc(it.t)+(it.url?' <a class="tl" href="'+esc(it.url)+'" target="_blank" rel="noopener" title="Open the link">↗</a>':'')+'</span>'+(it.due?'<span class="due">'+fd(pd(it.due))+'</span>':'')+'<span class="k">'+esc(it.k)+'</span><button class="ed" data-act="edittodo" data-u="'+sel+'" data-i="'+ii+'">Edit</button></div>';});
    if(!u.items.length)h+='<div class="empty">Nothing on this unit’s list yet</div>';
    h+='<div class="addit"><select aria-label="Kind">'+KINDS.map(function(k){return '<option>'+k+'</option>';}).join('')+'</select><input class="line" data-add="'+sel+'" placeholder="Add a to-do or paste a link" aria-label="Add a to-do"></div>'+
       '<div class="ulab">Materials<button class="link" data-act="addmat" data-u="'+sel+'">+ Add</button></div><div class="ulist">'+
       (x.mats.some(function(m){return m.unit===sel;})?x.mats.map(function(m){return m.unit!==sel?'':'<div class="r"><i title="'+esc(m.kind)+'">'+(MK[m.kind]||'🔗')+'</i><span>'+(m.url?'<a href="'+esc(m.url)+'" target="_blank" rel="noopener">'+esc(m.t)+'</a>':esc(m.t))+'</span></div>';}).join(''):'<div class="empty">None yet</div>')+'</div>'+
       '<div class="ulab">Notes<button class="link" data-act="newnote" data-u="'+sel+'">+ Write</button></div><div class="ulist">'+
       (x.notes.some(function(n){return n.unit===sel;})?x.notes.map(function(n,i){return n.unit!==sel?'':'<button class="r" data-act="opennote" data-n="'+i+'"><i class="doci"></i><span>'+esc(n.title||'Untitled')+' <small>'+esc(n.date)+'</small></span></button>';}).join(''):'<div class="empty">None yet</div>')+'</div></div>';
  }
  /* the syllabus: every unit with its dates */
  h+='<div class="card"><div class="ttl"><span>Syllabus<button class="link starts" data-act="editmain" title="Change the start date">'+(sp.dated?'starts '+fd(sp.from):'set a start date')+'</button></span><button class="link" data-act="addunit">+ Unit</button></div>';
  if(!x.units.length)h+='<div class="empty">No units yet</div>';
  x.units.forEach(function(q,i){var r=sp.units[i],d=q.items.filter(function(z){return z.done;}).length,n=q.items.length;
    var chip=i===now?'<span class="chip now">Now</span>':n&&d===n?'<span class="chip g">Done</span>':n?'<span class="chip">'+d+' of '+n+'</span>':'<span class="chip">Not planned yet</span>';
    h+='<button class="srow'+(i===sel?' sel':'')+'" data-act="pick" data-u="'+i+'"><span class="d">'+(sp.dated?fd(r.from)+' – '+fd(r.to)+'<small>'+wk(r.w)+'</small>':wk(r.w))+'</span><span class="t">'+(i+1)+' · '+esc(q.name)+'</span>'+chip+'</button>';});
  if(pc)h+='<div class="srow"><span class="d">'+(sp.dated?'due '+fd(sp.to):'Final project')+'<small>'+(sp.dated?'final project':'')+'</small></span><span class="t pj">'+(x.project?esc(x.project):'Not decided yet')+'</span><button class="link" data-act="editwhy">Edit</button></div>';
  return h+'</div>';
}
function side(x){
  var h='',pc=S.page==='pc';
  h+='<div class="card"><div class="ttl">Why & goals<button class="link" data-act="editwhy">Edit</button></div>'+
     (x.why?'<div class="why">'+esc(x.why)+'</div>':'')+
     (x.goals.length?'<div class="sub2"'+(x.why?'':' style="margin-top:0"')+'>'+(pc?'By the end I want to…':'Goals')+'</div><ul class="goals">'+x.goals.map(function(g){return '<li>'+esc(g)+'</li>';}).join('')+'</ul>':'')+
     (pc&&x.project?'<div class="sub2">Final project</div><div class="why">'+esc(x.project)+'</div>':'')+
     (!x.why&&!x.goals.length&&!(pc&&x.project)?'<div class="empty">None yet</div>':'')+'</div>';
  h+='<div class="card"><div class="ttl">Materials<button class="link" data-act="addmat">+ Add</button></div>'+
    (x.mats.length?'<div class="matlist">'+x.mats.map(function(m,i){return '<div class="mat"><i title="'+esc(m.kind)+'">'+(MK[m.kind]||'🔗')+'</i><span style="flex:1;min-width:0">'+(m.url?'<a href="'+esc(m.url)+'" target="_blank" rel="noopener">'+esc(m.t)+'</a>':esc(m.t))+
      '<small>'+[m.src,unitLabel(x,m.unit)].filter(Boolean).map(esc).join(' · ')+'</small></span><button class="ed" data-act="editmat" data-n="'+i+'">Edit</button></div>';}).join('')+'</div>':'<div class="empty">None yet</div>')+'</div>';
  h+='<div class="card"><div class="ttl">Notes<button class="link" data-act="newnote">+ Write</button></div>'+
    (x.notes.length?x.notes.map(function(n,i){return '<button class="ne row" data-act="opennote" data-n="'+i+'"><i class="doci"></i><span>'+esc(n.title||'Untitled')+'<small>'+[n.date,unitLabel(x,n.unit)].filter(Boolean).map(esc).join(' · ')+'</small></span></button>';}).join(''):'<div class="empty">None yet</div>')+'</div>';
  return h;
}
function topbar(x,newLabel){
  var l=list(),opt=function(z){return '<option value="'+z.id+'"'+(z.id===x.id?' selected':'')+'>'+esc(z.title)+'</option>';},o='';
  var th=[];l.forEach(function(z){if(z.theme&&th.indexOf(z.theme)<0)th.push(z.theme);});
  o=l.filter(function(z){return !z.theme;}).map(opt).join('')+th.map(function(t){return '<optgroup label="'+esc(t)+'">'+l.filter(function(z){return z.theme===t;}).map(opt).join('')+'</optgroup>';}).join('');
  return '<div class="bar"><select class="pick" id="pick" aria-label="Choose">'+o+'</select><button class="btn dark" data-act="new" style="height:40px">+ '+newLabel+'</button></div>';
}
/* ── overview: what runs in a season, week by week ── */
function seasons(){
  if(DB.seasons)return DB.seasons;
  var saved=readOld('learnSeasons1');
  var ok=function(z){return z&&/^\d{4}-\d\d-\d\d$/.test(z.start||'')&&/^\d{4}-\d\d-\d\d$/.test(z.end||'')&&z.start<=z.end;};
  if(Array.isArray(saved)&&saved.filter(ok).length)return saved.filter(ok).map(function(z){return {name:z.name||'Season',start:z.start,end:z.end,focus:z.focus||''};}).sort(function(a,b){return a.start<b.start?-1:1;});
  var y=new Date().getFullYear(),out=[];
  for(var k=y-1;k<=y+1;k++)out.push({name:'Spring '+k,start:k+'-03-22',end:k+'-06-13'},{name:'Summer '+k,start:k+'-06-14',end:k+'-08-23'},{name:'Fall '+k,start:k+'-08-24',end:k+'-12-12'},{name:'Winter '+(k+1),start:k+'-12-13',end:(k+1)+'-03-21'});
  var t=pd(''),at=0;out.forEach(function(z,i){if(pd(z.start)<=t)at=i;});return out.slice(Math.max(0,at-2),at+2);
}
function ring(pct,co){var r=19,c=2*Math.PI*r;return '<svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="'+r+'" fill="none" stroke="var(--warm-deep)" stroke-width="6"/>'+
  (pct>0?'<circle cx="26" cy="26" r="'+r+'" fill="none" stroke="'+(co?'#6a8fc2':'var(--accent)')+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+(c*pct/100)+' '+c+'" transform="rotate(-90 26 26)"/>':'')+
  '<text x="26" y="30" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--ink)" font-family="Fraunces,Georgia,serif">'+pct+'%</text></svg>';}
function overview(){
  var ss=seasons(),t=pd(''),cur=0;ss.forEach(function(z,i){if(pd(z.start)<=t)cur=i;});
  if(S.season==null||S.season>=ss.length)S.season=cur;
  var se=ss[S.season],a=pd(se.start),b=pd(se.end),W=Math.max(1,Math.round(((b-a)/86400000+1)/7)),isNow=t>=a&&t<=b,past=t>b,wkNow=Math.floor((t-a)/604800000)+1;
  var all=PC.map(function(x){return {x:x,pg:'pc'};}).concat(CO.map(function(x){return {x:x,pg:'co'};}));
  all.forEach(function(o){o.sp=span(o.x);o.c=counts(o.x);o.fin=o.x.status==='Finished'||(o.sp.dated&&t>o.sp.to&&o.c.t>0&&o.c.d===o.c.t);});
  var within=function(z){return function(o){return o.sp.dated&&o.sp.from<=pd(z.end)&&o.sp.to>=pd(z.start);};};
  var inS=all.filter(within(se)).sort(function(p,q){return p.sp.from-q.sp.from;});
  /* what happens when: units beginning, things due, projects, tests */
  var ev=[];inS.forEach(function(o){var x=o.x,sp=o.sp;
    x.units.forEach(function(u,i){ev.push({d:sp.units[i].from,pg:o.pg,o:o,t:x.title+' · Unit '+(i+1)+' begins',s:/^Unit \d+$/.test(u.name)?'':u.name});
      u.items.forEach(function(it){if(it.due)ev.push({d:pd(it.due),pg:o.pg,o:o,t:it.t+' due',s:x.title,done:it.done});});});
    if(o.pg==='pc'&&x.units.length)ev.push({d:sp.to,pg:'pc',o:o,t:x.title+' · final project due',s:x.project||''});
    if(x.testDate)ev.push({d:pd(x.testDate),pg:'co',o:o,t:x.title+' · test day',s:''});
    else if(o.pg==='co'&&x.end)ev.push({d:pd(x.end),pg:'co',o:o,t:x.title+' ends',s:''});});
  ev=ev.filter(function(e){return e.d>=a&&e.d<=b;}).sort(function(p,q){return p.d-q.d;});
  var busy=[];for(var w=0;w<W;w++)busy.push({pc:0,co:0});
  ev.forEach(function(e){var k=Math.min(W-1,Math.floor((e.d-a)/604800000));busy[k][e.pg]++;});
  var max=Math.max.apply(null,busy.map(function(q){return q.pc+q.co;}).concat([1]));
  var h='<div class="head"><h1>Overview</h1><button class="btn" data-act="seasondates">Edit season dates</button></div><div class="stabs">'+ss.map(function(z,i){return '<button data-act="season" data-n="'+i+'" class="'+(i===S.season?'on':'')+'">'+esc(z.name)+(i===cur?'<i>•</i>':'')+'<small>'+fd(pd(z.start))+' – '+fd(pd(z.end))+'</small></button>';}).join('')+'</div>';
  /* the season at a glance */
  var fc=DB.focus[se.name]!=null?DB.focus[se.name]:(se.focus||'');
  h+='<div class="card hero"><div><div class="eb" style="color:var(--muted)">'+esc(se.name)+' · '+fd(a)+' – '+fd(b)+'</div>'+
     '<div class="bigw">'+(isNow?'Week '+wkNow+'<small>of '+W+'</small>':past?'Finished<small>'+wk(W)+'</small>':'Starts<small>in '+Math.round((a-t)/86400000)+' days</small>')+'</div>'+
     '<button class="focus" data-act="focus"><b>This season I’m focusing on</b><span'+(fc?'':' class="ph"')+'>'+(fc?esc(fc):'Add a sentence about what matters this season…')+'</span></button></div>'+
     '<div><div class="ttl" style="margin-bottom:0">How busy each week is</div><div class="busy" style="grid-template-columns:repeat('+W+',1fr)">'+
       busy.map(function(q,i){var n=q.pc+q.co;return '<div class="col'+(isNow&&i+1===wkNow?' now':'')+'" title="Week '+(i+1)+' · '+fd(addDays(a,i*7))+' – '+fd(addDays(a,i*7+6))+(n?' · '+n+' thing'+(n>1?'s':''):'')+'">'+(n?'<div class="n">'+n+'</div>':'')+
         (q.co?'<div class="bar co" style="height:'+(q.co/max*78)+'px'+(q.pc?';border-radius:0':'')+'"></div>':'')+(q.pc?'<div class="bar pc" style="height:'+(q.pc/max*78)+'px'+(q.co?';border-radius:0;order:-1':'')+'"></div>':'')+(n?'':'<div class="bar"></div>')+'</div>';}).join('')+'</div>'+
       '<div class="wkn" style="grid-template-columns:repeat('+W+',1fr)">'+busy.map(function(q,i){return '<span'+(isNow&&i+1===wkNow?' class="now"':'')+'>'+(i+1)+'</span>';}).join('')+'</div>'+
       '<div class="key"><span><i></i>Personal Curriculum</span><span><i class="co"></i>Courses</span></div></div></div>';
  /* one card each for Personal Curriculum and Courses */
  var IC={pc:'<path d="M12 7c-2-1.4-4.6-2-8-2v13c3.4 0 6 .6 8 2 2-1.4 4.6-2 8-2V5c-3.4 0-6 .6-8 2Z"/><path d="M12 7v13"/>',co:'<path d="M3 8l9-4 9 4-9 4Z"/><path d="M7 10v5c0 1 5 3 5 3s5-2 5-3v-5"/>'};
  h+='<div class="two">'+['pc','co'].map(function(pg){var l=inS.filter(function(o){return o.pg===pg;}),d=0,tt=0,nx=null,un=all.filter(function(o){return o.pg===pg&&!o.sp.dated;}).length;
    l.forEach(function(o){d+=o.c.d;tt+=o.c.t;if(!nx&&!o.fin){var k=nextOf(o.x);if(k)nx={o:o,it:o.x.units[k.u].items[k.i]};}});
    var act=l.filter(function(o){return !o.fin;}).length,word=pg==='pc'?(l.length===1?'study':'studies'):(l.length===1?'course':'courses');
    return '<div class="card"><div class="sc-h"><span class="ic '+pg+'"><svg viewBox="0 0 24 24">'+IC[pg]+'</svg></span><b>'+(pg==='pc'?'Personal Curriculum':'Courses')+'</b><a class="link" style="text-decoration:none" href="'+HOME+'learn/'+(pg==='pc'?'personal':'courses')+'/">Open →</a></div>'+
      '<div class="sc-m">'+ring(tt?Math.round(d/tt*100):0,pg==='co')+'<div><div class="big2">'+l.length+' '+word+'</div><small>'+(l.length?l.map(function(o){return esc(o.x.title);}).join(' · '):'Nothing in this season')+(un&&S.season===cur?(l.length?' · ':'')+un+' not scheduled':'')+'</small></div></div>'+
      '<div class="nx"><b>NEXT</b><span>'+(nx?esc(nx.it.t)+' · '+esc(nx.o.x.title):past&&l.length?'All finished':l.length?'Nothing open':'—')+'</span></div></div>';}).join('')+'</div>';
  /* what is on, and what is coming up */
  var soon=isNow?ev.filter(function(e){return e.d>=t&&e.d<=addDays(t,42);}):ev;
  h+='<div class="cols" style="margin-top:18px"><div class="card"><div class="ttl">'+(isNow?'What’s on':past?'What was on':'What’s planned')+'<span class="chip">'+inS.length+'</span></div>'+
     (inS.length?inS.map(function(o){var pc=o.c.t?Math.round(o.c.d/o.c.t*100):0;return '<button class="prow" data-act="open" data-pg="'+o.pg+'" data-id="'+esc(o.x.id)+'"><span class="edge '+o.pg+'"></span><span class="tt">'+esc(o.x.title)+
        '<small>'+[o.pg==='pc'?'Personal Curriculum':'Course',o.x.units.length+' unit'+(o.x.units.length===1?'':'s'),o.c.d+' of '+o.c.t+' to-dos',fd(o.sp.from)+' – '+fd(o.sp.to)].join(' · ')+'</small></span>'+(o.fin?'<span class="chip g">Finished</span>':'<span class="chip">'+pc+'%</span>')+'</button>';}).join(''):'<div class="empty">Nothing in this season yet</div>')+'</div>'+
     '<div class="card"><div class="ttl">Coming up<span style="font-family:var(--sans);font-size:12px;font-weight:600;color:var(--muted)">'+(isNow?'next 6 weeks':esc(se.name))+'</span></div>'+
     (soon.length?soon.slice(0,7).map(function(e){return '<div class="cup"><span class="dtile '+e.pg+'"><small>'+MS[e.d.getMonth()].toUpperCase()+'</small>'+e.d.getDate()+'</span><span class="ct">'+esc(e.t)+(e.s?'<small>'+esc(e.s)+'</small>':'')+'</span>'+(e.done?'<span class="chip g">done</span>':'')+'</div>';}).join('')+(soon.length>7?'<div class="empty" style="padding-top:8px">and '+(soon.length-7)+' more</div>':''):'<div class="empty">Nothing in '+(isNow?'the next 6 weeks':'this season')+'</div>')+'</div></div>';
  /* earlier seasons */
  var earlier='';ss.forEach(function(z,i){if(i>=S.season)return;all.filter(within(z)).forEach(function(o){if(pd(z.end)>=t&&!o.fin)return;
    earlier='<button class="past" data-act="open" data-pg="'+o.pg+'" data-id="'+esc(o.x.id)+'"><span class="chip">'+esc(z.name)+'</span><span class="tt">'+esc(o.x.title)+'<small>'+(o.fin?'all finished':o.c.d+' of '+o.c.t+' to-dos')+'</small></span><span class="dots2">'+o.x.units.map(function(u){return '<i class="'+(u.items.length&&u.items.every(function(q){return q.done;})?'on '+o.pg:'')+'"></i>';}).join('')+'</span></button>'+earlier;});});
  if(earlier)h+='<div class="pastl">Past seasons</div>'+earlier;
  return h;
}
/* ── a note opens as its own page; on the real page each one is a Google Doc in the study's folder ── */
function allNotes(x){return x.notes.map(function(n,i){return {own:i,title:n.title,date:n.date};});}
function noteView(x){
  var n=x.notes[S.note[S.page]];if(!n){S.noteOpen=false;return '';}
  return '<div class="bar"><button class="btn" data-act="closenote">← '+esc(x.title)+'</button><span class="grow"></span><button class="btn del" data-act="delnote">Delete note</button></div>'+
    '<div class="card editor" style="max-width:860px;margin:0 auto"><input class="etitle" id="ntitle" value="'+esc(n.title)+'" placeholder="Title" aria-label="Title">'+
    '<div class="doc"><i></i><span id="gdoc">'+docLine(n)+'</span><span class="grow"></span><select id="nunit" aria-label="Belongs to">'+unitOpts(x).map(function(o,i){return '<option value="'+(i-1)+'"'+((n.unit==null?-1:n.unit)===i-1?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>'+
    '<div class="tools"><button data-fmt="h3" title="Make this line a heading">Heading</button><button data-fmt="bold" title="Bold"><b>B</b></button><button data-fmt="ul" title="Bulleted list">• List</button><button data-fmt="p" title="Back to normal text">Normal</button><span class="grow"></span><span class="saved" id="nsaved" style="margin:0;align-self:center"></span></div>'+
    '<div class="rich" id="nbody" contenteditable="true" data-ph="Write here…">'+(n.text||'')+'</div></div>';
}
/* ── a note is also kept as a Google Doc ──
   The Doc is made the first time the note has something in it, in the Drive folder
   Brain 2.0 Notes › Personal Curriculum (or Courses) › the study's name, and is brought up to date a
   moment after you stop typing. Nothing is made for a note that was never written in. */
function gd(){var g=window.GCal;return g&&g.configured()&&g.drive?g:null;}
function docLine(n,msg){var g=gd(),open=n.docUrl?' · <a href="'+esc(n.docUrl)+'" target="_blank" rel="noopener" style="color:var(--accent-deep);font-weight:650;text-decoration:none">Open in Google Docs ↗</a>':'';
  if(msg)return esc(msg)+open;
  if(!g)return 'Saved in this browser';
  if(!g.drive.on())return 'Saved in this browser · turn on Google Drive on the <a href="'+HOME+'backup/" style="color:var(--accent-deep)">Backup page</a> to keep notes as Google Docs';
  if(!g.drive.ready())return (n.docUrl?'Google Doc'+open+' · ':'')+'<button class="link" data-act="gconnect">Connect Google to '+(n.docUrl?'update it':'keep this as a Google Doc')+'</button>';
  return n.docUrl?'Google Doc'+open:'Becomes a Google Doc when you start writing';}
function setDocLine(n,msg){var el=$('#gdoc');if(el&&cur()&&cur().notes[S.note[S.page]]===n)el.innerHTML=docLine(n,msg);}
var docT=null,docBusy=false,docAgain=null;
function syncDoc(x,n){
  var g=gd();if(!g||!g.drive.ready()||!n)return;
  if(!n.docId&&!String(n.title||'').trim()&&!String(n.text||'').replace(/<[^>]*>/g,'').trim())return;
  if(docBusy){docAgain=[x,n];return;}
  docBusy=true;setDocLine(n,'Saving to Google Docs…');
  var title=String(n.title||'').trim()||'Untitled',pc=PC.indexOf(x)>=0;
  g.drive.saveDoc({id:n.docId||'',name:title,html:'<html><head><meta charset="utf-8"></head><body><h1>'+esc(title)+'</h1>'+(n.text||'')+'</body></html>',group:pc?'Personal Curriculum':'Courses',folderKey:x.id,folderName:x.title})
    .then(function(f){n.docId=f.id;n.docUrl=f.webViewLink||('https://docs.google.com/document/d/'+f.id+'/edit');n.docDirty=false;save();setDocLine(n);},
          function(e){setDocLine(n,e&&e.code==='auth'?'':'Could not save to Google Docs: '+(e&&e.message||'try again'));})
    .then(function(){docBusy=false;if(docAgain){var a=docAgain;docAgain=null;syncDoc(a[0],a[1]);}});
}
function docSoon(x,n){n.docDirty=true;clearTimeout(docT);docT=setTimeout(function(){syncDoc(x,n);},2500);}
/* ── ideas (Personal Curriculum only) ── */
function ideasTab(){
  var themeList=themes();
  return '<div class="bar" style="margin-bottom:6px"></div><div class="card"><div class="addrow"><input class="line" id="idea" placeholder="Add an idea" aria-label="Idea"><input class="line" id="itheme" list="themes" placeholder="Theme: pick or type new" style="width:210px;flex:none" aria-label="Theme"><datalist id="themes">'+themeList.map(function(t){return '<option value="'+esc(t)+'">';}).join('')+'</datalist><button class="btn dark" data-act="addidea" style="height:42px">Add</button></div>'+
    '<table><thead><tr><th style="width:36%">Idea</th><th style="width:15%">Theme</th><th>Note</th><th style="width:10%">Added</th><th style="width:16%"></th></tr></thead><tbody>'+
    IDEAS.map(function(i,n){return '<tr><td class="t">'+esc(i.t)+(i.sub?'<small>'+esc(i.sub)+'</small>':'')+'</td><td>'+(i.theme?'<span class="chip">'+esc(i.theme)+'</span>':'')+'</td><td class="m">'+esc(i.note)+'</td><td class="m">'+esc(i.added)+'</td><td>'+(i.study?'<span class="chip g">Studying</span>':'<button class="link" data-act="start" data-n="'+n+'">Start →</button>')+' <button class="link" data-act="editidea" data-n="'+n+'" style="margin-left:8px;color:var(--muted)">Edit</button></td></tr>';}).join('')+'</tbody></table></div>';
}
/* ── practice (a course with a test) ── */
function practiceTab(x){
  var by={};PARTS.forEach(function(n){by[n]={r:0,t:0};});
  x.sets.forEach(function(z){if(by[z.sec]){by[z.sec].r+=z.right;by[z.sec].t+=z.total;}});
  var done=PARTS.filter(function(k){return by[k].t;}),low=done.slice().sort(function(a,b){return by[a].r/by[a].t-by[b].r/by[b].t;})[0],B=bank();
  var lens=Object.keys(LENS).map(function(k){var n=0,m=0;PARTN.forEach(function(N,p){var c=sizeOf(p,k);n+=c;m+=Math.ceil(PARTMIN[p]*c/N);});return '<option value="'+k+'">'+k+' · '+n+' questions · '+m+' min</option>';}).join('');
  return topbar(x,'New course')+'<div class="card" style="margin-bottom:18px">'+(B?
      '<div class="tintro"><div class="ttl" style="margin:0">Take a practice test</div><span class="grow"></span><select id="tver" aria-label="Test">'+B.versions.map(function(v,i){return '<option value="'+i+'">'+esc(v.name||('Test '+(i+1)))+'</option>';}).join('')+'</select><select id="tlen" aria-label="Length">'+lens+'</select><button class="btn dark" data-act="tstart" style="height:36px">Start timed test</button></div>'+
      '<div class="saved" style="margin-top:10px">'+B.versions.length+' tests loaded · <button class="link" data-act="bankdel">Remove the questions from this browser</button></div>'
      :'<div class="ttl" style="margin-bottom:6px">Practice tests</div><div class="bank"><span style="flex:1;min-width:260px;font-size:13.5px;font-weight:500;line-height:1.5">Add your question file (fsot-questions.json, from the FSOT Practice Tests folder). It is kept in this browser only.</span><input type="file" id="bankfile" accept=".json,application/json" hidden><button class="btn dark" data-act="bankpick" style="height:36px">Choose the file</button></div>')+'</div>'+
    '<div class="cols"><div><div class="card"><div class="ttl">Tests taken<button class="link" data-act="addscore">+ Add a score</button></div>'+(x.scores.length?x.scores.map(function(z){return '<div class="row"><span class="g">'+esc(z.label||'')+'<small style="display:block;color:var(--muted);font-size:11.5px">'+esc(z.d)+'</small></span><b>'+esc(z.score)+'</b></div>';}).join(''):'<div class="empty">None yet</div>')+'</div></div>'+
    '<div><div class="card"><div class="ttl">By section</div>'+PARTS.map(function(k){var q=by[k],pc=q.t?Math.round(q.r/q.t*100):0,weak=k===low&&done.length>1;
      return '<div class="row"><span style="width:44%;min-width:0">'+esc(k)+(weak?' <span class="chip w">weakest</span>':'')+'</span><span class="pbar'+(weak?' low':'')+'"><i style="width:'+pc+'%"></i></span><b style="width:40px;text-align:right">'+(q.t?pc+'%':'–')+'</b></div>';}).join('')+'</div></div></div>';
}
/* ── practice test ──
   Three timed parts with the real question counts and times. The questions come from the person's
   own file, kept in this browser under "fsotBank1". A test in progress is kept too ("studyTest1"),
   so closing the page by accident does not lose it. */
var PARTS=['Job knowledge','English usage and comprehension','Logical reasoning'],PARTN=[50,45,30],PARTMIN=[35,35,45],PARTFROM=[1,51,96];
var LENS={Full:1,Half:.5,Quick:.24},BANKKEY='fsotBank1',TKEY='studyTest1',BANK;
function bank(){if(BANK===undefined){BANK=readOld(BANKKEY);if(!BANK||!Array.isArray(BANK.versions)||!BANK.versions.length)BANK=null;}return BANK;}
function sizeOf(p,len){return Math.max(1,Math.round(PARTN[p]*(LENS[len]||1)));}
function bankQ(ver,n){var v=bank().versions[ver],q=v.questions[n-1];if(!q||q.n!==n)q=v.questions.filter(function(z){return z.n===n;})[0];
  return {n:n,pre:q.pre||'',q:q.q,o:q.opts,a:'ABCD'.indexOf(q.answer),why:q.why||''};}
function useBank(text){var d;try{d=JSON.parse(text);}catch(e){say('That file could not be read. Choose fsot-questions.json.');return;}
  var ok=d&&Array.isArray(d.versions)&&d.versions.length&&d.versions.every(function(v){return Array.isArray(v.questions)&&v.questions.length===125&&v.questions.every(function(q){return q&&typeof q.q==='string'&&Array.isArray(q.opts)&&q.opts.length===4&&'ABCD'.indexOf(q.answer)>=0;});});
  if(!ok){say('That is not the question file. Choose fsot-questions.json from the FSOT Practice Tests folder.');return;}
  try{localStorage.setItem(BANKKEY,JSON.stringify({versions:d.versions.map(function(v){return {name:v.name,questions:v.questions};})}));}catch(e){say('There is not enough room in this browser to keep the questions.');return;}
  BANK=undefined;render();say(d.versions.length+' tests added');}
var T=null,tick=null;
function keepT(){if(!T||T.done){try{localStorage.removeItem(TKEY);}catch(e){}return;}
  try{localStorage.setItem(TKEY,JSON.stringify({cid:T.cid,ver:T.ver,len:T.len,p:T.p,i:T.i,left:T.left,used:T.used,secs:T.secs,nums:T.parts.map(function(qs){return qs.map(function(a){return a.q.n;});}),pick:T.parts.map(function(qs){return qs.map(function(a){return a.pick;});}),flag:T.parts.map(function(qs){return qs.map(function(a){return a.flag?1:0;});})}));}catch(e){}}
function runClock(){clearInterval(tick);tick=setInterval(function(){if(!T||T.done)return;T.left--;T.used++;var c=$('#clock');if(c){c.textContent=clock(T.left);c.classList.toggle('low',T.left<=60);}if(T.used%10===0)keepT();if(T.left<=0)nextPart();},1000);}
function startTest(ver,len){
  if(!bank())return;ver=+ver||0;if(!LENS[len])len='Full';
  var secs=[],parts=PARTS.map(function(_,p){var N=PARTN[p],n=sizeOf(p,len),r=Math.random(),out=[];secs.push(Math.ceil(PARTMIN[p]*n/N)*60);
    for(var i=0;i<n;i++){var k=n>=N?i:Math.min(N-1,Math.floor((i+r)*N/n));out.push({q:bankQ(ver,PARTFROM[p]+k),order:[0,1,2,3],pick:-1,flag:false});}return out;});
  T={cid:cur().id,ver:ver,len:len,secs:secs,parts:parts,p:0,i:0,left:secs[0],used:0,done:false};keepT();runClock();render();window.scrollTo(0,0);
}
function resumeTest(){var k=readOld(TKEY);if(!k||!bank()||!CO.some(function(c){return c.id===k.cid;}))return;
  try{var parts=k.nums.map(function(ns,p){return ns.map(function(n,i){return {q:bankQ(k.ver,n),order:[0,1,2,3],pick:k.pick[p][i],flag:!!k.flag[p][i]};});});
    T={cid:k.cid,ver:k.ver,len:k.len,secs:k.secs,parts:parts,p:k.p,i:k.i,left:k.left,used:k.used,done:false};S.cur.co=k.cid;runClock();}catch(e){T=null;}}
function clock(s){s=Math.max(0,s);return Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60;}
function nextPart(){if(T.p<PARTS.length-1){T.p++;T.i=0;T.left=T.secs[T.p];keepT();render();window.scrollTo(0,0);}else finishTest();}
function finishTest(){
  T.done=true;clearInterval(tick);keepT();var x=CO.filter(function(c){return c.id===T.cid;})[0]||cur(),right=0,total=0,tname=(bank().versions[T.ver]||{}).name||('Test '+(T.ver+1));
  T.parts.forEach(function(qs,p){var r=qs.filter(function(a){return a.pick>=0&&a.order[a.pick]===a.q.a;}).length;right+=r;total+=qs.length;x.sets.unshift({d:today(),sec:PARTS[p],right:r,total:qs.length});});
  T.right=right;T.total=total;x.scores.unshift({d:today(),at:Date.now(),score:Math.round(right/total*100)+'%',label:(T.len==='Full'?'':T.len+' · ')+tname+' · '+right+' of '+total});T.name=tname;x.weeks[x.weeks.length-1]=1;
  render();window.scrollTo(0,0);
}
function testView(){
  if(T.done){
    var h='<div class="trun"><div class="card"><div class="lab" style="margin-top:0">Practice test · '+(T.len==='Full'?'':T.len+' · ')+esc(T.name||'')+'</div><div class="big">'+Math.round(T.right/T.total*100)+'%<small>'+T.right+' of '+T.total+' right · '+clock(T.used)+' used</small></div>'+
      '<div style="margin-top:16px">'+T.parts.map(function(qs,p){var r=qs.filter(function(a){return a.pick>=0&&a.order[a.pick]===a.q.a;}).length;return '<div class="row"><span style="width:46%">'+PARTS[p]+'</span><span class="pbar"><i style="width:'+(r/qs.length*100)+'%"></i></span><b style="width:54px;text-align:right">'+r+' / '+qs.length+'</b></div>';}).join('')+'</div>'+
      '<div class="tfoot"><button class="btn dark" data-act="tclose">Back to Practice</button><button class="btn" data-act="tagain">Take another test</button></div></div>'+
      '<div class="card"><div class="ttl">Review your answers</div>';
    var n=0;T.parts.forEach(function(qs){qs.forEach(function(a){n++;var ok=a.pick>=0&&a.order[a.pick]===a.q.a;
      h+='<div class="rev"><div class="rq"><span class="mark'+(ok?'':' x')+'">'+(ok?'✓':'✕')+'</span><span>'+a.q.n+'. '+esc(a.q.q)+'</span></div>'+(a.q.pre&&!ok?'<details style="margin:0 0 6px 34px;font-size:13px"><summary style="cursor:pointer;color:var(--muted);font-weight:600">Show the text</summary><div class="passage" style="margin-top:8px">'+a.q.pre+'</div></details>':'')+
        (ok?'':'<div class="ra bad">Your answer: '+(a.pick>=0?esc(a.q.o[a.order[a.pick]]):'not answered')+'</div>')+'<div class="ra good">Correct answer: '+esc(a.q.o[a.q.a])+'</div><div class="why">'+esc(a.q.why)+'</div></div>';});});
    return h+'</div></div>';
  }
  var qs=T.parts[T.p],a=qs[T.i],last=T.i===qs.length-1;
  return '<div class="trun"><div class="thead"><span><b>Part '+(T.p+1)+' of '+PARTS.length+'</b> · '+PARTS[T.p]+'</span><span>Question '+(T.i+1)+' of '+qs.length+'</span><span class="clock'+(T.left<=60?' low':'')+'" id="clock">'+clock(T.left)+'</span></div>'+
    '<div class="card">'+(a.q.pre?'<div class="passage">'+a.q.pre+'</div>':'')+'<p class="qtext">'+esc(a.q.q)+'</p>'+
    a.order.map(function(oi,k){return '<button class="opt'+(a.pick===k?' sel':'')+'" data-act="tpick" data-k="'+k+'"><i>'+'ABCD'.charAt(k)+'</i><span>'+esc(a.q.o[oi])+'</span></button>';}).join('')+
    '<div class="tfoot"><button class="btn" data-act="tgo" data-d="-1"'+(T.i?'':' disabled style="opacity:.4"')+'>Back</button><button class="btn" data-act="tflag">'+(a.flag?'Flagged':'Flag for review')+'</button>'+
    '<span class="dots">'+qs.map(function(z,k){return '<button data-act="tjump" data-k="'+k+'" class="'+(k===T.i?'cur ':'')+(z.pick>=0?'ans ':'')+(z.flag?'flag':'')+'">'+(k+1)+'</button>';}).join('')+'</span>'+
    (last?'<button class="btn dark" data-act="tpart">'+(T.p<PARTS.length-1?'Finish this part':'Finish test')+'</button>':'<button class="btn dark" data-act="tgo" data-d="1">Next</button>')+'</div></div>'+
    '<div style="text-align:center;margin-top:14px"><button class="link" data-act="tend">End the test now</button></div></div>';
}

/* ── page ── */
function render(){
  if(S.page==='ov'){$('#page').innerHTML=overview();save();return;}
  var x=cur(),t=S.tab[S.page],pc=S.page==='pc';
  var tabs=pc?[['study','Syllabus'],['ideas','Ideas']]:[['plan','Syllabus']].concat(x&&x.testDate?[['practice','Practice tests']]:[]);
  if(!tabs.some(function(a){return a[0]===t;}))t=S.tab[S.page]=tabs[0][0];
  var h='<div class="head"><h1>'+(pc?'Personal Curriculum':'Courses')+'</h1>'+(tabs.length>1&&!S.noteOpen?'<div class="tabs">'+tabs.map(function(a){return '<button data-act="tab" data-tab="'+a[0]+'" class="'+(a[0]===t?'on':'')+'">'+a[1]+'</button>';}).join('')+'</div>':'')+'</div>';
  if(T&&!pc){$('#page').innerHTML='<div class="head"><h1>Courses</h1></div>'+testView();save();return;}
  if(!x&&t!=='ideas'){$('#page').innerHTML=h+'<div class="bar"><button class="btn dark" data-act="new" style="height:40px">+ '+(pc?'New study':'New course')+'</button></div><div class="card"><div class="empty">Nothing here yet</div></div>';return;}
  if(S.noteOpen)h+=noteView(x);
  else if(t==='study'||t==='plan')h+=topbar(x,pc?'New study':'New course')+'<div class="cols"><div>'+outline(x)+'</div><div>'+side(x)+'</div></div>';
  else if(t==='ideas')h+=ideasTab();
  else if(t==='practice')h+=practiceTab(x);
  $('#page').innerHTML=h;save();
}
var toastT;function say(msg){var t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#241f17;color:#fffdf9;padding:11px 16px;border-radius:14px;font-weight:600;font-size:13px;z-index:50;max-width:calc(100vw - 32px);box-shadow:0 14px 34px rgba(36,31,23,.3)';document.body.appendChild(t);}
  t.textContent=msg;t.style.display='block';clearTimeout(toastT);toastT=setTimeout(function(){t.style.display='none';},3200);}
function today(){var d=new Date();return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getDate();}

document.addEventListener('click',function(e){
  if(e.target.closest('a[href]'))return;
  var el=e.target.closest('[data-act]');if(!el)return;
  var a=el.getAttribute('data-act'),x=S.page==='ov'?null:cur();
  if(a==='tab'){S.tab[S.page]=el.getAttribute('data-tab');S.noteOpen=false;render();}
  else if(a==='focus'){var sz=seasons()[S.season];FORM.open({title:sz.name,fields:[{name:'f',label:'This season I’m focusing on',type:'textarea',rows:3,value:DB.focus[sz.name]!=null?DB.focus[sz.name]:(sz.focus||'')}],onSave:function(o){DB.focus[sz.name]=o.f.trim();render();}});}
  else if(a==='seasondates'){var cs=seasons().map(function(z){return {name:z.name,start:z.start,end:z.end,focus:z.focus||''};}),ff=[];
    cs.forEach(function(z,i){ff.push({name:'n'+i,label:'Season '+(i+1)+' name',value:z.name});ff.push({row:[{name:'s'+i,label:'Starts',type:'date',value:z.start},{name:'e'+i,label:'Ends',type:'date',value:z.end}]});});
    FORM.open({title:'Season dates',fields:ff,onSave:function(o){var bad=-1;cs.forEach(function(z,i){z.name=o['n'+i].trim()||z.name;z.start=o['s'+i]||z.start;z.end=o['e'+i]||z.end;if(z.start>z.end&&bad<0)bad=i;});
      if(bad>=0){say(cs[bad].name+' ends before it starts');return false;}cs.sort(function(p,q){return p.start<q.start?-1:1;});DB.seasons=cs;S.season=null;render();}});}
  else if(a==='season'){S.season=+el.getAttribute('data-n');render();}
  else if(a==='open'){go(el.getAttribute('data-pg'),'#id='+encodeURIComponent(el.getAttribute('data-id')));}
  else if(a==='pick'){S.unit[x.id]=+el.getAttribute('data-u');render();}
  else if(a==='tick'){var it=x.units[+el.getAttribute('data-u')].items[+el.getAttribute('data-i')];it.done=!it.done;x.weeks[x.weeks.length-1]=1;render();}
  else if(a==='gdrive'){var dg2=gd();
    if(!dg2){say('Google isn’t set up in this browser yet');return;}
    if(!dg2.drive.on()){say('Turn on Google Drive on the Backup page first');return;}
    var w=window.open('about:blank','_blank'),inPc=PC.indexOf(x)>=0;
    (dg2.drive.ready()?Promise.resolve():window.GCal.signIn()).then(function(){return dg2.drive.noteFolder({group:inPc?'Personal Curriculum':'Courses',folderKey:x.id,folderName:x.title});})
      .then(function(id){var u='https://drive.google.com/drive/folders/'+id;if(w&&!w.closed)w.location=u;else location.href=u;},
            function(err){if(w&&!w.closed)w.close();say(err&&err.message||'Could not open the Drive folder');});}
  else if(a==='bankpick'){$('#bankfile').click();}
  else if(a==='bankdel'){if(!el.getAttribute('data-armed')){el.setAttribute('data-armed','1');el.textContent='Click again to remove them';return;}try{localStorage.removeItem(BANKKEY);}catch(err){}BANK=undefined;render();}
  else if(a==='editmain'){mainForm(x);}
  else if(a==='new'){mainForm(null);}
  else if(a==='editwhy'){whyForm(x);}
  else if(a==='addunit'){unitForm(x,null);}
  else if(a==='editunit'){unitForm(x,+el.getAttribute('data-u'));}
  else if(a==='edittodo'){todoForm(x,+el.getAttribute('data-u'),+el.getAttribute('data-i'));}
  else if(a==='editidea'){ideaForm(+el.getAttribute('data-n'));}
  else if(a==='opennote'){S.note[S.page]=+el.getAttribute('data-n');S.noteOpen=true;render();window.scrollTo(0,0);}
  else if(a==='closenote'){var cn=x.notes[S.note[S.page]];if(cn&&cn.docDirty){clearTimeout(docT);syncDoc(x,cn);}S.noteOpen=false;render();}
  else if(a==='gconnect'){var gn=x.notes[S.note[S.page]];window.GCal.signIn().then(function(){setDocLine(gn);if(gn.docDirty||!gn.docId)syncDoc(x,gn);},function(err){say(err&&err.message||'Google sign-in did not finish');});}
  else if(a==='delnote'){if(!el.getAttribute('data-armed')){el.setAttribute('data-armed','1');el.textContent='Click again to delete';return;}var dn=x.notes[S.note[S.page]],dg=gd();clearTimeout(docT);x.notes.splice(S.note[S.page],1);S.noteOpen=false;render();
    if(dn&&dn.docId){if(dg&&dg.drive.ready())dg.drive.trash(dn.docId).then(function(){say('Deleted. Its Google Doc is in your Drive trash for 30 days.');},function(){say('Deleted here. Its Google Doc could not be removed from Drive.');});else say('Deleted here. Its Google Doc is still in your Drive.');}}
  else if(a==='newnote'){var nu=el.getAttribute('data-u');x.notes.unshift({title:'',date:today(),text:'',unit:nu==null?null:+nu});S.note[S.page]=0;S.noteOpen=true;render();window.scrollTo(0,0);var nt=$('#ntitle');if(nt)nt.focus();}
  else if(a==='tstart'){startTest($('#tver').value,$('#tlen').value);}
  else if(a==='tpick'){var tq=T.parts[T.p][T.i],tk=+el.getAttribute('data-k');tq.pick=tq.pick===tk?-1:tk;keepT();render();}
  else if(a==='tgo'){T.i=Math.max(0,Math.min(T.parts[T.p].length-1,T.i+ +el.getAttribute('data-d')));render();}
  else if(a==='tjump'){T.i=+el.getAttribute('data-k');render();}
  else if(a==='tflag'){var fq=T.parts[T.p][T.i];fq.flag=!fq.flag;keepT();render();}
  else if(a==='tpart'){var open=T.parts[T.p].filter(function(z){return z.pick<0;}).length;if(open&&!el.getAttribute('data-armed')){el.setAttribute('data-armed','1');el.textContent=open+' not answered · click again to finish';return;}nextPart();}
  else if(a==='tend'){if(!el.getAttribute('data-armed')){el.setAttribute('data-armed','1');el.textContent='Click again to end the test (unanswered questions count as wrong)';return;}finishTest();}
  else if(a==='tclose'){T=null;S.tab.co='practice';render();}
  else if(a==='tagain'){var nv=(T.ver+1)%bank().versions.length,ln=T.len;T=null;startTest(nv,ln);}
  else if(a==='addmat'){var mu=el.getAttribute('data-u');matForm(x,null,mu==null?null:+mu);}
  else if(a==='editmat'){matForm(x,+el.getAttribute('data-n'));}
  else if(a==='addidea'){var v=$('#idea').value.trim();if(!v)return;IDEAS.push({t:v,theme:$('#itheme').value.trim(),note:'',added:today()});render();$('#idea').focus();}
  else if(a==='start'){var idea=IDEAS[+el.getAttribute('data-n')],sid='n'+Date.now();var ns=blank(idea.t);ns.id=sid;ns.sub=idea.sub||'';ns.theme=idea.theme||'';ns.why=idea.note||'';PC.push(ns);idea.study=sid;S.cur.pc=sid;S.tab.pc='study';S.noteOpen=false;render();}
  else if(a==='addscore'){scoreForm(x);}
});
/* formatting buttons act on the note being edited (mousedown, so the cursor stays in the note) */
document.addEventListener('mousedown',function(e){var b=e.target.closest('[data-fmt]');if(!b)return;e.preventDefault();var f=b.getAttribute('data-fmt');$('#nbody').focus();
  if(f==='bold')document.execCommand('bold');else if(f==='ul')document.execCommand('insertUnorderedList');else document.execCommand('formatBlock',false,f==='h3'?'h3':'div');
  $('#nbody').dispatchEvent(new Event('input',{bubbles:true}));});
document.addEventListener('change',function(e){if(e.target.id==='bankfile'){var f=e.target.files[0];if(f){var rd=new FileReader();rd.onload=function(){useBank(String(rd.result||''));};rd.readAsText(f);}return;}
  if(e.target.id==='nunit'){var nn=cur().notes[S.note[S.page]];if(nn){nn.unit=+e.target.value<0?null:+e.target.value;save();}return;}
  if(e.target.id==='pick'){S.cur[S.page]=e.target.value;S.note[S.page]=0;S.noteOpen=false;render();}});
document.addEventListener('keydown',function(e){
  if(e.key!=='Enter')return;var t=e.target;
  if(t.hasAttribute&&t.hasAttribute('data-add')){var v=t.value.trim();if(!v)return;var x=cur(),u=+t.getAttribute('data-add');var kd=t.previousElementSibling.value,it=I(v,kd),lk=/^(https?:\/\/|www\.)\S+$/i.test(v)?link(v):'';if(lk){it.url=lk;it.t=hostOf(lk)+(new URL(lk).pathname.length>1?new URL(lk).pathname.slice(0,40):'');keepLink(x,u,it.t,lk,kd);}x.units[u].items.push(it);S.unit[x.id]=u;render();var again=$('[data-add="'+u+'"]');if(again)again.focus();}
  if(t.id==='idea'||t.id==='itheme'){e.preventDefault();$('[data-act="addidea"]').click();}
});
var saveT;
document.addEventListener('input',function(e){
  var x=cur(),t=e.target;
  if(t.id==='nbody'||t.id==='ntitle'){var n=x.notes[S.note[S.page]];if(!n)return;
    if(t.id==='nbody')n.text=t.innerHTML;else n.title=t.value;
    clearTimeout(saveT);saveT=setTimeout(function(){save();var z=$('#nsaved');if(z)z.innerHTML='<b>Saved</b>';},500);docSoon(x,n);}
});
/* start: a link from the Overview can name the study or course to open */
(function(){var m=/[#&]id=([^&]+)/.exec(location.hash);if(m&&S.page!=='ov'){var id=decodeURIComponent(m[1]);if(list().some(function(z){return z.id===id;}))S.cur[S.page]=id;}
  if(S.page==='co')resumeTest();})();
/* another tab changed something: show it here too (not while a note or a form is being typed in) */
window.addEventListener('storage',function(e){if(e.key!==KEY||S.noteOpen||$('#formModal').classList.contains('show')||T)return;DB=loadDB();PC=DB.pc;CO=DB.co;IDEAS=DB.ideas;render();});
window.addEventListener('beforeunload',function(){if($('#nbody'))save();keepT();});
render();
})();
