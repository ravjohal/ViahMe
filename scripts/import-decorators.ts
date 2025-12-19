import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Starting decorators import...');

  const existingVendors = await sql`SELECT name FROM vendors`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing vendors in database`);

  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766132536153.txt');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Extract decorator names from title attributes
  const nameRegex = /title="Indian Event Decorators - ([^"]+)"/gi;
  const nameMatches = Array.from(html.matchAll(nameRegex));
  
  // Deduplicate names from the file
  const uniqueNames = new Map<string, string>();
  for (const match of nameMatches) {
    let name = match[1].trim()
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    if (name && !uniqueNames.has(name.toLowerCase())) {
      uniqueNames.set(name.toLowerCase(), name);
    }
  }
  
  console.log(`Found ${uniqueNames.size} unique decorator names to import`);

  // Extract city info for each vendor
  const cityMap = new Map<string, string>();
  const hrefRegex = /href="\/([a-z-]+)-ca\/event-decorators\/([^"]+)"/gi;
  for (const match of html.matchAll(hrefRegex)) {
    const city = match[1].replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const slug = match[2].toLowerCase();
    cityMap.set(slug, city);
  }

  let imported = 0;
  let skipped = 0;

  for (const [lowerName, name] of uniqueNames) {
    if (existingNames.has(lowerName)) {
      console.log(`Skipped (duplicate): ${name}`);
      skipped++;
      continue;
    }

    // Try to find city from slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
    let city = 'San Francisco Bay Area';
    for (const [citySlug, cityName] of cityMap) {
      if (citySlug.includes(slug.substring(0, 10))) {
        city = cityName;
        break;
      }
    }

    try {
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, 
          rating, review_count, is_published, claimed, source,
          preferred_wedding_traditions
        ) VALUES (
          ${name},
          'decor',
          ARRAY['decor', 'florist'],
          ${city + ', CA'},
          'San Francisco Bay Area',
          '$$',
          ARRAY['indian', 'south_asian'],
          'Professional event decorators specializing in South Asian wedding decor, mandaps, stages, and floral arrangements.',
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
      existingNames.add(lowerName);
      console.log(`Imported: ${name} (${city})`);
    } catch (error) {
      console.error(`Error importing ${name}:`, error);
    }
  }

  console.log(`\nSuccessfully imported ${imported} decorators (${skipped} duplicates skipped)!`);
  
  const totalCount = await sql`SELECT COUNT(*) as count FROM vendors`;
  console.log(`Total vendors in database: ${totalCount[0].count}`);

  process.exit(0);
}

main().catch(console.error);
