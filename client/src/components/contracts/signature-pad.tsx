import { useRef, forwardRef, useImperativeHandle } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface SignaturePadRef {
  getSignatureData: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  onSignatureChange?: () => void;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureChange }, ref) => {
    const signatureCanvasRef = useRef<SignatureCanvas | null>(null);

    useImperativeHandle(ref, () => ({
      getSignatureData: () => {
        if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
          return signatureCanvasRef.current.toDataURL();
        }
        return null;
      },
      clear: () => {
        signatureCanvasRef.current?.clear();
        onSignatureChange?.();
      },
      isEmpty: () => {
        return signatureCanvasRef.current?.isEmpty() ?? true;
      },
    }));

    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-primary/30 rounded-md overflow-hidden bg-background">
          <SignatureCanvas
            ref={signatureCanvasRef}
            penColor="black"
            canvasProps={{
              className: "w-full h-48 cursor-crosshair",
              style: { touchAction: 'none' }
            }}
            onEnd={() => onSignatureChange?.()}
            data-testid="signature-canvas"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sign above using your mouse or touchscreen
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              signatureCanvasRef.current?.clear();
              onSignatureChange?.();
            }}
            data-testid="button-clear-signature"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
