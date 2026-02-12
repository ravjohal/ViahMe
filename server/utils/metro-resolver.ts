import type { IStorage } from "../storage";
import { loadMetroCityMapping } from "./metro-detection";

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

async function refreshMetroCache(storage: IStorage): Promise<void> {
  try {
    await loadMetroCityMapping(storage);
  } catch (e) {
    console.warn("Failed to refresh metro city cache:", e);
  }
}
