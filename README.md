# CarbonChain

An AI-powered Web3 carbon-credit marketplace that connects blue-carbon restoration projects with enterprises through verification, credit issuance, and ownership tracking.

**September 2025 – Present · QuantumNodes**

**Stack:** Next.js, TypeScript, Node.js, MongoDB, Web3, Polygon Amoy, Razorpay, OpenRouter

For the project presentation: https://drive.google.com/file/d/1cyYaBUVu5SmyUaRhu8grlUCqxifaADPp/view?usp=sharing

## 🌟 Overview

CarbonChain lets restoration projects submit plantation evidence and lets companies buy the resulting carbon credits. OpenRouter reviews the evidence and returns structured findings for administrator review and risk identification. Approved credits are issued on Polygon Amoy, priced by the project, and purchased by companies through Razorpay. Each purchase is tied to an on-chain ownership transfer that the explorer can audit.

## ✨ Features

### Core Features
- **OpenRouter verification**: Analyzes plantation evidence and returns structured insights for administrator review and risk identification
- **Credit issuance**: Mangrove restoration that passes review is issued as carbon credits on Polygon Amoy
- **Carbon Credit Marketplace**: Buy and sell carbon credits with dynamic pricing set by cultivators
- **3D Blockchain Explorer**: Interactive 3D chain visualization with clickable blocks
- **CO2 Decline Profile**: Real-time tracking of cumulative CO2 removal from the atmosphere
- **PDF Invoice Generation**: Automated invoice generation for approved plantations and purchases
- **Real-time Transaction Tracking**: Monitor all credit transfers and minting operations
- **Geotagging Support**: Extract location data from uploaded images (EXIF data)
- **Public Access**: View blockchain explorer and CO2 graphs without login

### User Roles

#### 👨‍🌾 Cultivator
- Upload plantation photos with geotagging
- Get AI-powered plant type detection
- Automatic approval for Mangrove trees
- Earn carbon credits upon approval
- Set custom prices for approved credits
- View wallet balance and transaction history
- Download PDF invoices
- Access marketplace to set credit prices

#### 🏢 Company
- Browse available carbon credits in the marketplace
- Purchase credits through Razorpay, with ownership transferred on Polygon Amoy after payment confirmation
- View purchased credits and transaction history
- Track carbon offset progress
- View CO2 decline profile

## 🏗️ Project Structure

```
CarbonChain/
├── nccr-backend/                 # Node.js + TypeScript API
│   ├── src/index.ts              # Express routes
│   ├── src/models.ts             # MongoDB models
│   ├── src/services/openrouter.ts
│   ├── src/services/razorpay.ts
│   ├── src/services/polygon.ts   # viem client for Polygon Amoy
│   └── package.json
│
└── frontend/                     # Next.js + TypeScript
    ├── app/page.tsx              # Register and login
    ├── app/cultivator/page.tsx
    ├── app/marketplace/page.tsx  # Razorpay checkout
    ├── app/explorer/page.tsx
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- **Backend**: Node.js 18+
- **Frontend**: Node.js 18+ and npm
- **Database**: MongoDB
- **Keys**: OpenRouter API key, Razorpay key id and secret, Polygon Amoy RPC URL and server wallet

### Installation & Setup

#### 1. Backend Setup

```bash
cd nccr-backend
npm install
cp env.example .env
```

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## 🎯 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd nccr-backend
npm run dev
```

The backend API will be available at `http://localhost:8000`

#### Start Frontend Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

The frontend is configured to proxy API requests from `/api` to `http://localhost:8000`.

### Production Mode

#### Backend

The API serves on port 8000. In production, run it behind a reverse proxy with MongoDB, Razorpay, OpenRouter, and the Polygon Amoy wallet configured.

#### Frontend

Build the frontend for production:

```bash
cd frontend
npm run build
```

Next.js writes the production build to `.next/`.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `nccr-backend/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/carbonchain
OPENROUTER_API_KEY=your-openrouter-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
CREDIT_CONTRACT_ADDRESS=0xYourCreditContract
SERVER_WALLET_PRIVATE_KEY=0xyour-server-wallet-key
```

### Database

Application data is stored in MongoDB: users, plantation evidence, credit balances, and the transaction hash returned by Polygon Amoy.

### OpenRouter verification

Plantation photos are sent to OpenRouter. The model returns plant type, location context, and risk notes for administrator review. Mangrove restoration that clears review is issued as credits on Polygon Amoy.

## 📚 API Documentation

### Base URL
```
http://localhost:8000
```

### Key Endpoints

#### Authentication
- `POST /login` - User login (requires username and wallet_address)
- `POST /register` - User registration (cultivator or company)

