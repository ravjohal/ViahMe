import { Router } from "express";
import { requireAuth, type AuthRequest } from "../auth-middleware";
import type { IStorage } from "../storage";
import { ensureCoupleAccess } from "./middleware";
import { insertEngagementGameSchema, insertScavengerChallengeSchema, insertTriviaQuestionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerGameRoutes(router: Router, storage: IStorage) {
  // ============================================================================
  // COUPLE DASHBOARD ROUTES - Game Management
  // ============================================================================

  // Get all games for a wedding
  router.get("/weddings/:weddingId/games", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const { weddingId } = req.params;
      const games = await storage.getEngagementGamesByWedding(weddingId);
      
      // Get stats for each game
      const gamesWithStats = await Promise.all(
        games.map(game => storage.getGameWithStats(game.id))
      );
      
      res.json(gamesWithStats.filter(Boolean));
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  // Get single game with stats
  router.get("/games/:gameId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const game = await storage.getGameWithStats(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Verify ownership
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  // Create a new game
  router.post("/weddings/:weddingId/games", await requireAuth(storage, false), ensureCoupleAccess(storage, (req) => req.params.weddingId), async (req, res) => {
    try {
      const { weddingId } = req.params;
      
      const gameData = insertEngagementGameSchema.parse({
        ...req.body,
        weddingId,
      });
      
      const game = await storage.createEngagementGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid game data", details: error.errors });
      }
      console.error("Error creating game:", error);
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  // Update a game
  router.patch("/games/:gameId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const game = await storage.getEngagementGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Verify ownership
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const updatedGame = await storage.updateEngagementGame(gameId, req.body);
      res.json(updatedGame);
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  // Delete a game
  router.delete("/games/:gameId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const game = await storage.getEngagementGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Verify ownership
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      await storage.deleteEngagementGame(gameId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  // ============================================================================
  // SCAVENGER HUNT CHALLENGES
  // ============================================================================

  // Get challenges for a game
  router.get("/games/:gameId/challenges", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const game = await storage.getEngagementGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Verify ownership
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const challenges = await storage.getScavengerChallengesByGame(gameId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  // Create a challenge
  router.post("/games/:gameId/challenges", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const game = await storage.getEngagementGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Verify ownership
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const challengeData = insertScavengerChallengeSchema.parse({
        ...req.body,
        gameId,
      });
      
      const challenge = await storage.createScavengerChallenge(challengeData);
      res.status(201).json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid challenge data", details: error.errors });
      }
      console.error("Error creating challenge:", error);
      res.status(500).json({ error: "Failed to create challenge" });
    }
  });

  // Update a challenge
  router.patch("/challenges/:challengeId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { challengeId } = req.params;
      const challenge = await storage.getScavengerChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      // Verify ownership through game -> wedding
      const game = await storage.getEngagementGame(challenge.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const updatedChallenge = await storage.updateScavengerChallenge(challengeId, req.body);
      res.json(updatedChallenge);
    } catch (error) {
      console.error("Error updating challenge:", error);
      res.status(500).json({ error: "Failed to update challenge" });
    }
  });

  // Delete a challenge
  router.delete("/challenges/:challengeId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { challengeId } = req.params;
      const challenge = await storage.getScavengerChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      // Verify ownership through game -> wedding
      const game = await storage.getEngagementGame(challenge.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      await storage.deleteScavengerChallenge(challengeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      res.status(500).json({ error: "Failed to delete challenge" });
    }
  });

  // Reorder challenges
  router.post("/games/:gameId/challenges/reorder", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const { orderedIds } = req.body;
      
      const game = await storage.getEngagementGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const reorderedChallenges = await storage.reorderScavengerChallenges(gameId, orderedIds);
      res.json(reorderedChallenges);
    } catch (error) {
      console.error("Error reordering challenges:", error);
      res.status(500).json({ error: "Failed to reorder challenges" });
    }
  });

  // ============================================================================
  // TRIVIA QUESTIONS
  // ============================================================================

  // Get questions for a game
  router.get("/games/:gameId/questions", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const game = await storage.getEngagementGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Verify ownership
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const questions = await storage.getTriviaQuestionsByGame(gameId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Create a question
  router.post("/games/:gameId/questions", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const game = await storage.getEngagementGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Verify ownership
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const questionData = insertTriviaQuestionSchema.parse({
        ...req.body,
        gameId,
      });
      
      const question = await storage.createTriviaQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid question data", details: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  // Update a question
  router.patch("/questions/:questionId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { questionId } = req.params;
      const question = await storage.getTriviaQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Verify ownership through game -> wedding
      const game = await storage.getEngagementGame(question.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const updatedQuestion = await storage.updateTriviaQuestion(questionId, req.body);
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  // Delete a question
  router.delete("/questions/:questionId", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { questionId } = req.params;
      const question = await storage.getTriviaQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Verify ownership through game -> wedding
      const game = await storage.getEngagementGame(question.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      await storage.deleteTriviaQuestion(questionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Reorder questions
  router.post("/games/:gameId/questions/reorder", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const { orderedIds } = req.body;
      
      const game = await storage.getEngagementGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const reorderedQuestions = await storage.reorderTriviaQuestions(gameId, orderedIds);
      res.json(reorderedQuestions);
    } catch (error) {
      console.error("Error reordering questions:", error);
      res.status(500).json({ error: "Failed to reorder questions" });
    }
  });

  // ============================================================================
  // LEADERBOARD & MODERATION
  // ============================================================================

  // Get leaderboard for a game
  router.get("/games/:gameId/leaderboard", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const game = await storage.getEngagementGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const leaderboard = await storage.getLeaderboard(gameId, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get pending submissions for review (scavenger hunt only)
  router.get("/games/:gameId/submissions/pending", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { gameId } = req.params;
      
      const game = await storage.getEngagementGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const submissions = await storage.getPendingSubmissionsByGame(gameId);
      
      // Enrich with guest and challenge info
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (sub) => {
          const guest = await storage.getGuest(sub.guestId);
          const challenge = await storage.getScavengerChallenge(sub.challengeId);
          return {
            ...sub,
            guest: guest ? { id: guest.id, name: guest.name } : null,
            challenge: challenge ? { id: challenge.id, prompt: challenge.prompt, points: challenge.points } : null,
          };
        })
      );
      
      res.json(enrichedSubmissions);
    } catch (error) {
      console.error("Error fetching pending submissions:", error);
      res.status(500).json({ error: "Failed to fetch pending submissions" });
    }
  });

  // Review a submission (approve or reject)
  router.post("/submissions/:submissionId/review", await requireAuth(storage, false), async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const { submissionId } = req.params;
      const { status, note } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      
      const submission = await storage.getScavengerSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      // Verify ownership through challenge -> game -> wedding
      const challenge = await storage.getScavengerChallenge(submission.challengeId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      const game = await storage.getEngagementGame(challenge.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      const wedding = await storage.getWedding(game.weddingId);
      if (!wedding || wedding.userId !== authReq.session.userId) {
        const roles = await storage.getWeddingRoles(game.weddingId);
        const hasAccess = roles.some(role => role.userId === authReq.session.userId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const reviewedSubmission = await storage.reviewScavengerSubmission(
        submissionId,
        status,
        authReq.session.userId!,
        note
      );
      
      res.json(reviewedSubmission);
    } catch (error) {
      console.error("Error reviewing submission:", error);
      res.status(500).json({ error: "Failed to review submission" });
    }
  });
}

export default { registerGameRoutes };
