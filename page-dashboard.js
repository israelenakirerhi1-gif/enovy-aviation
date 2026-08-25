function gateOut(){
  document.getElementById('gate').innerHTML = `
    <div class="wrap">
      <div class="gate-msg">
        <h2>Log in required</h2>
        <p>Please log in to view your bookings.</p>
        <a class="btn btn-primary" href="login.html?next=dashboard.html">Log In</a>
      </div>
    </div>`;
}

async function init(){
  if(!isLoggedIn()){ gateOut(); return; }

  const user = getUser();
  document.getElementById('whoName').textContent = user.name;
  document.getElementById('whoEmail').textContent = user.email;
  document.getElementById('dashShell').style.display = '';

  const wrap = document.getElementById('bookingsWrap');
  try{
    const { bookings } = await api('/bookings/me');
    if(bookings.length === 0){
      wrap.innerHTML = `<div class="empty-state">You have no bookings yet. <a href="index.html">Book a flight</a></div>`;
      return;
    }
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Ref</th><th>Route</th><th>Depart</th><th>Seats</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${bookings.map(rowHTML).join('')}
        </tbody>
      </table>`;
  }catch(e){
    if(e.status === 401 || e.status === 403){ clearSession(); gateOut(); return; }
    wrap.innerHTML = `<div class="empty-state">Could not load your bookings right now.</div>`;
  }
}

function rowHTML(b){
  const f = b.flight || {};
  return `
    <tr>
      <td><b>${b.ref}</b></td>
      <td>${escapeHTML(f.origin||'-')} &rarr; ${escapeHTML(f.destination||'-')}</td>
      <td>${formatDateTime(f.departTime)}</td>
      <td>${b.seats}</td>
      <td>${money(b.totalPrice)}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
      <td>${b.status === 'confirmed' ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.id})">Cancel</button>` : '&mdash;'}</td>
    </tr>`;
}

async function cancelBooking(id){
  if(!confirm('Cancel this booking?')) return;
  try{
    await api('/bookings/' + id, { method: 'DELETE' });
    showToast('Booking cancelled');
    init();
  }catch(e){
    showToast(e.message, true);
  }
}

init();
