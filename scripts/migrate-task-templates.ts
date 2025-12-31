import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { taskTemplates } from "../shared/schema";
import {
  HINDU_TASKS,
  SOUTH_INDIAN_TASKS,
  SIKH_TASKS,
  MUSLIM_TASKS,
  GUJARATI_TASKS,
  CHRISTIAN_TASKS,
  JAIN_TASKS,
  PARSI_TASKS,
  GENERAL_WEDDING_TASKS,
  getPhaseFromDays,
  type TaskTemplate as LegacyTaskTemplate,
} from "../server/task-templates";

interface TraditionTasks {
  tradition: string;
  tasks: LegacyTaskTemplate[];
}

const ALL_TRADITIONS: TraditionTasks[] = [
  { tradition: "hindu", tasks: HINDU_TASKS },
  { tradition: "south_indian", tasks: SOUTH_INDIAN_TASKS },
  { tradition: "sikh", tasks: SIKH_TASKS },
  { tradition: "muslim", tasks: MUSLIM_TASKS },
  { tradition: "gujarati", tasks: GUJARATI_TASKS },
  { tradition: "christian", tasks: CHRISTIAN_TASKS },
  { tradition: "jain", tasks: JAIN_TASKS },
  { tradition: "parsi", tasks: PARSI_TASKS },
  { tradition: "general", tasks: GENERAL_WEDDING_TASKS },
];

async function migrateTaskTemplates() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(connectionString);
  const db = drizzle(sql);

  console.log("Starting task template migration...");

  let totalInserted = 0;

  for (const { tradition, tasks } of ALL_TRADITIONS) {
    console.log(`Migrating ${tasks.length} tasks for ${tradition} tradition...`);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const phase = task.phase || getPhaseFromDays(task.daysBeforeWedding);

      await db.insert(taskTemplates).values({
        templateId: task.id,
        tradition,
        title: task.task,
        category: task.category,
        description: task.description,
        ceremony: task.ceremony || null,
        priority: task.priority || "medium",
        daysBeforeWedding: task.daysBeforeWedding || null,
        phase,
        isActive: true,
        sortOrder: i + 1,
      });

      totalInserted++;
    }

    console.log(`  Completed ${tradition} tradition`);
  }

  console.log(`\nMigration complete! Inserted ${totalInserted} task templates.`);
}

migrateTaskTemplates()
  .then(() => {
    console.log("Migration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
