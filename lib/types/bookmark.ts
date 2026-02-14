export interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface BookmarkInsert {
  title: string;
  url: string;
  user_id: string;
}