import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const sql = neon(process.env.DATABASE_URL!);
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main() {
  console.log('Seeding vendor login accounts...\n');

  const categories = [
    'photographer', 'videographer', 'caterer', 'wedding_coordinator',
    'makeup_artist', 'dj', 'mehndi_artist', 'decor', 'venue', 'florist'
  ];

  const testPassword = 'VendorTest123!';
  const passwordHash = await hashPassword(testPassword);
  
  let totalCreated = 0;
  const createdAccounts: { email: string; vendorName: string; category: string }[] = [];

  for (const category of categories) {
    // Get 3 random vendors from this category that don't have user accounts yet
    const vendors = await sql`
      SELECT v.id, v.name, v.category 
      FROM vendors v
      LEFT JOIN users u ON u.id::text = v.id::text OR u.email LIKE '%' || LOWER(REPLACE(v.name, ' ', '')) || '%'
      WHERE v.category = ${category} 
        AND v.is_published = true
      LIMIT 3
    `;

    for (const vendor of vendors) {
      // Create email from vendor name
      const emailBase = vendor.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      const email = `${emailBase}@testviah.com`;

      // Check if user already exists
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        console.log(`Skipped (exists): ${email}`);
        continue;
      }

      const userId = randomUUID();

      try {
        // Create user account
        await sql`
          INSERT INTO users (id, email, password_hash, role, email_verified)
          VALUES (${userId}, ${email}, ${passwordHash}, 'vendor', true)
        `;

        // Update vendor with user_id if column exists
        try {
          await sql`UPDATE vendors SET user_id = ${userId} WHERE id = ${vendor.id}`;
        } catch (e) {
          // user_id column might not exist, that's okay
        }

        createdAccounts.push({
          email,
          vendorName: vendor.name,
          category: vendor.category
        });
        totalCreated++;
        console.log(`Created: ${email} -> ${vendor.name} (${category})`);
      } catch (error) {
        console.error(`Error creating account for ${vendor.name}:`, error);
      }
    }
  }

  console.log('\n========================================');
  console.log(`Created ${totalCreated} vendor login accounts`);
  console.log('========================================\n');
  console.log('TEST CREDENTIALS:');
  console.log(`Password for all accounts: ${testPassword}\n`);
  console.log('Accounts created:');
  createdAccounts.forEach(acc => {
    console.log(`  ${acc.email} -> ${acc.vendorName} (${acc.category})`);
  });

  process.exit(0);
}

main().catch(console.error);
