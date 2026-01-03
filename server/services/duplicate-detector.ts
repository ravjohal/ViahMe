import type { Guest } from "@shared/schema";

export interface DuplicateMatch {
  importIndex: number;
  matchedGuestId: string;
  matchedGuestName: string;
  confidence: number;
  matchReasons: string[];
}

export interface IntraBatchDuplicate {
  index1: number;
  index2: number;
  confidence: number;
  matchReasons: string[];
}

export interface DuplicateCheckResult {
  duplicatesWithExisting: DuplicateMatch[];
  duplicatesInBatch: IntraBatchDuplicate[];
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  const maxLen = Math.max(m, n);
  return maxLen === 0 ? 1 : 1 - dp[m][n] / maxLen;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

interface ImportGuest {
  name: string;
  email?: string;
  phone?: string;
  householdName?: string;
}

function compareGuests(
  importGuest: ImportGuest,
  existingGuest: Guest
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (importGuest.email && existingGuest.email) {
    if (normalizeEmail(importGuest.email) === normalizeEmail(existingGuest.email)) {
      score += 0.7;
      reasons.push('Same email address');
    }
  }

  if (importGuest.phone && existingGuest.phone) {
    if (normalizePhone(importGuest.phone) === normalizePhone(existingGuest.phone)) {
      score += 0.6;
      reasons.push('Same phone number');
    }
  }

  const nameSimilarity = calculateStringSimilarity(importGuest.name, existingGuest.name);
  if (nameSimilarity >= 0.95) {
    score += 0.5;
    reasons.push(`Nearly identical names (${Math.round(nameSimilarity * 100)}%)`);
  } else if (nameSimilarity >= 0.8) {
    score += 0.35;
    reasons.push(`Similar names (${Math.round(nameSimilarity * 100)}%)`);
  }

  return { score, reasons };
}

function compareImportGuests(
  guest1: ImportGuest,
  guest2: ImportGuest
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (guest1.email && guest2.email) {
    if (normalizeEmail(guest1.email) === normalizeEmail(guest2.email)) {
      score += 0.7;
      reasons.push('Same email address');
    }
  }

  if (guest1.phone && guest2.phone) {
    if (normalizePhone(guest1.phone) === normalizePhone(guest2.phone)) {
      score += 0.6;
      reasons.push('Same phone number');
    }
  }

  const nameSimilarity = calculateStringSimilarity(guest1.name, guest2.name);
  if (nameSimilarity >= 0.95) {
    score += 0.5;
    reasons.push(`Nearly identical names (${Math.round(nameSimilarity * 100)}%)`);
  } else if (nameSimilarity >= 0.8) {
    score += 0.35;
    reasons.push(`Similar names (${Math.round(nameSimilarity * 100)}%)`);
  }

  return { score, reasons };
}

export function detectImportDuplicates(
  importGuests: ImportGuest[],
  existingGuests: Guest[],
  threshold: number = 0.4
): DuplicateCheckResult {
  const duplicatesWithExisting: DuplicateMatch[] = [];
  const duplicatesInBatch: IntraBatchDuplicate[] = [];

  for (let i = 0; i < importGuests.length; i++) {
    const importGuest = importGuests[i];

    for (const existingGuest of existingGuests) {
      const { score, reasons } = compareGuests(importGuest, existingGuest);
      if (score >= threshold) {
        duplicatesWithExisting.push({
          importIndex: i,
          matchedGuestId: existingGuest.id,
          matchedGuestName: existingGuest.name,
          confidence: Math.min(score, 1),
          matchReasons: reasons,
        });
      }
    }

    for (let j = i + 1; j < importGuests.length; j++) {
      const otherGuest = importGuests[j];
      const { score, reasons } = compareImportGuests(importGuest, otherGuest);
      if (score >= threshold) {
        duplicatesInBatch.push({
          index1: i,
          index2: j,
          confidence: Math.min(score, 1),
          matchReasons: reasons,
        });
      }
    }
  }

  duplicatesWithExisting.sort((a, b) => b.confidence - a.confidence);
  duplicatesInBatch.sort((a, b) => b.confidence - a.confidence);

  return { duplicatesWithExisting, duplicatesInBatch };
}
