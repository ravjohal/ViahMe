import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Video, Upload, Loader2, CheckCircle, X, ImagePlus } from "lucide-react";
import type { GuestMedia } from "@shared/schema";

interface GuestMediaUploadProps {
  uploadUrlEndpoint: string;
  mediaEndpoint: string;
  guestId?: string;
  showApproved?: boolean;
  approvedEndpoint?: string;
}

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function GuestMediaUpload({
  uploadUrlEndpoint,
  mediaEndpoint,
  guestId,
  showApproved = false,
  approvedEndpoint,
}: GuestMediaUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { data: approvedMedia = [] } = useQuery<GuestMedia[]>({
    queryKey: [approvedEndpoint],
    enabled: showApproved && !!approvedEndpoint,
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a JPEG, PNG, WebP, or MP4 file.",
        variant: "destructive",
      });
      return;
    }

    if (isImage && file.size > MAX_PHOTO_SIZE) {
      toast({
        title: "File too large",
        description: "Photos must be under 10MB.",
        variant: "destructive",
      });
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      toast({
        title: "File too large",
        description: "Videos must be under 100MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadSuccess(false);

    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [toast]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress("Getting upload URL...");

    try {
      const urlResponse = await fetch(uploadUrlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!urlResponse.ok) {
        const err = await urlResponse.json();
        throw new Error(err.error || "Failed to get upload URL");
      }

      const { uploadURL, objectPath } = await urlResponse.json();

      setUploadProgress("Uploading file...");

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      setUploadProgress("Saving...");

      const isVideo = ACCEPTED_VIDEO_TYPES.includes(selectedFile.type);
      const mediaData: Record<string, string> = {
        url: objectPath,
        mediaType: isVideo ? "video" : "photo",
      };

      if (caption.trim()) mediaData.caption = caption.trim();
      if (uploaderName.trim()) mediaData.uploaderName = uploaderName.trim();
      if (guestId) mediaData.guestId = guestId;

      const saveResponse = await fetch(mediaEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaData),
      });

      if (!saveResponse.ok) {
        const err = await saveResponse.json();
        throw new Error(err.error || "Failed to save media");
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");

      if (approvedEndpoint) {
        queryClient.invalidateQueries({ queryKey: [approvedEndpoint] });
      }

      toast({
        title: "Upload successful",
        description: "Your photo has been submitted. It may need approval before it appears.",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Share Your Photos & Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!guestId && (
            <div>
              <Label htmlFor="uploader-name">Your Name</Label>
              <Input
                id="uploader-name"
                placeholder="Enter your name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                data-testid="input-uploader-name"
              />
            </div>
          )}

          {!selectedFile && !uploadSuccess && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-upload"
            >
              <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Tap to select a photo or video</p>
              <p className="text-xs text-muted-foreground mt-1">
                Photos up to 10MB, videos up to 100MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",")}
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file-upload"
          />

          {selectedFile && (
            <div className="space-y-3">
              {previewUrl && (
                <div className="relative rounded-lg overflow-hidden bg-muted max-h-64">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain max-h-64"
                    data-testid="img-upload-preview"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={clearSelection}
                    data-testid="button-clear-selection"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {!previewUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={clearSelection}
                    data-testid="button-clear-video"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="resize-none"
                  rows={2}
                  data-testid="input-caption"
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                data-testid="button-upload-submit"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadProgress}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          )}

          {uploadSuccess && !selectedFile && (
            <div className="text-center py-4 space-y-3">
              <CheckCircle className="w-10 h-10 mx-auto text-green-500" />
              <p className="text-sm font-medium">Upload successful!</p>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadSuccess(false);
                  fileInputRef.current?.click();
                }}
                data-testid="button-upload-another"
              >
                <Camera className="w-4 h-4 mr-2" />
                Upload Another
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showApproved && approvedMedia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-primary" />
              Guest Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {approvedMedia.map((media) => (
                <div
                  key={media.id}
                  className="relative rounded-lg overflow-hidden aspect-square bg-muted"
                  data-testid={`guest-media-${media.id}`}
                >
                  {media.mediaType === 'photo' ? (
                    <img
                      src={media.url}
                      alt={media.caption || "Guest photo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {media.uploaderName && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                      <p className="text-xs text-white truncate">{media.uploaderName}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
