import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import LandingNavbar from "../components/LandingNavbar";
import { 
  ArrowRight, 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  PackageCheck,
  Star,
  ChevronUp
} from "lucide-react";
import "./LandingPage.css";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [showButton, setShowButton] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      setLocation("/login");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 150);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const workflowSteps = [
    {
      num: 1,
      title: "Discover Prices",
      subtitle: "Localized Mandi Intelligence",
      description: "Compare real-time modal prices across nearby APMC markets. Automated net-realization calculators deduct freight expenses so you choose the market that yields maximum in-hand return.",
      icon: BarChart3,
    },
    {
      num: 2,
      title: "Find Verified Buyers",
      subtitle: "Direct B2B Procurement",
      description: "Browse verified demand from food processors, supermarket chains, and bulk institutional buyers. Zero unverified traders; guaranteed GSTIN and bank credentials.",
      icon: Building2,
    },
    {
      num: 3,
      title: "Compare Offers",
      subtitle: "Transparent Digital Negotiation",
      description: "Receive competing purchase bids against your digital produce lots. Counter-offer with ease and let our AI matching engine evaluate net earnings per quintal.",
      icon: Scale,
    },
    {
      num: 4,
      title: "Complete Transaction",
      subtitle: "Logistics & Escrow Settlement",
      description: "Coordinate farm-gate carrier pickups, track transit milestones in real-time, and confirm direct bank deposits or escrow settlements with complete audit transparency.",
      icon: ShieldCheck,
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "AI Selling Window Recommendations",
      desc: "Data-driven advisories evaluating 7-day arrival trends, wholesale volumes, and historical spikes to pinpoint your most lucrative harvest selling window.",
    },
    {
      icon: Scale,
      title: "Net Realization Optimization",
      desc: "Never pick a mandi based on gross price alone. AgriLink calculates transport freight and storage fees to reveal your actual take-home profit.",
    },
    {
      icon: PackageCheck,
      title: "Digital Lots & Quality Grading",
      desc: "Create standardized digital lots with visual parameter checklists and optional AI-assisted grade suggestions before buyer presentation.",
    },
    {
      icon: Users,
      title: "FPO Aggregation Hub",
      desc: "Empowers Farmer Producer Organizations to pool smallholder harvests into bulk commercial lots, commanding premium institutional contracts.",
    },
    {
      icon: Truck,
      title: "Logistics & Storage Coordination",
      desc: "Connect directly with rated agricultural haulers and reserve nearby cold chain warehouse space to curb post-harvest perishability.",
    },
    {
      icon: CreditCard,
      title: "Payment Proof & Grievance Arbitrage",
      desc: "Track every payment milestone with verified UTR bank references, backed by structured dispute management for quality or rate discrepancies.",
    },
  ];

  return (
    <div className="landing-page">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Farmer Market Intelligence & Direct Buyer Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Know the Market. <br />
          Find the Right Buyer. <br />
          <span className="text-emerald-600 dark:text-emerald-400">Sell with Confidence.</span>
        </h1>

        <p className="hero-desc max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg mt-4">
          AgriLink connects farmers and FPOs directly with verified bulk buyers, processors, and retailers. 
          Get localized mandi price comparisons, AI-recommended selling windows, and transparent end-to-end digital transactions.
        </p>

        <div className="hero-actions flex flex-wrap justify-center gap-4 mt-8">
          <button className="primary-btn get-started" onClick={handleGetStarted}>
            Get Started Now <ArrowRight className="inline-block ml-2 w-4 h-4" />
          </button>
          <button className="secondary-btn explore" onClick={() => scrollToSection("four-steps")}>
            How It Works
          </button>
        </div>
      </section>

      {/* 4-Step Core Platform Workflow */}
      <section id="four-steps" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">The AgriLink Workflow</span>
          <h2 className="text-3xl font-extrabold text-foreground">Four Steps to Fair Agricultural Trade</h2>
          <p className="text-sm text-muted-foreground">
            Eliminate information asymmetry and predatory middlemen through structured, verifiable trade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            const isActive = activeWorkflowStep === step.num;
            return (
              <div
                key={step.num}
                onClick={() => setActiveWorkflowStep(step.num)}
                className={`rounded-2xl border p-6 transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "border-emerald-600 bg-emerald-500/5 shadow-md scale-102"
                    : "bg-card border-border hover:border-border/80"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base">
                      {step.num}
                    </div>
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    <span className="text-xs font-semibold text-emerald-600 block mb-2">{step.subtitle}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t flex items-center text-xs font-bold text-emerald-600 gap-1">
                  <span>Step {step.num} Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-muted/30 border-y py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Core Capabilities</span>
            <h2 className="text-3xl font-extrabold text-foreground">Engineered for Farmers, FPOs & Buyers</h2>
            <p className="text-sm text-muted-foreground">
              A comprehensive marketplace ecosystem built to protect smallholder price realization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-card border rounded-2xl p-6 shadow-sm space-y-3 hover:border-primary/40 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-10 text-white shadow-xl space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black">
            Ready to Maximize Your Harvest Realization?
          </h2>
          <p className="text-white/90 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of progressive farmers and verified procurement institutions trading seamlessly on AgriLink.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleGetStarted}
              className="bg-white text-emerald-800 font-bold px-8 py-3 rounded-xl shadow hover:bg-white/90 transition-all text-sm"
            >
              Open Your AgriLink Account
            </button>
            <button
              onClick={() => setLocation("/market-intelligence")}
              className="bg-emerald-700/50 hover:bg-emerald-700 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
            >
              Check Live Mandi Prices
            </button>
          </div>
        </div>
      </section>

      {/* Scroll to Top */}
      {showButton && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-white shadow-lg z-50 hover:bg-primary/90 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
