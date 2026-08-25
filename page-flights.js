function flightCardHTML(f){
  const low = f.seatsAvailable < f.seatsTotal * 0.2;
  const sold = f.seatsAvailable === 0;
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
        <div class="fc-seats ${low?'low':''}">${sold ? 'Sold out' : f.seatsAvailable + ' seats left'}</div>
      </div>
      ${sold
        ? '<button class="btn btn-ghost btn-sm" disabled>Sold Out</button>'
        : `<a href="booking.html?flightId=${f.id}" class="btn btn-sky btn-sm">Select</a>`}
    </div>`;
}

async function loadResults(){
  const params = new URLSearchParams(location.search);
  const origin = params.get('origin') || '';
  const destination = params.get('destination') || '';
  const date = params.get('date') || '';

  const titleParts = [];
  if(origin) titleParts.push(origin);
  if(destination) titleParts.push('to ' + destination);
  document.getElementById('resultsTitle').textContent = titleParts.length
    ? 'Flights ' + titleParts.join(' ')
    : 'All available flights';

  const wrap = document.getElementById('resultsList');
  const qs = new URLSearchParams();
  if(origin) qs.set('origin', origin);
  if(destination) qs.set('destination', destination);
  if(date) qs.set('date', date);

  try{
    const { flights } = await api('/flights?' + qs.toString());
    if(flights.length === 0){
      wrap.innerHTML = '<div class="empty-state">No flights match your search. Try a different route or date.</div>';
      return;
    }
    wrap.innerHTML = flights.map(flightCardHTML).join('');
  }catch(e){
    wrap.innerHTML = '<div class="empty-state">Could not load flights right now.</div>';
  }
}

loadResults();
