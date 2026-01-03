import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Loader2, Trophy, Target, Gamepad2, CheckCircle, XCircle, 
  ChevronLeft, Medal, Star, Clock, HelpCircle, Camera,
  PartyPopper, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import type { EngagementGame, ScavengerChallenge, TriviaQuestion, GameParticipation } from "@shared/schema";

interface GameWithStats extends EngagementGame {
  participantCount?: number;
  completedCount?: number;
}

interface GameDetails {
  game: EngagementGame;
  items: (ScavengerChallenge | TriviaQuestion)[];
  participation: GameParticipation;
  completedItemIds: string[];
  pendingItemIds?: string[];
  rejectedItemIds?: string[];
  guestId: string;
  guestName: string;
}

interface LeaderboardEntry {
  guestId: string;
  guestName: string;
  totalPoints: number;
  challengesCompleted: number;
}

export default function GamePortal() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ isCorrect: boolean; correctAnswer: number; explanation?: string } | null>(null);

  const { data: games, isLoading: loadingGames, error: gamesError } = useQuery<GameWithStats[]>({
    queryKey: ['/api/guest-games', token],
    queryFn: () => fetch(`/api/guest-games/${token}`).then(res => {
      if (!res.ok) throw new Error('Failed to load games');
      return res.json();
    }),
    enabled: !!token,
  });

  const { data: gameDetails, isLoading: loadingGame, refetch: refetchGameDetails } = useQuery<GameDetails>({
    queryKey: ['/api/guest-games', token, 'games', selectedGame],
    queryFn: () => fetch(`/api/guest-games/${token}/games/${selectedGame}`).then(res => {
      if (!res.ok) throw new Error('Failed to load game');
      return res.json();
    }),
    enabled: !!token && !!selectedGame,
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/guest-games', token, 'games', selectedGame, 'leaderboard'],
    queryFn: () => fetch(`/api/guest-games/${token}/games/${selectedGame}/leaderboard`).then(res => {
      if (!res.ok) return [];
      return res.json();
    }),
    enabled: !!token && !!selectedGame && !!gameDetails?.game?.showLeaderboard,
  });

  const submitChallengeMutation = useMutation({
    mutationFn: async ({ challengeId, textResponse }: { challengeId: string; textResponse: string }) => {
      const response = await fetch(`/api/guest-games/${token}/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textResponse }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchGameDetails();
      toast({
        title: "Challenge Submitted!",
        description: "Your response has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, selectedOption }: { questionId: string; selectedOption: number }) => {
      const startTime = Date.now();
      const response = await fetch(`/api/guest-games/${token}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          selectedOption,
          responseTimeMs: Date.now() - startTime,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit answer');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLastAnswer({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      });
      setShowResult(true);
      refetchGameDetails();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNextQuestion = () => {
    setShowResult(false);
    setLastAnswer(null);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  if (loadingGames) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" data-testid="loading-game-portal">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading games...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamesError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" data-testid="error-game-portal">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-6 h-6" />
              Invalid or Expired Link
            </CardTitle>
            <CardDescription>
              This game link is no longer valid. Please contact the couple for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" data-testid="no-games-portal">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No Games Available</CardTitle>
            <CardDescription>
              The couple hasn't started any games yet. Check back closer to the wedding!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (selectedGame && gameDetails) {
    const { game, items, participation, completedItemIds, pendingItemIds = [], rejectedItemIds = [], guestName } = gameDetails;
    const totalItems = items.length;
    const completedCount = completedItemIds.length;
    const progressPercent = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    if (game.gameType === 'scavenger_hunt') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4 pb-20">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setSelectedGame(null)}
              data-testid="button-back-to-games"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      {game.name}
                    </CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    <Trophy className="w-4 h-4 mr-1" />
                    {participation.totalPoints} pts
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{completedCount}/{totalItems} challenges</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="challenges">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="challenges" data-testid="tab-challenges">
                  <Target className="w-4 h-4 mr-2" />
                  Challenges
                </TabsTrigger>
                <TabsTrigger value="leaderboard" data-testid="tab-leaderboard" disabled={!game.showLeaderboard}>
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="challenges" className="space-y-3">
                {(items as ScavengerChallenge[]).map((challenge, index) => {
                  const isCompleted = completedItemIds.includes(challenge.id);
                  const isPendingReview = pendingItemIds.includes(challenge.id);
                  const isRejected = rejectedItemIds.includes(challenge.id);
                  return (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      index={index}
                      isCompleted={isCompleted}
                      isPendingReview={isPendingReview}
                      isRejected={isRejected}
                      onSubmit={(text) => submitChallengeMutation.mutate({ 
                        challengeId: challenge.id, 
                        textResponse: text 
                      })}
                      isPending={submitChallengeMutation.isPending}
                    />
                  );
                })}
              </TabsContent>

              <TabsContent value="leaderboard">
                <LeaderboardDisplay entries={leaderboard || []} currentGuestName={guestName} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      );
    }

    if (game.gameType === 'trivia') {
      const questions = items as TriviaQuestion[];
      const unansweredQuestions = questions.filter(q => !completedItemIds.includes(q.id));
      const allAnswered = unansweredQuestions.length === 0;

      if (allAnswered) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
            <div className="max-w-md mx-auto">
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => setSelectedGame(null)}
                data-testid="button-back-to-games"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Button>

              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  <PartyPopper className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">All Done!</h2>
                  <p className="text-muted-foreground mb-6">
                    You've answered all the trivia questions!
                  </p>
                  <div className="bg-muted rounded-lg p-6 mb-6">
                    <div className="text-4xl font-bold text-primary mb-1">
                      {participation.totalPoints}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  {game.showLeaderboard && (
                    <LeaderboardDisplay entries={leaderboard || []} currentGuestName={guestName} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      const currentQuestion = unansweredQuestions[0];

      if (showResult && lastAnswer) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
            <div className="max-w-md mx-auto">
              <Card className="text-center">
                <CardContent className="pt-8 pb-6">
                  {lastAnswer.isCorrect ? (
                    <>
                      <Sparkles className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-green-600 mb-2">Correct!</h2>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-red-600 mb-2">Not Quite!</h2>
                    </>
                  )}
                  {lastAnswer.explanation && (
                    <p className="text-muted-foreground mb-6">{lastAnswer.explanation}</p>
                  )}
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <div className="text-sm text-muted-foreground mb-1">Your Score</div>
                    <div className="text-3xl font-bold text-primary">
                      {participation.totalPoints} pts
                    </div>
                  </div>
                  <Button onClick={handleNextQuestion} className="w-full" data-testid="button-next-question">
                    {unansweredQuestions.length > 1 ? 'Next Question' : 'See Results'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4">
          <div className="max-w-md mx-auto">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setSelectedGame(null)}
              data-testid="button-back-to-games"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>

            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">
                Question {completedCount + 1} of {totalItems}
              </Badge>
              <Badge variant="secondary">
                <Trophy className="w-3 h-3 mr-1" />
                {participation.totalPoints} pts
              </Badge>
            </div>

            <Progress value={progressPercent} className="h-2 mb-6" />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                {currentQuestion.hint && (
                  <CardDescription className="flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    Hint: {currentQuestion.hint}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-4"
                    onClick={() => answerQuestionMutation.mutate({
                      questionId: currentQuestion.id,
                      selectedOption: index,
                    })}
                    disabled={answerQuestionMutation.isPending}
                    data-testid={`button-option-${index}`}
                  >
                    <span className="mr-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Gamepad2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" data-testid="heading-game-portal">Wedding Games</h1>
          <p className="text-muted-foreground">Join the fun and compete with other guests!</p>
        </div>

        <div className="space-y-4">
          {games.map((game) => (
            <Card 
              key={game.id} 
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedGame(game.id)}
              data-testid={`card-game-${game.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {game.gameType === 'scavenger_hunt' ? (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{game.name}</CardTitle>
                      <CardDescription>
                        {game.gameType === 'scavenger_hunt' ? 'Scavenger Hunt' : 'Trivia'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default">Play</Badge>
                </div>
                {game.description && (
                  <p className="text-sm text-muted-foreground mt-2">{game.description}</p>
                )}
                {game.participantCount !== undefined && (
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {game.participantCount} playing
                    </span>
                  </div>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ 
  challenge, 
  index, 
  isCompleted,
  isPendingReview = false,
  isRejected = false,
  onSubmit,
  isPending,
}: { 
  challenge: ScavengerChallenge; 
  index: number;
  isCompleted: boolean;
  isPendingReview?: boolean;
  isRejected?: boolean;
  onSubmit: (text: string) => void;
  isPending: boolean;
}) {
  const [response, setResponse] = useState("");
  const [showInput, setShowInput] = useState(false);

  const getCardStyle = () => {
    if (isCompleted) return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
    if (isPendingReview) return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800";
    if (isRejected) return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
    return "";
  };

  const getIconStyle = () => {
    if (isCompleted) return 'bg-green-500 text-white';
    if (isPendingReview) return 'bg-amber-500 text-white';
    if (isRejected) return 'bg-red-500 text-white';
    return 'bg-muted text-muted-foreground';
  };

  const canSubmit = !isCompleted && !isPendingReview;

  return (
    <Card className={getCardStyle()}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyle()}`}>
            {isCompleted ? (
              <CheckCircle className="w-4 h-4" />
            ) : isPendingReview ? (
              <Clock className="w-4 h-4" />
            ) : isRejected ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">{challenge.title}</h3>
            {challenge.description && (
              <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                {challenge.points} pts
              </Badge>
              {challenge.hint && (
                <Badge variant="outline" className="text-xs">
                  <HelpCircle className="w-3 h-3 mr-1" />
                  {challenge.hint}
                </Badge>
              )}
              {isPendingReview && (
                <Badge className="text-xs bg-amber-500">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending Review
                </Badge>
              )}
              {isRejected && (
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="w-3 h-3 mr-1" />
                  Try Again
                </Badge>
              )}
            </div>
            
            {canSubmit && (
              <div className="mt-3">
                {showInput ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full p-3 border rounded-md text-sm resize-none"
                      placeholder="Describe what you found or did..."
                      rows={3}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      data-testid={`input-challenge-${challenge.id}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (response.trim()) {
                            onSubmit(response);
                            setResponse("");
                            setShowInput(false);
                          }
                        }}
                        disabled={isPending || !response.trim()}
                        data-testid={`button-submit-challenge-${challenge.id}`}
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Submit'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowInput(false);
                          setResponse("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInput(true)}
                    data-testid={`button-start-challenge-${challenge.id}`}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {isRejected ? 'Resubmit Challenge' : 'Complete Challenge'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardDisplay({ 
  entries, 
  currentGuestName 
}: { 
  entries: LeaderboardEntry[]; 
  currentGuestName: string;
}) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No scores yet. Be the first!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.guestName === currentGuestName;
          return (
            <div
              key={entry.guestId}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
              }`}
              data-testid={`leaderboard-entry-${index}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                {index === 0 ? (
                  <Medal className="w-6 h-6 text-amber-500" />
                ) : index === 1 ? (
                  <Medal className="w-6 h-6 text-gray-400" />
                ) : index === 2 ? (
                  <Medal className="w-6 h-6 text-amber-700" />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {entry.guestName}
                  {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.challengesCompleted} challenges
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{entry.totalPoints}</div>
                <div className="text-xs text-muted-foreground">pts</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
