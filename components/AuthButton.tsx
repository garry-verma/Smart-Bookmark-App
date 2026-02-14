"use client";

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';

interface AuthButtonProps {
  user: any;
}

export default function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      console.error('Error signing in:', error);
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          {user.email}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}