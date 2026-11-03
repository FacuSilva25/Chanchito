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
      <button class="row tap" data-act="importSheet"><span>Importar planilla (Excel o CSV)</span><span class="val" style="display:flex;align-items:center;gap:4px">Elegir archivo${icon('right').replace('class="i"','class="i" style="width:14px;height:14px"')}</span></button>
      <button class="row tap" data-act="sheetTemplate"><span>Descargar planilla modelo</span><span class="val" style="display:flex;align-items:center;gap:4px">${icon('download').replace('class="i"','class="i" style="width:16px;height:16px"')}</span></button>
      <button class="row tap" data-act="exportData"><span>Descargar respaldo</span><span class="val" style="display:flex;align-items:center;gap:4px">${icon('download').replace('class="i"','class="i" style="width:16px;height:16px"')}</span></button>
    </div><div class="hint">Importar suma los movimientos del archivo a tu cuenta. Si importás el mismo archivo dos veces, no se duplica. La planilla puede ser un Excel (.xlsx) o un CSV con columnas como Fecha, Descripción, Categoría y Monto.</div></section>
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

/* Importar planilla: Excel (.xlsx) o CSV.
   Lee el archivo en el navegador (sin librerías), reconoce las columnas por el encabezado
   y arma movimientos con ids fijos, así importar el mismo archivo dos veces no duplica. */
