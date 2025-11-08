# CarbonChain Backend API

Flask-based REST API for the CarbonChain carbon credit marketplace.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Clone and navigate to backend directory:**
```bash
cd nccr-backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your configuration
```

5. **Run the server:**
```bash
python run.py
```

The API will be available at `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

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

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### Register User
```http
POST /register
Content-Type: application/json

{
  "name": "John Doe",
  "role": "cultivator",
  "wallet_address": "0x1234567890abcdef"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user_id": 1,
  "name": "John Doe",
  "role": "cultivator"
}
```

### Plantation Requests

#### Upload Plantation Request
```http
POST /upload-request
Content-Type: multipart/form-data

photo: [image file]
user_id: 1
co2_removed: 2.5
```

**Response:**
```json
{
  "message": "Plantation request uploaded successfully",
  "request_id": 1,
  "detected_plant": "Mangrove",
  "confidence": 0.85,
  "photo_path": "uploads/photo.jpg"
}
```

#### Get Pending Requests (Admin)
```http
GET /pending-requests
```

**Response:**
```json
{
  "requests": [
    {
      "id": 1,
      "user_name": "John Doe",
      "user_wallet": "0x1234567890abcdef",
      "plant_type": "Mangrove",
      "co2_removed": 2.5,
      "photo_path": "uploads/photo.jpg",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total_pending": 1
}
```

#### Approve/Reject Request (Admin)
```http
POST /approve-request/1
Content-Type: application/json

{
  "admin_id": 2,
  "action": "approve"
}
```

**Response:**
```json
{
  "message": "Request approved and credits issued",
  "credits": 2.5,
  "tx_hash": "abc123...",
  "block_number": 1001,
  "nft_metadata": "{...}"
}
```

### Marketplace

#### Get Available Credits
```http
GET /marketplace
```

**Response:**
```json
{
  "credits": [
    {
      "credit_id": 1,
      "seller_name": "John Doe",
      "seller_wallet": "0x1234567890abcdef",
      "credits": 2.5,
      "plant_type": "Mangrove",
      "co2_removed": 2.5,
      "created_at": "2024-01-01T12:00:00Z",
      "nft_metadata": "{...}"
    }
  ],
  "total_credits": 1
}
```

#### Buy Credits
```http
POST /buy-credits
Content-Type: application/json

{
  "buyer_id": 3,
  "seller_id": 1,
  "credit_id": 1,
  "credits": 1.0,
  "upi_id": "demo@upi"
}
```

**Response:**
```json
{
  "message": "Credits purchased successfully",
  "tx_hash": "def456...",
  "block_number": 1002,
  "credits_transferred": 1.0,
  "payment_amount": 100
}
```

### User Management

#### Get User Credits
```http
GET /user/1/credits
```

**Response:**
```json
{
  "user_id": 1,
  "name": "John Doe",
  "role": "cultivator",
  "wallet_address": "0x1234567890abcdef",
  "total_credits": 2.5,
  "credits": [
    {
      "id": 1,
      "credits": 2.5,
      "plant_type": "Mangrove",
      "created_at": "2024-01-01T12:00:00Z",
      "tx_hash": "abc123..."
    }
  ],
  "recent_transactions": [...]
}
```

### Blockchain Explorer

#### Get All Transactions
```http
GET /explorer
```

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "block_number": 1001,
      "tx_hash": "abc123...",
      "from_user": "System (Minting)",
      "to_user": "John Doe",
      "credits": 2.5,
      "timestamp": "2024-01-01T12:00:00Z",
      "type": "minting"
    }
  ],
  "total_blocks": 1
}
```

### Invoicing

#### Download Invoice
```http
GET /invoice/1
```

**Response:** PDF file download

## 🤖 AI Integration

### Plant Detection

The system automatically detects plant types from uploaded images:

1. **Primary**: Google Gemini Vision API (if API key provided)
2. **Fallback**: Random selection from predefined plant types

#### Supported Plant Types
- Mangrove
- Seagrass
- Bamboo
- Oak
- Pine
- Eucalyptus
- Palm
- Cedar
- Maple
- Teak

### Enabling AI Detection

1. Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/)
2. Add it to your `.env` file:
```env
GEMINI_API_KEY=your-api-key-here
```

## 📄 PDF Invoice Generation

Invoices are generated using ReportLab and include:

- **Header**: CarbonChain branding
- **Invoice Details**: ID, date, transaction hash
- **Cultivator Info**: Name, plant type, CO2 removed, credits
- **Verification**: NCCR verification details
- **Digital Signature**: Transaction hash-based signature
- **Footer**: Support information

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    wallet_address VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Plantation Requests Table
```sql
CREATE TABLE plantation_request (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    photo_path VARCHAR(200) NOT NULL,
    plant_type VARCHAR(50),
    co2_removed FLOAT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user (id)
);
```

### Carbon Credits Table
```sql
CREATE TABLE carbon_credit (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plantation_request_id INTEGER,
    credits FLOAT NOT NULL,
    nft_metadata VARCHAR(500),
    tx_hash VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (plantation_request_id) REFERENCES plantation_request (id)
);
```

### Transactions Table
```sql
CREATE TABLE transaction (
    id INTEGER PRIMARY KEY,
    from_user INTEGER,
    to_user INTEGER NOT NULL,
    credits FLOAT NOT NULL,
    tx_hash VARCHAR(100) UNIQUE NOT NULL,
    block_number INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user) REFERENCES user (id),
    FOREIGN KEY (to_user) REFERENCES user (id)
);
```

## 🔒 Security Features

- **Input Validation**: All inputs are validated and sanitized
- **File Upload Security**: Only image files are allowed
- **SQL Injection Protection**: Using SQLAlchemy ORM
- **CORS Configuration**: Properly configured for frontend
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## 🚀 Production Deployment

### Using Gunicorn

1. **Install Gunicorn:**
```bash
pip install gunicorn
```

2. **Run with Gunicorn:**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Using Docker

1. **Create Dockerfile:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

2. **Build and run:**
```bash
docker build -t carbonchain-backend .
docker run -p 5000:5000 carbonchain-backend
```

### Environment Variables for Production

```env
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:password@localhost/carbonchain
GEMINI_API_KEY=your-production-gemini-key
FLASK_ENV=production
```

## 🧪 Testing

### Running Tests

```bash
python -m pytest tests/
```

### Test Coverage

```bash
python -m pytest --cov=app tests/
```

## 📊 Monitoring

### Health Check Endpoint

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

### Logging

The application logs all important events:
- User registrations
- Plantation request uploads
- Admin approvals
- Credit purchases
- API errors

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in .env
   - Ensure database is running

2. **File Upload Error**
   - Check UPLOAD_FOLDER permissions
   - Verify file size limits

3. **AI Detection Not Working**
   - Check GEMINI_API_KEY in .env
   - Verify API key is valid

4. **PDF Generation Error**
   - Check INVOICE_FOLDER permissions
   - Verify ReportLab installation

### Debug Mode

Enable debug mode for development:

```python
app.config['DEBUG'] = True
```

## 📝 API Rate Limiting

Consider implementing rate limiting for production:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.









