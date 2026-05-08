import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  motion, useScroll, useTransform, useInView,
  useMotionValue, useSpring, AnimatePresence, animate,
} from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
   TYMOR / HOME — $100K LUXURY AGENCY WIREFRAME v.08
   ─────────────────────────────────────────────────────────────────
   PREMIUM FEATURES:
   ✦ Custom magnetic cursor (ring + dot)
   ✦ Character-split headline reveals (per-char, not per-word)
   ✦ Clip-path wipe reveals (inset bottom-to-top)
   ✦ Noise / grain SVG texture overlay
   ✦ Velocity-aware scroll parallax
   ✦ Magnetic buttons (cursor-attracted translate)
   ✦ Video reel placeholder w/ circular SVG progress ring
   ✦ Bento solutions grid (variable cell spans)
   ✦ Testimonial single-quote slider w/ prev/next
   ✦ Awards / logo ticker strip
   ✦ Section progress sidebar (right edge)
   ✦ Full-bleed stacking case cards
   ✦ Horizontal scroll process timeline
   ✦ Count-up impact stats
   ✦ Dual-row marquee testimonials
   ✦ Boot sequence loader (terminal style)
   ✦ Scroll progress bar (top edge, green)
   ✦ Viewport ruler (top, with tick marks)
   ✦ All skeleton bars: dark-gray fills, clearly visible on #050505
   ═══════════════════════════════════════════════════════════════════ */

