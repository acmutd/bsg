// apps/web/app/privacy/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | BSG",
  description:
    "Privacy policy for BSG — the collaborative LeetCode extension by ACM UTD.",
};

const SECTION = "space-y-3";
const H2 = "text-xl sm:text-2xl font-semibold text-white pt-4";
const P = "text-white/70 text-sm sm:text-base leading-relaxed";
const LI = "text-white/70 text-sm sm:text-base leading-relaxed list-disc ml-6";

export default function PrivacyPage() {
  return (
    <div className="w-full flex flex-col text-white">
      <div className="fixed inset-0 -z-10 bg-[#0a0a0a]" />

      <div className="w-full max-w-3xl mx-auto px-6 sm:px-8 py-12 sm:py-16 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            Privacy Policy
          </h1>
          <p className="text-white/50 text-sm">Effective date: July 21, 2026</p>
          <p className={P}>
            BSG (&quot;Binary Search Gang&quot;) is a browser extension and web
            application built by ACM at UT Dallas that lets you solve LeetCode
            problems together with friends in private rooms. This policy
            explains what data we collect, why we collect it, and how it is
            handled.
          </p>
        </header>

        <section className={SECTION}>
          <h2 className={H2}>Information We Collect</h2>

          <h3 className="text-lg font-medium text-white/90 pt-2">
            Account information
          </h3>
          <p className={P}>
            When you sign in with your Google account, we receive your name,
            email address, and profile picture through Google authentication.
            We use this to create your BSG account, display your handle and
            photo to other members of your room, and associate your activity
            with your profile.
          </p>

          <h3 className="text-lg font-medium text-white/90 pt-2">
            Authentication tokens
          </h3>
          <p className={P}>
            Signing in issues an authentication token (via Google OAuth and
            Firebase Authentication) that the extension stores and sends with
            requests to keep you signed in and verify your identity. Tokens
            are transmitted only to Google and to our servers, and are never
            shared with anyone else.
          </p>

          <h3 className="text-lg font-medium text-white/90 pt-2">
            Activity within BSG
          </h3>
          <ul className="space-y-1">
            <li className={LI}>
              Rooms you create or join, and the members in them
            </li>
            <li className={LI}>
              Problems attempted, submission results, scores, and leaderboard
              rankings during rounds
            </li>
            <li className={LI}>
              Chat messages you send inside a room, so they can be delivered to
              other room members
            </li>
          </ul>

          <h3 className="text-lg font-medium text-white/90 pt-2">
            LeetCode page content
          </h3>
          <p className={P}>
            The extension runs only on LeetCode problem pages
            (leetcode.com/problems/*). It reads the page to detect which
            problem you are viewing and the outcome of your submissions so
            that rounds, scoring, and statistics work. It does not read or
            collect content from any other website.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={H2}>What We Do Not Collect</h2>
          <ul className="space-y-1">
            <li className={LI}>
              Passwords — authentication is handled entirely by Google; we
              never see or store your password
            </li>
            <li className={LI}>
              Keystrokes, mouse movement, or general browsing history
            </li>
            <li className={LI}>
              Content from websites other than LeetCode problem pages
            </li>
          </ul>
        </section>

        <section className={SECTION}>
          <h2 className={H2}>How We Use Your Information</h2>
          <p className={P}>
            Your data is used only to operate BSG: authenticating you, running
            rooms and rounds, delivering chat, computing scores and
            statistics, and showing leaderboards. We do not sell your data, we
            do not share it with third parties for advertising, and we do not
            use it for any purpose unrelated to the features described above.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={H2}>Storage and Third-Party Services</h2>
          <p className={P}>
            Authentication is provided by Google (Firebase Authentication).
            Your account information and activity are stored on servers
            operated by us. Data is transmitted over encrypted connections
            (HTTPS).
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={H2}>Data Retention and Deletion</h2>
          <p className={P}>
            We retain your account information and activity for as long as
            your account exists. You may request deletion of your account and
            associated data at any time by contacting us, and we will remove
            it within a reasonable period.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={H2}>Changes to This Policy</h2>
          <p className={P}>
            We may update this policy as BSG evolves. Material changes will be
            reflected on this page with an updated effective date.
          </p>
        </section>

        <section className={SECTION}>
          <h2 className={H2}>Contact Us</h2>
          <p className={P}>
            BSG is an open-source project by ACM at UT Dallas. For questions
            or data deletion requests, reach out through our{" "}
            <a
              href="https://github.com/acmutd/bsg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#63AB1C] hover:underline"
            >
              GitHub repository
            </a>{" "}
            or the{" "}
            <a
              href="https://acmutd.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#63AB1C] hover:underline"
            >
              ACM UTD website
            </a>
            .
          </p>
        </section>

        <footer className="pt-8">
          <div className="w-full border-t border-white/20" />
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm tracking-wider font-extrabold">BSG</p>
            <Link
              href="/"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Back to home
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
