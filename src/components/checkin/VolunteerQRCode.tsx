import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "lucide-react";

interface VolunteerQRCodeProps {
  checkinCode: string;
  userName: string;
}

export function VolunteerQRCode({ checkinCode, userName }: VolunteerQRCodeProps) {
  const checkinUrl = `${window.location.origin}/checkin/user/${checkinCode}`;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary" />
          Meu QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground text-center">
          Mostre este QR na entrada do evento para registrar sua presença.
        </p>
        <div className="bg-white p-3 rounded-2xl shadow-sm">
          <QRCodeSVG value={checkinUrl} size={180} level="H" includeMargin />
        </div>
        <p className="text-xs text-muted-foreground">{userName}</p>
      </CardContent>
    </Card>
  );
}
