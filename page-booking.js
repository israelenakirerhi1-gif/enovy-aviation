let currentFlight = null;

async function init(){
  const params = new URLSearchParams(location.search);
  const flightId = params.get('flightId');
  const section = document.getElementById('bookingSection');

  if(!flightId){
    section.innerHTML = `<div class="wrap"><div class="empty-state">No flight selected. <a href="index.html">Search flights</a></div></div>`;
    return;
  }

  let flight;
  try{
    const res = await api('/flights/' + flightId);
    flight = res.flight;
  }catch(e){
    section.innerHTML = `<div class="wrap"><div class="empty-state">That flight could not be found.</div></div>`;
    return;
  }
  currentFlight = flight;

  if(!isLoggedIn()){
    section.innerHTML = `
      <div class="wrap">
        <div class="gate-msg">
          <h2>Log in to book this flight</h2>
          <p>${escapeHTML(flight.origin)} &rarr; ${escapeHTML(flight.destination)} &middot; ${money(flight.price)} per passenger</p>
          <a class="btn btn-primary" href="login.html?next=${encodeURIComponent('booking.html?flightId='+flight.id)}">Log In</a>
          <div class="auth-switch">New here? <a href="register.html?next=${encodeURIComponent('booking.html?flightId='+flight.id)}">Create an account</a></div>
        </div>
      </div>`;
    return;
  }

  const user = getUser();
  section.innerHTML = `
    <div class="wrap">
      <div class="auth-wrap" style="max-width:480px;">
        <div class="eyebrow" style="margin-bottom:4px;">${escapeHTML(flight.flightNo)} &middot; ${escapeHTML(flight.airline)}</div>
        <h1 style="font-size:24px;">${escapeHTML(flight.origin)} &rarr; ${escapeHTML(flight.destination)}</h1>
        <p class="sub">${formatDateTime(flight.departTime)} &middot; ${money(flight.price)} per passenger &middot; ${flight.seatsAvailable} seats left</p>
        <div class="form-error" id="formError"></div>
        <form id="bookForm">
          <div class="field" style="margin-bottom:14px;"><label>Passenger name</label><input type="text" id="pName" value="${escapeHTML(user.name)}" required></div>
          <div class="field" style="margin-bottom:14px;"><label>Passenger email</label><input type="email" id="pEmail" value="${escapeHTML(user.email)}" required></div>
          <div class="field" style="margin-bottom:20px;"><label>Number of seats</label><input type="number" id="pSeats" min="1" max="${flight.seatsAvailable}" value="1" required></div>
          <button class="btn btn-primary btn-block" type="submit">Confirm Booking &middot; <span id="totalPriceLabel">${money(flight.price)}</span></button>
        </form>
      </div>
    </div>`;

  const seatsInput = document.getElementById('pSeats');
  seatsInput.addEventListener('input', ()=>{
    const n = Math.max(1, Number(seatsInput.value)||1);
    document.getElementById('totalPriceLabel').textContent = money(flight.price * n);
  });

  document.getElementById('bookForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const errBox = document.getElementById('formError');
    errBox.classList.remove('show');
    try{
      const { booking, flight: updatedFlight } = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          flightId: flight.id,
          passengerName: document.getElementById('pName').value,
          passengerEmail: document.getElementById('pEmail').value,
          seats: document.getElementById('pSeats').value
        })
      });
      showConfirmation(booking, updatedFlight);
    }catch(err){
      errBox.textContent = err.message;
      errBox.classList.add('show');
    }
  });
}

function showConfirmation(booking, flight){
  const section = document.getElementById('bookingSection');
  section.innerHTML = `
    <div class="wrap">
      <div class="boarding-pass reveal">
        <div class="bp-main">
          <div class="bp-head">
            <div>
              <b>${escapeHTML(booking.passengerName)}</b>
              <span>${escapeHTML(flight.flightNo)} &middot; ${escapeHTML(flight.airline)}</span>
            </div>
            <span class="badge badge-confirmed">Confirmed</span>
          </div>
          <div class="bp-route">
            <b>${escapeHTML(flight.origin).split(' (')[0]}</b>
            <span class="arrow">&rarr;</span>
            <b>${escapeHTML(flight.destination).split(' (')[0]}</b>
          </div>
          <div class="bp-grid">
            <div><span>Departs</span>${formatDateTime(flight.departTime)}</div>
            <div><span>Seats</span>${booking.seats}</div>
            <div><span>Total paid</span>${money(booking.totalPrice)}</div>
            <div><span>Booking ref</span>${booking.ref}</div>
          </div>
        </div>
        <div class="bp-stub">
          <div>
            <b>${escapeHTML(flight.origin).match(/\\(([^)]+)\\)/) ? flight.origin.match(/\\(([^)]+)\\)/)[1] : ''}</b>
            <span>to</span>
            <b>${escapeHTML(flight.destination).match(/\\(([^)]+)\\)/) ? flight.destination.match(/\\(([^)]+)\\)/)[1] : ''}</b>
          </div>
          <div>
            <span>Ref</span>
            <b>${booking.ref}</b>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin-top:26px;">
        <a href="dashboard.html" class="btn btn-primary">Go to My Bookings</a>
      </div>
    </div>`;
}

init();
