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
  
  // Try both desktop and mobile listing formats
  const listingRegex = /<div class="(?:single-listing|mobile-single-listing)[^"]*"[^>]*>([\s\S]*?)(?=<div class="(?:single-listing|mobile-single-listing)|$)/gi;
  let match;
  
  while ((match = listingRegex.exec(html)) !== null) {
    const listing = match[1];
    
    const nameMatch = listing.match(/<h3><a[^>]*>([^<]+)<\/a><\/h3>/i) || 
                      listing.match(/<h3><a[^>]*title="[^"]*"[^>]*>([^<]+)/i) ||
                      listing.match(/<div class="fig-title">[\s\S]*?<h3><a[^>]*>([^<]+)/i);
    const name = nameMatch ? nameMatch[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() : null;
    if (!name) continue;
    
    const imageMatch = listing.match(/<figure><img src="([^"]+)"/i);
    const imageUrl = imageMatch ? imageMatch[1] : '';
    
    const subtitleMatch = listing.match(/<div class="subtitle"[^>]*>[\s\S]*?<b>\s*([\s\S]*?)<\/b>/i);
    const location = subtitleMatch ? subtitleMatch[1].replace(/\s+/g, ' ').trim() : 'Bay Area';
    
    const sulekhaMatch = listing.match(/<div class="sul-rate">([^<]+)<\/div>/i);
    const sulekhaRating = sulekhaMatch ? sulekhaMatch[1].trim() : null;
    
    const expMatch = listing.match(/<div class="experience">[\s\S]*?work_history[\s\S]*?<\/span>([^<]+)/i);
    const experience = expMatch ? expMatch[1].trim() : null;
    
    let description = '';
    const descParagraphs = listing.match(/<\/div><p>([\s\S]*?)(?:<span class="more-links"|<\/p><p>|<\/p><\/div>)/i);
    if (descParagraphs) {
      description = descParagraphs[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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

function getCityFromLocation(location: string, name: string): string {
  const loc = location.toLowerCase();
  const nm = name.toLowerCase();
  
  if (loc.includes('fresno') || nm.includes('fresno')) return 'Fresno';
  if (loc.includes('bay area') || loc.includes('fremont') || loc.includes('san francisco') || 
      loc.includes('alameda') || loc.includes('san jose') || loc.includes('oakland') ||
      loc.includes('hayward') || loc.includes('pleasanton') || loc.includes('sunnyvale') ||
      loc.includes('santa clara') || loc.includes('palo alto') || loc.includes('milpitas') ||
      loc.includes('san pablo') || loc.includes('union city') || loc.includes('cotati')) {
    return 'San Francisco Bay Area';
  }
  if (loc.includes('new york') || loc.includes('ny') || loc.includes('jamaica') || 
      loc.includes('edison') || loc.includes('clifton') || loc.includes('jersey') ||
      loc.includes('piscataway') || loc.includes('rahway')) {
    return 'New York City';
  }
  if (loc.includes('los angeles') || loc.includes('la') || loc.includes('anaheim') || 
      loc.includes('irvine') || loc.includes('california city') || loc.includes('norwalk')) {
    return 'Los Angeles';
  }
  if (loc.includes('chicago') || loc.includes('illinois')) {
    return 'Chicago';
  }
  if (loc.includes('seattle') || loc.includes('washington') || loc.includes('wa') ||
      loc.includes('bellevue') || loc.includes('redmond') || loc.includes('kent')) {
    return 'Seattle';
  }
  if (loc.includes('ca') || loc.includes('california')) {
    return 'San Francisco Bay Area';
  }
  if (loc.includes('nj') || loc.includes('new jersey')) {
    return 'New York City';
  }
  
  return 'San Francisco Bay Area';
}

async function main() {
  console.log("Starting Photographer vendor import (batch 2)...");
  
  const sql = neon(process.env.DATABASE_URL!);
  
  // First, get existing vendor names to avoid duplicates
  const existingVendors = await sql`SELECT name FROM vendors WHERE category = 'photographer'`;
  const existingNames = new Set(existingVendors.map(v => v.name.toLowerCase().trim()));
  console.log(`Found ${existingNames.size} existing photographers in database`);
  
  const htmlPath = path.join(process.cwd(), 'attached_assets/Pasted--div-id-listing-div-xmlns-xlink-http-www-w3-org-1999-xl_1766033563452.txt');
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
  
  // Filter out existing vendors
  const newVendors = Array.from(uniqueVendors.entries()).filter(([key]) => !existingNames.has(key));
  console.log(`${newVendors.length} new vendors to import (${uniqueVendors.size - newVendors.length} duplicates skipped)`);
  
  let imported = 0;
  for (const [, vendor] of newVendors) {
    try {
      const city = getCityFromLocation(vendor.location, vendor.name);
      
      await sql`
        INSERT INTO vendors (
          name, category, categories, location, city, price_range,
          cultural_specialties, description, cover_image_url, phone,
          rating, review_count, is_published, claimed, source,
          sulekha_rating, experience, preferred_wedding_traditions
        ) VALUES (
          ${vendor.name},
          'photographer',
          ARRAY['photographer', 'videographer'],
          ${vendor.location},
          ${city},
          '$$',
          ARRAY['punjabi', 'hindi', 'gujarati'],
          ${vendor.description || 'Professional photography and videography services for South Asian weddings and events.'},
          ${vendor.imageUrl || null},
          ${vendor.phone},
          ${vendor.rating},
          ${vendor.reviewCount},
          true,
          false,
          'manual',
          ${vendor.sulekhaRating},
          ${vendor.experience},
          ARRAY['sikh', 'hindu', 'mixed', 'muslim', 'south_indian']
        )
        ON CONFLICT DO NOTHING
      `;
      
      imported++;
      console.log(`Imported: ${vendor.name} (${city})`);
    } catch (error) {
      console.error(`Error importing ${vendor.name}:`, error);
    }
  }
  
  console.log(`\nSuccessfully imported ${imported} new Photographer vendors!`);
  process.exit(0);
}

main().catch(console.error);
