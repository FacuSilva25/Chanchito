/* ---------- PWA: login, configuración, tema, notificaciones, actualizaciones ---------- */
const UPD={reg:null,waiting:null,version:null,newVersion:null,notes:'',checking:false,applying:false,installEvt:null};
const AUTH={tab:'in',email:''};
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

function viewAuth(){
  const up=AUTH.tab==='up';
  return `<div class="auth">
    <img class="logo" src="icons/icon-192.png" alt="">
    <h1>Chanchito</h1><p class="sub">Tus finanzas del mes, en orden.</p>
    <div class="seg" role="group" aria-label="Cuenta"><button type="button" data-act="authTab" data-k="in" aria-pressed="${!up}">Ingresar</button><button type="button" data-act="authTab" data-k="up" aria-pressed="${up}">Crear cuenta</button></div>
    <form id="auth-form" novalidate>
      <div class="group">
        ${up?`<label class="row"><span>Nombre</span><input id="a-name" autocomplete="name" placeholder="Cómo te llamás" maxlength="40"></label>`:''}
        <label class="row"><span>Usuario</span><input id="a-email" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="tu@email.com" value="${esc(AUTH.email)}"></label>
        <label class="row"><span>Contraseña</span><input id="a-pw" type="password" autocomplete="${up?'new-password':'current-password'}" placeholder="${up?'Mínimo 6 caracteres':'Tu contraseña'}"></label>
      </div>
      <p id="auth-msg" class="err" role="alert" hidden></p>
      <button class="btn" type="submit" id="auth-go">${up?'Crear cuenta':'Ingresar'}</button>
    </form>
    <div class="links">${up?'':'<button type="button" class="link-plain" data-act="forgot">Olvidé mi contraseña</button>'}
      <button type="button" class="link-plain" style="color:var(--label-2);font-weight:400;font-size:14px" data-act="noAuth">Usar sin cuenta, solo en este dispositivo</button></div>
  </div>`}
function authMsg(t,ok){const m=$('#auth-msg');if(!m)return;m.hidden=!t;m.textContent=t||'';m.className=ok?'ok':'err'}
const AUTH_ERR={bad_login:'Usuario o contraseña incorrectos.',exists:'Ya hay una cuenta con ese email. Tocá Ingresar.',not_confirmed:'Todavía no confirmaste tu email. Revisá tu correo (y la carpeta de spam).',
  weak:'La contraseña tiene que tener al menos 6 caracteres.',same:'La contraseña nueva tiene que ser distinta de la anterior.',rate:'Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.',network:'No hay conexión. Revisá internet y probá de nuevo.'};
