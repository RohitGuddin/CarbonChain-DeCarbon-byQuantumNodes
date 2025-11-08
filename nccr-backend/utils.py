import uuid
import json
import os
from datetime import datetime

def generate_tx_hash():
    """Generate a random transaction hash using UUID"""
    return str(uuid.uuid4())

def get_next_block_number():
    """Get the next block number (simplified - in real blockchain this would be more complex)"""
    # In a real implementation, this would query the last block number from the database
    # For now, we'll use a simple counter based on current timestamp
    return int(datetime.now().timestamp())

def mint_nft(plant_type, co2_removed, user_name, nft_folder):
    """Mint an NFT by creating metadata JSON file"""
    nft_metadata = {
        "name": f"Carbon Credit NFT - {plant_type}",
        "description": f"Verified carbon credit for {co2_removed} tons CO2 removed by {plant_type}",
        "image": f"https://carbonchain.com/nft/{plant_type.lower()}.png",
        "attributes": [
            {"trait_type": "Plant Type", "value": plant_type},
            {"trait_type": "CO2 Removed", "value": co2_removed},
            {"trait_type": "Cultivator", "value": user_name},
            {"trait_type": "Verification", "value": "NCCR Verified"},
            {"trait_type": "Mint Date", "value": datetime.now().isoformat()}
        ],
        "external_url": "https://carbonchain.com",
        "background_color": "00ff00"
    }
    
    # Ensure NFT folder exists
    os.makedirs(nft_folder, exist_ok=True)
    
    # Save metadata to file
    nft_id = str(uuid.uuid4())
    nft_file_path = os.path.join(nft_folder, f"{nft_id}.json")
    
    with open(nft_file_path, 'w') as f:
        json.dump(nft_metadata, f, indent=2)
    
    return nft_metadata, nft_file_path

def issue_fungible_tokens(user_id, credits, plant_type, co2_removed, user_name, nft_folder):
    """Issue fungible tokens (credits) and mint NFT"""
    nft_metadata, nft_file_path = mint_nft(plant_type, co2_removed, user_name, nft_folder)
    tx_hash = generate_tx_hash()
    
    return {
        'credits': credits,
        'nft_metadata': json.dumps(nft_metadata),
        'tx_hash': tx_hash,
        'nft_file_path': nft_file_path
    }

def log_explorer_event(from_user, to_user, credits, tx_hash, block_number):
    """Log transaction to explorer (Transaction table)"""
    return {
        'from_user': from_user,
        'to_user': to_user,
        'credits': credits,
        'tx_hash': tx_hash,
        'block_number': block_number
    }




