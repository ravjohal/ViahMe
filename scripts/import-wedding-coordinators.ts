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
  services: string[];
  priceRange: string;
  claimed: boolean;
}

function parseHtmlListings(html: string): VendorData[] {
  const vendors: VendorData[] = [];
  
  // Split on single-listing divs (Bay Area format)
  const parts = html.split(/<div class="single-listing\s*">/i);
  
  for (let i = 1; i < parts.length; i++) {
    const listing = parts[i];
    if (!listing.includes('<h3>')) continue;
    
    const nameMatch = listing.match(/<h3><a[^>]*>([^<]+)<\/a><\/h3>/i) || 
                      listing.match(/<h3><a[^>]*title="[^"]*"[^>]*>([^<]+)/i);
    let name = nameMatch ? nameMatch[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() : null;
    if (!name) continue;
    
    // Clean up name prefixes
    name = name.replace(/^Indian Event Planners\s*-\s*/i, '').trim();
    name = name.replace(/^Indian Wedding Coordinators\s*-\s*/i, '').trim();
    
    const imageMatch = listing.match(/<figure><img src="([^"]+)"/i);
    let imageUrl = imageMatch ? imageMatch[1] : '';
    if (imageUrl.includes('others_2025-07-24-06-48-23-796.svg')) {
      imageUrl = '';
    }
    
    const locationMatch = listing.match(/location_on<\/span>([^<]+)/i) ||
                          listing.match(/Serving customers in\s+([^<]+)/i);
    let location = locationMatch ? locationMatch[1].replace(/\s+/g, ' ').replace(/Serving customers in\s*/i, '').replace(/with professional support\./i, '').trim() : 'Bay Area';
    
    const sulekhaMatch = listing.match(/<div class="sul-rate">([0-9.]+)/i);
    const sulekhaRating = sulekhaMatch ? sulekhaMatch[1].trim() : null;
    
    const expMatch = listing.match(/work_history<\/span>([^<]+)/i);
    const experience = expMatch ? expMatch[1].trim() : null;
    
    let description = '';
    const descMatch = listing.match(/<b>From the Business:<\/b>([\s\S]*?)(?:<span class="more-links"|<\/p>)/i);
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
    
    const phoneMatch = listing.match(/openphoneConnect\([^,]+,[^,]+,'([0-9]+)'/i);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    const reviewMatch = listing.match(/<a title="View All Reviews"[^>]*>(\d+)/i) ||
                        listing.match(/>(\d+)\s*Reviews?/i);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;
    
    const ratingMatch = listing.match(/<div class="rating"><a[^>]*>(\d+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5.0;
    
    // Parse price range
    const priceMatch = listing.match(/<label>Price Range:<\/label><b>([^<]+)/i);
    let priceRange = '$$';
    if (priceMatch) {
      const priceText = priceMatch[1].trim();
      if (priceText.includes('$5k') || priceText.includes('$10k') || priceText.includes('$15k')) {
        priceRange = '$$$';
      } else if (priceText.includes('$20k') || priceText.includes('$25k') || priceText.includes('$30k')) {
        priceRange = '$$$$';
      }
    }
    
    const claimed = listing.includes('Claimed');
    
    const services: string[] = [];
    if (listing.match(/Wedding\s*Coordinators?/i)) services.push('wedding_coordinator');
    if (listing.match(/Wedding\s*Planners?/i)) services.push('wedding_planner');
    if (listing.match(/Event\s*Coordinators?/i)) services.push('event_coordinator');
    if (listing.match(/Sangeet\s*Ceremony/i)) services.push('sangeet');
    if (listing.match(/Wedding\s*Receptions?/i)) services.push('reception');
    if (listing.match(/Engagement\s*Planners?/i)) services.push('engagement');
    if (listing.match(/Bridal\s*Shower/i)) services.push('bridal_shower');
    if (listing.match(/Baby\s*Shower/i)) services.push('baby_shower');
    if (listing.match(/Birthday\s*Party/i)) services.push('birthday');
    if (listing.match(/Bachelor/i)) services.push('bachelor_party');
    if (listing.match(/Haldi/i)) services.push('haldi');
    if (listing.match(/Mehndi/i)) services.push('mehndi_event');
    if (listing.match(/Destination/i)) services.push('destination_wedding');
    
    vendors.push({
      name,
      imageUrl,
      location,
      sulekhaRating,
      experience,
      description,
      phone,
      reviewCount,
      rating,
      services,
      priceRange,
      claimed
    });
  }
  
  return vendors;
}

async function main() {
  console.log("Starting Wedding Coordinators vendor import...");
  
  const sql = neon(process.env.DATABASE_URL!);
  
  const existingVendors = await sql`SELECT name FROM vendors WHERE category = 'wedding_coordinator'`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing wedding coordinator vendors in database`);
  
  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766081271209.txt');
  let html = fs.readFileSync(htmlPath, 'utf-8');
  // Normalize whitespace to handle multi-line HTML
  html = html.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  
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
      const categories = ['wedding_coordinator', ...vendor.services];
      
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, cover_image_url, phone,
          rating, review_count, is_published, claimed, source,
          sulekha_rating, experience, preferred_wedding_traditions
        ) VALUES (
          ${vendor.name},
          'wedding_coordinator',
          ${categories},
          ${vendor.location},
          'San Francisco Bay Area',
          ${vendor.priceRange},
          ARRAY['indian', 'south_asian', 'fusion'],
          ${vendor.description || 'Professional wedding coordination and event planning services for South Asian celebrations.'},
          ${vendor.imageUrl || null},
          ${vendor.phone},
          ${vendor.rating},
          ${vendor.reviewCount},
          true,
          ${vendor.claimed},
          'manual',
          ${vendor.sulekhaRating},
          ${vendor.experience},
          ARRAY['sikh', 'hindu', 'mixed', 'muslim', 'south_indian', 'gujarati']
        )
        ON CONFLICT DO NOTHING
      `;
      
      imported++;
      if (imported % 20 === 0) {
        console.log(`Imported ${imported} vendors...`);
      }
    } catch (error) {
      console.error(`Error importing ${vendor.name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully imported ${imported} new Wedding Coordinator vendors!`);
  
  // Get total count
  const totalCount = await sql`SELECT COUNT(*) as count FROM vendors`;
  console.log(`Total vendors in database: ${totalCount[0].count}`);
  
  process.exit(0);
}

main().catch(console.error);
