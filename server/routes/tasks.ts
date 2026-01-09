import { Router } from "express";
import type { IStorage } from "../storage";
import { insertTaskSchema } from "@shared/schema";

export async function registerTaskRoutes(router: Router, storage: IStorage) {
  // ============================================================================
  // TASKS
  // ============================================================================

  router.get("/:weddingId", async (req, res) => {
    try {
      const tasks = await storage.getTasksByWedding(req.params.weddingId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  router.get("/progress/:weddingId", async (req, res) => {
    try {
      const tasks = await storage.getTasksByWedding(req.params.weddingId);
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
      const overdue = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate) < new Date();
      }).length;
      const withReminders = tasks.filter(t => t.reminderEnabled).length;

      const progress = total > 0 ? (completed / total) * 100 : 0;

      res.json({
        total,
        completed,
        highPriority,
        overdue,
        withReminders,
        progress: Math.round(progress * 100) / 100,
        remaining: total - completed,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task progress" });
    }
  });

  router.get("/:taskId/reminders", async (req, res) => {
    try {
      const reminders = await storage.getRemindersByTask(req.params.taskId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task reminders" });
    }
  });

  router.patch("/:id/reminder", async (req, res) => {
    try {
      const taskId = req.params.id;
      
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      const { reminderEnabled, reminderDate, reminderDaysBefore, reminderMethod } = req.body;
      
      const updates: any = {};
      if (reminderEnabled !== undefined) updates.reminderEnabled = Boolean(reminderEnabled);
      if (reminderDate !== undefined) {
        updates.reminderDate = reminderDate ? new Date(reminderDate) : null;
      }
      if (reminderDaysBefore !== undefined) {
        const days = parseInt(reminderDaysBefore);
        if (!isNaN(days) && days >= 1 && days <= 30) {
          updates.reminderDaysBefore = days;
        }
      }
      if (reminderMethod !== undefined) {
        const validMethods = ['email', 'sms', 'both'];
        if (validMethods.includes(reminderMethod)) {
          updates.reminderMethod = reminderMethod;
        }
      }

      const task = await storage.updateTask(taskId, updates);
      res.json(task);
    } catch (error) {
      console.error("Failed to update task reminder:", error);
      res.status(500).json({ error: "Failed to update task reminder" });
    }
  });

  router.post("/:id/send-reminder", async (req, res) => {
    try {
      const taskId = req.params.id;
      const userId = req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (!task.assignedToId) {
        return res.status(400).json({ error: "Task is not assigned to anyone" });
      }

      const { TaskReminderScheduler } = await import('../services/task-reminder-scheduler');
      const scheduler = new TaskReminderScheduler(storage);
      
      const result = await scheduler.sendOnDemandReminder(taskId, userId);
      
      res.json({
        success: result.email || result.sms,
        message: result.message,
        emailSent: result.email,
        smsSent: result.sms
      });
    } catch (error: any) {
      console.error("Failed to send on-demand reminder:", error);
      res.status(500).json({ error: error.message || "Failed to send reminder" });
    }
  });

  router.get("/assigned/:weddingId", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const tasks = await storage.getTasksByAssignedUser(req.params.weddingId, userId);
      res.json(tasks);
    } catch (error) {
      console.error("Failed to fetch assigned tasks:", error);
      res.status(500).json({ error: "Failed to fetch assigned tasks" });
    }
  });

  // ============================================================================
  // AI TASK RECOMMENDATIONS
  // ============================================================================

  router.post("/:weddingId/ai-recommendations", async (req, res) => {
    try {
      const { weddingId } = req.params;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const existingTasks = await storage.getTasksByWedding(weddingId);
      const events = await storage.getEventsByWedding(weddingId);
      
      const { generateTaskRecommendations } = await import('../ai/gemini');
      
      const recommendations = await generateTaskRecommendations({
        tradition: wedding.tradition || 'General',
        weddingDate: wedding.date ? wedding.date.toISOString().split('T')[0] : undefined,
        city: wedding.city || undefined,
        budget: wedding.totalBudget ? Number(wedding.totalBudget) : undefined,
        events: events.map(e => ({ 
          name: e.name, 
          date: e.date ? e.date.toISOString() : undefined 
        })),
        existingTasks: existingTasks.map(t => ({
          title: t.title,
          completed: t.completed || false,
          category: t.category || undefined,
        })),
        partner1Name: wedding.partner1Name || undefined,
        partner2Name: wedding.partner2Name || undefined,
        guestCount: wedding.expectedGuests || undefined,
      });
      
      res.json(recommendations);
    } catch (error) {
      console.error("Failed to generate AI task recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  router.post("/:weddingId/adopt-recommendation", async (req, res) => {
    try {
      const { weddingId } = req.params;
      const { title, description, priority, category, suggestedDueDate, reason } = req.body;
      
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      const taskData = {
        weddingId,
        title,
        description,
        priority: priority || 'medium',
        category,
        dueDate: suggestedDueDate ? new Date(suggestedDueDate) : undefined,
        isAiRecommended: true,
        aiReason: reason,
        aiCategory: category,
        completed: false,
      };
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Failed to adopt AI task recommendation:", error);
      res.status(500).json({ error: "Failed to add task" });
    }
  });

  router.post("/:taskId/dismiss", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      const task = await storage.updateTask(taskId, { dismissed: true });
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to dismiss task:", error);
      res.status(500).json({ error: "Failed to dismiss task" });
    }
  });

  // ============================================================================
  // TASK COMMENTS
  // ============================================================================

  router.get("/:taskId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByTask(req.params.taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  router.post("/:taskId/comments", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { userId, userName, content, weddingId } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }
      
      const comment = await storage.createTaskComment({
        taskId,
        weddingId,
        userId,
        userName,
        content: content.trim(),
      });
      
      res.json(comment);
    } catch (error) {
      console.error("Failed to create task comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });
}

export async function registerTaskReminderRoutes(router: Router, storage: IStorage) {
  router.get("/:weddingId", async (req, res) => {
    try {
      const reminders = await storage.getRemindersByWedding(req.params.weddingId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task reminders" });
    }
  });
}

export async function registerTaskCommentRoutes(router: Router, storage: IStorage) {
  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteTaskComment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });
}
