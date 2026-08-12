// audio.js — Moteur Sonore Synthetizer Web Audio API pour Sylepse
// Radar acoustique sans asset MP3 externe

const SoundEngine = (() => {
  'use strict';

  let audioCtx = null;
  let enabled = true;

  function init() {
    const saved = localStorage.getItem('sylepse_sound');
    enabled = saved !== null ? JSON.parse(saved) : true;
  }

  function isEnabled() {
    return enabled;
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem('sylepse_sound', JSON.stringify(enabled));
    if (enabled) playRadarPing(true);
    return enabled;
  }

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playRadarPing(force = false) {
    if (!enabled && !force) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      masterGain.connect(ctx.destination);

      // Oscillator 1 (880 Hz High Tone)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      osc1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Oscillator 2 (Subtle Sub Ping)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);
      osc2.connect(masterGain);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.4);

    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  init();

  return { isEnabled, toggle, playRadarPing };
})();
