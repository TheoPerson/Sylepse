// geo.js — calculs géométriques (Haversine, bearing) + wrapper navigator.geolocation
// Domaine : frontend-builder

const Geo = (() => {
  'use strict';

  const DEG2RAD = Math.PI / 180;
  const RAD2DEG = 180 / Math.PI;
  const EARTH_RADIUS_KM = 6371;

  // Directions cardinales ordonnées (index = tranche de 45°, décalage 22.5°)
  const CARDINAL = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

  /**
   * Récupère la position GPS de l'utilisateur.
   * @param {number} [timeoutMs=10000] — timeout en ms
   * @returns {Promise<{lat: number, lon: number, accuracy: number}>}
   */
  function getUserPosition(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Géolocalisation non supportée par ce navigateur.'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error('Accès à la position refusé. Autorise la géolocalisation pour utiliser Sylepse.'));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error('Position indisponible. Vérifie que le GPS est activé.'));
              break;
            case err.TIMEOUT:
              reject(new Error('Délai dépassé pour obtenir la position.'));
              break;
            default:
              reject(new Error('Erreur de géolocalisation inconnue.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 30000 // cache 30s — acceptable pour le use case "j'entends un avion maintenant"
        }
      );
    });
  }

  /**
   * Distance entre deux points GPS (formule de Haversine).
   * @returns {number} distance en kilomètres
   */
  function haversine(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * DEG2RAD;
    const dLon = (lon2 - lon1) * DEG2RAD;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * DEG2RAD) * Math.cos(lat2 * DEG2RAD) *
      Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Bearing (azimut) initial du point 1 vers le point 2.
   * @returns {number} angle en degrés [0, 360)
   */
  function bearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * DEG2RAD;
    const φ2 = lat2 * DEG2RAD;
    const Δλ = (lon2 - lon1) * DEG2RAD;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (Math.atan2(y, x) * RAD2DEG + 360) % 360;
  }

  /**
   * Convertit un angle en direction cardinale lisible.
   * @param {number} degrees — angle en degrés [0, 360)
   * @returns {string} ex: "N", "NE", "SO"
   */
  function bearingLabel(degrees) {
    const index = Math.round(((degrees % 360) + 360) % 360 / 45) % 8;
    return CARDINAL[index];
  }

  /**
   * Convertit des pieds en mètres.
   */
  function feetToMeters(feet) {
    return feet * 0.3048;
  }

  /**
   * Convertit des milles nautiques en kilomètres.
   */
  function nmToKm(nm) {
    return nm * 1.852;
  }

  return { getUserPosition, haversine, bearing, bearingLabel, feetToMeters, nmToKm };
})();
