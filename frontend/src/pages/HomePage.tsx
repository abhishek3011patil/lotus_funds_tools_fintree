import {
  ArrowForwardRounded,
  AutoGraphRounded,
  BusinessCenterRounded,
  GroupsRounded,
  InsightsRounded,
  LockRounded,
  PersonSearchRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import "./HomePage.css";

const portals = [
  {
    name: "Research Analyst",
    description: "Publish research calls, track performance and manage your client network.",
    path: "/login",
    registration: "/registration",
    icon: <InsightsRounded />,
    tone: "blue",
  },
  {
    name: "Client",
    description: "Discover analysts and follow research through one focused dashboard.",
    path: "/client/login",
    registration: "/client/register",
    icon: <PersonSearchRounded />,
    tone: "green",
  },
  {
    name: "Broker",
    description: "Connect with analysts and bring research-led opportunities to your clients.",
    path: "/broker/login",
    registration: "/register/broker",
    icon: <BusinessCenterRounded />,
    tone: "violet",
  },
];

const HomePage = () => (
  <div className="home-page">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="home-nav">
      <Link className="brand" to="/" aria-label="Tarkashh home">
        <span className="brand-mark" aria-hidden="true">↗</span>
        <span>Tarkashh</span>
      </Link>
      <nav aria-label="Main navigation">
        <a href="#platform">Platform</a>
        <a href="#portals">Portals</a>
        <Link className="nav-cta" to="/login">Sign in</Link>
      </nav>
    </header>

    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Research, connected</div>
          <h1 id="hero-title">Better research.<br /><em>Clearer decisions.</em></h1>
          <p>
            One thoughtfully built platform for research analysts, investors and brokers to
            connect, communicate and move with context.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#portals">
              Choose your portal <ArrowForwardRounded />
            </a>
            <Link className="secondary-action" to="/registration">Join as an analyst</Link>
          </div>
          <div className="trust-row" aria-label="Platform highlights">
            <span><VerifiedUserRounded /> Role-based access</span>
            <span><LockRounded /> Secure workspace</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="dashboard-card">
            <div className="dashboard-top">
              <span>Market overview</span>
              <span className="live-dot">Live</span>
            </div>
            <div className="metric-row">
              <div><small>Research calls</small><strong>24</strong></div>
              <div><small>Active ideas</small><strong>08</strong></div>
            </div>
            <svg viewBox="0 0 480 180">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4f6cf8" stopOpacity=".28" />
                  <stop offset="1" stopColor="#4f6cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M8 144 C68 132 78 84 132 102 S210 132 254 76 S332 58 365 72 S426 51 472 20 L472 174 L8 174 Z" fill="url(#area)" />
              <path d="M8 144 C68 132 78 84 132 102 S210 132 254 76 S332 58 365 72 S426 51 472 20" fill="none" stroke="#4f6cf8" strokeWidth="7" strokeLinecap="round" />
              <circle cx="472" cy="20" r="10" fill="#22c55e" stroke="#fff" strokeWidth="5" />
            </svg>
            <div className="ticker-row"><span>NIFTY 50</span><b>+1.24%</b><span>BANK NIFTY</span><b>+0.82%</b></div>
          </div>
          <div className="floating-note note-one"><AutoGraphRounded /><span><b>Structured insights</b><small>Built for clarity</small></span></div>
          <div className="floating-note note-two"><GroupsRounded /><span><b>One ecosystem</b><small>Three dedicated portals</small></span></div>
        </div>
      </section>

      <section className="platform-strip" id="platform" aria-label="Tarkashh platform principles">
        <div><b>01</b><span>Role-specific<br />workspaces</span></div>
        <div><b>02</b><span>Research-led<br />communication</span></div>
        <div><b>03</b><span>Transparent<br />performance</span></div>
      </section>

      <section className="portal-section" id="portals" aria-labelledby="portal-title">
        <div className="section-heading">
          <div><span className="kicker">Your workspace</span><h2 id="portal-title">Enter Tarkashh your way.</h2></div>
          <p>Each portal is designed around what you need to see and do—without the noise.</p>
        </div>
        <div className="portal-grid">
          {portals.map((portal, index) => (
            <article className={`portal-card ${portal.tone}`} key={portal.name}>
              <div className="portal-number">0{index + 1}</div>
              <div className="portal-icon">{portal.icon}</div>
              <h3>{portal.name}</h3>
              <p>{portal.description}</p>
              <div className="portal-links">
                <Link to={portal.path}>Open portal <ArrowForwardRounded /></Link>
                <Link to={portal.registration}>Create account</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>

    <footer className="home-footer">
      <div className="brand"><span className="brand-mark" aria-hidden="true">↗</span><span>Tarkashh</span></div>
      <p>Research made easier to understand and act on.</p>
      <Link to="/login-admin">Company access</Link>
    </footer>
  </div>
);

export default HomePage;