/* ─────────────────── GLOBAL CSS ─────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600;700;900&family=Geist+Mono:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; }
html { scroll-behavior: auto; cursor: none; }
body { cursor: none; }
button, a { cursor: none; }

.font-geist  { font-family: 'Geist', ui-sans-serif, system-ui, sans-serif; }
.font-mono   { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; }

/* ── SKELETON FILL SYSTEM ── */
/* Key principle: fills must be LIGHTER than #050505 to be visible */
.sk-hv  { background: #1a1d28; border-radius: 3px; }   /* headline heavy  */
.sk-md  { background: #111318; border-radius: 2px; }   /* mid / sub       */
.sk-ft  { background: #0c0e12; border-radius: 2px; }   /* faint / body    */
.sk-gn  { background: rgba(0,255,148,0.20); border-radius: 2px; } /* green accent */

@keyframes skshimmer {
  0%   { background-position: -400% 0 }
  100% { background-position:  400% 0 }
}
.sk-hv { background: linear-gradient(90deg,#1a1d28 0%,#1a1d28 30%,#272c3d 50%,#1a1d28 70%,#1a1d28 100%); background-size:400% 100%; animation:skshimmer 3s ease-in-out infinite; }
.sk-md { background: linear-gradient(90deg,#111318 0%,#111318 30%,#1a1e2a 50%,#111318 70%,#111318 100%); background-size:400% 100%; animation:skshimmer 3.5s ease-in-out infinite .3s; }
.sk-ft { background: linear-gradient(90deg,#0c0e12 0%,#0c0e12 30%,#131620 50%,#0c0e12 70%,#0c0e12 100%); background-size:400% 100%; animation:skshimmer 4s ease-in-out infinite .6s; }
.sk-gn { background: linear-gradient(90deg,rgba(0,255,148,.18) 0%,rgba(0,255,148,.18) 30%,rgba(0,255,148,.48) 50%,rgba(0,255,148,.18) 70%,rgba(0,255,148,.18) 100%); background-size:400% 100%; animation:skshimmer 2.5s ease-in-out infinite; }

/* ── WIREFRAME BOX TYPES ── */
.wf-border     { border: 1px solid rgba(255,255,255,0.32); }
.wf-border-sm  { border: 1px solid rgba(255,255,255,0.14); }
.wf-border-g   { border: 1px solid rgba(0,255,148,0.50); }
.wf-dash {
  background-image:
    linear-gradient(90deg,rgba(255,255,255,.38) 50%,transparent 0) top/14px 1px repeat-x,
    linear-gradient(90deg,rgba(255,255,255,.38) 50%,transparent 0) bottom/14px 1px repeat-x,
    linear-gradient(0deg, rgba(255,255,255,.38) 50%,transparent 0) left/1px 14px  repeat-y,
    linear-gradient(0deg, rgba(255,255,255,.38) 50%,transparent 0) right/1px 14px repeat-y;
}
.wf-cross {
  background-image:
    linear-gradient(135deg,transparent calc(50% - .6px),rgba(255,255,255,.25) calc(50% - .6px) calc(50% + .6px),transparent calc(50% + .6px)),
    linear-gradient(45deg, transparent calc(50% - .6px),rgba(255,255,255,.25) calc(50% - .6px) calc(50% + .6px),transparent calc(50% + .6px));
}

/* ── GRID OVERLAYS ── */
.wf-grid { background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px); background-size:64px 64px; }
.wf-grid-f { background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px); background-size:16px 16px; }

/* ── NOISE GRAIN ── */
.grain::after {
  content: '';
  position: fixed;
  inset: -200%;
  width: 400%;
  height: 400%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  opacity: .55;
  pointer-events: none;
  z-index: 2;
  animation: grain-drift 8s steps(2) infinite;
}
@keyframes grain-drift {
  0%,100%{transform:translate(0,0)}
  10%{transform:translate(-2%,-1%)}
  20%{transform:translate(1%,2%)}
  30%{transform:translate(-1%,1%)}
  40%{transform:translate(2%,-2%)}
  50%{transform:translate(-1%,-1%)}
  60%{transform:translate(1%,1%)}
  70%{transform:translate(-2%,2%)}
  80%{transform:translate(2%,1%)}
  90%{transform:translate(-1%,-2%)}
}

/* ── MISC ANIMATIONS ── */
@keyframes scan       { 0%{transform:translateY(-40%);opacity:0} 10%,90%{opacity:1} 100%{transform:translateY(140%);opacity:0} }
.scanline { animation:scan 4.5s ease-in-out infinite; }
@keyframes pulsedot   { 0%,100%{opacity:1} 50%{opacity:.25} }
.pdot     { animation:pulsedot 2.4s ease-in-out infinite; }
@keyframes marquee    { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.mq       { animation:marquee linear infinite; }
@keyframes loadbar    { from{width:0} to{width:100%} }
@keyframes blink      { 0%,49%{opacity:1} 50%,100%{opacity:0} }
.blink    { animation:blink 1s steps(1) infinite; }
@keyframes rotateslow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
.rotslow  { animation:rotateslow 18s linear infinite; }

/* ruler */
.ruler-h { background:repeating-linear-gradient(90deg,rgba(255,255,255,.48) 0 1px,transparent 1px 63px,rgba(255,255,255,.22) 63px 64px,transparent 64px 128px); }

::selection { background:rgba(0,255,148,.28); color:#fff; }
`;

/* ─────────────────── COLOUR TOKENS ─────────────────── */
const C = {
  bg:    "#050505",
  green: "#00FF94",
  skH:   "#1a1d28",
  skM:   "#111318",
  skF:   "#0c0e12",
  bStr:  "rgba(255,255,255,0.32)",
  bSoft: "rgba(255,255,255,0.12)",
  label: "rgba(255,255,255,0.72)",
  dim:   "rgba(255,255,255,0.40)",
};

/* ─────────────────── TINY PRIMITIVES ─────────────────── */
const HR  = ({ c="", s={} }) => <div className={`h-px w-full ${c}`} style={{ background:"rgba(255,255,255,0.12)", ...s }} />;
const GD  = ({ c="" }) => (
  <span className={`relative inline-flex h-1.5 w-1.5 shrink-0 ${c}`}>
    <span className="absolute inset-0 rounded-full bg-[#00FF94] pdot" />
    <span className="absolute -inset-1 rounded-full bg-[#00FF94]/30 blur-[5px]" />
  </span>
);
const Mono = ({ ch, c="" }) => <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${c}`} style={{ color:C.label }}>{ch}</span>;
const Tag  = ({ ch, g=false }) => (
  <span className={`inline-flex items-center px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] uppercase`}
    style={{ border:`1px solid ${g ? "rgba(0,255,148,0.5)" : "rgba(255,255,255,0.28)"}`, color:g?"#00FF94":"rgba(255,255,255,0.65)" }}>
    {ch}
  </span>
);
const DimRule = ({ v, c="" }) => (
  <div className={`flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] ${c}`} style={{ color:"rgba(255,255,255,0.40)" }}>
    <span>◀</span><div className="flex-1 h-px border-t border-dashed border-white/20" />
    <span className="px-2 whitespace-nowrap" style={{ background:C.bg }}>{v}</span>
    <div className="flex-1 h-px border-t border-dashed border-white/20" /><span>▶</span>
  </div>
);

/* Skeleton bar components */
const SkH = ({ w="100%", h="20px", c="" }) => <div className={`sk-hv ${c}`} style={{ width:w, height:h }} />;
const SkM = ({ w="100%", h="14px", c="" }) => <div className={`sk-md ${c}`} style={{ width:w, height:h }} />;
const SkF = ({ w="100%", h="11px", c="" }) => <div className={`sk-ft ${c}`} style={{ width:w, height:h }} />;
const SkG = ({ w="140px", h="26px", c="" }) => <div className={`sk-gn ${c}`} style={{ width:w, height:h }} />;

const TextBlock = ({ lines=3, widths, size="f", gap=10, c="" }) => {
  const W = widths || ["100%","90%","68%","95%","72%"];
  const Comp = size==="h"?SkH:size==="m"?SkM:SkF;
  return (
    <div className={`flex flex-col ${c}`} style={{ gap }}>
      {Array.from({length:lines}).map((_,i)=><Comp key={i} w={W[i%W.length]} />)}
    </div>
  );
};

const BigHead = ({ l1="92%", l2="60%", h="clamp(48px,8.5vw,136px)" }) => (
  <div className="flex flex-col gap-4">
    <SkH w={l1} h={h} />
    <SkM w={l2} h={h} />
  </div>
);

/* Corner brackets */
const Bracks = ({ op=0.45 }) => {
  const s = `rgba(255,255,255,${op})`;
  const p = [["top-0 left-0","borderTop","borderLeft"],["top-0 right-0","borderTop","borderRight"],
             ["bottom-0 left-0","borderBottom","borderLeft"],["bottom-0 right-0","borderBottom","borderRight"]];
  return <>{p.map(([pos,b1,b2],i)=>(
    <div key={i} className={`absolute h-4 w-4 ${pos}`} style={{ [b1]:`1px solid ${s}`, [b2]:`1px solid ${s}` }} />
  ))}</>;
};

/* Section marker strip */
const SecMark = ({ i, name, dim="" }) => (
  <div className="relative h-px w-full" style={{ background:"rgba(255,255,255,0.20)" }}>
    {[0,1].map(side=>(
      <div key={side} className={`absolute top-1/2 -translate-y-1/2 ${side===0?"left-0 -translate-x-1/2":"right-0 translate-x-1/2"} h-3 w-3`}>
        <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2" style={{ background:"rgba(255,255,255,0.38)" }} />
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background:"rgba(255,255,255,0.38)" }} />
      </div>
    ))}
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-4" style={{ background:C.bg }}>
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase whitespace-nowrap" style={{ color:C.label }}>
        <span style={{ color:C.green }}>§{i}</span>
        <span style={{ color:"rgba(255,255,255,0.25)" }}>  ─────  </span>
        {name}
        {dim && <span style={{ color:"rgba(255,255,255,0.32)" }}>  /  {dim}</span>}
      </span>
    </div>
  </div>
);

/* Wireframe button — magnetic */
function WfBtn({ label="ACTION", variant="primary", large=false }) {
  const ref = useRef(null);
  const bx = useMotionValue(0), by = useMotionValue(0);
  const sx = useSpring(bx,{stiffness:400,damping:28});
  const sy = useSpring(by,{stiffness:400,damping:28});

  const onMove = e => {
    if(!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left+r.width/2);
    const dy = e.clientY - (r.top+r.height/2);
    bx.set(dx*.35); by.set(dy*.35);
  };
  const onLeave = () => { bx.set(0); by.set(0); };

  const isPrimary = variant==="primary";
  const py = large ? "py-4" : "py-2.5";
  const px = large ? "px-8" : "px-5";
  const txt = large ? "text-[11px]" : "text-[10px]";

  return (
    <motion.button ref={ref} style={{ x:sx, y:sy }} onMouseMove={onMove} onMouseLeave={onLeave}
      whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
      className={`relative inline-flex items-center gap-2.5 ${px} ${py} rounded-full font-mono ${txt} uppercase tracking-[0.2em] transition-all duration-300`}
      style={{ border:`1px solid ${isPrimary?"rgba(0,255,148,0.55)":"rgba(255,255,255,0.22)"}`, color:isPrimary?C.green:"rgba(255,255,255,0.65)", background:isPrimary?"rgba(0,255,148,0.05)":"transparent" }}>
      [{label}] <span>→</span>
    </motion.button>
  );
}

/* Media placeholder */
const Media = ({ id="IMG", dim="1920×1080", role="media", label="MEDIA SLOT", c="", inner="" }) => (
  <div className={`relative wf-dash wf-cross ${c}`} style={{ background:"#070910" }}>
    <div className="absolute top-2.5 left-3 font-mono text-[9px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,0.55)" }}>{id}</div>
    <div className="absolute top-2.5 right-3 font-mono text-[9px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,0.40)" }}>{dim}</div>
    <div className="absolute bottom-2.5 left-3 font-mono text-[9px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,0.30)" }}>role="{role}"</div>
    <div className="absolute bottom-2.5 right-3 font-mono text-[9px] tracking-[0.2em]" style={{ color:"rgba(0,255,148,0.65)" }}>[ {label} ]</div>
    <div className="absolute inset-0 flex items-center justify-center">{inner || (
      <div className="text-center">
        <div className="h-9 w-9 mx-auto wf-border rounded-sm flex items-center justify-center mb-2"><div className="h-4 w-4 wf-cross" /></div>
        <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,0.30)" }}>[ PLACEHOLDER ]</span>
      </div>
    )}</div>
  </div>
);

