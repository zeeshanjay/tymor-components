import React from "react";

const columns = [
  { y: "8vh", images: ["holobox.png", "img.png", "newimg.png"] },
  { y: "-12vh", images: ["img2.png", "holobox3d.png", "leo_holobox1.jpg"] },
  { y: "4vh", images: ["newimg.png", "leo_holobox.jpg", "img.png"] },
  { y: "-10vh", images: ["holoboxing.png", "leo_holobox1.jpg", "holobox3d.png"] },
  { y: "12vh", images: ["leo_holobox.jpg", "img2.png", "holobox.png"] },
];

function HeroCard({ src }) {
  return (
    <div className="image-card group relative h-72 w-64 shrink-0 overflow-hidden rounded-[1.65rem] border border-white/75 bg-white shadow-[0_24px_62px_rgba(0,0,0,0.26)] transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] hover:z-30 hover:border-white hover:shadow-[0_34px_105px_rgba(255,255,255,0.70)]">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover grayscale-[35%] saturate-[0.9] brightness-[0.74] transition duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0 group-hover:saturate-125 group-hover:brightness-100"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/20 opacity-70 transition group-hover:opacity-20" />
      <div className="absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.55),transparent_48%)]" />
      <div className="absolute left-5 top-5 h-2.5 w-2.5 rounded-full bg-white/70 opacity-0 shadow-[0_0_22px_rgba(255,255,255,0.8)] transition group-hover:opacity-100" />
    </div>
  );
}

function CardColumn({ images }) {
  return (
    <div
      className="group/column relative flex h-[1060px] w-64 overflow-visible"
      style={{ transform: "translateZ(0)" }}
    >
      <div
        className="card-track flex flex-col gap-5 will-change-transform"
        style={{ transform: "translateZ(0)" }}
      >
        {images.map((image, cardIndex) => (
          <HeroCard key={`${image}-${cardIndex}`} src={image} />
        ))}
      </div>
    </div>
  );
}

export default function LuxuryHeroBackground() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#f6f3ee] text-[#111111]">
      <style>{`
        .scene {
          perspective: 1400px;
          transform-style: preserve-3d;
        }
        .card-track {
          transform-style: preserve-3d;
          will-change: transform;
        }
        .image-card {
          transform: translate3d(0,0,0) rotateX(0deg);
          will-change: transform, box-shadow, filter;
        }
        .image-card:hover {
          transform: translate3d(0,-12px,110px) rotateX(2deg) rotateY(-4deg) scale(1.055);
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),transparent_42%),linear-gradient(180deg,#fffaf2_0%,#f2eee8_48%,#dfd8ce_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(246,243,238,0.20)_42%,rgba(0,0,0,0.20)_100%)]" />
      <div className="absolute inset-0 bg-black/10" />

      <nav className="absolute left-0 right-0 top-0 z-30 px-6 py-7 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="index.html" className="text-[13px] font-medium uppercase tracking-[0.28em] text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]">
            Holobox
          </a>
          <div className="hidden items-center gap-8 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-[11px] font-medium uppercase tracking-[0.20em] text-white shadow-2xl shadow-black/10 backdrop-blur-md md:flex">
            <a href="index.html" className="transition hover:text-white/70">Home</a>
            <a href="logos.html" className="transition hover:text-white/70">Identity</a>
            <a href="typography.html" className="transition hover:text-white/70">System</a>
            <a href="#" className="transition hover:text-white/70">Contact</a>
          </div>
          <a href="#" className="rounded-full border border-white/25 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.20em] text-white shadow-2xl shadow-black/10 backdrop-blur-md transition hover:bg-white hover:text-black">
            Start
          </a>
        </div>
      </nav>

      <div className="scene absolute left-1/2 top-1/2 h-[118vh] w-[118vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 rotate-x-[57deg] rotate-z-[-13deg] gap-5 opacity-95">
          {columns.map((column, index) => (
            <div
              key={index}
              style={{ transform: `translate3d(0, ${column.y}, 0)` }}
            >
              <CardColumn {...column} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-24 text-center lg:px-10">
        <div className="max-w-6xl">
          <h1 className="text-balance text-5xl font-extralight uppercase tracking-[0.42em] text-white drop-shadow-[0_8px_35px_rgba(0,0,0,0.65)] md:text-7xl lg:text-8xl">
            Powerful
          </h1>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/40 to-transparent" />
    </section>
  );
}
