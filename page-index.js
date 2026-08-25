document.getElementById('searchForm').addEventListener('submit', e=>{
  e.preventDefault();
  const origin = document.getElementById('sOrigin').value.trim();
  const destination = document.getElementById('sDestination').value.trim();
  const date = document.getElementById('sDate').value;
  const pax = document.getElementById('sPax').value || 1;
  const params = new URLSearchParams();
  if(origin) params.set('origin', origin);
  if(destination) params.set('destination', destination);
  if(date) params.set('date', date);
  params.set('pax', pax);
  window.location.href = 'flights.html?' + params.toString();
});

async function loadPopular(){
  const wrap = document.getElementById('popularFlights');
  try{
    const { flights } = await api('/flights');
    if(flights.length === 0){
      wrap.innerHTML = '<div class="empty-state">No flights scheduled right now.</div>';
      return;
    }
    wrap.innerHTML = flights.slice(0,5).map(flightCardHTML).join('');
  }catch(e){
    wrap.innerHTML = '<div class="empty-state">Could not load flights right now.</div>';
  }
}

function flightCardHTML(f){
  const low = f.seatsAvailable < f.seatsTotal * 0.2;
  return `
    <div class="flight-card">
      <div class="fc-airline">${escapeHTML(f.flightNo)}<br>${escapeHTML(f.airline)}</div>
      <div class="fc-route">
        <div class="fc-pt"><b>${escapeHTML(f.origin)}</b><span>${formatTime(f.departTime)}</span></div>
        <div class="fc-line"></div>
        <div class="fc-pt"><b>${escapeHTML(f.destination)}</b><span>${formatTime(f.arriveTime)}</span></div>
      </div>
      <div class="fc-meta">${formatDateTime(f.departTime)}</div>
      <div class="fc-price">
        <b>${money(f.price)}</b><span>per passenger</span>
        <div class="fc-seats ${low?'low':''}">${f.seatsAvailable} seats left</div>
      </div>
      <a href="booking.html?flightId=${f.id}" class="btn btn-sky btn-sm">Select</a>
    </div>`;
}

loadPopular();
