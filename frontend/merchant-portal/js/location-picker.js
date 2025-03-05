let map;
let marker;

// Initialize map
function initLocationMap() {
    map = L.map('location-map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Handle map clicks
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        document.getElementById('lat').value = lat.toFixed(6);
        document.getElementById('lng').value = lng.toFixed(6);
        
        // Update or create marker
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }
    });
}

// Set location on map
function setLocation(lat, lng) {
    if (lat && lng) {
        map.setView([lat, lng], 15);
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }
    }
}
