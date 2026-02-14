import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuthButton from '@/components/AuthButton';
import BookmarkForm from '@/components/BookmarkForm';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark as BookmarkIcon } from 'lucide-react';

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BookmarkIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Bookmarks</h1>
            </div>
            <AuthButton user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.user_metadata?.full_name || user.email}!
            </h2>
            <p className="text-gray-600">
              Manage your bookmarks and keep them synced across all devices
            </p>
          </div>

          {/* Add Bookmark Form */}
          <BookmarkForm userId={user.id} />

          {/* Bookmarks List */}
          <BookmarkList userId={user.id} />
        </div>
      </main>
    </div>
  );
}