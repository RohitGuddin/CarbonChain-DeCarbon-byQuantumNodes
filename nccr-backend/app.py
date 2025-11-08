from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import uuid
import razorpay
from datetime import datetime
from config import Config
from models import db, User, PlantationRequest, CarbonCredit, Transaction
from utils import generate_tx_hash, get_next_block_number, issue_fungible_tokens, log_explorer_event
from ai import detect_plant_type
from invoice import generate_invoice

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
CORS(app)

# Initialize Razorpay (Demo mode - no real API calls)
razorpay_client = None  # We'll simulate Razorpay for demo purposes

# Create directories
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.INVOICE_FOLDER, exist_ok=True)
os.makedirs(Config.NFT_FOLDER, exist_ok=True)

# Print API key status on startup
print("=" * 60)
print("🚀 EcoChain Backend Starting... (by QuantumNodes)")
if Config.GEMINI_API_KEY:
    print(f"✅ Gemini API Key: Loaded (length: {len(Config.GEMINI_API_KEY)})")
    print("🤖 AI Analysis: ENABLED (Using real Gemini AI)")
else:
    print("⚠️  Gemini API Key: Not found")
    print("🔄 AI Analysis: FALLBACK MODE (Using image-based detection)")
print("=" * 60)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_demo_users():
    """Create demo users for testing"""
    try:
        # Check if demo users already exist
        if User.query.filter_by(name='Demo Cultivator').first():
            return
        
        # Create demo cultivator
        cultivator = User(
            name='Demo Cultivator',
            role='cultivator',
            wallet_address='0x1234567890abcdef1234567890abcdef12345678'
        )
        
        # Create demo company
        company = User(
            name='Demo Company',
            role='company',
            wallet_address='0xabcdef1234567890abcdef1234567890abcdef12'
        )
        
        # Create demo admin
        admin = User(
            name='Demo Admin',
            role='admin',
            wallet_address='0x9876543210fedcba9876543210fedcba98765432'
        )
        
        db.session.add(cultivator)
        db.session.add(company)
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Demo users created successfully!")
        print("👤 Cultivator: Demo Cultivator")
        print("🏢 Company: Demo Company")
        print("👨‍💼 Admin: Demo Admin")
        
    except Exception as e:
        print(f"Error creating demo users: {e}")
        db.session.rollback()

# Create database tables
with app.app_context():
    db.create_all()
    create_demo_users()

