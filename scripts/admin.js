document.addEventListener('DOMContentLoaded', () => {
document.getElementById('adminName').textContent = user;
});

const submitted = JSON.parse(localStorage.getItem('submittedEvents')) || [];
const approved = JSON.parse(localStorage.getItem('approvedEvents')) || [];
const pending = JSON.parse(localStorage.getItem('pendingEvents')) || [];
const combined = [...submitted, ...approved.filter(ev => !submitted.some(s => JSON.stringify(s) === JSON.stringify(ev)))];

const map = L.map('map').setView([48.2082, 16.3738], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
let marker;

function renderEvents() {
updateSummary();
const filter = document.getElementById('statusFilter').value;
const list = document.getElementById('eventList');
list.innerHTML = '';
combined.filter(event => filter === 'all' || event.status === filter)
    .forEach((event, index) => {
    const div = document.createElement('div');
    div.className = 'event';
    div.innerHTML = `
        <strong>${event.title}</strong> (${event.type})<br>
        <em>Submitted by: ${event.submittedBy || 'Unknown'}</em><br>
        Date: ${event.date}<br>
        Location: ${event.coords.join(', ')}<br>
        <span class="status ${event.status}">${event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span><br><br>
    `;
    if (event.status === 'pending') {
        const approveBtn = document.createElement('button');
        approveBtn.className = 'approve';
        approveBtn.textContent = 'Approve';
        approveBtn.onclick = () => updateStatus(index, 'approved');

        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'reject';
        rejectBtn.textContent = 'Reject';
        rejectBtn.onclick = () => updateStatus(index, 'rejected');

        div.appendChild(approveBtn);
        div.appendChild(rejectBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this event?')) deleteEvent(index);
    };
    const mapBtn = document.createElement('button');
    mapBtn.textContent = 'Show on Map';
    mapBtn.onclick = () => zoomTo(event.coords);

    div.appendChild(mapBtn);
    div.appendChild(deleteBtn);
    list.appendChild(div);
    });
}

function updateStatus(index, status) {
    submitted[index].status = status;
    if (status === 'approved') approved.push(submitted[index]);
    localStorage.setItem('approvedEvents', JSON.stringify(approved));
    localStorage.setItem('submittedEvents', JSON.stringify(submitted));
    const pendingIndex = pending.findIndex(e => JSON.stringify(e) === JSON.stringify(submitted[index]));
    if (pendingIndex !== -1) pending.splice(pendingIndex, 1);
    localStorage.setItem('pendingEvents', JSON.stringify(pending));
    renderEvents();
    renderMapPoints();
    updateSummary();
}

function deleteEvent(index) {
    const event = submitted[index];
    submitted.splice(index, 1);
    localStorage.setItem('submittedEvents', JSON.stringify(submitted));
    const p = pending.filter(e => JSON.stringify(e) !== JSON.stringify(event));
    const a = approved.filter(e => JSON.stringify(e) !== JSON.stringify(event));
    localStorage.setItem('pendingEvents', JSON.stringify(p));
    localStorage.setItem('approvedEvents', JSON.stringify(a));
    renderEvents();
}

function zoomTo(coords) {
    if (marker) map.removeLayer(marker);
    marker = L.marker(coords).addTo(map).bindPopup('Event location').openPopup();
    map.setView(coords, 14);
}

function updateSummary() {
    const all = combined;
    const pendingCount = all.filter(e => e.status === 'pending').length;
    const approvedCount = all.filter(e => e.status === 'approved').length;
    const rejectedCount = all.filter(e => e.status === 'rejected').length;
    const filter = document.getElementById('statusFilter').value;
    const visibleCount = combined.filter(e => filter === 'all' || e.status === filter).length;
    const summary = `✅ Approved: ${approvedCount} | 🕒 Pending: ${pendingCount} | ❌ Rejected: ${rejectedCount} | 📌 Showing: ${visibleCount}`;
    document.getElementById('summaryCounts').textContent = summary;
}

function exportVisibleEvents() {
    const filter = document.getElementById('statusFilter').value;
    const filtered = combined.filter(e => filter === 'all' || e.status === filter);
    const csv = [
        ['Title', 'Type', 'Date', 'Latitude', 'Longitude', 'Status', 'SubmittedBy'],
        ...filtered.map(e => [
        e.title, e.type, e.date, e.coords[0], e.coords[1], e.status, e.submittedBy
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events_export_${filter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function exportVisibleEventsJSON() {
    const filter = document.getElementById('statusFilter').value;
    const filtered = combined.filter(e => filter === 'all' || e.status === filter);
    const json = JSON.stringify(filtered, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events_export_${filter}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function copyVisibleEventsToClipboard() {
    const filter = document.getElementById('statusFilter').value;
    const filtered = combined.filter(e => filter === 'all' || e.status === filter);
    const json = JSON.stringify(filtered, null, 2);
    navigator.clipboard.writeText(json).then(() => {
        alert('Visible events copied to clipboard.');
    }).catch(err => {
        alert('Failed to copy events to clipboard.');
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

document.getElementById('statusFilter').addEventListener('change', () => {
    renderEvents();
    renderMapPoints();
});

function renderMapPoints() {
    const filter = document.getElementById('statusFilter').value;
    map.eachLayer(layer => {
        if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
        }
    });
    combined.filter(event => filter === 'all' || event.status === filter)
        .forEach(event => {
        L.circleMarker(event.coords, {
            radius: 6,
            fillColor: event.status === 'approved' ? '#28a745' : event.status === 'pending' ? '#ffc107' : '#dc3545',
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map)
            .bindPopup(`<strong>${event.title}</strong><br>${event.type}<br>${event.date}<br>By: ${event.submittedBy}`);
        });
}

renderEvents();
renderMapPoints();