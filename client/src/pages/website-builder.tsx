import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, ExternalLink, Globe, Copy, Check, Sparkles, Wand2 } from "lucide-react";
import type { WeddingWebsite, InsertWeddingWebsite, Wedding } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const websiteFormSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  welcomeTitle: z.string().optional(),
  welcomeMessage: z.string().optional(),
  coupleStory: z.string().optional(),
  travelInfo: z.string().optional(),
  accommodationInfo: z.string().optional(),
  thingsToDoInfo: z.string().optional(),
  faqInfo: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

type WebsiteFormData = z.infer<typeof websiteFormSchema>;

export default function WebsiteBuilder() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const [generatingSection, setGeneratingSection] = useState<string | null>(null);

  // Get current wedding (for MVP, use most recent wedding)
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  // Sort by createdAt to get the most recent wedding
  const sortedWeddings = weddings?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const wedding = sortedWeddings?.[0];
  const weddingId = wedding?.id;

  // Get wedding website
  const { data: website, isLoading } = useQuery<WeddingWebsite>({
    queryKey: [`/api/wedding-websites/wedding/${weddingId}`],
    enabled: !!weddingId,
  });

  const form = useForm<WebsiteFormData>({
    resolver: zodResolver(websiteFormSchema),
    values: website ? {
      slug: website.slug,
      welcomeTitle: website.welcomeTitle || "",
      welcomeMessage: website.welcomeMessage || "",
      coupleStory: website.coupleStory || "",
      travelInfo: website.travelInfo || "",
      accommodationInfo: website.accommodationInfo || "",
      thingsToDoInfo: website.thingsToDoInfo || "",
      faqInfo: website.faqInfo || "",
      primaryColor: website.primaryColor || "#f97316",
    } : {
      slug: "",
      welcomeTitle: "",
      welcomeMessage: "",
      coupleStory: "",
      travelInfo: "",
      accommodationInfo: "",
      thingsToDoInfo: "",
      faqInfo: "",
      primaryColor: "#f97316",
    },
  });

  const createWebsite = useMutation({
    mutationFn: async (data: InsertWeddingWebsite) => {
      return await apiRequest("POST", "/api/wedding-websites", data);
    },
    onSuccess: () => {
      toast({ title: "Website created successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-websites/wedding/${weddingId}`] });
    },
    onError: () => {
      toast({ title: "Failed to create website", variant: "destructive" });
    },
  });

  const updateWebsite = useMutation({
    mutationFn: async (data: Partial<WebsiteFormData>) => {
      return await apiRequest("PATCH", `/api/wedding-websites/${website?.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Website updated successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-websites/wedding/${weddingId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update website", variant: "destructive" });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async (isPublished: boolean) => {
      return await apiRequest("PATCH", `/api/wedding-websites/${website?.id}/publish`, { isPublished });
    },
    onSuccess: () => {
      toast({ title: website?.isPublished ? "Website unpublished" : "Website published!" });
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-websites/wedding/${weddingId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update publish status", variant: "destructive" });
    },
  });

  const generateAISuggestion = async (section: 'welcome' | 'travel' | 'accommodation' | 'faq') => {
    if (!weddingId) return;
    
    setGeneratingSection(section);
    try {
      const response = await apiRequest("POST", "/api/ai/website-suggestions", {
        weddingId,
        section,
      });
      const data = await response.json();
      
      if (section === 'faq' && Array.isArray(data.content)) {
        const faqText = data.content
          .map((item: { question: string; answer: string }) => 
            `Q: ${item.question}\nA: ${item.answer}`
          )
          .join('\n\n');
        form.setValue('faqInfo', faqText);
        toast({ title: "FAQ suggestions generated!", description: "Review and edit as needed." });
      } else if (section === 'welcome') {
        form.setValue('welcomeMessage', data.content);
        toast({ title: "Welcome message generated!", description: "Review and edit as needed." });
      } else if (section === 'travel') {
        form.setValue('travelInfo', data.content);
        toast({ title: "Travel info generated!", description: "Review and edit as needed." });
      } else if (section === 'accommodation') {
        form.setValue('accommodationInfo', data.content);
        toast({ title: "Accommodation info generated!", description: "Review and edit as needed." });
      }
    } catch (error) {
      toast({ 
        title: "Failed to generate suggestions", 
        description: "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setGeneratingSection(null);
    }
  };

  const onSubmit = (data: WebsiteFormData) => {
    if (website) {
      updateWebsite.mutate(data);
    } else {
      createWebsite.mutate({
        ...data,
        weddingId: weddingId!,
      });
    }
  };

  const copyLink = () => {
    if (website?.slug) {
      const url = `${window.location.origin}/wedding/${website.slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  if (!weddingId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Wedding Found</CardTitle>
            <CardDescription>Create a wedding first to build your guest website.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Wedding Website Builder</h1>
          <p className="text-muted-foreground">Create a beautiful website for your guests</p>
        </div>
        {website && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={website.isPublished}
                onCheckedChange={(checked) => togglePublish.mutate(checked)}
                disabled={togglePublish.isPending}
                data-testid="switch-publish"
              />
              <span className="text-sm font-medium">
                {website.isPublished ? "Published" : "Unpublished"}
              </span>
            </div>
            {website.isPublished && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                data-testid="button-copy-link"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Link
              </Button>
            )}
            {website.isPublished && (
              <Button
                variant="default"
                size="sm"
                asChild
                data-testid="button-view-website"
              >
                <a href={`/wedding/${website.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Website
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Website Settings
              </CardTitle>
              <CardDescription>Configure your wedding website URL and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {website && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a 
                      href={`/wedding/${website.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate"
                      data-testid="link-website-url"
                    >
                      {window.location.origin}/wedding/{website.slug}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="button-open-website"
                  >
                    <a href={`/wedding/${website.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </a>
                  </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{window.location.origin}/wedding/</span>
                        <Input {...field} placeholder="sarah-and-raj-2024" data-testid="input-slug" />
                      </div>
                    </FormControl>
                    <FormDescription>Choose a unique URL for your wedding website (lowercase letters, numbers, and hyphens only)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" {...field} className="w-20 h-10" data-testid="input-color" />
                        <Input {...field} placeholder="#f97316" className="flex-1" data-testid="input-color-text" />
                      </div>
                    </FormControl>
                    <FormDescription>Choose a color theme for your wedding website</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Tabs defaultValue="welcome" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="welcome">Welcome</TabsTrigger>
              <TabsTrigger value="travel">Travel</TabsTrigger>
              <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="welcome" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Welcome Message</CardTitle>
                      <CardDescription>Greet your guests with a warm welcome message</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAISuggestion('welcome')}
                      disabled={generatingSection === 'welcome'}
                      className="flex items-center gap-2"
                      data-testid="button-ai-welcome"
                    >
                      {generatingSection === 'welcome' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      AI Suggest
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="welcomeTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Welcome Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sarah & Raj" data-testid="input-welcome-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="welcomeMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Welcome Message</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="We're so excited to celebrate our special day with you!"
                            rows={4}
                            data-testid="input-welcome-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coupleStory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Our Story</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell your guests how you met..."
                            rows={6}
                            data-testid="input-couple-story"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="travel" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Travel Information</CardTitle>
                      <CardDescription>Help guests plan their travel to your wedding</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAISuggestion('travel')}
                      disabled={generatingSection === 'travel'}
                      className="flex items-center gap-2"
                      data-testid="button-ai-travel"
                    >
                      {generatingSection === 'travel' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      AI Suggest
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="travelInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Details</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Include airport information, transportation options, parking details..."
                            rows={8}
                            data-testid="input-travel-info"
                          />
                        </FormControl>
                        <FormDescription>Airports, driving directions, parking information, etc.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accommodation" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Accommodation</CardTitle>
                      <CardDescription>Recommend hotels and places to stay</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAISuggestion('accommodation')}
                      disabled={generatingSection === 'accommodation'}
                      className="flex items-center gap-2"
                      data-testid="button-ai-accommodation"
                    >
                      {generatingSection === 'accommodation' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      AI Suggest
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="accommodationInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hotel Recommendations</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="List recommended hotels, hotel blocks, Airbnb options..."
                            rows={8}
                            data-testid="input-accommodation-info"
                          />
                        </FormControl>
                        <FormDescription>Hotel blocks, nearby accommodations, group rates, etc.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Frequently Asked Questions</CardTitle>
                      <CardDescription>Answer common questions from your guests based on your {wedding?.tradition || 'wedding'} tradition</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAISuggestion('faq')}
                      disabled={generatingSection === 'faq'}
                      className="flex items-center gap-2"
                      data-testid="button-ai-faq"
                    >
                      {generatingSection === 'faq' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      AI Suggest
                    </Button>
                  </div>
                  {wedding?.tradition && (
                    <Badge variant="secondary" className="mt-2 w-fit">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI will generate FAQs specific to {wedding.tradition} traditions
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="faqInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FAQ</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="What should I wear? When should I arrive? Can I bring a plus-one?"
                            rows={12}
                            data-testid="input-faq-info"
                          />
                        </FormControl>
                        <FormDescription>Use Q: and A: format for questions and answers. AI suggestions will be formatted this way automatically.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={createWebsite.isPending || updateWebsite.isPending}
              data-testid="button-save-website"
            >
              {(createWebsite.isPending || updateWebsite.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {website ? "Update Website" : "Create Website"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
