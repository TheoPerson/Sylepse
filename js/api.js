// api.js — intégrations airplanes.live (primaire), OpenSky (fallback), hexdb.io (enrichissement), Planespotters (photos)
// Specs exactes : voir AGENTS.md

const Api = (() => {
  'use strict';

  const DEFAULT_RADIUS_NM = 15;
  const FETCH_TIMEOUT_MS = 8000;

  // Dictionnaire de décodage des codes ICAO avions fréquents
  const AIRCRAFT_DICTIONARY = {
    'B763': { name: 'Boeing 767-300', category: 'Bi-réacteur long-courrier / Cargo', engines: '2x GE CF6 / PW4000', speed: '900 km/h', wingspan: '47.6 m' },
    'B738': { name: 'Boeing 737-800', category: 'Bi-réacteur moyen-courrier', engines: '2x CFM56-7B', speed: '850 km/h', wingspan: '35.8 m' },
    'B739': { name: 'Boeing 737-900', category: 'Bi-réacteur moyen-courrier', engines: '2x CFM56-7B', speed: '850 km/h', wingspan: '35.8 m' },
    'B38M': { name: 'Boeing 737 MAX 8', category: 'Bi-réacteur nouvelle génération', engines: '2x LEAP-1B', speed: '840 km/h', wingspan: '35.9 m' },
    'B77W': { name: 'Boeing 777-300ER', category: 'Gros-porteur long-courrier', engines: '2x GE90-115B', speed: '905 km/h', wingspan: '64.8 m' },
    'B789': { name: 'Boeing 787-9 Dreamliner', category: 'Gros-porteur long-courrier composites', engines: '2x GEnx / Trent 1000', speed: '903 km/h', wingspan: '60.1 m' },
    'A320': { name: 'Airbus A320', category: 'Bi-réacteur moyen-courrier', engines: '2x CFM56 / V2500', speed: '840 km/h', wingspan: '34.1 m' },
    'A321': { name: 'Airbus A321', category: 'Bi-réacteur moyen-courrier étendu', engines: '2x CFM56 / V2500', speed: '840 km/h', wingspan: '34.1 m' },
    'A20N': { name: 'Airbus A320neo', category: 'Bi-réacteur moyen-courrier efficient', engines: '2x LEAP-1A / PW1100G', speed: '840 km/h', wingspan: '35.8 m' },
    'A21N': { name: 'Airbus A321neo', category: 'Bi-réacteur long/moyen-courrier', engines: '2x LEAP-1A / PW1100G', speed: '840 km/h', wingspan: '35.8 m' },
    'A333': { name: 'Airbus A330-300', category: 'Gros-porteur long-courrier', engines: '2x Trent 700 / CF6', speed: '870 km/h', wingspan: '60.3 m' },
    'A359': { name: 'Airbus A350-900', category: 'Gros-porteur ultra-moderne', engines: '2x Rolls-Royce Trent XWB', speed: '903 km/h', wingspan: '64.7 m' },
    'A388': { name: 'Airbus A380-800', category: 'Quadriréacteur géant à double pont', engines: '4x EA GP7200 / Trent 900', speed: '903 km/h', wingspan: '79.8 m' },
    'E190': { name: 'Embraer E190', category: 'Avion régional bi-réacteur', engines: '2x GE CF34-10E', speed: '830 km/h', wingspan: '28.7 m' },
    'CRJ9': { name: 'Bombardier CRJ-900', category: 'Jet régional', engines: '2x GE CF34-8C5', speed: '830 km/h', wingspan: '24.9 m' },
    'AT76': { name: 'ATR 72-600', category: 'Bi-turbopropulseur régional', engines: '2x PW127M', speed: '510 km/h', wingspan: '27.1 m' },
    'EC35': { name: 'Eurocopter EC135', category: 'Hélicoptère léger bimoteur', engines: '2x Turbomeca Arrius', speed: '254 km/h', wingspan: '10.2 m' },
    'EC45': { name: 'Eurocopter EC145 / H145', category: 'Hélicoptère de secours / multimission', engines: '2x Safran Arriel 2E', speed: '268 km/h', wingspan: '11.0 m' }
  };

  function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  // ────────────────────────────────────────────
  //  Fetch Airplanes.live
  // ────────────────────────────────────────────

  async function fetchAirplanesLive(lat, lon, radiusNM = DEFAULT_RADIUS_NM) {
    const url = `https://api.adsb.lol/v2/point/${lat}/${lon}/${radiusNM}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`adsb.lol HTTP ${res.status}`);
    const data = await res.json();
    return (data.ac || []).map(ac => normalizeAirplanesLive(ac, lat, lon));
  }

  function normalizeAirplanesLive(ac, userLat, userLon) {
    const acLat = ac.lat;
    const acLon = ac.lon;
    const altFt = ac.alt_baro ?? ac.alt_geom ?? null;
    const altM = altFt != null ? Geo.feetToMeters(altFt) : null;
    const distKm = (acLat != null && acLon != null)
      ? Geo.haversine(userLat, userLon, acLat, acLon)
      : null;
    const dir = (acLat != null && acLon != null)
      ? Geo.bearing(userLat, userLon, acLat, acLon)
      : null;

    const rawType = (ac.t || '').trim().toUpperCase();
    const dictInfo = AIRCRAFT_DICTIONARY[rawType] || null;

    // Découpage propre des opérateurs / callsigns sans collision
    let rawOp = (ac.ownOp || '').trim();
    let rawFlight = (ac.flight || '').trim();
    let rawReg = (ac.r || '').trim();

    return {
      icao24: (ac.hex || '').toLowerCase().trim(),
      callsign: rawFlight || null,
      registration: rawReg || null,
      typecode: rawType || null,
      typeNameFormatted: dictInfo ? dictInfo.name : (rawType || 'Aéronef inconnu'),
      category: dictInfo ? dictInfo.category : 'Aviation générale / Commercial',
      specs: dictInfo || null,
      operator: rawOp || null,
      lat: acLat,
      lon: acLon,
      altMeters: altM,
      altFeet: altFt,
      groundSpeed: ac.gs ?? null, // knots
      track: ac.track ?? null,
      verticalRate: ac.baro_rate ?? null, // ft/min
      squawk: ac.squawk || null,
      distKm: distKm,
      bearingDeg: dir,
      bearingLabel: dir != null ? Geo.bearingLabel(dir) : null,
      source: 'adsb.lol',
      timestamp: Date.now(),
      _raw: ac
    };
  }

  // ────────────────────────────────────────────
  //  Fallback OpenSky
  // ────────────────────────────────────────────

  async function fetchOpenSky(lat, lon, radiusKM = 30) {
    const dLat = radiusKM / 111;
    const dLon = radiusKM / (111 * Math.cos(lat * (Math.PI / 180)));
    const url = `https://opensky-network.org/api/states/all?lamin=${lat - dLat}&lomin=${lon - dLon}&lamax=${lat + dLat}&lomax=${lon + dLon}`;
    const res = await fetchWithTimeout(url, 10000);
    if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
    const data = await res.json();
    return (data.states || []).map(s => normalizeOpenSky(s, lat, lon));
  }

  function normalizeOpenSky(state, userLat, userLon) {
    const acLat = state[6];
    const acLon = state[5];
    const altM = state[7] ?? state[13] ?? null;
    const altFt = altM != null ? Math.round(altM / 0.3048) : null;
    const distKm = (acLat != null && acLon != null)
      ? Geo.haversine(userLat, userLon, acLat, acLon)
      : null;
    const dir = (acLat != null && acLon != null)
      ? Geo.bearing(userLat, userLon, acLat, acLon)
      : null;

    return {
      icao24: (state[0] || '').trim().toLowerCase(),
      callsign: (state[1] || '').trim() || null,
      registration: null,
      typecode: null,
      typeNameFormatted: 'Aéronef (OpenSky)',
      category: 'Aviation générale / Suivi OpenSky',
      specs: null,
      operator: null,
      lat: acLat,
      lon: acLon,
      altMeters: altM,
      altFeet: altFt,
      groundSpeed: state[9] ? Math.round(state[9] * 1.94384) : null,
      track: state[10] ?? null,
      verticalRate: state[11] ?? null,
      squawk: state[14] || null,
      distKm: distKm,
      bearingDeg: dir,
      bearingLabel: dir != null ? Geo.bearingLabel(dir) : null,
      source: 'opensky',
      timestamp: Date.now(),
      _raw: state
    };
  }

  // ────────────────────────────────────────────
  //  Enrichissement Photos : Planespotters.net
  // ────────────────────────────────────────────

  const photoCache = {};

  async function fetchAircraftPhoto(registration) {
    if (!registration) return null;
    const key = registration.toUpperCase().trim();
    if (photoCache[key] !== undefined) return photoCache[key];

    try {
      const url = `https://api.planespotters.net/pub/photos/reg/${key}`;
      const res = await fetchWithTimeout(url, 4000);
      if (!res.ok) {
        photoCache[key] = null;
        return null;
      }
      const data = await res.json();
      if (data && data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        const result = {
          thumbnail: photo.thumbnail_large ? photo.thumbnail_large.src : photo.thumbnail.src,
          photographer: photo.photographer,
          link: photo.link
        };
        photoCache[key] = result;
        return result;
      }
      photoCache[key] = null;
      return null;
    } catch {
      photoCache[key] = null;
      return null;
    }
  }

  // ────────────────────────────────────────────
  //  Enrichissement hexdb.io
  // ────────────────────────────────────────────

  const hexdbCache = {};

  async function fetchAircraftInfo(icao24) {
    if (!icao24) return null;
    const key = icao24.toLowerCase();
    if (hexdbCache[key] !== undefined) return hexdbCache[key];

    try {
      const url = `https://hexdb.io/api/v1/aircraft/${key}`;
      const res = await fetchWithTimeout(url, 5000);
      if (!res.ok) {
        hexdbCache[key] = null;
        return null;
      }
      const data = await res.json();
      const info = {
        manufacturer: data.Manufacturer || data.manufacturer || null,
        type: data.Type || data.type || null,
        registeredOwner: data.RegisteredOwners || data.registeredOwners || null,
        registration: data.Registration || data.registration || null,
        icaoType: data.ICAOTypeCode || data.icaoTypeCode || null
      };
      hexdbCache[key] = info;
      return info;
    } catch {
      hexdbCache[key] = null;
      return null;
    }
  }

  function scoreAudibility(altMeters, distKm) {
    if (altMeters == null || distKm == null) {
      return { level: 'unknown', label: 'Données insuffisantes', sortOrder: 99 };
    }
    if (altMeters < 1000 && distKm < 8) {
      return { level: 'high', label: 'Très probable', sortOrder: 1 };
    }
    if (altMeters < 3000 && distKm < 15) {
      return { level: 'medium', label: 'Probable', sortOrder: 2 };
    }
    if (altMeters < 6000 && distKm < 25) {
      return { level: 'low', label: 'Possible', sortOrder: 3 };
    }
    return { level: 'unlikely', label: 'Peu probable', sortOrder: 4 };
  }

  // ────────────────────────────────────────────
  //  Scan principal
  // ────────────────────────────────────────────

  async function scanNearby(lat, lon, radiusNM = DEFAULT_RADIUS_NM) {
    let aircraft = [];
    let source = 'airplanes.live';

    try {
      aircraft = await fetchAirplanesLive(lat, lon, radiusNM);
    } catch (primaryErr) {
      try {
        aircraft = await fetchOpenSky(lat, lon, Geo.nmToKm(radiusNM));
        source = 'opensky';
      } catch (fallbackErr) {
        throw new Error('Impossible de contacter les services de suivi aérien.');
      }
    }

    aircraft = aircraft.filter(ac => ac.lat != null && ac.lon != null);

    aircraft.forEach(ac => {
      ac.audibility = scoreAudibility(ac.altMeters, ac.distKm);
    });

    aircraft.sort((a, b) => {
      const s = a.audibility.sortOrder - b.audibility.sortOrder;
      if (s !== 0) return s;
      return (a.distKm || 999) - (b.distKm || 999);
    });

    const toEnrich = aircraft.slice(0, 8);
    const enrichResults = await Promise.allSettled(
      toEnrich.map(ac => fetchAircraftInfo(ac.icao24))
    );
    enrichResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        const info = result.value;
        const ac = toEnrich[i];
        if (!ac.typecode && info.icaoType) ac.typecode = info.icaoType;
        if (!ac.operator && info.registeredOwner) ac.operator = info.registeredOwner;
        if (!ac.registration && info.registration) ac.registration = info.registration;
        ac.manufacturer = info.manufacturer || null;
        if (info.type) ac.aircraftType = info.type;

        // Mise à jour de la traduction si typecode enrichi
        if (ac.typecode && AIRCRAFT_DICTIONARY[ac.typecode]) {
          ac.typeNameFormatted = AIRCRAFT_DICTIONARY[ac.typecode].name;
          ac.specs = AIRCRAFT_DICTIONARY[ac.typecode];
        }
      }
    });

    return { aircraft, source, radiusNM };
  }

  return { scanNearby, scoreAudibility, fetchAircraftInfo, fetchAircraftPhoto };
})();
