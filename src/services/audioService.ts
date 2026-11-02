/**
 * Procedural Web Audio API sound generator for Bharat Bus Simulator 3D.
 * Generates realistic diesel bus engine, pneumatic air brakes,
 * authentic Indian musical multi-tone air horns, indicators, wipers, and rain.
 * Zero external mp3 dependencies.
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private rainNode: AudioNode | null = null;
  private isMuted: boolean = false;
  private engineRunning: boolean = false;
  private hornOscs: OscillatorNode[] = [];
  private hornGain: GainNode | null = null;
  private indicatorInterval: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Audio context not allowed or supported yet
    }
  }

  private ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Engine Sound ---
  public startEngine() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.engineRunning) return;

    try {
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

      // Low rumble fundamental
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(42, this.ctx.currentTime);

      // Higher harmonic piston chatter
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(84, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.engineRunning = true;
    } catch {
      // ignore
    }
  }

  public updateEngine(speedKmH: number, throttle: number) {
    if (!this.ctx || !this.engineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const baseFreq = 42;
    const speedFactor = Math.min(speedKmH / 110, 1.0);
    const rpmMultiplier = 1 + speedFactor * 1.8 + throttle * 0.7;
    const targetFreq = baseFreq * rpmMultiplier;

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 2.05, now, 0.08);

    const filterCutoff = 130 + speedFactor * 450 + throttle * 280;
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);
  }

  public stopEngine() {
    if (!this.engineRunning) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc1?.disconnect();
      this.engineOsc2?.disconnect();
      this.engineGain?.disconnect();
    } catch {
      // ignore
    }
    this.engineRunning = false;
  }

  // --- Air Brake Release ---
  public playAirBrake() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      // White noise buffer for pneumatic hiss
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      filter.Q.setValueAtTime(2, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch {
      // ignore
    }
  }

  // --- Indian Multi-Tone Horns ---
  public playHorn(preset: number = 1) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.stopHorn();

    const now = this.ctx.currentTime;
    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.45, now);
    this.hornGain.connect(this.masterGain);

    if (preset === 1) {
      // Famous Indian Musical "Dhoom / Bollywood" Air Horn Sequence (F4, A4, C5, F5, E5, D5)
      const notes = [349.23, 440.0, 523.25, 698.46, 659.25, 587.33];
      const stepTime = 0.09;
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * stepTime);

        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.setValueAtTime(0.5, now + idx * stepTime);
        noteGain.gain.setValueAtTime(0.001, now + (idx + 1) * stepTime);

        osc.connect(noteGain);
        noteGain.connect(this.hornGain!);
        osc.start(now + idx * stepTime);
        osc.stop(now + (idx + 1) * stepTime + 0.05);
        this.hornOscs.push(osc);
      });
    } else if (preset === 2) {
      // Twin-tone heavy highway pressure horn (Dual tone: 370Hz + 440Hz with vibration)
      const freqs = [370, 445];
      freqs.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(this.hornGain!);
        osc.start(now);
        this.hornOscs.push(osc);
      });
    } else {
      // Standard Indian Tata Truck horn with vibrant beat (400Hz + 406Hz)
      const freqs = [400, 407];
      freqs.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(this.hornGain!);
        osc.start(now);
        this.hornOscs.push(osc);
      });
    }
  }

  public stopHorn() {
    if (this.hornOscs.length > 0) {
      this.hornOscs.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.hornOscs = [];
    }
    if (this.hornGain) {
      try {
        this.hornGain.disconnect();
      } catch {
        // ignore
      }
      this.hornGain = null;
    }
  }

  // --- Pneumatic Door Sound ---
  public playDoorSound(isOpen: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const duration = 0.5;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = isOpen ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(isOpen ? 800 : 1200, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch {
      // ignore
    }
  }

  // --- Indicator Relay Click ---
  public startIndicator() {
    this.ensureContext();
    if (this.indicatorInterval) return;

    this.indicatorInterval = window.setInterval(() => {
      this.playClick();
    }, 450);
  }

  public stopIndicator() {
    if (this.indicatorInterval) {
      clearInterval(this.indicatorInterval);
      this.indicatorInterval = null;
    }
  }

  private playClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // ignore
    }
  }

  // --- Bell Chime for passenger ticket / bus stop ---
  public playChime() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [880, 1320].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    } catch {
      // ignore
    }
  }

  // --- Wiper sweep sound ---
  public playWiperSweep() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(240, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch {
      // ignore
    }
  }

  // --- Rain ambient sound ---
  public setRain(active: boolean, heavy: boolean = false) {
    if (!active) {
      if (this.rainNode) {
        try {
          this.rainNode.disconnect();
        } catch {
          // ignore
        }
        this.rainNode = null;
      }
      return;
    }
    if (this.rainNode) return; // already playing

    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(heavy ? 1200 : 700, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(heavy ? 0.25 : 0.12, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
      this.rainNode = gain;
    } catch {
      // ignore
    }
  }

  // --- Diesel Refuel Pump sound ---
  public playRefuelPump() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      // Liquid nozzle hiss + mechanical meter click
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.38);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();

      // Pump ding chime
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, this.ctx.currentTime);
      oscGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // ignore
    }
  }

  // --- Low Fuel Alert Beep ---
  public playLowFuelAlert() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [800, 600].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.25, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.09);
      });
    } catch {
      // ignore
    }
  }

  // --- Passenger Gasp / Shock (sudden jerk or crash) ---
  public playPassengerGasp() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch {
      // ignore
    }
  }

  // --- Passenger Praise Chime ---
  public playPassengerPraise() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {
      // ignore
    }
  }
}

export const audioService = new AudioService();
