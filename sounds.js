// Sound effects synthesised with the Web Audio API: no audio files, nothing loaded from the network.
window.COIN_DASH_SOUNDS = (() => {
  let ctx = null;

  function context() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    // Browsers start the context suspended until a user gesture; keyboard play counts as one.
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ type, from, to, duration, volume }) {
    const ac = context();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + duration);
    // Short attack and exponential decay avoid clicks at the start and end.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    coin() { tone({ type: 'sine', from: 880, to: 1320, duration: 0.12, volume: 0.25 }); },
    caught() { tone({ type: 'sawtooth', from: 110, to: 70, duration: 0.45, volume: 0.2 }); }
  };
})();
