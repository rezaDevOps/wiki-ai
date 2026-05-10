import Link from "next/link";
import {
  BookOpen,
  Brain,
  Code2,
  MessageSquare,
  Search,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

const FEATURED_SECTIONS = [
  {
    icon: Brain,
    title: "AI Fundamentals",
    description: "Core concepts in machine learning, neural networks, and AI systems.",
    href: "/wiki/topics/ai-fundamentals",
    count: 12,
  },
  {
    icon: MessageSquare,
    title: "Prompt Engineering",
    description: "Techniques for crafting effective prompts across different models.",
    href: "/wiki/topics/prompt-engineering",
    count: 8,
  },
  {
    icon: Code2,
    title: "RAG Systems",
    description: "Retrieval-augmented generation patterns and implementation guides.",
    href: "/wiki/topics/rag-systems",
    count: 6,
  },
  {
    icon: Zap,
    title: "Getting Started",
    description: "New to Wiki AI? Start here for a guided tour of the knowledge base.",
    href: "/wiki/getting-started/overview",
    count: 4,
  },
];

const STATS = [
  { label: "Wiki Pages", value: "120+" },
  { label: "Topics", value: "18" },
  { label: "AI Models Covered", value: "12" },
  { label: "Last Updated", value: "Today" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">

      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <BookOpen className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Wiki AI
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Your AI-powered knowledge base. Search, explore, and chat with your
          entire wiki using natural language.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/wiki/getting-started/overview"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Browse Wiki
          </Link>
          <Link
            href="/chat"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-6 text-sm font-medium hover:bg-accent transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Ask AI
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 text-center"
          >
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Featured sections */}
      <div className="mb-16">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">
          Featured Topics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURED_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {section.count} pages
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* AI Chat CTA */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Can&apos;t find what you need?</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Ask the AI assistant — it searches the entire knowledge base and
          returns contextual answers with source citations.
        </p>
        <Link
          href="/chat"
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Start a conversation
        </Link>
      </div>
    </div>
  );
}
