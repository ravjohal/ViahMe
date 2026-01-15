import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Languages, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface Language {
  code: string;
  name: string;
}

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslationPanelProps {
  text: string;
  onTranslationChange?: (translatedText: string, language: string) => void;
  showBilingual?: boolean;
  compact?: boolean;
}

export function TranslationPanel({ 
  text, 
  onTranslationChange, 
  showBilingual = true,
  compact = false 
}: TranslationPanelProps) {
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [isBilingual, setIsBilingual] = useState(true);
  const { toast } = useToast();

  const { data: languages, isLoading: languagesLoading } = useQuery<Language[]>({
    queryKey: ["/api/translation/languages"],
  });

  const translateMutation = useMutation({
    mutationFn: async (data: { text: string; targetLanguage: string }) => {
      return apiRequest("/api/translation/translate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result: TranslationResult) => {
      if (onTranslationChange) {
        onTranslationChange(result.translatedText, result.targetLanguage);
      }
    },
    onError: (error: any) => {
      if (error?.error?.includes("not configured")) {
        toast({
          title: "Translation not available",
          description: "Translation service requires setup. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Translation failed",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
  });

  const handleTranslate = () => {
    if (!text.trim() || !targetLanguage) return;
    translateMutation.mutate({ text, targetLanguage });
  };

  const handleLanguageChange = (value: string) => {
    setTargetLanguage(value);
    if (text.trim() && value) {
      translateMutation.mutate({ text, targetLanguage: value });
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
        <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Select value={targetLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger 
            className="w-[180px] min-h-[40px]" 
            data-testid="select-translation-language"
          >
            <SelectValue placeholder="Add translation" />
          </SelectTrigger>
          <SelectContent>
            {languagesLoading ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : (
              languages?.filter(l => l.code !== 'en').map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {translateMutation.isPending && (
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        )}
        {translateMutation.data && (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Translated
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Languages className="h-5 w-5 text-primary" />
          Translation Options
        </CardTitle>
        <CardDescription>
          Send invitations in Punjabi (Gurmukhi) or other South Asian languages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Translate to
            </Label>
            <Select value={targetLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger 
                className="min-h-[48px] text-base" 
                data-testid="select-translation-language"
              >
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languagesLoading ? (
                  <SelectItem value="loading" disabled>Loading languages...</SelectItem>
                ) : (
                  languages?.filter(l => l.code !== 'en').map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {showBilingual && targetLanguage && (
            <div className="flex items-center gap-3 sm:pt-6">
              <Switch
                id="bilingual"
                checked={isBilingual}
                onCheckedChange={setIsBilingual}
                data-testid="switch-bilingual"
              />
              <Label htmlFor="bilingual" className="text-sm">
                Include English
              </Label>
            </div>
          )}
        </div>

        {targetLanguage && !text.trim() && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Enter your message above to see the translation</span>
          </div>
        )}

        {translateMutation.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {translateMutation.data && (
          <div className="space-y-3">
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Translation Preview
              </Label>
              <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-3">
                {isBilingual && (
                  <div>
                    <Badge variant="outline" className="mb-2 text-xs">English</Badge>
                    <p className="text-sm">{text}</p>
                  </div>
                )}
                <div>
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {languages?.find(l => l.code === targetLanguage)?.name || targetLanguage}
                  </Badge>
                  <p className="text-sm font-[Mukta] text-lg leading-relaxed" dir="auto">
                    {translateMutation.data.translatedText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {targetLanguage && text.trim() && !translateMutation.data && !translateMutation.isPending && (
          <Button 
            onClick={handleTranslate} 
            className="w-full min-h-[48px]"
            data-testid="button-translate"
          >
            <Languages className="h-4 w-4 mr-2" />
            Translate to {languages?.find(l => l.code === targetLanguage)?.name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function InlineTranslationPreview({ 
  originalText, 
  translatedText, 
  languageCode,
  languageName 
}: { 
  originalText: string;
  translatedText: string;
  languageCode: string;
  languageName: string;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Bilingual Invitation</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <Badge variant="outline" className="mb-2 text-xs">English</Badge>
          <p className="text-sm">{originalText}</p>
        </div>
        <div className="p-3 bg-primary/5 rounded-lg">
          <Badge variant="secondary" className="mb-2 text-xs">{languageName}</Badge>
          <p className="text-sm font-[Mukta] text-lg leading-relaxed" dir="auto">
            {translatedText}
          </p>
        </div>
      </div>
    </div>
  );
}
