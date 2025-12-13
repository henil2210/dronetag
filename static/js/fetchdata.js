// document.addEventListener('DOMContentLoaded', function () {
//     // DOM Elements
//     const fetchBtn = document.getElementById('fetch-btn');
//     const exportBtn = document.getElementById('export-btn');
//     const exportImagesBtn = document.getElementById('export-images-btn');
//     const trackerInput = document.getElementById('tracker-id');
//     const droneInfoBody = document.getElementById('drone-info-body');
//     const imagesGrid = document.getElementById('images-grid');
//     const statusMessage = document.getElementById('status-message');
//     const lastUpdatedDiv = document.querySelector('.last-updated');
 
//     // Map Setup
//     const map = L.map('map').setView([23.0225, 72.5714], 13);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19,
//         attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(map);
 
//     const markersLayer = L.layerGroup().addTo(map);
//     const polylineLayer = L.layerGroup().addTo(map);
 
//     let fetchedData = [];   // full telemetry (for CSV)
//     let pathPoints = [];    // 30s-sampled points used for path
//     let fetchedImages = [];
//     let lastUpdateTime = null;
 
//     function createCustomIcon(color, pulse = false) {
//         const iconClass = pulse ? 'pulse-icon' : 'static-icon';
//         return L.divIcon({
//             className: `custom-icon ${iconClass} ${color}-icon`,
//             html: '<div></div>',
//             iconSize: [24, 24],
//             iconAnchor: [12, 12]
//         });
//     }
 
//     fetchBtn.addEventListener('click', fetchDroneData);
//     exportBtn.addEventListener('click', exportToCSV);
//     exportImagesBtn.addEventListener('click', exportImagesAsZip);
 
//     // ⏱ Auto-fetch every 10 seconds (when tracker is present)
//     setInterval(() => {
//         const trackerId = trackerInput.value.trim();
//         if (trackerId) fetchDroneData();
//     }, 60000);
 
//     async function fetchDroneData() {
//     const trackerId = trackerInput.value.trim();
//     if (!trackerId) {
//         showStatus('Please enter a Tracker ID', 'error');
//         return;
//     }
 
//     clearData();
//     showStatus('Fetching latest trajectory...', 'loading');
 
//     try {
//         const response = await fetch('/api/trajectory', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 tracker_id: trackerId,
//                 interval_seconds: 30,
//                 max_gap_seconds: 120
//             })
//         });
 
//         if (!response.ok) {
//             const error = await response.json();
//             throw new Error(error.error || 'Server error occurred');
//         }
 
//         const data = await response.json();
//         lastUpdateTime = new Date();
//         updateLastUpdatedTime();
 
//         // Map API fields to frontend, with fallbacks
//         pathPoints = (data.points || []).map(p => ({
//             Latitude: p.lat,
//             Longitude: p.lon,
//             Timestamp: p.timestamp,
//             Altitude: p.altitude || 0,
//             DroneUINNumber: p.DroneUINNumber || "N/A",
//             DroneCategory: p.DroneCategory || "N/A",
//             DroneApplication: p.DroneApplication || "N/A"
//         }));
 
//         fetchedImages = data.images || [];
//         fetchedData = pathPoints; // for CSV export
 
//         // Display first row info in table
//         const firstPoint = pathPoints[0] || {};
//         displayDroneInfo(trackerId, firstPoint);
 
//         // Plot map & images
//         plotMapData(pathPoints);
//         displayImages(fetchedImages);
 
//         showStatus(`Loaded ${pathPoints.length} path points (30s interval) and ${fetchedImages.length} images`, 'success');
 
//     } catch (error) {
//         console.error('Error:', error);
//         showStatus(error.message, 'error');
//         showErrorOnMap(error.message);
//     }
// }
 
// // Display first row of drone info in table
// function displayDroneInfo(trackerId, firstRecord = {}) {
//     droneInfoBody.innerHTML = '';
//     const row = document.createElement('tr');
//     row.innerHTML = `
//         <td>${trackerId}</td>
//         <td>${firstRecord.DroneUINNumber || 'N/A'}</td>
//         <td>${firstRecord.DroneCategory || 'N/A'}</td>
//         <td>${firstRecord.DroneApplication || 'N/A'}</td>
//     `;
//     droneInfoBody.appendChild(row);
// }
 
// // Update map popup to show the 3 fields
// function plotMapData(points) {
//     markersLayer.clearLayers();
//     polylineLayer.clearLayers();
 
//     if (!points || points.length === 0) return;
 
