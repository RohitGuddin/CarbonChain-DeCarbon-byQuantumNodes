"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

type Review = { plantType: string; co2Removed: number; riskNotes: string; approved: boolean; txHash?: string };

export default function CultivatorPage() {
  const [userId, setUserId] = useState("");
  const [review, setReview] = useState<Review | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("photo");
    if (!(file instanceof File)) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const imageBase64 = btoa(binary);
    const result = await api<Review>("/upload-request", {
      method: "POST",
      body: JSON.stringify({ userId, photoPath: file.name, imageBase64 }),
    });
    setReview(result);
  }

  return (
    <section>
      <h1>Plantation evidence</h1>
      <form className="card" onSubmit={onSubmit}>
        <label>User id</label>
        <input value={userId} onChange={(event) => setUserId(event.target.value)} />
        <input name="photo" type="file" accept="image/*" />
        <button type="submit">Submit for review</button>
      </form>
      {review && (
        <article className="card">
          <p>Plant: {review.plantType}</p>
          <p>CO2 removed: {review.co2Removed}</p>
          <p>Risk notes: {review.riskNotes}</p>
          <p>{review.approved ? `Issued on Polygon Amoy ${review.txHash || ""}` : "Held for administrator review"}</p>
        </article>
      )}
    </section>
  );
}
