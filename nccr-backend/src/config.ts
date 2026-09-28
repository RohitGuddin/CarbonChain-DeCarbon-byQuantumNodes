import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/carbonchain",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  polygonRpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
  creditContractAddress: (process.env.CREDIT_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  serverWalletPrivateKey: (process.env.SERVER_WALLET_PRIVATE_KEY ||
    "0x0000000000000000000000000000000000000000000000000000000000000001") as `0x${string}`,
};
