import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { config } from "./config";
import { CarbonCredit, PlantationRequest, Transaction, User } from "./models";
import { reviewPlantation } from "./services/openrouter";
import { issueCredits, transferCredits } from "./services/polygon";
import { createOrder, verifySignature } from "./services/razorpay";

const app = express();
app.use(cors());
app.use(express.json({ limit: "16mb" }));

app.post("/register", async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ user });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ name: req.body.username, walletAddress: req.body.walletAddress });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.json({ user });
});

app.post("/analyze-plantation", async (req, res) => {
  const review = await reviewPlantation(req.body.imageBase64);
  res.json(review);
});

app.post("/upload-request", async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const review = await reviewPlantation(req.body.imageBase64);
  const plantation = await PlantationRequest.create({
    userId: user._id,
    photoPath: req.body.photoPath,
    plantType: review.plantType,
    co2Removed: review.co2Removed,
    riskNotes: review.riskNotes,
    status: review.approved ? "approved" : "rejected",
  });
  if (!review.approved) {
    res.status(201).json({ plantation });
    return;
  }
  const chain = await issueCredits(user.walletAddress as `0x${string}`, review.co2Removed);
  const credit = await CarbonCredit.create({
    userId: user._id,
    plantationId: plantation._id,
    credits: review.co2Removed,
    txHash: chain.txHash,
  });
  await Transaction.create({
    toUser: user._id,
    credits: review.co2Removed,
    txHash: chain.txHash,
    blockNumber: chain.blockNumber,
  });
  res.status(201).json({ plantation, credit, ...chain });
});

app.get("/marketplace", async (_req, res) => {
  const credits = await CarbonCredit.find({ credits: { $gt: 0 } }).populate("userId");
  res.json({ credits });
});

app.post("/credit/:id/set-price", async (req, res) => {
  const credit = await CarbonCredit.findByIdAndUpdate(
    req.params.id,
    { pricePerCredit: req.body.pricePerCredit },
    { new: true }
  );
  res.json({ credit });
});

app.post("/create-payment-order", async (req, res) => {
  const credit = await CarbonCredit.findById(req.body.creditId);
  if (!credit) {
    res.status(404).json({ error: "Credit not found" });
    return;
  }
  const order = await createOrder(req.body.credits * credit.pricePerCredit, `credit_${credit.id}`);
  res.json(order);
});

app.post("/verify-payment", async (req, res) => {
  const valid = verifySignature(req.body.razorpay_order_id, req.body.razorpay_payment_id, req.body.razorpay_signature);
  if (!valid) {
    res.status(400).json({ error: "Payment signature was not accepted" });
    return;
  }
  const credit = await CarbonCredit.findById(req.body.creditId);
  const buyer = await User.findById(req.body.buyerId);
  const seller = credit ? await User.findById(credit.userId) : null;
  if (!credit || !buyer || !seller) {
    res.status(404).json({ error: "Purchase records were not found" });
    return;
  }
  const chain = await transferCredits(
    seller.walletAddress as `0x${string}`,
    buyer.walletAddress as `0x${string}`,
    Number(req.body.credits)
  );
  credit.credits -= Number(req.body.credits);
  await credit.save();
  const buyerCredit = await CarbonCredit.create({
    userId: buyer._id,
    plantationId: credit.plantationId,
    credits: Number(req.body.credits),
    pricePerCredit: credit.pricePerCredit,
    txHash: chain.txHash,
  });
  const transaction = await Transaction.create({
    fromUser: seller._id,
    toUser: buyer._id,
    credits: Number(req.body.credits),
    txHash: chain.txHash,
    blockNumber: chain.blockNumber,
    razorpayPaymentId: req.body.razorpay_payment_id,
  });
  res.json({ transaction, buyerCredit, ...chain });
});

app.get("/explorer", async (_req, res) => {
  const transactions = await Transaction.find().sort({ blockNumber: -1 }).populate("fromUser toUser");
  res.json({ transactions });
});

app.get("/co2-decline-profile", async (_req, res) => {
  const issued = await PlantationRequest.find({ status: "approved" }).sort({ createdAt: 1 });
  res.json({
    series: issued.map((row) => ({ at: row.get("createdAt"), co2Removed: row.co2Removed })),
  });
});

mongoose.connect(config.mongoUri).then(() => {
  app.listen(config.port, () => {
    console.log(`CarbonChain API listening on ${config.port}`);
  });
});
