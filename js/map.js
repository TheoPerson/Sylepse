// map.js — Carte Radar Sombre intégrée (Leaflet + CartoDB Dark Matter)
// Module SkyMap pour Sylepse SkyCheck

const SkyMap = (() => {
  'use strict';

  let map = null;
  let userMarker = null;
  let radiusCircle = null;
  let aircraftMarkers = {};
  let onAircraftSelectCallback = null;

  /**
   * Initialise la carte Leaflet dans l'élément donné.
   */
  function init(elementId, lat, lon, radiusNM = 15, onSelect) {
    onAircraftSelectCallback = onSelect;

    const container = document.getElementById(elementId);
    if (!container) return;

    // Destroy existing instance if any
    if (map) {
      map.remove();
      map = null;
      aircraftMarkers = {};
    }

    // Centrer sur la position GPS
    map = L.map(elementId, {
      center: [lat, lon],
      zoom: radiusNM <= 15 ? 10 : radiusNM <= 25 ? 9 : 8,
      zoomControl: false,
      attributionControl: false
    });

    // Tuiles CartoDB Dark Matter (Black & Cyan aesthetic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map);

    // Marqueur GPS Utilisateur avec aura pulsante
    const userIcon = L.divIcon({
      className: 'sc-map-user-marker',
      html: `<div class="sc-user-dot"></div><div class="sc-user-pulse"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(map);

    // Cercle de rayon de scan (en mètres)
    const radiusMeters = radiusNM * 1852;
    radiusCircle = L.circle([lat, lon], {
      radius: radiusMeters,
      color: '#5eead4',
      weight: 1,
      opacity: 0.4,
      fillColor: '#5eead4',
      fillOpacity: 0.05,
      dashArray: '4, 8'
    }).addTo(map);

    // Invalider la taille après l'animation de rendu
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
  }

  /**
   * Met à jour les marqueurs d'avions sur la carte.
   */
  function updateAircraft(aircraftList) {
    if (!map) return;

    const currentHexes = new Set(aircraftList.map(a => a.icao24));

    // Supprimer les marqueurs obsolètes
    Object.keys(aircraftMarkers).forEach(hex => {
      if (!currentHexes.has(hex)) {
        map.removeLayer(aircraftMarkers[hex]);
        delete aircraftMarkers[hex];
      }
    });

    // Ajouter ou mettre à jour les marqueurs
    aircraftList.forEach(ac => {
      if (ac.lat == null || ac.lon == null) return;

      const trackDeg = ac.track != null ? ac.track : (ac.bearingDeg || 0);
      const isAudible = ac.audibility && (ac.audibility.level === 'high' || ac.audibility.level === 'medium');
      const markerColor = isAudible ? '#34d399' : (ac.audibility && ac.audibility.level === 'low') ? '#fb923c' : '#565c6a';

      const iconHtml = `
        <div class="sc-ac-marker" style="transform: rotate(${trackDeg}deg);">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="${markerColor}">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        <div class="sc-ac-label">${ac.callsign || ac.aircraftType || ac.icao24.toUpperCase()}</div>
      `;

      const acIcon = L.divIcon({
        className: 'sc-map-ac-wrapper',
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      if (aircraftMarkers[ac.icao24]) {
        aircraftMarkers[ac.icao24].setLatLng([ac.lat, ac.lon]);
        aircraftMarkers[ac.icao24].setIcon(acIcon);
      } else {
        const marker = L.marker([ac.lat, ac.lon], { icon: acIcon }).addTo(map);
        marker.on('click', () => {
          if (onAircraftSelectCallback) onAircraftSelectCallback(ac);
        });
        aircraftMarkers[ac.icao24] = marker;
      }
    });
  }

  function centerOn(lat, lon, zoom = 12) {
    if (map) {
      map.flyTo([lat, lon], zoom, { duration: 1.2 });
    }
  }

  return { init, updateAircraft, centerOn };
})();
