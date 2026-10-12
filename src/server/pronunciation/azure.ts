export type PronunciationResult = { score: number; words: { word: string; accuracy: number | null; error: string }[] };
export function validateWav(wav: Buffer): boolean {
  if (wav.length < 6444 || wav.length > 512044 || (wav.length - 44) % 2) return false;
  if (wav.toString("ascii", 0, 4) !== "RIFF" || wav.toString("ascii", 8, 12) !== "WAVE" || wav.toString("ascii", 12, 16) !== "fmt " || wav.toString("ascii", 36, 40) !== "data") return false;
  return wav.readUInt32LE(4) === wav.length - 8 && wav.readUInt32LE(16) === 16 && wav.readUInt16LE(20) === 1 && wav.readUInt16LE(22) === 1 && wav.readUInt32LE(24) === 16000 && wav.readUInt32LE(28) === 32000 && wav.readUInt16LE(32) === 2 && wav.readUInt16LE(34) === 16 && wav.readUInt32LE(40) === wav.length - 44;
}
export function hasSignal(wav: Buffer): boolean {
  let energy = 0;
  for (let offset = 44; offset < wav.length; offset += 2) energy += (wav.readInt16LE(offset) / 32768) ** 2;
  return Math.sqrt(energy / ((wav.length - 44) / 2)) >= 0.002;
}
export function azureConfigured(): boolean {
  return process.env.AZURE_SPEECH_ENABLED === "true" && Boolean(process.env.AZURE_SPEECH_KEY?.trim()) && /^[a-z0-9-]{2,64}$/.test(process.env.AZURE_SPEECH_REGION ?? "");
}
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function score(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null; }
export function parseAssessment(raw: unknown): PronunciationResult | null {
  const payload = object(raw);
  if (payload.RecognitionStatus !== "Success" || !Array.isArray(payload.NBest)) return null;
  const best = object(payload.NBest[0]);
  const accuracy = score(best.AccuracyScore ?? object(best.PronunciationAssessment).AccuracyScore);
  if (accuracy === null) return null;
  const words = Array.isArray(best.Words) ? best.Words.slice(0, 80).map(value => {
    const item = object(value), assessment = "AccuracyScore" in item || "ErrorType" in item ? item : object(item.PronunciationAssessment);
    return { word: typeof item.Word === "string" ? item.Word.slice(0, 100) : "", accuracy: score(assessment.AccuracyScore), error: typeof assessment.ErrorType === "string" ? assessment.ErrorType.slice(0, 40) : "None" };
  }).filter(item => item.word) : [];
  return { score: Math.round(accuracy) / 10, words };
}
export async function assessPronunciation(wav: Buffer, reference: string): Promise<PronunciationResult | null> {
  const region = process.env.AZURE_SPEECH_REGION;
  const response = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=es-ES&format=detailed`, {
    method: "POST", signal: AbortSignal.timeout(20_000),
    headers: { "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!.trim(), "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000", Accept: "application/json", "Pronunciation-Assessment": Buffer.from(JSON.stringify({ ReferenceText: reference, GradingSystem: "HundredMark", Granularity: "Word", Dimension: "Comprehensive", EnableMiscue: true })).toString("base64") },
    body: new Uint8Array(wav),
  });
  if (!response.ok) throw new Error("Speech provider unavailable");
  return parseAssessment(await response.json());
}
