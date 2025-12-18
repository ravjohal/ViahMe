import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";

interface VendorData {
  name: string;
  imageUrl: string;
  location: string;
  sulekhaRating: string | null;
  experience: string | null;
  zipCodes: string[];
  description: string;
  phone: string | null;
  reviewCount: number;
  rating: number;
}

function parseHtmlListings(html: string): VendorData[] {
  const vendors: VendorData[] = [];
  
  const listingRegex = /<div class="single-listing[^"]*"[^>]*>([\s\S]*?)(?=<div class="single-listing|$)/gi;
  let match;
  
  while ((match = listingRegex.exec(html)) !== null) {
    const listing = match[1];
    
    const nameMatch = listing.match(/<h3><a[^>]*>([^<]+)<\/a><\/h3>/i) || 
                      listing.match(/<h3><a[^>]*title="[^"]*"[^>]*>([^<]+)/i);
    const name = nameMatch ? nameMatch[1].replace(/&amp;/g, '&').trim() : null;
    if (!name) continue;
    
    const imageMatch = listing.match(/<figure><img src="([^"]+)"/i);
    const imageUrl = imageMatch ? imageMatch[1] : '';
    
    const subtitleMatch = listing.match(/<div class="subtitle"[^>]*>[\s\S]*?<b>\s*([\s\S]*?)<\/b>/i);
    const location = subtitleMatch ? subtitleMatch[1].replace(/\s+/g, ' ').trim() : 'Bay Area';
    
    const sulekhaMatch = listing.match(/<div class="sul-rate">([^<]+)<\/div>/i);
    const sulekhaRating = sulekhaMatch ? sulekhaMatch[1].trim() : null;
    
    const expMatch = listing.match(/<div class="experience">[\s\S]*?work_history[\s\S]*?<\/span>([^<]+)/i);
    const experience = expMatch ? expMatch[1].trim() : null;
    
    const zipMatch = listing.match(/<b>Serving ZIP Codes:<\/b>([^<]+)/i);
    const zipCodes = zipMatch ? zipMatch[1].split(',').map(z => z.trim()).filter(z => z.length > 0) : [];
    
    const descMatch = listing.match(/<b>From the Business:<\/b>([\s\S]*?)(?:<span class="more-links"|<\/p>)/i);
    let description = '';
    if (descMatch) {
      description = descMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    const phoneMatch = listing.match(/openwhatsAppBlk\('[^']+','([^']+)'/i);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    const reviewMatch = listing.match(/<a title="View All Reviews"[^>]*>(\d+)/i) ||
                        listing.match(/>(\d+)\s*Reviews/i);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;
    
    const ratingMatch = listing.match(/<div class="rating"><a[^>]*>(\d+)/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5.0;
    
    vendors.push({
      name,
      imageUrl,
      location,
      sulekhaRating,
      experience,
      zipCodes,
      description,
      phone,
      reviewCount,
      rating
    });
  }
  
  return vendors;
}

function getCityFromLocation(location: string, name: string): string {
  const loc = location.toLowerCase();
  
  if (loc.includes('bay area') || loc.includes('fremont') || loc.includes('san francisco') || 
      loc.includes('alameda') || loc.includes('san jose') || loc.includes('oakland')) {
    return 'San Francisco Bay Area';
  }
  if (loc.includes('new york') || loc.includes('ny') || loc.includes('jamaica') || 
      loc.includes('edison') || loc.includes('clifton') || loc.includes('jersey')) {
    return 'New York City';
  }
  if (loc.includes('los angeles') || loc.includes('la') || loc.includes('anaheim') || 
      loc.includes('irvine') || loc.includes('california city')) {
    return 'Los Angeles';
  }
  if (loc.includes('chicago') || loc.includes('illinois')) {
    return 'Chicago';
  }
  if (loc.includes('seattle') || loc.includes('washington') || loc.includes('wa')) {
    return 'Seattle';
  }
  
  return 'San Francisco Bay Area';
}

async function main() {
  console.log("Starting DJ vendor import...");
  
  const sql = neon(process.env.DATABASE_URL!);
  
  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766031215907.txt');
  const html = fs.readFileSync(htmlPath, 'utf-8');
  
  const parsedVendors = parseHtmlListings(html);
  console.log(`Parsed ${parsedVendors.length} vendors from HTML`);
  
  const uniqueVendors = new Map<string, VendorData>();
  for (const v of parsedVendors) {
    if (!uniqueVendors.has(v.name) || v.description.length > (uniqueVendors.get(v.name)?.description.length || 0)) {
      uniqueVendors.set(v.name, v);
    }
  }
  console.log(`Found ${uniqueVendors.size} unique vendors`);
  
  let imported = 0;
  for (const [name, vendor] of uniqueVendors) {
    try {
      const city = getCityFromLocation(vendor.location, name);
      const zipArray = vendor.zipCodes.length > 0 ? `{${vendor.zipCodes.join(',')}}` : null;
      
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, cover_image_url, phone,
          rating, review_count, is_published, claimed, source,
          sulekha_rating, experience, zip_codes_serving, preferred_wedding_traditions
        ) VALUES (
          ${vendor.name},
          'dj',
          ARRAY['dj'],
          ${vendor.location},
          ${city},
          '$$',
          ARRAY['punjabi', 'hindi'],
          ${vendor.description || 'Professional DJ services for South Asian weddings and events.'},
          ${vendor.imageUrl || null},
          ${vendor.phone},
          ${vendor.rating},
          ${vendor.reviewCount},
          true,
          false,
          'manual',
          ${vendor.sulekhaRating},
          ${vendor.experience},
          ${zipArray}::text[],
          ARRAY['sikh', 'hindu', 'mixed']
        )
        ON CONFLICT DO NOTHING
      `;
      
      imported++;
      console.log(`Imported: ${name} (${city})`);
    } catch (error) {
      console.error(`Error importing ${name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully imported ${imported} DJ vendors!`);
  process.exit(0);
}

main().catch(console.error);
