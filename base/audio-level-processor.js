/**
 * AudioWorklet processor for real-time audio level metering.
 * Replaces deprecated ScriptProcessorNode with thread-offloaded processing.
 */
class AudioLevelProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();
    this._frameCount = 0;
    // Post level every ~46ms (2048 samples at 44100Hz ≈ 46ms, 128 frames × 16 calls)
    this._reportInterval = 16;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0];
    if (!channelData || channelData.length === 0) return true;

    this._frameCount++;
    if (this._frameCount < this._reportInterval) return true;
    this._frameCount = 0;

    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i];
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / channelData.length);
    const decibels = 20 * Math.log10(rms || 1e-8);

    this.port.postMessage({ decibels });
    return true;
  }
}

registerProcessor('audio-level-processor', AudioLevelProcessor);