#### Plantation Requests
- `POST /analyze-plantation` - AI analysis of plantation image
- `POST /upload-request` - Upload plantation request (auto-approves Mangrove, rejects others)

#### Marketplace
- `GET /marketplace` - List available credits with pricing
- `POST /credit/<id>/set-price` - Set price for cultivator's approved credits
- `POST /create-payment-order` - Create Razorpay order
- `POST /verify-payment` - Verify payment and transfer credits
- `POST /buy-credits` - Buy credits (alternative method)

#### User Management
- `GET /user/<id>/credits` - Get user credits and wallet balance

#### Blockchain Explorer
- `GET /explorer` - Get all transactions (publicly accessible)

#### CO2 Tracking
- `GET /co2-decline-profile` - Get CO2 removal data over time (publicly accessible)

#### Invoicing
- `GET /invoice/<request_id>` - Download PDF invoice for plantation
- `GET /invoice/purchase/<transaction_id>` - Download PDF invoice for purchase

For detailed API documentation, see [nccr-backend/README.md](nccr-backend/README.md)

## 🎨 Tech Stack

### Application
- **Next.js** and **TypeScript** — web application
- **Node.js** — API for verification, payments, and chain writes
- **MongoDB** — users, plantation evidence, credits, and transaction records
- **OpenRouter** — plantation evidence analysis and risk notes
- **Web3** on **Polygon Amoy** — credit issuance and ownership transfer
- **Razorpay** — corporate credit purchases in INR
- **TailwindCSS**, **Recharts**, and **GSAP** — interface, CO2 charts, and motion

## 🗄️ Database Schema

The application uses the following main models:

- **User**: Stores user information (name, role, wallet_address)
- **PlantationRequest**: Tracks cultivation requests (status, plant_type, co2_removed)
- **CarbonCredit**: Manages carbon credits (credits, price_per_credit, nft_metadata, tx_hash)
- **Transaction**: On-chain issuance and ownership transfers (from_user, to_user, credits, tx_hash, block_number)

## 🔐 Security Features

- Input validation and sanitization
- File upload security (image files only)
- Request validation on the Node.js API
- CORS configuration for the Next.js application
- Razorpay signature check before any Polygon write
- Environment variable management for OpenRouter, Razorpay, and the Amoy wallet

## 🎯 Key Features Explained

### Verification and issuance
- A cultivator uploads plantation evidence, including geotag data from the photo
- OpenRouter returns plant type, estimated removal, and risk notes for administrator review
- Mangrove restoration that clears review is issued as carbon credits on Polygon Amoy
- Other evidence stays unissued until the review supports credit issuance

### Dynamic Pricing
- Cultivators can set custom prices for their approved carbon credits
- Prices can only be set after approval (Mangrove detection)
- Prices are used in marketplace calculations
- Buyers pay based on the seller's set price per credit

### Razorpay payment recorded on Polygon Amoy

Razorpay settles the rupees. A carbon-credit smart contract on Polygon Amoy settles the credits. The contract runs only after the backend verifies the Razorpay signature. Gas on Amoy is paid by the server wallet, not by the company.

![Razorpay payment recorded on Polygon Amoy](docs/razorpay-amoy-flow.png)

### 3D Blockchain Explorer
- Interactive 3D cube visualization of blockchain blocks
- Horizontal scrollable chain layout
- Click blocks to view detailed transaction information
- Smooth animations and hover effects

### CO2 Decline Profile
- Real-time graph showing cumulative CO2 removal over time
- Available on both cultivator and company dashboards
- Publicly accessible from login page
- Area chart with gradient visualization

## 🔄 System Workflows & Flowcharts

### Complete project flow

A cultivator registers, uploads plantation evidence, and receives credits when OpenRouter review supports mangrove restoration. Those credits are priced and listed. A company buys them with Razorpay. After the payment signature checks out, the credit contract on Polygon Amoy moves ownership, MongoDB stores the transaction hash, and the explorer updates.

![Complete DeCarbon workflow](docs/project-workflow.png)