/* ─────────────────── CUSTOM CURSOR ─────────────────── */
function Cursor() {
  const cx = useMotionValue(-100), cy = useMotionValue(-100);
  const dx = useSpring(cx,{stiffness:200,damping:22});
  const dy = useSpring(cy,{stiffness:200,damping:22});
  const [hov, setHov] = useState(false);

  useEffect(() => {
    const m = e => { cx.set(e.clientX); cy.set(e.clientY); };
    const ov = () => setHov(true);
    const ou = () => setHov(false);
    window.addEventListener("mousemove", m);
    document.querySelectorAll("button,a,[data-cursor]").forEach(el => { el.addEventListener("mouseenter",ov); el.addEventListener("mouseleave",ou); });
    return () => window.removeEventListener("mousemove", m);
  }, []);

  return (
    <>
      {/* ring */}
      <motion.div style={{ x:dx, y:dy, translateX:"-50%", translateY:"-50%" }}
        animate={{ width:hov?48:28, height:hov?48:28, borderColor:hov?C.green:"rgba(255,255,255,0.6)", backgroundColor:hov?"rgba(0,255,148,0.08)":"transparent" }}
        transition={{ duration:.18 }}
        className="fixed top-0 left-0 z-[999] rounded-full pointer-events-none"
        style={{ border:"1px solid rgba(255,255,255,0.6)", mixBlendMode:"difference" }} />
      {/* dot */}
      <motion.div style={{ x:cx, y:cy, translateX:"-50%", translateY:"-50%", width:5, height:5 }}
        className="fixed top-0 left-0 z-[999] rounded-full bg-[#00FF94] pointer-events-none"
        style={{ boxShadow:"0 0 8px rgba(0,255,148,0.8)" }} />
    </>
  );
}

/* ─────────────────── SCROLL PROGRESS BAR ─────────────────── */
function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress,{stiffness:200,damping:30});
  return (
    <motion.div style={{ scaleX }} className="fixed top-4 left-0 right-0 h-0.5 z-[70] origin-left"
      style2={{ background:C.green, boxShadow:"0 0 12px rgba(0,255,148,0.65)" }}
      style={{ background:C.green, boxShadow:"0 0 12px rgba(0,255,148,0.65)", scaleX, transformOrigin:"left" }} />
  );
}

/* ─────────────────── SECTION PROGRESS DOTS (right edge) ─────────────────── */
const SECTIONS = ["Hero","Solutions","Bento","Cases","Process","Why","Reel","Voices","Stats","CTA"];
function SideProgress() {
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll();
  useEffect(() => scrollYProgress.on("change", v => setActive(Math.floor(v * SECTIONS.length))), []);
  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3 items-end">
      {SECTIONS.map((s,i) => (
        <div key={s} className="flex items-center gap-2.5">
          <AnimatePresence>{active===i && (
            <motion.span initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}}
              className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color:"rgba(255,255,255,0.50)" }}>
              {s}
            </motion.span>
          )}</AnimatePresence>
          <motion.div animate={{ width:active===i?24:6, background:active===i?C.green:"rgba(255,255,255,0.22)" }}
            transition={{ duration:.35 }}
            className="h-px" />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── RULER ─────────────────── */
function Ruler() {
  return (
    <div className="fixed top-0 inset-x-0 h-4 z-[65] ruler-h hidden md:block"
      style={{ background:C.bg, borderBottom:"1px solid rgba(255,255,255,0.10)" }}>
      <span className="absolute left-1 font-mono text-[7px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,0.38)" }}>0px</span>
      <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[7px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,0.38)" }}>720px</span>
      <span className="absolute right-1 font-mono text-[7px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,0.38)" }}>1440px</span>
    </div>
  );
}