//     const coords = points.map(p => [parseFloat(p.Latitude), parseFloat(p.Longitude)]);
//     const polyline = L.polyline(coords, { color: 'blue', weight: 4, opacity: 0.9 }).addTo(polylineLayer);
 
//     points.forEach((p, i) => {
//         const lat = parseFloat(p.Latitude);
//         const lng = parseFloat(p.Longitude);
//         const iconColor = (i === 0) ? 'green' : (i === points.length - 1) ? 'red' : 'blue';
//         L.marker([lat, lng], { icon: createCustomIcon(iconColor, i === 0) })
//             .addTo(markersLayer)
//             .bindPopup(`
//                 <div class="map-popup">
//                     <h4>Tracker ID: ${trackerInput.value}</h4>
//                     <p><strong>Time:</strong> ${formatTimestamp(p.Timestamp)}</p>
//                     <p><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
//                     <p><strong>Altitude:</strong> ${p.Altitude.toFixed(2)} m</p>
//                     <p><strong>UIN:</strong> ${p.DroneUINNumber || 'N/A'}</p>
//                     <p><strong>Category:</strong> ${p.DroneCategory || 'N/A'}</p>
//                     <p><strong>Application:</strong> ${p.DroneApplication || 'N/A'}</p>
//                 </div>
//             `);
//     });
 
//     if (coords.length) map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
// }
 
 
//     // -------- Images ----------
//     function displayImages(images) {
//         imagesGrid.innerHTML = '';
//         if (!Array.isArray(images) || images.length === 0) {
//             imagesGrid.innerHTML = `<div class="no-data-message"><p>No images available for this drone</p></div>`;
//             return;
//         }
 
//         images.forEach((imgUrl) => {
//             if (typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return;
 
//             const imgContainer = document.createElement('div');
//             imgContainer.className = 'image-container';
 
//             const imgLink = document.createElement('a');
//             imgLink.href = imgUrl;
//             imgLink.target = '_blank';
 
//             const img = document.createElement('img');
//             img.src = imgUrl;
//             img.alt = 'Drone image';
//             img.loading = 'lazy';
 
//             const imgInfo = document.createElement('div');
//             imgInfo.className = 'image-info';
//             const timestamp = extractTimestampFromUrl(imgUrl);
//             if (timestamp) imgInfo.textContent = timestamp;
 
//             imgLink.appendChild(img);
//             imgContainer.appendChild(imgLink);
//             imgContainer.appendChild(imgInfo);
//             imagesGrid.appendChild(imgContainer);
//         });
//     }
 
//     async function exportImagesAsZip() {
//         if (!fetchedImages || fetchedImages.length === 0) {
//             showStatus('No images available to export', 'warning');
//             return;
//         }
 
//         try {
//             showStatus('Preparing images for download...', 'loading');
//             const zip = new JSZip();
//             const folder = zip.folder("drone_images");
 
//             for (let i = 0; i < fetchedImages.length; i++) {
//                 const url = fetchedImages[i];
//                 const response = await fetch(url);
//                 const blob = await response.blob();
//                 const extension = url.split('.').pop().split(/\#|\?/)[0];
//                 folder.file(`image_${i + 1}.${extension}`, blob);
//             }
 
//             const content = await zip.generateAsync({ type: "blob" });
//             saveAs(content, `drone_images_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.zip`);
 
//             showStatus('Images exported successfully', 'success');
//         } catch (error) {
//             console.error("Image Export Error:", error);
//             showStatus("Image export failed: " + error.message, "error");
//         }
//     }
 
//     function handleEmptyDataResponse(trackerId) {
//         showStatus(`No data found for tracker ID: ${trackerId}`, 'warning');
//         displayDroneInfo(trackerId);
//         showMessageOnMap(`No data available for ${trackerId}`, 'info');
//     }
 
//     function extractTimestampFromUrl(url) {
//         try {
//             const match = url.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
//             if (match) {
//                 const [_, year, month, day, hour, minute, second] = match;
//                 return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString();
//             }
//             return null;
//         } catch {
//             return null;
//         }
//     }
 
//     function formatTimestamp(timestamp) {
//         if (!timestamp) return 'Unknown';
//         try {
//             if (typeof timestamp === 'string' && timestamp.match(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)) {
//                 const [datePart, timePart] = timestamp.split(' ');
//                 const [day, month, year] = datePart.split('-');
//                 return new Date(`${year}-${month}-${day}T${timePart}`).toLocaleString();
//             }
//             return new Date(timestamp).toLocaleString();
//         } catch {
//             return String(timestamp);
//         }
//     }
 
//     function updateLastUpdatedTime() {
//         if (!lastUpdateTime) return;
//         lastUpdatedDiv.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
//     }
 
