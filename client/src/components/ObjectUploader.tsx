// From blueprint: javascript_object_storage
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Dashboard from "@uppy/dashboard";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uppyRef = useRef<Uppy | null>(null);

  useEffect(() => {
    if (!uppyRef.current) {
      uppyRef.current = new Uppy({
        restrictions: {
          maxNumberOfFiles,
          maxFileSize,
        },
        autoProceed: false,
      })
        .use(AwsS3, {
          shouldUseMultipart: false,
          getUploadParameters: onGetUploadParameters,
        })
        .on("complete", (result) => {
          onComplete?.(result);
          setShowModal(false);
        });
    }

    if (containerRef.current && uppyRef.current && showModal) {
      uppyRef.current.use(Dashboard, {
        target: containerRef.current,
        inline: true,
        proudlyDisplayPoweredByUppy: false,
      });
    }

    return () => {
      if (uppyRef.current) {
        const dashboardPlugin = uppyRef.current.getPlugin("Dashboard");
        if (dashboardPlugin) {
          uppyRef.current.removePlugin(dashboardPlugin);
        }
      }
    };
  }, [showModal, maxNumberOfFiles, maxFileSize, onGetUploadParameters, onComplete]);

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-open-uploader">
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl">
          <div ref={containerRef} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
