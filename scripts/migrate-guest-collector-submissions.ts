import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log("Starting migration of guest_collector_submissions table...");
  
  try {
    // Check if migration is needed by checking if old columns exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'guest_collector_submissions' 
      AND column_name IN ('guest_name', 'guest_email', 'guest_phone', 'guest_names', 'guest_dietary_info', 'desi_dietary_type', 'is_bulk_entry', 'full_address')
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Migration already completed - no old columns found.");
      await pool.end();
      return;
    }
    
    console.log(`Found ${checkResult.rows.length} old columns to migrate:`, checkResult.rows.map(r => r.column_name));
    
    // Step 1: Add new columns if they don't exist
    console.log("Step 1: Adding new columns...");
    
    await pool.query(`
      ALTER TABLE guest_collector_submissions 
      ADD COLUMN IF NOT EXISTS main_contact_email TEXT,
      ADD COLUMN IF NOT EXISTS main_contact_phone TEXT,
      ADD COLUMN IF NOT EXISTS dietary_restriction TEXT
    `);
    
    // Step 2: Copy data from old columns to new columns
    console.log("Step 2: Copying data from old columns to new columns...");
    
    await pool.query(`
      UPDATE guest_collector_submissions 
      SET 
        main_contact_email = COALESCE(main_contact_email, guest_email),
        main_contact_phone = COALESCE(main_contact_phone, guest_phone),
        dietary_restriction = COALESCE(dietary_restriction, desi_dietary_type),
        household_name = COALESCE(household_name, guest_name)
    `);
    
    // Step 3: Make household_name NOT NULL (it should have data now)
    console.log("Step 3: Making household_name NOT NULL...");
    
    // First, ensure all household_name values are populated
    await pool.query(`
      UPDATE guest_collector_submissions 
      SET household_name = guest_name 
      WHERE household_name IS NULL AND guest_name IS NOT NULL
    `);
    
    // Set a default for any remaining nulls
    await pool.query(`
      UPDATE guest_collector_submissions 
      SET household_name = 'Unknown Family' 
      WHERE household_name IS NULL
    `);
    
    // Step 4: Drop old columns
    console.log("Step 4: Dropping old columns...");
    
    // Drop columns one by one to handle if some don't exist
    const columnsToDrop = ['guest_name', 'guest_email', 'guest_phone', 'guest_names', 'guest_dietary_info', 'desi_dietary_type', 'is_bulk_entry', 'full_address'];
    
    for (const column of columnsToDrop) {
      try {
        await pool.query(`ALTER TABLE guest_collector_submissions DROP COLUMN IF EXISTS ${column}`);
        console.log(`  Dropped column: ${column}`);
      } catch (err) {
        console.log(`  Could not drop column ${column}:`, err);
      }
    }
    
    // Step 5: Add NOT NULL constraint to household_name
    console.log("Step 5: Adding NOT NULL constraint to household_name...");
    try {
      await pool.query(`ALTER TABLE guest_collector_submissions ALTER COLUMN household_name SET NOT NULL`);
    } catch (err) {
      console.log("  Could not add NOT NULL constraint (may already exist):", err);
    }
    
    console.log("Migration completed successfully!");
    
    // Verify final structure
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'guest_collector_submissions'
      ORDER BY ordinal_position
    `);
    
    console.log("\nFinal table structure:");
    for (const row of verifyResult.rows) {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    }
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch(console.error);
