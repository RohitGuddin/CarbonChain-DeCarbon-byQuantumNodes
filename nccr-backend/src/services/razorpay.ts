import crypto from "crypto";
import Razorpay from "razorpay";
import { config } from "../config";

const razorpay = new Razorpay({
  key_id: config.razorpayKeyId,
  key_secret: config.razorpayKeySecret,
});

export async function createOrder(amountInRupees: number, receipt: string) {
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: "INR",
    receipt,
  });
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", config.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
