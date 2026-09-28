"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Row = { txHash: string; blockNumber: number; credits: number };

export default function ExplorerPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api<{ transactions: Row[] }>("/explorer").then((result) => setRows(result.transactions));
  }, []);

  return (
    <section>
      <h1>Polygon Amoy explorer</h1>
      {rows.map((row) => (
        <article className="card" key={row.txHash}>
          <p>Block {row.blockNumber}</p>
          <p>{row.credits} credits</p>
          <a href={`https://amoy.polygonscan.com/tx/${row.txHash}`}>{row.txHash}</a>
        </article>
      ))}
    </section>
  );
}
