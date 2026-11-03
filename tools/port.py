import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count} match(es), found {n}: {old[:90]!r}')
    s = s.replace(old, new)

# ---------- Head ----------
rep('<title>Chanchito</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>',
'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Chanchito</title>
<meta name="description" content="Tus finanzas del mes: ingresos, gastos fijos y variables, ahorro y metas.">
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#f2f2f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Chanchito">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<script>/* Tema guardado en este dispositivo, antes de pintar para que no parpadee */
try{var t=JSON.parse(localStorage.getItem('cc-theme'));if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<style>''')
rep('</style>\n\n<div class="app">', '''
/* PWA: configuración, login y actualizaciones */
html,body{margin:0;min-height:100%}
.toast:not(.show){visibility:hidden}
.only-narrow{display:inline-flex}
.side-bottom{margin-top:auto;display:flex;flex-direction:column;gap:8px}
.side-bottom .side-foot{margin-top:0}
.side-link .dot-new{width:8px;height:8px;border-radius:50%;background:var(--c-red);margin-left:auto}
.brand-mark.pig{background:#ff5e8c;overflow:hidden}
.brand-mark.pig img{width:100%;height:100%}
.upd{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:color-mix(in srgb,var(--accent) 12%,var(--surface));border-radius:var(--r-md);padding:10px 12px 10px 14px;font-size:14px}
.upd b{display:block}
.cfg{display:flex;flex-direction:column;gap:24px;max-width:640px}
.cfg .row .val{color:var(--label-2);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:0 1 auto}
.cfg .row.tap{width:100%;text-align:left}
.cfg .row.tap:hover{background:var(--fill)}
.cfg .row .seg{flex:0 1 300px}
.cfg .danger-row{color:var(--c-red);justify-content:center;font-weight:500;width:100%}
.me{display:flex;align-items:center;gap:14px;padding:14px}
.me + .row{border-top:1px solid var(--sep)}
.me .t{font-weight:600;font-size:17px}
body.auth-mode .sidebar,body.auth-mode .tabbar,body.auth-mode .fab{display:none!important}
body.auth-mode .app{grid-template-columns:1fr}
.auth{max-width:400px;margin:6vh auto 0;display:flex;flex-direction:column;gap:18px}
.auth .logo{width:84px;height:84px;border-radius:22px;margin:0 auto;display:block;box-shadow:var(--shadow)}
.auth h1{text-align:center}
.auth p.sub{margin:-8px 0 0;text-align:center;color:var(--label-2)}
.auth form{display:flex;flex-direction:column;gap:14px}
.auth .row input{text-align:left!important;color:var(--label)!important}
.auth .row > span{width:92px}
.auth .err{color:var(--neg);font-size:14px;text-align:center;margin:0}
.auth .ok{color:var(--pos);font-size:14px;text-align:center;margin:0}
.auth .links{display:flex;flex-direction:column;align-items:center;gap:10px}
.link-plain{color:var(--accent);font-weight:500;font-size:15px}
@media (min-width:900px){.only-narrow{display:none}}
</style>
</head>
<body>

<div class="app">''')
rep('<div class="toast" id="toast" role="status" aria-live="polite"></div>\n',
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>\n\n<script src="config.js"></script>\n<script src="vendor/supabase.js"></script>\n<script src="js/backend.js"></script>\n')
rep('<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>',
    '<script src="vendor/chart.umd.js"></script>')
rep('    <div class="brand"><span class="brand-mark" data-icon="coin"></span>Chanchito</div>',
    '    <div class="brand"><span class="brand-mark pig"><img src="icons/icon-192.png" alt=""></span>Chanchito</div>')
rep('    <div class="side-foot" id="side-foot"></div>',
    '    <div class="side-bottom"><button class="side-link" id="side-config" data-act="tab" data-tab="config"></button><div class="side-foot" id="side-foot"></div></div>')
assert s.rstrip().endswith('</script>')
s = s.rstrip() + '\n</body>\n</html>\n'

# ---------- Icons ----------
rep("  globe:'", """  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  download:'<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 15.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3.5"/>',
  globe:'""")

# ---------- Backend boot ----------
rep('''async function boot(){
  render();
  if(!window.claude||!window.claude.use){return startLocal()}
  try{[db,user]=await Promise.all([claude.use('db'),claude.use('user')])}catch(e){db=null}
  claude.use('sample').then(x=>{SAMPLE=x||null;if(SAMPLE)schedule()}).catch(()=>{});
  if(!db||!user)return startLocal();''',
'''const BK=window.APP_BACKEND||null;
const noAuth=()=>store('cc-noauth')===true;
async function boot(){
  render();
  if(BK&&BK.configured&&!noAuth()){
    ME.backend='app';
    try{await BK.auth.init()}catch(e){console.error(e)}
    BK.auth.onChange(ev=>{if(ev==='PASSWORD_RECOVERY'){openNewPasswordSheet(true);return}if(ev==='USER_UPDATED'){schedule();return}location.reload()});
    if(!BK.auth.session){ME.mode='auth';return render()}
    BK.auth.ensureProfile();
    [db,user]=await Promise.all([BK.use('db'),BK.use('user')]);
  }else if(window.claude&&window.claude.use){
    ME.backend='claude';
    try{[db,user]=await Promise.all([claude.use('db'),claude.use('user')])}catch(e){db=null}
    claude.use('sample').then(x=>{SAMPLE=x||null;if(SAMPLE)schedule()}).catch(()=>{});
  }else return startLocal();
  if(!db||!user)return startLocal();''')
rep('''function startLocal(){
  ME.mode='local';
  let data=store(LOCAL_KEY);
  if(!data||!data.accounts){data=sampleData(true);store(LOCAL_KEY,data)}''',
'''function startLocal(){
  ME.mode='local';
  let data=store(LOCAL_KEY);
  if(!data||!data.accounts){data={settings:{currency:'ARS'},accounts:{}};store(LOCAL_KEY,data)}''')
rep("const ME={uid:null,mode:'boot',readOnly:false};", "const ME={uid:null,mode:'boot',readOnly:false,backend:null};\nconst needLogin=()=>ME.backend==='claude'?'abrí la app con tu sesión de Claude':'iniciá sesión desde Configuración';")

# ---------- Render ----------
rep("const isLoading=()=>ME.mode==='boot'||", "const isLoading=()=>ME.mode==='boot'||")
rep('''function render(){
  if(UI.acc!=='all'&&!S.accounts[UI.acc]&&!isLoading())UI.acc='all';''',
'''function render(){
  document.body.classList.toggle('auth-mode',ME.mode==='auth');
  if(ME.mode==='auth'){$('#top').innerHTML='';$('#view').innerHTML=viewAuth();return}
  if(UI.acc!=='all'&&!S.accounts[UI.acc]&&!isLoading())UI.acc='all';''')
rep('''  $('#side-foot').textContent=ME.mode==='db'?'Tus datos se guardan en tu cuenta de Claude.':ME.mode==='local'?'Modo demo: los datos quedan en este navegador.':'';''',
'''  $('#side-config').innerHTML=icon('gear')+'Configuración'+(UPD.waiting?'<span class="dot-new" aria-label="Hay una versión nueva"></span>':'');
  if(UI.tab==='config')$('#side-config').setAttribute('aria-current','page');else $('#side-config').removeAttribute('aria-current');
  $('#side-foot').textContent=ME.mode==='db'?(ME.backend==='claude'?'Tus datos se guardan en tu cuenta de Claude.':'Tus datos se guardan en tu cuenta.'):ME.mode==='local'?'Tus datos quedan solo en este dispositivo.':'';''')
rep("  if(!accs().length&&UI.tab!=='cuentas'){v.innerHTML=emptyState();return}",
    "  if(!accs().length&&UI.tab!=='cuentas'&&UI.tab!=='config'){v.innerHTML=emptyState();return}")
rep("  v.innerHTML=({resumen:viewResumen,movimientos:viewMovs,ahorro:viewAhorro,metricas:viewMetricas,cuentas:viewCuentas})[UI.tab]();",
    "  v.innerHTML=({resumen:viewResumen,movimientos:viewMovs,ahorro:viewAhorro,metricas:viewMetricas,cuentas:viewCuentas,config:viewConfig})[UI.tab]();\n  maybeNotify();")
rep('''  const titles={resumen:'Resumen',movimientos:'Movimientos',ahorro:'Ahorro y metas',metricas:'Informe del mes',cuentas:'Cuentas'};
  const showMonth=UI.tab!=='cuentas';''',
'''  const titles={resumen:'Resumen',movimientos:'Movimientos',ahorro:'Ahorro y metas',metricas:'Informe del mes',cuentas:'Cuentas',config:'Configuración'};
  const showMonth=UI.tab!=='cuentas'&&UI.tab!=='config';''')
rep('''  const banner=ME.mode==='local'?`<div class="banner">${icon('info')}<div><b>Estás viendo una demo con datos de ejemplo.</b> Abrí la app desde claude.ai con tu sesión iniciada para guardar tus datos en tu cuenta y compartir cuentas.</div></div>`:'';''',
'''  const banner=(UPD.waiting&&UI.tab!=='config'?`<div class="upd"><span><b>Hay una versión nueva de Chanchito</b>${UPD.notes?esc(UPD.notes):'Tocá Actualizar para tener lo último.'}</span><button class="btn sm" data-act="applyUpdate">Actualizar</button></div>`:'')
    +(ME.mode==='local'&&UI.tab!=='config'?`<div class="banner">${icon('info')}<div><b>Estás usando Chanchito sin cuenta.</b> Tus datos quedan solo en este dispositivo.${BK&&BK.configured?' <button class="link-plain" data-act="goLogin">Iniciá sesión</button> para usarlos en el celu y la compu, y compartir cuentas.':''}</div></div>`:'');''')
rep('''        <button class="hbtn" data-act="notifs" aria-label="Avisos de vencimientos${dueN?': '+dueN+' pendientes':''}">${icon('bell')}${dueN?`<span class="badge">${dueN}</span>`:''}</button>''',
'''        <button class="hbtn" data-act="notifs" aria-label="Avisos de vencimientos${dueN?': '+dueN+' pendientes':''}">${icon('bell')}${dueN?`<span class="badge">${dueN}</span>`:''}</button>
        ${UI.tab!=='config'?`<button class="hbtn only-narrow" data-act="tab" data-tab="config" aria-label="Configuración">${icon('gear')}${UPD.waiting?'<span class="badge">1</span>':''}</button>`:''}''')

# ---------- Texts that mentioned Claude ----------
rep('''<ol class="steps"><li>Compartile el link de esta app desde el botón <b>Compartir</b> de claude.ai, con permiso de <b>Colaborador</b> (o superior).</li>''',
'''<ol class="steps">${ME.backend==='claude'?'<li>Compartile el link de esta app desde el botón <b>Compartir</b> de claude.ai, con permiso de <b>Colaborador</b> (o superior).</li>':`<li>Pasale el link de Chanchito${location.protocol.startsWith('http')?` (<b style="color:var(--label)">${esc(location.origin+location.pathname)}</b>)`:''} para que se cree su cuenta.</li>`}''')
rep("  if(ME.mode!=='db'){toast('Para unirte a una cuenta abrí la app con tu sesión de Claude');return}",
    "  if(ME.mode!=='db'){toast('Para unirte a una cuenta '+needLogin());return}")
rep("  if(ME.mode!=='db'){toast('Para compartir cuentas abrí la app con tu sesión de Claude');return}",
    "  if(ME.mode!=='db'){toast('Para compartir cuentas '+needLogin());return}")
rep("toast('Para compartir cuentas abrí la app con tu sesión de Claude');return false}",
    "toast('Para compartir cuentas '+needLogin());return false}")
rep('''      try{const q=await db.collection('compartidas')''',
'''      if(db.joinByCode){try{const r=await db.joinByCode(code);if(!r||!r.found){toast('No encontramos una cuenta con ese código');return false}
          toast(r.already?'Ya sos parte de esa cuenta':'¡Listo! Ya sos parte de '+(r.name||'la cuenta'));return true}
        catch(e){console.error(e);toast('No se pudo buscar el código');return false}}
      try{const q=await db.collection('compartidas')''')
rep("Además, si algo vence dentro de ese plazo (o venció en los últimos días sin marcarlo como pagado), te llega una notificación al celular esa mañana. Los días sin vencimientos cerca no te llega nada.",
    "${ME.backend==='claude'?'Además, si algo vence dentro de ese plazo (o venció en los últimos días sin marcarlo como pagado), te llega una notificación al celular esa mañana. Los días sin vencimientos cerca no te llega nada.':'Si activás las notificaciones en Configuración, cuando abras la app te llega un aviso con lo que vence (una vez por día).'}")
rep("  ${ME.mode==='db'&&list.length?`<p class=\"muted small\"", "  ${list.length?`<p class=\"muted small\"")
rep("  loadSample:()=>ME.mode==='db'?loadSampleIntoDb():toast('Ya estás viendo datos de ejemplo'),", "  loadSample:()=>loadSampleIntoDb(),")

# ---------- Actions + hash ----------
rep("  closeSheet:()=>closeSheet(),\n};", """  closeSheet:()=>closeSheet(),
  theme:d=>setTheme(d.k),
  applyUpdate:()=>applyUpdate(),
  checkUpdate:()=>checkUpdate(),
  install:()=>doInstall(),
  editName:()=>openNameSheet(),
  changePw:()=>openNewPasswordSheet(false),
  logout:(d,btn)=>confirmBtn(btn,async()=>{try{await BK.auth.signOut()}catch(e){}location.reload()},'Tocá de nuevo para cerrar sesión'),
  goLogin:()=>{store('cc-noauth',false);location.reload()},
  noAuth:()=>{store('cc-noauth',true);location.reload()},
  authTab:d=>{AUTH.tab=d.k;AUTH.err='';AUTH.ok='';render()},
  forgot:()=>forgotPassword(),
};""")
rep("{const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h))UI.tab=h}",
    "{const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h)||h==='config')UI.tab=h}")
rep("document.addEventListener('change',e=>{if(e.target.id==='set-cur')",
    "document.addEventListener('change',e=>{if(e.target.id==='cfg-notif'){toggleNotif(e.target.checked,e.target);return}if(e.target.id==='cfg-days'){write(()=>B.saveSettings({...S.settings,notif:{...notifCfg(),days:+e.target.value}}),'Anticipación: '+leadLabel(+e.target.value).toLowerCase());return}if(e.target.id==='set-cur')")

# ---------- New code ----------
rep("boot();\n</script>", open(sys.argv[3], encoding='utf-8').read() + "\nboot();\n</script>")

open(dst, 'w', encoding='utf-8').write(s)
print('ok', len(s))
