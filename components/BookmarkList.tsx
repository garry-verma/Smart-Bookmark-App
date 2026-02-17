"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2, Bookmark as BookmarkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Bookmark } from '@/lib/types/bookmark';

interface BookmarkListProps {
  userId: string;
}

export default function BookmarkList({ userId }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchBookmarks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch bookmarks: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchBookmarks();

    // 1. Create the unique channel
    const channel = supabase
      .channel(`user-bookmarks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for ALL events (INSERT, DELETE, UPDATE)
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`, // Server-side filtering
        },
        (payload) => {
          console.log('Realtime change received:', payload);

          // HANDLE INSERT
          if (payload.eventType === 'INSERT') {
            const newBookmark = payload.new as Bookmark;
            setBookmarks((prev) => [newBookmark, ...prev]);
          } 
          
          // HANDLE DELETE
          if (payload.eventType === 'DELETE') {
            // Note: On DELETE, data is in 'old'
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }

          // HANDLE UPDATE
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Bookmark;
            setBookmarks((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully connected to Realtime!');
        }
      });

    // 2. Local fallback for the current tab
    const handleBookmarkAdded = () => fetchBookmarks();
    window.addEventListener('bookmarkAdded', handleBookmarkAdded);

    return () => {
      // 3. Proper cleanup
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('bookmarkAdded', handleBookmarkAdded);
    };
  }, [userId, supabase, fetchBookmarks]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Bookmark deleted!');
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ... (Keep your existing loading and empty state UI here) ...

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Your Bookmarks ({bookmarks.length})
      </h2>
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="hover:shadow-md transition-shadow group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {bookmark.title}
                </h3>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1"
                >
                  <span className="truncate">{bookmark.url}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Added {new Date(bookmark.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(bookmark.id)}
                disabled={deletingId === bookmark.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deletingId === bookmark.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}