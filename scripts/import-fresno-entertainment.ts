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
}

function parseHtmlListings(html: string): VendorData[] {
  const vendors: VendorData[] = [];
  
  // Split on mobile-single-listing with optional xmlns:xlink attribute
  const parts = html.split(/<div class="mobile-single-listing"(?:\s+xmlns:xlink="[^"]*")?>/i);
  
  for (let i = 1; i < parts.length; i++) {
    const listing = parts[i];
    if (!listing.includes('<h3>')) continue;
    
    const nameMatch = listing.match(/<h3><a[^>]*>([^<]+)<\/a><\/h3>/i) || 
                      listing.match(/<h3><a[^>]*title="[^"]*"[^>]*>([^<]+)/i);
    let name = nameMatch ? nameMatch[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() : null;
    if (!name) continue;
    
    name = name.replace(/^Indian Entertainment\s*-\s*/i, '').trim();
    
    const imageMatch = listing.match(/<figure><img src="([^"]+)"/i);
    let imageUrl = imageMatch ? imageMatch[1] : '';
    if (imageUrl.includes('others_2025-07-24-06-48-23-796.svg')) {
      imageUrl = '';
    }
    
    const locationMatch = listing.match(/location_on<\/span>([^<]+)/i);
    const location = locationMatch ? locationMatch[1].replace(/\s+/g, ' ').replace(/Serving customers in\s*/i, '').trim() : 'Fresno Area';
    
    const sulekhaMatch = listing.match(/<div class="sul-rate">([0-9.]+)/i);
    const sulekhaRating = sulekhaMatch ? sulekhaMatch[1].trim() : null;
    
    const expMatch = listing.match(/work_history<\/span>([^<]+)/i);
    const experience = expMatch ? expMatch[1].trim() : null;
    
    let description = '';
    const descMatch = listing.match(/<div class="description"[^>]*><p>([\s\S]*?)(?:<span class="more-links"|<\/p>)/i);
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
    
    const ratingMatch = listing.match(/<div class="mob-rating"><a[^>]*>(\d+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5.0;
    
    const services: string[] = [];
    if (listing.match(/MC\s*And\s*Host/i)) services.push('mc_host');
    if (listing.match(/Singers?/i)) services.push('singer');
    if (listing.match(/Stand\s*Up\s*Comedians?/i)) services.push('comedian');
    if (listing.match(/Wedding\s*Singers?/i)) services.push('wedding_singer');
    if (listing.match(/Karaoke/i)) services.push('karaoke');
    if (listing.match(/Music\s*Shows?/i)) services.push('music_show');
    if (listing.match(/Magicians?/i)) services.push('magician');
    if (listing.match(/Balloon/i)) services.push('balloon_artist');
    if (listing.match(/Circus/i)) services.push('circus');
    if (listing.match(/Costumed\s*Character/i)) services.push('costumed_character');
    if (listing.match(/Punjabi\s*DJs?/i)) services.push('punjabi_dj');
    if (listing.match(/Bollywood/i)) services.push('bollywood');
    if (listing.match(/Dhol/i)) services.push('dhol');
    if (listing.match(/Dance/i)) services.push('dance');
    
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
      services
    });
  }
  
  return vendors;
}

async function main() {
  console.log("Starting Fresno Entertainment vendor import...");
  
  const sql = neon(process.env.DATABASE_URL!);
  
  const existingVendors = await sql`SELECT name FROM vendors WHERE category = 'entertainment'`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing entertainment vendors in database`);
  
  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766080713293.txt');
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
      const categories = ['entertainment', ...vendor.services];
      
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, cover_image_url, phone,
          rating, review_count, is_published, claimed, source,
          sulekha_rating, experience, preferred_wedding_traditions
        ) VALUES (
          ${vendor.name},
          'entertainment',
          ${categories},
          ${vendor.location},
          'Fresno',
          '$$',
          ARRAY['indian', 'south_asian', 'bollywood'],
          ${vendor.description || 'Professional wedding entertainment services for South Asian celebrations.'},
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
      console.log(`Imported: ${vendor.name} (Fresno)`);
    } catch (error) {
      console.error(`Error importing ${vendor.name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully imported ${imported} new Fresno Entertainment vendors!`);
  process.exit(0);
}

main().catch(console.error);
