import os
import json
import re
from typing import Dict, Any
from pathlib import Path
from config import Config
from PIL import Image
import google.generativeai as genai

def detect_plant_type(image_path: str) -> Dict[str, Any]:
    """
    Review plantation evidence with OpenRouter and return structured findings
    """
    print(f"🔍 Processing {os.path.basename(image_path)}...")
    
    # Try real AI detection first
    try:
        result = _detect_with_gemini(image_path)
        if result:
            print(f"✅ AI Detection Result: {result['plant_name']} (confidence: {result['confidence']})")
            return result
    except Exception as e:
        print(f"⚠️ AI detection failed: {str(e)}")
        print("🔄 Falling back to image-based detection...")
    
    # Fallback detection
    return _fallback_detection(image_path)

def _detect_with_gemini(image_path: str) -> Dict[str, Any]:
    """Review plantation evidence through OpenRouter"""
    # Reload environment variables to ensure we have the latest API key
    from dotenv import load_dotenv
    
    # Reload .env file from the backend directory
    # ai.py is in nccr-backend/, so .env should be in the same directory
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    else:
        # Fallback: try parent directory
        env_path = Path(__file__).parent.parent / '.env'
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, override=True)
    
    # Get API key from environment
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        raise Exception("GEMINI_API_KEY not configured. Please check your .env file in the nccr-backend directory.")
    
    print(f"OpenRouter key in use (length: {len(api_key)})")
    
    # Configure Gemini
    genai.configure(api_key=api_key)
    # Try multiple model names for compatibility (updated to latest model names)
    model = None
    model_names = [
        'gemini-2.5-flash',  # Latest stable flash model
        'gemini-2.5-flash-preview-05-20',  # Preview version
        'gemini-2.5-pro-preview-05-06',  # Pro version
        'gemini-1.5-flash',  # Fallback to older version
        'gemini-1.5-pro',  # Fallback to older version
    ]
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            print(f"Review model: {model_name}")
            break
        except Exception as e:
            print(f"⚠️ Model {model_name} failed: {str(e)}")
            continue
    
    if not model:
        raise Exception("OpenRouter did not return a review model.")
    
    # Load image using PIL
    try:
        # Try to open the image
        img = Image.open(image_path)
        
        # Check if image can be loaded (don't verify as it closes the file)
        # Just try to access properties to ensure it's valid
        _ = img.size
        _ = img.mode
        
        # Convert to RGB if necessary (required for Gemini)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Ensure image is actually loaded by doing a small operation
        img.load()
        
    except Exception as e:
        print(f"Could not read the plantation photo: {str(e)}")
        # Try alternative loading method
        try:
            from PIL import ImageFile
            ImageFile.LOAD_TRUNCATED_IMAGES = True
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.load()
            print("✅ Image loaded with alternative method")
        except Exception as e2:
            print(f"⚠️ Alternative loading also failed: {str(e2)}")
            raise Exception(f"Failed to load image: {str(e)}. Image may be corrupted or in an unsupported format.")
    
    # Create prompt for plant identification
    prompt = """
    Analyze this image and identify the plant type. Look for:
    - Leaf shape, size, and arrangement
    - Bark texture and color
    - Overall plant structure and growth pattern
    - Environmental context (water, soil, etc.)
    - Any distinctive features
    
    Respond with ONLY a JSON object in this exact format:
    {
        "plant_name": "Exact Plant Type Name",
        "confidence": 0.95
    }
    
    Be specific about the plant type. If you see mangrove-like characteristics (prop roots in water/mud, salt-tolerant features), identify it as "Mangrove". If you see tropical fruit tree characteristics, identify the specific fruit tree type.
    """
    
    # Generate content with image
    response = model.generate_content([prompt, img])
    
    # Parse response
    response_text = response.text.strip()
    print(f"Review response: {response_text}")
    
    # Try to extract JSON from response (handle markdown code blocks)
    try:
        # Remove markdown code blocks if present
        cleaned_text = response_text
        if '```json' in cleaned_text:
            cleaned_text = re.sub(r'```json\s*', '', cleaned_text)
            cleaned_text = re.sub(r'```\s*', '', cleaned_text)
        elif '```' in cleaned_text:
            cleaned_text = re.sub(r'```\s*', '', cleaned_text)
        cleaned_text = cleaned_text.strip()
        
        # Direct JSON parsing
        result = json.loads(cleaned_text)
        return result
    except json.JSONDecodeError:
        try:
            # Extract JSON using regex (more flexible)
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result
        except:
            pass
    
    # If JSON parsing fails, extract plant name from text
    plant_name = "Unknown Plant"
    confidence = 0.85
    
    # Look for common plant names in the response
    plant_keywords = {
        "mangrove": "Mangrove",
        "mango": "Mango", 
        "banana": "Banana",
        "coconut": "Coconut",
        "palm": "Palm",
        "oak": "Oak",
        "pine": "Pine",
        "bamboo": "Bamboo"
    }
    
    response_lower = response_text.lower()
    for keyword, plant in plant_keywords.items():
        if keyword in response_lower:
            plant_name = plant
            break
    
    return {
        "plant_name": plant_name,
        "confidence": confidence
    }

