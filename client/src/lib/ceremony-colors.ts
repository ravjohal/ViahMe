export interface CeremonyColorConfig {
  bg: string;
  border: string;
  icon: string;
  gradient: string;
}

export const CEREMONY_COLORS: Record<string, CeremonyColorConfig> = {
  paath: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-400", icon: "text-amber-600 dark:text-amber-400", gradient: "from-amber-500 to-orange-500" },
  maiyan: { bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-400", icon: "text-yellow-600 dark:text-yellow-400", gradient: "from-yellow-500 to-amber-500" },
  chunni_chadana: { bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-400", icon: "text-rose-600 dark:text-rose-400", gradient: "from-rose-500 to-pink-500" },
  chunni: { bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-400", icon: "text-rose-600 dark:text-rose-400", gradient: "from-rose-500 to-pink-500" },
  jaggo: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", icon: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-amber-500" },
  chooda: { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-400", icon: "text-red-600 dark:text-red-400", gradient: "from-red-500 to-rose-500" },
  bakra_party: { bg: "bg-sky-100 dark:bg-sky-900/30", border: "border-sky-400", icon: "text-sky-600 dark:text-sky-400", gradient: "from-sky-500 to-blue-500" },
  anand_karaj: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", icon: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-red-500" },
  haldi: { bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-400", icon: "text-yellow-600 dark:text-yellow-400", gradient: "from-yellow-500 to-amber-500" },
  mehndi: { bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-400", icon: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
  mehendi: { bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-400", icon: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-teal-500" },
  sangeet: { bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-400", icon: "text-pink-600 dark:text-pink-400", gradient: "from-pink-500 to-rose-500" },
  baraat: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-400", icon: "text-amber-600 dark:text-amber-400", gradient: "from-amber-500 to-yellow-500" },
  milni: { bg: "bg-teal-100 dark:bg-teal-900/30", border: "border-teal-400", icon: "text-teal-600 dark:text-teal-400", gradient: "from-teal-500 to-cyan-500" },
  pheras: { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-400", icon: "text-red-600 dark:text-red-400", gradient: "from-red-500 to-orange-500" },
  vidaai: { bg: "bg-violet-100 dark:bg-violet-900/30", border: "border-violet-400", icon: "text-violet-600 dark:text-violet-400", gradient: "from-violet-500 to-purple-500" },
  nikah: { bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-400", icon: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-green-500" },
  walima: { bg: "bg-cyan-100 dark:bg-cyan-900/30", border: "border-cyan-400", icon: "text-cyan-600 dark:text-cyan-400", gradient: "from-cyan-500 to-teal-500" },
  reception: { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-400", icon: "text-purple-600 dark:text-purple-400", gradient: "from-purple-500 to-indigo-500" },
  cocktail: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", border: "border-fuchsia-400", icon: "text-fuchsia-600 dark:text-fuchsia-400", gradient: "from-fuchsia-500 to-pink-500" },
  rehearsal_dinner: { bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-400", icon: "text-indigo-600 dark:text-indigo-400", gradient: "from-indigo-500 to-blue-500" },
  bridal_shower: { bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-400", icon: "text-pink-600 dark:text-pink-400", gradient: "from-pink-500 to-rose-500" },
  bachelor_party: { bg: "bg-lime-100 dark:bg-lime-900/30", border: "border-lime-400", icon: "text-lime-600 dark:text-lime-400", gradient: "from-lime-500 to-green-500" },
  bachelorette: { bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-400", icon: "text-pink-600 dark:text-pink-400", gradient: "from-pink-500 to-fuchsia-500" },
  engagement: { bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-400", icon: "text-rose-600 dark:text-rose-400", gradient: "from-rose-500 to-red-500" },
  roka: { bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-400", icon: "text-rose-600 dark:text-rose-400", gradient: "from-rose-500 to-pink-500" },
  sagai: { bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-400", icon: "text-rose-600 dark:text-rose-400", gradient: "from-rose-500 to-pink-500" },
  ganesh_puja: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", icon: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-amber-500" },
  puja: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", icon: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-amber-500" },
  mandap: { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-400", icon: "text-red-600 dark:text-red-400", gradient: "from-red-500 to-orange-500" },
  wedding: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", icon: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-red-500" },
  ceremony: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", icon: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-red-500" },
  welcome_dinner: { bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-400", icon: "text-indigo-600 dark:text-indigo-400", gradient: "from-indigo-500 to-blue-500" },
  farewell_brunch: { bg: "bg-cyan-100 dark:bg-cyan-900/30", border: "border-cyan-400", icon: "text-cyan-600 dark:text-cyan-400", gradient: "from-cyan-500 to-teal-500" },
  custom: { bg: "bg-slate-100 dark:bg-slate-900/30", border: "border-slate-400", icon: "text-slate-600 dark:text-slate-400", gradient: "from-slate-500 to-gray-500" },
};

export function getCeremonyColor(eventType: string | null | undefined, eventName?: string): CeremonyColorConfig {
  if (!eventType && !eventName) {
    return CEREMONY_COLORS.custom;
  }
  
  const typeKey = eventType?.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (typeKey && CEREMONY_COLORS[typeKey]) {
    return CEREMONY_COLORS[typeKey];
  }
  
  const lowerName = (eventName || '').toLowerCase();
  
  for (const [key, colors] of Object.entries(CEREMONY_COLORS)) {
    if (lowerName.includes(key.replace(/_/g, ' ')) || lowerName.includes(key)) {
      return colors;
    }
  }
  
  return CEREMONY_COLORS.custom;
}

export function getCeremonyAccentClasses(eventType: string | null | undefined, eventName?: string): string {
  const colors = getCeremonyColor(eventType, eventName);
  return `${colors.bg} ${colors.border}`;
}
