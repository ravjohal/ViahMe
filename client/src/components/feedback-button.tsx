import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Bug, Loader2, CheckCircle2, Camera, X } from "lucide-react";

interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  platform: string;
  language: string;
}

function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    platform: navigator.platform,
    language: navigator.language,
  };
}

export function FeedbackButton() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "general">("bug");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
        ignoreElements: (element) => {
          return element.classList.contains("feedback-button-container");
        },
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setScreenshot(dataUrl);
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      toast({
        variant: "destructive",
        title: "Screenshot failed",
        description: "Could not capture the screen. You can still submit feedback without it.",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    setSubmitted(false);
    setDescription("");
    setFeedbackType("bug");
    setScreenshot(null);
    await captureScreenshot();
  }, [captureScreenshot]);

  const submitMutation = useMutation({
    mutationFn: async (data: {
      feedbackType: string;
      description: string;
      pageUrl: string;
      userEmail?: string;
      screenshotUrl?: string;
      deviceInfo: DeviceInfo;
    }) => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit feedback");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Feedback received!",
        description: "Thank you for helping us improve.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Description required",
        description: "Please describe the issue or suggestion.",
      });
      return;
    }

    submitMutation.mutate({
      feedbackType,
      description: description.trim(),
      pageUrl: window.location.href,
      userEmail: email.trim() || undefined,
      screenshotUrl: screenshot || undefined,
      deviceInfo: getDeviceInfo(),
    });
  };

  const handleClose = () => {
    setOpen(false);
    setDescription("");
    setScreenshot(null);
    setSubmitted(false);
  };

  return (
    <>
      <div className="feedback-button-container fixed bottom-4 left-4 z-40">
        <Button
          onClick={handleOpen}
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-2 border-primary/20 hover-elevate"
          data-testid="button-feedback"
        >
          <Bug className="h-5 w-5 text-primary" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {!submitted ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  Report an Issue
                </DialogTitle>
                <DialogDescription>
                  Found a bug or have a suggestion? Let us know and we'll look into it.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback-type">Type</Label>
                  <Select
                    value={feedbackType}
                    onValueChange={(v) => setFeedbackType(v as typeof feedbackType)}
                  >
                    <SelectTrigger id="feedback-type" data-testid="select-feedback-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="general">General Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="What happened? What did you expect to happen?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="textarea-feedback-description"
                  />
                </div>

                {!user && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-feedback-email"
                    />
                    <p className="text-xs text-muted-foreground">
                      If you'd like us to follow up with you
                    </p>
                  </div>
                )}

                {screenshot && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Screenshot captured
                    </Label>
                    <div className="relative rounded-md overflow-hidden border">
                      <img
                        src={screenshot}
                        alt="Screenshot"
                        className="w-full h-auto max-h-32 object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-background/80"
                        onClick={() => setScreenshot(null)}
                        data-testid="button-remove-screenshot"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {isCapturing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Capturing screenshot...
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleClose} data-testid="button-cancel-feedback">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !description.trim()}
                  data-testid="button-submit-feedback"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Thank you!</h3>
                <p className="text-muted-foreground">
                  Your feedback has been received. We appreciate you helping us improve.
                </p>
              </div>
              <Button onClick={handleClose} data-testid="button-close-feedback">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
