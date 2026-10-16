import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RouteLoadingScreen from "../../components/RouteLoadingScreen.jsx";
import usePageStylesheets from "../../hooks/usePageStylesheets.js";
import { authenticate } from "./authService.js";

const featureCards = [
  ["fa-regular fa-calendar-check", "Expert Consultation Scheduling", "Seamlessly schedule and manage sessions with certified wellness experts."],
  ["fa-solid fa-brain", "Mental Health Support", "Connect employees with licensed psychologists and mental health professionals."],
  ["fa-solid fa-apple-whole", "Nutrition & Fitness Programs", "Personalized nutrition plans and fitness programs for employee needs."],
  ["fa-solid fa-chart-line", "Wellness Analytics Dashboard", "Track engagement, measure program effectiveness, and gain actionable insights."],
  ["fa-solid fa-shield-heart", "Secure Employee Management", "Enterprise-grade security and privacy protection for all employee data."],
  ["fa-solid fa-bullseye", "Program Tracking", "Monitor wellness initiatives and measure ROI for your wellness investment."],
];

function HomePage() {
  const stylesReady = usePageStylesheets("/homepage-legacy.css");
  const navigate = useNavigate();
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has("returnTo")) return;
    params.delete("returnTo");
    const search = params.toString();
    navigate({
      pathname: location.pathname,
      search: search ? `?${search}` : "",
      hash: location.hash,
    }, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!stylesReady) return undefined;
    const revealElements = Array.from(document.querySelectorAll(".home-page .reveal"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;
    if (reducedMotion.matches) revealElements.forEach((element) => element.classList.add("is-visible"));
    else if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          const siblings = Array.from(element.parentElement?.querySelectorAll(":scope > .reveal") || []);
          const index = Math.max(siblings.indexOf(element), 0);
          window.setTimeout(() => element.classList.add("is-visible"), Math.min(index * 90, 360));
          currentObserver.unobserve(element);
        });
      }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
      revealElements.forEach((element) => observer.observe(element));
    } else revealElements.forEach((element) => element.classList.add("is-visible"));
    return () => observer?.disconnect();
  }, [stylesReady]);

  useEffect(() => {
    if (!stylesReady || location.pathname !== "/" || !location.hash) return undefined;
    const targetId = decodeURIComponent(location.hash.slice(1));
    let frameId;
    const scrollToTarget = () => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const scheduleScroll = () => {
      frameId = window.requestAnimationFrame(scrollToTarget);
    };

    if (document.readyState === "complete") scheduleScroll();
    else window.addEventListener("load", scheduleScroll, { once: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("load", scheduleScroll);
    };
  }, [location.hash, location.pathname, stylesReady]);

  useEffect(() => {
    document.body.classList.toggle("modal-open", loginOpen);
    return () => document.body.classList.remove("modal-open");
  }, [loginOpen]);

  if (!stylesReady) return <RouteLoadingScreen />;

  async function submitLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await authenticate(form.username, form.password);
    setSubmitting(false);
    if (!result.ok) return setError(result.error);
    setLoginOpen(false);
    navigate(result.session.path);
  }

  function openLogin(event) {
    event?.preventDefault();
    setError("");
    setLoginOpen(true);
  }

  return (
    <div className="home-page">
      <header className="topbar"><div className="container nav-shell">
        <a href="#top" className="brand">Stack Builders</a>
        <nav className="nav-links" aria-label="Primary navigation"><a href="#features">Features</a><a href="#how-it-works">How It Works</a><a href="#pricing">Pricing</a><a href="#experts">Experts</a><a href="#about">About</a></nav>
        <div className="nav-actions"><a href="/company-request" className="request-btn">Request Company Approval</a><a href="#signin" className="signin-btn" onClick={openLogin}>Sign In</a></div>
      </div></header>

      <main id="top">
        <section className="hero-section"><div className="container hero-grid">
          <div className="hero-copy reveal reveal-left"><h1>Build a Healthier, Happier Workplace</h1><p>The all-in-one platform that helps organizations manage wellness experts, consultations, and employee wellbeing programs in one unified place.</p><div className="hero-actions"><a href="#signin" className="cta-btn" onClick={openLogin}>Get Started</a><a href="/company-request" className="cta-btn cta-btn--secondary">Request Company Approval</a></div></div>
          <div className="hero-visual reveal reveal-right"><div className="hero-image-card"><img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80" alt="Wellness workspace" /></div></div>
        </div></section>

        <section className="section aqua-section" id="features"><div className="container"><div className="section-heading reveal"><h2>Comprehensive Wellness Features</h2><p>Everything you need to create a thriving wellness culture in your organization</p></div><div className="feature-grid">{featureCards.map(([icon, title, description]) => <article className="feature-card reveal" key={title}><div className="feature-icon"><i className={icon}></i></div><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>

        <section className="section soft-section" id="how-it-works"><div className="container"><div className="section-heading reveal"><h2>How It Works</h2><p>Get started in three simple steps</p></div><div className="steps-grid">
          <article className="step-card reveal"><div className="step-top"><div className="step-icon"><i className="fa-solid fa-building-user"></i></div><span className="step-number">01</span></div><h3>Organizations Register</h3><p>Sign up and onboard your employees to the platform in minutes with our simple process.</p></article>
          <article className="step-card reveal"><div className="step-top"><div className="step-icon"><i className="fa-solid fa-user-doctor"></i></div><span className="step-number">02</span></div><h3>Register For Expert Sessions</h3><p>Employees browse available wellness experts and register for personalized consultation sessions.</p></article>
          <article className="step-card reveal"><div className="step-top"><div className="step-icon"><i className="fa-solid fa-chart-simple"></i></div><span className="step-number">03</span></div><h3>Track Progress</h3><p>Monitor wellness progress and measure program effectiveness with comprehensive analytics.</p></article>
        </div></div></section>

        <section className="section white-section" id="experts"><div className="container"><div className="section-heading reveal"><h2>Expert Categories</h2><p>Access a diverse network of qualified wellness professionals</p></div><div className="category-grid">
          <article className="category-card reveal"><div className="category-icon purple"><i className="fa-solid fa-head-side-virus"></i></div><h3>Psychologists</h3><p>Licensed mental health professionals</p></article>
          <article className="category-card reveal"><div className="category-icon green"><i className="fa-solid fa-leaf"></i></div><h3>Nutritionists</h3><p>Certified dietary and nutrition experts</p></article>
          <article className="category-card reveal"><div className="category-icon orange"><i className="fa-solid fa-dumbbell"></i></div><h3>Physical Wellness</h3><p>Fitness trainers and wellness coaches</p></article>
        </div></div></section>

        <section className="section white-section" id="pricing"><div className="container section-header reveal reveal-up"><h2>Simple, Transparent Pricing</h2><p>Choose the plan that fits your organization. Scale up anytime as your team grows.</p></div><div className="plans-grid reveal reveal-up">{[
          ["Starter", "₹100", "100 Employees", "10 Experts", "outline"], ["Business", "₹200", "1,000 Employees", "50 Experts", "primary"], ["Enterprise", "₹300", "10,000 Employees", "100 Experts", "outline"],
        ].map(([name, price, employeeLimit, expertLimit, tone]) => <div className={name === "Business" ? "plan-card featured" : "plan-card"} key={name}><div className="plan-name">{name}</div><div className="plan-price">{price}<span>/mo</span></div><div className="plan-period">Billed monthly</div><div className="plan-limits"><span className="limit-badge"><i className="fa fa-users"></i>&nbsp; {employeeLimit}</span><span className="limit-badge"><i className="fa fa-user-doctor"></i>&nbsp; {expertLimit}</span></div><ul className="plan-features"><li>All platform features included</li><li>Analytics &amp; reports</li><li>Wellness check-ins</li><li>Live sessions &amp; video library</li><li>Custom challenges</li><li>API access &amp; integrations</li></ul><a href="#signin" className={tone === "primary" ? "choose-btn primary" : "choose-btn outline"} onClick={openLogin}>Choose {name}</a></div>)}</div></section>

        <section className="section aqua-section" id="about"><div className="container"><div className="section-heading reveal"><h2>Why Choose Our Platform</h2><p>Transform your workplace with measurable wellness benefits</p></div><div className="benefit-grid">
          <article className="benefit-card reveal"><div className="benefit-icon"><i className="fa-solid fa-heart-pulse"></i></div><div><h3>Improved Employee Wellbeing</h3><p>Boost physical and mental health across your organization with personalized wellness support.</p></div></article>
          <article className="benefit-card reveal"><div className="benefit-icon"><i className="fa-solid fa-sliders"></i></div><div><h3>Easy Program Management</h3><p>Manage all your wellness activities with intuitive tools that save time and effort.</p></div></article>
          <article className="benefit-card reveal"><div className="benefit-icon"><i className="fa-solid fa-chart-pie"></i></div><div><h3>Data-Driven Insights</h3><p>Make informed decisions with detailed analytics and reporting on wellness program effectiveness.</p></div></article>
          <article className="benefit-card reveal"><div className="benefit-icon"><i className="fa-solid fa-scale-balanced"></i></div><div><h3>Better Work-Life Balance</h3><p>Help employees maintain harmony between professional responsibilities and personal wellness goals.</p></div></article>
        </div></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-grid">
        <div className="footer-brand-block"><h3>Stack Builders</h3><p>Transforming workplace wellness through a thoughtful platform for experts, organizations, and employees.</p><div className="footer-socials"><a href="#instagram" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a><a href="#youtube" aria-label="Youtube"><i className="fa-brands fa-youtube"></i></a><a href="#twitter" aria-label="Twitter"><i className="fa-brands fa-x-twitter"></i></a><a href="#linkedin" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a></div></div>
        <div className="footer-links-block"><h4>Quick Links</h4><div className="footer-links"><a href="#features">Features</a><a href="#how-it-works">How It Works</a><a href="#experts">Experts</a><a href="#about">About</a></div></div>
        <div className="footer-contact-block"><h4>Contact Us</h4><div className="footer-contact-list"><a href="mailto:sudeepchandra2002@gmail.com"><i className="fa-regular fa-envelope"></i> sudeepchandra2002@gmail.com</a><a href="tel:+919703096488"><i className="fa-solid fa-phone"></i> +91 9703096488</a><a href="#location"><i className="fa-solid fa-location-dot"></i> Sri city, India</a></div></div>
      </div><div className="container footer-bottom"><p>© 2026 Stack Builders. All rights reserved.</p><a href="#privacy">Privacy Policy</a></div></footer>

      <div className="signup-modal" id="signupModal" aria-hidden={!loginOpen} hidden={!loginOpen}><div className="signup-modal__backdrop" onClick={() => setLoginOpen(false)}></div><div className="signup-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="signupModalTitle"><button type="button" className="signup-modal__close" onClick={() => setLoginOpen(false)} aria-label="Close sign in dialog"><i className="fa-solid fa-xmark"></i></button><section className="signup-card"><div className="signup-card__brand"><h2>Stack Builders</h2><span className="signup-card__underline"></span></div><div className="signup-card__copy"><h3 id="signupModalTitle">Sign In to Stack Builders</h3><p>Enter your credentials to manage your wellness journey</p></div><form className="signup-card__form" onSubmit={submitLogin}><label className="signup-card__field"><span>Gmail</span><div className="signup-card__input-wrap"><i className="fa-regular fa-user"></i><input id="homepageSigninUsername" name="username" type="email" placeholder="Enter your Gmail" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></div></label><label className="signup-card__field"><span>Password</span><div className="signup-card__input-wrap"><i className="fa-solid fa-lock"></i><input id="homepageSigninPassword" name="password" type="password" placeholder="Enter your password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></label><p className="signup-card__error" hidden={!error}>{error}</p><div className="signup-card__actions"><button type="submit" className="signup-card__submit" disabled={submitting}>{submitting ? "Signing In…" : "Sign In"}</button><button type="button" className="signup-card__secondary" onClick={() => setLoginOpen(false)}>Back</button></div><div className="signup-card__link-row"><a href="/company-request" className="signup-card__request-link">Request Company Approval</a></div></form></section></div></div>
    </div>
  );
}

export default HomePage;