const authErr=e=>AUTH_ERR[e&&e.code]||'No se pudo completar. Probá de nuevo.';
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
document.addEventListener('submit',async e=>{
  if(e.target.id!=='auth-form')return;e.preventDefault();
  const up=AUTH.tab==='up';const email=$('#a-email').value.trim();const pw=$('#a-pw').value;const name=up?$('#a-name').value.trim():'';
  AUTH.email=email;
  if(up&&!name){authMsg('Escribí tu nombre.');shake($('#a-name').closest('.row'));return}
  if(!validEmail(email)){authMsg('Escribí un email válido.');shake($('#a-email').closest('.row'));return}
  if(pw.length<6){authMsg(up?'La contraseña tiene que tener al menos 6 caracteres.':'Escribí tu contraseña.');shake($('#a-pw').closest('.row'));return}
  const btn=$('#auth-go');btn.disabled=true;btn.textContent='Un momento…';authMsg('');
  try{
    if(up){const r=await BK.auth.signUp(email,pw,name);
      if(r.needsConfirm){AUTH.tab='in';render();authMsg('¡Cuenta creada! Te mandamos un mail para confirmarla. Abrí el link y después ingresá acá.',true);return}}
    else await BK.auth.signIn(email,pw);
    location.reload();
  }catch(err){console.error(err);authMsg(authErr(err));btn.disabled=false;btn.textContent=up?'Crear cuenta':'Ingresar'}
});
async function forgotPassword(){
  const email=($('#a-email')?.value||'').trim();AUTH.email=email;
  if(!validEmail(email)){authMsg('Escribí tu email arriba y tocá de nuevo "Olvidé mi contraseña".');$('#a-email')?.focus();return}
  try{await BK.auth.resetPassword(email);authMsg('Te mandamos un mail para elegir una contraseña nueva.',true)}catch(e){authMsg(authErr(e))}
}
let pwSheetOpen=false;
function openNewPasswordSheet(recovery){
  if(pwSheetOpen)return;pwSheetOpen=true;
  openSheet({title:recovery?'Elegí tu contraseña nueva':'Cambiar contraseña',saveLabel:'Guardar',
    body:`<div class="group"><label class="row"><span>Nueva</span><input id="pw1" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" data-autofocus></label>
      <label class="row"><span>Repetila</span><input id="pw2" type="password" autocomplete="new-password" placeholder="La misma otra vez"></label></div>
      <div class="hint">Vas a seguir con la sesión iniciada en este dispositivo.</div>`,
    onSave:async()=>{const a=$('#pw1').value,b=$('#pw2').value;
      if(a.length<6){shake($('#pw1').closest('.row'));toast('Mínimo 6 caracteres');return false}
      if(a!==b){shake($('#pw2').closest('.row'));toast('Las contraseñas no coinciden');return false}
      try{await BK.auth.changePassword(a);toast('Contraseña actualizada');pwSheetOpen=false;return true}catch(e){console.error(e);toast(authErr(e));return false}}});
  const r=$('#sheet-root');new MutationObserver((_,o)=>{if(r.hidden||!r.classList.contains('open')){pwSheetOpen=false;o.disconnect()}}).observe(r,{attributes:true});
}
function openNameSheet(){
  openSheet({title:'Tu nombre',body:`<div class="group"><label class="row"><span>Nombre</span><input id="nm" maxlength="40" value="${esc(myName())}" data-autofocus></label></div>
    <div class="hint">Es el nombre que ven las personas con las que compartís cuentas.</div>`,
    onSave:async()=>{const n=$('#nm').value.trim();if(!n){shake($('#nm').closest('.row'));return false}
      try{await BK.auth.saveName(n);delete PROF[ME.uid];toast('Nombre actualizado');schedule();return true}catch(e){console.error(e);toast('No se pudo guardar');return false}}});
}
const myName=()=>BK&&BK.auth?(BK.auth.name||BK.auth.email.split('@')[0]):'';

/* Tema */
const getTheme=()=>{const t=store('cc-theme');return t==='light'||t==='dark'?t:'auto'};
function setTheme(k){if(k==='light'||k==='dark'){store('cc-theme',k);document.documentElement.setAttribute('data-theme',k)}else{try{localStorage.removeItem('cc-theme')}catch(e){}document.documentElement.removeAttribute('data-theme')}schedule()}

/* Notificaciones */
const notifPerm=()=>('Notification' in window)?Notification.permission:'unsupported';
async function toggleNotif(on,el){
  if(on&&notifPerm()==='default'){try{await Notification.requestPermission()}catch(e){}}
  if(on&&notifPerm()==='denied')toast('El navegador tiene bloqueadas las notificaciones de Chanchito. Igual vas a ver los avisos adentro de la app.');
  const ok=await write(()=>B.saveSettings({...S.settings,notif:{...notifCfg(),on}}),on?'Notificaciones activadas':'Notificaciones apagadas');
  if(!ok&&el)el.checked=!on;
  if(on){notified=false;store('cc-notified',null);maybeNotify()}
}
let notified=false;
function dueText(o){return o.diff<0?`venció hace ${-o.diff} ${-o.diff===1?'día':'días'}`:o.diff===0?'vence hoy':o.diff===1?'vence mañana':`vence en ${o.diff} días`}
async function maybeNotify(){
  if(notified||isLoading()||ME.mode==='auth'||ME.backend==='claude')return;notified=true;
  if(!notifCfg().on||notifPerm()!=='granted'||store('cc-notified')===TODAY_S)return;
  const up=upcoming();if(!up.length)return;
  const body=up.length===1?`${up[0].desc}: ${dueText(up[0])} (${money(up[0].amount)}).`:`${up.length} gastos por vencer: `+up.slice(0,4).map(o=>`${o.desc} (${dueText(o)})`).join(', ')+(up.length>4?'…':'.');
  const opts={body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'chanchito-due',lang:'es-AR'};
  try{const reg=UPD.reg||(navigator.serviceWorker&&await navigator.serviceWorker.getRegistration());
    if(reg&&reg.showNotification)await reg.showNotification('Chanchito: vencimientos',opts);else new Notification('Chanchito: vencimientos',opts);
    store('cc-notified',TODAY_S)}catch(e){console.warn(e)}
}

