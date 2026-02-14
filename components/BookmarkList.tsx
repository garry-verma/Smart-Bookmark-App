'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2, Bookmark as BookmarkIcon } from 'lucide-react';
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

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchBookmarks();

    // Setup Realtime subscription
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime payload:', payload);

          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== payload.old.id)
            );
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks((prev) =>
              prev.map((b) =>
                b.id === payload.new.id ? (payload.new as Bookmark) : b
              )
            );
          }
        }
      )
      .subscribe((status) => console.log('Realtime status:', status));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchBookmarks = async () => {
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
  };

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
      toast.error('Failed to delete bookmark: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BookmarkIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookmarks yet
          </h3>
          <p className="text-gray-500">
            Start by adding your first bookmark above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Your Bookmarks ({bookmarks.length})
      </h2>
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
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
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1 group"
                >
                  <span className="truncate">{bookmark.url}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
