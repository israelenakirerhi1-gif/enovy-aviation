document.getElementById('registerForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const errBox = document.getElementById('formError');
  errBox.classList.remove('show');
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try{
    const { token, user } = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setSession(token, user);
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    window.location.href = next ? decodeURIComponent(next) : 'dashboard.html';
  }catch(err){
    errBox.textContent = err.message;
    errBox.classList.add('show');
  }
});
