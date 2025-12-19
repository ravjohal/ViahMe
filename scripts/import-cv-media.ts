import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);

function mapCategory(categories: string): string {
  const cat = categories.toLowerCase();
  if (cat.includes('cinemat') || cat.includes('video') || cat.includes('film')) return 'videography';
  if (cat.includes('photo')) return 'photography';
  return 'photography';
}

function mapCity(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes('bakersfield')) return 'LA';
  if (loc.includes('san jose')) return 'Bay Area';
  if (loc.includes('sacramento')) return 'Sacramento';
  if (loc.includes('fresno') || loc.includes('clovis') || loc.includes('visalia') || loc.includes('madera') || loc.includes('central valley')) return 'Fresno';
  return 'Fresno';
}

async function main() {
  console.log('Starting Central Valley media vendors import...');

  const existingVendors = await sql`SELECT name FROM vendors`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing vendors in database`);

  const jsonPath = path.join(process.cwd(), 'attached_assets/Pasted--region-Central-San-Joaquin-Valley-primary-city-Fresno-_1766139696870.txt');
  let content = fs.readFileSync(jsonPath, 'utf-8');

  // Extract vendor objects using regex
  const vendorRegex = /\{\s*"id":\s*"[^"]+"\s*,\s*"name":\s*"([^"]+)"[^}]*"category":\s*\[([^\]]*)\][^}]*"headquarters":\s*"([^"]+)"[^}]*(?:"website":\s*"([^"]*)")?[^}]*(?:"notes":\s*"([^"]*)")?[^}]*\}/gi;
  
  const matches = Array.from(content.matchAll(vendorRegex));
  console.log(`Found ${matches.length} vendor entries to process`);

  let imported = 0;
  let skipped = 0;

  for (const match of matches) {
    const name = match[1].trim();
    const categoryArr = match[2];
    const location = match[3];
    const website = match[4] || null;
    const notes = match[5] || '';

    if (existingNames.has(name.toLowerCase())) {
      console.log(`Skipped (duplicate): ${name}`);
      skipped++;
      continue;
    }

    const mappedCategory = mapCategory(categoryArr);
    const city = mapCity(location);
    const description = notes || `Professional photography/videography services for South Asian weddings.`;

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
