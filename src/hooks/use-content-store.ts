'use client';

import { useState, useCallback } from 'react';
import { ContentItem, ContentStatus, ContentType } from '@/types/content';
import { mockContent } from '@/data/mock-content';

export function useContentStore() {
  const [content, setContent] = useState<ContentItem[]>(mockContent);

  const updateContentStatus = useCallback(
    (id: string, status: ContentStatus, reason?: string) => {
      setContent((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                moderatedAt: new Date(),
                moderatedBy: 'admin',
                reason: status === 'taken_down' ? reason : undefined,
              }
            : item
        )
      );
    },
    []
  );

  const approveContent = useCallback(
    (id: string) => {
      updateContentStatus(id, 'approved');
    },
    [updateContentStatus]
  );

  const takeDownContent = useCallback(
    (id: string, reason: string) => {
      updateContentStatus(id, 'taken_down', reason);
    },
    [updateContentStatus]
  );

  const getFilteredContent = useCallback(
    (filters: { type?: ContentType; status?: ContentStatus; search?: string }) => {
      return content.filter((item) => {
        if (filters.type && item.type !== filters.type) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            item.userName.toLowerCase().includes(searchLower) ||
            item.userEmail.toLowerCase().includes(searchLower) ||
            item.content.toLowerCase().includes(searchLower) ||
            item.title?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });
    },
    [content]
  );

  const getContentById = useCallback(
    (id: string) => {
      return content.find((item) => item.id === id);
    },
    [content]
  );

  const getStats = useCallback(() => {
    return {
      totalPending: content.filter((c) => c.status === 'pending').length,
      totalApproved: content.filter((c) => c.status === 'approved').length,
      totalTakenDown: content.filter((c) => c.status === 'taken_down').length,
      todayModerated: content.filter(
        (c) =>
          c.moderatedAt &&
          new Date(c.moderatedAt).toDateString() === new Date().toDateString()
      ).length,
      flaggedContent: content.filter((c) => c.flagCount > 0).length,
    };
  }, [content]);

  return {
    content,
    approveContent,
    takeDownContent,
    getFilteredContent,
    getContentById,
    getStats,
  };
}