/* Actualizaciones (service worker) */
function setWaiting(w){UPD.waiting=w;try{w.postMessage('GET_VERSION')}catch(e){}schedule()}
function initSW(){
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol)||window.claude)return;
  navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.type!=='VERSION')return;
    if(UPD.waiting&&e.source===UPD.waiting){UPD.newVersion=d.version;UPD.notes=d.notes||''}else UPD.version=d.version;schedule()});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(UPD.applying)location.reload()});
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
    UPD.reg=reg;
    if(reg.waiting&&navigator.serviceWorker.controller)setWaiting(reg.waiting);
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)setWaiting(w)})});
    navigator.serviceWorker.ready.then(r=>{(navigator.serviceWorker.controller||r.active)?.postMessage('GET_VERSION')});
    setInterval(()=>reg.update().catch(()=>{}),30*60*1000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})});
  }).catch(e=>console.warn('SW',e));
}
function applyUpdate(){
  if(!UPD.waiting)return checkUpdate();
  UPD.applying=true;toast('Actualizando…');UPD.waiting.postMessage('SKIP_WAITING');
  setTimeout(()=>location.reload(),4000);
}
async function checkUpdate(){
  if(!UPD.reg){toast(location.protocol.startsWith('http')?'Este navegador no permite actualizar la app desde acá. Recargá la página.':'Las actualizaciones funcionan cuando la app está publicada en internet.');return}
  if(UPD.checking)return;UPD.checking=true;schedule();
  try{await UPD.reg.update();
    for(let i=0;i<40&&!UPD.waiting&&UPD.reg.installing;i++)await new Promise(r=>setTimeout(r,150));
    if(UPD.reg.waiting&&!UPD.waiting)setWaiting(UPD.reg.waiting);
  }catch(e){console.warn(e)}
  UPD.checking=false;
  if(UPD.waiting)applyUpdate();else{toast('Ya tenés la última versión');schedule()}
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();UPD.installEvt=e;schedule()});
window.addEventListener('appinstalled',()=>{UPD.installEvt=null;toast('¡Chanchito quedó instalada!');schedule()});
async function doInstall(){const e=UPD.installEvt;if(!e)return;UPD.installEvt=null;e.prompt();try{await e.userChoice}catch(_){}schedule()}

