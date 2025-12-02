'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ContentItem } from '@/types/content';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Calendar,
  Mail,
  User,
} from 'lucide-react';

interface ContentDetailDialogProps {
  content: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onTakeDown: (id: string, reason: string) => void;
}

export function ContentDetailDialog({
  content,
  open,
  onOpenChange,
  onApprove,
  onTakeDown,
}: ContentDetailDialogProps) {
  const [showTakedownDialog, setShowTakedownDialog] = useState(false);
  const [takedownReason, setTakedownReason] = useState('');

  if (!content) return null;

  const handleApprove = () => {
    onApprove(content.id);
    onOpenChange(false);
  };

  const handleTakeDown = () => {
    if (takedownReason.trim()) {
      onTakeDown(content.id, takedownReason);
      setTakedownReason('');
      setShowTakedownDialog(false);
      onOpenChange(false);
    }
  };

  const isImage = content.type === 'profile_picture' || content.type === 'post';

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    taken_down: 'bg-red-100 text-red-800',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Content
              <Badge className={statusColors[content.status]}>
                {content.status.replace('_', ' ')}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {content.type.replace('_', ' ')} submitted by {content.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={content.type === 'profile_picture' ? content.thumbnail : undefined} />
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
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                  <Image
                    src={content.content}
                    alt="Content"
                    fill
                    className="object-cover"
                    unoptimized
                  />
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
                        i < content.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {content.rating}/5 rating
                  </span>
                </div>
              )}
            </div>

            {/* Flags */}
            {content.flagCount > 0 && (
              <>
                <Separator />
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <h4 className="font-medium">User Reports ({content.flagCount})</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.reportReasons?.map((reason, i) => (
                      <Badge key={i} variant="outline">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {content.status === 'pending' && (
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
            {content.status === 'approved' && (
              <Button
                variant="destructive"
                onClick={() => setShowTakedownDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Take Down
              </Button>
            )}
            {content.status === 'taken_down' && content.reason && (
              <div className="w-full rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <strong>Takedown reason:</strong> {content.reason}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showTakedownDialog} onOpenChange={setShowTakedownDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take down this content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the content from public view. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Enter reason for takedown..."
            value={takedownReason}
            onChange={(e) => setTakedownReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTakedownReason('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTakeDown}
              disabled={!takedownReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Take Down
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

