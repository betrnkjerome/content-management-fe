"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ContentItem, MediaAttachment } from "@/types/content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Star,
  Calendar,
  Mail,
  User,
  X,
  ZoomIn,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MediaViewerProps {
  media: MediaAttachment[] | { type: "profile"; url: string }[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

function MediaViewer({ media, initialIndex, open, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync currentIndex with initialIndex when it changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!open || media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia.type === "video";

  const goNext = () => setCurrentIndex((i) => (i + 1) % media.length);
  const goPrev = () =>
    setCurrentIndex((i) => (i - 1 + media.length) % media.length);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {media.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {isVideo ? (
          <video
            src={currentMedia.url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        ) : (
          <Image
            src={currentMedia.url}
            alt="Media"
            width={1200}
            height={800}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
            unoptimized
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ContentDetailDialogProps {
  content: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onTakeDown: (id: string, reason: string) => void;
}

const TAKEDOWN_REASONS = [
  "Spam",
  "Hate Speech",
  "Harassment",
  "Nudity",
  "Copyright",
  "Other",
] as const;

export function ContentDetailDialog({
  content,
  open,
  onOpenChange,
  onApprove,
  onTakeDown,
}: ContentDetailDialogProps) {
  const [showTakedownDialog, setShowTakedownDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [mediaViewer, setMediaViewer] = useState<{
    open: boolean;
    media: MediaAttachment[] | { type: "profile"; url: string }[];
    index: number;
  }>({ open: false, media: [], index: 0 });

  const takedownReason =
    selectedReason === "Other" ? customReason : selectedReason;

  if (!content) return null;

  const handleApprove = () => {
    onApprove(content.id);
    onOpenChange(false);
  };

  const handleTakeDown = () => {
    if (takedownReason.trim()) {
      onTakeDown(content.id, takedownReason);
      setSelectedReason("");
      setCustomReason("");
      setShowTakedownDialog(false);
      onOpenChange(false);
    }
  };

  const resetTakedownDialog = () => {
    setSelectedReason("");
    setCustomReason("");
  };

  const isImage = content.type === "profile_picture";

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800", // "For Review"
    approved: "bg-green-100 text-green-800",
    taken_down: "bg-red-100 text-red-800",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Content
              <Badge className={statusColors[content.status]}>
                {content.status === "pending"
                  ? "For Review"
                  : content.status.replace("_", " ")}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {content.type.replace("_", " ")} submitted by {content.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={
                    content.type === "profile_picture"
                      ? content.thumbnail
                      : undefined
                  }
                />
                <AvatarFallback>{content.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{content.userName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {content.userEmail}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(content.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <Separator />

            {/* Content */}
            <div>
              <h4 className="mb-2 font-medium">Content</h4>
              {content.title && (
                <p className="mb-2 text-lg font-semibold">{content.title}</p>
              )}
              {isImage ? (
                <div
                  className="group relative w-full max-w-md mx-auto cursor-pointer overflow-hidden rounded-lg border"
                  onClick={() =>
                    setMediaViewer({
                      open: true,
                      media: [
                        { type: "profile" as const, url: content.content },
                      ],
                      index: 0,
                    })
                  }
                >
                  <Image
                    src={content.content}
                    alt="Content"
                    width={400}
                    height={0}
                    className="w-full h-auto object-contain"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap">{content.content}</p>
                </div>
              )}
              {content.rating && (
                <div className="mt-2 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < content.rating!
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {content.rating}/5 rating
                  </span>
                </div>
              )}

              {/* Media Attachments for reviews */}
              {content.media && content.media.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 font-medium text-sm text-muted-foreground">
                    Attached Media ({content.media.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {content.media.map((media, index) => (
                      <div
                        key={media.id}
                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted"
                        onClick={() =>
                          setMediaViewer({
                            open: true,
                            media: content.media!,
                            index,
                          })
                        }
                      >
                        {media.type === "video" ? (
                          <>
                            <Image
                              src={media.thumbnail || media.url}
                              alt="Video thumbnail"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="rounded-full bg-white/90 p-2">
                                <Play className="h-6 w-6 text-black fill-black" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <Image
                            src={media.url}
                            alt="Attached media"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 mt-4">
            {content.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowTakedownDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Take Down
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {content.status === "approved" && (
              <Button
                variant="destructive"
                onClick={() => setShowTakedownDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Take Down
              </Button>
            )}
            {content.status === "taken_down" && content.reason && (
              <div className="w-full rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <strong>Takedown reason:</strong> {content.reason}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showTakedownDialog}
        onOpenChange={(open) => {
          setShowTakedownDialog(open);
          if (!open) resetTakedownDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take down this content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the content from public view. Please select a
              reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            {TAKEDOWN_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="takedownReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">{reason}</span>
              </label>
            ))}
            {selectedReason === "Other" && (
              <Input
                placeholder="Enter custom reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2"
                autoFocus
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetTakedownDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTakeDown}
              disabled={!takedownReason.trim()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Take Down
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MediaViewer
        media={mediaViewer.media}
        initialIndex={mediaViewer.index}
        open={mediaViewer.open}
        onClose={() => setMediaViewer({ open: false, media: [], index: 0 })}
      />
    </>
  );
}
