const ICON_TO_EMOJI: Record<string, string> = {
  wrench:     "🔧",
  zap:        "⚡",
  hammer:     "🔨",
  paintbrush: "🎨",
  key:        "🔑",
  flame:      "🔥",
  leaf:       "🌿",
  sparkles:   "✨",
  wind:       "❄️",
  snowflake:  "❄️",
  building:   "🏗️",
  tool:       "🛠️",
  home:       "🏠",
  droplets:   "💧",
  thermometer:"🌡️",
};

export function getServiceEmoji(icono: string | null | undefined): string {
  if (!icono) return "🔧";
  return ICON_TO_EMOJI[icono.toLowerCase()] ?? "🔧";
}
