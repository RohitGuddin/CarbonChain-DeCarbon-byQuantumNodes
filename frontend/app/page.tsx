"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [role, setRole] = useState("cultivator");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent, path: "/login" | "/register") {
    event.preventDefault();
    const body = path === "/login" ? { username: name, walletAddress } : { name, role, walletAddress };
    const result = await api<{ user: { role: string } }>(path, { method: "POST", body: JSON.stringify(body) });
    setMessage("Signed in");
    router.push(result.user.role === "company" ? "/marketplace" : "/cultivator");
  }

  return (
    <section>
      <h1>CarbonChain</h1>
      <p>Register a restoration project or a company wallet, then issue and buy credits on Polygon Amoy.</p>
      <form className="card" onSubmit={(event) => submit(event, "/register")}>
        <label>Name</label>
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <label>Wallet address</label>
        <input value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} />
        <label>Role</label>
        <input value={role} onChange={(event) => setRole(event.target.value)} />
        <button type="submit">Register</button>
        <button type="button" onClick={(event) => submit(event as unknown as FormEvent, "/login")}>
          Login
        </button>
        <p>{message}</p>
      </form>
    </section>
  );
}
