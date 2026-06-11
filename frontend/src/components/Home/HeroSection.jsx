import { useNavigate } from "react-router-dom";

/* ── SVG icon helpers ── */
const IconCode = () => (
  <svg viewBox="0 0 24 24">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const IconShare = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const IconHelp = () => (
  <svg viewBox="0 0 24 24">
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconWave = () => (
  <svg viewBox="0 0 24 24">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const FEATURES = [
  // {
  //   icon: <IconCode />,
  //   title: "Curated Problems",
  //   desc: "Handpicked LeetCode problems by patterns and difficulty.",
  // },
  // {
  //   icon: <IconShare />,
  //   title: "Pattern Mastery",
  //   desc: "Master 75+ patterns to solve any problem with confidence.",
  // },
  // {
  //   icon: <IconHelp />,
  //   title: "Interview Roadmap",
  //   desc: "Step-by-step roadmap to crack top product company interviews.",
  // },
  // {
  //   icon: <IconWave />,
  //   title: "Track Progress",
  //   desc: "Analyze performance, maintain streaks and beat your best.",
  // },
];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      {/* Layers */}
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-ambient" />
      <div className="hero-wave" />

      {/* Main content */}
      <div className="hero-body">
        {/* LEFT */}
        <div className="hero-left">
          {/* <div className="hero-badge">
            <span className="hero-badge-dot" />
            PRACTICE DSA + INTERVIEW PREP
          </div> */}

          <div className="hero-headline">
            <span className="line1">Hack the</span>
            <span className="line2">Interview.</span>
          </div>

          <p className="hero-sub">
            Sharpen your DSA. Crack the interview.
            <br />
            Own the room.
          </p>

          <div className="hero-cta">
            <button className="btn-red" onClick={() => navigate("/problemSet")}>
              <span>&gt;_</span> START PRACTICING
            </button>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="features">
        {FEATURES.map(({ icon, title, desc }) => (
          <div className="feat" key={title}>
            <div className="feat-icon">{icon}</div>
            <div className="feat-title">{title}</div>
            <div className="feat-desc">{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
