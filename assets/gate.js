/* ─────────────────────────────────────────────────────────────
   Brain 2.0 — the password prompt on Finances and Library.
   The password itself is not in the code: only a scrambled fingerprint of it
   (salted SHA-256, repeated) that can't be turned back into the password.
   This keeps casual visitors out; it is not real security, because the pages
   and your data both live in the browser.
   localStorage brain2auth = the fingerprint once you've typed the password
   (older versions stored the password itself; that is replaced on first visit).
   ───────────────────────────────────────────────────────────── */
(function(){
  var KEY='brain2auth', SALT='brain2.gate.v1:', ROUNDS=20000, HASH='3ce99aa84b76e79966f6a8a17486669d5f27dd6b729dcb27839bb498eec4ce00';
  var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function bytes(str){var u=unescape(encodeURIComponent(str)),a=[];for(var i=0;i<u.length;i++)a.push(u.charCodeAt(i));return a;}
  /* SHA-256 of a byte array → hex */
  function sha256(m){
    var h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],l=m.length,w=new Array(64),i,j;
    m=m.slice();m.push(0x80);while(m.length%64!==56)m.push(0);
    var bits=l*8;m.push(0,0,0,0,(bits>>>24)&255,(bits>>>16)&255,(bits>>>8)&255,bits&255);
    function rr(x,n){return (x>>>n)|(x<<(32-n));}
    for(i=0;i<m.length;i+=64){
      for(j=0;j<16;j++)w[j]=(m[i+j*4]<<24)|(m[i+j*4+1]<<16)|(m[i+j*4+2]<<8)|m[i+j*4+3];
      for(j=16;j<64;j++){var s0=rr(w[j-15],7)^rr(w[j-15],18)^(w[j-15]>>>3),s1=rr(w[j-2],17)^rr(w[j-2],19)^(w[j-2]>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)|0;}
      var a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],k=h[7];
      for(j=0;j<64;j++){
        var t1=(k+(rr(e,6)^rr(e,11)^rr(e,25))+((e&f)^(~e&g))+K[j]+w[j])|0,t2=((rr(a,2)^rr(a,13)^rr(a,22))+((a&b)^(a&c)^(b&c)))|0;
        k=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
      }
      h[0]=(h[0]+a)|0;h[1]=(h[1]+b)|0;h[2]=(h[2]+c)|0;h[3]=(h[3]+d)|0;h[4]=(h[4]+e)|0;h[5]=(h[5]+f)|0;h[6]=(h[6]+g)|0;h[7]=(h[7]+k)|0;
    }
    var out='';for(i=0;i<8;i++)out+=('00000000'+(h[i]>>>0).toString(16)).slice(-8);return out;
  }
  function print(pw){var x=sha256(bytes(SALT+pw));for(var i=1;i<ROUNDS;i++)x=sha256(bytes(x));return x;}
  /* true when this browser may see the page; asks for the password if it hasn't been given here yet */
  window.B2Gate=function(){
    var s=null;try{s=localStorage.getItem(KEY);}catch(e){}
    if(s===HASH)return true;
    function keep(){try{localStorage.setItem(KEY,HASH);}catch(e){}return true;}
    if(s&&print(s)===HASH)return keep();
    var a=prompt('Password:');
    return a!=null&&print(a)===HASH?keep():false;
  };
  window.B2Gate.print=print;
})();
