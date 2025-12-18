"use client";
import Link from "next/link";


const LandingPage = () => {
  return (
    <div className="w-full flex flex-col items-start justify-start ">
      {/* Hero Section*/}
      <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 w-full text-white py-24 px-6 md:px-24 flex justify-center">
        <div
          className="fixed inset-0 -z-10 bg-no-repeat bg-top bg-cover"
          style={{ backgroundImage: "url('/long-background.png')" }}
        />

        <div className="relative z-10 text-center space-y-7">
          {/* <h1 className="text-3xl md:text-7xl font-extrabold text-white leading-snug md:leading-[1.2]  ">
            Conquer LeetCode Together.
          </h1> */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-snug md:leading-[1.2]">
            Conquer LeetCode Together.
          </h1>


          <div className="space-y-1">
            <p className="font-extralight text-lg text-white/70 leading-snug">
              Solve LeetCode problems with friends in private rooms.
            </p>
            <p className="font-extralight text-lg text-white/70 leading-snug">
              Chat live, collaborate, and level up your coding skills together.
            </p>
          </div>

          <Link
            href="/auth/signUp"
            // className="inline-block bg-customGreen text-white text-lg font-semibold px-8 py-4 rounded-full hover:bg-customGreen-dark transition"
          style={{ backgroundColor: "rgba(99, 171, 28)" }} // Initial transparent background
          className="inline-block text-white text-lg font-semibold px-8 py-4 rounded-full transition hover:bg-[#63AB1C]" 
          >
            Join Now
          </Link>
        </div>
      </main>



{/* Three-column section */}
<section id="three-columns" className="w-full text-white py-20 px-6 md:px-32">
  
    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-12 md:gap-24">

      {/* Left column */}
      <div className="md:w-1/2">
        <h2 className="text-2xl md:text-3xl font-semibold mb-3 leading-snug tracking-tight">
          Meet your collaborative <br /> coding extension
        </h2>
        <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-md">
          <span className="whitespace-nowrap">
            An extension to solve LeetCode problems with friends in private 
          </span>
          <br className="hidden sm:block" />
          <span className="whitespace-nowrap">
            rooms with real-time chat and topic filters built in.
          </span>
        </p>
      </div>

      {/* Middle column — CREATE ROOMS */}
      <div className="md:w-1/4 flex flex-col items-start">
        
        {/* ICON AS BACKGROUND IMAGE */}
        <div
          className="w-9 h-9 mb-3 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/create-rooms.svg')" }}
        />

        <h3 className="text-sm md:text-base font-semibold mb-2">Create Rooms</h3>
        <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-[220px]">
          <span className="whitespace-nowrap">
            Set topics, difficulty, 
          </span>
          <br className="hidden sm:block" />
          <span className="whitespace-nowrap">
            and room name built for your team.
          </span>
      
        </p>
      </div>

      {/* Right column — COLLABORATIVE CHAT */}
      <div className="md:w-1/4 flex flex-col items-start">

        {/* ICON AS BACKGROUND IMAGE */}
        <div
          className="w-10 h-10 mb-3 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/chat.svg')" }}
        />

        <h3 className="text-sm md:text-base font-semibold mb-2">Collaborative Chat</h3>
        <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-[220px]">
          Chat with your group as you code instantly.
        </p>
      </div>

    </div>
</section>


