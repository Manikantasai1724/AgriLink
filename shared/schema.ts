import { z } from "zod";

// -------------------- User --------------------
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  username: z.string(),
  role: z.string().default("farmer"),
  password: z.string().nullable().optional(),
  firebaseUid: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  roleSelected: z.boolean().default(false),
  language: z.string().default("en"),
  notificationsEnabled: z.boolean().default(true),
  createdAt: z.date(),
});
export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  createdAt: z.date().optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// -------------------- Product --------------------
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable().optional(),
  quantity: z.string(),
  unit: z.string(),
  farmName: z.string(),
  location: z.string(),
  harvestDate: z.date(),
  certifications: z.array(z.string()).nullable().optional(),
  qrCode: z.string().nullable().optional(),
  batchId: z.string().nullable().optional(),
  ownerId: z.string(),
  blockchainHash: z.string().nullable().optional(),
  status: z.string().default("registered"),
  price: z.string().nullable().optional(),
  createdAt: z.date(),
  // Add these new fields
  distributorName: z.string().nullable().optional(),
  warehouseLocation: z.string().nullable().optional(),
  storeName: z.string().nullable().optional(),
  storeLocation: z.string().nullable().optional(),
  averageRating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().min(0).optional(),
  ratingSum: z.number().min(0).optional(),
});
export type Product = z.infer<typeof productSchema>;

export const insertProductSchema = productSchema.omit({ id: true, createdAt: true }).extend({
  createdAt: z.date().optional(),
  name: z.string().trim().min(1, "Product name is required"),
  farmName: z.string().trim().min(1, "Farm name is required"),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required")
    .refine((value) => Number(value) > 0, "Quantity must be a positive number"),
  harvestDate: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date()),
  price: z.string().nullable().optional(), // Add to insert schema too
});
export type InsertProduct = z.infer<typeof insertProductSchema>;

// -------------------- Transaction --------------------
export const transactionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  fromUserId: z.string().nullable().optional(),
  toUserId: z.string().nullable().optional(),
  transactionType: z.string(),
  location: z.string().nullable().optional(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable()
    .optional(),
  temperature: z.string().nullable().optional(),
  humidity: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  blockchainHash: z.string().nullable().optional(),
  verified: z.boolean().default(false),
  timestamp: z.date(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const insertTransactionSchema = transactionSchema
  .omit({ id: true, timestamp: true })
  .extend({
    timestamp: z.date().optional(),
  });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// -------------------- QualityCheck --------------------
export const qualityCheckSchema = z.object({
  id: z.string(),
  productId: z.string(),
  inspectorId: z.string(),
  checkType: z.string(),
  score: z.string(),
  notes: z.string().nullable().optional(),
  certificationUrl: z.string().nullable().optional(),
  verified: z.boolean().default(false),
  timestamp: z.date(),
});
export type QualityCheck = z.infer<typeof qualityCheckSchema>;

export const insertQualityCheckSchema = qualityCheckSchema
  .omit({ id: true, verified: true, timestamp: true })
  .extend({
    timestamp: z.date().optional(),
  });
export type InsertQualityCheck = z.infer<typeof insertQualityCheckSchema>;

// -------------------- Scan --------------------
export const scanSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable()
    .optional(),
  timestamp: z.date(),
});
export type Scan = z.infer<typeof scanSchema>;

export const insertScanSchema = scanSchema.omit({ id: true, timestamp: true }).extend({
  timestamp: z.date().optional(),
});
export type InsertScan = z.infer<typeof insertScanSchema>;

// -------------------- OwnershipTransfer --------------------
export const ownershipTransferSchema = z.object({
  id: z.string(),
  productId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  transferType: z.string(),
  status: z.string().default("pending"),
  notes: z.string().nullable().optional(),
  expectedDelivery: z.date().nullable().optional(),
  actualDelivery: z.date().nullable().optional(),
  blockchainHash: z.string().nullable().optional(),
  paymentProofUrl: z.string().nullable().optional(),
  timestamp: z.date(),
});
export type OwnershipTransfer = z.infer<typeof ownershipTransferSchema>;

