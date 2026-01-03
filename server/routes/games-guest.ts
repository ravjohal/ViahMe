import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertScavengerSubmissionSchema, insertTriviaAnswerSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Middleware to validate household magic token
async function validateHouseholdToken(req: Request, res: Response, next: Function) {
  const token = req.params.token || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: "Token required" });
  }
  
  const household = await storage.getHouseholdByMagicToken(token as string);
  if (!household) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  
  // Get the wedding to access its games
  const wedding = await storage.getWedding(household.weddingId);
  if (!wedding) {
    return res.status(404).json({ error: "Wedding not found" });
  }
  
  // Get guests for this household to identify the player
  const guests = await storage.getGuestsByHousehold(household.id);
  if (guests.length === 0) {
    return res.status(404).json({ error: "No guests found for this household" });
  }
  
  // Attach to request for route handlers
  (req as any).household = household;
  (req as any).wedding = wedding;
  (req as any).guests = guests;
  
  next();
}

// ============================================================================
// GUEST GAME ROUTES - Accessed via household magic link
// ============================================================================

// Get all active games for the wedding
router.get("/guest-games/:token", validateHouseholdToken, async (req: Request, res: Response) => {
  try {
    const wedding = (req as any).wedding;
    const games = await storage.getActiveGamesByWedding(wedding.id);
    
    // Get stats for each game
    const gamesWithStats = await Promise.all(
      games.map(async (game) => {
        const stats = await storage.getGameWithStats(game.id);
        return stats;
      })
    );
    
    res.json(gamesWithStats.filter(Boolean));
  } catch (error) {
    console.error("Error fetching games for guest:", error);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

// Get a specific game with challenges/questions (for playing)
router.get("/guest-games/:token/games/:gameId", validateHouseholdToken, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const wedding = (req as any).wedding;
    const guests = (req as any).guests;
    const household = (req as any).household;
    
    const game = await storage.getEngagementGame(gameId);
    if (!game || game.weddingId !== wedding.id) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ error: "Game is not currently active" });
    }
    
    // Get challenges or questions based on game type
    let items: any[] = [];
    if (game.gameType === 'scavenger_hunt') {
      items = await storage.getScavengerChallengesByGame(gameId);
      items = items.filter(c => c.isActive);
    } else if (game.gameType === 'trivia') {
      const questions = await storage.getTriviaQuestionsByGame(gameId);
      // For guests, hide the correct answer
      items = questions.filter(q => q.isActive).map(q => ({
        ...q,
        correctAnswer: undefined, // Don't reveal answer
      }));
    }
    
    // Get or create participation for first guest (primary player)
    const primaryGuest = guests[0];
    let participation = await storage.getParticipationByGuestAndGame(primaryGuest.id, gameId);
    
    if (!participation) {
      participation = await storage.createGameParticipation({
        gameId,
        guestId: primaryGuest.id,
        householdId: household.id,
        totalPoints: 0,
        challengesCompleted: 0,
      });
    }
    
    // Get completed items for this participant
    let completedItemIds: string[] = [];
    if (game.gameType === 'scavenger_hunt') {
      for (const item of items) {
        const submissions = await storage.getSubmissionsByChallengeAndGuest(item.id, primaryGuest.id);
        if (submissions.length > 0) {
          completedItemIds.push(item.id);
        }
      }
    } else if (game.gameType === 'trivia') {
      const answers = await storage.getAnswersByParticipation(participation.id);
      completedItemIds = answers.map(a => a.questionId);
    }
    
    res.json({
      game,
      items,
      participation,
      completedItemIds,
      guestId: primaryGuest.id,
      guestName: primaryGuest.name,
    });
  } catch (error) {
    console.error("Error fetching game for guest:", error);
    res.status(500).json({ error: "Failed to fetch game" });
  }
});

