function gateOut(msg){
  document.getElementById('gate').innerHTML = `
    <div class="wrap">
      <div class="gate-msg">
        <h2>Restricted area</h2>
        <p>${msg || 'You need an administrator account to view this page.'}</p>
        <a class="btn btn-primary" href="login.html?next=admin.html">Log In</a>
      </div>
    </div>`;
}

async function init(){
  if(!isLoggedIn()){ gateOut(); return; }
  const user = getUser();
  if(user.role !== 'admin'){ gateOut('This account does not have admin access.'); return; }

  document.getElementById('whoName').textContent = user.name;
  document.getElementById('dashShell').style.display = '';

  setupTabs();
  await Promise.all([loadStats(), loadUsers(), loadBookings(), loadFlights(), loadSupport()]);
}

function setupTabs(){
  document.querySelectorAll('.tab-link').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-link').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      document.getElementById('panel-' + tab).classList.add('active');
      document.getElementById('tabTitle').textContent = btn.textContent;
    });
  });
}

async function guarded(fn){
  try{ return await fn(); }
  catch(e){
    if(e.status === 401 || e.status === 403){ clearSession(); gateOut(); }
    else showToast(e.message, true);
  }
}

async function loadStats(){
  await guarded(async ()=>{
    const s = await api('/admin/stats');
    document.getElementById('statRow').innerHTML = `
      <div class="stat-box"><b>${s.totalUsers}</b><span>Total Users</span></div>
      <div class="stat-box"><b>${s.totalFlights}</b><span>Flights Listed</span></div>
      <div class="stat-box"><b>${s.activeBookings}</b><span>Active Bookings</span></div>
      <div class="stat-box"><b>${money(s.revenue)}</b><span>Revenue (Confirmed)</span></div>
      <div class="stat-box"><b>${s.openTickets}</b><span>Open Support Tickets</span></div>
    `;
  });
}

async function loadUsers(){
  await guarded(async ()=>{
    const { users } = await api('/admin/users');
    document.getElementById('usersBody').innerHTML = users.map(u => `
      <tr>
        <td>${escapeHTML(u.name)}</td>
        <td>${escapeHTML(u.email)}</td>
        <td><span class="badge badge-${u.role}">${u.role}</span></td>
        <td><span class="badge badge-${u.status}">${u.status}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
        <td>${u.role === 'admin' ? '&mdash;' : (
          u.status === 'active'
            ? `<button class="btn btn-danger btn-sm" onclick="setUserStatus(${u.id},'suspended')">Suspend</button>`
            : `<button class="btn btn-sky btn-sm" onclick="setUserStatus(${u.id},'active')">Reactivate</button>`
        )}</td>
      </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--steel);">No users yet.</td></tr>';
  });
}

async function setUserStatus(id, status){
  await guarded(async ()=>{
    await api('/admin/users/' + id + '/status', { method:'PATCH', body: JSON.stringify({ status }) });
    showToast('User updated');
    loadUsers();
  });
}

async function loadBookings(){
  await guarded(async ()=>{
    const { bookings } = await api('/admin/bookings');
    document.getElementById('bookingsBody').innerHTML = bookings.map(b => `
      <tr>
        <td><b>${b.ref}</b></td>
        <td>${b.user ? escapeHTML(b.user.name) : 'Unknown'}<br><span style="color:var(--steel);font-size:11.5px;">${b.user ? escapeHTML(b.user.email) : ''}</span></td>
        <td>${b.flight ? escapeHTML(b.flight.origin) + ' &rarr; ' + escapeHTML(b.flight.destination) : 'Unknown'}</td>
        <td>${b.seats}</td>
        <td>${money(b.totalPrice)}</td>
        <td><span class="badge badge-${b.status}">${b.status}</span></td>
        <td>${b.status === 'confirmed' ? `<button class="btn btn-danger btn-sm" onclick="cancelAnyBooking(${b.id})">Cancel</button>` : '&mdash;'}</td>
      </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--steel);">No bookings yet.</td></tr>';
  });
}

async function cancelAnyBooking(id){
  if(!confirm('Cancel this booking? Seats will be released back to the flight.')) return;
  await guarded(async ()=>{
    await api('/admin/bookings/' + id, { method:'DELETE' });
    showToast('Booking cancelled');
    loadBookings(); loadStats(); loadFlights();
  });
}

async function loadFlights(){
  await guarded(async ()=>{
    const { flights } = await api('/admin/flights');
    document.getElementById('flightsBody').innerHTML = flights.map(f => `
      <tr>
        <td><b>${escapeHTML(f.flightNo)}</b><br><span style="color:var(--steel);font-size:11.5px;">${escapeHTML(f.airline)}</span></td>
        <td>${escapeHTML(f.origin)} &rarr; ${escapeHTML(f.destination)}</td>
        <td>${formatDateTime(f.departTime)}</td>
        <td>${money(f.price)}</td>
        <td>${f.seatsAvailable} / ${f.seatsTotal}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteFlight(${f.id})">Delete</button></td>
      </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--steel);">No flights yet.</td></tr>';
  });
}

async function loadSupport(){
  await guarded(async ()=>{
    const { tickets } = await api('/admin/support');
    document.getElementById('supportBody').innerHTML = tickets.map(t => `
      <tr>
        <td>${escapeHTML(t.name)}</td>
        <td>${escapeHTML(t.email)}</td>
        <td style="max-width:280px;white-space:normal;">${escapeHTML(t.message)}</td>
        <td>${new Date(t.createdAt).toLocaleString('en-GB')}</td>
        <td><span class="badge badge-${t.status==='open'?'suspended':'active'}">${t.status}</span></td>
        <td>${t.status === 'open' ? `<button class="btn btn-sky btn-sm" onclick="resolveTicket(${t.id})">Mark Resolved</button>` : '&mdash;'}</td>
      </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--steel);">No support tickets yet &mdash; the chatbot opens one whenever it can\'t resolve something.</td></tr>';
  });
}

async function resolveTicket(id){
  await guarded(async ()=>{
    await api('/admin/support/' + id + '/status', { method:'PATCH', body: JSON.stringify({ status:'resolved' }) });
    showToast('Ticket marked resolved');
    loadSupport();
  });
}

function openFlightForm(){ document.getElementById('flightModal').style.display = 'flex'; }
function closeFlightForm(){ document.getElementById('flightModal').style.display = 'none'; }

document.getElementById('flightForm').addEventListener('submit', async e=>{
  e.preventDefault();
  await guarded(async ()=>{
    await api('/admin/flights', {
      method: 'POST',
      body: JSON.stringify({
        flightNo: document.getElementById('fFlightNo').value,
        airline: document.getElementById('fAirline').value,
        origin: document.getElementById('fOrigin').value,
        destination: document.getElementById('fDestination').value,
        departTime: document.getElementById('fDepart').value,
        arriveTime: document.getElementById('fArrive').value,
        price: document.getElementById('fPrice').value,
        seatsTotal: document.getElementById('fSeats').value
      })
    });
    showToast('Flight added');
    closeFlightForm();
    e.target.reset();
    loadFlights(); loadStats();
  });
});

async function deleteFlight(id){
  if(!confirm('Delete this flight? This cannot be undone.')) return;
  await guarded(async ()=>{
    await api('/admin/flights/' + id, { method: 'DELETE' });
    showToast('Flight deleted');
    loadFlights(); loadStats();
  });
}

init();
