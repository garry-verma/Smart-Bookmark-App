"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkFormProps {
  userId: string;
}

export default function BookmarkForm({ userId }: BookmarkFormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast.error('Please fill in both title and URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          title: title.trim(),
          url: url.trim(),
          user_id: userId,
        });

      if (error) throw error;

      setTitle('');
      setUrl('');
      toast.success('Bookmark added successfully!');
      
      // Trigger a refresh of the bookmark list
      window.dispatchEvent(new CustomEvent('bookmarkAdded'));
    } catch (error: any) {
      toast.error('Failed to add bookmark: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Bookmark
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter bookmark title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !title.trim() || !url.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Bookmark'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}