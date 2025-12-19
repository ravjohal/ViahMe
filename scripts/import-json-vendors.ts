import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";

interface VendorData {
  business_name: string;
  category: string;
  city: string;
  state: string;
  website?: string;
  rating: number;
  price_tier: string;
  tags?: string[];
}

function mapCategory(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('photo')) return 'photographer';
  if (cat.includes('video')) return 'videographer';
  if (cat.includes('cater')) return 'caterer';
  if (cat.includes('venue')) return 'venue';
  if (cat.includes('dj') || cat.includes('lighting')) return 'dj';
  if (cat.includes('decor')) return 'decor';
  if (cat.includes('priest') || cat.includes('pandit')) return 'priest';
  if (cat.includes('makeup')) return 'makeup_artist';
  if (cat.includes('mehndi') || cat.includes('henna')) return 'mehndi_artist';
  if (cat.includes('coordinator') || cat.includes('planner')) return 'wedding_coordinator';
  if (cat.includes('fashion') || cat.includes('clothing') || cat.includes('attire')) return 'fashion';
  return 'venue'; // default
}

function mapCity(city: string): string {
  const c = city.toLowerCase();
  if (['san francisco', 'oakland', 'fremont', 'san jose', 'santa clara', 'mountain view', 'sunnyvale', 'palo alto', 'hayward', 'newark', 'half moon bay'].some(x => c.includes(x))) {
    return 'San Francisco Bay Area';
  }
  if (c.includes('los angeles') || c.includes('huntington beach')) return 'Los Angeles';
  if (c.includes('fresno')) return 'Fresno';
  if (c.includes('sacramento')) return 'Sacramento';
  return city;
}

async function main() {
  console.log("Starting JSON vendor import...");
  
  const sql = neon(process.env.DATABASE_URL!);
  
  // Get all existing vendor names
  const existingVendors = await sql`SELECT name FROM vendors`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing vendors in database`);
  
  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--business-name-India-s-Oven-Fresno-category-Catering-Ve_1766131113600.txt');
  let content = fs.readFileSync(htmlPath, 'utf-8');
  
  // Fix malformed JSON - remove leading }, and add opening bracket
  content = content.trim();
  // Remove leading },
  content = content.replace(/^},?\s*/g, '');
  if (!content.startsWith('[')) {
    content = '[' + content;
  }
  // Fix empty tags fields
  content = content.replace(/"tags":\s*\n/g, '"tags": []\n');
  content = content.replace(/"tags":\s*}/g, '"tags": []}');
  content = content.replace(/"tags":\s*,/g, '"tags": [],');
  
  let vendors: VendorData[];
  try {
    vendors = JSON.parse(content);
  } catch (e) {
    console.error("JSON parse error:", e);
    console.log("Content preview:", content.substring(0, 500));
    process.exit(1);
  }
  
  console.log(`Parsed ${vendors.length} vendors from JSON`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const vendor of vendors) {
    const name = vendor.business_name.trim();
    if (existingNames.has(name.toLowerCase())) {
      console.log(`Skipped (duplicate): ${name}`);
      skipped++;
      continue;
    }
    
    try {
      const category = mapCategory(vendor.category);
      const city = mapCity(vendor.city);
      const categories = [category];
      
      // Add secondary categories based on combined categories
      if (vendor.category.toLowerCase().includes('&')) {
        const parts = vendor.category.split('&').map(p => p.trim());
        for (const part of parts) {
          const mapped = mapCategory(part);
          if (!categories.includes(mapped)) categories.push(mapped);
        }
      }
      
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, website, 
          rating, review_count, is_published, claimed, source,
          preferred_wedding_traditions
        ) VALUES (
          ${name},
          ${category},
          ${categories},
          ${vendor.city + ', ' + vendor.state},
          ${city},
          ${vendor.price_tier},
          ARRAY['indian', 'south_asian'],
          ${vendor.tags && vendor.tags.length > 0 ? vendor.tags.join(', ') : 'Professional wedding services for South Asian celebrations.'},
          ${vendor.website || null},
          ${vendor.rating},
          0,
          true,
          false,
          'manual',
          ARRAY['sikh', 'hindu', 'mixed', 'muslim', 'south_indian', 'gujarati']
        )
        ON CONFLICT DO NOTHING
      `;
      
      imported++;
      console.log(`Imported: ${name} (${category}, ${city})`);
    } catch (error) {
      console.error(`Error importing ${name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully imported ${imported} new vendors (${skipped} duplicates skipped)!`);
  
  const totalCount = await sql`SELECT COUNT(*) as count FROM vendors`;
  console.log(`Total vendors in database: ${totalCount[0].count}`);
  
  process.exit(0);
}

main().catch(console.error);
