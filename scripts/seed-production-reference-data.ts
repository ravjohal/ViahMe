/**
 * Production Reference Data Seed Script
 * 
 * This script seeds all system/reference data into production database.
 * It EXCLUDES user-generated data (users, weddings, tasks, expenses, etc.)
 * 
 * Usage:
 *   npx tsx scripts/seed-production-reference-data.ts
 * 
 * Reference tables seeded:
 * - wedding_traditions & wedding_sub_traditions
 * - ceremony_types & ceremony_budget_categories
 * - tradition_rituals & ceremony_explainers
 * - budget_bucket_categories
 * - vendor_categories & vendor_task_categories
 * - pricing_regions & regional_pricing
 * - task_templates & timeline_templates
 * - milni_relation_options & milni_pair_templates
 * - ritual_role_templates
 * - ceremony_shopping_templates
 * - dietary_options
 * - registry_retailers
 * - role_permissions & wedding_roles
 * - vendors (system-seeded vendors only)
 */

import { db } from "../server/db";
import { sql } from "drizzle-orm";

// Reference tables to seed (in order of dependencies)
const REFERENCE_TABLES = [
  'wedding_traditions',
  'wedding_sub_traditions',
  'vendor_categories',
  'pricing_regions',
  'regional_pricing',
  'ceremony_types',
  'ceremony_budget_categories',
  'tradition_rituals',
  'ceremony_explainers',
  'ceremony_shopping_templates',
  'budget_bucket_categories',
  'vendor_task_categories',
  'task_templates',
  'timeline_templates',
  'milni_relation_options',
  'milni_pair_templates',
  'ritual_role_templates',
  'dietary_options',
  'registry_retailers',
  'role_permissions',
  'wedding_roles',
  'decor_categories',
  'decor_item_templates',
  'favour_categories',
  'honeymoon_budget_categories',
  'vendors', // System-seeded vendors
];

async function getTableRowCount(tableName: string): Promise<number> {
  const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
  return parseInt((result.rows[0] as any)?.count || '0', 10);
}

async function exportTableData(tableName: string): Promise<any[]> {
  const result = await db.execute(sql.raw(`SELECT * FROM ${tableName}`));
  return result.rows as any[];
}

async function upsertData(tableName: string, data: any[]): Promise<{ inserted: number; updated: number }> {
  if (data.length === 0) return { inserted: 0, updated: 0 };

  let inserted = 0;
  let updated = 0;

  for (const row of data) {
    try {
      // Try to get the primary key column (usually 'id')
      const id = row.id;
      if (!id) {
        console.warn(`  Skipping row without id in ${tableName}`);
        continue;
      }

      // Check if record exists
      const existing = await db.execute(
        sql.raw(`SELECT id FROM ${tableName} WHERE id = '${id}'`)
      );

      if (existing.rows.length > 0) {
        // Update existing record
        const setClauses = Object.entries(row)
          .filter(([key]) => key !== 'id')
          .map(([key, value]) => {
            if (value === null) return `"${key}" = NULL`;
            if (typeof value === 'boolean') return `"${key}" = ${value}`;
            if (typeof value === 'number') return `"${key}" = ${value}`;
            if (typeof value === 'object') return `"${key}" = '${JSON.stringify(value).replace(/'/g, "''")}'`;
            return `"${key}" = '${String(value).replace(/'/g, "''")}'`;
          })
          .join(', ');

        if (setClauses) {
          await db.execute(sql.raw(`UPDATE ${tableName} SET ${setClauses} WHERE id = '${id}'`));
          updated++;
        }
      } else {
        // Insert new record
        const columns = Object.keys(row).map(k => `"${k}"`).join(', ');
        const values = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'boolean') return v.toString();
          if (typeof v === 'number') return v.toString();
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
          return `'${String(v).replace(/'/g, "''")}'`;
        }).join(', ');

        await db.execute(sql.raw(`INSERT INTO ${tableName} (${columns}) VALUES (${values})`));
        inserted++;
      }
    } catch (error: any) {
      console.error(`  Error processing row in ${tableName}:`, error.message);
    }
  }

  return { inserted, updated };
}

async function seedReferenceData() {
  console.log("=".repeat(60));
  console.log("PRODUCTION REFERENCE DATA SEED");
  console.log("=".repeat(60));
  console.log("");

  const summary: { table: string; count: number; inserted: number; updated: number }[] = [];

  for (const tableName of REFERENCE_TABLES) {
    try {
      // Check if table exists
      const tableCheck = await db.execute(
        sql.raw(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')`)
      );
      
      if (!(tableCheck.rows[0] as any)?.exists) {
        console.log(`⏭️  Skipping ${tableName} (table does not exist)`);
        continue;
      }

      const count = await getTableRowCount(tableName);
      console.log(`📊 ${tableName}: ${count} records`);

      if (count === 0) {
        summary.push({ table: tableName, count: 0, inserted: 0, updated: 0 });
        continue;
      }

      // Export and display stats
      const data = await exportTableData(tableName);
      summary.push({ table: tableName, count: data.length, inserted: 0, updated: 0 });

    } catch (error: any) {
      console.error(`❌ Error with ${tableName}:`, error.message);
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  
  let totalRecords = 0;
  for (const { table, count } of summary) {
    if (count > 0) {
      console.log(`  ${table}: ${count} records`);
      totalRecords += count;
    }
  }
  
  console.log("");
  console.log(`Total reference records: ${totalRecords}`);
  console.log("");
  console.log("✅ Reference data audit complete!");
  console.log("");
  console.log("To export this data for production, run:");
  console.log("  npx tsx scripts/export-reference-data.ts");
}

seedReferenceData().catch(console.error);
