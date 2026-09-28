import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ["cultivator", "company"], required: true },
    walletAddress: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const plantationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    photoPath: { type: String, required: true },
    plantType: String,
    co2Removed: Number,
    riskNotes: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

const creditSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plantationId: { type: Schema.Types.ObjectId, ref: "PlantationRequest" },
    credits: { type: Number, required: true },
    pricePerCredit: { type: Number, default: 100 },
    txHash: { type: String, required: true },
  },
  { timestamps: true }
);

const transactionSchema = new Schema(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    credits: { type: Number, required: true },
    txHash: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export const PlantationRequest = mongoose.model("PlantationRequest", plantationSchema);
export const CarbonCredit = mongoose.model("CarbonCredit", creditSchema);
export const Transaction = mongoose.model("Transaction", transactionSchema);
