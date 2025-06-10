const user = localStorage.getItem('currentUser');
const nav = document.getElementById('navbar');

// for the navbar, checks if user is logged in as admin, as user or not at all and chages the links displayed based on that
if (user === 'admin') { 
nav.innerHTML = `
    <a href="index.html">Home</a> |
    <a href="pages/admin.html">Admin Panel</a> |
    <a href="#" onclick="logout()">Logout (${user})</a>`;
} else if (user) {
nav.innerHTML = `
    <a href="index.html">Home</a> |
    <a href="pages/user.html">User Panel</a> |
    <a href="#" onclick="logout()">Logout (${user})</a>`;
} else {
nav.innerHTML = `
    <a href="index.html">Home</a> |
    <a href="pages/login.html">Login</a> |
    <a href="pages/register.html">Register</a>`;
}

//logout function goes to login page
function logout() { 
    localStorage.removeItem('currentUser');
    window.location.href = 'pages/login.html';
}

//formats the date of the events in the map to be easy to read
function formatDate(dateStr) { 
const d = new Date(dateStr);
if (isNaN(d)) return dateStr;
return d.toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
});
}

//leaflet map
const map = L.map('map').setView([48.2082, 16.3738], 13); 
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

//colors for the event types
const categoryColors = {
    initiative: '#007BFF',
    protest: '#FF4136',
    pol_education: '#28a745',
    workshop: '#fd7e14',
    participation: '#6f42c1',
    election: '#ffc107',
    default: '#6c757d'
};

//colors for the recurring type
const recurringColors = {
    one_time: '#666',
    daily: '#1abc9c',
    weekly: '#9b59b6',
    monthly: '#e67e22'
};

//setup for the functions
let allMarkers = [];
let allEvents = [];
let categorySet = new Set();
let recurringSet = new Set();
let markerById = {};

//the main function: responsible for parsing the data from the geojson to the map and the calendar
function addEventToMapAndCalendar(props, coords, category, idSource = 'LS') {
    const color = categoryColors[category] || categoryColors.default;
    const marker = L.circleMarker([coords[0], coords[1]], {
        radius: 7,
        color: color,
        fillColor: color,
        fillOpacity: 0.85
    }).bindPopup(`
        <strong>${props.title}</strong><br>
        <em style="color:gray">${formatDate(props.timestamp_start)} → ${formatDate(props.timestamp_end)}</em><br>
        <span style="color:${color}; font-weight:bold;">${category}</span><br>
         ${props.reccuring ? `<em>(${props.reccuring})</em><br>` : ''}
        ${props.weblink ? `<a href="${props.weblink}" target="_blank">🔗 More info</a><br>` : ''}
        ${props.description ? `<p>${props.description}</p>` : ''}
    `);

    marker.featureCategory = category;
    marker.featureRecurring = props.reccuring || 'one_time';
    marker.eventId = props.objectId || props.id;
    marker.addTo(map);
    allMarkers.push(marker);
    markerById[marker.eventId] = marker;
    
    //incase the category is intiative it skips adding them to the calendar, due to lag and overload of data
    if ((props.reccuring === 'initiative') || (category === 'initative')) {} 
    else {
            allEvents.push({
            id: marker.eventId,
            title: props.title,
            start: props.timestamp_start,
            end: props.timestamp_end,
            allDay: false,
            display: 'block',
            color: color,
            textColor: '#fff',
            extendedProps: {
            id: marker.eventId,
            category,
            reccuring: props.reccuring || 'one_time'
            }
        });
    }
    
    categorySet.add(category);
    recurringSet.add(props.reccuring || 'one_time');
}

//look for events in localStorage, in real world would be exchanged for a proper database
const storedEvents = JSON.parse(localStorage.getItem('submittedEvents')) || [];
storedEvents.filter(e => e.status === 'approved').forEach(e => {
    const category = e.category || 'default';
    addEventToMapAndCalendar(e, e.coords, category);
});

//actually grab the data from the geojson and integrate them with the filter functions 
fetch('data/events.geojson')
.then(res => res.json())
.then(geojson => {
    geojson.features.forEach(f => {
        const props = f.properties;
        const coords = f.geometry.coordinates;
        const category = props.category || 'default';
        addEventToMapAndCalendar(props, [coords[1], coords[0]], category);
    });

    const controlDiv = document.getElementById('controls');
    const recurringDiv = document.getElementById('recurringControls');
    controlDiv.setAttribute('data-title', 'Filter by Category');
    recurringDiv.setAttribute('data-title', 'Filter by Frequency');

    //filter by type
    categorySet.forEach(cat => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.id = `cat-${cat}`;
        checkbox.dataset.category = cat;

        const label = document.createElement('label');
        label.htmlFor = `cat-${cat}`;
        label.innerHTML = `<span style="color:${categoryColors[cat] || categoryColors.default};">⬤</span> ${cat}`;

        checkbox.addEventListener('change', updateFilters);
        controlDiv.appendChild(checkbox);
        controlDiv.appendChild(label);
    });

    //filter by recurring
    recurringSet.forEach(rec => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.id = `rec-${rec}`;
        checkbox.dataset.rec = rec;

        const label = document.createElement('label');
        label.htmlFor = `rec-${rec}`;
        label.innerHTML = `<span style="color:${recurringColors[rec] || '#999'};"><!--■--></span> ${rec}`;

        checkbox.addEventListener('change', updateFilters);
        recurringDiv.appendChild(checkbox);
        recurringDiv.appendChild(label);
    });

    //enable the filtering and update the map and calendar accordingly
    function updateFilters() {
        const activeCategories = Array.from(document.querySelectorAll('#controls input:checked')).map(el => el.dataset.category);
        const activeRecs = Array.from(document.querySelectorAll('#recurringControls input:checked')).map(el => el.dataset.rec);

        allMarkers.forEach(m => {
            if (activeCategories.includes(m.featureCategory) && activeRecs.includes(m.featureRecurring)) {
            m.addTo(map);
            } else {
            map.removeLayer(m);
            }
        });

        calendar.removeAllEvents();
        allEvents.forEach(evt => {
            if (activeCategories.includes(evt.extendedProps.category) && activeRecs.includes(evt.extendedProps.reccuring)) {
            calendar.addEvent(evt);
            }
        });
    }

    //intializing the calendar view
    const calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        events: allEvents,
        //if an event in the calendar is clicked the map zoomes and displays the event
        eventClick: function(info) {
            const marker = markerById[info.event.id];
            if (marker) {
            map.setView(marker.getLatLng(), 16);
            marker.openPopup();
            }
        }
    });

    //display the calendar
    calendar.render();
});