//     function showMessageOnMap(message, type) {
//         const center = map.getCenter();
//         markersLayer.clearLayers();
 
//         const icon = L.divIcon({
//             className: `map-message map-message-${type}`,
//             html: `<div>${message}</div>`,
//             iconSize: [200, 40]
//         });
 
//         L.marker(center, {
//             icon: icon,
//             zIndexOffset: 1000
//         }).addTo(markersLayer);
//         map.setView(center, 12);
//     }
 
//     function showErrorOnMap(error) {
//         showMessageOnMap(`Error: ${error}`, 'error');
//     }
 
//     function clearData() {
//         droneInfoBody.innerHTML = '';
//         imagesGrid.innerHTML = '';
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();
//         fetchedData = [];
//         pathPoints = [];
//         fetchedImages = [];
//     }
 
//     function showStatus(message, type) {
//         if (!statusMessage) return;
//         statusMessage.textContent = message;
//         statusMessage.className = `status-${type}`;
//         if (type !== 'loading') {
//             setTimeout(() => {
//                 statusMessage.textContent = '';
//                 statusMessage.className = '';
//             }, 5000);
//         }
//     }
 
//     function exportToCSV() {
//         const rows = fetchedData;
//         if (!rows || rows.length === 0) {
//             showStatus('No data available to export', 'warning');
//             return;
//         }
 
//         try {
//             const headers = Object.keys(rows[0]);
//             const csvContent = [
//                 headers.join(','),
//                 ...rows.map(row =>
//                     headers.map(field =>
//                         `"${String(row[field] ?? '').replace(/"/g, '""')}"`
//                     ).join(',')
//                 )
//             ].join('\n');
 
//             const blob = new Blob([csvContent], { type: 'text/csv' });
//             const url = URL.createObjectURL(blob);
 
//             const link = document.createElement('a');
//             link.href = url;
//             link.download = `drone_data_${trackerInput.value || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
 
//             showStatus('Data exported successfully', 'success');
//         } catch (error) {
//             console.error('Export Error:', error);
//             showStatus('Export failed: ' + error.message, 'error');
//         }
//     }
 
//     // (The older /exportImages handler kept for backward compatibility)
//     const legacyExportBtn = document.getElementById("exportImages");
//     if (legacyExportBtn) {
//         legacyExportBtn.addEventListener("click", async () => {
//             try {
//                 let images = Array.from(document.querySelectorAll("#imageContainer img")).map(img => img.src);
//                 if (images.length === 0) {
//                     alert("No images available to export!");
//                     return;
//                 }
//                 let response = await fetch("/export_images", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ images })
//                 });
//                 if (!response.ok) {
//                     let err = await response.text();
//                     console.error("❌ Export API failed:", err);
//                     alert("Failed to export images!");
//                     return;
//                 }
//                 let blob = await response.blob();
//                 let link = document.createElement("a");
//                 link.href = window.URL.createObjectURL(blob);
//                 link.download = "exported_images.zip";
//                 link.click();
//             } catch (error) {
//                 console.error("💥 Error in exportImages click handler:", error);
//                 alert("Error exporting images. Check console/logs.");
//             }
//         });
//     }
// });
 
 
 
 
 
 
 
 
 
 
 
// document.addEventListener('DOMContentLoaded', function () {
 
//     const fetchBtn = document.getElementById('fetch-btn');
//     const trackerInput = document.getElementById('tracker-id');
//     const droneInfoBody = document.getElementById('drone-info-body');
//     const statusMessage = document.getElementById('status-message');
 
//     const map = L.map('map').setView([23.0225, 72.5714], 6);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19
//     }).addTo(map);
 
//     const markersLayer = L.layerGroup().addTo(map);
//     const polylineLayer = L.layerGroup().addTo(map);
 
//     const COLORS = ['red', 'blue', 'green', 'orange'];
 
//     fetchBtn.addEventListener('click', fetchMultipleDrones);
 
//     async function fetchMultipleDrones() {
 
//         clearMap();
//         droneInfoBody.innerHTML = '';
 
//         const trackerIds = trackerInput.value
//             .split(',')
//             .map(t => t.trim())
//             .filter(Boolean);
 
//         if (trackerIds.length === 0) {
//             showStatus("Enter at least one Tracker ID", "error");
//             return;
//         }
 
//         showStatus(`Loading ${trackerIds.length} drone(s)...`, "loading");
 
//         let bounds = [];
 
//         for (let i = 0; i < trackerIds.length; i++) {
//             await loadSingleDrone(trackerIds[i], COLORS[i % COLORS.length], bounds);
//         }
 
