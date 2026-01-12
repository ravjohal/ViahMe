import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeToAMPM(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  
  const lower = timeStr.toLowerCase().trim();
  
  if (lower.includes("am") || lower.includes("pm")) {
    return timeStr;
  }
  
  const match = lower.match(/^(\d{1,2}):?(\d{2})?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] || "00";
    const period = hours >= 12 ? "PM" : "AM";
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;
    return `${hours}:${minutes} ${period}`;
  }
  
  return timeStr;
}
