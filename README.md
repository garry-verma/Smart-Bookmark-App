# Smart Bookmarks App

A modern, production-ready bookmark management application built with Next.js 14, Supabase, and TailwindCSS. Features real-time synchronization, Google OAuth authentication, and secure data storage.

## 🚀 Features

- **Google OAuth Authentication** - Secure login with Google accounts only
- **Real-time Sync** - Bookmarks sync instantly across all browser tabs and devices
- **Secure Storage** - Row Level Security (RLS) ensures users only access their own data
- **Modern UI** - Clean, responsive design built with TailwindCSS and shadcn/ui
- **Production Ready** - Optimized for deployment on Vercel with no additional backend needed

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- A Supabase account and project
- Google OAuth app credentials

## 🏃‍♂️ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd smart-bookmark-app
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your project URL and anon key
3. Set up Google OAuth:
   - Go to **Authentication > Providers**
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3. Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own bookmarks"
  ON bookmarks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### 4. Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-project.supabase.co/auth/v1/callback` (production)
6. Add the credentials to your Supabase project

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update Google OAuth redirect URIs to include your Vercel domain
5. Deploy!

The app is optimized for Vercel and requires no additional configuration.

## 🔧 How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. After approval, redirected back via Supabase Auth
4. Session established and user redirected to `/dashboard`

### Real-time Updates

The app uses Supabase Realtime to sync bookmarks:

```typescript
const channel = supabase
  .channel('bookmarks_realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'bookmarks',
    filter: `user_id=eq.${userId}`
  }, handleRealtimeEvent)
  .subscribe();
```

Changes in one browser tab instantly appear in all other tabs without refresh.

### Security

- **Row Level Security**: Users can only access their own bookmarks
- **Server-side Auth**: Session validation happens on the server
- **Middleware Protection**: Protected routes redirect unauthenticated users

## 🧩 Project Structure

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Landing page with authentication
├── dashboard/page.tsx     # Main dashboard (protected route)
└── auth/callback/route.ts # OAuth callback handler

components/
├── AuthButton.tsx         # Sign in/out button
├── BookmarkForm.tsx       # Add bookmark form
├── BookmarkList.tsx       # List bookmarks with realtime
└── ui/                    # shadcn/ui components

lib/
├── supabase/
│   ├── client.ts         # Browser Supabase client
│   ├── server.ts         # Server Supabase client
│   └── middleware.ts     # Session middleware
└── types/bookmark.ts     # TypeScript types

middleware.ts             # Route protection
```

## 🐛 Common Issues & Solutions

### OAuth Redirect Mismatch
**Problem**: "redirect_uri_mismatch" error during OAuth

**Solution**: Ensure all redirect URIs are properly configured in Google Cloud Console:
- Development: `http://localhost:3000/auth/callback`
- Supabase: `https://yourproject.supabase.co/auth/v1/callback`

### RLS Blocking Inserts
**Problem**: Bookmarks fail to insert with permission error

**Solution**: Check that RLS policies are correctly set up and user_id matches auth.uid()

### Realtime Subscription Issues
**Problem**: Changes don't sync across tabs

**Solution**: 
- Ensure realtime is enabled: `ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks`
- Check filter matches user_id: `filter: 'user_id=eq.${userId}'`
- Verify subscription cleanup in useEffect

### App Router vs Pages Router
**Problem**: Session not persisting or middleware not working

**Solution**: Ensure you're using App Router patterns:
- Server components for initial auth checks
- Client components only when needed
- Proper middleware setup for route protection

## 🔮 Future Improvements

With more development time, potential enhancements include:

- **Tags/Categories**: Organize bookmarks with custom tags
- **Search**: Full-text search across titles and URLs
- **Bulk Operations**: Select multiple bookmarks for batch actions
- **Import/Export**: Support for browser bookmark imports
- **Sharing**: Share bookmark collections with other users
- **Analytics**: Track bookmark usage and popular links
- **Browser Extension**: Quick bookmark saving from any webpage
- **Offline Support**: PWA capabilities with offline caching
- **API Endpoints**: REST API for third-party integrations

## 📄 License

MIT License - feel free to use this project as a starting point for your own applications.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review [Next.js App Router docs](https://nextjs.org/docs/app)
3. Open an issue in this repository

---

Built with ❤️ using Next.js and Supabase