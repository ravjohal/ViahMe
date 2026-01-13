// Pre-wedding ceremony date offsets (days before wedding)
// Positive = days before, Negative = days after wedding
export const preWeddingOffsets: Record<string, number> = {
  // 90 days before (formal engagement)
  'roka': 90,
  'sikh_roka': 90,
  
  // 60 days before (engagement typically months before)
  'engagement': 60,
  'kurmai': 60,
  'sikh_engagement_roka': 60,
  'sikh_kurmai': 60,
  
  // 45 days before
  'chunni_chadana': 45,
  'sikh_chunni_chadana': 45,
  
  // 7 days before
  'paath': 7,
  'sikh_paath': 7,
  'sagai': 7,
  
  // 3-4 days before
  'mehndi': 3,
  'hindu_mehndi': 3,
  'sikh_mehndi': 3,
  'muslim_mehndi': 3,
  'maiyan': 3,
  'mayian': 3,
  'sikh_maiyan': 3,
  'sikh_mayian': 3,
  'haldi': 2,
  'hindu_haldi': 2,
  'pithi': 3,
  'gujarati_pithi': 3,
  'dholki': 4,
  'muslim_dholki': 4,
  
  // 2 days before
  'sangeet': 2,
  'hindu_sangeet': 2,
  'sikh_sangeet': 2,
  'garba': 2,
  'gujarati_garba': 2,
  
  // 1 day before
  'baraat': 1,
  'hindu_baraat': 1,
  'milni': 1,
  'cocktail': 1,
  'jaggo': 1,
  'sikh_jaggo': 1,
  'chooda': 1,
  'sikh_chooda': 1,
  'bakra_party': 1,
  'sikh_bakra_party': 1,
  
  // Wedding day (0 days offset)
  'anand_karaj': 0,
  'sikh_anand_karaj': 0,
  'wedding': 0,
  'hindu_wedding': 0,
  'nikah': 0,
  'muslim_nikah': 0,
  'gujarati_wedding': 0,
  'south_indian_muhurtham': 0,
  'christian_ceremony': 0,
  'jain_wedding': 0,
  'parsi_lagan': 0,
  'pheras': 0,
  'hindu_pheras': 0,
  
  // Reception - same day as wedding
  'reception': 0,
  'sikh_reception': 0,
  'hindu_reception': 0,
  'muslim_walima': 1, // Day after for walima
  'walima': -1, // Day after wedding
  
  // Day after
  'day_after': -1,
  'sikh_day_after': -1,
};

// Main wedding ceremonies that should use the actual wedding date
export const mainCeremonies = [
  'anand_karaj', 'wedding', 'hindu_wedding', 'sikh_anand_karaj', 
  'nikah', 'muslim_nikah', 'gujarati_wedding', 'south_indian_muhurtham',
  'christian_ceremony', 'jain_wedding', 'parsi_lagan'
];

// Calculate event date relative to the main wedding ceremony date
export function calculateEventDate(weddingDate: Date, ceremonyId: string): Date {
  const eventDate = new Date(weddingDate);
  
  // Check if this is a main ceremony (wedding day)
  if (mainCeremonies.includes(ceremonyId)) {
    return eventDate;
  }
  
  // Get offset from mapping, default to 1 day before if not found
  const offset = preWeddingOffsets[ceremonyId] || 1;
  
  // Positive offset = days before wedding, negative = days after
  eventDate.setDate(weddingDate.getDate() - offset);
  return eventDate;
}

// Get days offset for a ceremony ID
export function getCeremonyDaysOffset(ceremonyId: string): number {
  return preWeddingOffsets[ceremonyId] ?? 1;
}
