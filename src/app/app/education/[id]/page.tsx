"use client";

// ── Education article reader ─────────────────────────────────────────────
//
// Simple reader (Option D1 from the implementation-options mockup).
// Renders title + eyebrow + date + body. No related-articles loop, no
// share, no glossary widget. The article body is plain prose split on
// blank lines — no markdown library needed for v1.
//
// Spec: docs/specs/education-personalization.md

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { educationLibrary } from "@/data/education-library";

interface PageProps {
  params: Promise<{ id: string }>;
}

function readMinutes(length: "short" | "medium" | "long"): string {
  return length === "short" ? "3 min" : length === "medium" ? "5 min" : "8 min";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EducationArticlePage({ params }: PageProps) {
  const { id } = use(params);
  const article = educationLibrary.find((a) => a.id === id);
  if (!article) notFound();

  const paragraphs = article.body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <article>
      <Link
        href="/app/education"
        className="text-[11px] text-muted hover:text-accent transition-colors"
      >
        ‹ Education
      </Link>

      <p className="mt-4 text-[10px] uppercase tracking-[1.6px] text-accent">
        {article.topic.replace("_", " ")} · {readMinutes(article.length)}
      </p>

      <h1 className="mt-2 font-display text-3xl italic leading-tight text-text">
        {article.title}
      </h1>

      <p className="mt-2 text-[12px] text-muted font-light">
        {formatDate(article.published)}
      </p>

      <div className="mt-6 space-y-4 text-[14px] font-light leading-relaxed text-muted2">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