export const insertOwnershipTransferSchema = ownershipTransferSchema
  .omit({ id: true, timestamp: true })
  .extend({
    expectedDelivery: z.date().nullable().optional(),
    actualDelivery: z.date().nullable().optional(),
    timestamp: z.date().optional(),
  });
export type InsertOwnershipTransfer = z.infer<typeof insertOwnershipTransferSchema>;

// -------------------- Notification --------------------
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum([
    "ownership_request",
    "product_request",
    "ownership_transfer",
    "ownership_transfer_rejected",
    "ownership_request_accepted",
    "product_received",
    "product_out_for_delivery",
    "product_event",
  ]),
  productId: z.string().optional(),
  transferId: z.string().optional(),
  fromUserId: z.string().optional(), // <-- Add this line
  read: z.boolean().default(false),
  createdAt: z.date(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const insertNotificationSchema = notificationSchema
  .omit({ id: true, createdAt: true })
  .extend({
    createdAt: z.date().optional(),
  });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// -------------------- ProductOwner (Blockchain-style ownership record) --------------------
export const productOwnerSchema = z.object({
  id: z.string(),
  productId: z.string(),
  ownerId: z.string(),
  username: z.string(),
  name: z.string(),
  addedBy: z.string(),
  role: z.string(),
  canEditFields: z.array(z.string()),
  transferType: z.string().optional(), // "initial", "transfer", "sale", etc.
  blockNumber: z.number().optional(), // Blockchain-style block number
  previousOwnerHash: z.string().nullable().optional(), // Hash of previous ownership record
  ownershipHash: z.string().optional(), // Hash of this ownership record
  createdAt: z.date(),
});
export type ProductOwner = z.infer<typeof productOwnerSchema>;

export const insertProductOwnerSchema = productOwnerSchema
  .omit({ id: true, createdAt: true, blockNumber: true, ownershipHash: true })
  .extend({
    createdAt: z.date().optional(),
  });
export type InsertProductOwner = z.infer<typeof insertProductOwnerSchema>;

// -------------------- ProductComment --------------------
export const productCommentSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  message: z.string(),
  createdAt: z.date(),
});
export type ProductComment = z.infer<typeof productCommentSchema>;

export const insertProductCommentSchema = productCommentSchema
  .omit({ id: true, createdAt: true })
  .extend({
    createdAt: z.date().optional(),
  });
export type InsertProductComment = z.infer<typeof insertProductCommentSchema>;

// -------------------- ProductRating --------------------
export const productRatingSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().max(1000).nullable().optional(),
  createdAt: z.date(),
});
export type ProductRating = z.infer<typeof productRatingSchema>;

export const insertProductRatingSchema = productRatingSchema
  .omit({ id: true, createdAt: true })
  .extend({
    review: z.string().trim().max(1000).nullable().optional(),
    createdAt: z.date().optional(),
  });
export type InsertProductRating = z.infer<typeof insertProductRatingSchema>;

// ==========================================
// AGRILINK DATA SCHEMAS
// ==========================================

// -------------------- Market Price & Arrival --------------------
export const marketPriceSchema = z.object({
  id: z.string(),
  crop: z.string(),
  marketName: z.string(),
  district: z.string(),
  state: z.string(),
  minPrice: z.number(),
  maxPrice: z.number(),
  modalPrice: z.number(),
  arrivalVolumeTons: z.number(),
  distanceKm: z.number(),
  transportCostPerQtl: z.number(),
  netRealization: z.number(),
  date: z.string(),
  priceTrend5d: z.enum(["up", "down", "stable"]).default("stable"),
  priceChangePercent: z.number().default(0),
  isDemoData: z.boolean().default(true),
});
export type MarketPrice = z.infer<typeof marketPriceSchema>;