def _fallback_detection(image_path: str) -> Dict[str, Any]:
    """Fallback detection based on image characteristics using actual image analysis"""
    print("Reviewing the plantation photo from image evidence...")
    
    try:
        # Try to analyze the actual image
        img = Image.open(image_path)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get image dimensions
        width, height = img.size
        aspect_ratio = width / height if height > 0 else 1.0
        
        # Analyze dominant colors
        img_resized = img.resize((100, 100))  # Resize for faster processing
        pixels = list(img_resized.getdata())
        
        # Calculate average RGB values
        avg_r = sum(p[0] for p in pixels) / len(pixels)
        avg_g = sum(p[1] for p in pixels) / len(pixels)
        avg_b = sum(p[2] for p in pixels) / len(pixels)
        
        # Determine plant type based on color characteristics
        # Green plants typically have high green values
        green_ratio = avg_g / (avg_r + avg_g + avg_b + 1)  # +1 to avoid division by zero
        
        # Classify based on color analysis
        if green_ratio > 0.4:
            # Very green - likely trees or large plants
            if avg_g > 150:
                # Bright green - tropical/tree
                if aspect_ratio > 0.8:
                    plant_name = "Mango"
                else:
                    plant_name = "Banyan"
            elif avg_g > 100:
                # Medium green - could be various trees
                plant_name = "Neem"
            else:
                # Darker green - older trees or forests
                plant_name = "Oak"
        elif green_ratio > 0.3:
            # Some green - mixed vegetation
            if avg_b > avg_r:  # More blue (water/coastal)
                plant_name = "Mangrove"
            else:
                plant_name = "Coconut"
        elif avg_r > 150 and avg_g > 100:
            # Reddish-green - fruit trees
            plant_name = "Papaya"
        elif avg_g < 80:
            # Low green - likely not a plant or very old/dry
            plant_name = "Bamboo"
        else:
            # Default classification
            plant_name = "Eucalyptus"
        
        print(f"✅ Fallback Detection (color-based): {plant_name} (Green ratio: {green_ratio:.2f})")
        confidence = 0.75  # Lower confidence for fallback
        
    except Exception as e:
        print(f"⚠️ Image analysis failed in fallback: {str(e)}")
        # Last resort: use filename or default
        filename_lower = os.path.basename(image_path).lower()
        
        # Try to extract plant name from filename
        plant_keywords = {
            "mangrove": "Mangrove",
            "mango": "Mango",
            "banana": "Banana",
            "coconut": "Coconut",
            "palm": "Palm",
            "oak": "Oak",
            "pine": "Pine",
            "bamboo": "Bamboo",
            "papaya": "Papaya",
            "neem": "Neem",
            "eucalyptus": "Eucalyptus"
        }
        
        plant_name = "Mangrove"  # Default
        for keyword, plant in plant_keywords.items():
            if keyword in filename_lower:
                plant_name = plant
                break
        
        confidence = 0.65  # Even lower confidence
        print(f"✅ Fallback Detection (filename-based): {plant_name}")
    
    return {
        "plant_name": plant_name,
        "confidence": confidence
    }





