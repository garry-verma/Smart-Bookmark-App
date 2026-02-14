"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ExternalLink, Trash2, Bookmark as BookmarkIcon, Wifi, WifiOff } from 'lucide-react';

// Create Supabase client (you'll need to replace with your actual values)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
);

interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
}

interface BookmarkListProps {
  userId: string;
}

export default function BookmarkList({ userId }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const channelRef = useRef<any>(null);

  // Fetch bookmarks from database
  const fetchBookmarks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookmarks:', error);
        return;
      }

      setBookmarks(data || []);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`bookmarks_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Real-time update:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              const newBookmark = payload.new as Bookmark;
              setBookmarks((prevBookmarks) => {
                // Avoid duplicates
                const exists = prevBookmarks.some(b => b.id === newBookmark.id);
                if (exists) return prevBookmarks;
                return [newBookmark, ...prevBookmarks];
              });
              break;

            case 'UPDATE':
              const updatedBookmark = payload.new as Bookmark;
              setBookmarks((prevBookmarks) =>
                prevBookmarks.map((bookmark) =>
                  bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark
                )
              );
              break;

            case 'DELETE':
              const deletedBookmark = payload.old as Bookmark;
              setBookmarks((prevBookmarks) =>
                prevBookmarks.filter((bookmark) => bookmark.id !== deletedBookmark.id)
              );
              break;
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status, err);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
          // Retry connection after 3 seconds
          setTimeout(() => {
            console.log('Retrying subscription...');
            setupRealtimeSubscription();
          }, 3000);
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  // Delete bookmark
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting bookmark:', error);
        alert('Failed to delete bookmark');
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      alert('Failed to delete bookmark');
    } finally {
      setDeletingId(null);
    }
  };

  // Retry connection
  const handleRetryConnection = () => {
    setConnectionStatus('connecting');
    setupRealtimeSubscription();
  };

  // Initialize component
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Setup real-time subscription
  useEffect(() => {
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [setupRealtimeSubscription]);

  // Handle page visibility changes (reconnect when tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus === 'disconnected') {
        console.log('Page became visible, reconnecting...');
        setupRealtimeSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectionStatus, setupRealtimeSubscription]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (connectionStatus === 'disconnected') {
        console.log('Connection restored, reconnecting...');
        setupRealtimeSubscription();
      }
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionStatus, setupRealtimeSubscription]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Bookmarks ({bookmarks.length})
        </h2>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {connectionStatus === 'connected' && (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Live</span>
            </>
          )}
          {connectionStatus === 'disconnected' && (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <button
                onClick={handleRetryConnection}
                className="text-red-600 hover:text-red-700 underline"
              >
                Reconnect
              </button>
            </>
          )}
          {connectionStatus === 'connecting' && (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              <span className="text-gray-600">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <BookmarkIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
          <p className="text-gray-500">Start by adding your first bookmark above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <div 
              key={bookmark.id} 
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
            >
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
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  disabled={deletingId === bookmark.id}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                >
                  {deletingId === bookmark.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}