import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { EngagementGame, ScavengerChallenge, TriviaQuestion, Event, GameWithStats, LeaderboardEntry } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Trophy, 
  Plus, 
  Gamepad2, 
  Camera, 
  HelpCircle, 
  Play, 
  Pause, 
  CheckCircle, 
  Trash2, 
  Edit, 
  Users,
  Star,
  Clock,
  Settings,
  Award,
  List,
  Eye,
  EyeOff,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEngagementGameSchema, insertScavengerChallengeSchema, insertTriviaQuestionSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  active: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  paused: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Live",
  paused: "Paused",
  completed: "Completed",
};

export default function EngagementGamesPage() {
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<GameWithStats | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<ScavengerChallenge | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TriviaQuestion | null>(null);

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[weddings.length - 1];

  const { data: games = [], isLoading: gamesLoading } = useQuery<GameWithStats[]>({
    queryKey: ["/api/weddings", wedding?.id, "games"],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: challenges = [] } = useQuery<ScavengerChallenge[]>({
    queryKey: ["/api/games", selectedGame?.id, "challenges"],
    enabled: !!selectedGame?.id && selectedGame?.gameType === 'scavenger_hunt',
  });

  const { data: questions = [] } = useQuery<TriviaQuestion[]>({
    queryKey: ["/api/games", selectedGame?.id, "questions"],
    enabled: !!selectedGame?.id && selectedGame?.gameType === 'trivia',
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/games", selectedGame?.id, "leaderboard"],
    enabled: !!selectedGame?.id,
  });

  // Mutations
  const createGameMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertEngagementGameSchema>) => {
      return apiRequest("POST", `/api/weddings/${wedding.id}/games`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "games"] });
      setCreateDialogOpen(false);
      toast({ title: "Game created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create game", variant: "destructive" });
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EngagementGame> }) => {
      return apiRequest("PATCH", `/api/games/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "games"] });
      if (selectedGame) {
        queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGame.id] });
      }
      toast({ title: "Game updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update game", variant: "destructive" });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/games/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "games"] });
      setSelectedGame(null);
      setDeleteGameId(null);
      toast({ title: "Game deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete game", variant: "destructive" });
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertScavengerChallengeSchema>) => {
      return apiRequest("POST", `/api/games/${selectedGame?.id}/challenges`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGame?.id, "challenges"] });
      setChallengeDialogOpen(false);
      setEditingChallenge(null);
      toast({ title: "Challenge added!" });
    },
    onError: () => {
      toast({ title: "Failed to add challenge", variant: "destructive" });
    },
  });

  const updateChallengeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScavengerChallenge> }) => {
      return apiRequest("PATCH", `/api/challenges/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGame?.id, "challenges"] });
      setChallengeDialogOpen(false);
      setEditingChallenge(null);
      toast({ title: "Challenge updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update challenge", variant: "destructive" });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/challenges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGame?.id, "challenges"] });
      toast({ title: "Challenge deleted" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTriviaQuestionSchema>) => {
      return apiRequest("POST", `/api/games/${selectedGame?.id}/questions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGame?.id, "questions"] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Question added!" });
    },
    onError: () => {
      toast({ title: "Failed to add question", variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TriviaQuestion> }) => {
      return apiRequest("PATCH", `/api/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGame?.id, "questions"] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: "Question updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update question", variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGame?.id, "questions"] });
      toast({ title: "Question deleted" });
    },
  });

  const gameForm = useForm({
    resolver: zodResolver(insertEngagementGameSchema.omit({ weddingId: true })),
    defaultValues: {
      name: "",
      description: "",
      gameType: "scavenger_hunt" as const,
      status: "draft" as const,
      showLeaderboard: true,
      eventId: "",
    },
  });

  const challengeForm = useForm({
    resolver: zodResolver(insertScavengerChallengeSchema.omit({ gameId: true })),
    defaultValues: {
      prompt: "",
      description: "",
      points: 10,
      requiresPhoto: true,
      verificationMode: "auto" as const,
      isActive: true,
      sortOrder: 0,
    },
  });

  const questionForm = useForm({
    resolver: zodResolver(insertTriviaQuestionSchema.omit({ gameId: true })),
    defaultValues: {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10,
      timeLimit: 30,
      explanation: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  if (weddingsLoading || gamesLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Please create a wedding first to manage engagement games.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateGame = (data: any) => {
    createGameMutation.mutate({
      ...data,
      weddingId: wedding.id,
      eventId: data.eventId || null,
    });
  };

  const handleStatusChange = (game: GameWithStats, newStatus: string) => {
    updateGameMutation.mutate({ id: game.id, data: { status: newStatus as any } });
  };

  const handleCreateChallenge = (data: any) => {
    if (editingChallenge) {
      updateChallengeMutation.mutate({ id: editingChallenge.id, data });
    } else {
      createChallengeMutation.mutate({
        ...data,
        gameId: selectedGame!.id,
        sortOrder: challenges.length,
      });
    }
  };

  const handleCreateQuestion = (data: any) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate({
        ...data,
        gameId: selectedGame!.id,
        sortOrder: questions.length,
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Gamepad2 className="h-6 w-6 text-primary" />
            Guest Engagement Games
          </h1>
          <p className="text-muted-foreground">
            Create scavenger hunts and trivia games to keep your guests entertained
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-game">
              <Plus className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
              <DialogDescription>
                Set up a new game for your wedding guests to play
              </DialogDescription>
            </DialogHeader>
            <Form {...gameForm}>
              <form onSubmit={gameForm.handleSubmit(handleCreateGame)} className="space-y-4">
                <FormField
                  control={gameForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Wedding Photo Hunt" {...field} data-testid="input-game-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={gameForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Find and photograph these moments..." {...field} value={field.value || ""} data-testid="input-game-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={gameForm.control}
                  name="gameType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-game-type">
                            <SelectValue placeholder="Select game type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scavenger_hunt">
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4" />
                              Scavenger Hunt
                            </div>
                          </SelectItem>
                          <SelectItem value="trivia">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4" />
                              Trivia Quiz
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'scavenger_hunt' 
                          ? 'Guests photograph items/moments and submit for points'
                          : 'Guests answer questions about the couple'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={gameForm.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Linked Event (Optional)</FormLabel>
                      <Select onValueChange={(val) => field.onChange(val === "none" ? null : val)} defaultValue={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-game-event">
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No specific event</SelectItem>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={gameForm.control}
                  name="showLeaderboard"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Show Leaderboard</FormLabel>
                        <FormDescription className="text-sm">
                          Display rankings to guests
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-show-leaderboard" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createGameMutation.isPending} data-testid="button-submit-game">
                    {createGameMutation.isPending ? "Creating..." : "Create Game"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first engagement game to get your guests excited!
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-game">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Game
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Games List */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Your Games</h2>
            {games.map((game) => (
              <Card 
                key={game.id} 
                className={`cursor-pointer transition-all hover-elevate ${selectedGame?.id === game.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedGame(game)}
                data-testid={`card-game-${game.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {game.gameType === 'scavenger_hunt' ? (
                        <Camera className="h-5 w-5 text-primary" />
                      ) : (
                        <HelpCircle className="h-5 w-5 text-primary" />
                      )}
                      <CardTitle className="text-base">{game.name}</CardTitle>
                    </div>
                    <Badge className={STATUS_COLORS[game.status]}>
                      {STATUS_LABELS[game.status]}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {game.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <List className="h-4 w-4" />
                      {game.challengeCount} {game.gameType === 'scavenger_hunt' ? 'challenges' : 'questions'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {game.participantCount} players
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Game Detail */}
          <div className="lg:col-span-2">
            {selectedGame ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedGame.gameType === 'scavenger_hunt' ? (
                          <Camera className="h-5 w-5 text-primary" />
                        ) : (
                          <HelpCircle className="h-5 w-5 text-primary" />
                        )}
                        {selectedGame.name}
                      </CardTitle>
                      <CardDescription>{selectedGame.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedGame.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(selectedGame, 'active')}
                          data-testid="button-activate-game"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Go Live
                        </Button>
                      )}
                      {selectedGame.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusChange(selectedGame, 'paused')}
                          data-testid="button-pause-game"
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {selectedGame.status === 'paused' && (
                        <Button 
                          size="sm"
                          onClick={() => handleStatusChange(selectedGame, 'active')}
                          data-testid="button-resume-game"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(selectedGame, 'completed')}
                        data-testid="button-complete-game"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        End
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => setDeleteGameId(selectedGame.id)}
                        data-testid="button-delete-game"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {selectedGame.status === 'active' && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <Share2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800 dark:text-green-300">Game is Live!</h4>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            Guests can play this game from their RSVP link. Each guest's personalized invitation link includes access to all active games.
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <code className="text-xs bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded text-green-800 dark:text-green-300">
                              {window.location.origin}/games/[guest-token]
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/games/`);
                                toast({ title: "Link prefix copied!", description: "Add each guest's token to share their personalized game link." });
                              }}
                              data-testid="button-copy-game-link"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                            Tip: Include "Play Games" in your invitation emails, or send game links via the Communication Hub.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="content">
                    <TabsList>
                      <TabsTrigger value="content" data-testid="tab-content">
                        {selectedGame.gameType === 'scavenger_hunt' ? 'Challenges' : 'Questions'}
                      </TabsTrigger>
                      <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
                        Leaderboard
                      </TabsTrigger>
                      <TabsTrigger value="settings" data-testid="tab-settings">
                        Settings
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 mt-4">
                      {selectedGame.gameType === 'scavenger_hunt' ? (
                        <>
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Challenges ({challenges.length})</h3>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setEditingChallenge(null);
                                challengeForm.reset({
                                  prompt: "",
                                  description: "",
                                  points: 10,
                                  requiresPhoto: true,
                                  verificationMode: "auto",
                                  isActive: true,
                                  sortOrder: challenges.length,
                                });
                                setChallengeDialogOpen(true);
                              }}
                              data-testid="button-add-challenge"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Challenge
                            </Button>
                          </div>
                          {challenges.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No challenges yet. Add your first challenge!</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {challenges.map((challenge, index) => (
                                <div 
                                  key={challenge.id} 
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                  data-testid={`challenge-${challenge.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground font-mono text-sm w-6">
                                      {index + 1}.
                                    </span>
                                    <div>
                                      <p className="font-medium">{challenge.prompt}</p>
                                      {challenge.description && (
                                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      {challenge.points} pts
                                    </Badge>
                                    {!challenge.isActive && (
                                      <Badge variant="secondary">
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Hidden
                                      </Badge>
                                    )}
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingChallenge(challenge);
                                        challengeForm.reset({
                                          prompt: challenge.prompt,
                                          description: challenge.description || "",
                                          points: challenge.points,
                                          requiresPhoto: challenge.requiresPhoto,
                                          verificationMode: challenge.verificationMode,
                                          isActive: challenge.isActive,
                                          sortOrder: challenge.sortOrder,
                                        });
                                        setChallengeDialogOpen(true);
                                      }}
                                      data-testid={`button-edit-challenge-${challenge.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => deleteChallengeMutation.mutate(challenge.id)}
                                      data-testid={`button-delete-challenge-${challenge.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Questions ({questions.length})</h3>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setEditingQuestion(null);
                                questionForm.reset({
                                  question: "",
                                  options: ["", "", "", ""],
                                  correctAnswer: 0,
                                  points: 10,
                                  timeLimit: 30,
                                  explanation: "",
                                  isActive: true,
                                  sortOrder: questions.length,
                                });
                                setQuestionDialogOpen(true);
                              }}
                              data-testid="button-add-question"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Question
                            </Button>
                          </div>
                          {questions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No questions yet. Add your first question!</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {questions.map((q, index) => (
                                <div 
                                  key={q.id} 
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                  data-testid={`question-${q.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground font-mono text-sm w-6">
                                      {index + 1}.
                                    </span>
                                    <div>
                                      <p className="font-medium">{q.question}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Answer: {q.options[q.correctAnswer]}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      {q.points} pts
                                    </Badge>
                                    {q.timeLimit && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {q.timeLimit}s
                                      </Badge>
                                    )}
                                    {!q.isActive && (
                                      <Badge variant="secondary">
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        Hidden
                                      </Badge>
                                    )}
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingQuestion(q);
                                        questionForm.reset({
                                          question: q.question,
                                          options: q.options,
                                          correctAnswer: q.correctAnswer,
                                          points: q.points,
                                          timeLimit: q.timeLimit || 30,
                                          explanation: q.explanation || "",
                                          isActive: q.isActive,
                                          sortOrder: q.sortOrder,
                                        });
                                        setQuestionDialogOpen(true);
                                      }}
                                      data-testid={`button-edit-question-${q.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => deleteQuestionMutation.mutate(q.id)}
                                      data-testid={`button-delete-question-${q.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="leaderboard" className="mt-4">
                      {leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No participants yet. Share the game with your guests!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {leaderboard.map((entry, index) => (
                            <div 
                              key={entry.guestId}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                index === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                                index === 2 ? 'bg-orange-400/10 border border-orange-400/20' :
                                'border'
                              }`}
                              data-testid={`leaderboard-entry-${index}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`font-bold text-lg w-8 ${
                                  index === 0 ? 'text-yellow-600' :
                                  index === 1 ? 'text-slate-500' :
                                  index === 2 ? 'text-orange-500' :
                                  'text-muted-foreground'
                                }`}>
                                  #{entry.rank}
                                </span>
                                <div>
                                  <p className="font-medium">{entry.guestName}</p>
                                  {entry.householdName && (
                                    <p className="text-sm text-muted-foreground">{entry.householdName}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                  {entry.challengesCompleted} completed
                                </span>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {entry.totalPoints} pts
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="settings" className="mt-4 space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Show Leaderboard to Guests</p>
                          <p className="text-sm text-muted-foreground">
                            Allow guests to see rankings during the game
                          </p>
                        </div>
                        <Switch 
                          checked={selectedGame.showLeaderboard} 
                          onCheckedChange={(checked) => updateGameMutation.mutate({ 
                            id: selectedGame.id, 
                            data: { showLeaderboard: checked } 
                          })}
                          data-testid="switch-settings-leaderboard"
                        />
                      </div>
                      {selectedGame.event && (
                        <div className="p-3 border rounded-lg">
                          <p className="font-medium">Linked Event</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedGame.event.name}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a game to view and manage it</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Challenge Dialog */}
      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChallenge ? "Edit Challenge" : "Add Challenge"}
            </DialogTitle>
          </DialogHeader>
          <Form {...challengeForm}>
            <form onSubmit={challengeForm.handleSubmit(handleCreateChallenge)} className="space-y-4">
              <FormField
                control={challengeForm.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenge Prompt</FormLabel>
                    <FormControl>
                      <Input placeholder="Take a photo with the bride and groom" {...field} data-testid="input-challenge-prompt" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={challengeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details..." {...field} value={field.value || ""} data-testid="input-challenge-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={challengeForm.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-challenge-points"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={challengeForm.control}
                  name="verificationMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-verification-mode">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Auto-approve</SelectItem>
                          <SelectItem value="manual">Manual review</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={challengeForm.control}
                name="requiresPhoto"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Requires Photo</FormLabel>
                      <FormDescription className="text-sm">
                        Guests must upload a photo
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-requires-photo" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={challengeForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription className="text-sm">
                        Show this challenge to guests
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-challenge-active" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createChallengeMutation.isPending || updateChallengeMutation.isPending} data-testid="button-submit-challenge">
                  {editingChallenge ? "Update" : "Add"} Challenge
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(handleCreateQuestion)} className="space-y-4">
              <FormField
                control={questionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Where did the couple first meet?" {...field} data-testid="input-question-text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Answer Options</FormLabel>
                {[0, 1, 2, 3].map((index) => (
                  <FormField
                    key={index}
                    control={questionForm.control}
                    name={`options.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input 
                              placeholder={`Option ${index + 1}`} 
                              {...field} 
                              data-testid={`input-option-${index}`}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            size="icon"
                            variant={questionForm.watch("correctAnswer") === index ? "default" : "outline"}
                            onClick={() => questionForm.setValue("correctAnswer", index)}
                            data-testid={`button-correct-${index}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <p className="text-xs text-muted-foreground">
                  Click the checkmark to mark the correct answer
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={questionForm.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-question-points"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-question-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={questionForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation (shown after answering)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="They met at a coffee shop in 2018..." 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-question-explanation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={questionForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription className="text-sm">
                        Show this question to guests
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-question-active" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending} data-testid="button-submit-question">
                  {editingQuestion ? "Update" : "Add"} Question
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGameId} onOpenChange={() => setDeleteGameId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this game and all its challenges/questions, 
              along with all guest submissions and scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGameId && deleteGameMutation.mutate(deleteGameId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-game"
            >
              Delete Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
