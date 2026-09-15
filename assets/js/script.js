// Init carte - La Rochelle  
const map = L.map('map').setView([46.1603, -1.1511], 14);

// map OpenStreetMap
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const tbody = document.getElementById('tableau-donnees');

function chargerLocalJson(fichier, type, couleur) {
    fetch(fichier)
        .then(res => res.json())
        .then(data => {
            // Supporte les tableaux simples ou l'objet racine OpenDataSoft
            const liste = Array.isArray(data) ? data : (data.results || data.records || []);

            liste.forEach(item => {
                const props = item.fields || item.properties || item;
                let lat = null;
                let lon = null;

                // 1. Extraction si le champ 'geo_point_2d' existe (Format API OpenDataSoft)
                if (item.geo_point_2d) {
                    lat = item.geo_point_2d.lat ?? item.geo_point_2d[0];
                    lon = item.geo_point_2d.lon ?? item.geo_point_2d[1];
                } 
                else if (props.geo_point_2d) {
                    lat = props.geo_point_2d.lat ?? props.geo_point_2d[0];
                    lon = props.geo_point_2d.lon ?? props.geo_point_2d[1];
                }
                // 2. Extraction si la géométrie GeoJSON est présente (Format [lon, lat])
                else if (item.geometry && item.geometry.coordinates) {
                    lon = item.geometry.coordinates[0];
                    lat = item.geometry.coordinates[1];
                }

                // S'assurer que les coordonnées sont valides avant d'afficher
                if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                    const nom = props.nom || props.libelle || props.nom_comple || `${type}`;

                    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                    const wazeUrl = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;

                    // Marqueur carte
                    const marker = L.circleMarker([lat, lon], {
                        radius: 7,
                        fillColor: couleur,
                        color: "#ffffff",
                        weight: 2,
                        fillOpacity: 0.85
                    }).addTo(map);

                    // Popup marquer
                    marker.bindPopup(`
                        <strong>${type === 'Toilette' ? '🚻' : '📍'} ${nom}</strong><br><br>
                        <a href="${gmapsUrl}" target="_blank">Google Maps</a> | 
                        <a href="${wazeUrl}" target="_blank">Waze</a>
                    `);

                    // Ligne du tableau
                    if (tbody) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><span style="color:${couleur}; font-weight:bold;">${type}</span></td>
                            <td>${nom}</td>
                            <td>
                                <a href="${gmapsUrl}" target="_blank">Google Maps</a> | 
                                <a href="${wazeUrl}" target="_blank">Waze</a>
                            </td>
                        `;
                        tbody.appendChild(row);
                    }
                }
            });
        })
        .catch(err => console.error(`Erreur lecture ${fichier} :`, err));
}

// Chargement des fichiers locaux
chargerLocalJson('./assets/DATA/opendata_wc.json', 'Toilette', '#e74c3c');
chargerLocalJson('./assets/DATA/opendata_poi.json', "Point d'intérêt", '#2ecc71');