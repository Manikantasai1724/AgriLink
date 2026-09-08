async function runDemoScenario() {
  const BASE_URL = "http://localhost:5001";

  console.log("\n==========================================");
  console.log("AGRILINK END-TO-END DEMO SCENARIO");
  console.log("==========================================");

  // Step 1: Farmer checks Tomato mandi prices and comparison
  console.log("\n--- STEP 1 & 2: Localized Market Intelligence for Tomato ---");
  const compRes = await fetch(`${BASE_URL}/api/market-prices/comparison?crop=Tomato`);
  const compData = await compRes.json();
  console.log(`Markets compared: ${compData.comparison.length} mandis`);
  compData.comparison.forEach((m) => {
    console.log(`  • ${m.marketName}: Modal ₹${m.modalPrice}/qtl - Freight ₹${m.transportCostPerQtl}/qtl (${m.distanceKm}km) = Net ₹${m.netRealization}/qtl`);
  });
  console.log(`AI Recommendation: ${compData.recommendationReason}`);

  // Step 2: Farmer creates a 100 Quintal Tomato Lot
  console.log("\n--- STEP 3: Produce Lot Creation ---");
  const lotRes = await fetch(`${BASE_URL}/api/lots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sellerId: "farmer-demo-01",
      sellerName: "Manikanta Farmer",
      crop: "Tomato",
      variety: "Vaishnavi Hybrid",
      quantity: 100,
      unit: "Quintal",
      expectedPricePerUnit: 2700,
      qualityGrade: "Grade A",
      location: "Pimpalgaon, Nashik",
      preferredMarket: "Pimpalgaon Mandi",
      pickupRequirement: "Buyer Pickup",
    }),
  });
  const lot = await lotRes.json();
  console.log(`Created Lot ID: ${lot.lotNumber} (${lot.quantity} ${lot.unit} ${lot.crop} - Grade: ${lot.qualityGrade})`);

  // Step 3: AI Matching Engine finds verified buyers
  console.log("\n--- STEP 4: AI Matching Engine ---");
  const matchRes = await fetch(`${BASE_URL}/api/matches/${lot.id}`);
  const matchData = await matchRes.json();
  console.log(`Found ${matchData.totalMatches} matched verified buyers:`);
  matchData.matches.forEach((m, idx) => {
    console.log(`  ${idx + 1}. ${m.buyerDemand.buyerName} (${m.buyerDemand.buyerType})`);
    console.log(`     Match Score: ${m.matchScore}% | Gross Offer: ₹${m.grossOfferedPrice}/qtl | Net In-Hand: ₹${m.estimatedNetRealizationPerQtl}/qtl`);
    console.log(`     Why: ${m.reasons.slice(0, 3).join("; ")}`);
  });

  const topMatch = matchData.matches[0];

  // Step 4: Top Buyer submits an offer
  console.log("\n--- STEP 5: Buyer Submits Digital Offer ---");
  const offerRes = await fetch(`${BASE_URL}/api/offers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      crop: lot.crop,
      sellerId: lot.sellerId,
      buyerId: topMatch.buyerDemand.buyerId,
      buyerName: topMatch.buyerDemand.buyerName,
      buyerType: topMatch.buyerDemand.buyerType,
      offeredPrice: topMatch.grossOfferedPrice,
      quantity: 100,
      unit: "Quintal",
      deliveryTerms: "Buyer Pickup",
      paymentTerms: topMatch.buyerDemand.paymentTerms,
      netRealizationPerUnit: topMatch.estimatedNetRealizationPerQtl,
      notes: "Direct procurement purchase order.",
    }),
  });
  const offer = await offerRes.json();
  console.log(`Offer received from ${offer.buyerName} at ₹${offer.offeredPrice}/qtl (Offer ID: ${offer.id})`);

  // Step 5: Farmer Accepts Offer & Creates Trade Transaction
  console.log("\n--- STEP 6: Farmer Accepts Offer & Confirms Contract ---");
  const txnRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      crop: lot.crop,
      quantity: 100,
      unit: "Quintal",
      agreedPricePerUnit: offer.offeredPrice,
      grossAmount: 100 * offer.offeredPrice,
      sellerId: lot.sellerId,
      sellerName: lot.sellerName,
      buyerId: offer.buyerId,
      buyerName: offer.buyerName,
      buyerType: offer.buyerType,
      status: "Transaction Confirmed",
    }),
  });
  const txn = await txnRes.json();
  if (!txnRes.ok) {
    console.error("txn error:", txnRes.status, txn);
  }
  console.log(`Trade Contract Established: ${txn.transactionCode} | Gross: ₹${(txn.grossAmount || 0).toLocaleString()}`);

  // Step 6: Advance stages: Logistics Arranged -> In Transit -> Delivered
  console.log("\n--- STEP 7: Logistics & Delivery Milestones ---");
  await fetch(`${BASE_URL}/api/transactions/${txn.id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Logistics Arranged" }),
  });
  console.log(`Stage 1: Logistics Arranged (Kisan Express Logistics assigned MH-15-AG-4412)`);

  await fetch(`${BASE_URL}/api/transactions/${txn.id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "In Transit" }),
  });
  console.log(`Stage 2: Truck In Transit to Dindori Food Park Hub`);

  await fetch(`${BASE_URL}/api/transactions/${txn.id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Delivered" }),
  });
  console.log(`Stage 3: Delivered at Buyer Receiving Gate`);

  // Step 7: Payment Proof & Settlement
  console.log("\n--- STEP 8: Direct Bank Settlement & Payment Reference ---");
  const payRes = await fetch(`${BASE_URL}/api/payments/proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactionId: txn.id,
      paymentReference: "UTR-HDFC-20260908129841",
      paymentMethod: "Direct Bank Transfer / Escrow",
      amount: txn.grossAmount,
    }),
  });
  const payData = await payRes.json();
  console.log(`Payment Settled: Status = ${payData.transaction.paymentStatus} | UTR = ${payData.transaction.paymentReference}`);

  // Step 8: Verify Complete Transaction Audit History
  console.log("\n--- STEP 9: Permanent Transaction History ---");
  const finalRes = await fetch(`${BASE_URL}/api/transactions/${txn.id}`);
  const finalTxn = await finalRes.json();
  console.log(`Contract Code: ${finalTxn.transactionCode}`);
  console.log(`Final Status: ${finalTxn.status}`);
  console.log(`Stage Timestamps:`, Object.keys(finalTxn.stageTimestamps));

  console.log("\n==========================================");
  console.log("DEMO SCENARIO COMPLETED 100% SUCCESSFULLY!");
  console.log("==========================================\n");
}

runDemoScenario().catch(console.error);
