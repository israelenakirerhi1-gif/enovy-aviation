document.getElementById('loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const errBox = document.getElementById('formError');
  errBox.classList.remove('show');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try{
    const { token, user } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setSession(token, user);
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    window.location.href = next ? decodeURIComponent(next) : (user.role === 'admin' ? 'admin.html' : 'dashboard.html');
  }catch(err){
    errBox.textContent = err.message;
    errBox.classList.add('show');
  }
});
