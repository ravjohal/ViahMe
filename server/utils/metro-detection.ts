let _cachedMapping: Record<string, string[]> | null = null;

export let METRO_CITY_MAP: Record<string, string[]> = {};

export async function loadMetroCityMapping(storage: { getMetroCityMapping(): Promise<Record<string, string[]>> }): Promise<void> {
  _cachedMapping = await storage.getMetroCityMapping();
  METRO_CITY_MAP = _cachedMapping;
}

export function getMetroCityMap(): Record<string, string[]> {
  return METRO_CITY_MAP;
}

export function detectMetroFromLocation(location: string): string | null {
  if (!location) return null;
  const loc = location.toLowerCase();

  if (loc.includes(", bc") || loc.includes("british columbia")) return "Vancouver";
  if (loc.includes(", on") || (loc.includes("ontario") && !loc.includes("ontario, ca"))) return "Toronto";

  let bestMatch: { metro: string; length: number } | null = null;

  for (const [metroName, cities] of Object.entries(METRO_CITY_MAP)) {
    for (const city of cities) {
      const cityLower = city.toLowerCase();
      if (loc.includes(cityLower)) {
        if (!bestMatch || cityLower.length > bestMatch.length) {
          bestMatch = { metro: metroName, length: cityLower.length };
        }
      }
    }
  }

  return bestMatch?.metro ?? null;
}

export function extractCityFromLocation(location: string): string | null {
  if (!location) return null;
  const match = location.match(/^([^,]+)/);
  if (match) {
    const city = match[1].trim();
    if (/^\d/.test(city)) {
      const parts = location.split(",");
      if (parts.length >= 2) return parts[parts.length - 2].trim().replace(/\s+\w{2,3}\s+\w{3}\s+\w{3}$/, '').trim();
    }
    return city;
  }
  return null;
}
