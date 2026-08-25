/* ================= SESSION HELPERS ================= */
function getToken(){ return localStorage.getItem('enovy_token'); }
function getUser(){ try{ return JSON.parse(localStorage.getItem('enovy_user')||'null'); }catch(e){ return null; } }
function setSession(token, user){
  localStorage.setItem('enovy_token', token);
  localStorage.setItem('enovy_user', JSON.stringify(user));
}
function clearSession(){
  localStorage.removeItem('enovy_token');
  localStorage.removeItem('enovy_user');
}
function isLoggedIn(){ return !!getToken() && !!getUser(); }
function isAdmin(){ const u = getUser(); return !!u && u.role === 'admin'; }
function logout(){
  clearSession();
  window.location.href = 'index.html';
}

/* ================= API WRAPPER ================= */
async function api(path, options = {}){
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch('/api' + path, Object.assign({}, options, { headers }));
  let data = {};
  try{ data = await res.json(); }catch(e){ data = {}; }
  if(!res.ok){
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ================= NAV RENDERING ================= */
function renderNavRight(){
  const el = document.getElementById('navRight');
  if(!el) return;
  const user = getUser();
  if(!user){
    el.innerHTML = `
      <a href="login.html" class="btn btn-ghost btn-sm" style="border-color:rgba(255,255,255,.3);color:#fff;">Log In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;
    return;
  }
  el.innerHTML = `
    ${user.role === 'admin' ? '<a href="admin.html" class="pill">Admin</a>' : ''}
    <a href="dashboard.html" class="pill">Hi, <b>${escapeHTML(user.name.split(' ')[0])}</b></a>
    <button class="btn btn-ghost btn-sm" style="border-color:rgba(255,255,255,.3);color:#fff;" onclick="logout()">Log Out</button>
  `;
}

function highlightActiveNav(){
  const here = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.navlinks a').forEach(a=>{
    const href = (a.getAttribute('href')||'').split('#')[0];
    if(href === here) a.classList.add('active');
  });
}

function setupMobileMenu(){
  const header = document.querySelector('header');
  const nav = document.querySelector('.nav');
  if(!header || !nav || document.querySelector('.mobile-menu-btn')) return;

  const button = document.createElement('button');
  button.className = 'mobile-menu-btn';
  button.type = 'button';
  button.setAttribute('aria-label','Open navigation menu');
  button.setAttribute('aria-expanded','false');
  button.innerHTML = '&#9776;';

  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.innerHTML = `
    <a href="index.html">Book a Flight</a>
    <a href="flights.html">Flights</a>
    <a href="dashboard.html">My Bookings</a>
    <div class="mobile-auth" id="mobileAuth"></div>`;

  nav.appendChild(button);
  header.appendChild(menu);

  const auth = menu.querySelector('#mobileAuth');
  const user = getUser();
  if(user){
    auth.innerHTML = `${user.role === 'admin' ? '<a href="admin.html">Admin Dashboard</a>' : ''}<a href="dashboard.html">Hi, <b>${escapeHTML(user.name.split(' ')[0])}</b></a><button type="button" id="mobileLogout">Log Out</button>`;
    menu.querySelector('#mobileLogout').addEventListener('click', logout);
  }else{
    auth.innerHTML = '<a href="login.html">Log In</a><a href="register.html">Sign Up</a>';
  }

  const closeMenu = ()=>{
    menu.classList.remove('open');
    button.setAttribute('aria-expanded','false');
    button.innerHTML='&#9776;';
  };
  button.addEventListener('click', ()=>{
    const open = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    button.innerHTML = open ? '&times;' : '&#9776;';
  });
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeMenu));
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderNavRight();
  highlightActiveNav();
  setupMobileMenu();
});

/* ================= UTIL ================= */
function money(n){ return '\u20A6' + Number(n||0).toLocaleString('en-NG'); }
function formatDateTime(iso){
  if(!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatTime(iso){
  if(!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ================= TOAST ================= */
let toastTimer;
function showToast(msg, isError){
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.toggle('error', !!isError);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove('show'), 3000);
}

/* ================= PAGE GUARDS ================= */
function requireAuthOrRedirect(){
  if(!isLoggedIn()){
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    window.location.href = 'login.html?next=' + next;
    return false;
  }
  return true;
}
