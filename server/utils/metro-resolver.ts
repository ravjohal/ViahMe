import type { IStorage } from "../storage";
import { loadMetroCityMapping, METRO_CITY_MAP } from "./metro-detection";

export interface ResolvedMetro {
  metroValue: string;
  metroAreaId: string;
  isNew: boolean;
}

export async function resolveCustomCity(
  storage: IStorage,
  cityName: string
): Promise<ResolvedMetro> {
  const trimmed = cityName.trim();
  if (!trimmed) {
    throw new Error("City name cannot be empty");
  }

  const existingCity = await storage.getMetroCityByName(trimmed);
  if (existingCity) {
    return {
      metroValue: existingCity.metroValue,
      metroAreaId: existingCity.metroAreaId,
      isNew: false,
    };
  }

  const allAreas = await storage.getAllMetroAreas();
  const existingArea = allAreas.find(
    (area) =>
      area.value.toLowerCase() === trimmed.toLowerCase() ||
      area.label.toLowerCase() === trimmed.toLowerCase()
  );

  if (existingArea) {
    await storage.createMetroCity({
      metroAreaId: existingArea.id,
      cityName: trimmed,
    });
    await refreshMetroCache(storage);
    return {
      metroValue: existingArea.value,
      metroAreaId: existingArea.id,
      isNew: false,
    };
  }

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_");

  const newArea = await storage.createMetroArea({
    slug,
    value: trimmed,
    label: trimmed,
    isActive: true,
    displayOrder: 999,
  });

  await storage.createMetroCity({
    metroAreaId: newArea.id,
    cityName: trimmed,
  });

  await refreshMetroCache(storage);

  return {
    metroValue: newArea.value,
    metroAreaId: newArea.id,
    isNew: true,
  };
}

export async function resolveAreasServed(
  storage: IStorage,
  areasServed: string[],
  customCity?: string
): Promise<string[]> {
  const resolved: string[] = [];

  for (const area of areasServed) {
    if (area === "Other") {
      if (customCity?.trim()) {
        const result = await resolveCustomCity(storage, customCity);
        resolved.push(result.metroValue);
      }
    } else {
      resolved.push(area);
    }
  }

  return resolved;
}

function extractCandidateCities(location: string): string[] {
  if (!location) return [];
  const candidates: string[] = [];
  const parts = location.split(",").map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    const cleaned = part
      .replace(/\b[A-Z]{2}\b/g, "")
      .replace(/\b\d{5}(-\d{4})?\b/g, "")
      .replace(/\bCanada\b/gi, "")
      .replace(/\bUSA?\b/gi, "")
      .replace(/\bUnited States\b/gi, "")
      .trim();
    if (cleaned && cleaned.length > 1 && !/^\d+/.test(cleaned)) {
      candidates.push(cleaned);
    }
  }

  return candidates;
}

export function resolveMetroFromLocationSync(location: string): string | null {
  if (!location) return null;

  const candidates = extractCandidateCities(location);

  const cityToMetro = new Map<string, string>();
  for (const [metroName, cities] of Object.entries(METRO_CITY_MAP)) {
    for (const city of cities) {
      cityToMetro.set(city.toLowerCase(), metroName);
    }
  }

  for (const candidate of candidates) {
    const match = cityToMetro.get(candidate.toLowerCase());
    if (match) return match;
  }

  const metroValues = new Set(Object.keys(METRO_CITY_MAP));
  for (const candidate of candidates) {
    if (metroValues.has(candidate)) return candidate;
  }

  return null;
}

export async function resolveMetroFromLocation(
  storage: IStorage,
  location: string
): Promise<string | null> {
  if (!location) return null;

  const candidates = extractCandidateCities(location);

  for (const candidate of candidates) {
    const cityMatch = await storage.getMetroCityByName(candidate);
    if (cityMatch) return cityMatch.metroValue;
  }

  const syncResult = resolveMetroFromLocationSync(location);
  if (syncResult) return syncResult;

  return null;
}

async function refreshMetroCache(storage: IStorage): Promise<void> {
  try {
    await loadMetroCityMapping(storage);
  } catch (e) {
    console.warn("Failed to refresh metro city cache:", e);
  }
}