// -------------------- Buyer Demand --------------------
export const buyerDemandSchema = z.object({
  id: z.string(),
  buyerId: z.string(),
  buyerName: z.string(),
  buyerType: z.enum(["Processor", "Retailer", "Institutional Buyer", "Trader", "Aggregator"]),
  verificationStatus: z.enum(["Verified", "Pending", "Unverified"]).default("Verified"),
  crop: z.string(),
  variety: z.string().optional(),
  requiredQuantity: z.number(),
  unit: z.string().default("Quintal"),
  minQualityGrade: z.enum(["Grade A", "Grade B", "Grade C", "Standard"]),
  location: z.string(),
  distanceKm: z.number().default(25),
  pickupRequirement: z.enum(["Buyer Pickup", "Seller Delivery", "Flexible"]).default("Buyer Pickup"),
  expectedDeliveryDate: z.string(),
  targetPricePerUnit: z.number(),
  paymentTerms: z.string().default("100% on Delivery Verification"),
  reliabilityScore: z.number().min(0).max(5).default(4.8),
  active: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
});
export type BuyerDemand = z.infer<typeof buyerDemandSchema>;

// -------------------- Produce Lot --------------------
export const produceLotSchema = z.object({
  id: z.string(),
  lotNumber: z.string(), // e.g., AGL-TOM-2026-000142
  sellerId: z.string(),
  sellerName: z.string(),
  sellerRole: z.enum(["farmer", "fpo"]).default("farmer"),
  crop: z.string(),
  variety: z.string().optional(),
  quantity: z.number(),
  unit: z.string().default("Quintal"),
  harvestDate: z.string(),
  expectedSellingDate: z.string(),
  location: z.string(),
  preferredMarket: z.string().optional(),
  expectedPricePerUnit: z.number(),
  qualityGrade: z.enum(["Grade A", "Grade B", "Grade C", "Standard"]).default("Grade A"),
  qualityParameters: z
    .object({
      moisturePercent: z.number().optional(),
      sizeCategory: z.string().optional(),
      colorUniformity: z.string().optional(),
      defectPercent: z.number().optional(),
      aiAssistedGrade: z.string().optional(),
      aiNotes: z.string().optional(),
    })
    .optional(),
  images: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  storageRequirement: z.string().optional(),
  pickupRequirement: z.enum(["Buyer Pickup", "Seller Delivery", "Flexible"]).default("Buyer Pickup"),
  status: z.enum(["Available", "Offers Received", "Offer Accepted", "In Transit", "Completed", "Archived"]).default("Available"),
  fpoAggregated: z.boolean().default(false),
  fpoMemberContributors: z.array(z.object({
    farmerName: z.string(),
    farmerPhone: z.string(),
    quantity: z.number(),
  })).optional(),
  createdAt: z.date().default(() => new Date()),
});
export type ProduceLot = z.infer<typeof produceLotSchema>;

// -------------------- Digital Offer --------------------
export const agriOfferSchema = z.object({
  id: z.string(),
  lotId: z.string(),
  lotNumber: z.string(),
  crop: z.string(),
  sellerId: z.string(),
  buyerId: z.string(),
  buyerName: z.string(),
  buyerType: z.string(),
  buyerVerified: z.boolean().default(true),
  offeredPrice: z.number(),
  quantity: z.number(),
  unit: z.string().default("Quintal"),
  deliveryTerms: z.enum(["Buyer Pickup", "Seller Delivery"]),
  paymentTerms: z.string(),
  validityDate: z.string(),
  estimatedLogisticsCost: z.number().default(0),
  netRealizationPerUnit: z.number(),
  notes: z.string().optional(),
  status: z.enum(["Pending", "Accepted", "Rejected", "Countered"]).default("Pending"),
  counterPrice: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
});
export type AgriOffer = z.infer<typeof agriOfferSchema>;

