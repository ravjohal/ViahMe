import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  Mic, 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  Heart, 
  Users, 
  RefreshCw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Wedding, WeddingWebsite } from "@shared/schema";
import ReactMarkdown from "react-markdown";

const speakerRoles = [
  { value: "best_man", label: "Best Man" },
  { value: "maid_of_honor", label: "Maid of Honor" },
  { value: "father_of_bride", label: "Father of the Bride" },
  { value: "mother_of_bride", label: "Mother of the Bride" },
  { value: "father_of_groom", label: "Father of the Groom" },
  { value: "mother_of_groom", label: "Mother of the Groom" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Close Friend" },
  { value: "grandparent", label: "Grandparent" },
  { value: "other", label: "Other Guest" },
] as const;

const recipientOptions = [
  { value: "both_partners", label: "Both Partners Together" },
  { value: "bride", label: "The Bride" },
  { value: "groom", label: "The Groom" },
  { value: "couple_and_guests", label: "The Couple & All Guests" },
] as const;

const toneOptions = [
  { value: "formal", label: "Formal & Elegant" },
  { value: "heartfelt", label: "Heartfelt & Emotional" },
  { value: "humorous", label: "Light & Humorous" },
  { value: "mix", label: "Balanced Mix" },
] as const;

const lengthOptions = [
  { value: "short", label: "Short (2-3 min)" },
  { value: "medium", label: "Medium (4-5 min)" },
  { value: "long", label: "Long (6-8 min)" },
] as const;

const speechFormSchema = z.object({
  speakerRole: z.enum(["best_man", "maid_of_honor", "father_of_bride", "mother_of_bride", "father_of_groom", "mother_of_groom", "sibling", "friend", "grandparent", "other"]),
  speakerName: z.string().optional(),
  speakerRelationshipDetail: z.string().optional(),
  recipientFocus: z.enum(["both_partners", "bride", "groom", "couple_and_guests"]),
  tone: z.enum(["formal", "heartfelt", "humorous", "mix"]),
  length: z.enum(["short", "medium", "long"]),
  keyMemories: z.string().optional(),
  personalAnecdotes: z.string().optional(),
  culturalElements: z.boolean().default(true),
  additionalInstructions: z.string().optional(),
});

type SpeechFormValues = z.infer<typeof speechFormSchema>;

interface GeneratedSpeech {
  speech: string;
  estimatedDuration: string;
  speakingTips: string[];
}

export default function SpeechGenerator() {
  const { toast } = useToast();
  const [generatedSpeech, setGeneratedSpeech] = useState<GeneratedSpeech | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: wedding, isLoading: weddingLoading } = useQuery<Wedding>({
    queryKey: ["/api/wedding"],
  });

  const { data: website } = useQuery<WeddingWebsite>({
    queryKey: ["/api/wedding-website"],
    enabled: !!wedding,
  });

  const form = useForm<SpeechFormValues>({
    resolver: zodResolver(speechFormSchema),
    defaultValues: {
      speakerRole: "best_man",
      recipientFocus: "both_partners",
      tone: "mix",
      length: "medium",
      culturalElements: true,
      keyMemories: "",
      personalAnecdotes: "",
      speakerName: "",
      speakerRelationshipDetail: "",
      additionalInstructions: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: SpeechFormValues) => {
      const payload = {
        ...data,
        partner1Name: wedding?.partner1Name || "Partner 1",
        partner2Name: wedding?.partner2Name || "Partner 2",
        tradition: wedding?.tradition,
        weddingDate: wedding?.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString() : undefined,
        coupleStory: website?.coupleStory || undefined,
      };
      
      const response = await apiRequest("POST", "/api/ai/speech/generate", payload);
      return response.json();
    },
    onSuccess: (data: GeneratedSpeech) => {
      setGeneratedSpeech(data);
      toast({
        title: "Speech generated",
        description: `Your ${data.estimatedDuration} speech is ready!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate speech",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SpeechFormValues) => {
    generateMutation.mutate(data);
  };

  const copyToClipboard = async () => {
    if (generatedSpeech) {
      await navigator.clipboard.writeText(generatedSpeech.speech);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Your speech has been copied",
      });
    }
  };

  if (weddingLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30">
            <Mic className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold">Speech Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Create a personalized wedding speech using AI. Tell us who you are and we'll craft something memorable.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  About You
                </h3>

                <FormField
                  control={form.control}
                  name="speakerRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-speaker-role">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {speakerRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speakerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., John" 
                          {...field} 
                          data-testid="input-speaker-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speakerRelationshipDetail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Relationship (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Best friend since college" 
                          {...field}
                          data-testid="input-relationship"
                        />
                      </FormControl>
                      <FormDescription>
                        Add context about how you know the couple
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Speech Details
                </h3>

                <FormField
                  control={form.control}
                  name="recipientFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who is this speech for?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recipient">
                            <SelectValue placeholder="Select recipient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recipientOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tone">
                              <SelectValue placeholder="Select tone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {toneOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-length">
                              <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lengthOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="culturalElements"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Include Cultural Elements</FormLabel>
                        <FormDescription>
                          Add traditional blessings for {wedding?.tradition || "your"} wedding
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-cultural"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Personal Touches
                </h3>

                <FormField
                  control={form.control}
                  name="keyMemories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Memories</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your favorite memories with the couple... The time we went on that trip together, their first date story, etc."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-memories"
                        />
                      </FormControl>
                      <FormDescription>
                        These will be woven into your speech
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalAnecdotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Stories (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific stories or moments you want mentioned..."
                          className="min-h-[80px]"
                          {...field}
                          data-testid="textarea-anecdotes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                Advanced Options
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showAdvanced && (
                <FormField
                  control={form.control}
                  name="additionalInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special requests? Topics to avoid? Inside jokes to include?"
                          className="min-h-[80px]"
                          {...field}
                          data-testid="textarea-instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-600 to-pink-600"
                disabled={generateMutation.isPending}
                data-testid="button-generate-speech"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Speech
                  </>
                )}
              </Button>
            </form>
          </Form>
        </Card>

        <div className="space-y-4">
          {website?.coupleStory && (
            <Card className="p-4 border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Couple's Story Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll use {wedding?.partner1Name} & {wedding?.partner2Name}'s love story from their wedding website to personalize your speech.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {generateMutation.isPending && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="w-5 h-5 animate-spin text-orange-600" />
                <p className="font-medium">Crafting your speech...</p>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-9/12" />
              </div>
            </Card>
          )}

          {generatedSpeech && !generateMutation.isPending && (
            <>
              <Card className="p-6" data-testid="card-generated-speech">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold">Your Speech</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {generatedSpeech.estimatedDuration}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      data-testid="button-copy-speech"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{generatedSpeech.speech}</ReactMarkdown>
                </div>
              </Card>

              {generatedSpeech.speakingTips.length > 0 && (
                <Card className="p-4" data-testid="card-speaking-tips">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h4 className="font-medium text-sm">Speaking Tips</h4>
                  </div>
                  <ul className="space-y-2">
                    {generatedSpeech.speakingTips.map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-500 font-medium">{index + 1}.</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={generateMutation.isPending}
                data-testid="button-regenerate"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Version
              </Button>
            </>
          )}

          {!generatedSpeech && !generateMutation.isPending && (
            <Card className="p-6 text-center text-muted-foreground">
              <Mic className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium mb-2">No speech generated yet</p>
              <p className="text-sm">
                Fill out the form and click "Generate Speech" to create your personalized wedding speech.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
