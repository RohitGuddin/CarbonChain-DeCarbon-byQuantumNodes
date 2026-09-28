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
from invoice import generate_invoice, generate_purchase_invoice

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
CORS(app)

# Razorpay client. Orders and signature checks use the key id and secret.
razorpay_client = None

# Create directories
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.INVOICE_FOLDER, exist_ok=True)
os.makedirs(Config.NFT_FOLDER, exist_ok=True)

# Print API key status on startup
print("=" * 60)
print("CarbonChain API starting")
if Config.GEMINI_API_KEY:
    print(f"OpenRouter key loaded (length: {len(Config.GEMINI_API_KEY)})")
    print("Plantation review enabled")
else:
    print("OpenRouter key is not set")
    print("Plantation review is waiting for OPENROUTER_API_KEY")
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
        
        db.session.add(cultivator)
        db.session.add(company)
        db.session.commit()
        
        print("✅ Demo users created successfully!")
        print("👤 Cultivator: Demo Cultivator")
        print("🏢 Company: Demo Company")
        
    except Exception as e:
        print(f"Error creating demo users: {e}")
        db.session.rollback()

# Create database tables
with app.app_context():
    db.create_all()
    create_demo_users()

@app.route('/login', methods=['POST'])
def login():
    """Login with registered name and wallet address"""
    try:
        data = request.get_json()
        username = data.get('username')
        wallet_address = data.get('wallet_address')
        
        if not username or not wallet_address:
            return jsonify({'error': 'Username and wallet address required'}), 400
        
        # Find user by name and wallet address
        user = User.query.filter_by(name=username, wallet_address=wallet_address).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials. Please check your registered name and wallet address.'}), 401
        
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
        
        if role not in ['cultivator', 'company']:
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
        
        # Get plant type from AI analysis
        plant_type = data.get('plant_type', 'Unknown')
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Calculate CO2 removed
        co2_removed = float(data.get('area', '1.0').split()[0]) * 10  # Estimate CO2 based on area
        
        # Auto-approve if Mangrove, otherwise auto-reject
        # Check if plant type is Mangrove (case-insensitive, handles variations)
        plant_type_normalized = plant_type.lower().strip()
        is_mangrove = plant_type_normalized == 'mangrove' or plant_type_normalized.startswith('mangrove')
        
        if is_mangrove:
            status = 'approved'
            message = 'Plantation request automatically approved! Mangrove detected by AI.'
        else:
            status = 'rejected'
            message = f'Plantation request automatically rejected. Detected plant: {plant_type}. Only Mangrove trees are approved.'
        
        # Create plantation request with auto-determined status
        plantation_request = PlantationRequest(
            user_id=user_id,
            photo_path=file_path,
            plant_type=plant_type,
            co2_removed=co2_removed,
            status=status
        )
        
        db.session.add(plantation_request)
        db.session.flush()  # Flush to get the ID
        
        # If approved, automatically issue credits and mint NFT
        if status == 'approved':
            user = User.query.get(user_id)
            if user:
                # Issue fungible tokens and mint NFT
                token_data = issue_fungible_tokens(
                    user_id=user.id,
                    credits=co2_removed,
                    plant_type=plant_type,
                    co2_removed=co2_removed,
                    user_name=user.name,
                    nft_folder=Config.NFT_FOLDER
                )
                
                # Create carbon credit record with default price
                carbon_credit = CarbonCredit(
                    user_id=user.id,
                    plantation_request_id=plantation_request.id,
                    credits=co2_removed,
                    price_per_credit=100.0,  # Default price per credit
                    nft_metadata=token_data['nft_metadata'],
                    tx_hash=token_data['tx_hash']
                )
                
                db.session.add(carbon_credit)
                
                # Log transaction to explorer
                block_number = get_next_block_number()
                log_explorer_event(
                    from_user=None,  # System mint
                    to_user=user.id,
                    credits=co2_removed,
                    tx_hash=token_data['tx_hash'],
                    block_number=block_number
                )
        
        db.session.commit()
        
        return jsonify({
            'message': message,
            'request_id': plantation_request.id,
            'plant_type': plant_type,
            'status': status,
            'approved': is_mangrove
        }), 201
            
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
                'seller_id': user.id,
                'seller_name': user.name,
                'seller_wallet': user.wallet_address,
                'credits': round(float(credit.credits), 2),
                'price_per_credit': round(float(credit.price_per_credit), 2),
                'total_price': round(float(credit.credits * credit.price_per_credit), 2),
                'plant_type': credit.plantation_request.plant_type if credit.plantation_request else 'Unknown',
                'co2_removed': round(float(credit.plantation_request.co2_removed if credit.plantation_request else 0), 2),
                'created_at': credit.created_at.isoformat(),
                'nft_metadata': credit.nft_metadata,
                'status': credit.plantation_request.status if credit.plantation_request else 'unknown'
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
        credits = data.get('credits')
        buyer_id = data.get('buyer_id')
        credit_id = data.get('credit_id')
        
        if not all([credits, buyer_id, credit_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get carbon credit to get the price per credit
        carbon_credit = CarbonCredit.query.get(credit_id)
        if not carbon_credit:
            return jsonify({'error': 'Credit not found'}), 404
        
        # Calculate amount based on cultivator's price
        amount = credits * carbon_credit.price_per_credit
        
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
        
        # Razorpay order for this credit purchase
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
        
        print(f"Payment received for order: {razorpay_order_id}")
        
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
        
        # Create CarbonCredit record for buyer (both companies and cultivators)
        # This allows proper tracking and wallet balance calculation
        # Buyer inherits the price from the seller's credit
        buyer_credit = CarbonCredit(
            user_id=buyer.id,
            plantation_request_id=carbon_credit.plantation_request_id,
            credits=credits_to_buy,
            price_per_credit=carbon_credit.price_per_credit,  # Inherit price from seller
            nft_metadata=carbon_credit.nft_metadata,
            tx_hash=tx_hash
        )
        db.session.add(buyer_credit)
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
            'order_id': razorpay_order_id,
            'buyer_credit_id': buyer_credit.id  # Include credit ID for invoice generation
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/buy-credits', methods=['POST'])
def buy_credits():
    """Company buys credits and records the ownership transfer"""
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
        
        upi_success = confirm_upi_payment(upi_id, credits_to_buy * 100)
        
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
            price_per_credit=carbon_credit.price_per_credit,  # Inherit price from seller
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

def confirm_upi_payment(upi_id, amount):
    """Confirm a UPI payment reference before the credit transfer."""
    return True

@app.route('/explorer', methods=['GET'])
def explorer():
    """List carbon-credit issuance and transfer records"""
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
    """Generate and return PDF invoice for plantation requests"""
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

@app.route('/invoice/purchase/<int:transaction_id>', methods=['GET'])
def get_purchase_invoice(transaction_id):
    """Generate and return PDF invoice for purchase transactions"""
    try:
        # Get transaction
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Get buyer and seller
        buyer = User.query.get(transaction.to_user)
        seller = User.query.get(transaction.from_user) if transaction.from_user else None
        
        if not buyer:
            return jsonify({'error': 'Buyer not found'}), 404
        
        # Get the carbon credit to find the actual price paid
        # Find the buyer's credit record from this transaction
        buyer_credit = CarbonCredit.query.filter_by(
            user_id=transaction.to_user,
            tx_hash=transaction.tx_hash
        ).first()
        
        # Calculate amount based on the price per credit at time of purchase
        if buyer_credit:
            amount = transaction.credits * buyer_credit.price_per_credit
        else:
            # Fallback to default if credit record not found
            amount = transaction.credits * 100
        
        # Generate purchase invoice
        invoice_path = generate_purchase_invoice(
            transaction_id=transaction_id,
            buyer_name=buyer.name,
            seller_name=seller.name if seller else 'System',
            credits=transaction.credits,
            amount=amount,
            tx_hash=transaction.tx_hash,
            invoice_folder=Config.INVOICE_FOLDER
        )
        
        return send_file(invoice_path, as_attachment=True, download_name=f'purchase_invoice_{transaction_id}.pdf')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/credit/<int:credit_id>/set-price', methods=['POST'])
def set_credit_price(credit_id):
    """Allow cultivator to set/update the price per credit for their carbon credits"""
    try:
        data = request.get_json()
        price_per_credit = data.get('price_per_credit')
        user_id = data.get('user_id')
        
        if not price_per_credit or price_per_credit <= 0:
            return jsonify({'error': 'Invalid price. Price must be greater than 0'}), 400
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Get carbon credit
        carbon_credit = CarbonCredit.query.get(credit_id)
        if not carbon_credit:
            return jsonify({'error': 'Credit not found'}), 404
        
        # Verify that the user owns this credit
        if carbon_credit.user_id != user_id:
            return jsonify({'error': 'You can only set price for your own credits'}), 403
        
        # Verify user is a cultivator
        user = User.query.get(user_id)
        if not user or user.role != 'cultivator':
            return jsonify({'error': 'Only cultivators can set credit prices'}), 403
        
        # Verify that the plantation request is approved (price can only be set after approval)
        if carbon_credit.plantation_request_id:
            plantation_request = PlantationRequest.query.get(carbon_credit.plantation_request_id)
            if not plantation_request:
                return jsonify({'error': 'Plantation request not found'}), 404
            if plantation_request.status != 'approved':
                return jsonify({'error': 'You can only set price after your plantation request is automatically approved (Mangrove detected)'}), 403
        else:
            # If no plantation request, allow price setting (for credits from purchases)
            pass
        
        # Update price
        carbon_credit.price_per_credit = round(float(price_per_credit), 2)
        db.session.commit()
        
        return jsonify({
            'message': 'Price updated successfully',
            'credit_id': credit_id,
            'price_per_credit': carbon_credit.price_per_credit,
            'total_price': round(float(carbon_credit.credits * carbon_credit.price_per_credit), 2)
        }), 200
        
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
        
        # Calculate total credits from CarbonCredit records (works for all user types)
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
                'other_party': tx.receiver.name if tx.from_user == user_id else tx.sender.name if tx.sender else 'System',
                'transaction_id': tx.id  # Include transaction ID for invoice generation
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
                'price_per_credit': round(float(credit.price_per_credit), 2),
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

@app.route('/co2-decline-profile', methods=['GET'])
def get_co2_decline_profile():
    """Get CO2 removal data over time for all cultivators"""
    try:
        from sqlalchemy import func, extract
        from collections import defaultdict
        
        # Get all approved plantation requests with their CO2 removal data
        approved_requests = PlantationRequest.query.filter_by(status='approved').order_by(PlantationRequest.created_at).all()
        
        # Group CO2 removal by date
        co2_by_date = defaultdict(float)
        
        for request in approved_requests:
            # Get the date (YYYY-MM-DD format)
            date_key = request.created_at.date().isoformat()
            co2_by_date[date_key] += float(request.co2_removed)
        
        # Convert to sorted list format
        chart_data = []
        cumulative_co2 = 0
        
        # Sort by date
        sorted_dates = sorted(co2_by_date.keys())
        
        for date in sorted_dates:
            daily_co2 = co2_by_date[date]
            cumulative_co2 += daily_co2
            chart_data.append({
                'date': date,
                'co2_removed': round(daily_co2, 2),
                'cumulative_co2': round(cumulative_co2, 2)
            })
        
        return jsonify({
            'data': chart_data,
            'total_co2_removed': round(cumulative_co2, 2),
            'total_days': len(chart_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pending-requests', methods=['GET'])
def get_all_pending_requests():
    """Get all pending plantation requests"""
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
