export interface GameSystem {
  id: string;        // "40k", "aos", "tow", "kt", "30k", "opr"
  name: string;      // "Warhammer 40K"
  shortName: string; // "40K"
  colour: string;    // hex
  icon: string;      // emoji or short text
}

// Tabletop game systems
export const TABLETOP_SYSTEMS: Record<string, GameSystem> = {
  "40k": { id: "40k", name: "Warhammer 40K", shortName: "40K", colour: "#7c3aed", icon: "⚔️" },
  "aos": { id: "aos", name: "Age of Sigmar", shortName: "AoS", colour: "#d97706", icon: "⚡" },
  "tow": { id: "tow", name: "The Old World", shortName: "TOW", colour: "#991b1b", icon: "🏰" },
  "kt": { id: "kt", name: "Kill Team", shortName: "KT", colour: "#0d9488", icon: "🎯" },
  "30k": { id: "30k", name: "Horus Heresy", shortName: "30K", colour: "#475569", icon: "🦅" },
  "opr": { id: "opr", name: "One Page Rules", shortName: "OPR", colour: "#ea580c", icon: "📄" },
};

// Sim racing game systems
export const SIMRACING_SYSTEMS: Record<string, GameSystem> = {
  "iracing": { id: "iracing", name: "iRacing", shortName: "iR", colour: "#1E40AF", icon: "🏁" },
  "acc": { id: "acc", name: "Assetto Corsa Competizione", shortName: "ACC", colour: "#DC2626", icon: "🏎️" },
  "lmu": { id: "lmu", name: "Le Mans Ultimate", shortName: "LMU", colour: "#D97706", icon: "🏆" },
  "f1": { id: "f1", name: "F1", shortName: "F1", colour: "#EF4444", icon: "🏎️" },
  "ac": { id: "ac", name: "Assetto Corsa", shortName: "AC", colour: "#9CA3AF", icon: "🚗" },
  "rf2": { id: "rf2", name: "rFactor 2", shortName: "rF2", colour: "#6B21A8", icon: "🔧" },
  "ams2": { id: "ams2", name: "Automobilista 2", shortName: "AMS2", colour: "#16A34A", icon: "🇧🇷" },
  "gt7": { id: "gt7", name: "Gran Turismo 7", shortName: "GT7", colour: "#3B82F6", icon: "🎮" },
  "rennsport": { id: "rennsport", name: "Rennsport", shortName: "RS", colour: "#F59E0B", icon: "⚡" },
  "hardware": { id: "hardware", name: "Hardware", shortName: "HW", colour: "#78716C", icon: "🔩" },
  "simracing": { id: "simracing", name: "Sim Racing", shortName: "SR", colour: "#dc2626", icon: "🏁" },
};

// Combined
export const GAME_SYSTEMS: Record<string, GameSystem> = {
  ...TABLETOP_SYSTEMS,
  ...SIMRACING_SYSTEMS,
};

export const GAME_SYSTEM_LIST: GameSystem[] = Object.values(GAME_SYSTEMS);

export function getGameSystem(id: string): GameSystem {
  return GAME_SYSTEMS[id] ?? GAME_SYSTEMS["simracing"] ?? GAME_SYSTEMS["40k"];
}

export function getSystemsForVertical(vertical: string): GameSystem[] {
  if (vertical === "simracing") return Object.values(SIMRACING_SYSTEMS);
  return Object.values(TABLETOP_SYSTEMS);
}
