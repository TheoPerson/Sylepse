// app.js — Orchestration SkyCheck V2 avec storage local (réglages + historique)

const App = (() => {
  'use strict';

  const STORAGE_KEY_SETTINGS = 'skycheck_settings_v2';
  const STORAGE_KEY_HISTORY = 'skycheck_history_v2';

  let settings = {
    radiusNM: 15,
    unitDist: 'km',
    unitAlt: 'ft'
  };

  let lastPosition = null;

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('[SkyCheck] Erreur chargement réglages:', e);
    }
  }

  function saveSetting(key, val) {
    settings[key] = val;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('[SkyCheck] Erreur sauvegarde réglage:', e);
    }
    UI.setSettings(settings);
  }

  function getHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAircraftToHistory(aircraftList) {
    if (!aircraftList || aircraftList.length === 0) return;
    const history = getHistory();
    
    // On conserve au max 30 entrées, en dédupliquant par icao24 récents (moins de 5 minutes)
    const now = Date.now();
    const newItems = aircraftList.filter(ac => {
      return !history.some(h => h.icao24 === ac.icao24 && (now - h.timestamp) < 300000);
    });

    const updated = [...newItems, ...history].slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[SkyCheck] Erreur sauvegarde historique:', e);
    }
  }

  function clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {}
  }

  async function runScan(customRadius = null) {
    const radiusToUse = customRadius || settings.radiusNM;

    try {
      UI.renderLoading('Géolocalisation...');
      const pos = await Geo.getUserPosition();
      lastPosition = pos;
      UI.setPos(pos);

      UI.updateLoadingText(`Analyse du ciel (${radiusToUse} NM)...`);
      const { aircraft, source } = await Api.scanNearby(pos.lat, pos.lon, radiusToUse);

      if (aircraft.length > 0) {
        saveAircraftToHistory(aircraft);
        UI.renderResults(aircraft, source, radiusToUse);
      } else {
        UI.renderEmpty(radiusToUse);
      }
    } catch (err) {
      console.error('[SkyCheck]', err);
      UI.renderError(err.message || 'Problème de connexion ou GPS.', () => runScan(customRadius));
    }
  }

  function init() {
    loadSettings();
    UI.init({
      onScan: () => runScan(),
      onExpandRadius: (newRadius) => runScan(newRadius),
      onSaveSetting: (k, v) => saveSetting(k, v),
      getHistory: () => getHistory(),
      onClearHistory: () => clearHistory()
    });
    UI.setSettings(settings);
    runScan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { runScan };
})();