// Submit a scavenger hunt challenge
router.post("/guest-games/:token/challenges/:challengeId/submit", validateHouseholdToken, async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const guests = (req as any).guests;
    const household = (req as any).household;
    const { photoUrl, textResponse } = req.body;
    
    const challenge = await storage.getScavengerChallenge(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    const game = await storage.getEngagementGame(challenge.gameId);
    if (!game || game.status !== 'active') {
      return res.status(400).json({ error: "Game is not active" });
    }
    
    const primaryGuest = guests[0];
    
    // Check if already submitted
    const existingSubmissions = await storage.getSubmissionsByChallengeAndGuest(challengeId, primaryGuest.id);
    if (existingSubmissions.length > 0) {
      return res.status(400).json({ error: "Already submitted for this challenge" });
    }
    
    // Get or create participation
    let participation = await storage.getParticipationByGuestAndGame(primaryGuest.id, game.id);
    if (!participation) {
      participation = await storage.createGameParticipation({
        gameId: game.id,
        guestId: primaryGuest.id,
        householdId: household.id,
        totalPoints: 0,
        challengesCompleted: 0,
      });
    }
    
    // Determine initial status based on verification mode
    const status = challenge.verificationMode === 'auto' ? 'approved' : 'pending';
    const pointsAwarded = status === 'approved' ? challenge.points : 0;
    
    const submission = await storage.createScavengerSubmission({
      challengeId,
      guestId: primaryGuest.id,
      participationId: participation.id,
      photoUrl,
      textResponse,
      status,
      pointsAwarded,
    });
    
    // If auto-approved, update participation
    if (status === 'approved') {
      await storage.updateGameParticipation(participation.id, {
        totalPoints: participation.totalPoints + pointsAwarded,
        challengesCompleted: participation.challengesCompleted + 1,
      });
    }
    
    res.status(201).json(submission);
  } catch (error) {
    console.error("Error submitting challenge:", error);
    res.status(500).json({ error: "Failed to submit challenge" });
  }
});

// Answer a trivia question
router.post("/guest-games/:token/questions/:questionId/answer", validateHouseholdToken, async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const guests = (req as any).guests;
    const household = (req as any).household;
    const { selectedOption, responseTimeMs } = req.body;
    
    if (selectedOption === undefined || selectedOption === null) {
      return res.status(400).json({ error: "selectedOption is required" });
    }
    
    const question = await storage.getTriviaQuestion(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    const game = await storage.getEngagementGame(question.gameId);
    if (!game || game.status !== 'active') {
      return res.status(400).json({ error: "Game is not active" });
    }
    
    const primaryGuest = guests[0];
    
    // Check if already answered
    const existingAnswer = await storage.getAnswersByQuestionAndGuest(questionId, primaryGuest.id);
    if (existingAnswer) {
      return res.status(400).json({ error: "Already answered this question" });
    }
    
    // Get or create participation
    let participation = await storage.getParticipationByGuestAndGame(primaryGuest.id, game.id);
    if (!participation) {
      participation = await storage.createGameParticipation({
        gameId: game.id,
        guestId: primaryGuest.id,
        householdId: household.id,
        totalPoints: 0,
        challengesCompleted: 0,
      });
    }
    
    // Check if correct
    const isCorrect = selectedOption === question.correctAnswer;
    const pointsAwarded = isCorrect ? question.points : 0;
    
    const answer = await storage.createTriviaAnswer({
      questionId,
      guestId: primaryGuest.id,
      participationId: participation.id,
      selectedOption,
      isCorrect,
      pointsAwarded,
      responseTimeMs,
    });
    
    // Return answer with correct answer revealed
    res.status(201).json({
      ...answer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  } catch (error) {
    if ((error as Error).message === 'Question already answered') {
      return res.status(400).json({ error: "Already answered this question" });
    }
    console.error("Error answering question:", error);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

// Get leaderboard for a game (guest-facing)
router.get("/guest-games/:token/games/:gameId/leaderboard", validateHouseholdToken, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const wedding = (req as any).wedding;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const game = await storage.getEngagementGame(gameId);
    if (!game || game.weddingId !== wedding.id) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    if (!game.showLeaderboard) {
      return res.status(403).json({ error: "Leaderboard is not enabled for this game" });
    }
    
    const leaderboard = await storage.getLeaderboard(gameId, limit);
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Get my participation/progress for a game
router.get("/guest-games/:token/games/:gameId/my-progress", validateHouseholdToken, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const guests = (req as any).guests;
    const wedding = (req as any).wedding;
    
    const game = await storage.getEngagementGame(gameId);
    if (!game || game.weddingId !== wedding.id) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    const primaryGuest = guests[0];
    const participation = await storage.getParticipationByGuestAndGame(primaryGuest.id, gameId);
    
    if (!participation) {
      return res.json({
        guestId: primaryGuest.id,
        guestName: primaryGuest.name,
        totalPoints: 0,
        challengesCompleted: 0,
        rank: null,
      });
    }
    
    // Calculate rank
    const leaderboard = await storage.getLeaderboard(gameId, 100);
    const rank = leaderboard.findIndex(e => e.guestId === primaryGuest.id) + 1;
    
    res.json({
      ...participation,
      guestName: primaryGuest.name,
      rank: rank > 0 ? rank : null,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

export default router;