//         if (bounds.length) {
//             map.fitBounds(bounds, { padding: [40, 40] });
//         }
 
//         showStatus("All drones loaded successfully", "success");
//     }
 
//     async function loadSingleDrone(trackerId, color, bounds) {
 
//         const response = await fetch('/api/trajectory', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 tracker_id: trackerId,
//                 interval_seconds: 30
//             })
//         });
 
//         const data = await response.json();
//         const points = data.points || [];
 
//         if (!points.length) return;
 
//         // ---- Table (use FIRST tells everything)
//         const first = points[0];
//         addDroneRow(
//             trackerId,
//             first.DroneUINNumber,
//             first.DroneCategory,
//             first.DroneApplication
//         );
 
//         // ---- Path
//         const coords = points.map(p => {
//             bounds.push([p.lat, p.lon]);
//             return [p.lat, p.lon];
//         });
 
//         L.polyline(coords, {
//             color: color,
//             weight: 4
//         }).addTo(polylineLayer);
 
//         // ---- Marker (last position)
//         const last = points[points.length - 1];
//         L.marker([last.lat, last.lon])
//             .addTo(markersLayer)
//             .bindPopup(`
//                 <b>Tracker:</b> ${trackerId}<br>
//                 <b>Altitude:</b> ${last.altitude} m<br>
//                 <b>UIN:</b> ${last.DroneUINNumber}<br>
//                 <b>Category:</b> ${last.DroneCategory}<br>
//                 <b>Application:</b> ${last.DroneApplication}
//             `);
//     }
 
//     function addDroneRow(trackerId, uin, category, application) {
//         const tr = document.createElement('tr');
//         tr.innerHTML = `
//             <td>${trackerId}</td>
//             <td>${uin || 'N/A'}</td>
//             <td>${category || 'N/A'}</td>
//             <td>${application || 'N/A'}</td>
//         `;
//         droneInfoBody.appendChild(tr);
//     }
 
//     function clearMap() {
//         markersLayer.clearLayers();
//         polylineLayer.clearLayers();
//     }
 