@app.route('/login', methods=['POST'])
def login():
    """Login with demo credentials"""
    try:
        data = request.get_json()
        username = data.get('username')
        role = data.get('role')
        
        if not username or not role:
            return jsonify({'error': 'Username and role required'}), 400
        
        # Find user by name and role
        user = User.query.filter_by(name=username, role=role).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'name': user.name,
                'role': user.role,
                'wallet_address': user.wallet_address
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/requests', methods=['GET'])
def get_pending_requests():
    """Get all pending plantation requests for admin review"""
    try:
        requests = PlantationRequest.query.filter_by(status='pending').all()
        
        requests_data = []
        for req in requests:
            user = User.query.get(req.user_id)
            requests_data.append({
                'id': req.id,
                'user_name': user.name if user else 'Unknown',
                'user_id': req.user_id,
                'plant_type': req.plant_type,
                'co2_removed': req.co2_removed,
                'status': req.status,
                'created_at': req.created_at.isoformat() if req.created_at else None,
                'photo_path': req.photo_path
            })
        
        return jsonify({
            'requests': requests_data,
            'total': len(requests_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        name = data.get('name')
        role = data.get('role')
        wallet_address = data.get('wallet_address')
        
        if not all([name, role, wallet_address]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if role not in ['cultivator', 'company', 'admin']:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Check if wallet address already exists
        existing_user = User.query.filter_by(wallet_address=wallet_address).first()
        if existing_user:
            return jsonify({'error': 'Wallet address already registered'}), 400
        
        user = User(
            name=name,
            role=role,
            wallet_address=wallet_address
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user.id,
            'name': user.name,
            'role': user.role
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-plantation', methods=['POST'])
def analyze_plantation():
    """AI analysis of plantation image with geotagging data"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        exif_data = request.form.get('exif_data')
        if exif_data:
            import json
            exif_data = json.loads(exif_data)
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        try:
            # AI plant detection
            print(f"Analyzing image: {file_path}")
            detection_result = detect_plant_type(file_path)
            plant_type = detection_result.get('plant_name', 'Unknown')
            confidence = detection_result.get('confidence', 0.0)
            print(f"AI Detection Result: {plant_type} (confidence: {confidence})")
        except Exception as e:
            print(f"Error during plant detection: {str(e)}")
            # Use a default if detection completely fails
            plant_type = "Unknown Plant"
            confidence = 0.5
        finally:
            # Always clean up temporary file
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete temporary file: {str(e)}")
        
        # Extract location from EXIF data
        location = "Unknown Location"
        if exif_data and 'latitude' in exif_data and 'longitude' in exif_data:
            lat = exif_data['latitude']
            lng = exif_data['longitude']
            location = f"Lat: {lat:.4f}, Lng: {lng:.4f}"
        
        # Estimate area based on plant type (deterministic based on plant name)
        # Use a hash of plant name for consistency - same plant type = same area estimate
        import hashlib
        plant_hash = int(hashlib.md5(plant_type.encode()).hexdigest()[:8], 16)
        estimated_area = f"{2.0 + (plant_hash % 300) / 100:.2f} hectares"
        
        # Estimate planting date based on growth stage (deterministic)
        growth_stages = ['Seedling', 'Young Plant', 'Mature Tree', 'Fruiting']
        growth_stage = growth_stages[plant_hash % len(growth_stages)]
        
        # Calculate estimated planting date (deterministic)
        from datetime import timedelta
        days_ago = 365 + (plant_hash % 1095)  # 1-4 years ago
        planting_date = datetime.now().date() - timedelta(days=days_ago)
        
        return jsonify({
            'location': location,
            'area': estimated_area,
            'plant_type': plant_type,
            'planting_date': planting_date.strftime('%m/%d/%Y'),
            'growth_stage': growth_stage,
            'confidence': confidence
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/upload-request', methods=['POST'])
def upload_request():
    """Upload plantation request with AI-analyzed data"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        user_id = request.form.get('user_id')
        plantation_data = request.form.get('plantation_data')
        
        if not all([user_id, plantation_data]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Parse plantation data
        import json
        data = json.loads(plantation_data)
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Create plantation request
        plantation_request = PlantationRequest(
            user_id=user_id,
            photo_path=file_path,
            plant_type=data.get('plant_type', 'Unknown'),
            co2_removed=float(data.get('area', '1.0').split()[0]) * 10,  # Estimate CO2 based on area
            status='pending'
        )
        
        db.session.add(plantation_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Plantation request uploaded successfully',
            'request_id': plantation_request.id,
            'plant_type': data.get('plant_type', 'Unknown')
        }), 201
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/approve-request/<int:request_id>', methods=['POST'])
def approve_plantation_request(request_id):
    """Admin approves request, mints NFT, and issues credits"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        action = data.get('action')  # 'approve' or 'reject'
        
        if not admin_id:
            return jsonify({'error': 'Admin ID required'}), 400
        
        # Check if admin exists
        admin = User.query.get(admin_id)
        if not admin or admin.role != 'admin':
            return jsonify({'error': 'Invalid admin'}), 400
        
        # Get plantation request
        plantation_request = PlantationRequest.query.get(request_id)
        if not plantation_request:
            return jsonify({'error': 'Request not found'}), 404
        
        if plantation_request.status != 'pending':
            return jsonify({'error': 'Request already processed'}), 400
        
        if action == 'reject':
            plantation_request.status = 'rejected'
            db.session.commit()
            return jsonify({'message': 'Request rejected'}), 200
        
        # Approve request
        plantation_request.status = 'approved'
        
        # Calculate credits (1 credit per ton of CO2)
        credits = plantation_request.co2_removed
        
        # Issue fungible tokens and mint NFT
        user = plantation_request.user
        token_data = issue_fungible_tokens(
            user_id=user.id,
            credits=credits,
            plant_type=plantation_request.plant_type,
            co2_removed=plantation_request.co2_removed,
            user_name=user.name,
            nft_folder=Config.NFT_FOLDER
        )
        
        # Create carbon credit record
        carbon_credit = CarbonCredit(
            user_id=user.id,
            plantation_request_id=plantation_request.id,
            credits=credits,
            nft_metadata=token_data['nft_metadata'],
            tx_hash=token_data['tx_hash']
        )
        
        db.session.add(carbon_credit)
        
        # Log transaction to explorer
        block_number = get_next_block_number()
        transaction = Transaction(
            from_user=None,  # Minting transaction
            to_user=user.id,
            credits=credits,
            tx_hash=token_data['tx_hash'],
            block_number=block_number
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Request approved and credits issued',
            'credits': credits,
            'tx_hash': token_data['tx_hash'],
            'block_number': block_number,
            'nft_metadata': token_data['nft_metadata']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/marketplace', methods=['GET'])
def marketplace():
    """List available credits for sale"""
    try:
        # Get all carbon credits that are available for sale (credits > 0) from cultivators only
        credits = CarbonCredit.query.join(User).filter(
            CarbonCredit.credits > 0,
            User.role == 'cultivator'
        ).all()
        
        marketplace_data = []
        for credit in credits:
            user = credit.user
            marketplace_data.append({
                'credit_id': credit.id,
                'seller_name': user.name,
                'seller_wallet': user.wallet_address,
                'credits': round(float(credit.credits), 2),
                'plant_type': credit.plantation_request.plant_type if credit.plantation_request else 'Unknown',
                'co2_removed': round(float(credit.plantation_request.co2_removed if credit.plantation_request else 0), 2),
                'created_at': credit.created_at.isoformat(),
                'nft_metadata': credit.nft_metadata
            })
        
        return jsonify({
            'credits': marketplace_data,
            'total_credits': len(marketplace_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/create-payment-order', methods=['POST'])
def create_payment_order():
    """Create Razorpay payment order"""
    try:
        data = request.get_json()
        amount = data.get('amount')  # Amount in rupees
        credits = data.get('credits')
        buyer_id = data.get('buyer_id')
        credit_id = data.get('credit_id')
        
        if not all([amount, credits, buyer_id, credit_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create Razorpay order
        order_data = {
            'amount': int(amount * 100),  # Convert to paise
            'currency': 'INR',
            'receipt': f'carbon_credits_{credit_id}_{uuid.uuid4().hex[:8]}',
            'notes': {
                'credits': credits,
                'buyer_id': buyer_id,
                'credit_id': credit_id,
                'description': f'Purchase of {credits} carbon credits'
            }
        }
        
        # Create demo order (simulating Razorpay)
        order_id = f'order_{uuid.uuid4().hex[:16]}'
        return jsonify({
            'order_id': order_id,
            'amount': int(amount * 100),
            'currency': 'INR',
            'receipt': f'carbon_credits_{credit_id}_{uuid.uuid4().hex[:8]}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify-payment', methods=['POST'])
def verify_payment():
    """Verify Razorpay payment and complete credit transfer"""
    try:
        data = request.get_json()
        print(f"Payment verification request: {data}")
        
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        buyer_id = data.get('buyer_id')
        credit_id = data.get('credit_id')
        credits_to_buy = data.get('credits')
        
        print(f"Parsed data - buyer_id: {buyer_id}, credit_id: {credit_id}, credits: {credits_to_buy}")
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, buyer_id, credit_id, credits_to_buy]):
            print("Missing required fields")
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        # Skip signature verification for demo purposes
        print(f"Demo payment verification for order: {razorpay_order_id}")
        
        # Get carbon credit
        carbon_credit = CarbonCredit.query.get(credit_id)
        if not carbon_credit:
            print(f"Credit not found for ID: {credit_id}")
            return jsonify({'error': 'Credit not found'}), 404
        
        print(f"Credit found - Available: {carbon_credit.credits}, Requested: {credits_to_buy}")
        
        if carbon_credit.credits < credits_to_buy:
            print(f"Insufficient credits - Available: {carbon_credit.credits}, Requested: {credits_to_buy}")
            return jsonify({'error': 'Insufficient credits available'}), 400
        
        # Get buyer and seller
        buyer = User.query.get(buyer_id)
        seller = User.query.get(carbon_credit.user_id)
        
        if not buyer or not seller:
            return jsonify({'error': 'Invalid buyer or seller'}), 400
        
        if buyer.role != 'company':
            return jsonify({'error': 'Only companies can buy credits'}), 400
        
        # Transfer credits
        tx_hash = generate_tx_hash()
        block_number = get_next_block_number()
        
        # Create transaction record
        transaction = Transaction(
            from_user=seller.id,
            to_user=buyer.id,
            credits=credits_to_buy,
            tx_hash=tx_hash,
            block_number=block_number
        )
        
        db.session.add(transaction)
        
        # Update carbon credit (reduce seller's credits)
        carbon_credit.credits = round(carbon_credit.credits - credits_to_buy, 2)
        
        # If credits are completely sold, delete the credit record
        if carbon_credit.credits <= 0:
            db.session.delete(carbon_credit)
        
        # For companies: Don't create new CarbonCredit records (they just get wallet balance)
        # For cultivators: Create CarbonCredit records so they can sell them
        if buyer.role == 'cultivator':
            buyer_credit = CarbonCredit(
                user_id=buyer.id,
                plantation_request_id=carbon_credit.plantation_request_id,
                credits=credits_to_buy,
                nft_metadata=carbon_credit.nft_metadata,
                tx_hash=tx_hash
            )
            db.session.add(buyer_credit)
        # Companies don't get CarbonCredit records - they just get wallet balance updates
        db.session.commit()
        
        return jsonify({
            'message': 'Payment verified and credits transferred successfully',
            'transaction_id': transaction.id,
            'credits_transferred': round(float(credits_to_buy), 2),
            'new_buyer_credits': round(float(credits_to_buy), 2),
            'remaining_credit_pool': round(float(carbon_credit.credits), 2),
            'tx_hash': tx_hash,
            'block_number': block_number,
            'payment_id': razorpay_payment_id,
            'order_id': razorpay_order_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/buy-credits', methods=['POST'])
def buy_credits():
    """Company buys credits (simulate UPI + blockchain)"""
    try:
        data = request.get_json()
        buyer_id = data.get('buyer_id')
        seller_id = data.get('seller_id')
        credit_id = data.get('credit_id')
        credits_to_buy = data.get('credits')
        upi_id = data.get('upi_id')
        
        if not all([buyer_id, seller_id, credit_id, credits_to_buy, upi_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify buyer and seller exist
        buyer = User.query.get(buyer_id)
        seller = User.query.get(seller_id)
        
        if not buyer or not seller:
            return jsonify({'error': 'Invalid buyer or seller'}), 400
        
        if buyer.role != 'company':
            return jsonify({'error': 'Only companies can buy credits'}), 400
        
        # Get carbon credit
        carbon_credit = CarbonCredit.query.get(credit_id)
        if not carbon_credit:
            return jsonify({'error': 'Credit not found'}), 404
        
        if carbon_credit.credits < credits_to_buy:
            return jsonify({'error': 'Insufficient credits available'}), 400
        
        # Simulate UPI payment (in real app, integrate with payment gateway)
        upi_success = simulate_upi_payment(upi_id, credits_to_buy * 100)  # 100 rupees per credit
        
        if not upi_success:
            return jsonify({'error': 'UPI payment failed'}), 400
        
        # Transfer credits
        tx_hash = generate_tx_hash()
        block_number = get_next_block_number()
        
        # Create transaction record
        transaction = Transaction(
            from_user=seller_id,
            to_user=buyer_id,
            credits=credits_to_buy,
            tx_hash=tx_hash,
            block_number=block_number
        )
        
        db.session.add(transaction)
        
        # Update carbon credit (reduce seller's credits)
        carbon_credit.credits = round(carbon_credit.credits - credits_to_buy, 2)
        
        # Create new carbon credit record for the buyer
        buyer_credit = CarbonCredit(
            user_id=buyer.id,
            plantation_request_id=carbon_credit.plantation_request_id,
            credits=credits_to_buy,
            nft_metadata=carbon_credit.nft_metadata,
            tx_hash=tx_hash
        )
        
        db.session.add(buyer_credit)
        db.session.commit()
        
        return jsonify({
            'message': 'Credits purchased successfully',
            'transaction_id': transaction.id,
            'credits_transferred': round(float(credits_to_buy), 2),
            'new_buyer_credits': round(float(credits_to_buy), 2),
            'remaining_credit_pool': round(float(carbon_credit.credits), 2),
            'tx_hash': tx_hash,
            'block_number': block_number,
            'payment_amount': credits_to_buy * 100
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def simulate_upi_payment(upi_id, amount):
    """Simulate UPI payment (always returns True for demo)"""
    # In real implementation, integrate with UPI payment gateway
    return True

@app.route('/explorer', methods=['GET'])
def explorer():
    """List blockchain-like transactions"""
    try:
        transactions = Transaction.query.order_by(Transaction.block_number.desc()).all()
        
        explorer_data = []
        for tx in transactions:
            from_user_name = tx.sender.name if tx.sender else "System (Minting)"
            to_user_name = tx.receiver.name if tx.receiver else "Unknown"
            
            explorer_data.append({
                'id': tx.id,
                'block_number': tx.block_number,
                'tx_hash': tx.tx_hash,
                'from_user': from_user_name,
                'to_user': to_user_name,
                'credits': round(float(tx.credits), 2),
                'timestamp': tx.created_at.isoformat(),
                'type': 'minting' if tx.from_user is None else 'transfer'
            })
        
        return jsonify({
            'transactions': explorer_data,
            'total_blocks': len(explorer_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    try:
        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            return send_file(file_path)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/invoice/<int:request_id>', methods=['GET'])
def get_invoice(request_id):
    """Generate and return PDF invoice"""
    try:
        # Get plantation request
        plantation_request = PlantationRequest.query.get(request_id)
        if not plantation_request:
            return jsonify({'error': 'Request not found'}), 404
        
        if plantation_request.status != 'approved':
            return jsonify({'error': 'Request not approved yet'}), 400
        
        # Get carbon credit
        carbon_credit = CarbonCredit.query.filter_by(plantation_request_id=request_id).first()
        if not carbon_credit:
            return jsonify({'error': 'Credit not found'}), 404
        
        # Generate invoice
        invoice_path = generate_invoice(
            request_id=request_id,
            user_name=plantation_request.user.name,
            plant_type=plantation_request.plant_type,
            co2_removed=plantation_request.co2_removed,
            credits=carbon_credit.credits,
            tx_hash=carbon_credit.tx_hash,
            invoice_folder=Config.INVOICE_FOLDER
        )
        
        return send_file(invoice_path, as_attachment=True, download_name=f'invoice_{request_id}.pdf')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user/<int:user_id>/credits', methods=['GET'])
def get_user_credits(user_id):
    """Get user's carbon credits and wallet balance"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's carbon credits
        credits = CarbonCredit.query.filter_by(user_id=user_id).all()
        
        # Calculate total credits based on user role
        if user.role == 'company':
            # For companies: Calculate credits from received transactions
            received_transactions = Transaction.query.filter_by(to_user=user_id).all()
            total_credits = round(sum(tx.credits for tx in received_transactions), 2)
        else:
            # For cultivators: Calculate credits from CarbonCredit records
            total_credits = round(sum(credit.credits for credit in credits), 2)
        
        # Get user's transactions
        transactions = Transaction.query.filter(
            (Transaction.from_user == user_id) | (Transaction.to_user == user_id)
        ).order_by(Transaction.created_at.desc()).limit(10).all()
        
        transaction_data = []
        for tx in transactions:
            transaction_data.append({
                'id': tx.id,
                'type': 'sent' if tx.from_user == user_id else 'received',
                'credits': round(float(tx.credits), 2),
                'tx_hash': tx.tx_hash,
                'timestamp': tx.created_at.isoformat(),
                'other_party': tx.receiver.name if tx.from_user == user_id else tx.sender.name if tx.sender else 'System'
            })
        
        return jsonify({
            'user_id': user_id,
            'name': user.name,
            'role': user.role,
            'wallet_address': user.wallet_address,
            'total_credits': total_credits,
            'credits': [{
                'id': credit.id,
                'credits': round(float(credit.credits), 2),
                'plant_type': credit.plantation_request.plant_type if credit.plantation_request else 'Unknown',
                'created_at': credit.created_at.isoformat(),
                'tx_hash': credit.tx_hash,
                'status': credit.plantation_request.status if credit.plantation_request else 'unknown',
                'request_id': credit.plantation_request_id
            } for credit in credits],
            'recent_transactions': transaction_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pending-requests', methods=['GET'])
def get_all_pending_requests():
    """Get all pending plantation requests (for admin)"""
    try:
        requests = PlantationRequest.query.filter_by(status='pending').all()
        
        request_data = []
        for req in requests:
            request_data.append({
                'id': req.id,
                'user_name': req.user.name,
                'user_wallet': req.user.wallet_address,
                'plant_type': req.plant_type,
                'co2_removed': req.co2_removed,
                'photo_path': req.photo_path,
                'created_at': req.created_at.isoformat()
            })
        
        return jsonify({
            'requests': request_data,
            'total_pending': len(request_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
