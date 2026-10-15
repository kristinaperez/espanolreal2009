import catalog from "./phrases.json";

export interface Situation { id: string; title: string; cue: string; cueTranslation: string; reply: string; replyTranslation: string }
export interface WorldPhrase { id: string; spanish: string; translation: string; source: { lesson: number; index: number }; reward: string; situations: Situation[] }
export const phrases = catalog.slice(0, 10) as WorldPhrase[];
export const WORLD_KEY = "espanolreal:world:v1";
export type Skill = "recognize" | "respond" | "recall";
export interface Evidence { recognize: boolean; respond: boolean; recall: boolean }
export interface WorldState { version: 1; phrases: Record<string, Evidence> }
export const emptyWorld = (): WorldState => ({ version: 1, phrases: {} });
export function parseWorld(raw: string | null): WorldState {
  try {
    const value = JSON.parse(raw ?? "null");
    if (value?.version !== 1 || !value.phrases || typeof value.phrases !== "object") return emptyWorld();
    const state = emptyWorld();
    for (const phrase of phrases) {
      const item = value.phrases[phrase.id];
      if (item && typeof item === "object") state.phrases[phrase.id] = { recognize: item.recognize === true, respond: item.respond === true, recall: item.recall === true };
    }
    return state;
  } catch { return emptyWorld(); }
}
export function recordSuccess(state: WorldState, id: string, skill: Skill): WorldState {
  if (!phrases.some(p => p.id === id)) return state;
  const previous = state.phrases[id] ?? { recognize: false, respond: false, recall: false };
  return { ...state, phrases: { ...state.phrases, [id]: { ...previous, [skill]: true } } };
}
// A completed response exercise earns one permanent construction element.
export const builtCount = (state: WorldState) => phrases.filter(p => state.phrases[p.id]?.respond).length;
export const normalizePhrase = (text: string) => text.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export const matchesPhrase = (answer: string, expected: string) => normalizePhrase(answer) === normalizePhrase(expected);
