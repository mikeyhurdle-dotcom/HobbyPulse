"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Clock, ArrowRight, RotateCcw, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecommendedGame {
  slug: string;
  title: string;
  thumbnail_url: string | null;
  image_url: string | null;
  bgg_rating: number | null;
  bgg_rank: number | null;
  min_players: number | null;
  max_players: number | null;
  play_time_min: number | null;
  play_time_max: number | null;
  complexity: number | null;
  amazon_asin: string | null;
  zatu_url: string | null;
  matchReason: string;
}

type Step = "players" | "complexity" | "time" | "vibe" | "results";

interface Answers {
  players?: string;
  complexity?: string;
  time?: string;
  vibe?: string;
}

// ---------------------------------------------------------------------------
// Quiz steps
// ---------------------------------------------------------------------------

const steps: {
  key: Step;
  question: string;
  options: { label: string; value: string }[];
}[] = [
  {
    key: "players",
    question: "How many players?",
    options: [
      { label: "Solo", value: "1" },
      { label: "2 Players", value: "2" },
      { label: "3-4 Players", value: "3" },
      { label: "5+", value: "5" },
    ],
  },
  {
    key: "complexity",
    question: "How complex?",
    options: [
      { label: "Light", value: "light" },
      { label: "Medium", value: "medium" },
      { label: "Heavy", value: "heavy" },
    ],
  },
  {
    key: "time",
    question: "How long?",
    options: [
      { label: "Under 30 min", value: "30" },
      { label: "30-60 min", value: "60" },
      { label: "60-120 min", value: "120" },
      { label: "120+ min", value: "240" },
    ],
  },
  {
    key: "vibe",
    question: "What vibe?",
    options: [
      { label: "Competitive", value: "competitive" },
      { label: "Cooperative", value: "cooperative" },
      { label: "Party", value: "party" },
      { label: "Strategy", value: "strategy" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GameRecommender({
  initialAnswers,
}: {
  initialAnswers?: Answers;
}) {
  const hasInitial = initialAnswers && Object.keys(initialAnswers).length > 0;
  const [currentStep, setCurrentStep] = useState<number>(hasInitial ? 4 : 0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [results, setResults] = useState<RecommendedGame[]>([]);
  const [loading, setLoading] = useState(hasInitial);
  const [phase, setPhase] = useState<Step>(hasInitial ? "results" : "players");

  // Auto-submit if initial answers provided
  if (hasInitial && results.length === 0 && loading) {
    fetchResults(initialAnswers!);
  }

  async function fetchResults(ans: Answers) {
    setLoading(true);
    setPhase("results");

    const sp = new URLSearchParams();
    if (ans.players) sp.set("players", ans.players);
    if (ans.complexity) sp.set("complexity", ans.complexity);
    if (ans.time) sp.set("time", ans.time);
    if (ans.vibe) sp.set("vibe", ans.vibe);

    try {
      const res = await fetch(`/api/recommend-game?${sp.toString()}`);
      const data = await res.json();
      setResults(data.games ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(value: string) {
    const step = steps[currentStep];
    const newAnswers = { ...answers, [step.key]: value };
    setAnswers(newAnswers);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setPhase(steps[currentStep + 1].key);
    } else {
      fetchResults(newAnswers);
    }
  }

  function reset() {
    setCurrentStep(0);
    setAnswers({});
    setResults([]);
    setPhase("players");
    setLoading(false);
    // Clear URL params
    window.history.replaceState({}, "", "/boardgames/recommend");
  }

  function shareUrl(): string {
    const sp = new URLSearchParams();
    if (answers.players) sp.set("players", answers.players);
    if (answers.complexity) sp.set("complexity", answers.complexity);
    if (answers.time) sp.set("time", answers.time);
    if (answers.vibe) sp.set("vibe", answers.vibe);
    return `${window.location.origin}/boardgames/recommend?${sp.toString()}`;
  }

  // Progress bar
  const progress = phase === "results" ? 100 : (currentStep / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-border mb-8 overflow-hidden">
        <div
          className="h-full bg-[var(--vertical-accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Quiz steps */}
      {phase !== "results" && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Question {currentStep + 1} of {steps.length}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
            {steps[currentStep].question}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {steps[currentStep].options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className="rounded-xl border-2 border-border bg-card px-6 py-4 text-base font-semibold hover:border-[var(--vertical-accent)] hover:bg-[var(--vertical-accent)]/5 transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {phase === "results" && loading && (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--vertical-accent)] mx-auto mb-4" />
          <p className="text-muted-foreground">Finding your perfect games...</p>
        </div>
      )}

      {/* Results */}
      {phase === "results" && !loading && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">
            {results.length > 0 ? "Your Recommendations" : "No Matches Found"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {results.length > 0
              ? "Based on your answers, here are our top picks."
              : "Try adjusting your preferences for more results."}
          </p>

          <div className="space-y-4">
            {results.map((game, i) => (
              <Link
                key={game.slug}
                href={`/boardgames/games/${game.slug}`}
                className="group block"
              >
                <Card className="border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                        {game.thumbnail_url ? (
                          <img
                            src={game.thumbnail_url}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            {i + 1}
                          </div>
                        )}
                        <span className="absolute top-1 left-1 bg-[var(--vertical-accent)] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-snug group-hover:text-[var(--vertical-accent-light)] transition-colors">
                          {game.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {game.matchReason}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {game.bgg_rating != null && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {game.bgg_rating.toFixed(1)}
                            </span>
                          )}
                          {game.min_players != null && game.max_players != null && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {game.min_players}-{game.max_players}
                            </span>
                          )}
                          {game.play_time_min != null && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {game.play_time_min}-{game.play_time_max}m
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[var(--vertical-accent)] transition-colors shrink-0 self-center" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl());
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--vertical-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Share Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
