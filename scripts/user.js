let marker, selectedCoords = null;
const map = L.map('previewMap').setView([48.2082, 16.3738], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

map.on('click', function(e) {
  selectedCoords = e.latlng;
  if (marker) map.removeLayer(marker);
  marker = L.marker(selectedCoords).addTo(map).bindPopup("Event location").openPopup();
});

document.getElementById('eventForm').addEventListener('submit', function(e) {
  e.preventDefault();
  if (!selectedCoords) return alert("Please select a location on the map.");

  const submitted = JSON.parse(localStorage.getItem('submittedEvents')) || [];
  const lastId = parseInt(localStorage.getItem('lastEventId') || "0");
  const newId = lastId + 1;

  const newEvent = {
    objectId: newId,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    host: document.getElementById('host').value,
    category: document.getElementById('category').value,
    reccuring: document.getElementById('reccuring').value,
    timestamp_start: document.getElementById('startDate').value + "T" + document.getElementById('startTime').value,
    timestamp_end: document.getElementById('endDate').value + "T" + document.getElementById('endTime').value,
    coords: [selectedCoords.lat, selectedCoords.lng],
    weblink: document.getElementById('weblink').value,
    submittedBy: user,
    status: "pending"
  };

  submitted.push(newEvent);
  localStorage.setItem('submittedEvents', JSON.stringify(submitted));
  localStorage.setItem('lastEventId', newId.toString());

  alert("Event submitted successfully.");
  this.reset();
  if (marker) map.removeLayer(marker);
  selectedCoords = null;
  renderEventHistory();
});

function renderEventHistory() {
  const submitted = JSON.parse(localStorage.getItem('submittedEvents')) || [];
  const itemsContainer = document.getElementById('eventItems');
  itemsContainer.innerHTML = '';
  const userEvents = submitted.filter(e => e.submittedBy === user);

  if (userEvents.length === 0) {
    itemsContainer.innerHTML = '<p class="no-events">You haven\'t submitted any events yet.</p>';
    return;
  }

  userEvents.forEach(event => {
    const div = document.createElement('div');
    div.className = 'event-item';
    div.innerHTML = `<strong>${event.title}</strong><br>
      <small>${event.timestamp_start} → ${event.timestamp_end}</small><br>
      <em>Status: ${event.status}</em>`;
    itemsContainer.appendChild(div);
  });
}

window.onload = renderEventHistory;