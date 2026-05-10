export interface WikiFrontmatter {
  title: string;
  description?: string;
  tags?: string[];
  date?: string;
  updated?: string;
  author?: string;
  draft?: boolean;
}

export interface WikiPage {
  slug: string;
  title: string;
  description?: string;
  content: string;
  frontmatter: WikiFrontmatter;
  filePath: string;
  readingTime?: string;
  wordCount?: number;
}

export interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
  createdAt: Date;
}