function viewConfig(){
  const c=notifCfg();const th=getTheme();const perm=notifPerm();
  const ini=n=>esc((n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase());
  let cuenta;
  if(ME.backend==='app'&&ME.mode==='db'){const n=myName();
    cuenta=`<div class="group">
      <div class="me"><span class="li-ic" style="background:${col('pink')};width:52px;height:52px;border-radius:50%;font-weight:700;font-size:19px;color:#fff">${ini(n)}</span><div style="min-width:0"><div class="t">${esc(n)}</div><div class="muted small" style="overflow:hidden;text-overflow:ellipsis">${esc(BK.auth.email)}</div></div></div>
      <div class="row"><span>Usuario</span><span class="val">${esc(BK.auth.email)}</span></div>
      <button class="row tap" data-act="editName"><span>Nombre</span><span class="val" style="display:flex;align-items:center;gap:4px">${esc(n)}${icon('right').replace('class="i"','class="i" style="width:14px;height:14px"')}</span></button>
      <button class="row tap" data-act="changePw"><span>Contraseña</span><span class="val" style="display:flex;align-items:center;gap:4px">Cambiar${icon('right').replace('class="i"','class="i" style="width:14px;height:14px"')}</span></button>
    </div>
    <div class="group" style="margin-top:12px"><button class="row danger-row" data-act="logout">Cerrar sesión</button></div>`}
  else if(ME.backend==='claude')cuenta=`<div class="group"><div class="row"><span>Cuenta</span><span class="val">Tu cuenta de Claude</span></div></div>`;
  else cuenta=`<div class="group"><div class="row"><span>Cuenta</span><span class="val">Sin cuenta</span></div></div>
    <div class="hint">Tus datos quedan guardados solo en este dispositivo.${BK&&BK.configured?' Con una cuenta los ves en el celu y en la compu, y podés compartir cuentas con otras personas.':''}</div>
    ${BK&&BK.configured?'<div style="padding:12px 14px 0"><button class="btn sm" data-act="goLogin">Iniciar sesión o crear cuenta</button></div>':''}`;
  const permHint=perm==='denied'?'El navegador tiene bloqueadas las notificaciones. Para recibirlas, habilitalas en los permisos del sitio (el candado de la barra de direcciones, o Ajustes del celu → Apps → Chanchito).'
    :perm==='unsupported'?(isIOS()&&!isStandalone()?'En iPhone, primero instalá la app (Compartir → Agregar a inicio) para poder recibir notificaciones.':'Este navegador no permite notificaciones; vas a ver los avisos adentro de la app.')
    :'Cuando abrís la app te avisamos de los gastos fijos que vencen pronto, una vez por día. Los avisos también aparecen en la campanita.';
  const ver=UPD.version||(UPD.reg?'…':'—');
  const updStatus=UPD.waiting?`<b style="color:var(--accent)">Hay una versión nueva${UPD.newVersion?' ('+esc(UPD.newVersion)+')':''}</b>${UPD.notes?'<br><span class="muted small">'+esc(UPD.notes)+'</span>':''}`:UPD.checking?'Buscando…':'Estás en la última versión que conocemos.';
  return `<div class="cfg">
    <section><div class="g-label">Cuenta</div>${cuenta}</section>
    <section><div class="g-label">Apariencia</div><div class="group"><div class="row" style="flex-wrap:wrap;padding-block:8px"><span>Tema</span>
      <div class="seg" role="group" aria-label="Tema">${[['auto','Automático'],['light','Claro'],['dark','Oscuro']].map(([k,l])=>`<button data-act="theme" data-k="${k}" aria-pressed="${th===k}">${l}</button>`).join('')}</div></div></div>
      <div class="hint">Automático sigue el modo claro u oscuro de tu celu o compu.</div></section>
    <section><div class="g-label">Notificaciones</div><div class="group">
      <label class="row"><span>Notificaciones de vencimientos</span><input id="cfg-notif" type="checkbox" class="switch" ${c.on?'checked':''}></label>
      <label class="row" ${c.on?'':'hidden'}><span>Anticipación</span><select id="cfg-days">${LEADS.map(n=>`<option value="${n}" ${n===c.days?'selected':''}>${leadLabel(n)}</option>`).join('')}</select></label>
    </div><div class="hint">${permHint}</div></section>
    <section><div class="g-label">Actualizaciones</div><div class="group">
      <div class="row"><span>Versión</span><span class="val num">${esc(ver)}</span></div>
      <div class="row" style="padding-block:12px;flex-wrap:wrap"><span style="flex:1 1 200px">${updStatus}</span><button class="btn sm" data-act="${UPD.waiting?'applyUpdate':'checkUpdate'}" ${UPD.checking?'disabled':''}>${icon('download')}Actualizar</button></div>
    </div><div class="hint">Cuando sale una función nueva te aparece un aviso arriba. Tus datos no se tocan al actualizar.</div></section>
    ${UPD.installEvt||(isIOS()&&!isStandalone()&&location.protocol.startsWith('http'))?`<section><div class="g-label">Instalar</div><div class="group">
      ${UPD.installEvt?`<div class="row" style="padding-block:10px"><span>Instalar Chanchito en este dispositivo</span><button class="btn sm secondary" data-act="install">Instalar</button></div>`
        :'<div class="row" style="padding-block:10px;white-space:normal"><span style="flex:1;white-space:normal">En iPhone: tocá Compartir y después <b>Agregar a inicio</b>.</span></div>'}</div></section>`:''}
    <section><div class="g-label">Tus datos</div><div class="group">
      <button class="row tap" data-act="importData"><span>Importar respaldo</span><span class="val" style="display:flex;align-items:center;gap:4px">Elegir archivo${icon('right').replace('class="i"','class="i" style="width:14px;height:14px"')}</span></button>
      <button class="row tap" data-act="exportData"><span>Descargar respaldo</span><span class="val" style="display:flex;align-items:center;gap:4px">${icon('download').replace('class="i"','class="i" style="width:16px;height:16px"')}</span></button>
    </div><div class="hint">Importar suma los movimientos del archivo a tu cuenta. Si importás el mismo archivo dos veces, no se duplica.</div></section>
    <section><div class="g-label">Preferencias</div><div class="group">
      <button class="row tap" data-act="currency"><span>Moneda</span><span class="val">${CUR_NAMES[cur()]||cur()} (${cur()})</span></button>
      <button class="row tap" data-act="editCats"><span>Categorías</span><span class="val" style="display:flex;align-items:center;gap:4px">${expCats().length+catsFor('inc').length}${icon('right').replace('class="i"','class="i" style="width:14px;height:14px"')}</span></button>
    </div></section>
  </div>`}

/* Respaldo: exportar e importar datos */
function exportBackup(){
  const out={app:'chanchito',version:1,exported:TODAY_S,settings:S.settings,accounts:{}};
  for(const a of accs())out.accounts[a.id]={name:a.name,color:a.color,created:a.created,scope:a.scope,movs:a.movs,metas:a.metas};
  const blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'});
  const u=URL.createObjectURL(blob);const l=document.createElement('a');l.href=u;l.download=`chanchito-respaldo-${TODAY_S}.json`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);
  toast('Respaldo descargado');
}
function pickBackup(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{if(i.files[0])importBackup(i.files[0])};i.click()}
async function importBackup(file){
  let d;try{d=JSON.parse(await file.text())}catch(e){d=null}
  if(!d||typeof d.accounts!=='object'){toast('Ese archivo no es un respaldo de Chanchito');return}
  let nM=0,nA=0;
  const ok=await write(async()=>{
    if(d.settings&&typeof d.settings==='object')await B.saveSettings({...d.settings,...S.settings,expCats:S.settings.expCats||d.settings.expCats,incCats:S.settings.incCats||d.settings.incCats});
    for(const[id,a]of Object.entries(d.accounts)){
      if(!a||typeof a!=='object')continue;
      const acc={id,name:String(a.name||'Cuenta'),color:a.color||'blue',created:a.created||Date.now(),scope:'p'};
      if(!S.accounts[id]){await B.putAccount(acc);nA++}
      const t=S.accounts[id]||{...acc,movs:{},metas:{}};
      for(const[gid,g]of Object.entries(a.metas||{}))await B.putMeta(t,{...g,id:gid});
      for(const[mid,m]of Object.entries(a.movs||{})){await B.putMov(t,{...m,id:mid,by:ME.uid||null});nM++}
    }
  });
  if(ok){toast(`Listo: se importaron ${nM} movimientos${nA?' en '+nA+(nA===1?' cuenta':' cuentas'):''}`);UI.acc='all';schedule()}
}

initSW();
if(BK&&BK.auth&&BK.auth.recovery)setTimeout(()=>{if(ME.mode==='db')openNewPasswordSheet(true)},1500);
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if((TABS.some(t=>t[0]===h)||h==='config')&&h!==UI.tab){UI.tab=h;render();window.scrollTo({top:0})}});