// -------------------- Agri Transaction (End-to-End Trade Lifecycle) --------------------
export const agriTransactionSchema = z.object({
  id: z.string(),
  transactionCode: z.string(), // e.g., TXN-AGL-8941
  lotId: z.string(),
  lotNumber: z.string(),
  crop: z.string(),
  quantity: z.number(),
  unit: z.string().default("Quintal"),
  agreedPricePerUnit: z.number(),
  grossAmount: z.number(),
  logisticsCost: z.number().default(0),
  storageCost: z.number().default(0),
  netRealizationAmount: z.number(),
  sellerId: z.string(),
  sellerName: z.string(),
  sellerRole: z.string().default("farmer"),
  buyerId: z.string(),
  buyerName: z.string(),
  buyerType: z.string(),
  status: z.enum([
    "Lot Created",
    "Offer Accepted",
    "Transaction Confirmed",
    "Logistics Arranged",
    "In Transit",
    "Delivered",
    "Payment Pending",
    "Payment Received",
    "Transaction Completed",
  ]).default("Transaction Confirmed"),
  stageTimestamps: z.record(z.string(), z.string()).default({}),
  logisticsDetails: z
    .object({
      transporterName: z.string().optional(),
      transporterPhone: z.string().optional(),
      vehicleNumber: z.string().optional(),
      estimatedDelivery: z.string().optional(),
    })
    .optional(),
  paymentStatus: z.enum(["Pending", "Partially Paid", "Paid", "Failed", "Disputed"]).default("Pending"),
  paymentReference: z.string().optional(),
  paymentMethod: z.string().default("Direct Bank Transfer / Escrow"),
  paymentProofUrl: z.string().optional(),
  paymentDate: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type AgriTransaction = z.infer<typeof agriTransactionSchema>;

// -------------------- Logistics Option --------------------
export const logisticsOptionSchema = z.object({
  id: z.string(),
  providerName: z.string(),
  vehicleType: z.string(),
  capacityQuintals: z.number(),
  costPerKm: z.number(),
  baseFare: z.number(),
  rating: z.number().default(4.7),
  contactPhone: z.string(),
  serviceAreas: z.array(z.string()),
  estimatedPickupHours: z.number().default(4),
  available: z.boolean().default(true),
});
export type LogisticsOption = z.infer<typeof logisticsOptionSchema>;

// -------------------- Storage Facility --------------------
export const storageFacilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["Warehouse", "Cold Storage", "Collection Center", "FPO Storage"]),
  location: z.string(),
  district: z.string(),
  distanceKm: z.number(),
  totalCapacityQuintals: z.number(),
  availableCapacityQuintals: z.number(),
  costPerQuintalPerMonth: z.number(),
  temperatureControl: z.boolean().default(false),
  suitableCrops: z.array(z.string()),
  contactPhone: z.string(),
  rating: z.number().default(4.6),
});
export type StorageFacility = z.infer<typeof storageFacilitySchema>;

// -------------------- Dispute & Grievance --------------------
export const disputeSchema = z.object({
  id: z.string(),
  disputeCode: z.string(),
  transactionId: z.string(),
  transactionCode: z.string(),
  raisedByUserId: z.string(),
  raisedByName: z.string(),
  raisedByRole: z.string(),
  respondentId: z.string(),
  respondentName: z.string(),
  category: z.enum(["Payment", "Quality", "Quantity", "Delivery", "Price", "Logistics", "Behavior"]),
  description: z.string(),
  evidenceUrls: z.array(z.string()).default([]),
  status: z.enum(["Open", "Under Review", "Awaiting Evidence", "Resolved", "Rejected", "Closed"]).default("Open"),
  adminNotes: z.string().optional(),
  resolution: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
export type Dispute = z.infer<typeof disputeSchema>;

// -------------------- FPO Member --------------------
export const fpoMemberSchema = z.object({
  id: z.string(),
  fpoId: z.string(),
  name: z.string(),
  phone: z.string(),
  village: z.string(),
  landSizeAcres: z.number(),
  primaryCrops: z.array(z.string()),
  totalLotsPooled: z.number().default(0),
  totalQuantitySoldQtl: z.number().default(0),
  joinedDate: z.string(),
});
export type FpoMember = z.infer<typeof fpoMemberSchema>;

// Shared AI & Market Types
export interface CropHistoricalTrend {
  crop: string;
  history7d: { date: string; avgPrice: number; arrivalTons: number }[];
  history30d: { date: string; avgPrice: number; arrivalTons: number }[];
  sellingWindowAdvice: {
    recommendedWindow: string;
    trendAssessment: string;
    confidence: "High" | "Medium" | "Moderate";
    keyDrivers: string[];
    riskFactor: string;
  };
}

export interface BuyerMatchResult {
  buyerDemand: BuyerDemand;
  matchScore: number;
  reasons: string[];
  estimatedTransportCostPerQtl: number;
  estimatedNetRealizationPerQtl: number;
  grossOfferedPrice: number;
  isRecommended: boolean;
}


