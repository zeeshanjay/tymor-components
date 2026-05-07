import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Building2,
  Hotel,
  GraduationCap,
  ShoppingBag,
  Stethoscope,
  Megaphone,
  Landmark,
  Briefcase,
  Cpu,
  Mic,
  Box,
  UserSquare,
  Settings2,
  Code2,
  Network,
  Radio,
  Quote,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   TYMOR / HOME — ELITE ANIMATED WIREFRAME (v.05)
   Stack: React 18 · Tailwind · Framer Motion · Three.js (r128)
   Aesthetic: dark-mode wireframe (#050505), 0.5px hairlines,
              Geist + Geist Mono, dashed placeholders, dimension labels,
              Cyber-Green (#00FF94) used only as accent / glow.
   Animations: scroll-locked horizontal pan · parallax layers ·
               magnetic cards · count-up · marquee · split-text
               reveals · stacking cards · sticky-scrub.
   ════════════════════════════════════════════════════════════════════ */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500&display=swap');
.font-geist { font-family: 'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif; }
.font-mono  { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
.hairline       { box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.08); }
.hairline-strong{ box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.18); }
.hairline-green { box-shadow: inset 0 0 0 0.5px rgba(0,255,148,0.40); }
.hairline-dash  { background-image:
  repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px); }
.text-balance { text-wrap: balance; }
.grid-bg {
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 64px 64px;
}
.grid-bg-fine {
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 16px 16px;
}
.fractal-bg {
  background-image:
    linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
  background-size: 128px 128px, 128px 128px, 16px 16px, 16px 16px;
}
.radial-mask {
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%);
          mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%);
}
.dashed-box {
  background-image:
    linear-gradient(90deg, rgba(255,255,255,0.18) 50%, transparent 0) top/12px 1px repeat-x,
    linear-gradient(90deg, rgba(255,255,255,0.18) 50%, transparent 0) bottom/12px 1px repeat-x,
    linear-gradient(0deg,  rgba(255,255,255,0.18) 50%, transparent 0) left/1px 12px repeat-y,
    linear-gradient(0deg,  rgba(255,255,255,0.18) 50%, transparent 0) right/1px 12px repeat-y;
}
.diag-x {
  background-image:
    linear-gradient(135deg, transparent 49.6%, rgba(255,255,255,0.08) 49.6% 50.4%, transparent 50.4%),
    linear-gradient(45deg,  transparent 49.6%, rgba(255,255,255,0.08) 49.6% 50.4%, transparent 50.4%);
}
@keyframes scan      { 0%{transform:translateY(-40%);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(140%);opacity:0} }
.scanline { animation: scan 4.5s ease-in-out infinite; }
@keyframes float-y   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.float-y { animation: float-y 6s ease-in-out infinite; }
@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.35} }
.pulse-dot { animation: pulse-dot 2.4s ease-in-out infinite; }
@keyframes marquee   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.marquee { animation: marquee 60s linear infinite; }
@keyframes loader-bar{ 0%{width:0%} 100%{width:100%} }
::selection { background: rgba(0,255,148,0.30); color: #fff; }
html { scroll-behavior: smooth; }
`;

/* ────────── DATA ────────── */
const NAV = [
  { label: "Solutions", href: "#solutions" },
  { label: "Industries", href: "#industries" },
  { label: "Case Studies", href: "#cases" },
  { label: "Process", href: "#process" },
  { label: "Why Tymor", href: "#why" },
];

const SOLUTIONS = [
  { id: "01", icon: Box, title: "AI Holobox Technology", tag: "Intelligent. Immersive. Unforgettable.", desc: "Volumetric MetaHumans rendered at 60fps in a real-world enclosure — the centerpiece of the experience." },
  { id: "02", icon: Mic, title: "Conversational AI", tag: "Meaningful conversations, everywhere.", desc: "Knowledge-grounded dialog engines tuned to brand voice, escalation rules, and audience context." },
  { id: "03", icon: Network, title: "Holobox Integration Services", tag: "Intelligent MetaHumans. Instant business interactions.", desc: "We connect the Holobox to CRM, LMS, ERP, IoT — wherever the data and the workflow already live." },
  { id: "04", icon: UserSquare, title: "Avatar & MetaHuman Production", tag: "Designed from day one for you.", desc: "Custom-sculpted likenesses, wardrobe, voice, and movement — never pulled from a stock catalog." },
  { id: "05", icon: Settings2, title: "Managed AI Systems", tag: "Holobox AI never without support.", desc: "24/7 monitoring, model retraining, content updates, and guardrail tuning post-launch." },
  { id: "06", icon: Code2, title: "Software Development", tag: "The brains behind the box.", desc: "Custom dashboards, control systems, analytics surfaces, and enterprise-grade APIs." },
  { id: "07", icon: Cpu, title: "IoT / Holobox Architecture", tag: "IoT-infused Holobox experiences.", desc: "Sensors, peripherals, room intelligence — the Holobox aware of who is in front of it." },
  { id: "08", icon: Radio, title: "Live Beaming", tag: "No travel required.", desc: "Real-time human projection across geographies — a CEO in twelve cities at once, life-size." },
];

const INDUSTRIES = [
  { id: "01", name: "Real Estate", icon: Building2, blurb: "Property advisors with real-time buyer insight." },
  { id: "02", name: "Hospitality", icon: Hotel, blurb: "AI concierge across every guest touchpoint." },
  { id: "03", name: "Education", icon: GraduationCap, blurb: "Always-on faculty for any learner, any hour." },
  { id: "04", name: "Retail", icon: ShoppingBag, blurb: "Product specialists scaling across the floor." },
  { id: "05", name: "Healthcare", icon: Stethoscope, blurb: "Live-streamed clinicians. No travel required." },
  { id: "06", name: "Marketing", icon: Megaphone, blurb: "Brand ambassadors that draw the room in." },
  { id: "07", name: "Government", icon: Landmark, blurb: "Public-facing service, trained and consistent." },
  { id: "08", name: "Executive", icon: Briefcase, blurb: "C-suite presence in every office, every day." },
];

const CASES = [
  { id: "C/01", sector: "Hospitality", title: "Redefining guest engagement with an AI-powered Holobox concierge.", metric: "+38% guest satisfaction" },
  { id: "C/02", sector: "Retail", title: "AI Holobox product specialist transforms the in-store experience.", metric: "2.4× attach rate" },
  { id: "C/03", sector: "Real Estate", title: "Realty group introduces Holobox advisors for property buying.", metric: "11× more qualified leads" },
  { id: "C/04", sector: "Healthcare", title: "Live-streamed physician model improves clinical patient delivery.", metric: "−42% avg. wait time" },
  { id: "C/05", sector: "Marketing", title: "Holobox brand ambassador drives engagement at trade shows.", metric: "5,200 dwell-min logged" },
];

const PROCESS = [
  { id: "01", title: "Discovery", desc: "Map the use case, environment, integrations, and audience reality." },
  { id: "02", title: "Design the MetaHuman", desc: "Sculpt likeness, wardrobe, voice, and personality from the ground up." },
  { id: "03", title: "Voice & Speech", desc: "Produce custom speech models that sound like a person — not a system." },
  { id: "04", title: "Expression & Movement", desc: "Engineer facial nuance and gesture for natural human rapport." },
  { id: "05", title: "AI Brain & Integration", desc: "Wire knowledge base, guardrails, and enterprise systems together." },
  { id: "06", title: "Go-Live & Manage", desc: "Deploy, train staff, instrument analytics, optimize continuously." },
];

const WHY = [
  { id: "01", title: "Full-stack ownership", body: "Tymor is the only Holobox solution built by an IT company. One accountable partner — no vendor gaps, no finger-pointing." },
  { id: "02", title: "Intelligence behind the presence", body: "Anyone can put a face on a screen. Tymor builds the AI behind it — the logic, knowledge, integrations, and guardrails." },
  { id: "03", title: "Versatility across industries", body: "From hotel lobbies to military training rooms — scalable configurations that fit any use case and budget." },
  { id: "04", title: "Launch then evolve", body: "Most vendors measure success at delivery. Tymor measures it every day after — analytics, optimization, evolution." },
  { id: "05", title: "Changes with you", body: "Redeploying a Holobox MetaHuman to a new role is a managed update. Same character. New purpose. No starting over." },
  { id: "06", title: "No days off", body: "One conversation at a time is a human limit. Holobox MetaHumans perform identically for visitor 100 as for visitor 1." },
  { id: "07", title: "Interactions become intelligence", body: "Every conversation logged, measured, reported. The Holobox doesn't just serve customers — it teaches you about them." },
];

const TESTIMONIALS = [
  { quote: "Tymor delivered exactly what they promised on day one and has not missed a beat since.", who: "VP Operations · Hospitality Group" },
  { quote: "What came back was a MetaHuman that spoke like our best sales associate — and hasn't taken a single day off.", who: "CMO · National Retailer" },
  { quote: "Every employee in every office saw the CEO life-size, in real time. The room went completely silent.", who: "Internal Comms Lead · F500" },
  { quote: "Tymor's ability to integrate conversational AI with the Holobox MetaHuman was technically remarkable.", who: "Head of Innovation · Healthcare Network" },
  { quote: "From discovery through go-live, their guidance never wavered and their technical depth never ran out.", who: "Director of IT · Realty Group" },
  { quote: "The competitor came with bold marketing and underwhelming reality. That disconnect told us everything.", who: "CTO · Financial Services" },
];

const STATS = [
  { value: 40,   suffix: "yrs", label: "Technology leadership" },
  { value: 100,  suffix: "K+",  label: "Systems managed" },
  { value: 99.9, suffix: "%",   label: "Operational reliability", decimals: 1 },
  { value: 7,    suffix: "+",   label: "Industries served" },
];

/* ════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════ */

const Hairline = ({ className = "" }) => (
  <div className={`h-px w-full bg-white/[0.08] ${className}`} />
);

const MonoLabel = ({ children, className = "" }) => (
  <span className={`font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 ${className}`}>
    {children}
  </span>
);

const GreenDot = ({ className = "" }) => (
  <span className={`relative inline-flex h-1.5 w-1.5 ${className}`}>
    <span className="absolute inset-0 rounded-full bg-[#00FF94] pulse-dot" />
    <span className="absolute -inset-1 rounded-full bg-[#00FF94] blur-[6px] opacity-50" />
  </span>
);

const Crosshair = ({ className = "" }) => (
  <div className={`absolute h-3 w-3 ${className}`}>
    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 -translate-y-1/2" />
    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 -translate-x-1/2" />
  </div>
);

const SectionFrame = ({ index, name, dim, children, id }) => (
  <section id={id} className="relative">
    <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
    <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-[#050505] z-10">
      <MonoLabel>
        <span className="text-[#00FF94]">§ {index}</span> ────── {name} {dim && <span className="text-white/25">/ {dim}</span>}
      </MonoLabel>
    </div>
    {children}
  </section>
);

const SectionHead = ({ kicker, title, sub, alignRight = false }) => (
  <div className={`flex items-end gap-8 flex-wrap ${alignRight ? "justify-between" : "justify-between"}`}>
    <div>
      <div className="flex items-center gap-3"><GreenDot /><MonoLabel>{kicker}</MonoLabel></div>
      <h2 className="mt-6 font-geist font-light tracking-[-0.03em] text-[clamp(34px,5.4vw,72px)] leading-[0.98] max-w-3xl">
        {title}
      </h2>
    </div>
    {sub && <p className="max-w-sm font-geist text-[14px] text-white/50 leading-relaxed">{sub}</p>}
  </div>
);

function DemoButton({ variant = "primary", children = "Book a Demo" }) {
  if (variant === "ghost") {
    return (
      <button className="group inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-mono uppercase tracking-[0.18em] text-white/75 hover:text-white transition border border-white/10 hover:border-white/30 rounded-full">
        {children}
        <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    );
  }
  return (
    <button className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-mono uppercase tracking-[0.18em] text-[#00FF94] rounded-full border border-[#00FF94]/40 hover:border-[#00FF94] transition shadow-[0_0_0_0_rgba(0,255,148,0)] hover:shadow-[0_0_28px_rgba(0,255,148,0.32)]">
      <span className="absolute inset-0 rounded-full bg-[#00FF94]/[0.05]" />
      <span className="relative">{children}</span>
      <ArrowRight className="relative h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   GLOBAL UI · scroll progress · loader · section indicator
   ════════════════════════════════════════════════════════════════════ */

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-px bg-[#00FF94] origin-left z-[60] shadow-[0_0_12px_rgba(0,255,148,0.6)]"
    />
  );
}

function PageLoader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] bg-[#050505] grid-bg-fine flex items-center justify-center"
        >
          <div className="w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                ◇ TYMOR / BOOTING WIREFRAME
              </span>
            </div>
            <div className="h-px w-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[#00FF94] shadow-[0_0_12px_rgba(0,255,148,0.6)]" style={{ animation: "loader-bar 1.2s ease-out forwards" }} />
            </div>
            <div className="mt-2 font-mono text-[9px] tracking-[0.24em] text-white/30">
              compiling layout · loading geometry · resolving tokens
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionIndicator() {
  return (
    <div className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-3 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl px-3.5 py-2">
      <GreenDot />
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
        TYMOR / HOME · v.05
      </span>
      <span className="font-mono text-[10px] tracking-[0.22em] text-white/30">1440×∞</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   NAVBAR
   ════════════════════════════════════════════════════════════════════ */
function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-5">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center justify-between rounded-full border border-white/[0.08] bg-black/40 backdrop-blur-xl px-5 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative h-5 w-5">
              <div className="absolute inset-0 hairline-green rounded-sm" />
              <div className="absolute inset-1 bg-[#00FF94]/20 rounded-[1px]" />
              <div className="absolute inset-1.5 bg-[#00FF94]/70 rounded-[1px]" />
            </div>
            <span className="font-geist text-[15px] font-medium tracking-tight">Tymor</span>
            <span className="hidden sm:inline-block ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
              Holobox · MetaHuman Systems
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 hover:text-white transition">
                {n.label}
              </a>
            ))}
          </nav>
          <DemoButton />
        </motion.div>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HERO · Three.js wireframe holobox + split-text reveal
   ════════════════════════════════════════════════════════════════════ */

function ThreeWireframe() {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth, h = mount.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    // Outer wireframe icosahedron
    const outerGeom = new THREE.IcosahedronGeometry(1.55, 1);
    const outerWire = new THREE.WireframeGeometry(outerGeom);
    const outerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    const outer = new THREE.LineSegments(outerWire, outerMat);
    scene.add(outer);

    // Mid wireframe torus knot (the "core")
    const midGeom = new THREE.TorusKnotGeometry(0.7, 0.16, 100, 16);
    const midWire = new THREE.WireframeGeometry(midGeom);
    const midMat = new THREE.LineBasicMaterial({ color: 0x00ff94, transparent: true, opacity: 0.55 });
    const mid = new THREE.LineSegments(midWire, midMat);
    scene.add(mid);

    // Inner small icosahedron
    const innerGeom = new THREE.IcosahedronGeometry(0.42, 0);
    const innerWire = new THREE.WireframeGeometry(innerGeom);
    const innerMat = new THREE.LineBasicMaterial({ color: 0x00ff94, transparent: true, opacity: 0.9 });
    const inner = new THREE.LineSegments(innerWire, innerMat);
    scene.add(inner);

    // Particle field
    const N = 600;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
    }
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.014, transparent: true, opacity: 0.55 });
    const points = new THREE.Points(pGeom, pMat);
    scene.add(points);

    const onMouse = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      outer.rotation.x += 0.0014;
      outer.rotation.y += 0.0021;
      mid.rotation.x   -= 0.0042;
      mid.rotation.y   -= 0.0036;
      inner.rotation.x += 0.008;
      inner.rotation.y += 0.011;
      points.rotation.y += 0.0006;

      camera.position.x += (mouseRef.current.x - camera.position.x) * 0.04;
      camera.position.y += (-mouseRef.current.y - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      [outerGeom, outerWire, midGeom, midWire, innerGeom, innerWire, pGeom].forEach(g => g.dispose());
      [outerMat, midMat, innerMat, pMat].forEach(m => m.dispose());
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}

const SplitText = ({ text, delay = 0, className = "" }) => {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            initial={{ y: "120%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.9, delay: delay + i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
            className="inline-block"
          >
            {w}{i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100vh] pt-32 pb-24 overflow-hidden">
      {/* atmosphere layers */}
      <div className="absolute inset-0 fractal-bg radial-mask opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,148,0.08),_transparent_60%)]" />

      {/* Three.js canvas — behind, soft */}
      <div className="absolute inset-0 opacity-90">
        <ThreeWireframe />
      </div>

      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center justify-center gap-3"
        >
          <GreenDot />
          <MonoLabel>TYMOR / ENTERPRISE HOLOBOX & METAHUMAN SYSTEMS</MonoLabel>
          <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">v.05</span>
        </motion.div>

        {/* headline */}
        <h1 className="mt-10 text-balance text-center font-geist font-light tracking-[-0.04em] leading-[0.95] text-[clamp(48px,9vw,148px)]">
          <SplitText text="Humanity at the" delay={0.2} className="block" />
          <span className="relative inline-block">
            <SplitText text="Center" delay={0.5} />
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute -right-5 top-2 h-2 w-2 rounded-full bg-[#00FF94] shadow-[0_0_24px_rgba(0,255,148,0.7)]"
            />
          </span>{" "}
          <span className="text-white/45">
            <SplitText text="of Technology" delay={0.7} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mx-auto mt-9 max-w-xl text-center font-geist text-[15px] leading-relaxed text-white/55"
        >
          We engineer Holobox MetaHumans that think, speak, and remember — built end-to-end
          by an IT company so the full stack works the day you turn it on, and every day after.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <DemoButton />
          <DemoButton variant="ghost">Explore Solutions</DemoButton>
        </motion.div>

        {/* annotation strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="mt-20 flex items-center justify-between flex-wrap gap-4 px-2"
        >
          <span className="font-mono text-[10px] tracking-[0.24em] text-white/35">
            ◇ HERO_v04 / r3f-wireframe / mouse-parallax / split-text-reveal
          </span>
          <span className="font-mono text-[10px] tracking-[0.24em] text-white/35">
            scroll ↓ to enter system
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §02 INTELLIGENT SOLUTIONS · sticky-scrub progressive list
   ════════════════════════════════════════════════════════════════════ */
function Solutions() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <SectionFrame index="02" name="INTELLIGENT_SOLUTIONS" dim="8 modules" id="solutions">
      <div ref={ref} className="relative" style={{ height: `${SOLUTIONS.length * 70 + 60}vh` }}>
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 grid-bg radial-mask opacity-30" />
          <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10 w-full grid grid-cols-12 gap-8">
            {/* left column — header + counter */}
            <div className="col-span-12 lg:col-span-5">
              <SectionHead
                kicker="§ 02 / SOLUTIONS"
                title={<>Intelligent solutions, <br/><span className="text-white/45">end-to-end.</span></>}
              />
              <ProgressCounter scrollYProgress={scrollYProgress} total={SOLUTIONS.length} />
              <p className="mt-8 max-w-md font-geist text-[14px] text-white/45 leading-relaxed">
                Eight modules. One platform. Each solution is independently deployable
                and integrated with the others by design — not by retrofit.
              </p>
            </div>

            {/* right column — stack */}
            <div className="col-span-12 lg:col-span-7 relative">
              <div className="absolute -top-4 left-0 right-0 flex justify-between">
                <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">// stack.solutions</span>
                <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">scroll-progressive · sticky</span>
              </div>
              <div className="relative h-[460px] sm:h-[520px]">
                {SOLUTIONS.map((s, i) => (
                  <SolutionCard key={s.id} solution={s} index={i} total={SOLUTIONS.length} progress={scrollYProgress} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function ProgressCounter({ scrollYProgress, total }) {
  const idx = useTransform(scrollYProgress, (v) => {
    const n = Math.min(total, Math.max(1, Math.ceil(v * total)));
    return String(n).padStart(2, "0");
  });
  return (
    <div className="mt-10 flex items-baseline gap-3">
      <motion.span className="font-mono text-[88px] leading-none font-light tracking-tight text-white">{idx}</motion.span>
      <span className="font-mono text-[14px] text-white/30">/ {String(total).padStart(2, "0")}</span>
    </div>
  );
}

function SolutionCard({ solution, index, total, progress }) {
  const Icon = solution.icon;
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [Math.max(0, start - 0.05), start, end, Math.min(1, end + 0.05)], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, end], ["0px", "-30px"]);
  const scale = useTransform(progress, [start, end], [1, 0.97]);

  return (
    <motion.article
      style={{ opacity, y, scale }}
      className="absolute inset-0 hairline rounded-[4px] bg-white/[0.015] backdrop-blur-xl p-8 lg:p-10 flex flex-col justify-between"
    >
      <Brackets />
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[3px] hairline bg-black/40 flex items-center justify-center">
              <Icon className="h-5 w-5 text-[#00FF94]" strokeWidth={1.25} />
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-[0.24em] text-white/35">MODULE — {solution.id}</span>
              <h3 className="mt-1 font-geist text-[26px] lg:text-[32px] font-light tracking-[-0.02em] leading-[1.05]">
                {solution.title}
              </h3>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-white/30" />
        </div>
        <Hairline className="my-6" />
        <p className="font-geist text-[20px] lg:text-[26px] font-light tracking-[-0.01em] text-white/85 leading-snug max-w-xl">
          {solution.tag}
        </p>
        <p className="mt-4 font-geist text-[14px] text-white/50 max-w-lg leading-relaxed">
          {solution.desc}
        </p>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <DemoButton variant="ghost">Get Started</DemoButton>
      </div>
    </motion.article>
  );
}

function Brackets() {
  const cls = "absolute h-4 w-4 border-white/30";
  return (
    <>
      <div className={`${cls} top-0 left-0 border-t border-l`} />
      <div className={`${cls} top-0 right-0 border-t border-r`} />
      <div className={`${cls} bottom-0 left-0 border-b border-l`} />
      <div className={`${cls} bottom-0 right-0 border-b border-r`} />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §03 INDUSTRIES · bento grid · magnetic tilt
   ════════════════════════════════════════════════════════════════════ */
function Industries() {
  return (
    <SectionFrame index="03" name="INDUSTRIES_BENTO" dim="4×2 grid" id="industries">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-28 pb-32">
        <SectionHead
          kicker="§ 03 / INDUSTRIES"
          title={<>Your industry, <br/><span className="text-white/45">powered by Holobox.</span></>}
          sub="Eight verticals. One platform. Each MetaHuman is shaped to the knowledge, tone, and integrations of the environment it serves."
        />
        <div className="mt-16 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">// grid.industries · cols=4 · rows=2</span>
          <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">stagger=50ms · magnetic-tilt</span>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INDUSTRIES.map((ind, i) => <IndustryCard key={ind.id} industry={ind} index={i} />)}
        </div>
      </div>
    </SectionFrame>
  );
}

function IndustryCard({ industry, index }) {
  const Icon = industry.icon;
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [6, -6]);
  const rotateY = useTransform(x, [-50, 50], [-6, 6]);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set(e.clientX - r.left - r.width / 2);
    y.set(e.clientY - r.top - r.height / 2);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      className="group relative aspect-square rounded-[6px] hairline bg-white/[0.015] backdrop-blur-xl overflow-hidden hover:bg-white/[0.03] transition-colors duration-500"
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00FF94]/0 to-transparent group-hover:via-[#00FF94]/70 transition-all duration-700" />
      <Plus className="absolute top-3 right-3 h-3 w-3 text-white/15 group-hover:text-[#00FF94]/70 transition" strokeWidth={1} />
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <span className="font-mono text-[10px] tracking-[0.24em] text-white/35">{industry.id}</span>
        <div>
          <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-[4px] hairline bg-black/40 group-hover:hairline-green transition">
            <Icon className="h-4 w-4 text-white/70 group-hover:text-[#00FF94] transition" strokeWidth={1.25} />
          </div>
          <h3 className="font-geist text-[18px] font-medium tracking-tight">{industry.name}</h3>
          <p className="mt-1.5 font-geist text-[12.5px] text-white/40 leading-relaxed">{industry.blurb}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §04 CASE STUDIES · stacking cards on scroll
   ════════════════════════════════════════════════════════════════════ */
function CaseStudies() {
  return (
    <SectionFrame index="04" name="IMPACT_CASE_STUDIES" dim={`${CASES.length} stacked`} id="cases">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-28">
        <SectionHead
          kicker="§ 04 / CASE STUDIES"
          title={<>Impact-driven <br/><span className="text-white/45">projects.</span></>}
          sub="Five Holobox deployments across hospitality, retail, real estate, healthcare, and marketing — each measurable from the day it launched."
        />
      </div>
      <div className="relative mt-16">
        {CASES.map((c, i) => (
          <StackingCase key={c.id} caseItem={c} index={i} total={CASES.length} />
        ))}
        <div className="h-[40vh]" />
      </div>
    </SectionFrame>
  );
}

function StackingCase({ caseItem, index, total }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0.4, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0.5, 1], [1, 0.4]);

  return (
    <div ref={ref} className="sticky top-24 mx-auto max-w-[1440px] px-6 lg:px-10 mb-6" style={{ top: `${96 + index * 32}px` }}>
      <motion.div
        style={{ scale, opacity }}
        className="relative rounded-[6px] hairline bg-[#070707] backdrop-blur-xl overflow-hidden"
      >
        <Brackets />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* media placeholder */}
          <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto lg:min-h-[360px] dashed-box bg-[radial-gradient(ellipse_at_center,_rgba(0,255,148,0.06),_transparent_70%)]">
            <div className="absolute inset-0 diag-x" />
            <div className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.24em] text-white/40">
              IMG · 1920×1200 · {caseItem.id}
            </div>
            <div className="absolute bottom-3 left-3 font-mono text-[9px] tracking-[0.24em] text-white/30">
              role="case-study/visual"
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-[10px] tracking-[0.24em] text-white/30">[ HOLOBOX MEDIA ]</div>
                <div className="mt-2 font-mono text-[9px] tracking-[0.24em] text-white/20">{caseItem.sector.toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* content */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.24em] text-white/40">{caseItem.id} — {caseItem.sector.toUpperCase()}</span>
              <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-8 font-geist font-light tracking-[-0.02em] text-[clamp(28px,3.4vw,46px)] leading-[1.05] max-w-2xl">
              {caseItem.title}
            </h3>
            <Hairline className="my-7" />
            <div className="flex items-end justify-between flex-wrap gap-6">
              <div>
                <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">OUTCOME</span>
                <div className="mt-2 font-geist text-[28px] font-light tracking-[-0.02em] text-[#00FF94]">{caseItem.metric}</div>
              </div>
              <DemoButton variant="ghost">Read Case</DemoButton>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §05 PROCESS · scroll-driven horizontal pan
   ════════════════════════════════════════════════════════════════════ */
function Process() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ["8%", "-72%"]);
  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <SectionFrame index="05" name="PROCESS_TIMELINE" dim="6 stages · h-scroll" id="process">
      <section ref={targetRef} className="relative h-[340vh]">
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 grid-bg opacity-30 radial-mask" />
          <div className="absolute top-24 left-0 right-0">
            <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
              <SectionHead
                kicker="§ 05 / PROCESS"
                title="Process is everything."
                sub="Six stages from kickoff to perpetual optimization. Scroll to walk the line."
              />
            </div>
          </div>

          <div className="relative w-full">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.08]" />
            <motion.div style={{ width: lineWidth }} className="absolute left-0 top-1/2 h-px bg-[#00FF94] shadow-[0_0_16px_rgba(0,255,148,0.6)]" />

            <motion.ol style={{ x }} className="flex gap-8 lg:gap-14 will-change-transform">
              {PROCESS.map((step) => (
                <li key={step.id} className="relative shrink-0 w-[78vw] sm:w-[52vw] lg:w-[34vw] xl:w-[28vw]">
                  <div className="flex items-center gap-3 mb-6 pl-1">
                    <span className="relative inline-flex h-2.5 w-2.5">
                      <span className="absolute inset-0 rounded-full bg-[#00FF94]" />
                      <span className="absolute -inset-1 rounded-full bg-[#00FF94] blur-[8px] opacity-60" />
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.24em] text-white/45">STEP — {step.id}</span>
                  </div>
                  <div className="relative rounded-[4px] hairline bg-white/[0.015] backdrop-blur-xl p-7 lg:p-9">
                    <Brackets />
                    <h3 className="font-geist text-[28px] lg:text-[34px] font-light tracking-[-0.02em] leading-[1.05]">{step.title}</h3>
                    <Hairline className="my-5" />
                    <p className="font-geist text-[14px] text-white/55 leading-relaxed">{step.desc}</p>
                    <div className="mt-7 flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">PHASE {step.id}/06</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white/30" />
                    </div>
                  </div>
                </li>
              ))}
            </motion.ol>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.24em] text-white/25">SCROLL TO ADVANCE TIMELINE</span>
            <span className="h-px w-10 bg-white/15" />
          </div>
        </div>
      </section>
    </SectionFrame>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §06 WHY TYMOR · split-screen sticky number
   ════════════════════════════════════════════════════════════════════ */
function WhyTymor() {
  return (
    <SectionFrame index="06" name="WHY_TYMOR" dim="7 differentiators" id="why">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-28">
        <SectionHead
          kicker="§ 06 / WHY TYMOR"
          title={<>The case for Tymor, <br/><span className="text-white/45">in seven points.</span></>}
        />
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* sticky left rail with running index */}
          <aside className="lg:col-span-3">
            <div className="sticky top-32">
              <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">// pinned</span>
              <div className="mt-3 font-geist font-light text-[clamp(56px,8vw,120px)] tracking-[-0.04em] leading-none text-white/10">
                07
              </div>
              <p className="mt-4 font-mono text-[10px] tracking-[0.24em] text-white/35">DIFFERENTIATORS</p>
              <DemoButton variant="ghost">Get Started</DemoButton>
            </div>
          </aside>
          {/* scrolling reasons */}
          <div className="lg:col-span-9">
            {WHY.map((w, i) => <WhyRow key={w.id} w={w} index={i} />)}
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function WhyRow({ w, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative grid grid-cols-12 gap-6 py-10 border-t border-white/[0.08] group"
    >
      <div className="col-span-2 lg:col-span-1">
        <span className="font-mono text-[11px] tracking-[0.24em] text-[#00FF94]">{w.id}</span>
      </div>
      <div className="col-span-10 lg:col-span-11">
        <h3 className="font-geist text-[clamp(22px,2.6vw,38px)] font-light tracking-[-0.02em] leading-[1.1]">
          {w.title}
        </h3>
        <p className="mt-4 font-geist text-[14px] text-white/55 leading-relaxed max-w-2xl">{w.body}</p>
        <div className="mt-5 h-px w-0 bg-[#00FF94] group-hover:w-32 transition-all duration-700" />
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §07 TESTIMONIALS · dual-row marquee
   ════════════════════════════════════════════════════════════════════ */
function Testimonials() {
  const half = Math.ceil(TESTIMONIALS.length / 2);
  const row1 = TESTIMONIALS.slice(0, half);
  const row2 = TESTIMONIALS.slice(half);
  return (
    <SectionFrame index="07" name="TESTIMONIALS_MARQUEE" dim="∞ loop" id="voices">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-28">
        <SectionHead
          kicker="§ 07 / VOICES"
          title={<>Our global community <br/><span className="text-white/45">speaks.</span></>}
        />
      </div>
      <div className="mt-16 space-y-4 overflow-hidden">
        <MarqueeRow items={row1} duration={70} />
        <MarqueeRow items={row2} duration={85} reverse />
      </div>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 mt-10 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.24em] text-white/30">// marquee · auto · pause-on-hover</span>
        <DemoButton variant="ghost">Read All</DemoButton>
      </div>
    </SectionFrame>
  );
}

function MarqueeRow({ items, duration = 60, reverse = false }) {
  const doubled = [...items, ...items, ...items];
  return (
    <div className="relative">
      <div
        className="flex gap-4 marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {doubled.map((t, i) => (
          <article key={i} className="shrink-0 w-[440px] sm:w-[520px] rounded-[4px] hairline bg-white/[0.015] backdrop-blur-xl p-7">
            <Quote className="h-4 w-4 text-[#00FF94]/70" strokeWidth={1.5} />
            <p className="mt-4 font-geist text-[16px] text-white/85 leading-snug">"{t.quote}"</p>
            <Hairline className="my-5" />
            <span className="font-mono text-[10px] tracking-[0.24em] text-white/40">— {t.who}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §08 IMPACT · count-up stats
   ════════════════════════════════════════════════════════════════════ */
function CountUp({ to, decimals = 0, duration = 1.5 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toFixed(decimals)}</span>;
}

function Impact() {
  return (
    <SectionFrame index="08" name="IMPACT_HIGHLIGHTS" dim="4 metrics" id="impact">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-28 pb-32">
        <SectionHead
          kicker="§ 08 / IMPACT"
          title="Impact, in numbers."
          sub="Forty years of IT discipline behind every Holobox we ship — and every one we keep running."
        />
        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] hairline">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="relative bg-[#050505] p-8 lg:p-10"
            >
              <div className="font-mono text-[9px] tracking-[0.24em] text-white/30">METRIC — 0{i + 1}</div>
              <div className="mt-5 font-geist font-light tracking-[-0.03em] text-[clamp(44px,5.2vw,84px)] leading-none">
                <CountUp to={s.value} decimals={s.decimals || 0} />
                <span className="text-[#00FF94] text-[0.45em] align-super ml-1">{s.suffix}</span>
              </div>
              <Hairline className="my-5" />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/45">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

/* ════════════════════════════════════════════════════════════════════
   §09 BOTTOM CTA · mask reveal
   ════════════════════════════════════════════════════════════════════ */
function BottomCTA() {
  return (
    <SectionFrame index="09" name="CTA_TERMINAL" dim="hero-end" id="demo">
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 fractal-bg radial-mask opacity-50" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[520px] bg-[radial-gradient(ellipse_at_center,_rgba(0,255,148,0.12),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex items-center justify-center gap-3">
            <GreenDot />
            <MonoLabel>Bring Holobox to Life</MonoLabel>
          </motion.div>
          <h2 className="mt-8 mx-auto font-geist font-light tracking-[-0.04em] leading-[0.98] text-[clamp(48px,8vw,128px)] max-w-5xl">
            <span className="block overflow-hidden">
              <motion.span initial={{ y: "120%" }} whileInView={{ y: "0%" }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }} className="inline-block">
                One demo
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span initial={{ y: "120%" }} whileInView={{ y: "0%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }} className="inline-block text-white/45">
                changes everything.
              </motion.span>
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-md font-geist text-[14px] text-white/50 leading-relaxed">
            Thirty minutes with a working Holobox MetaHuman is worth more than any
            deck we could send. Pick a time.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <DemoButton />
            <DemoButton variant="ghost">Talk to Engineering</DemoButton>
          </div>
        </div>
      </section>
    </SectionFrame>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="relative">
      <Hairline />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-14 grid grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="relative h-5 w-5">
              <div className="absolute inset-0 hairline-green rounded-sm" />
              <div className="absolute inset-1 bg-[#00FF94]/70 rounded-[1px]" />
            </div>
            <span className="font-geist text-[15px]">Tymor</span>
          </div>
          <p className="mt-4 max-w-sm font-geist text-[13px] text-white/40 leading-relaxed">
            Holobox & MetaHuman systems built by an IT company. Full-stack
            ownership, end-to-end accountability.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF94] pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">All systems operational</span>
          </div>
        </div>
        {[
          { h: "Solutions", items: ["Holobox", "MetaHuman", "Conversational AI", "Live Beaming"] },
          { h: "Industries", items: ["Healthcare", "Retail", "Hospitality", "Government"] },
          { h: "Company", items: ["About", "Process", "Case Studies", "Careers"] },
        ].map((col) => (
          <div key={col.h}>
            <MonoLabel>{col.h}</MonoLabel>
            <ul className="mt-5 space-y-2.5">
              {col.items.map((it) => (
                <li key={it} className="font-geist text-[13px] text-white/55 hover:text-white transition cursor-pointer">{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Hairline />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-6 flex items-center justify-between flex-wrap gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">© Tymor 2026 · Build what doesn't break</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">v.05 / Astraventa</span>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ROOT
   ════════════════════════════════════════════════════════════════════ */
export default function TymorWireframe() {
  return (
    <div className="font-geist bg-[#050505] text-white antialiased min-h-screen selection:bg-[#00FF94]/30">
      <style>{FONTS}</style>
      <PageLoader />
      <ScrollProgressBar />
      <SectionIndicator />
      <Nav />
      <main>
        <Hero />
        <Solutions />
        <Industries />
        <CaseStudies />
        <Process />
        <WhyTymor />
        <Testimonials />
        <Impact />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
