export interface GameSystem {
  id: string;        // "40k", "aos", "tow", "kt", "30k", "opr"
  name: string;      // "Warhammer 40K"
  shortName: string; // "40K"
  colour: string;    // hex
  icon: string;      // emoji or short text
}

export const GAME_SYSTEMS: Record<string, GameSystem> = {
  "40k": { id: "40k", name: "Warhammer 40K", shortName: "40K", colour: "#7c3aed", icon: "\u2694\uFE0F" },
  "aos": { id: "aos", name: "Age of Sigmar", shortName: "AoS", colour: "#d97706", icon: "\u26A1" },
  "tow": { id: "tow", name: "The Old World", shortName: "TOW", colour: "#991b1b", icon: "\uD83C\uDFF0" },
  "kt": { id: "kt", name: "Kill Team", shortName: "KT", colour: "#0d9488", icon: "\uD83C\uDFAF" },
  "30k": { id: "30k", name: "Horus Heresy", shortName: "30K", colour: "#475569", icon: "\uD83E\uDD85" },
  "opr": { id: "opr", name: "One Page Rules", shortName: "OPR", colour: "#ea580c", icon: "\uD83D\uDCC4" },
};

export const GAME_SYSTEM_LIST: GameSystem[] = Object.values(GAME_SYSTEMS);

export function getGameSystem(id: string): GameSystem {
  return GAME_SYSTEMS[id] ?? GAME_SYSTEMS["40k"];
}
