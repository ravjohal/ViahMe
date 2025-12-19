import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);

function mapCategory(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('flor')) return 'florist';
  if (cat.includes('planner')) return 'wedding_coordinator';
  if (cat.includes('decor')) return 'decor';
  if (cat.includes('rental')) return 'rentals';
  if (cat.includes('venue')) return 'venue';
  return 'decor';
}

function mapCity(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes('fresno') || loc.includes('clovis')) return 'Fresno';
  if (loc.includes('sacramento') || loc.includes('roseville') || loc.includes('rancho cordova')) return 'Sacramento';
  if (loc.includes('modesto')) return 'Fresno';
  if (loc.includes('sonoma')) return 'San Francisco Bay Area';
  if (loc.includes('san ramon')) return 'San Francisco Bay Area';
  return 'San Francisco Bay Area';
}

async function main() {
  console.log('Starting Fresno/Sacramento vendors import...');

  const existingVendors = await sql`SELECT name FROM vendors`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing vendors in database`);

  const jsonPath = path.join(process.cwd(), 'attached_assets/Pasted--fresno-vendors-notes-Husband-and-wife-team-specializin_1766137869491.txt');
  let content = fs.readFileSync(jsonPath, 'utf-8');

  // Extract vendor objects using regex since JSON is malformed
  const vendorRegex = /\{\s*"business_name":\s*"([^"]+)"[^}]*"category":\s*"([^"]+)"[^}]*"(?:location|base_location)":\s*"([^"]+)"[^}]*(?:"website":\s*"([^"]*)")?[^}]*(?:"notes":\s*"([^"]*)")?[^}]*\}/gi;
  
  const matches = Array.from(content.matchAll(vendorRegex));
  console.log(`Found ${matches.length} vendor entries to process`);

  let imported = 0;
  let skipped = 0;

  for (const match of matches) {
    const name = match[1].trim();
    const category = match[2];
    const location = match[3];
    const website = match[4] || null;
    const notes = match[5] || '';

    if (existingNames.has(name.toLowerCase())) {
      console.log(`Skipped (duplicate): ${name}`);
      skipped++;
      continue;
    }

    const mappedCategory = mapCategory(category);
    const city = mapCity(location);
    const description = notes || `Professional ${category.toLowerCase()} services for South Asian weddings.`;

    try {
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, website,
          rating, review_count, is_published, claimed, source,
          preferred_wedding_traditions
        ) VALUES (
          ${name},
          ${mappedCategory},
          ARRAY[${mappedCategory}],
          ${location},
          ${city},
          '$$',
          ARRAY['indian', 'south_asian'],
          ${description.substring(0, 500)},
          ${website},
          null,
          0,
          true,
          false,
          'manual',
          ARRAY['sikh', 'hindu', 'mixed', 'muslim', 'south_indian', 'gujarati']
        )
        ON CONFLICT DO NOTHING
      `;
      
      imported++;
      existingNames.add(name.toLowerCase());
      console.log(`Imported: ${name} (${mappedCategory}, ${city})`);
    } catch (error) {
      console.error(`Error importing ${name}:`, error);
    }
  }

  console.log(`\nSuccessfully imported ${imported} vendors (${skipped} duplicates skipped)!`);
  
  const totalCount = await sql`SELECT COUNT(*) as count FROM vendors`;
  console.log(`Total vendors in database: ${totalCount[0].count}`);

  process.exit(0);
}

main().catch(console.error);
