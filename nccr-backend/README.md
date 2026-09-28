# CarbonChain API

Node.js and TypeScript API for CarbonChain. It stores users, plantation reviews, and credit balances in MongoDB, takes company payments through Razorpay, and records issuance and ownership transfers on Polygon Amoy.

## Setup

```bash
cd nccr-backend
npm install
cp env.example .env
npm run dev
```

The API listens on `http://localhost:8000`.
