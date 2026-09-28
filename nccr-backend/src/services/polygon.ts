import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";
import { config } from "../config";

const abi = parseAbi([
  "function issue(address to, uint256 amount) returns (uint256)",
  "function transfer(address from, address to, uint256 amount)",
]);

const account = privateKeyToAccount(config.serverWalletPrivateKey);
const transport = http(config.polygonRpcUrl);

const wallet = createWalletClient({ account, chain: polygonAmoy, transport });
const reader = createPublicClient({ chain: polygonAmoy, transport });

async function send(functionName: "issue" | "transfer", args: readonly [`0x${string}`, bigint] | readonly [`0x${string}`, `0x${string}`, bigint]) {
  const hash = await wallet.writeContract({
    address: config.creditContractAddress,
    abi,
    functionName,
    args: args as never,
  });
  const receipt = await reader.waitForTransactionReceipt({ hash });
  return { txHash: hash, blockNumber: Number(receipt.blockNumber) };
}

export function issueCredits(to: `0x${string}`, credits: number) {
  return send("issue", [to, BigInt(Math.round(credits * 100))]);
}

export function transferCredits(from: `0x${string}`, to: `0x${string}`, credits: number) {
  return send("transfer", [from, to, BigInt(Math.round(credits * 100))]);
}
