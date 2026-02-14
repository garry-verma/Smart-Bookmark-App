import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuthButton from '@/components/AuthButton';
import { Bookmark as BookmarkIcon, Zap, Shield, Globe } from 'lucide-react';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-xl">
              <BookmarkIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Smart Bookmarks</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Save, organize, and access your favorite links from anywhere. 
            Real-time sync across all your devices with Google authentication.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <Zap className="h-10 w-10 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
            <p className="text-gray-600">
              Changes sync instantly across all your devices and browser tabs
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <Shield className="h-10 w-10 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Your bookmarks are secured with Google OAuth and encrypted storage
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <Globe className="h-10 w-10 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Anywhere</h3>
            <p className="text-gray-600">
              Available on any device with a web browser, no installation needed
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-gray-600 mb-6">
              Sign in with your Google account to start managing your bookmarks
            </p>
            <AuthButton user={null} />
            <p className="text-xs text-gray-500 mt-4">
              Free to use • No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}