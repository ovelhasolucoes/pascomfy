import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, Instagram, Facebook } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PostPreviewProps {
  caption: string;
  mediaUrls: string[];
  platform: string;
  accountName: string;
  accountUsername: string;
  currentSlide: number;
  onSlideChange: (index: number) => void;
}

export function PostPreview({
  caption,
  mediaUrls,
  platform,
  accountName,
  accountUsername,
  currentSlide,
  onSlideChange,
}: PostPreviewProps) {
  const showIG = platform === "instagram" || platform === "ambos";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge
          className={`text-xs ${
            showIG
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
              : "bg-blue-500 text-white border-0"
          }`}
        >
          {showIG ? <Instagram className="h-3 w-3 mr-1" /> : <Facebook className="h-3 w-3 mr-1" />}
          Preview
        </Badge>
      </div>

      {/* Instagram-style mockup */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-sm max-w-[350px]">
        {/* Header */}
        <div className="flex items-center gap-2 p-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
            {accountName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{accountUsername || accountName}</p>
            <p className="text-xs text-muted-foreground">Sua Paróquia</p>
          </div>
        </div>

        {/* Media area */}
        <div className="relative bg-muted aspect-square">
          {mediaUrls.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Adicione uma imagem</p>
            </div>
          ) : (
            <>
              <img
                src={mediaUrls[currentSlide] || mediaUrls[0]}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {/* Carousel nav */}
              {mediaUrls.length > 1 && (
                <>
                  {currentSlide > 0 && (
                    <button
                      onClick={() => onSlideChange(currentSlide - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 shadow"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  {currentSlide < mediaUrls.length - 1 && (
                    <button
                      onClick={() => onSlideChange(currentSlide + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1 shadow"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {mediaUrls.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === currentSlide ? "bg-primary" : "bg-background/60"
                        }`}
                      />
                    ))}
                  </div>
                  {/* Counter badge */}
                  <Badge className="absolute top-3 right-3 bg-background/80 text-foreground text-xs">
                    {currentSlide + 1}/{mediaUrls.length}
                  </Badge>
                </>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5" />
              <MessageCircle className="h-5 w-5" />
              <Send className="h-5 w-5" />
            </div>
            <Bookmark className="h-5 w-5" />
          </div>

          {/* Caption */}
          <div className="text-sm">
            <span className="font-semibold">{accountUsername || accountName}</span>{" "}
            <span className="whitespace-pre-wrap">
              {caption || <span className="text-muted-foreground italic">Sua legenda aparecerá aqui...</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