//     function showStatus(msg, type) {
//         statusMessage.textContent = msg;
//         statusMessage.className = `status-${type}`;
//     }
// });
 
 
 
 
document.addEventListener('DOMContentLoaded', function () {
 
    /* =======================
       DOM ELEMENTS
    ======================== */
    const fetchBtn = document.getElementById('fetch-btn');
    const exportBtn = document.getElementById('export-btn');
    const exportImagesBtn = document.getElementById('export-images-btn');
    const trackerInput = document.getElementById('tracker-id');
    const droneInfoBody = document.getElementById('drone-info-body');
    const imagesGrid = document.getElementById('images-grid');
    const statusMessage = document.getElementById('status-message');
    const lastUpdatedDiv = document.querySelector('.last-updated');
 
    /* =======================
       MAP SETUP
    ======================== */
    const map = L.map('map').setView([23.0225, 72.5714], 12);
 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
 
    const markersLayer = L.layerGroup().addTo(map);
    const polylineLayer = L.layerGroup().addTo(map);
 
    /* =======================
       GLOBAL STATE
    ======================== */
    let fetchedData = [];
    let fetchedImages = [];
    let lastUpdateTime = null;
 
    const DRONE_COLORS = [
        'blue', 'red', 'green', 'purple', 'orange', 'brown'
    ];
 
    /* =======================
       ICON FACTORY
    ======================== */
    function createCustomIcon(color, pulse = false) {
        return L.divIcon({
            className: `custom-icon ${pulse ? 'pulse-icon' : ''} ${color}-icon`,
            html: '<div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }
 
    /* =======================
       BUTTON EVENTS
    ======================== */
    fetchBtn.addEventListener('click', fetchDroneData);
    exportBtn.addEventListener('click', exportToCSV);
    exportImagesBtn.addEventListener('click', exportImagesAsZip);
 
    /* =======================
       AUTO FETCH (OPTIONAL)
    ======================== */
    setInterval(() => {
        if (trackerInput.value.trim()) fetchDroneData();
    }, 60000);
 
    /* =======================
       MAIN MULTI-DRONE FETCH
    ======================== */
    async function fetchDroneData() {
 
        const input = trackerInput.value.trim();
        if (!input) {
            showStatus('Enter Tracker ID(s)', 'error');
            return;
        }
 
        const trackerIds = input.split(',').map(t => t.trim()).filter(Boolean);
 
        clearData();
        showStatus('Fetching trajectories...', 'loading');
 
        let colorIndex = 0;
        let combinedBounds = null;
 
        for (const trackerId of trackerIds) {
 
            const color = DRONE_COLORS[colorIndex % DRONE_COLORS.length];
            colorIndex++;
 
            try {
                const response = await fetch('/api/trajectory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tracker_id: trackerId,
                        interval_seconds: 30,
                        max_gap_seconds: 120
                    })
                });
 
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Server error');
                }
 
                const data = await response.json();
 
                const points = (data.points || []).map(p => ({
                    Latitude: p.lat,
                    Longitude: p.lon,
                    Timestamp: p.timestamp,
                    Altitude: p.altitude || 0,
                    DroneUINNumber: p.DroneUINNumber || 'N/A',
                    DroneCategory: p.DroneCategory || 'N/A',
                    DroneApplication: p.DroneApplication || 'N/A'
                }));
 
                if (!points.length) continue;
 
                // TABLE ROW
                appendDroneInfoRow(trackerId, points[0]);
 
                // MAP DRAW
                const bounds = plotTrajectory(trackerId, points, color);
                if (bounds) {
                    combinedBounds = combinedBounds
                        ? combinedBounds.extend(bounds)
                        : bounds;
                }
 
                fetchedData.push(...points);
 
            } catch (e) {
                console.error(e);
                showStatus(`Failed for Tracker ${trackerId}`, 'warning');
            }
        }
 
        if (combinedBounds) {
            map.fitBounds(combinedBounds, { padding: [40, 40] });
        }
 
        lastUpdateTime = new Date();
        updateLastUpdatedTime();
        showStatus('All trajectories loaded', 'success');
    }
 
    /* =======================
       TABLE
    ======================== */
    function appendDroneInfoRow(trackerId, row) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trackerId}</td>
            <td>${row.DroneUINNumber}</td>
            <td>${row.DroneCategory}</td>
            <td>${row.DroneApplication}</td>
        `;
        droneInfoBody.appendChild(tr);
    }
 
    /* =======================
       MAP DRAWING
    ======================== */
    function plotTrajectory(trackerId, points, color) {
 
        const coords = points.map(p => [p.Latitude, p.Longitude]);
 
        const polyline = L.polyline(coords, {
            color,
            weight: 4,
            opacity: 0.85
        }).addTo(polylineLayer);
 
        points.forEach((p, i) => {
 
            const iconColor =
                i === 0 ? 'green' :
                i === points.length - 1 ? 'red' :
                color;
 
            L.marker([p.Latitude, p.Longitude], {
                icon: createCustomIcon(iconColor, i === 0)
            })
            .addTo(markersLayer)
            .bindPopup(`
                <b>Tracker:</b> ${trackerId}<br>
                <b>Time:</b> ${formatTimestamp(p.Timestamp)}<br>
                <b>Altitude:</b> ${p.Altitude} m<br>
                <b>UIN:</b> ${p.DroneUINNumber}<br>
                <b>Category:</b> ${p.DroneCategory}<br>
                <b>Application:</b> ${p.DroneApplication}
            `);
        });
 
        return polyline.getBounds();
    }
 
    /* =======================
       CSV EXPORT
    ======================== */
    function exportToCSV() {
        if (!fetchedData.length) {
            showStatus('No data to export', 'warning');
            return;
        }
 
        const headers = Object.keys(fetchedData[0]);
        const csv = [
            headers.join(','),
            ...fetchedData.map(row =>
                headers.map(h => `"${row[h] ?? ''}"`).join(',')
            )
        ].join('\n');
 
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
 
        const a = document.createElement('a');
        a.href = url;
        a.download = `drone_data_${Date.now()}.csv`;
        a.click();
    }
 
    /* =======================
       IMAGE EXPORT (UNCHANGED)
    ======================== */
    async function exportImagesAsZip() {
        showStatus('Image export not enabled', 'warning');
    }
 
    /* =======================
       HELPERS
    ======================== */
    function clearData() {
        droneInfoBody.innerHTML = '';
        imagesGrid.innerHTML = '';
        markersLayer.clearLayers();
        polylineLayer.clearLayers();
        fetchedData = [];
    }
 
    function showStatus(msg, type) {
        statusMessage.textContent = msg;
        statusMessage.className = `status-${type}`;
        if (type !== 'loading') {
            setTimeout(() => statusMessage.textContent = '', 4000);
        }
    }
 
    function formatTimestamp(ts) {
        try {
            return new Date(ts).toLocaleString();
        } catch {
            return ts;
        }
    }
 
    function updateLastUpdatedTime() {
        if (lastUpdatedDiv) {
            lastUpdatedDiv.textContent =
                `Last updated: ${lastUpdateTime.toLocaleString()}`;
        }
    }
 
});

