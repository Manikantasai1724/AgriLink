import { describe, it, expect } from "vitest";
import { calculateBuyerMatches, assessProduceQuality } from "../aiMatching";
import { ProduceLot, BuyerDemand } from "@shared/schema";
import { INITIAL_MARKET_PRICES } from "../data/marketData";

describe("AgriLink Core Logic & Matching Engine", () => {
  it("calculates net realization accurately (Gross minus transport freight)", () => {
    const tomatoMandi = INITIAL_MARKET_PRICES.find((p) => p.crop === "Tomato" && p.marketName === "Pimpalgaon Mandi")!;
    expect(tomatoMandi).toBeDefined();
    // Modal 2700 - Transport 95 = Net 2605
    expect(tomatoMandi.netRealization).toBe(tomatoMandi.modalPrice - tomatoMandi.transportCostPerQtl);
    expect(tomatoMandi.netRealization).toBe(2605);
  });

  it("scores compatible buyer matches and ranks by highest net realization", () => {
    const sampleLot: ProduceLot = {
      id: "lot-test-01",
      lotNumber: "AGL-TOM-2026-000101",
      sellerId: "farmer-01",
      sellerName: "Ramesh Farmer",
      sellerRole: "farmer",
      crop: "Tomato",
      variety: "Hybrid Red",
      quantity: 100,
      unit: "Quintal",
      harvestDate: "2026-09-08",
      expectedSellingDate: "2026-09-10",
      location: "Nashik",
      expectedPricePerUnit: 2700,
      qualityGrade: "Grade A",
      images: [],
      certifications: [],
      pickupRequirement: "Buyer Pickup",
      status: "Available",
      fpoAggregated: false,
      createdAt: new Date(),
    };

    const demands: BuyerDemand[] = [
      {
        id: "dem-01",
        buyerId: "byr-01",
        buyerName: "Buyer Processor",
        buyerType: "Processor",
        verificationStatus: "Verified",
        crop: "Tomato",
        variety: "Hybrid Red",
        requiredQuantity: 120,
        unit: "Quintal",
        minQualityGrade: "Grade A",
        location: "Dindori",
        distanceKm: 30,
        pickupRequirement: "Buyer Pickup",
        expectedDeliveryDate: "2026-09-11",
        targetPricePerUnit: 2750,
        paymentTerms: "100% on delivery",
        reliabilityScore: 4.9,
        active: true,
        createdAt: new Date(),
      },
      {
        id: "dem-02",
        buyerId: "byr-02",
        buyerName: "Buyer Distant",
        buyerType: "Trader",
        verificationStatus: "Verified",
        crop: "Tomato",
        variety: "Any",
        requiredQuantity: 80,
        unit: "Quintal",
        minQualityGrade: "Grade B",
        location: "Mumbai",
        distanceKm: 150,
        pickupRequirement: "Seller Delivery",
        expectedDeliveryDate: "2026-09-11",
        targetPricePerUnit: 2700,
        paymentTerms: "T+1 release",
        reliabilityScore: 4.5,
        active: true,
        createdAt: new Date(),
      },
      {
        id: "dem-03",
        buyerId: "byr-03",
        buyerName: "Potato Buyer",
        buyerType: "Processor",
        verificationStatus: "Verified",
        crop: "Potato",
        requiredQuantity: 200,
        unit: "Quintal",
        minQualityGrade: "Grade A",
        location: "Agra",
        distanceKm: 50,
        pickupRequirement: "Buyer Pickup",
        expectedDeliveryDate: "2026-09-12",
        targetPricePerUnit: 1600,
        paymentTerms: "Advance",
        reliabilityScore: 5.0,
        active: true,
        createdAt: new Date(),
      },
    ];

    const matches = calculateBuyerMatches(sampleLot, demands);

    // Potato buyer must be filtered out for Tomato lot
    expect(matches.length).toBe(2);

    // Recommended match should be Buyer Processor due to higher Net Realization (Buyer Pickup = ₹2,750 net)
    expect(matches[0].buyerDemand.buyerName).toBe("Buyer Processor");
    expect(matches[0].isRecommended).toBe(true);
    expect(matches[0].matchScore).toBeGreaterThanOrEqual(80);
    expect(matches[0].estimatedNetRealizationPerQtl).toBe(2750);
  });

  it("grades quality with decision-support thresholds", () => {
    const gradeA = assessProduceQuality("Tomato", {
      moisturePercent: 11,
      defectPercent: 2,
    });
    expect(gradeA.suggestedGrade).toBe("Grade A");
    expect(gradeA.disclaimer).toContain("AI-assisted decision-support");

    const gradeC = assessProduceQuality("Tomato", {
      moisturePercent: 19,
      defectPercent: 9,
    });
    expect(gradeC.suggestedGrade).toBe("Grade C");
  });
});
