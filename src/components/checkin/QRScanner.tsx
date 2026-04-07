import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, Camera, CameraOff } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  scanning?: boolean;
}

export function QRScanner({ onScan, scanning = false }: QRScannerProps) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader";

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {}
      );
      setActive(true);
    } catch (err: any) {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
      console.error(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setActive(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Card className="transition-shadow hover:shadow-md overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-primary" />
          Scanner QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          id={containerId}
          className={`rounded-xl overflow-hidden ${active ? "min-h-[300px]" : "h-0"}`}
        />

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {scanning && (
          <p className="text-sm text-primary text-center animate-pulse">Processando check-in...</p>
        )}

        <Button
          variant={active ? "destructive" : "default"}
          className="w-full"
          onClick={active ? stopScanner : startScanner}
        >
          {active ? (
            <>
              <CameraOff className="h-4 w-4 mr-2" /> Parar Scanner
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" /> Abrir Câmera
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
