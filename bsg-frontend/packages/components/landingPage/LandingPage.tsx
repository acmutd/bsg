"use client";

import Link from "next/link";

const GREY = {
  sectionPx: "px-4 sm:px-6 lg:px-20",

  sectionPy: "py-10 sm:py-14 lg:py-16",

  cardWidth: "w-full max-w-[1400px]",

  cardPadding: "px-5 sm:px-8 lg:px-12 py-7 sm:py-9 lg:py-12",

  cardGap: "gap-6 sm:gap-8 xl:gap-10",

  textSpacing: "space-y-4 sm:space-y-5",

  mockupMaxW: "max-w-[900px] xl:max-w-[760px]",

  mockupAspect: "aspect-[16/9] sm:aspect-[16/10] xl:aspect-[20/13]",

  mockupAlign: "justify-center",

  textCol: "w-full xl:w-[42%] 2xl:w-[40%]",
  mockupCol: "w-full xl:w-[58%] 2xl:w-[60%]",
} as const;

export default function LandingPage() {
  return (
    <div className="w-full flex flex-col">
      {/* ================= HERO ================= */}
      <main className="relative min-h-screen flex flex-col items-center justify-center text-white px-4 sm:px-6 lg:px-12">
<div
  className="
    fixed inset-0 -z-10
    bg-cover bg-top
    transition-[transform,background-position] duration-500 ease-out
    xl:scale-[1.08] xl:origin-top-right
    xl:bg-[position:60%_0%]
  "
  style={{ backgroundImage: "url('/long-background.png')" }}
/>


        <div className="max-w-5xl text-center space-y-6 sm:space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight whitespace-nowrap">
            Conquer LeetCode Together.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-extralight text-white/70 leading-relaxed px-4">
            Solve LeetCode problems with friends in private rooms. Chat live,
            collaborate, and level up your coding skills together.
          </p>

          <div className="pt-2 sm:pt-4">
            <Link
              href="https://chromewebstore.google.com/detail/your-extension-id-here"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-[#63AB1C] text-white text-base sm:text-lg font-semibold hover:scale-105 transition-all duration-200"
            >
              Join Now
            </Link>
          </div>
        </div>
      </main>

      {/* ================= THREE COLUMNS ================= */}
      <section
        id="three-columns"
        className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-16 xl:px-32 text-white"
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:justify-between lg:items-end gap-8 sm:gap-10 lg:gap-16 xl:gap-24">
          <div className="lg:w-1/2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 leading-tight tracking-tight">
              Meet your collaborative <br className="hidden sm:block" />
              coding extension
            </h2>
            <p className="text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
              An extension to solve LeetCode problems with friends in private
              rooms with real-time chat and topic filters built in.
            </p>
          </div>

          <div className="lg:w-1/2 flex flex-col sm:flex-row gap-8 sm:gap-10 lg:gap-12">
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
        </div>
      </section>

      {/* ================= GREY BOX SECTIONS ================= */}
      <GreySection
        title="Challenge friends."
        subtitle="Master the problem."
        text="Spin up a custom room in seconds — pick a difficulty, choose your topics, and invite others to join. It's a shared space to think out loud, solve smarter, and turn practice into progress."
      />

      <GreySection
        title="Stay in Sync."
        subtitle="Solve together."
        text="Stay in sync with your teammates through built-in chat. Share quick ideas, swap hints, or celebrate breakthroughs — all without breaking focus or leaving your session."
      />

      {/* ================= COMING SOON ================= */}
      <section
        className="w-full flex flex-col items-center justify-center pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 lg:px-12 text-white"
        id="coming-soon"
      >
        <div className="w-full max-w-5xl mx-auto text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4">
            Coming Soon
          </h2>
          <p className="text-white/70 text-sm sm:text-base md:text-lg px-4">
            One web application platform. Every feature you need to level up. Something powerful is on the way.
          </p>
        </div>

        <div className="w-full max-w-6xl xl:max-w-5xl bg-[#111] rounded-xl overflow-hidden border border-white/10 shadow-xl">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#2a2a2a] border-b border-white/10">
            <div className="flex gap-1.5 sm:gap-2">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
            </div>
            <div className="w-4" />
          </div>

          {/* Browser ratio */}
          <div className="bg-[#0a0a0a] aspect-video sm:aspect-[16/10] lg:aspect-video" />
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full px-6 sm:px-8 md:px-10 py-8 sm:py-10 text-white">
        <div className="w-full border-t border-white/20" />
        <p className="text-sm sm:text-base tracking-wider font-extrabold mt-3 ml-4 sm:ml-8">
          BSG
        </p>
      </footer>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Feature({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-start">
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 mb-3 sm:mb-4 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${icon})` }}
      />
      <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
      <p className="text-white/60 text-sm sm:text-base leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function GreySection({
  title,
  subtitle,
  text,
}: {
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <section className={`w-full flex justify-center bg-transparent ${GREY.sectionPx} ${GREY.sectionPy}`}>
      <div
        className={[
          "lp-collab-grey-box",
          GREY.cardWidth,
          "mx-auto",

          "flex flex-col xl:flex-row",

          "items-start xl:items-center",

          GREY.cardPadding,
          GREY.cardGap,

          "overflow-hidden",
        ].join(" ")}
      >
        {/* TEXT BLOCK */}
        <div className={["text-white", GREY.textCol, GREY.textSpacing].join(" ")}>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            {title}
            <br />
            {subtitle}
          </h3>

          <p className="text-white/70 leading-relaxed text-sm sm:text-base">
            {text}
          </p>
        </div>

        {/* MOCKUP BLOCK */}
        <div className={[GREY.mockupCol, "flex items-center", GREY.mockupAlign].join(" ")}>
          <div className={["w-full", GREY.mockupMaxW].join(" ")}>
            <div className="w-full bg-[#111] rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <div className="flex items-center justify-between px-3 lg:px-4 py-2 bg-[#2a2a2a]">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-white/70 text-xs lg:text-sm truncate px-2">
                  https://www.leetcode.com/
                </div>
                <div className="w-4" />
              </div>

              <div className={["bg-[#0b0b0b]", GREY.mockupAspect].join(" ")} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
