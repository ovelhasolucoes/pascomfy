import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger } from "@/components/ui/responsive-dialog";
import { QrCode, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface EventQRCodeProps {
  eventId: string;
  eventTitle: string;
  checkinToken: string;
}

export function EventQRCode({ eventId, eventTitle, checkinToken }: EventQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const checkinUrl = `${window.location.origin}/checkin/event/${checkinToken}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.querySelector("#event-qr-svg svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx!.fillStyle = "#ffffff";
      ctx!.fillRect(0, 0, 512, 512);
      ctx!.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `qr-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      URL.revokeObjectURL(url);
      toast.success("QR Code baixado!");
    };
    img.src = url;
  };

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-1" /> QR Check-in
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-center">QR Code — {eventTitle}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Projete ou imprima este QR. Os voluntários escaneiam para registrar presença.
          </p>
          <div id="event-qr-svg" className="bg-white p-4 rounded-2xl shadow-sm">
            <QRCodeSVG value={checkinUrl} size={240} level="H" includeMargin />
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" /> Baixar PNG
            </Button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
