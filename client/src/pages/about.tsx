import LandingNavbar from "@/components/LandingNavbar";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/hooks/useAuth";
import type React from "react";
import { Link } from "wouter";
import "./about.css";

const About: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <>
      {loading ? (
        <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm h-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">AgriLink...</div>
        </nav>
      ) : user ? (
        <NavigationHeader />
      ) : (
        <LandingNavbar />
      )}
    <div className="about-container">
      <h1 className="fade-in">About AgriLink</h1>
      <p className="fade-in delay-1">
        AgriLink is a smart digital platform that helps farmers and FPOs make better selling decisions by providing localized market intelligence and connecting them directly with verified buyers.
      </p>

      <div className="about-sections fade-in delay-2">
        <section>
          <h2>Our Mission</h2>
          <p>
            Improve farmer price realization, reduce information asymmetry, eliminate unnecessary intermediaries, and enable transparent farm-to-buyer transactions.
          </p>
        </section>

        <section>
          <h2>Our Vision</h2>
          <p>
            Build an equitable agricultural marketplace where mandi prices are transparent, AI guides optimal selling windows, and verified processors, retailers, and institutional buyers purchase directly from farmers and FPOs.
          </p>
        </section>

        <section>
          <h2>Why AgriLink?</h2>
          <ul>
            <li>
              <strong>Localized Market Intelligence:</strong> Real-time mandi comparisons across modal prices, arrival volumes, and transport deductions.
            </li>
            <li>
              <strong>AI Selling Recommendations:</strong> Data-driven selling window guidance to help farmers maximize net realization.
            </li>
            <li>
              <strong>Verified Buyer Network:</strong> Guaranteed transaction counter-parties including food processors, modern retailers, and aggregators.
            </li>
            <li>
              <strong>FPO Aggregation:</strong> Empower Farmer Producer Organizations to pool harvest quantities and negotiate bulk contracts.
            </li>
            <li>
              <strong>Logistics & Storage:</strong> Integrated transport coordination, cold storage bookings, and escrow payment tracking.
            </li>
          </ul>
        </section>
      </div>

      <p className="fade-in delay-3">
        At AgriLink, we are committed to building a transparent, technology-driven future for agricultural trade.
      </p>

      <Link href={user ? "/dashboard" : "/"} className="back-link fade-in delay-4">
        ← Back{" "}
      </Link>
    </div>
    </>
  );
};

export default About;