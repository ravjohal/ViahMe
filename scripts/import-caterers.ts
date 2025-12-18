import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";

interface VendorData {
  name: string;
  imageUrl: string;
  location: string;
  city: string;
  sulekhaRating: string | null;
  experience: string | null;
  description: string;
  phone: string | null;
  reviewCount: number;
  rating: number;
}

function parseHtmlListings(html: string): VendorData[] {
  const vendors: VendorData[] = [];
  
  const parts = html.split('<div class="single-listing');
  
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
    
    const locationMatch = listing.match(/location_on<\/span><b>([^<]+)/i) ||
                          listing.match(/Serving customers in\s*([^<]+)/i);
    let location = locationMatch ? locationMatch[1].replace(/\s+/g, ' ').replace(/with professional support\./i, '').trim() : 'Bay Area';
    
    let city = 'SF Bay Area';
    if (location.toLowerCase().includes('bay') || location.toLowerCase().includes('fremont') || 
        location.toLowerCase().includes('sunnyvale') || location.toLowerCase().includes('daly city')) {
      city = 'SF Bay Area';
    } else if (location.toLowerCase().includes('new york') || location.toLowerCase().includes('nyc')) {
      city = 'New York City';
    } else if (location.toLowerCase().includes('los angeles') || location.toLowerCase().includes('la')) {
      city = 'Los Angeles';
    } else if (location.toLowerCase().includes('chicago')) {
      city = 'Chicago';
    } else if (location.toLowerCase().includes('seattle')) {
      city = 'Seattle';
    } else if (location.toLowerCase().includes('fresno')) {
      city = 'Fresno';
    }
    
    const sulekhaMatch = listing.match(/<div class="sul-rate">([0-9.]+)/i);
    const sulekhaRating = sulekhaMatch ? sulekhaMatch[1].trim() : null;
    
    const expMatch = listing.match(/work_history<\/span>([^<]+)/i);
    const experience = expMatch ? expMatch[1].trim() : null;
    
    let description = '';
    const descMatch = listing.match(/<b>From the Business:<\/b>([\s\S]*?)(?:<span class="more-links"|<\/p>)/i) ||
                      listing.match(/<div class="det-con"><p>(?:<b>From the Business:<\/b>)?([\s\S]*?)(?:<span class="more-links"|<\/p>)/i);
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
    
    const phoneMatch = listing.match(/openwhatsAppBlk\('[^']+','([^']+)'/i) ||
                       listing.match(/<b class="mob-hide">([0-9-]+)<\/b>/i);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    const reviewMatch = listing.match(/<a title="View All Reviews"[^>]*>(\d+)/i) ||
                        listing.match(/>(\d+)\s*Reviews?/i);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;
    
    const ratingMatch = listing.match(/<div class="rating"><a[^>]*>(\d+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5.0;
    
    vendors.push({
      name,
      imageUrl,
      location,
      city,
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
  console.log("Starting Caterer vendor import...");
  
  const sql = neon(process.env.DATABASE_URL!);
  
  const existingVendors = await sql`SELECT name FROM vendors WHERE category = 'caterer'`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing caterers in database`);
  
  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766035468646.txt');
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
          'caterer',
          ARRAY['caterer', 'food', 'wedding_catering'],
          ${vendor.location},
          ${vendor.city},
          '$$',
          ARRAY['punjabi', 'hindi', 'gujarati', 'tamil', 'telugu', 'south_indian'],
          ${vendor.description || 'Professional catering services for South Asian weddings and events.'},
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
      console.log(`Imported: ${vendor.name} (${vendor.city})`);
    } catch (error) {
      console.error(`Error importing ${vendor.name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully imported ${imported} new Caterer vendors!`);
  process.exit(0);
}

main().catch(console.error);
