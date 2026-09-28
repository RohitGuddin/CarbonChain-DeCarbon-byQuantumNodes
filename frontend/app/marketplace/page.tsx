"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Credit = { _id: string; credits: number; pricePerCredit: number };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function MarketplacePage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [buyerId, setBuyerId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api<{ credits: Credit[] }>("/marketplace").then((result) => setCredits(result.credits));
  }, []);

  async function buy(credit: Credit) {
    const order = await api<{ id: string; amount: number; currency: string }>("/create-payment-order", {
      method: "POST",
      body: JSON.stringify({ creditId: credit._id, credits: credit.credits, buyerId }),
    });
    const checkout = new window.Razorpay!({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const settled = await api<{ txHash: string }>("/verify-payment", {
          method: "POST",
          body: JSON.stringify({ ...response, buyerId, creditId: credit._id, credits: credit.credits }),
        });
        setStatus(`Ownership recorded at ${settled.txHash}`);
      },
    });
    checkout.open();
  }

  return (
    <section>
      <h1>Marketplace</h1>
      <label>Company user id</label>
      <input value={buyerId} onChange={(event) => setBuyerId(event.target.value)} />
      {credits.map((credit) => (
        <article className="card" key={credit._id}>
          <p>{credit.credits} credits at ₹{credit.pricePerCredit}</p>
          <button onClick={() => buy(credit)}>Pay with Razorpay</button>
        </article>
      ))}
      <p>{status}</p>
    </section>
  );
}