const XU={
  unesc:s=>String(s).replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi,(m,e)=>{const l=e.toLowerCase();return l==='lt'?'<':l==='gt'?'>':l==='amp'?'&':l==='quot'?'"':l==='apos'?"'":String.fromCodePoint(l[1]==='x'?parseInt(l.slice(2),16):+l.slice(1))}),
  attr(tag,n){const m=tag.match(new RegExp('\\s'+n+'="([^"]*)"'));return m?XU.unesc(m[1]):null},
  text(x){let o='';String(x).replace(/<rPh\b[\s\S]*?<\/rPh>/g,'').replace(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g,(m,t)=>{o+=t;return m});return XU.unesc(o)},
};
async function unzipFile(buf){
  const u8=new Uint8Array(buf),dv=new DataView(buf);let e=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-65558);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break}
  if(e<0)throw new Error('zip');
  const files={};let p=dv.getUint32(e+16,true);const n=dv.getUint16(e+10,true);
  for(let k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)throw new Error('zip');
    const nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true);
    files[new TextDecoder().decode(u8.subarray(p+46,p+46+nl))]={method:dv.getUint16(p+10,true),size:dv.getUint32(p+20,true),off:dv.getUint32(p+42,true)};
    p+=46+nl+xl+cl;
  }
  return async name=>{const f=files[name];if(!f)return null;
    const start=f.off+30+dv.getUint16(f.off+26,true)+dv.getUint16(f.off+28,true);const data=u8.subarray(start,start+f.size);
    if(f.method===0)return new TextDecoder().decode(data);
    if(f.method!==8||typeof DecompressionStream==='undefined')throw new Error('zip');
    return new TextDecoder().decode(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer())};
}
async function readXlsx(buf){
  const read=await unzipFile(buf);const wb=await read('xl/workbook.xml');if(!wb)throw new Error('xlsx');
  const rel={};((await read('xl/_rels/workbook.xml.rels'))||'').replace(/<Relationship\b[^>]*>/g,t=>{rel[XU.attr(t,'Id')]=XU.attr(t,'Target');return t});
  const ss=[];((await read('xl/sharedStrings.xml'))||'').replace(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g,(m,x)=>{ss.push(x?XU.text(x):'');return m});
  const out=[];
  for(const t of wb.match(/<sheet\b[^>]*>/g)||[]){
    let target=rel[XU.attr(t,'r:id')];if(!target)continue;
    target=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');
    const x=await read(target);if(!x)continue;const rows=[];
    x.replace(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g,(m,ra,body)=>{if(!body)return m;
      const row=[];
      body.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,(m2,ca,cb)=>{if(!cb)return m2;
        const ref=XU.attr(ca,'r'),ty=XU.attr(ca,'t');let ci=row.length;
        if(ref&&/^[A-Z]+/.test(ref)){ci=0;for(const ch of ref.match(/^[A-Z]+/)[0])ci=ci*26+ch.charCodeAt(0)-64;ci--}
        const v=(cb.match(/<v>([\s\S]*?)<\/v>/)||[])[1];
        row[ci]=ty==='s'?ss[+v]:ty==='inlineStr'?XU.text(cb):ty==='str'?(v==null?'':XU.unesc(v)):ty==='e'?null:ty==='b'?v==='1':(v==null||v===''?null:+v);
        return m2});
      rows[(+XU.attr(ra,'r')||rows.length+1)-1]=row;return m});
    out.push({name:XU.attr(t,'name')||'Hoja',rows:Array.from(rows,r=>r||[])});
  }
  return out;
}
function parseCSV(text){
  text=text.replace(/^﻿/,'');const first=text.split(/\r?\n/).find(l=>l.trim())||'';
  const d=['\t',';',','].map(c=>[c,first.split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"'&&f.trim()==='')q=true;
    else if(c===d){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}
    else f+=c}
  if(f!==''||row.length){row.push(f);rows.push(row)}
  return rows;
}
const nrm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9/$ ]+/g,' ').replace(/\s+/g,' ').trim();
const IMP_HDR={
  date:/^(fecha|fecha de (compra|pago|operacion|consumo)|dia|date)$/,
  cuotaAmt:/^(monto|importe|valor) (de la )?cuota$/,
  amount:/^(monto|importe|valor|total|precio|gasto|amount|\$|monto total|importe total|monto \$|importe \$)$/,
  cuotas:/^(cuotas?|n cuotas|cant cuotas|cantidad de cuotas)$/,
  cat:/^(categorias?|rubro|category)$/,
  sub:/^(sub ?categorias?|subrubro)$/,
  desc:/^(descripcion|concepto|detalle|motivo|comercio|description)$/,
  obs:/^(observaciones?|notas?|comentarios?)$/,
  type:/^(tipo|tipo de movimiento|movimiento|type)$/,
  credit:/^(credito|prestamo|creditos|prestamos)$/,
  current:/^(cuota actual|n cuota|numero de cuota)$/,
  left:/^(cuotas restantes|restantes|cuotas pendientes)$/,
  endDate:/^(fecha (de )?(finalizacion|fin)|vencimiento hasta|ultima cuota)$/,
};
function findHeader(rows){
  for(let r=0;r<Math.min(rows.length,15);r++){
    const h={};(rows[r]||[]).forEach((v,i)=>{const n=nrm(v);if(!n)return;for(const[k,re]of Object.entries(IMP_HDR))if(h[k]==null&&re.test(n)){h[k]=i;break}});
    if(h.credit!=null&&(h.cuotaAmt!=null||h.amount!=null))return{row:r,h,table:'creditos'};
    if(h.date!=null&&(h.amount!=null||h.cuotaAmt!=null))return{row:r,h,table:'movs'};
  }
  return null;
}
function impDate(v){
  if(v==null||v==='')return null;let y,m,d;
  if(v instanceof Date){y=v.getFullYear();m=v.getMonth()+1;d=v.getDate()}
  else if(typeof v==='number'){if(v<20000||v>80000)return null;const t=new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5);y=t.getUTCFullYear();m=t.getUTCMonth()+1;d=t.getUTCDate()}
  else{const s=String(v).trim();let k;
    if(k=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)){y=+k[1];m=+k[2];d=+k[3]}
    else if(k=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?!\d)/)){d=+k[1];m=+k[2];y=+k[3];if(y<100)y+=2000}
    else if(/^\d{5}(\.\d+)?$/.test(s))return impDate(+s);
    else return null}
  if(!(y>=1990&&y<=2100&&m>=1&&m<=12&&d>=1&&d<=31))return null;
  const M=y+'-'+pad(m);return M+'-'+pad(Math.min(d,daysIn(M)));
}
const impAmount=v=>typeof v==='number'?v:typeof v==='boolean'||v==null?NaN:(()=>{const s=String(v).trim();const neg=/^\(.*\)$/.test(s);const n=parseAmount(s);return neg?-Math.abs(n):n})();
function impHash(s){let h1=0x811c9dc5,h2=0x01000193;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,16777619);h2=Math.imul(h2^c,2246822519)}return(h1>>>0).toString(36)+(h2>>>0).toString(36)}
const IMP_ALIAS={super:'supermercado verduleria carniceria polleria fiambreria panaderia dietetica almacen chino mayorista',delivery:'pedidosya pedidos ya rappi delivery',servicios:'luz gas internet agua telefono celular cable',suscripciones:'streaming netflix spotify disney youtube',transporte:'uber sube taxi cabify nafta combustible colectivo tren peaje estacionamiento didi',salud:'farmacia medico obra social prepaga',hogar:'casa blanqueria limpieza ferreteria',vivienda:'alquiler expensas',regalos:'regalo regalos',mascotas:'mascota mascotas veterinaria',ropa:'ropa zapatillas',salidas:'salidas salida'};
const isCardPay=(...xs)=>xs.some(x=>/^pago (de (la )?)?tarjeta/.test(nrm(x)));
function analyzeSheets(sheets){
  const ex=expCats(),inc=catsFor('inc');const newCats=new Map();
  const byName=(list,name)=>{const n=nrm(name);return n?list.find(c=>nrm(c.name)===n||c.id===n):null};
  const alias=n=>{n=nrm(n);if(!n)return null;for(const[id,words]of Object.entries(IMP_ALIAS))if((' '+words+' ').includes(' '+n+' ')){const c=ex.find(c=>c.id===id);if(c)return c}return null};
  const expCat=(cat,sub)=>{
    const c=byName(ex,sub)||alias(sub)||byName(ex,cat)||alias(cat);if(c)return c;
    const name=String(cat||sub||'').trim();if(!name)return ex.find(c=>c.id==='otros')||ex[0]||{id:'otros',name:'Otros'};
    const key=nrm(name);if(!newCats.has(key))newCats.set(key,{id:'c-'+key.replace(/[^a-z0-9]+/g,'-').slice(0,30),name:cap(name.slice(0,30)),color:COLORS[(ex.length+newCats.size)%10],icon:'tag',custom:true});
    return newCats.get(key)};
  const incCat=(...xs)=>{for(const x of xs){const c=byName(inc,x);if(c)return c}
    const t=nrm(xs.join(' '));return(/sueldo|salario|haberes|aguinaldo/.test(t)&&inc.find(c=>c.id==='sueldo'))||inc.find(c=>c.id==='otros-ing')||inc[0]||{id:'otros-ing',name:'Otro ingreso'}};
  const res=[];
  for(const sh of sheets){
    const f=findHeader(sh.rows);if(!f)continue;
    const{h}=f;const get=(r,k)=>h[k]==null?null:r[h[k]];const str=(r,k)=>{const v=get(r,k);return v==null?'':String(v).trim()};
    const sname=nrm(sh.name);const movs=[];let skipped=0;const seen={};
    const add=(m,key)=>{seen[key]=(seen[key]||0)+1;movs.push({...m,id:'imp-'+impHash(sh.name+'|'+key+'|'+seen[key])})};
    const body=sh.rows.slice(f.row+1);
    if(f.table==='creditos'){
      for(const r of body){
        const name=str(r,'credit');const amt=Math.abs(impAmount(get(r,'cuotaAmt')??get(r,'amount')));
        if(!name&&!(amt>0))continue;if(!name||!(amt>0)){skipped++;continue}
        const endD=impDate(get(r,'endDate'));const left=parseInt(get(r,'left'))||0;
        const end=endD?endD.slice(0,7):left>0?addM(NOW_M,left-1):null;if(end&&end<NOW_M){skipped++;continue}
        const day=endD?endD.slice(8,10):'10';const date=NOW_M+'-'+pad(Math.min(+day,daysIn(NOW_M)));const c=expCat('Créditos');
        add({kind:'fijo',amount:amt,desc:'Cuota '+name,cat:c.id,catName:c.name,date,due:date,month:NOW_M,rec:true,end},['cred',nrm(name),amt].join('|'));
      }
      res.push({name:sh.name,credit:true,movs,skipped});continue;
    }
    const card=h.cuotaAmt!=null||/tarjeta|visa|master|amex|credito/.test(sname);
    const incomeSheet=!card&&/ingreso|sueldo|cobro/.test(sname);
    const rows=[];
    for(const r of body){
      if(!r.some(v=>v!=null&&String(v).trim()!==''))continue;
      const date=impDate(get(r,'date'));const amt=impAmount(get(r,h.cuotaAmt!=null?'cuotaAmt':'amount'));
      if(!date||!isFinite(amt)||amt===0){if(get(r,'date')!=null||get(r,'amount')!=null||get(r,'cuotaAmt')!=null)skipped++;continue}
      rows.push({r,date,amt})}
    const signed=!card&&!incomeSheet&&h.type==null&&rows.some(x=>x.amt<0);
    for(const{r,date,amt}of rows){
      const cat=str(r,'cat'),sub=str(r,'sub');const desc0=str(r,'desc')||sub||cat;const ty=nrm(get(r,'type'));
      let kind=incomeSheet?'ingreso':'variable';
      if(ty&&!card){if(/ingreso|cobro|sueldo|entrada|credito a favor/.test(ty))kind='ingreso';else if(/fijo/.test(ty))kind='fijo';else if(/ahorro/.test(ty)){skipped++;continue}}
      else if(signed)kind=amt>0?'ingreso':'variable';
      const base={notif:null,goal:null,end:null,skip:[],rec:false,due:null,paid:[]};
      if(kind==='ingreso'){const c=incCat(cat,sub,desc0);add({...base,kind,amount:Math.abs(amt),desc:desc0||c.name,cat:c.id,catName:c.name,date,month:date.slice(0,7)},[kind,date,nrm(desc0),amt].join('|'));continue}
      const c=expCat(cat,sub);const cp=isCardPay(cat,sub,desc0);
      const desc=desc0||c.name;
      const cs=String(get(r,'cuotas')??'').trim();let from=1,total=1,k;
      if(k=cs.match(/^(\d+)\s*(?:\/|de)\s*(\d+)/)){from=+k[1];total=+k[2]}else if(+cs>1)total=Math.min(Math.floor(+cs),72);
      if(from<1||from>total)from=1;
      if(card||(kind==='variable'&&total>1)){
        const per=h.cuotaAmt!=null?Math.abs(amt):Math.abs(amt)/(total-from+1);
        for(let i=from;i<=total;i++){const M=addM(date.slice(0,7),i-from);const d=M+'-'+pad(Math.min(+date.slice(8,10),daysIn(M)));
          add({...base,kind:'variable',amount:Math.round(per*100)/100,desc:total>1?`${desc} (cuota ${i}/${total})`:desc,cat:c.id,catName:c.name,date:d,month:M,cardPay:cp},['card',date,nrm(desc0),amt,i].join('|'))}
      }else add({...base,kind,amount:Math.abs(amt),desc,cat:c.id,catName:c.name,date,month:date.slice(0,7),due:kind==='fijo'?date:null,paid:kind==='fijo'?[date.slice(0,7)]:[],cardPay:cp},[kind,date,nrm(desc0),amt].join('|'));
    }
    res.push({name:sh.name,movs,skipped,card});
  }
  return{sheets:res,newCats:[...newCats.values()]};
}
function pickSheet(){const i=document.createElement('input');i.type='file';i.accept='.xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';i.onchange=()=>{if(i.files[0])importSheetFile(i.files[0])};i.click()}
async function importSheetFile(file){
  let sheets;
  try{
    const buf=await file.arrayBuffer();const u8=new Uint8Array(buf);
    if(u8[0]===0x50&&u8[1]===0x4b)sheets=await readXlsx(buf);
    else if(/\.xls$|\.ods$|\.numbers$/i.test(file.name)||(u8[0]===0xd0&&u8[1]===0xcf)){toast('Guardá la planilla como .xlsx o .csv y probá de nuevo');return}
    else{let t=new TextDecoder().decode(u8);if(t.includes('�'))t=new TextDecoder('windows-1252').decode(u8);sheets=[{name:file.name.replace(/\.[^.]+$/,''),rows:parseCSV(t)}]}
  }catch(e){console.error(e);toast('No pude leer ese archivo. Probá guardarlo como .xlsx o .csv');return}
  openSheetImport(file.name,analyzeSheets(sheets));
}
function openSheetImport(fname,an){
  const all=an.sheets.flatMap(s=>s.movs);const hasCard=an.sheets.some(s=>s.card&&s.movs.some(m=>!m.cardPay));const nPay=all.filter(m=>m.cardPay).length;
  const st={skipPay:hasCard&&nPay>0};
  const list=accs().filter(a=>a.scope==='p'||(a.members||[]).includes(ME.uid));const accId=UI.acc!=='all'&&S.accounts[UI.acc]?UI.acc:(list[0]?.id||'');
  const help=`<div class="hint" style="padding-top:0">Reconozco planillas con una fila de títulos como <b>Fecha</b>, <b>Descripción</b> o <b>Concepto</b>, <b>Categoría</b>, <b>Subcategoría</b> y <b>Monto</b> (o Importe). Opcionales: <b>Tipo</b> (Gasto, Ingreso o Fijo) y, para tarjeta, <b>Cuotas</b> y <b>Monto cuota</b>. Una pestaña que se llame Ingresos se carga como ingresos, y una tabla con <b>Crédito</b>, <b>Valor cuota</b> y <b>Cuotas restantes</b> se carga como gasto fijo hasta la última cuota. En Configuración podés bajar una planilla modelo.</div>`;
  if(!all.length){
    const empty=an.sheets.length?`Encontré ${an.sheets.length===1?'la pestaña':'las pestañas'} ${an.sheets.map(s=>'<b>'+esc(s.name)+'</b>').join(', ')}, pero todavía no tienen filas con fecha y monto.`:'No encontré ninguna tabla con columnas de fecha y monto.';
    openSheet({title:'Importar planilla',saveLabel:'Listo',onSave:()=>true,body:`<p class="muted" style="margin:0">${esc(fname)}</p><div class="group"><div class="row" style="white-space:normal;padding-block:12px"><span style="white-space:normal">${empty}</span></div></div>${help}`});return}
  const pick=()=>all.filter(m=>!(st.skipPay&&m.cardPay));
  const months=[...new Set(all.map(m=>m.month))].sort();
  const pl=(n,a,b)=>n+' '+(n===1?a:b);
  const sheetRow=s=>{const ms=s.movs.filter(m=>!(st.skipPay&&m.cardPay));if(!ms.length)return'';
    const inc=ms.filter(m=>m.kind==='ingreso'),exp=ms.filter(m=>m.kind!=='ingreso');const tot=l=>l.reduce((t,m)=>t+m.amount,0);
    const what=s.credit?pl(ms.length,'cuota de crédito (gasto fijo hasta que termina)','cuotas de créditos (gasto fijo hasta que terminan)')
      :s.card?pl(ms.length,'cuota de tarjeta','cuotas de tarjeta (cada una en su mes)')
      :inc.length&&exp.length?pl(inc.length,'ingreso','ingresos')+' y '+pl(exp.length,'gasto','gastos'):inc.length?pl(inc.length,'ingreso','ingresos'):pl(exp.length,'gasto','gastos');
    const sk=s.skipped+(ms.length<s.movs.length?s.movs.length-ms.length:0);
    return `<div class="row" style="white-space:normal;padding-block:10px;align-items:flex-start"><span style="display:flex;flex-direction:column;flex:1;min-width:0"><span>${esc(s.name)}</span><span class="muted small">${what}${sk?' · '+pl(sk,'fila salteada','filas salteadas'):''}</span></span><span class="val num" style="text-align:right">${inc.length?'<span style="color:var(--c-green)">+'+money(tot(inc))+'</span>'+(exp.length?'<br>':''):''}${exp.length?money(tot(exp)):''}</span></div>`};
  const body=`<p class="muted" style="margin:0">${esc(fname)} · ${months.length>1?mLabel(months[0])+' a '+mLabel(months.at(-1)):mLabel(months[0])}</p>
    <div><div class="g-label">Lo que encontré</div><div class="group" id="imp-found"></div><div class="hint" id="imp-dup" hidden></div></div>
    ${nPay?`<div class="group"><label class="row" style="white-space:normal"><span style="white-space:normal;flex:1">Saltear los pagos de tarjeta (${nPay})</span><input id="imp-pay" type="checkbox" class="switch" ${st.skipPay?'checked':''}></label></div><div class="hint" style="padding-top:0">${hasCard?'Como también importo las compras con tarjeta, cargar el pago las contaría dos veces.':'Dejalo apagado si no cargás las compras con tarjeta una por una.'}</div>`:''}
    <div class="hint" id="imp-cats" style="padding-top:0" hidden></div>
    <div class="group">${list.length?`<label class="row"><span>Cuenta</span><select id="imp-acc">${list.map(a=>`<option value="${a.id}" ${a.id===accId?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label>`:'<div class="row"><span>Cuenta</span><span class="val">Personal (nueva)</span></div>'}</div>
    <div class="hint" style="padding-top:0">Si importás el mismo archivo otra vez, solo se suman las filas nuevas. Las compras en cuotas aparecen en cada mes con su cuota.</div>`;
  const usedNew=ms=>{const u=new Set(ms.map(m=>m.cat));return an.newCats.filter(c=>u.has(c.id)&&!expCats().some(x=>x.id===c.id))};
  const refresh=()=>{const ms=pick();const a=S.accounts[$('#imp-acc')?.value];const old=a?ms.filter(m=>a.movs?.[m.id]).length:0;
    $('#imp-found').innerHTML=an.sheets.map(sheetRow).join('');
    const d=$('#imp-dup');d.hidden=!old;d.textContent=old===ms.length?'Todo esto ya estaba cargado en esa cuenta, así que no se va a duplicar.':`${pl(old,'movimiento ya estaba cargado','movimientos ya estaban cargados')} y no se ${old===1?'duplica':'duplican'}.`;
    const nc=usedNew(ms);const c=$('#imp-cats');c.hidden=!nc.length;c.innerHTML=`Voy a crear ${nc.length===1?'esta categoría':'estas categorías'}: ${nc.map(c=>'<b>'+esc(c.name)+'</b>').join(', ')}. Después las podés editar.`;
    $('#sheet-save').textContent=ms.length-old?`Importar (${ms.length-old})`:'Importar'};
  openSheet({title:'Importar planilla',saveLabel:'Importar',body,onSave:async()=>{
    const ms=pick();if(!ms.length){toast('No queda nada para importar');return false}
    let a=S.accounts[$('#imp-acc')?.value];let created=null;
    if(!a){created={id:newId(),name:'Personal',color:'blue',scope:'p',created:Date.now()};a={...created,movs:{},metas:{}}}
    const nc=usedNew(ms);
    const ok=await write(async()=>{
      if(created){await B.putAccount(created);a=S.accounts[created.id]||a}
      if(nc.length){const l=expCats().slice();const oi=l.findIndex(c=>c.id==='otros');oi>=0?l.splice(oi,0,...nc):l.push(...nc);await B.saveSettings({...S.settings,expCats:l})}
      const now=Date.now();
      for(const m of ms){const{cardPay,...body}=m;const old=a.movs?.[m.id];await B.putMov(a,{...body,paid:old?.paid||body.paid,skip:old?.skip||body.skip,by:ME.uid||null,created:old?.created||now})}
    });
    if(ok){toast(`Listo: se importaron ${pl(ms.length,'movimiento','movimientos')}`);UI.acc=a.id;store('cc-acc',UI.acc);UI.month=months.includes(NOW_M)?NOW_M:months.at(-1);schedule()}
    return ok}});
  const sw=$('#imp-pay');if(sw)sw.onchange=()=>{st.skipPay=sw.checked;refresh()};
  const sel=$('#imp-acc');if(sel)sel.onchange=refresh;
  refresh();
}
function downloadSheetTemplate(){
  const rows=[['Fecha','Tipo','Categoría','Subcategoría','Descripción','Monto','Cuotas'],
    [TODAY_S.split('-').reverse().join('/'),'Ingreso','Sueldo','','Sueldo','850000',''],
    [TODAY_S.split('-').reverse().join('/'),'Gasto','Supermercado','','Compra del mes','95000',''],
    [TODAY_S.split('-').reverse().join('/'),'Fijo','Servicios','Luz','Edenor','28000',''],
    [TODAY_S.split('-').reverse().join('/'),'Gasto','Hogar','','Heladera en cuotas','600000','6']];
  const csv='﻿'+rows.map(r=>r.map(v=>/[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v).join(';')).join('\r\n');
  const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const l=document.createElement('a');l.href=u;l.download='chanchito-planilla-modelo.csv';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);
  toast('Planilla modelo descargada');
}

initSW();
if(BK&&BK.auth&&BK.auth.recovery)setTimeout(()=>{if(ME.mode==='db')openNewPasswordSheet(true)},1500);
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if((TABS.some(t=>t[0]===h)||h==='config')&&h!==UI.tab){UI.tab=h;render();window.scrollTo({top:0})}});
