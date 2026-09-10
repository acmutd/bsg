"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

const EXTENSION_URL = "https://chromewebstore.google.com/detail/your-extension-id-here";

export default function LandingPage() {
  return (
    <div className="w-full flex flex-col">
      {/* ================= HERO ================= */}
      <section className="relative w-full min-h-[calc(100vh-72px)] flex items-center px-4 sm:px-6 lg:px-12 pb-16">
        <div className="mx-auto w-full max-w-6xl grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-7">
            <p className="reveal eyebrow flex items-center gap-3" style={{ "--i": 0 } as React.CSSProperties}>
              <span className="h-px w-8 bg-signal/60" />
              ACM UTD · Chrome extension
            </p>

            <h1
              className="reveal display text-glow text-[clamp(2.75rem,7.5vw,6rem)]"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Conquer LeetCode
              <br />
              <span className="text-signal-gradient">together.</span>
            </h1>

            <p
              className="reveal max-w-xl text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-foreground/65"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              Solve LeetCode problems with friends in private rooms. Chat live,
              race the leaderboard, and level up your coding skills together.
            </p>

            <div
              className="reveal flex flex-wrap items-center gap-3 pt-1"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              <Link
                href={EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-signal inline-flex h-12 items-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold"
              >
                Add to Chrome
                <span aria-hidden="true" className="font-mono text-base leading-none">→</span>
              </Link>
              <a
                href="#three-columns"
                className="btn-ghost inline-flex h-12 items-center rounded-full px-6 text-[0.95rem] font-medium"
              >
                See how it works
              </a>
            </div>

            <ul
              className="reveal flex flex-wrap gap-x-6 gap-y-2 pt-2 font-mono text-xs text-foreground/45"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <li>Private rooms</li>
              <li>Live leaderboard</li>
              <li>Topic + difficulty filters</li>
            </ul>
          </div>

          <div className="reveal lg:justify-self-end w-full max-w-md" style={{ "--i": 3 } as React.CSSProperties}>
            <RoomMock />
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="three-columns"
        className="w-full scroll-mt-24 py-20 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-16"
      >
        <Reveal className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-4" style={{ "--i": 0 } as React.CSSProperties}>
            <p className="eyebrow">What it does</p>
            <h2 className="display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold">
              Meet your collaborative coding extension
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-foreground/60">
              An extension to solve LeetCode problems with friends in private
              rooms with real-time chat and topic filters built in.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" style={{ "--i": 1 } as React.CSSProperties}>
            <Feature
              title="Create Rooms"
              desc="Set topics, difficulty, and room name built for your team."
              icon="/create-rooms.svg"
            />
            <Feature
              title="Collaborative Chat"
              desc="Chat with your group as you code instantly."
              icon="/chat.svg"
            />
          </div>
        </Reveal>
      </section>

      {/* ================= SHOWCASE ================= */}
      <Showcase
        eyebrow="Rooms"
        title="Challenge friends."
        subtitle="Master the problem."
        text="Spin up a custom room in seconds — pick a difficulty, choose your topics, and invite others to join. It's a shared space to think out loud, solve smarter, and turn practice into progress."
        mock={<CreateRoomMock />}
      />

      <Showcase
        eyebrow="Chat"
        title="Stay in sync."
        subtitle="Solve together."
        text="Stay in sync with your teammates through built-in chat. Share quick ideas, swap hints, or celebrate breakthroughs — all without breaking focus or leaving your session."
        mock={<ChatMock />}
        flip
      />

      {/* ================= COMING SOON ================= */}
      <section
        className="w-full scroll-mt-24 pt-20 sm:pt-28 lg:pt-36 pb-16 px-4 sm:px-6 lg:px-12"
        id="coming-soon"
      >
        <Reveal className="mx-auto w-full max-w-5xl">
          <div className="text-center space-y-4 mb-12" style={{ "--i": 0 } as React.CSSProperties}>
            <p className="eyebrow">Roadmap</p>
            <h2 className="display text-[clamp(2.5rem,6vw,4.5rem)]">Coming soon</h2>
            <p className="mx-auto max-w-2xl text-foreground/60 text-base sm:text-lg">
              One web application platform. Every feature you need to level up.
              Something powerful is on the way.
            </p>
          </div>

          <div style={{ "--i": 1 } as React.CSSProperties}>
          <BrowserFrame url="app.binarysearchgang.com" tall>
            <div className="grid h-full grid-cols-12 gap-3 p-4 sm:p-6">
              <div className="col-span-12 sm:col-span-3 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="col-span-12 sm:col-span-6 space-y-3">
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="col-span-12 sm:col-span-3 space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </BrowserFrame>
          </div>
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full px-6 sm:px-8 lg:px-12 py-10">
        <div className="mx-auto max-w-6xl border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-lg font-bold tracking-tight">
            BSG<span className="text-signal">_</span>
          </p>
          <div className="flex items-center gap-6 font-mono text-xs text-foreground/50">
            <span className="hidden sm:inline">Built by ACM UTD</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================= COMPONENTS ================= */

/** Adds the `.reveal` animation to children once the block scrolls into view. */
function Reveal({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-group ${className ?? ""} ${shown ? "is-shown" : ""}`}>
      {children}
    </div>
  );
}

function Feature({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  // Writes straight to the element's style: pointer events fire every frame and
  // routing them through React state would re-render the card for a pure visual.
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      className="spotlight glass-panel group rounded-2xl p-6 transition-transform duration-500 ease-spring hover:-translate-y-1"
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-signal/25 bg-signal/10 shadow-glow-sm">
        <span
          aria-hidden="true"
          className="block h-5 w-5 bg-signal"
          style={{
            maskImage: `url(${icon})`,
            WebkitMaskImage: `url(${icon})`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground/60">{desc}</p>
    </div>
  );
}

function Showcase({
  eyebrow,
  title,
  subtitle,
  text,
  mock,
  flip = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  text: string;
  mock: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
      <Reveal
        className={`glass-panel mx-auto w-full max-w-6xl rounded-3xl px-6 sm:px-10 lg:px-14 py-10 sm:py-12 lg:py-16 grid gap-10 lg:grid-cols-2 lg:items-center ${
          flip ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="space-y-5" style={{ "--i": 0 } as React.CSSProperties}>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
            {title}
            <br />
            <span className="text-foreground/55">{subtitle}</span>
          </h3>
          <p className="max-w-lg text-base leading-relaxed text-foreground/60">{text}</p>
        </div>

        <div className="w-full" style={{ "--i": 1 } as React.CSSProperties}>
          <BrowserFrame url="leetcode.com/problems/word-search">{mock}</BrowserFrame>
        </div>
      </Reveal>
    </section>
  );
}

function BrowserFrame({
  url,
  tall = false,
  children,
}: {
  url: string;
  tall?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-bsg-dark shadow-lift">
      <div className="flex items-center gap-3 border-b border-white/10 bg-bsg-surface px-3 sm:px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal/80" />
        </div>
        <div className="mx-auto flex h-6 max-w-[70%] flex-1 items-center justify-center rounded-md bg-black/40 px-3 font-mono text-[11px] text-foreground/50 truncate">
          {url}
        </div>
        <div className="w-10" />
      </div>
      <div className={tall ? "aspect-video sm:aspect-[16/9]" : "aspect-[16/10]"}>{children}</div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.06] ${className}`} />;
}

/* ---------- Mocks (purely decorative) ---------- */

function RoomMock() {
  const rows = [
    { name: "jessica", score: 3, time: "12:04", you: false },
    { name: "you", score: 2, time: "14:31", you: true },
    { name: "arjun", score: 2, time: "15:02", you: false },
    { name: "mei", score: 1, time: "18:47", you: false },
  ];

  return (
    <div className="glass-panel animate-drift rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="eyebrow mb-1">Room · dp-grind</p>
          <p className="font-display text-lg font-semibold tracking-tight">Live leaderboard</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 font-mono text-xs text-signal">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-signal animate-pulse-dot" />
          </span>
          24:12
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li
            key={row.name}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              row.you
                ? "border-signal/40 bg-signal/10"
                : "border-white/[0.06] bg-white/[0.03]"
            }`}
          >
            <span className="font-mono text-xs text-foreground/40 w-4">{i + 1}</span>
            <span
              className={`h-7 w-7 rounded-full ${
                row.you ? "bg-signal" : "bg-gradient-to-br from-white/20 to-white/5"
              }`}
            />
            <span className={`flex-1 text-sm font-medium ${row.you ? "text-signal" : ""}`}>
              {row.name}
            </span>
            <span className="font-mono text-xs text-foreground/50">{row.time}</span>
            <span className="font-mono text-sm font-semibold">{row.score}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between font-mono text-[11px] text-foreground/45">
        <span>Problem 3 / 5 · Medium</span>
        <span className="text-signal">Accepted ✓</span>
      </div>
    </div>
  );
}

function CreateRoomMock() {
  return (
    <div className="h-full p-5 sm:p-6 flex flex-col gap-4 bg-gradient-to-b from-bsg-surface/60 to-transparent">
      <p className="font-display text-base font-semibold">Create room</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Easy", "difficulty-easy", "2"],
          ["Medium", "difficulty-medium", "2"],
          ["Hard", "difficulty-hard", "1"],
        ].map(([label, cls, n]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className={`font-mono text-[11px] ${cls}`}>{label}</p>
            <p className="font-display text-2xl font-bold">{n}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="font-mono text-[11px] text-foreground/45 mb-2">Topics</p>
        <div className="flex flex-wrap gap-1.5">
          {["Arrays", "DP", "Graphs", "Hash Table", "Two Pointers"].map((t, i) => (
            <span
              key={t}
              className={`rounded-full px-2.5 py-1 text-xs ${
                i < 2 ? "bg-signal text-primary-foreground font-medium" : "bg-white/[0.06] text-foreground/70"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-auto">
        <div className="flex items-center justify-between font-mono text-[11px] text-foreground/45 mb-2">
          <span>Duration</span>
          <span className="text-foreground">45 min</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10">
          <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-primary to-signal" />
        </div>
      </div>
    </div>
  );
}

function ChatMock() {
  const messages = [
    { from: "arjun", text: "sliding window? the constraint is 1e5", me: false },
    { from: "you", text: "yep, two pointers + hashmap of counts", me: true },
    { from: "mei", text: "got AC in 40ms 🎉", me: false },
  ];

  return (
    <div className="h-full p-5 sm:p-6 flex flex-col gap-3 bg-gradient-to-b from-bsg-surface/60 to-transparent">
      {messages.map((m) => (
        <div key={m.text} className={`flex flex-col ${m.me ? "items-end" : "items-start"}`}>
          <span className="font-mono text-[10px] text-foreground/40 mb-1">{m.from}</span>
          <div
            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
              m.me
                ? "bg-signal text-primary-foreground rounded-br-md"
                : "bg-white/[0.07] text-foreground rounded-bl-md"
            }`}
          >
            {m.text}
          </div>
        </div>
      ))}
      <div className="mt-auto flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
        <span className="flex-1 text-sm text-foreground/35">Message dp-grind…</span>
        <span className="rounded-md bg-signal/15 px-2 py-0.5 font-mono text-[10px] text-signal">↵</span>
      </div>
    </div>
  );
}
