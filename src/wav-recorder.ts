// Captura del micrófono a WAV PCM 16 bit, 16 kHz, mono, que es exactamente lo
// que espera Whisper. Sin MediaRecorder ni webm: convertir después obligaría a
// meter ffmpeg y el audio ya viaja solo hasta el servidor local.
//
// ScriptProcessorNode está marcado obsoleto pero sigue funcionando en Chromium
// y no exige servir un archivo de worklet aparte. Cambiarlo por AudioWorklet es
// trabajo futuro, no riesgo.
const TARGET_RATE = 16000;

export class WavRecorder {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private inputRate = TARGET_RATE;
  /** Nivel de entrada de 0 a 1, suavizado. Alimenta el indicador del micrófono. */
  level = 0;

  get active() {
    return this.processor !== null;
  }

  get seconds() {
    return this.chunks.reduce((n, c) => n + c.length, 0) / this.inputRate;
  }

  async start() {
    if (this.active) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    this.ctx = new AudioContext();
    this.inputRate = this.ctx.sampleRate;
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.chunks = [];
    this.level = 0;
    this.processor.onaudioprocess = (event) => {
      const buffer = event.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(buffer));
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
      const rms = Math.sqrt(sum / buffer.length);
      // Escala perceptual y suavizado: el valor crudo apenas se mueve al hablar.
      this.level = this.level * 0.65 + Math.min(1, Math.sqrt(rms) * 2.6) * 0.35;
    };
    this.source.connect(this.processor);
    // Sin conectar a destination el nodo no procesa en algunos Chromium.
    this.processor.connect(this.ctx.destination);
  }

  cancel() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.ctx?.close();
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.ctx = null;
    this.chunks = [];
    this.level = 0;
  }

  /** Detiene y devuelve los bytes WAV listos para transcribir. */
  async stop(): Promise<Uint8Array> {
    if (!this.processor || !this.ctx) throw new Error("No hay grabación activa");
    const samples = concat(this.chunks);
    const rate = this.inputRate;
    this.cancel();
    return encodeWav(downsample(samples, rate, TARGET_RATE), TARGET_RATE);
  }
}

const concat = (chunks: Float32Array[]) => {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

// Decimación con promedio por ventana. Suficiente para voz y evita el aliasing
// grueso de tomar una muestra de cada N.
const downsample = (input: Float32Array, from: number, to: number) => {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j];
    out[i] = end > start ? sum / (end - start) : 0;
  }
  return out;
};

const encodeWav = (samples: Float32Array, sampleRate: number) => {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true); // bits por muestra
  text(36, "data");
  view.setUint32(40, dataLength, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
};
