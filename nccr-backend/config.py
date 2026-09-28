import os
from dotenv import load_dotenv
from pathlib import Path

# Get the directory where this config.py file is located
basedir = Path(__file__).parent.absolute()

# Load .env file from the same directory as config.py
env_path = basedir / '.env'
load_dotenv(dotenv_path=env_path, override=True)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///carbonchain.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'uploads'
    INVOICE_FOLDER = 'invoices'
    NFT_FOLDER = 'nfts'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    GEMINI_API_KEY = os.environ.get('OPENROUTER_API_KEY') or os.environ.get('GEMINI_API_KEY')
    
    # Debug: Print API key status (without exposing the full key)
    @staticmethod
    def get_gemini_key_status():
        key = os.environ.get('OPENROUTER_API_KEY') or os.environ.get('GEMINI_API_KEY')
        if key:
            return f"✅ API Key loaded (length: {len(key)}, starts with: {key[:10]}...)"
        return "❌ API Key not found"




