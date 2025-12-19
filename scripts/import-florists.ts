import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Starting florists import...');

  // Get existing vendors to avoid duplicates
  const existingVendors = await sql`SELECT name FROM vendors`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing vendors in database`);

  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766132291386.txt');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Parse vendor listings - handle newlines before closing >
  const listingRegex = /<div class="single-listing\s*[^"]*"\s*>/gi;
  const listings = html.split(listingRegex).slice(1);
  
  console.log(`Found ${listings.length} florist listings to parse`);

  let imported = 0;
  let skipped = 0;

  for (const listing of listings) {
    // Extract name from h3 > a tag
    const nameMatch = listing.match(/<h3><a[^>]*>([^<]+)<\/a><\/h3>/i);
    if (!nameMatch) continue;
    
    let name = nameMatch[1].trim();
    // Clean up name - remove "Indian Florists Services - " prefix if present
    name = name.replace(/^Indian Florists Services\s*-\s*/i, '').trim();
    
    if (!name || name.length < 2) continue;
    
    // Check for duplicates
    if (existingNames.has(name.toLowerCase())) {
      console.log(`Skipped (duplicate): ${name}`);
      skipped++;
      continue;
    }

    // Extract city from href like /cupertino-ca/ or /san-jose-ca/
    const cityMatch = listing.match(/href="\/([a-z-]+)-ca\//i);
    let city = 'San Francisco Bay Area';
    if (cityMatch) {
      const rawCity = cityMatch[1].replace(/-/g, ' ');
      city = rawCity.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Extract experience/years in business
    const yearsMatch = listing.match(/(\d+)\s*Years?\s*in\s*Business/i);
    const yearsExperience = yearsMatch ? parseInt(yearsMatch[1]) : null;

    // Extract rating
    const ratingMatch = listing.match(/<div class="sul-rate">([0-9.]+)<\/div>/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // Extract description
    const descMatch = listing.match(/<b>From the Business:<\/b>([^<]+)/i);
    let description = descMatch ? descMatch[1].trim().substring(0, 500) : 'Professional florist specializing in South Asian wedding flowers, garlands, and floral arrangements.';

    // Check if claimed
    const isClaimed = listing.includes('<div class="claimed">');

    // Extract image
    const imgMatch = listing.match(/<img src="([^"]+)"/i);
    let imageUrl = imgMatch ? imgMatch[1] : null;
    if (imageUrl && imageUrl.includes('placeholder')) imageUrl = null;

    try {
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, 
          rating, review_count, is_published, claimed, source,
          preferred_wedding_traditions
        ) VALUES (
          ${name},
          'florist',
          ARRAY['florist', 'decor'],
          ${city + ', CA'},
          'San Francisco Bay Area',
          '$$',
          ARRAY['indian', 'south_asian'],
          ${description},
          ${rating},
          0,
          true,
          ${isClaimed},
          'manual',
          ARRAY['sikh', 'hindu', 'mixed', 'muslim', 'south_indian', 'gujarati']
        )
        ON CONFLICT DO NOTHING
      `;
      
      imported++;
      existingNames.add(name.toLowerCase());
      console.log(`Imported: ${name} (${city}, ${yearsExperience || 'N/A'} years)`);
    } catch (error) {
      console.error(`Error importing ${name}:`, error);
    }
  }

  console.log(`\nSuccessfully imported ${imported} florists (${skipped} duplicates skipped)!`);
  
  const totalCount = await sql`SELECT COUNT(*) as count FROM vendors`;
  console.log(`Total vendors in database: ${totalCount[0].count}`);

  process.exit(0);
}

main().catch(console.error);
