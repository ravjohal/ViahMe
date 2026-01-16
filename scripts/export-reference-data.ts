/**
 * Export Reference Data to SQL
 * 
 * This script exports all system/reference data to SQL INSERT statements
 * that can be run on the production database.
 * 
 * Usage:
 *   npx tsx scripts/export-reference-data.ts
 * 
 * Output:
 *   Creates scripts/production-seed.sql with all reference data
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as schema from "../shared/schema";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}
const sqlClient = neon(connectionString);
const db = drizzle(sqlClient, { schema });

// Reference tables to export (in order of foreign key dependencies)
const REFERENCE_TABLES = [
  // Core tradition/ceremony data
  'wedding_traditions',
  'wedding_sub_traditions',
  'ceremony_types',
  'ceremony_budget_categories',
  'tradition_rituals',
  'ceremony_explainers',
  'ceremony_shopping_templates',
  
  // Budget system
  'budget_bucket_categories',
  
  // Vendor system
  'vendor_categories',
  'vendor_task_categories',
  
  // Pricing
  'pricing_regions',
  'regional_pricing',
  
  // Templates
  'task_templates',
  'timeline_templates',
  
  // Milni system
  'milni_relation_options',
  'milni_pair_templates',
  
  // Ritual roles
  'ritual_role_templates',
  
  // Other reference data
  'dietary_options',
  'registry_retailers',
  'role_permissions',
  'wedding_roles',
  'decor_categories',
  'decor_item_templates',
  'favour_categories',
  'honeymoon_budget_categories',
  
  // Vendors (system-seeded)
  'vendors',
];

function escapeValue(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function exportTableToSQL(tableName: string): Promise<string> {
  try {
    // Check if table exists
    const tableCheck = await db.execute(
      sql.raw(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')`)
    );
    
    if (!(tableCheck.rows[0] as any)?.exists) {
      console.log(`  ⏭️  Skipping ${tableName} (table does not exist)`);
      return '';
    }

    // Get all data
    const result = await db.execute(sql.raw(`SELECT * FROM ${tableName}`));
    const rows = result.rows as any[];

    if (rows.length === 0) {
      console.log(`  ⏭️  Skipping ${tableName} (no data)`);
      return '';
    }

    console.log(`  ✅ Exporting ${tableName}: ${rows.length} records`);

    // Generate SQL statements
    let sqlOutput = `\n-- ============================================\n`;
    sqlOutput += `-- Table: ${tableName} (${rows.length} records)\n`;
    sqlOutput += `-- ============================================\n\n`;

    for (const row of rows) {
      const columns = Object.keys(row).map(k => `"${k}"`).join(', ');
      const values = Object.values(row).map(escapeValue).join(', ');
      
      // Use INSERT ... ON CONFLICT DO UPDATE for upsert behavior
      const updateClauses = Object.keys(row)
        .filter(k => k !== 'id')
        .map(k => `"${k}" = EXCLUDED."${k}"`)
        .join(', ');

      sqlOutput += `INSERT INTO ${tableName} (${columns})\n`;
      sqlOutput += `VALUES (${values})\n`;
      sqlOutput += `ON CONFLICT (id) DO UPDATE SET ${updateClauses};\n\n`;
    }

    return sqlOutput;
  } catch (error: any) {
    console.error(`  ❌ Error exporting ${tableName}:`, error.message);
    return '';
  }
}

async function exportAllReferenceData() {
  console.log("=".repeat(60));
  console.log("EXPORTING REFERENCE DATA TO SQL");
  console.log("=".repeat(60));
  console.log("");

  let fullSQL = `-- Production Reference Data Seed\n`;
  fullSQL += `-- Generated: ${new Date().toISOString()}\n`;
  fullSQL += `-- \n`;
  fullSQL += `-- This file contains all system/reference data for Viah.me\n`;
  fullSQL += `-- Run this against your production database after schema migrations\n`;
  fullSQL += `--\n`;
  fullSQL += `-- EXCLUDES: users, weddings, tasks, events, expenses, guests, etc.\n`;
  fullSQL += `-- INCLUDES: traditions, ceremonies, vendors, templates, etc.\n\n`;

  fullSQL += `BEGIN;\n\n`;

  let totalRecords = 0;
  let exportedTables = 0;

  for (const tableName of REFERENCE_TABLES) {
    const tableSQL = await exportTableToSQL(tableName);
    if (tableSQL) {
      fullSQL += tableSQL;
      exportedTables++;
      // Count records from the SQL
      const recordCount = (tableSQL.match(/INSERT INTO/g) || []).length;
      totalRecords += recordCount;
    }
  }

  fullSQL += `\nCOMMIT;\n`;
  fullSQL += `\n-- End of reference data seed\n`;

  // Write to file
  const outputPath = path.join(__dirname, 'production-seed.sql');
  fs.writeFileSync(outputPath, fullSQL, 'utf-8');

  console.log("");
  console.log("=".repeat(60));
  console.log("EXPORT COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Tables exported: ${exportedTables}`);
  console.log(`  Total records: ${totalRecords}`);
  console.log(`  Output file: ${outputPath}`);
  console.log("");
  console.log("To apply to production:");
  console.log("  1. Publish your app to create the production database");
  console.log("  2. Connect to your production database");
  console.log("  3. Run the SQL file: \\i scripts/production-seed.sql");
  console.log("");
}

exportAllReferenceData().catch(console.error);
