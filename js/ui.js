// ui.js — V3.2 UI Controller avec Icônes Vectorielles SVG et Barre de Navigation Segmentée
// Startup-Grade 2026

const UI = (() => {
  'use strict';

  const app = document.getElementById('app');

  let currentMode = 'list'; // 'list' | 'map'
  let currentAircraftList = [];
  let currentSource = 'airplanes.live';
  let currentRadius = 15;
  let currentPos = null;
  let currentSettings = { radiusNM: 15, unitDist: 'km', unitAlt: 'ft' };

  let handlers = {
    onScan: null,
    onExpandRadius: null,
    onSaveSetting: null,
    getHistory: null,
    onClearHistory: null
  };

  // SVGs Vectoriels Propres
  const SVGS = {
    sparkles: `<svg viewBox="0 0 24 24"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>`,
    zap: `<svg viewBox="0 0 24 24"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/></svg>`,
    list: `<svg viewBox="0 0 24 24"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    map: `<svg viewBox="0 0 24 24"><path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    history: `<svg viewBox="0 0 24 24"><path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.30367 19 6.34267M19 6.34267V3M19 6.34267H15.6569" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15A1.65 1.65 0 0 0 20 12A1.65 1.65 0 0 0 19.4 9L21 7.4L19.6 6L18 7.6A1.65 1.65 0 0 0 15 7A1.65 1.65 0 0 0 12 6.4L12 4.2L10 4.2L10 6.4A1.65 1.65 0 0 0 7 7A1.65 1.65 0 0 0 5.4 7.6L3.8 6L2.4 7.4L4 9A1.65 1.65 0 0 0 3.4 12A1.65 1.65 0 0 0 4 15L2.4 16.6L3.8 18L5.4 16.4A1.65 1.65 0 0 0 7 17A1.65 1.65 0 0 0 10 17.6L10 19.8L12 19.8L12 17.6A1.65 1.65 0 0 0 15 17A1.65 1.65 0 0 0 16.6 16.4L18.2 18L19.6 16.6L18 15Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`
  };

  function init(eventHandlers) {
    handlers = { ...handlers, ...eventHandlers };
    renderShell();
  }

  function setSettings(settings) {
    currentSettings = { ...currentSettings, ...settings };
  }

  function setPos(pos) {
    currentPos = pos;
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'className') node.className = val;
      else if (key === 'textContent') node.textContent = val;
      else if (key === 'innerHTML') node.innerHTML = val;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), val);
      else node.setAttribute(key, val);
    }
    children.forEach(child => {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    });
    return node;
  }

  // ────────────────────────────────────────────
  //  Shell Persistant
  // ────────────────────────────────────────────

  function renderShell() {
    app.innerHTML = '';

    const header = el('header', { className: 'sc-header' }, [
      el('div', { className: 'sc-brand' }, [
        el('span', { className: 'sc-logo-svg', innerHTML: SVGS.sparkles }),
        el('h1', { className: 'sc-title' }, [
          'SkyCheck',
          el('span', { className: 'sc-title-dot' })
        ]),
        el('span', { id: 'sc-header-badge', className: 'sc-count', textContent: '15 NM' })
      ]),
      el('div', { className: 'sc-header-actions' }, [
        el('button', {
          className: 'sc-icon-btn',
          title: 'Historique des scans',
          onClick: () => openSheet('history')
        }, [el('span', { innerHTML: SVGS.history })]),
        el('button', {
          className: 'sc-icon-btn',
          title: 'Réglages',
          onClick: () => openSheet('settings')
        }, [el('span', { innerHTML: SVGS.settings })])
      ])
    ]);

    const viewContainer = el('main', { id: 'sc-view', className: 'sc-view-container' });

    // Barre Segmentée avec Icônes Vectorielles et États Actifs
    const dock = el('nav', { className: 'sc-dock' }, [
      el('button', {
        id: 'sc-dock-scan',
        className: 'sc-dock-btn sc-dock-primary',
        onClick: () => handlers.onScan && handlers.onScan()
      }, [
        el('span', { className: 'sc-dock-svg', innerHTML: SVGS.zap }),
        el('span', { className: 'sc-dock-label', textContent: 'Scan' })
      ]),
      el('button', {
        id: 'sc-dock-btn-list',
        className: `sc-dock-btn ${currentMode === 'list' ? 'is-active' : ''}`,
        onClick: () => setViewMode('list')
      }, [
        el('span', { className: 'sc-dock-svg', innerHTML: SVGS.list }),
        el('span', { className: 'sc-dock-label', textContent: 'Liste' })
      ]),
      el('button', {
        id: 'sc-dock-btn-map',
        className: `sc-dock-btn ${currentMode === 'map' ? 'is-active' : ''}`,
        onClick: () => setViewMode('map')
      }, [
        el('span', { className: 'sc-dock-svg', innerHTML: SVGS.map }),
        el('span', { className: 'sc-dock-label', textContent: 'Carte' })
      ]),
      el('button', {
        className: 'sc-dock-btn',
        onClick: () => openSheet('history')
      }, [
        el('span', { className: 'sc-dock-svg', innerHTML: SVGS.history }),
        el('span', { className: 'sc-dock-label', textContent: 'Histo' })
      ])
    ]);

    const modalBackdrop = el('div', {
      id: 'sc-sheet-backdrop',
      className: 'sc-sheet-backdrop',
      onClick: closeSheet
    });

    const modalSheet = el('div', { id: 'sc-sheet', className: 'sc-sheet' });

    app.appendChild(header);
    app.appendChild(viewContainer);
    app.appendChild(dock);
    app.appendChild(modalBackdrop);
    app.appendChild(modalSheet);
  }

  function getViewContainer() {
    return document.getElementById('sc-view') || app;
  }

  function updateBadge(text) {
    const badge = document.getElementById('sc-header-badge');
    if (badge) badge.textContent = text;
  }

  function setScanButtonState(isScanning) {
    const btn = document.getElementById('sc-dock-scan');
    if (!btn) return;
    if (isScanning) {
      btn.classList.add('is-scanning');
      btn.querySelector('.sc-dock-label').textContent = 'Scan...';
    } else {
      btn.classList.remove('is-scanning');
      btn.querySelector('.sc-dock-label').textContent = 'Scan';
    }
  }

  function setViewMode(mode) {
    currentMode = mode;
    const btnList = document.getElementById('sc-dock-btn-list');
    const btnMap = document.getElementById('sc-dock-btn-map');

    if (btnList) btnList.classList.toggle('is-active', mode === 'list');
    if (btnMap) btnMap.classList.toggle('is-active', mode === 'map');

    if (currentAircraftList.length > 0) {
      renderResults(currentAircraftList, currentSource, currentRadius);
    }
  }

  // ────────────────────────────────────────────
  //  Rendu des états
  // ────────────────────────────────────────────

  function renderLoading(message = 'Localisation en cours…') {
    setScanButtonState(true);
    const view = getViewContainer();
    view.innerHTML = '';
    view.appendChild(
      el('div', { className: 'sc-loading' }, [
        el('div', { className: 'sc-radar' }, [
          el('div', { className: 'sc-radar-ring sc-ring-1' }),
          el('div', { className: 'sc-radar-ring sc-ring-2' }),
          el('div', { className: 'sc-radar-ring sc-ring-3' }),
          el('div', { className: 'sc-radar-sweep' }),
          el('div', { className: 'sc-radar-dot' }),
          el('div', { className: 'sc-radar-blip sc-blip-1' }),
          el('div', { className: 'sc-radar-blip sc-blip-2' }),
          el('div', { className: 'sc-radar-blip sc-blip-3' })
        ]),
        el('p', { className: 'sc-loading-text', textContent: message }),
        el('p', { className: 'sc-loading-sub', textContent: 'Analyse du signal ADS-B' })
      ])
    );
  }

  function updateLoadingText(message) {
    const txt = document.querySelector('.sc-loading-text');
    if (txt) txt.textContent = message;
  }

  function renderResults(aircraft, source, radiusNM) {
    setScanButtonState(false);
    currentAircraftList = aircraft;
    currentSource = source;
    currentRadius = radiusNM;
    updateBadge(`${aircraft.length} actif${aircraft.length > 1 ? 's' : ''}`);
    const view = getViewContainer();
    view.innerHTML = '';

    const metaBar = el('div', { className: 'sc-meta' }, [
      el('span', { textContent: `Rayon ${radiusNM} NM` }),
      el('span', { className: 'sc-meta-sep' }),
      el('span', { className: 'sc-meta-accent', textContent: `Source: ${source}` }),
      el('span', { className: 'sc-meta-sep' }),
      el('span', { textContent: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
    ]);
    view.appendChild(metaBar);

    if (currentMode === 'map') {
      const mapContainer = el('div', { id: 'sc-map', className: 'sc-map-container' });
      view.appendChild(mapContainer);

      if (currentPos) {
        SkyMap.init('sc-map', currentPos.lat, currentPos.lon, radiusNM, (ac) => {
          openAircraftDetailSheet(ac);
        });
        SkyMap.updateAircraft(aircraft);
      }
    } else {
      const list = el('div', { className: 'sc-list' });
      aircraft.forEach((ac, i) => {
        list.appendChild(buildAircraftCard(ac, i));
      });
      view.appendChild(list);

      requestAnimationFrame(() => {
        list.querySelectorAll('.sc-card').forEach((card, i) => {
          card.style.animationDelay = `${i * 50}ms`;
          card.classList.add('sc-card-in');
        });
      });
    }
  }

  function buildAircraftCard(ac) {
    const audLevel = ac.audibility ? ac.audibility.level : 'unknown';
    const audLabel = ac.audibility ? ac.audibility.label : '—';

    const modelTitle = ac.typeNameFormatted || ac.aircraftType || ac.typecode || 'Aéronef inconnu';
    const manufacturerName = ac.manufacturer ? `${ac.manufacturer}` : (ac.typecode ? `ICAO: ${ac.typecode}` : '');

    const operatorName = ac.operator || 'Opérateur non spécifié';
    const flightCallsign = ac.callsign ? `Vol ${ac.callsign}` : (ac.registration ? `Immat. ${ac.registration}` : '');

    let distStr = '—';
    if (ac.distKm != null) {
      distStr = currentSettings.unitDist === 'NM'
        ? `${(ac.distKm / 1.852).toFixed(1)} NM`
        : `${ac.distKm.toFixed(1)} km`;
    }

    let altStr = '—';
    if (ac.altFeet != null) {
      altStr = currentSettings.unitAlt === 'm'
        ? `${Math.round(ac.altFeet * 0.3048).toLocaleString()} m`
        : `${Math.round(ac.altFeet).toLocaleString()} ft`;
    }

    const card = el('div', {
      className: `sc-card sc-aud-${audLevel}`,
      onClick: () => openAircraftDetailSheet(ac)
    }, [
      el('div', { className: `sc-aud-tag ${audLevel}` }, [
        el('span', { className: 'sc-aud-tag-dot' }),
        el('span', { textContent: audLabel })
      ]),

      el('div', { className: 'sc-card-identity' }, [
        el('div', { className: 'sc-id-left' }, [
          el('div', { className: 'sc-model', textContent: modelTitle }),
          manufacturerName ? el('div', { className: 'sc-manufacturer', textContent: manufacturerName }) : null
        ]),
        el('div', { className: 'sc-id-right' }, [
          el('div', { className: 'sc-operator', textContent: operatorName }),
          flightCallsign ? el('div', { className: 'sc-callsign', textContent: flightCallsign }) : null
        ])
      ]),

      el('div', { className: 'sc-card-grid' }, [
        buildCell('ALTITUDE', altStr),
        buildCell('DISTANCE', distStr),
        buildCell('DIRECTION', ac.bearingLabel ? `${ac.bearingLabel} (${Math.round(ac.bearingDeg || 0)}°)` : '—'),
        buildCell('VITESSE', ac.groundSpeed != null ? `${Math.round(ac.groundSpeed)} kts` : '—')
      ]),

      el('div', { className: 'sc-card-tags' }, [
        ac.icao24 ? el('span', { className: 'sc-tag', textContent: `HEX ${ac.icao24.toUpperCase()}` }) : null,
        ac.squawk ? el('span', { className: 'sc-tag', textContent: `SQK ${ac.squawk}` }) : null,
        ac.registration ? el('span', { className: 'sc-tag', textContent: ac.registration }) : null,
        el('span', { className: 'sc-tag sc-tag-action', textContent: 'Fiche Passionné ➔' })
      ])
    ]);

    return card;
  }

  function buildCell(label, value) {
    return el('div', { className: 'sc-cell' }, [
      el('span', { className: 'sc-cell-label', textContent: label }),
      el('span', { className: 'sc-cell-val', textContent: value })
    ]);
  }

  function renderEmpty(radiusNM) {
    setScanButtonState(false);
    updateBadge('0 actif');
    const view = getViewContainer();
    view.innerHTML = '';

    view.appendChild(
      el('div', { className: 'sc-empty' }, [
        el('div', { className: 'sc-empty-visual' }, [
          el('div', { className: 'sc-empty-circle' }),
          el('div', { className: 'sc-empty-icon', textContent: '✦' })
        ]),
        el('h2', { className: 'sc-empty-title', textContent: 'Aucun appareil en rayon ADS-B' }),
        el('p', { className: 'sc-empty-body', innerHTML: `Aucun transpondeur actif détecté dans les <strong>${radiusNM} NM (~${Math.round(radiusNM * 1.852)} km)</strong>.` }),

        el('div', { className: 'sc-empty-reasons' }, [
          el('div', { className: 'sc-reason' }, [
            el('span', { className: 'sc-reason-icon', textContent: '🚁' }),
            el('span', { textContent: 'Hélicoptère à basse altitude (transpondeur souvent inactif)' })
          ]),
          el('div', { className: 'sc-reason' }, [
            el('span', { className: 'sc-reason-icon', textContent: '✈️' }),
            el('span', { textContent: 'Vol militaire ou gouvernemental restreint' })
          ]),
          el('div', { className: 'sc-reason' }, [
            el('span', { className: 'sc-reason-icon', textContent: '🛸' }),
            el('span', { textContent: 'Drone léger non équipé ADS-B Out' })
          ])
        ]),

        el('div', { className: 'sc-empty-actions' }, [
          el('button', {
            className: 'sc-btn sc-btn-lg',
            onClick: () => handlers.onExpandRadius && handlers.onExpandRadius(30)
          }, [
            el('span', { textContent: '🔍 Élargir à 30 NM (~55 km)' })
          ])
        ])
      ])
    );
  }

  function renderError(message, onRetry) {
    setScanButtonState(false);
    updateBadge('Erreur');
    const view = getViewContainer();
    view.innerHTML = '';

    view.appendChild(
      el('div', { className: 'sc-error' }, [
        el('div', { className: 'sc-error-visual', textContent: '!' }),
        el('h2', { className: 'sc-error-title', textContent: 'Signal GPS ou Réseau indisponible' }),
        el('p', { className: 'sc-error-desc', textContent: message }),
        el('button', { className: 'sc-btn sc-btn-lg', onClick: onRetry }, [
          el('span', { textContent: 'Réessayer le scan' })
        ])
      ])
    );
  }

  // ────────────────────────────────────────────
  //  Fiche Passionné d'Aviation
  // ────────────────────────────────────────────

  async function openAircraftDetailSheet(ac) {
    const backdrop = document.getElementById('sc-sheet-backdrop');
    const sheet = document.getElementById('sc-sheet');
    if (!backdrop || !sheet) return;

    sheet.innerHTML = '';
    sheet.classList.add('sc-sheet-detail');

    const modelName = ac.typeNameFormatted || ac.aircraftType || ac.typecode || 'Aéronef inconnu';
    const header = el('div', { className: 'sc-sheet-header' }, [
      el('div', { className: 'sc-detail-header-info' }, [
        el('span', { className: 'sc-detail-sub', textContent: ac.operator || 'Opérateur privé / Inconnu' }),
        el('h3', { className: 'sc-sheet-title', textContent: modelName })
      ]),
      el('button', { className: 'sc-sheet-close', onClick: closeSheet, textContent: '✕' })
    ]);

    const body = el('div', { className: 'sc-sheet-body' });

    const photoContainer = el('div', { className: 'sc-photo-card' }, [
      el('div', { className: 'sc-photo-loading', textContent: 'Chargement de la photo spotter...' })
    ]);
    body.appendChild(photoContainer);

    if (ac.registration) {
      Api.fetchAircraftPhoto(ac.registration).then(photo => {
        if (photo && photo.thumbnail) {
          photoContainer.innerHTML = '';
          photoContainer.appendChild(el('img', { src: photo.thumbnail, alt: modelName, className: 'sc-ac-img' }));
          if (photo.photographer) {
            photoContainer.appendChild(el('span', { className: 'sc-photo-credit', textContent: `© ${photo.photographer} (Planespotters.net)` }));
          }
        } else {
          photoContainer.innerHTML = `<div class="sc-photo-placeholder"><span>✈</span><p>Aucune photo d'immatriculation (${ac.registration})</p></div>`;
        }
      });
    } else {
      photoContainer.innerHTML = `<div class="sc-photo-placeholder"><span>✈</span><p>Immatriculation non transmise en ADS-B</p></div>`;
    }

    const altFt = ac.altFeet != null ? `${Math.round(ac.altFeet).toLocaleString()} ft` : 'Non disponible';
    const altM = ac.altMeters != null ? `${Math.round(ac.altMeters).toLocaleString()} m` : '';
    const speedKts = ac.groundSpeed != null ? `${Math.round(ac.groundSpeed)} kts` : '—';
    const speedKmh = ac.groundSpeed != null ? `${Math.round(ac.groundSpeed * 1.852)} km/h` : '';
    const vertRate = ac.verticalRate != null
      ? (ac.verticalRate > 100 ? `↗ Montée (+${ac.verticalRate} ft/min)` : ac.verticalRate < -100 ? `↘ Descente (${ac.verticalRate} ft/min)` : '➔ En croisière en palier')
      : 'Altitude stable';

    const metricsCard = el('div', { className: 'sc-detail-metrics' }, [
      el('div', { className: 'sc-metric-box' }, [
        el('span', { className: 'sc-metric-title', textContent: 'ALTITUDE DE VOL' }),
        el('span', { className: 'sc-metric-val', textContent: altFt }),
        el('span', { className: 'sc-metric-sub', textContent: altM })
      ]),
      el('div', { className: 'sc-metric-box' }, [
        el('span', { className: 'sc-metric-title', textContent: 'VITESSE SOL' }),
        el('span', { className: 'sc-metric-val', textContent: speedKts }),
        el('span', { className: 'sc-metric-sub', textContent: speedKmh })
      ])
    ]);
    body.appendChild(metricsCard);

    body.appendChild(
      el('div', { className: 'sc-detail-row' }, [
        el('span', { className: 'sc-row-label', textContent: 'Tendance verticale' }),
        el('span', { className: 'sc-row-val', textContent: vertRate })
      ])
    );

    if (ac.specs) {
      const specsBox = el('div', { className: 'sc-specs-card' }, [
        el('h4', { className: 'sc-specs-title', textContent: 'Fiche Technique de l\'Appareil' }),
        el('div', { className: 'sc-specs-grid' }, [
          el('div', { className: 'sc-spec-item' }, [el('span', { className: 'sc-spec-lbl', textContent: 'Catégorie' }), el('span', { className: 'sc-spec-val', textContent: ac.specs.category })]),
          el('div', { className: 'sc-spec-item' }, [el('span', { className: 'sc-spec-lbl', textContent: 'Motorisation' }), el('span', { className: 'sc-spec-val', textContent: ac.specs.engines })]),
          el('div', { className: 'sc-spec-item' }, [el('span', { className: 'sc-spec-lbl', textContent: 'Vitesse max croisière' }), el('span', { className: 'sc-spec-val', textContent: ac.specs.speed })]),
          el('div', { className: 'sc-spec-item' }, [el('span', { className: 'sc-spec-lbl', textContent: 'Envergure des ailes' }), el('span', { className: 'sc-spec-val', textContent: ac.specs.wingspan })])
        ])
      ]);
      body.appendChild(specsBox);
    }

    const techBox = el('div', { className: 'sc-tech-card' }, [
      el('div', { className: 'sc-tech-item' }, [el('span', { textContent: 'Transpondeur HEX (ICAO)' }), el('strong', { textContent: (ac.icao24 || 'Inconnu').toUpperCase() })]),
      el('div', { className: 'sc-tech-item' }, [el('span', { textContent: 'Code Squawk (ATC)' }), el('strong', { textContent: ac.squawk || '—' })]),
      el('div', { className: 'sc-tech-item' }, [el('span', { textContent: 'Immatriculation' }), el('strong', { textContent: ac.registration || '—' })]),
      el('div', { className: 'sc-tech-item' }, [el('span', { textContent: 'Indicatif de Vol' }), el('strong', { textContent: ac.callsign || '—' })])
    ]);
    body.appendChild(techBox);

    const actions = el('div', { className: 'sc-detail-actions' }, [
      el('button', {
        className: 'sc-btn sc-btn-lg',
        onClick: () => {
          closeSheet();
          if (currentMode !== 'map') setViewMode('map');
          if (currentPos) SkyMap.centerOn(ac.lat, ac.lon, 12);
        }
      }, [el('span', { textContent: '🎯 Centrer sur la Carte Radar' })])
    ]);
    body.appendChild(actions);

    sheet.appendChild(header);
    sheet.appendChild(body);

    backdrop.classList.add('is-open');
    sheet.classList.add('is-open');
  }

  function openSheet(type) {
    const backdrop = document.getElementById('sc-sheet-backdrop');
    const sheet = document.getElementById('sc-sheet');
    if (!backdrop || !sheet) return;

    sheet.innerHTML = '';
    sheet.classList.remove('sc-sheet-detail');

    if (type === 'history') {
      renderHistoryContent(sheet);
    } else if (type === 'settings') {
      renderSettingsContent(sheet);
    }

    backdrop.classList.add('is-open');
    sheet.classList.add('is-open');
  }

  function closeSheet() {
    const backdrop = document.getElementById('sc-sheet-backdrop');
    const sheet = document.getElementById('sc-sheet');
    if (backdrop) backdrop.classList.remove('is-open');
    if (sheet) sheet.classList.remove('is-open');
  }

  function renderHistoryContent(container) {
    const historyList = handlers.getHistory ? handlers.getHistory() : [];

    const header = el('div', { className: 'sc-sheet-header' }, [
      el('h3', { className: 'sc-sheet-title', textContent: 'Historique des appareils captés' }),
      el('button', { className: 'sc-sheet-close', onClick: closeSheet, textContent: '✕' })
    ]);

    const body = el('div', { className: 'sc-sheet-body' });

    if (historyList.length === 0) {
      body.appendChild(el('p', { className: 'sc-sheet-empty', textContent: 'Aucun enregistrement dans l\'historique récent.' }));
    } else {
      historyList.forEach(item => {
        const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(item.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' });

        body.appendChild(
          el('div', {
            className: 'sc-history-item',
            onClick: () => {
              closeSheet();
              openAircraftDetailSheet(item);
            }
          }, [
            el('div', { className: 'sc-history-top' }, [
              el('span', { className: 'sc-history-model', textContent: item.typeNameFormatted || item.aircraftType || item.typecode || 'Aéronef inconnu' }),
              el('span', { className: 'sc-history-time', textContent: `${dateStr} ${timeStr}` })
            ]),
            el('div', { className: 'sc-history-sub' }, [
              el('span', { textContent: item.operator || item.callsign || item.icao24 }),
              el('span', { textContent: `• ${item.distKm ? item.distKm.toFixed(1) + ' km' : ''} ${item.bearingLabel || ''}` })
            ])
          ])
        );
      });

      body.appendChild(
        el('button', {
          className: 'sc-btn sc-btn-danger',
          onClick: () => {
            if (handlers.onClearHistory) handlers.onClearHistory();
            closeSheet();
          }
        }, [el('span', { textContent: 'Effacer l\'historique' })])
      );
    }

    container.appendChild(header);
    container.appendChild(body);
  }

  function renderSettingsContent(container) {
    const header = el('div', { className: 'sc-sheet-header' }, [
      el('h3', { className: 'sc-sheet-title', textContent: 'Réglages de SkyCheck' }),
      el('button', { className: 'sc-sheet-close', onClick: closeSheet, textContent: '✕' })
    ]);

    const body = el('div', { className: 'sc-sheet-body' });

    const radiusGroup = el('div', { className: 'sc-setting-group' }, [
      el('label', { className: 'sc-setting-label', textContent: 'Rayon de scan ADS-B' }),
      el('div', { className: 'sc-pill-selector' }, [15, 25, 40].map(r => {
        const active = currentSettings.radiusNM === r ? 'is-active' : '';
        return el('button', {
          className: `sc-pill-opt ${active}`,
          onClick: () => {
            handlers.onSaveSetting && handlers.onSaveSetting('radiusNM', r);
            currentSettings.radiusNM = r;
            updateBadge(`${r} NM`);
            renderSettingsContent(container);
          }
        }, [el('span', { textContent: `${r} NM (~${Math.round(r * 1.852)} km)` })]);
      }))
    ]);

    const distGroup = el('div', { className: 'sc-setting-group' }, [
      el('label', { className: 'sc-setting-label', textContent: 'Unité de distance' }),
      el('div', { className: 'sc-pill-selector' }, ['km', 'NM'].map(u => {
        const active = currentSettings.unitDist === u ? 'is-active' : '';
        return el('button', {
          className: `sc-pill-opt ${active}`,
          onClick: () => {
            handlers.onSaveSetting && handlers.onSaveSetting('unitDist', u);
            currentSettings.unitDist = u;
            renderSettingsContent(container);
          }
        }, [el('span', { textContent: u === 'km' ? 'Kilomètres (km)' : 'Milles nautiques (NM)' })]);
      }))
    ]);

    const altGroup = el('div', { className: 'sc-setting-group' }, [
      el('label', { className: 'sc-setting-label', textContent: 'Unité d\'altitude' }),
      el('div', { className: 'sc-pill-selector' }, ['ft', 'm'].map(u => {
        const active = currentSettings.unitAlt === u ? 'is-active' : '';
        return el('button', {
          className: `sc-pill-opt ${active}`,
          onClick: () => {
            handlers.onSaveSetting && handlers.onSaveSetting('unitAlt', u);
            currentSettings.unitAlt = u;
            renderSettingsContent(container);
          }
        }, [el('span', { textContent: u === 'ft' ? 'Pieds (ft)' : 'Mètres (m)' })]);
      }))
    ]);

    body.appendChild(radiusGroup);
    body.appendChild(distGroup);
    body.appendChild(altGroup);

    container.appendChild(header);
    container.appendChild(body);
  }

  return {
    init,
    setSettings,
    setPos,
    renderLoading,
    updateLoadingText,
    renderResults,
    renderEmpty,
    renderError,
    openSheet,
    closeSheet,
    openAircraftDetailSheet
  };
})();