### 1. Overall System Architecture
```mermaid
flowchart TD
    subgraph Users ["User Roles"]
        Cultivator["👨‍🌾 Cultivator"]
        Company["🏢 Company"]
    end

    subgraph Frontend ["Next.js Web Client"]
        AuthUI["Login / Register"]
        CultDashboard["Cultivator Dashboard"]
        MarketplaceUI["Carbon Credit Marketplace"]
        ExplorerUI["3D Blockchain Explorer"]
    end

    subgraph Backend ["Node.js API"]
        AIModule["OpenRouter evidence review"]
        AutoApproval["Administrator review and issuance"]
        PaymentVerifier["Razorpay signature verification"]
        PDFGen["PDF invoice"]
        DB[(MongoDB)]
    end

    subgraph Blockchain ["Polygon Amoy Testnet & Payment"]
        Razorpay["💳 Razorpay Gateway"]
        AmoyContract["📜 Carbon Credit Smart Contract"]
    end

    Cultivator --> AuthUI
    Company --> AuthUI
    
    Cultivator --> CultDashboard
    CultDashboard -->|1. Upload plantation photo| AIModule
    AIModule -->|2. Detect plant species| AutoApproval
    AutoApproval -->|3. Mangrove? Issue Credits| DB
    
    Company --> MarketplaceUI
    MarketplaceUI -->|4. Buy Credits| Razorpay
    Razorpay -->|5. Payment Signature| PaymentVerifier
    PaymentVerifier -->|6. Trigger Mint/Transfer| AmoyContract
    AmoyContract -->|7. Tx Hash & Block #| DB
    DB -->|8. Render Live Chain| ExplorerUI
```

### 2. Cultivator Verification & Credit Issuance Flow
```mermaid
flowchart TD
    A["👨‍🌾 Cultivator uploads plantation photo with EXIF geotag"] --> B["Backend receives image"]
    B --> C["OpenRouter analyzes plantation evidence"]
    
    C --> D{"Detected Plant Species?"}
    
    D -->|Mangrove| E["✅ Auto-Approved!"]
    D -->|Other Plant / Unknown| F["❌ Automatically Rejected"]
    
    E --> G["Mint Carbon Credits to Cultivator Wallet"]
    G --> H["Store Plantation Record & Metadata in Database"]
    H --> I["Cultivator sets Custom Price (₹ per credit)"]
    I --> J["Credits listed live on Carbon Credit Marketplace"]
    J --> K["📄 Generate PDF Invoice / Certificate"]
```

### 3. Company Purchase & Blockchain Settlement Flow
```mermaid
flowchart TD
    A["🏢 Company selects Carbon Credits on Marketplace"] --> B["Backend creates Razorpay Order in INR"]
    B --> C["Open Razorpay Payment Modal"]
    
    C --> D{"Payment Captured?"}
    D -->|No| E["🛑 Payment Failed / Cancelled<br/>(No blockchain write)"]
    
    D -->|Yes| F["Browser sends order_id, payment_id & signature to Backend"]
    F --> G{"Backend verifies Razorpay HMAC Signature"}
    
    G -->|Invalid| H["🛑 Signature Mismatch<br/>(No blockchain write)"]
    G -->|Valid| I["Server wallet executes smart contract on Polygon Amoy"]
    
    I --> J["Smart Contract transfers credit tokens from Seller to Buyer"]
    J --> K["Amoy node returns Tx Hash & Block Number"]
    K --> L["Update DB: Mark credits as Purchased & Transfer ownership"]
    L --> M["📄 Generate PDF Purchase Invoice"]
    L --> N["🌐 3D Blockchain Explorer updates live with new block"]
```

## 🧪 Accounts

The application creates these accounts on first run:

- **Cultivator**: 
  - Name: `Demo Cultivator`
  - Wallet: `0x1234567890abcdef1234567890abcdef12345678`
  
- **Company**: 
  - Name: `Demo Company`
  - Wallet: `0xabcdef1234567890abcdef1234567890abcdef12`

Use these for testing the application.

## 🐛 Troubleshooting

### Backend Issues

1. **Database connection**
   - Confirm MongoDB is running and `MONGODB_URI` in `.env` points at it

2. **Verification has no plant result**
   - Confirm `OPENROUTER_API_KEY` in `.env`

3. **Port already in use**
   - The API uses port 8000. Stop the other process or set `PORT` in `.env`

4. **Missing modules**
   - From `nccr-backend`, run `npm install`

### Frontend Issues

1. **API Connection Failed**
   - Ensure backend is running on port 8000
   - Requests to `/api` are rewritten to `http://localhost:8000` in `frontend/next.config.ts`

2. **Build errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Use Node.js 18 or newer

## 🚢 Deployment

### Backend Deployment

1. Run the Node.js API behind a reverse proxy
2. Configure OpenRouter, Razorpay, MongoDB, and the Polygon Amoy wallet
3. Point `MONGODB_URI` at the production database

### Frontend Deployment

1. Build the application: `npm run build`
2. Serve the `dist/` directory with a web server (Nginx, Apache)
3. Configure API proxy to point to backend URL

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on the repository.

## 🔗 Related Documentation

- [Backend API Documentation](nccr-backend/README.md)
- [Frontend Documentation](frontend/README.md)

---

**CarbonChain by QuantumNodes**
