/* Chanchito: conexión con Supabase (login + base de datos en la nube).
   Expone window.APP_BACKEND con la misma forma de "db" y "user" que usa la app:
   db.doc(path).set/update/delete/onSnapshot, db.collection(path).doc/where/limit/get/onSnapshot. */
(function(){
  "use strict";
  const cfg=window.CHANCHITO_CONFIG||{};
  const recovery=/type=recovery/.test(location.hash+location.search);
  const configured=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase);
  const sb=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;

  let session=null;
  const listeners=new Set();       // live queries to refresh
  let channel=null,refreshT=null;

  const parentOf=p=>p.replace(/\/[^/]+$/,'');
  const idOf=p=>p.slice(p.lastIndexOf('/')+1);
  const err=(e,code)=>{const x=new Error(e&&e.message||String(e));x.code=code||(e&&e.code)||'error';x.cause=e;return x};

  function refreshSoon(){clearTimeout(refreshT);refreshT=setTimeout(()=>listeners.forEach(l=>l.run()),120)}
  function startRealtime(){
    if(channel||!sb)return;
    channel=sb.channel('docs-changes').on('postgres_changes',{event:'*',schema:'public',table:'docs'},refreshSoon).subscribe();
  }
  function stopRealtime(){if(channel){sb.removeChannel(channel);channel=null}}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshSoon()});
  window.addEventListener('online',refreshSoon);

  /* ----- Documents ----- */
  function docSnap(path,row){return {id:idOf(path),exists:!!row,data:()=>row?{...row.data}:undefined}}
  function querySnap(rows){const docs=rows.map(r=>({id:idOf(r.path),exists:true,data:()=>({...r.data})}));return {docs,empty:!docs.length,size:docs.length}}

  function live(fetcher,cb,onErr){
    let alive=true;
    const l={run:async()=>{if(!alive)return;try{const s=await fetcher();if(alive)cb(s)}catch(e){console.error(e);onErr&&onErr(err(e))}}};
    listeners.add(l);startRealtime();l.run();
    return ()=>{alive=false;listeners.delete(l)};
  }

  function DocRef(path){
    return {
      id:idOf(path),path,
      collection:name=>CollRef(path+'/'+name),
      async get(){const {data,error}=await sb.from('docs').select('path,data').eq('path',path).maybeSingle();if(error)throw err(error);return docSnap(path,data)},
      async set(body){const {error}=await sb.from('docs').upsert({path,parent:parentOf(path),data:body||{}});if(error)throw err(error,error.code==='42501'?'invalid_argument':undefined);refreshSoon()},
      async update(part){const cur=await this.get();await this.set({...(cur.data()||{}),...part})},
      async delete(){const {error}=await sb.from('docs').delete().eq('path',path);if(error)throw err(error);refreshSoon()},
      onSnapshot(cb,onErr){return live(()=>this.get(),cb,onErr)},
    };
  }
  function CollRef(path,filters=[],lim=1000){
    const q={
      path,
      doc:id=>DocRef(path+'/'+id),
      where:(field,op,val)=>CollRef(path,[...filters,[field,op,val]],lim),
      limit:n=>CollRef(path,filters,n),
      async get(){
        let r=sb.from('docs').select('path,data').eq('parent',path);
        for(const[f,op,v]of filters){
          if(f==='members'&&op==='array-contains')r=r.contains('members',[v]);
          else if(op==='==')r=r.eq('data->>'+f,String(v));
          else throw err('Filtro no soportado: '+f+' '+op,'invalid_argument');
        }
        const {data,error}=await r.order('path').limit(lim);if(error)throw err(error);return querySnap(data||[]);
      },
      onSnapshot(cb,onErr){return live(()=>q.get(),cb,onErr)},
    };
    return q;
  }
  const db={
    doc:DocRef,collection:p=>CollRef(p),
    async joinByCode(code){const {data,error}=await sb.rpc('join_shared',{code});if(error)throw err(error);refreshSoon();return data},
  };

  /* ----- Users / profiles ----- */
  const avatar=(name,id)=>{const ini=(name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
    const hues=[211,145,280,25,340,190,45,0];let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="hsl(${hues[h%hues.length]} 70% 52%)"/><text x="20" y="25.5" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="15" font-weight="600" fill="#fff" text-anchor="middle">${ini.replace(/[<&>]/g,'')}</text></svg>`;
    return 'data:image/svg+xml,'+encodeURIComponent(svg)};
  const user={
    async id(){return session?.user?.id||null},
    async can(){return true},
    async profiles(ids){
      const {data,error}=await sb.from('profiles').select('id,name').in('id',ids);if(error)throw err(error);
      const out={};for(const id of ids){const p=(data||[]).find(x=>x.id===id);const name=p?.name||'Alguien';out[id]={name,avatarUrl:avatar(name,id),isMe:id===session?.user?.id}}
      return out;
    },
  };

  /* ----- Auth ----- */
  const authListeners=new Set();
  const auth={
    configured,recovery,
    get session(){return session},
    get email(){return session?.user?.email||''},
    get name(){return session?.user?.user_metadata?.name||''},
    onChange(fn){authListeners.add(fn);return()=>authListeners.delete(fn)},
    async init(){if(!sb)return null;const {data}=await sb.auth.getSession();session=data.session||null;
      sb.auth.onAuthStateChange((ev,s)=>{const before=session?.user?.id;session=s||null;if(!session)stopRealtime();
        if(ev==='PASSWORD_RECOVERY'||before!==session?.user?.id||ev==='USER_UPDATED')authListeners.forEach(f=>f(ev,session))});
      return session},
    async signIn(email,password){const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw err(error,authCode(error));session=data.session;return session},
    async signUp(email,password,name){
      const {data,error}=await sb.auth.signUp({email,password,options:{data:{name},emailRedirectTo:location.origin+location.pathname}});
      if(error)throw err(error,authCode(error));
      if(data.session){session=data.session;await auth.saveName(name)}
      return {needsConfirm:!data.session};
    },
    async saveName(name){if(!session)return;await sb.auth.updateUser({data:{name}});const {error}=await sb.from('profiles').upsert({id:session.user.id,name});if(error)throw err(error)},
    async ensureProfile(){if(!session)return;const n=auth.name||auth.email.split('@')[0];await sb.from('profiles').upsert({id:session.user.id,name:n}).then(()=>{},()=>{})},
    async changePassword(pw){const {error}=await sb.auth.updateUser({password:pw});if(error)throw err(error,authCode(error))},
    async resetPassword(email){const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw err(error,authCode(error))},
    async signOut(){stopRealtime();listeners.clear();await sb.auth.signOut();session=null},
  };
  function authCode(e){const m=(e&&e.message||'').toLowerCase();
    if(m.includes('invalid login'))return 'bad_login';
    if(m.includes('already registered')||m.includes('already been registered'))return 'exists';
    if(m.includes('email not confirmed'))return 'not_confirmed';
    if(m.includes('password')&&(m.includes('least')||m.includes('weak')||m.includes('short')))return 'weak';
    if(m.includes('same')&&m.includes('password'))return 'same';
    if(m.includes('rate')||m.includes('seconds'))return 'rate';
    if(m.includes('fetch')||m.includes('network'))return 'network';
    return e&&e.code||'error'}

  window.APP_BACKEND={configured,auth,use:async name=>{if(!configured||!session)return null;if(name==='db')return db;if(name==='user')return user;return null}};
})();
