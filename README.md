# DeCarbon - Carbon Credit Marketplace Platform

A comprehensive blockchain-inspired carbon credit marketplace platform that enables cultivators to earn carbon credits through AI-verified plantation activities, and companies to purchase these credits to offset their carbon footprint.

**Built by QuantumNodes**

## 🌟 Overview

DeCarbon is a full-stack application that combines AI-powered plant detection, blockchain-like transaction tracking, and a marketplace for trading carbon credits. The platform features automatic approval for Mangrove plantations, real-time CO2 tracking, and an interactive 3D blockchain explorer.

## ✨ Features

### Core Features
- **AI-Powered Plant Detection**: Automatically identifies plant types from uploaded images using Google Gemini Vision API
- **Automatic Approval System**: Mangrove trees are automatically approved; other plant types are rejected
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
- Purchase credits using Razorpay payment gateway
- View purchased credits and transaction history
- Track carbon offset progress
- View CO2 decline profile

## 🏗️ Project Structure

```
ECHOCHAIN2/
├── nccr-backend/          # Flask REST API backend
│   ├── app.py             # Main Flask application
│   ├── models.py          # Database models
│   ├── config.py          # Configuration settings
│   ├── ai.py              # AI plant detection
│   ├── invoice.py         # PDF invoice generation
│   ├── utils.py           # Utility functions
│   ├── requirements.txt   # Python dependencies
│   └── README.md          # Backend documentation
│
├── frontend/              # React web application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Login.jsx      # Login/Registration page
│   │   │   ├── Cultivator.jsx # Cultivator dashboard
│   │   │   ├── Marketplace.jsx # Company marketplace
│   │   │   └── Explorer.jsx     # Blockchain explorer
│   │   ├── components/     # Reusable components
│   │   ├── utils/         # API client & utilities
│   │   └── styles/         # Global styles
│   ├── package.json
│   └── README.md          # Frontend documentation
│
├── mobile/                # React Native mobile app
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   └── utils/         # API client
│   ├── package.json
│   └── README.md          # Mobile documentation
│
└── mobile-web/            # Mobile web interface
    ├── index.html
    └── script.js
```

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.8+ and pip
- **Frontend**: Node.js 16+ and npm
- **Mobile**: Node.js 16+ and Expo CLI (optional)
- **API Key**: Google Gemini API key (optional, for AI features)

### Installation & Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd nccr-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env and add your configuration:
# - SECRET_KEY (for Flask sessions)
# - DATABASE_URL (default: sqlite:///carbonchain.db)
# - GEMINI_API_KEY (optional, for AI plant detection)
```

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

#### 3. Mobile Setup (Optional)

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install
```

## 🎯 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd nccr-backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python run.py
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

For production, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

#### Frontend

Build the frontend for production:

```bash
cd frontend
npm run build
```

The built files will be in the `dist/` directory.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `nccr-backend/` directory:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///carbonchain.db
GEMINI_API_KEY=your-gemini-api-key-here
```

### Database

The application uses SQLite by default. For production, consider using PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost/carbonchain
```

### AI Plant Detection

To enable AI-powered plant detection:

1. Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/)
2. Add it to your `.env` file:
   ```env
   GEMINI_API_KEY=your-api-key-here
   ```

Without the API key, the system will use fallback image-based detection.

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

### Backend
- **Flask** - Web framework
- **SQLAlchemy** - ORM for database operations
- **Flask-CORS** - Cross-origin resource sharing
- **Google Generative AI** - Plant detection
- **ReportLab** - PDF invoice generation
- **Razorpay** - Payment gateway integration

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Recharts** - Data visualization (CO2 graphs)
- **GSAP** - Advanced animations
- **Lucide React** - Icon library

### Mobile
- **React Native** - Mobile framework
- **Expo** - Development platform
- **AsyncStorage** - Local storage

## 🗄️ Database Schema

The application uses the following main models:

- **User**: Stores user information (name, role, wallet_address)
- **PlantationRequest**: Tracks cultivation requests (status, plant_type, co2_removed)
- **CarbonCredit**: Manages carbon credits (credits, price_per_credit, nft_metadata, tx_hash)
- **Transaction**: Records all blockchain-like transactions (from_user, to_user, credits, block_number)

## 🔐 Security Features

- Input validation and sanitization
- File upload security (image files only)
- SQL injection protection via SQLAlchemy ORM
- CORS configuration for frontend
- Secure file handling with Werkzeug
- Environment variable management

## 🎯 Key Features Explained

### Automatic Approval System
- When a cultivator uploads a plantation photo, the AI analyzes it
- If the detected plant type is **Mangrove**, the request is automatically approved
- Credits are immediately issued and an NFT is minted
- Other plant types are automatically rejected

### Dynamic Pricing
- Cultivators can set custom prices for their approved carbon credits
- Prices can only be set after approval (Mangrove detection)
- Prices are used in marketplace calculations
- Buyers pay based on the seller's set price per credit

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

## 🧪 Demo Users

The application creates demo users on first run:

- **Cultivator**: 
  - Name: `Demo Cultivator`
  - Wallet: `0x1234567890abcdef1234567890abcdef12345678`
  
- **Company**: 
  - Name: `Demo Company`
  - Wallet: `0xabcdef1234567890abcdef1234567890abcdef12`

Use these for testing the application.

## 📱 Mobile App

The mobile app (React Native/Expo) provides:

- Photo upload with geotagging
- AI plant detection results
- Wallet and credit management
- Transaction history
- PDF invoice viewing

To run the mobile app:

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go app on your device.

## 🐛 Troubleshooting

### Backend Issues

1. **Database Connection Error**
   - Check `DATABASE_URL` in `.env`
   - Ensure database file has write permissions

2. **AI Detection Not Working**
   - Verify `GEMINI_API_KEY` in `.env`
   - Check API key validity
   - System will use fallback mode if key is missing

3. **Port Already in Use**
   - Change port in `run.py` (default: 8000)
   - Or stop the process using the port

4. **Module Not Found Errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Common missing packages: `setuptools`, `reportlab`

### Frontend Issues

1. **API Connection Failed**
   - Ensure backend is running on port 8000
   - Check proxy configuration in `vite.config.js`

2. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version (requires 16+)

3. **Chart Not Displaying**
   - Ensure `recharts` is installed: `npm install recharts`

## 🚢 Deployment

### Backend Deployment

1. Use a production WSGI server (Gunicorn, uWSGI)
2. Set up a reverse proxy (Nginx)
3. Configure environment variables
4. Use a production database (PostgreSQL recommended)

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
- [Mobile App Documentation](mobile/README.md)

---

**Built with ❤️ by QuantumNodes for a sustainable future**