{/* Challenge Friends. Master the Problem Section */}
<section className="w-screen flex justify-center py-0 px-0 bg-transparent overflow-x-hidden">
  <div className="collab-grey-box flex flex-col md:flex-row items-center gap-16">
    {/* Left text block */}
    <div className="text-white max-w-md">
      <h3 className="text-2xl md:text-2xl font-bold mb-6 leading-snug">
        <span className="whitespace-nowrap">Challenge friends.</span>
        <br className="hidden sm:block" />
        <span className="whitespace-nowrap">Master the problem.</span>
      </h3>

      <p className="text-white/70 leading-relaxed text-[11px] md:text-sm">
        <span className="whitespace-nowrap ">Spin up a custom room in seconds —</span>
        <br className="hidden sm:block" />
        <span className="whitespace-nowrap">pick a difficulty, choose your topics, and invite others</span>
        <br className="hidden sm:block" />
        <span className="whitespace-nowrap">to join. It’s a shared space to think out loud,</span>
        <br className="hidden sm:block" />
    
        <span className="whitespace-nowrap">solve smarter, and turn practice into progress.</span>
      </p>
    </div>
        {/* Browser window */}
        <div className="w-full md:w-[1100px] md:h-[500px] bg-[#111] rounded-lg overflow-hidden border border-white/10">
          {/* URL Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a]">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            <div className="text-white/70 text-sm">https://www.leetcode.com/</div>
            <div className="w-4"></div>
          </div>
          {/* Black Section */}
          <div className="bg-[#0b0b0b] h-[400px]"></div>
        </div>
      </div>
    </section>


{/* Stay in Synch. Solve Together Seciton */}
<section className="w-screen flex justify-center py-24 px-0 bg-transparent overflow-x-hidden">
  <div className="collab-grey-box flex flex-col md:flex-row items-center gap-16">
    {/* Left text block */}
    <div className="text-white max-w-md">
      <h3 className="text-2xl md:text-2xl font-bold mb-6 leading-snug">
        <span className="whitespace-nowrap">Stay in Sync.</span>
        <br className="hidden sm:block" />
        <span className="whitespace-nowrap">Solve together.</span>
      </h3>

      <p className="text-white/70 leading-relaxed text-[11px] md:text-sm">
        <span className="whitespace-nowrap ">Stay in sync with your teammates through built —</span>
        <br className="hidden sm:block" />
        <span className="whitespace-nowrap">in chat. Share quick ideas, swap hints, or</span>
        <br className="hidden sm:block" />
        <span className="whitespace-nowrap">celebrate breakthroughs — all without </span>
        <br className="hidden sm:block" />
    
        <span className="whitespace-nowrap">breaking focus or leaving your session.</span>
      </p>
    </div>
        {/* Browser window */}
        <div className="w-full md:w-[1100px] md:h-[500px] bg-[#111] rounded-lg overflow-hidden border border-white/10">
          {/* URL Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a]">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            <div className="text-white/70 text-sm">https://www.leetcode.com/</div>
            <div className="w-4"></div>
          </div>
          {/* Black Section */}
          <div className="bg-[#0b0b0b] h-[400px]"></div>
        </div>
      </div>
    </section>


{/* Coming Soon Section */}
<section
  id="coming-soon"
  className="w-full flex flex-col items-center justify-centerpt-32 pb-8 px-6 md:px-12 text-white relative overflow-hidden"
>
  {/* Title */}
  <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
    <div className="w-full md:w-[1100px] mx-auto text-center">
      <h2>Coming Soon</h2>
    </div>
  </h2>

  <p className="text-white/70 text-sm md:text-base mb-12 text-center whitespace-nowrap">
    One web application platform. Every feature you need to level up. Something
    powerful is on the way.
  </p>

  {/* Browser Mockup Container */}
  <div className="w-full max-w-5xl bg-[#111] rounded-xl overflow-hidden border border-white/10 shadow-xl">
    {/* Browser Top Bar */}
    <div className="flex items-center justify-between px-4 py-3 bg-[#2b2b2b] border-b border-white/10">
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500"></span>
        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
        <span className="w-3 h-3 rounded-full bg-green-500"></span>
      </div>

      <div className="w-4"></div>
    </div>

    {/* Black fullscreen preview area */}
    <div className="bg-[#0a0a0a] h-[360px] md:h-[480px]"></div>
  </div>
</section>


         
<section className="w-full px-10 py-10 text-white">
  {/* Full-width divider line */}
  <div className="w-full border-t border-white/20"></div>
  {/* Left-aligned BSG label */}
  <p className="text-s tracking-wider text-white font-extrabold mt-3 ml-8">
    BSG
  </p>
</section>

    </div>
  );
};


export default LandingPage;
