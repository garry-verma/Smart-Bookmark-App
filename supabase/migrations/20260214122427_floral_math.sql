/*
  # Create bookmarks table with Row Level Security

  1. New Tables
    - `bookmarks`
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, references auth.users(id), NOT NULL)
      - `title` (text, NOT NULL)
      - `url` (text, NOT NULL)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `bookmarks` table
    - Add policies for authenticated users to:
      - Read their own bookmarks
      - Insert their own bookmarks
      - Delete their own bookmarks

  3. Realtime
    - Enable realtime for the bookmarks table
*/

-- Create the bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;