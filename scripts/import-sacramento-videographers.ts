import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";

interface VendorData {
  name: string;
  imageUrl: string;
  location: string;
  sulekhaRating: string | null;
  experience: string | null;
  description: string;
  phone: string | null;
  reviewCount: number;
  rating: number;
}

function parseHtmlListings(html: string): VendorData[] {
  const vendors: VendorData[] = [];
  
  const parts = html.split('<div class="mobile-single-listing">');
  
  for (let i = 1; i < parts.length; i++) {
    const listing = parts[i];
    if (!listing.includes('<h3>')) continue;
    
    const nameMatch = listing.match(/<h3><a[^>]*>([^<]+)<\/a><\/h3>/i) || 
                      listing.match(/<h3><a[^>]*title="[^"]*"[^>]*>([^<]+)/i);
    const name = nameMatch ? nameMatch[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() : null;
    if (!name) continue;
    
    const imageMatch = listing.match(/<figure><img src="([^"]+)"/i);
    let imageUrl = imageMatch ? imageMatch[1] : '';
    if (imageUrl.includes('others_2025-07-24-06-48-23-796.svg')) {
      imageUrl = '';
    }
    
    const locationMatch = listing.match(/location_on<\/span>([^<]+)/i);
    const location = locationMatch ? locationMatch[1].replace(/\s+/g, ' ').replace(/Serving customers in\s*/i, '').trim() : 'Sacramento Area';
    
    const sulekhaMatch = listing.match(/<div class="sul-rate">([0-9.]+)/i);
    const sulekhaRating = sulekhaMatch ? sulekhaMatch[1].trim() : null;
    
    const expMatch = listing.match(/work_history<\/span>([^<]+)/i);
    const experience = expMatch ? expMatch[1].trim() : null;
    
    let description = '';
    const descMatch = listing.match(/<b>From the Business:<\/b>([\s\S]*?)(?:<span class="more-links"|<\/p>)/i) ||
                      listing.match(/<div class="description"[^>]*><p>([\s\S]*?)(?:<span class="more-links"|<\/p>)/i);
    if (descMatch) {
      description = descMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);
    }
    
    const phoneMatch = listing.match(/openphoneConnect\([^,]+,[^,]+,'([0-9]+)'/i) ||
                       listing.match(/<b>([0-9-]+)<\/b><\/a><i>/i);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    const reviewMatch = listing.match(/<a title="View All Reviews"[^>]*>(\d+)/i) ||
                        listing.match(/>(\d+)\s*Reviews?/i);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;
    
    const ratingMatch = listing.match(/<div class="mob-rating"><a[^>]*>(\d+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5.0;
    
    vendors.push({
      name,
      imageUrl,
      location,
      sulekhaRating,
      experience,
      description,
      phone,
      reviewCount,
      rating
    });
  }
  
  return vendors;
}

async function main() {
  console.log("Starting Sacramento Videographer vendor import...");
  
  const sql = neon(process.env.DATABASE_URL!);
  
  const existingVendors = await sql`SELECT name FROM vendors WHERE category = 'videographer'`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing videographers in database`);
  
  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766035994755.txt');
  const html = fs.readFileSync(htmlPath, 'utf-8');
  
  const parsedVendors = parseHtmlListings(html);
  console.log(`Parsed ${parsedVendors.length} vendors from HTML`);
  
  const uniqueVendors = new Map<string, VendorData>();
  for (const v of parsedVendors) {
    const key = v.name.toLowerCase().trim();
    if (!uniqueVendors.has(key) || v.description.length > (uniqueVendors.get(key)?.description.length || 0)) {
      uniqueVendors.set(key, v);
    }
  }
  console.log(`Found ${uniqueVendors.size} unique vendors in HTML`);
  
  const newVendors = Array.from(uniqueVendors.entries()).filter(([key]) => !existingNames.has(key));
  console.log(`${newVendors.length} new vendors to import (${uniqueVendors.size - newVendors.length} duplicates skipped)`);
  
  let imported = 0;
  for (const [, vendor] of newVendors) {
    try {
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, cover_image_url, phone,
          rating, review_count, is_published, claimed, source,
          sulekha_rating, experience, preferred_wedding_traditions
        ) VALUES (
          ${vendor.name},
          'videographer',
          ARRAY['videographer', 'cinematography', 'wedding_films'],
          ${vendor.location},
          'Sacramento',
          '$$',
          ARRAY['punjabi', 'hindi', 'gujarati', 'tamil', 'telugu'],
          ${vendor.description || 'Professional videography and cinematography services for South Asian weddings and events.'},
          ${vendor.imageUrl || null},
          ${vendor.phone},
          ${vendor.rating},
          ${vendor.reviewCount},
          true,
          false,
          'manual',
          ${vendor.sulekhaRating},
          ${vendor.experience},
          ARRAY['sikh', 'hindu', 'mixed', 'muslim', 'south_indian', 'gujarati']
        )
        ON CONFLICT DO NOTHING
      `;
      
      imported++;
      console.log(`Imported: ${vendor.name} (Sacramento)`);
    } catch (error) {
      console.error(`Error importing ${vendor.name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully imported ${imported} new Sacramento Videographer vendors!`);
  process.exit(0);
}

main().catch(console.error);
