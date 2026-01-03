import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireCoupleAuth, requireWeddingAccess } from "./middleware";
import { insertEngagementGameSchema, insertScavengerChallengeSchema, insertTriviaQuestionSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// ============================================================================
// COUPLE DASHBOARD ROUTES - Game Management
// ============================================================================

// Get all games for a wedding
router.get("/weddings/:weddingId/games", requireCoupleAuth, requireWeddingAccess, async (req: Request, res: Response) => {
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
router.get("/games/:gameId", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await storage.getGameWithStats(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Verify ownership
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Failed to fetch game" });
  }
});

// Create a new game
router.post("/weddings/:weddingId/games", requireCoupleAuth, requireWeddingAccess, async (req: Request, res: Response) => {
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
router.patch("/games/:gameId", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await storage.getEngagementGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Verify ownership
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const updatedGame = await storage.updateEngagementGame(gameId, req.body);
    res.json(updatedGame);
  } catch (error) {
    console.error("Error updating game:", error);
    res.status(500).json({ error: "Failed to update game" });
  }
});

// Delete a game
router.delete("/games/:gameId", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await storage.getEngagementGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Verify ownership
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
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
router.get("/games/:gameId/challenges", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await storage.getEngagementGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Verify ownership
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const challenges = await storage.getScavengerChallengesByGame(gameId);
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

// Create a challenge
router.post("/games/:gameId/challenges", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await storage.getEngagementGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Verify ownership
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
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
router.patch("/challenges/:challengeId", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
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
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const updatedChallenge = await storage.updateScavengerChallenge(challengeId, req.body);
    res.json(updatedChallenge);
  } catch (error) {
    console.error("Error updating challenge:", error);
    res.status(500).json({ error: "Failed to update challenge" });
  }
});

// Delete a challenge
router.delete("/challenges/:challengeId", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
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
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await storage.deleteScavengerChallenge(challengeId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ error: "Failed to delete challenge" });
  }
});

// Reorder challenges
router.post("/games/:gameId/challenges/reorder", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { orderedIds } = req.body;
    
    const game = await storage.getEngagementGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
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
router.get("/games/:gameId/questions", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await storage.getEngagementGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Verify ownership
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const questions = await storage.getTriviaQuestionsByGame(gameId);
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Create a question
router.post("/games/:gameId/questions", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await storage.getEngagementGame(gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Verify ownership
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
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
router.patch("/questions/:questionId", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
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
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const updatedQuestion = await storage.updateTriviaQuestion(questionId, req.body);
    res.json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Delete a question
router.delete("/questions/:questionId", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
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
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await storage.deleteTriviaQuestion(questionId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

// Reorder questions
router.post("/games/:gameId/questions/reorder", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { orderedIds } = req.body;
    
    const game = await storage.getEngagementGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
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
router.get("/games/:gameId/leaderboard", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const game = await storage.getEngagementGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const leaderboard = await storage.getLeaderboard(gameId, limit);
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Get pending submissions for review (scavenger hunt only)
router.get("/games/:gameId/submissions/pending", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    
    const game = await storage.getEngagementGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    const wedding = await storage.getWedding(game.weddingId);
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
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
router.post("/submissions/:submissionId/review", requireCoupleAuth, async (req: Request, res: Response) => {
  try {
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
    if (!wedding || wedding.userId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const reviewedSubmission = await storage.reviewScavengerSubmission(
      submissionId,
      status,
      req.user!.id,
      note
    );
    
    res.json(reviewedSubmission);
  } catch (error) {
    console.error("Error reviewing submission:", error);
    res.status(500).json({ error: "Failed to review submission" });
  }
});

export default router;