/* ─────────────────── BOOT LOADER ─────────────────── */
function Loader() {
  const [done, setDone] = useState(false);
  const [lines, setLines] = useState([]);
  const LOG = [
    "> initializing TYMOR / wireframe engine...",
    "> loading skeleton token system............",
    "> compiling animation choreography.........",
    "> resolving 9 layout sections..............",
    "> binding scroll-driven interactions.......",
    "> READY ✦",
  ];

  useEffect(() => {
    LOG.forEach((l,i) => setTimeout(()=>setLines(p=>[...p,l]), i*190));
    setTimeout(()=>setDone(true), LOG.length*190+500);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div initial={{opacity:1}} exit={{opacity:0}} transition={{duration:.8}}
          className="fixed inset-0 z-[100] wf-grid-f flex items-center justify-center"
          style={{ background:C.bg }}>
          <div className="w-[420px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 wf-border flex items-center justify-center">
                  <div className="h-2.5 w-2.5" style={{ background:C.green }} />
                </div>
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase" style={{ color:C.label }}>TYMOR / WIREFRAME v.08</span>
              </div>
              <span className="font-mono text-[11px] blink" style={{ color:C.green }}>_</span>
            </div>
            <div className="space-y-2 mb-6 h-[140px] overflow-hidden">
              {lines.map((l,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{duration:.3}}
                  className="font-mono text-[10px] tracking-[0.18em]"
                  style={{ color:l.includes("READY")?"#00FF94":"rgba(255,255,255,0.55)" }}>{l}
                </motion.div>
              ))}
            </div>
            <div className="h-px w-full overflow-hidden" style={{ background:"rgba(255,255,255,0.10)" }}>
              <div className="h-full" style={{ background:C.green, animation:"loadbar 1.4s ease-out forwards", boxShadow:"0 0 12px rgba(0,255,148,0.55)" }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────── NAV ─────────────────── */
function Nav() {
  return (
    <header className="fixed inset-x-0 z-50" style={{ top:16 }}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-3">
        <motion.div initial={{y:-28,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.8,ease:[.2,.8,.2,1]}}
          className="relative flex items-center justify-between px-6 py-3 rounded-full"
          style={{ border:"1px solid rgba(255,255,255,0.12)", background:"rgba(5,5,5,0.70)", backdropFilter:"blur(20px)" }}>
          <Tag ch="<Nav.Primary />" />

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 wf-border-g flex items-center justify-center">
              <div className="h-3 w-3" style={{ background:"rgba(0,255,148,0.75)" }} />
            </div>
            <SkM w="56px" h="13px" />
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8">
            {[116,98,110,124,102].map((w,i)=><SkF key={i} w={`${w}px`} h="10px" />)}
          </nav>

          <WfBtn label="BOOK_DEMO" />
        </motion.div>
      </div>
    </header>
  );
}

/* ─────────────────── §01 HERO ─────────────────── */
/* Premium: char-split headline, clip-path video BG, parallax, scroll indicator */
function CharSplit({ text, delay=0, h="clamp(48px,8.5vw,132px)" }) {
  const chars = text.split("");
  return (
    <div className="flex flex-wrap" style={{ gap:"0 8px" }}>
      {chars.map((ch,i) => (
        <div key={i} style={{ overflow:"hidden", height:h }}>
          {ch===" " ? <span style={{ display:"inline-block", width:"0.28em" }} /> :
          <motion.div
            initial={{ y:"120%", opacity:0 }}
            animate={{ y:"0%", opacity:1 }}
            transition={{ duration:.9, delay: delay + i*0.03, ease:[.2,.8,.2,1] }}
            className="sk-hv"
            style={{ width:"clamp(28px,6vw,82px)", height:h }} />
          }
        </div>
      ))}
    </div>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start start","end start"] });
  const bgy  = useTransform(scrollYProgress,[0,1],[0,-180]);
  const fade = useTransform(scrollYProgress,[0,.65],[1,0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden" style={{ paddingTop:"calc(56px + 5vh)" }}>
      {/* Fullscreen video BG placeholder */}
      <motion.div style={{ y:bgy }} className="absolute inset-0">
        <Media id="VID_HERO" dim="1920×1080" role="hero/video-bg" label="HERO VIDEO BG" c="w-full h-full" />
        <div className="absolute inset-0" style={{ background:"linear-gradient(to bottom, rgba(5,5,5,.45) 0%, rgba(5,5,5,.85) 100%)" }} />
      </motion.div>

      {/* Grid */}
      <div className="absolute inset-0 wf-grid" style={{ opacity:.50, zIndex:1 }} />
      <div className="absolute inset-0" style={{ background:"radial-gradient(ellipse 70% 60% at 50% 38%, rgba(0,255,148,.07) 0%, transparent 65%)", zIndex:1 }} />

      <motion.div style={{ opacity:fade }} className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-24">
        {/* Eyebrow */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.6}}
          className="flex items-center gap-3 mb-14">
          <GD /><Mono ch="TYMOR · Opening Sequence · §01 · Hero" /><Tag ch="v.08" g />
        </motion.div>

        {/* HEADLINE — character-split bars */}
        <div className="relative mb-4">
          <Tag ch="<H1 · char-split-reveal />" g />
        </div>
        <CharSplit text="Humanity at" delay={.3} />
        <div className="flex items-end gap-5 mt-4 mb-4">
          <CharSplit text="the Center" delay={.55} />
          {/* accent dot */}
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:1.4,type:"spring",stiffness:300}}
            className="mb-4 h-4 w-4 rounded-full flex-shrink-0"
            style={{ background:C.green, boxShadow:"0 0 28px rgba(0,255,148,.85)" }} />
        </div>
        <div className="opacity-50"><CharSplit text="of Technology" delay={.75} /></div>

        <DimRule v="H1 · 1440 × clamp(48px, 8.5vw, 132px) · char-split · stagger 30ms/char" c="mt-6 max-w-[900px]" />
        <div className="mt-1 max-w-[900px] text-center">
          <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color:"rgba(255,255,255,.30)" }}>// content: "Humanity at the Center of Technology"</span>
        </div>

        {/* Subline */}
        <div className="relative mt-14 max-w-xl">
          <Tag ch="<P · subline />" /><div className="mt-3"><TextBlock lines={3} widths={["100%","91%","62%"]} /></div>
        </div>

        {/* CTAs */}
        <div className="relative mt-10 flex items-center gap-3">
          <Tag ch="<CTAGroup · magnetic />" /><div className="flex gap-3 mt-3"><WfBtn label="BOOK_DEMO" large /><WfBtn label="EXPLORE_SOLUTIONS" variant="ghost" large /></div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2}}
          className="mt-28 flex flex-col items-center gap-3">
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase" style={{ color:"rgba(255,255,255,.35)" }}>SCROLL</span>
          <motion.div animate={{ y:[0,10,0] }} transition={{ repeat:Infinity, duration:1.6, ease:"easeInOut" }}
            className="h-10 w-px" style={{ background:"linear-gradient(to bottom, rgba(0,255,148,.7), transparent)" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─────────────────── §02 TICKER STRIP ─────────────────── */
function Ticker() {
  const items = ["AI HOLOBOX","METAHUMAN","CONVERSATIONAL AI","LIVE BEAMING","FULL-STACK IT","ENTERPRISE AI","IoT ARCHITECTURE","MANAGED SYSTEMS","DIGITAL HUMANS","AVATAR PRODUCTION"];
  const doubled = [...items,...items,...items];
  return (
    <div className="relative py-5 overflow-hidden" style={{ borderTop:"1px solid rgba(255,255,255,.14)", borderBottom:"1px solid rgba(255,255,255,.14)" }}>
      <div className="absolute inset-y-0 left-0 w-24 z-10" style={{ background:"linear-gradient(to right, #050505, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 z-10" style={{ background:"linear-gradient(to left, #050505, transparent)" }} />
      <div className="flex gap-12 mq hover:[animation-play-state:paused]" style={{ animationDuration:"55s" }}>
        {doubled.map((it,i) => (
          <div key={i} className="shrink-0 flex items-center gap-4">
            <span className="font-mono text-[10px] tracking-[0.28em] uppercase whitespace-nowrap" style={{ color:"rgba(255,255,255,.55)" }}>{it}</span>
            <div className="h-1 w-1 rounded-full" style={{ background:C.green, boxShadow:"0 0 6px rgba(0,255,148,.6)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── §03 SOLUTIONS BENTO ─────────────────── */
/* Premium: variable cell spans — Vercel / Linear style */
function SolutionsBento() {
  const cells = [
    { span:"lg:col-span-4", rows:"lg:row-span-2", label:"01", tag:"AI_HOLOBOX_TECHNOLOGY", accent:true },
    { span:"lg:col-span-4", rows:"",              label:"02", tag:"CONVERSATIONAL_AI" },
    { span:"lg:col-span-4", rows:"",              label:"03", tag:"INTEGRATION_SERVICES" },
    { span:"lg:col-span-3", rows:"",              label:"04", tag:"AVATAR_PRODUCTION" },
    { span:"lg:col-span-5", rows:"",              label:"05", tag:"MANAGED_AI_SYSTEMS" },
    { span:"lg:col-span-4", rows:"",              label:"06", tag:"SOFTWARE_DEVELOPMENT" },
    { span:"lg:col-span-4", rows:"",              label:"07", tag:"IoT_ARCHITECTURE" },
    { span:"lg:col-span-4", rows:"",              label:"08", tag:"LIVE_BEAMING" },
  ];
  return (
    <section id="solutions" className="relative py-2">
      <SecMark i="03" name="SOLUTIONS_BENTO" dim="variable-span grid · 8 cells" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-24 pb-32">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-16">
          <div>
            <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 03 / Intelligent Solutions" /></div>
            <BigHead l1="90%" l2="52%" h="clamp(38px,5.4vw,74px)" />
          </div>
          <div className="max-w-sm"><TextBlock lines={3} widths={["100%","88%","66%"]} /></div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Mono ch="// bento-grid · 12-col · variable row-span" />
          <Tag ch={`<BentoCell /> × 8`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 auto-rows-[220px]">
          {cells.map((cell,i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:24, scale:.97 }}
              whileInView={{ opacity:1, y:0, scale:1 }}
              viewport={{ once:true, margin:"-80px" }}
              transition={{ duration:.65, delay:i*.06, ease:[.2,.8,.2,1] }}
              className={`relative group ${cell.span} ${cell.rows} wf-border-sm overflow-hidden`}
              style={{ background: cell.accent?"#07091200":"#06080e" }}>
              {/* Bento fill — image if accent, skeleton if not */}
              {cell.accent
                ? <Media id="IMG_B01" dim="800×440" role="bento/hero-cell" label="HERO PRODUCT SHOT" c="absolute inset-0" />
                : <div className="absolute inset-8"><TextBlock lines={4} widths={["100%","82%","92%","65%"]} /></div>
              }
              {/* Bottom label */}
              <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between"
                style={{ background:"linear-gradient(to top, rgba(5,5,5,.92), transparent)" }}>
                <div>
                  <span className="font-mono text-[9px] tracking-[0.22em] uppercase" style={{ color:"rgba(255,255,255,.40)" }}>{cell.label}</span>
                  <div className="mt-1"><SkM w="140px" h="13px" /></div>
                </div>
                <div className="h-8 w-8 wf-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400"
                  style={{ borderColor:"rgba(0,255,148,.55)" }}>
                  <span className="font-mono text-[10px]" style={{ color:C.green }}>↗</span>
                </div>
              </div>
              {/* Green bottom seam on hover */}
              <div className="absolute inset-x-0 bottom-0 h-px transition-all duration-700"
                style={{ background:"transparent" }}
                onMouseEnter={e=>e.currentTarget.style.background=`linear-gradient(to right,transparent,${C.green},transparent)`}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"} />
            </motion.div>
          ))}
        </div>
        <DimRule v="BENTO · 1360 × fluid · 12-col auto-rows 220px" c="mt-5" />
      </div>
    </section>
  );
}

/* ─────────────────── §04 CASE STUDIES — full-bleed stacking ─────────────────── */
function CaseStudies() {
  const TOTAL = 5;
  return (
    <section id="cases" className="relative py-2">
      <SecMark i="04" name="CASE_STUDIES" dim="5 stacked · sticky-scale · clip-reveal" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-24 pb-12">
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 04 / Impact Case Studies" /></div>
            <BigHead l1="70%" l2="42%" h="clamp(38px,5.4vw,74px)" />
          </div>
          <TextBlock lines={3} widths={["100%","90%","64%"]} c="max-w-sm" />
        </div>
      </div>
      <div className="relative">
        {Array.from({length:TOTAL}).map((_,i)=><CaseCard key={i} index={i} total={TOTAL} />)}
        <div style={{ height:"35vh" }} />
      </div>
    </section>
  );
}

function CaseCard({ index, total }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","end start"] });
  const scale   = useTransform(scrollYProgress,[.38,1],[1,.91]);
  const opacity = useTransform(scrollYProgress,[.45,1],[1,.35]);

  return (
    <div ref={ref} className="sticky mx-auto max-w-[1440px] px-6 lg:px-10 mb-4"
      style={{ top: 108 + index*26 }}>
      <motion.div style={{ scale, opacity }} className="relative overflow-hidden wf-border-sm"
        style2={{ background:"#060810" }} style={{ background:"#060810" }}>
        <Bracks />
        <Tag ch={`<CaseCard · ${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")} />`} g />

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Clip-path reveal image */}
          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-[380px]">
            <motion.div
              initial={{ clipPath:"inset(0 0 100% 0)" }}
              whileInView={{ clipPath:"inset(0 0 0% 0)" }}
              viewport={{ once:true }}
              transition={{ duration:.9, ease:[.2,.8,.2,1] }}
              className="absolute inset-0">
              <Media id={`IMG_C${String(index+1).padStart(2,"0")}`} dim="960×760" role="case/visual" label={`CASE ${String(index+1).padStart(2,"0")}/${String(total).padStart(2,"0")}`} c="w-full h-full" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="lg:col-span-7 p-8 lg:p-14 flex flex-col justify-between gap-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Mono ch={`C/${String(index+1).padStart(2,"0")}`} /><SkF w="80px" h="9px" /></div>
              <Mono ch={`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`} />
            </div>
            <div className="space-y-5">
              <SkH w="96%" h="clamp(28px,3.4vw,46px)" />
              <SkH w="80%" h="clamp(28px,3.4vw,46px)" />
              <SkM w="52%" h="clamp(28px,3.4vw,46px)" />
            </div>
            <HR />
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div className="space-y-2"><Mono ch="OUTCOME_METRIC" /><SkG w="210px" h="30px" /></div>
              <WfBtn label="READ_CASE" variant="ghost" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────── §05 INDUSTRIES BENTO — magnetic 3D ─────────────────── */
function Industries() {
  return (
    <section id="industries" className="relative py-2">
      <SecMark i="05" name="INDUSTRIES_BENTO" dim="4×2 · magnetic-tilt · green-seam-hover" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-28 pb-36">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-16">
          <div>
            <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 05 / Industries" /></div>
            <BigHead l1="84%" l2="50%" h="clamp(38px,5.4vw,74px)" />
          </div>
          <TextBlock lines={3} widths={["100%","86%","62%"]} c="max-w-sm" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <Mono ch="// grid · 4-col · aspect-square · magnetic-tilt · stagger 50ms" />
          <Tag ch="<IndustryCard /> × 8" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({length:8}).map((_,i)=><IndCard key={i} idx={i} />)}
        </div>
        <DimRule v="GRID · 1360 × fluid · 8 cells · 4-col" c="mt-5" />
      </div>
    </section>
  );
}

function IndCard({ idx }) {
  const ref = useRef(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useTransform(my,[-60,60],[7,-7]);
  const ry = useTransform(mx,[-60,60],[-7,7]);
  const onMove = e => {
    if(!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width/2);
    my.set(e.clientY - r.top  - r.height/2);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={()=>{mx.set(0);my.set(0);}}
      style={{ rotateX:rx, rotateY:ry, transformPerspective:900 }}
      initial={{ opacity:0, y:28 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:"-80px" }}
      transition={{ duration:.65, delay:idx*.055, ease:[.2,.8,.2,1] }}
      className="group relative overflow-hidden aspect-square"
      style={{ background:"#06080e", border:"1px solid rgba(255,255,255,0.12)" }}>
      {/* inner light on hover */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 0%, rgba(0,255,148,0.06), transparent 70%)", opacity:0 }}
        whileHover={{ opacity:1 }} transition={{ duration:.4 }} />
      {/* bottom seam */}
      <div className="absolute inset-x-0 bottom-0 h-px transition-all duration-700 opacity-0 group-hover:opacity-100"
        style={{ background:`linear-gradient(to right, transparent, ${C.green}, transparent)` }} />
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Mono ch={String(idx+1).padStart(2,"0")} />
          <Tag ch={`CARD_${String(idx+1).padStart(2,"0")}`} />
        </div>
        <div className="space-y-3">
          <div className="h-9 w-9 wf-border-sm flex items-center justify-center group-hover:wf-border-g transition-all duration-300">
            <div className="h-4 w-4 wf-cross" />
          </div>
          <SkH w="72%" h="18px" />
          <TextBlock lines={2} widths={["100%","74%"]} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────── §06 PROCESS — H-SCROLL ─────────────────── */
function Process() {
  const outer = useRef(null);
  const { scrollYProgress } = useScroll({ target:outer });
  const x = useTransform(scrollYProgress,[0,1],["6%","-74%"]);
  const lw = useTransform(scrollYProgress,[0,1],["0%","100%"]);

  return (
    <section id="process" className="relative py-2">
      <SecMark i="06" name="PROCESS_TIMELINE" dim="6 stages · sticky h-scroll-pan" />
      <div ref={outer} style={{ height:"360vh" }} className="relative">
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 wf-grid" style={{ opacity:.28 }} />
          {/* header */}
          <div className="absolute top-20 inset-x-0">
            <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
              <div className="flex items-end justify-between gap-8 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 06 / Process" /></div>
                  <SkH w="72%" h="clamp(38px,5.4vw,74px)" />
                </div>
                <TextBlock lines={2} widths={["100%","70%"]} c="max-w-sm" />
              </div>
            </div>
          </div>
          {/* timeline */}
          <div className="relative w-full mt-8">
            <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background:"rgba(255,255,255,0.20)" }} />
            <motion.div style={{ width:lw }} className="absolute left-0 top-1/2 h-0.5"
              style2={{ background:C.green, boxShadow:"0 0 14px rgba(0,255,148,.6)" }}
              style={{ background:C.green, boxShadow:"0 0 14px rgba(0,255,148,.6)", width:lw }} />
            <motion.ol style={{ x }} className="flex gap-8 lg:gap-14 will-change-transform">
              {Array.from({length:6}).map((_,i)=>(
                <li key={i} className="relative shrink-0" style={{ width:"min(78vw, 420px)" }}>
                  <div className="flex items-center gap-3 mb-5 pl-1">
                    <span className="relative inline-flex h-2.5 w-2.5">
                      <span className="absolute inset-0 rounded-full pdot" style={{ background:C.green }} />
                      <span className="absolute -inset-2 rounded-full blur-[7px]" style={{ background:"rgba(0,255,148,.30)" }} />
                    </span>
                    <Mono ch={`STEP — ${String(i+1).padStart(2,"0")}`} />
                  </div>
                  <div className="relative p-7 lg:p-9 wf-border-sm" style={{ background:"#06080e" }}>
                    <Bracks />
                    <Tag ch={`<Step.${String(i+1).padStart(2,"0")} />`} />
                    <div className="mt-3 mb-5"><SkH w="74%" h="26px" /></div>
                    <HR c="mb-5" />
                    <TextBlock lines={3} widths={["100%","91%","63%"]} />
                    <div className="flex items-center justify-between mt-6">
                      <Mono ch={`PHASE ${String(i+1).padStart(2,"0")}/06`} />
                      <span className="font-mono text-[11px]" style={{ color:"rgba(255,255,255,.35)" }}>↗</span>
                    </div>
                  </div>
                </li>
              ))}
            </motion.ol>
          </div>
          {/* hint */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center items-center gap-3">
            <div className="h-px w-8" style={{ background:"rgba(255,255,255,.25)" }} />
            <Mono ch="SCROLL ↓ TO ADVANCE TIMELINE" />
            <div className="h-px w-8" style={{ background:"rgba(255,255,255,.25)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── §07 WHY TYMOR — animated accordion rows ─────────────────── */
function WhyTymor() {
  const [open, setOpen] = useState(null);
  return (
    <section id="why" className="relative py-2">
      <SecMark i="07" name="WHY_TYMOR" dim="7 rows · expand-accordion" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-24 pb-32">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-20">
          <div>
            <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 07 / Why Tymor" /></div>
            <BigHead l1="82%" l2="46%" h="clamp(38px,5.4vw,74px)" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-3">
            <div className="sticky top-28">
              <Mono ch="// pinned · accordion" />
              <div className="mt-4 font-geist font-light leading-none" style={{ fontSize:"clamp(56px,10vw,120px)", color:"rgba(255,255,255,.08)" }}>07</div>
              <SkF w="88%" h="9px" c="mt-3" />
              <div className="mt-6"><WfBtn label="GET_STARTED" variant="ghost" /></div>
            </div>
          </aside>
          <div className="lg:col-span-9">
            {Array.from({length:7}).map((_,i)=>(
              <motion.div key={i}
                initial={{ opacity:0, y:24 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true, margin:"-80px" }}
                transition={{ duration:.65, ease:[.2,.8,.2,1] }}
                className="border-t cursor-pointer group"
                style={{ borderColor:"rgba(255,255,255,0.12)" }}
                onClick={()=>setOpen(open===i?null:i)}>
                <div className="py-7 grid grid-cols-12 gap-5 items-start">
                  <div className="col-span-1">
                    <span className="font-mono text-[11px] tracking-[0.2em]" style={{ color:C.green }}>{String(i+1).padStart(2,"0")}</span>
                  </div>
                  <div className="col-span-10 space-y-3">
                    <SkH w={`${85-i*3}%`} h="clamp(18px,2.4vw,34px)" />
                    <motion.div animate={{ height:open===i?"auto":0, opacity:open===i?1:0 }}
                      transition={{ duration:.45, ease:[.2,.8,.2,1] }}
                      style={{ overflow:"hidden" }}>
                      <div className="pt-3 pb-1"><TextBlock lines={3} widths={["100%","94%","72%"]} /></div>
                    </motion.div>
                    <div className="h-px w-0 transition-all duration-700 group-hover:w-32" style={{ background:C.green }} />
                  </div>
                  <div className="col-span-1 flex justify-end pt-1">
                    <motion.span animate={{ rotate:open===i?45:0 }} className="font-mono text-[16px]"
                      style={{ color:"rgba(255,255,255,.35)" }}>+</motion.span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── §08 VIDEO REEL ─────────────────── */
/* Premium: full-bleed, circular play button w/ SVG progress ring */
function VideoReel() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if(!playing) return;
    let v = 0;
    const t = setInterval(()=>{v+=.8; setProgress(v); if(v>=100){setPlaying(false);setProgress(0);clearInterval(t);}}, 80);
    return ()=>clearInterval(t);
  }, [playing]);
  const r = 28, circ = 2*Math.PI*r;

  return (
    <section id="reel" className="relative py-2">
      <SecMark i="08" name="VIDEO_REEL" dim="full-bleed · clip-path-reveal · play-ring" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-24 pb-10">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-10">
          <div>
            <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 08 / Showreel" /></div>
            <SkH w="55%" h="clamp(34px,4.8vw,66px)" />
          </div>
        </div>
      </div>
      <motion.div
        initial={{ clipPath:"inset(0 5% 0 5%)", borderRadius:"24px" }}
        whileInView={{ clipPath:"inset(0 0% 0 0%)", borderRadius:"0px" }}
        viewport={{ once:true }}
        transition={{ duration:1.1, ease:[.2,.8,.2,1] }}
        className="relative mx-4 lg:mx-10 overflow-hidden"
        style={{ height:"min(75vh,680px)" }}>
        <Media id="VID_REEL" dim="1920×1080" role="showreel/video" label="SHOWREEL · 2:30 MIN" c="absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Circular play button */}
          <motion.button onClick={()=>setPlaying(!playing)}
            whileHover={{ scale:1.08 }} whileTap={{ scale:.95 }}
            className="relative flex items-center justify-center"
            style={{ width:80, height:80 }}>
            {/* SVG ring */}
            <svg className="absolute inset-0 -rotate-90" width="80" height="80">
              <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.20)" strokeWidth="1.5" />
              <circle cx="40" cy="40" r={r} fill="none" stroke={C.green} strokeWidth="1.5"
                strokeDasharray={circ} strokeDashoffset={circ*(1-progress/100)}
                style={{ transition:"stroke-dashoffset .1s linear", filter:"drop-shadow(0 0 6px rgba(0,255,148,.6))" }} />
            </svg>
            {/* Background + icon */}
            <div className="relative h-14 w-14 rounded-full flex items-center justify-center"
              style={{ background:"rgba(5,5,5,.70)", border:"1px solid rgba(255,255,255,.35)" }}>
              {playing
                ? <div className="flex gap-1"><div className="h-4 w-1.5 rounded-sm bg-white" /><div className="h-4 w-1.5 rounded-sm bg-white" /></div>
                : <div className="ml-1" style={{ width:0, height:0, borderStyle:"solid", borderWidth:"8px 0 8px 14px", borderColor:"transparent transparent transparent white" }} />
              }
            </div>
          </motion.button>
        </div>
        {/* Corner annotations */}
        <div className="absolute top-4 left-4 flex items-center gap-2"><GD /><Mono ch="TYMOR / SHOWREEL · 2026" /></div>
        <div className="absolute top-4 right-4"><Tag ch="VIDEO_REEL · 1920×1080 · role=showreel" /></div>
        <div className="absolute bottom-4 left-4"><Tag ch={playing?"PLAYING":"PAUSED"} g={playing} /></div>
        <div className="absolute bottom-4 right-4"><Mono ch={`${Math.round(progress/100*150)}s / 150s`} /></div>
        <Bracks op={0.35} />
      </motion.div>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-5">
        <DimRule v="REEL · full-bleed · clip-path reveal · play-button ring SVG" />
      </div>
    </section>
  );
}

/* ─────────────────── §09 TESTIMONIALS — big single slider + dual marquee ─────────────────── */
const QUOTES = [
  { q:"Tymor delivered exactly what they promised on day one and has not missed a beat since.", who:"VP Operations · Hospitality Group" },
  { q:"What came back was a MetaHuman that spoke like our best sales associate — and hasn't taken a single day off.", who:"CMO · National Retailer" },
  { q:"Every employee in every office saw the CEO life-size, in real time. The room went completely silent.", who:"Internal Comms Lead · F500" },
  { q:"Tymor's ability to integrate conversational AI with the Holobox MetaHuman was technically remarkable.", who:"Head of Innovation · Healthcare Network" },
  { q:"From discovery through go-live, their guidance never wavered and their technical depth never ran out.", who:"Director of IT · Realty Group" },
];

function Testimonials() {
  const [idx, setIdx] = useState(0);
  const prev = ()=>setIdx(i=>(i-1+QUOTES.length)%QUOTES.length);
  const next = ()=>setIdx(i=>(i+1)%QUOTES.length);

  return (
    <section id="voices" className="relative py-2">
      <SecMark i="09" name="TESTIMONIALS" dim="single-slider + dual-marquee" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-24 pb-12">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-20">
          <div>
            <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 09 / Community Speaks" /></div>
            <BigHead l1="78%" l2="44%" h="clamp(38px,5.4vw,74px)" />
          </div>
          <Tag ch="<TestimonialSlider · 5 />" />
        </div>

        {/* Big single quote slider */}
        <div className="relative wf-border-sm p-10 lg:p-16 overflow-hidden" style={{ background:"#060810" }}>
          <Bracks />
          {/* Huge quote mark */}
          <div className="absolute -top-6 -left-2 font-geist font-black text-[160px] leading-none select-none"
            style={{ color:"rgba(0,255,148,0.07)" }}>
            "
          </div>
          <div className="relative">
            <div className="absolute -top-3 left-0"><Tag ch={`Q_${String(idx+1).padStart(2,"0")} / ${QUOTES.length}`} /></div>
            <AnimatePresence mode="wait">
              <motion.div key={idx}
                initial={{ opacity:0, y:24 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-24 }}
                transition={{ duration:.55, ease:[.2,.8,.2,1] }}
                className="pt-6">
                {/* Quote as skeleton bars — sized to match actual text length */}
                <div className="space-y-4 mb-10 max-w-4xl">
                  <SkH w="100%" h="clamp(28px,3.2vw,48px)" />
                  <SkH w="92%"  h="clamp(28px,3.2vw,48px)" />
                  <SkM w="64%"  h="clamp(28px,3.2vw,48px)" />
                </div>
                <HR c="mb-7" />
                <div className="flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className="h-11 w-11 rounded-full wf-border flex items-center justify-center shrink-0">
                    <div className="h-5 w-5 wf-cross" />
                  </div>
                  <SkF w="180px" h="10px" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Slider controls */}
          <div className="flex items-center gap-4 mt-10">
            {[prev,next].map((fn,i)=>(
              <motion.button key={i} onClick={fn}
                whileHover={{ scale:1.06 }} whileTap={{ scale:.94 }}
                className="h-11 w-11 rounded-full flex items-center justify-center font-mono text-[14px] transition-all duration-300"
                style={{ border:"1px solid rgba(255,255,255,0.28)", color:"rgba(255,255,255,0.65)" }}>
                {i===0?"←":"→"}
              </motion.button>
            ))}
            {/* Dots */}
            <div className="flex items-center gap-2 ml-2">
              {QUOTES.map((_,i)=>(
                <motion.button key={i} onClick={()=>setIdx(i)}
                  animate={{ width:i===idx?24:6, background:i===idx?C.green:"rgba(255,255,255,0.25)" }}
                  className="h-1 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dual marquee rows */}
      <div className="space-y-3 overflow-hidden">
        <MqRow dur={75} />
        <MqRow dur={90} rev />
      </div>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 mt-8 flex items-center justify-between">
        <Mono ch="// marquee · pause-on-hover · 2 rows" />
        <WfBtn label="READ_ALL" variant="ghost" />
      </div>
    </section>
  );
}

function MqRow({ dur=60, rev=false }) {
  const cards = Array.from({length:18});
  return (
    <div className="flex gap-3 mq hover:[animation-play-state:paused]"
      style={{ animationDuration:`${dur}s`, animationDirection:rev?"reverse":"normal" }}>
      {cards.map((_,i)=>(
        <div key={i} className="shrink-0 p-6 space-y-4 wf-border-sm" style={{ width:"min(480px,86vw)", background:"#06080e" }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[13px]" style={{ color:"rgba(0,255,148,.60)" }}>"</span>
            <Tag ch={`Q_${String((i%6)+1).padStart(2,"0")}`} />
          </div>
          <TextBlock lines={3} widths={["98%","90%","70%"]} size="m" />
          <HR />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full wf-border flex items-center justify-center shrink-0">
              <div className="h-3 w-3 wf-cross" />
            </div>
            <SkF w="140px" h="9px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── §10 AWARDS / LOGOS ─────────────────── */
function Awards() {
  return (
    <div className="relative py-16 overflow-hidden" style={{ borderTop:"1px solid rgba(255,255,255,.10)", borderBottom:"1px solid rgba(255,255,255,.10)" }}>
      <Mono ch="§10 / AWARDS & RECOGNITION" c="absolute top-4 left-6 opacity-60" />
      <div className="absolute inset-y-0 left-0 w-24 z-10" style={{ background:"linear-gradient(to right,#050505,transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 z-10" style={{ background:"linear-gradient(to left,#050505,transparent)" }} />
      <div className="flex gap-16 mq hover:[animation-play-state:paused]" style={{ animationDuration:"50s" }}>
        {Array.from({length:16}).map((_,i)=>(
          <div key={i} className="shrink-0 flex flex-col items-center gap-2">
            <div className="h-10 wf-border-sm flex items-center justify-center px-6">
              <SkF w={`${70+i*8}px`} h="10px" />
            </div>
            <SkF w="60px" h="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── §11 IMPACT STATS ─────────────────── */
function CountUp({ to, dec=0 }) {
  const ref = useRef(null);
  const inView = useInView(ref,{once:true,margin:"-80px"});
  const [val, setVal] = useState(0);
  useEffect(()=>{
    if(!inView) return;
    let raf; const t0=performance.now();
    const run=now=>{const p=Math.min(1,(now-t0)/1600);const e=1-Math.pow(1-p,3);setVal(to*e);if(p<1)raf=requestAnimationFrame(run);};
    raf=requestAnimationFrame(run);
    return()=>cancelAnimationFrame(raf);
  },[inView,to]);
  return <span ref={ref}>{val.toFixed(dec)}</span>;
}

const STATS=[{v:40,s:"yrs",d:0,l:"TECHNOLOGY_LEADERSHIP"},{v:100,s:"K+",d:0,l:"SYSTEMS_MANAGED"},{v:99.9,s:"%",d:1,l:"OPERATIONAL_RELIABILITY"},{v:7,s:"+",d:0,l:"INDUSTRIES_SERVED"}];

function Impact() {
  return (
    <section id="stats" className="relative py-2">
      <SecMark i="11" name="IMPACT_HIGHLIGHTS" dim="4 metrics · count-up on scroll" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-24 pb-32">
        <div className="flex items-end justify-between gap-8 flex-wrap mb-16">
          <div>
            <div className="flex items-center gap-3 mb-7"><GD /><Mono ch="§ 11 / Impact Highlights" /></div>
            <SkH w="55%" h="clamp(34px,5vw,70px)" />
          </div>
          <TextBlock lines={2} widths={["100%","66%"]} c="max-w-sm" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background:"rgba(255,255,255,.10)" }}>
          {STATS.map((s,i)=>(
            <motion.div key={i}
              initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-60px"}}
              transition={{duration:.6,delay:i*.08}}
              className="relative p-8 lg:p-12" style={{ background:C.bg }}>
              <Tag ch={`METRIC_${String(i+1).padStart(2,"0")}`} />
              <div className="mt-5 mb-2 font-geist font-light text-white leading-none" style={{ fontSize:"clamp(44px,5.8vw,92px)", letterSpacing:"-0.03em" }}>
                <CountUp to={s.v} dec={s.d} />
                <span className="ml-1" style={{ color:C.green, fontSize:"0.42em", verticalAlign:"super" }}>{s.s}</span>
              </div>
              <HR c="my-5" />
              <SkF w="76%" h="10px" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── §12 CTA TERMINAL — full-bleed grain ─────────────────── */
function CtaTerminal() {
  return (
    <section id="cta" className="relative py-2">
      <SecMark i="12" name="CTA_TERMINAL" dim="full-bleed · grain · mask-reveal" />
      <div className="relative py-44 overflow-hidden">
        {/* Grain texture */}
        <div className="absolute inset-0 grain pointer-events-none z-[3]" />
        <div className="absolute inset-0 wf-grid" style={{ opacity:.45 }} />
        <div className="absolute inset-0" style={{ background:"radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,255,148,.10) 0%,transparent 65%)" }} />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-10 text-center">
          <motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            transition={{duration:.7}} className="flex items-center justify-center gap-3 mb-14">
            <GD /><Mono ch="BRING HOLOBOX TO LIFE · BOOK A DEMO" />
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Clip-path reveal on each headline bar */}
            {[{w:"68%",delay:0},{w:"84%",delay:.18},{w:"50%",delay:.32}].map((bar,i)=>(
              <div key={i} style={{ overflow:"hidden", marginBottom:"1rem" }}>
                <motion.div
                  initial={{ y:"110%" }}
                  whileInView={{ y:"0%" }}
                  viewport={{ once:true }}
                  transition={{ duration:1.05, delay:bar.delay, ease:[.2,.8,.2,1] }}
                  className={i===2?"sk-md":"sk-hv"}
                  style={{ height:"clamp(52px,8vw,124px)", width:bar.w, margin:"0 auto", borderRadius:"3px" }} />
              </div>
            ))}
          </div>

          <div className="max-w-md mx-auto mt-12 mb-12">
            <TextBlock lines={3} widths={["100%","90%","64%"]} c="items-center" />
          </div>
          <div className="flex items-center justify-center gap-4">
            <WfBtn label="BOOK_DEMO" large />
            <WfBtn label="TALK_TO_ENGINEERING" variant="ghost" large />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── FOOTER ─────────────────── */
function Footer() {
  return (
    <footer className="relative">
      <SecMark i="13" name="FOOTER" dim="5-col · newsletter · links" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-20 pb-14 grid grid-cols-2 lg:grid-cols-12 gap-10">
        {/* Brand col */}
        <div className="col-span-2 lg:col-span-4">
          <Tag ch="<Footer.Brand />" />
          <div className="flex items-center gap-3 mt-5 mb-5">
            <div className="h-6 w-6 wf-border-g flex items-center justify-center">
              <div className="h-3 w-3" style={{ background:"rgba(0,255,148,.75)" }} />
            </div>
            <SkM w="60px" h="13px" />
          </div>
          <TextBlock lines={3} widths={["100%","90%","66%"]} />
          <div className="flex items-center gap-2.5 mt-6"><GD /><SkF w="160px" h="9px" /></div>
          {/* Social icons placeholder row */}
          <div className="flex gap-3 mt-8">
            {Array.from({length:4}).map((_,i)=>(
              <div key={i} className="h-9 w-9 wf-border rounded-sm flex items-center justify-center">
                <div className="h-4 w-4 wf-cross" />
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter col */}
        <div className="col-span-2 lg:col-span-4">
          <Tag ch="<Footer.Newsletter />" />
          <div className="mt-5 mb-4"><SkM w="72%" h="16px" /></div>
          <TextBlock lines={2} widths={["100%","80%"]} c="mb-6" />
          {/* Input + button placeholder */}
          <div className="flex gap-2">
            <div className="flex-1 h-11 wf-border-sm" style={{ background:"#0a0c14" }} />
            <div className="h-11 w-28 wf-border-g flex items-center justify-center">
              <SkG w="80px" h="10px" />
            </div>
          </div>
          <SkF w="70%" h="9px" c="mt-3" />
        </div>

        {/* Link cols */}
        {[1,2].map(col=>(
          <div key={col} className="col-span-1 lg:col-span-2">
            <Tag ch={`<Col_${String(col).padStart(2,"0")} />`} />
            <div className="mt-5 space-y-4">
              {[76,62,84,55,68].map((w,i)=><SkF key={i} w={`${w}%`} h="11px" />)}
            </div>
          </div>
        ))}
      </div>
      <HR />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-6 flex items-center justify-between flex-wrap gap-4">
        <Mono ch="© TYMOR 2026 · BUILD WHAT DOESN'T BREAK" />
        <Mono ch="v.08 / WIREFRAME / ASTRAVENTA · $100K AGENCY" />
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════════ */
export default function TymorV8() {
  return (
    <div className="font-geist antialiased grain" style={{ background:C.bg, color:"white", minHeight:"100vh" }}>
      <style>{CSS}</style>
      <Cursor />
      <Loader />
      <ProgressBar />
      <Ruler />
      <SideProgress />

      <Nav />
      <main>
        <Hero />
        <Ticker />
        <SolutionsBento />
        <CaseStudies />
        <Industries />
        <Process />
        <WhyTymor />
        <VideoReel />
        <Testimonials />
        <Awards />
        <Impact />
        <CtaTerminal />
      </main>
      <Footer />
    </div>
  );
}
