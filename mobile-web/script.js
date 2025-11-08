// API Configuration
const API_BASE_URL = 'http://10.0.3.193:8000/api';

// Global state
let currentUser = null;
let currentScreen = 'login-screen';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('carbonchain_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showScreen('upload-screen');
    }
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // File input
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
}

async function demoLogin(role) {
    const demoCredentials = {
        cultivator: { username: 'Demo Cultivator', role: 'cultivator' },
        company: { username: 'Demo Company', role: 'company' },
        admin: { username: 'Demo Admin', role: 'admin' }
    };
    
    const credentials = demoCredentials[role];
    if (!credentials) return;
    
    try {
        showMessage(`Logging in as ${credentials.username}...`, 'success');
        
        const response = await fetch(`http://10.0.3.193:8000/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        
        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            
            // Save to localStorage
            localStorage.setItem('carbonchain_user', JSON.stringify(currentUser));
            
            showMessage(`Welcome, ${currentUser.name}!`, 'success');
            
            // Navigate based on role
            if (role === 'cultivator') {
                showScreen('upload-screen');
            } else if (role === 'admin') {
                showScreen('admin-screen');
            } else {
                showScreen('wallet-screen');
            }
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error('Demo login error:', error);
        showMessage('Demo login failed. Please try again.', 'error');
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const location = document.getElementById('location').value;
    
    // Create user object
    currentUser = {
        id: Date.now().toString(),
        username,
        email,
        location,
        credits: 0
    };
    
    // Save to localStorage
    localStorage.setItem('carbonchain_user', JSON.stringify(currentUser));
    
    // Register with backend
    registerUser(currentUser);
    
    // Show upload screen
    showScreen('upload-screen');
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('User registered:', result);
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        showImagePreview(file);
    }
}

function showImagePreview(file) {
    console.log('Showing image preview for file:', file.name);
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('Image loaded, starting AI analysis');
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').style.display = 'block';
        
        // Start AI analysis
        startAIAnalysis(file);
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('ai-analysis').style.display = 'none';
    document.getElementById('auto-details').style.display = 'none';
    document.getElementById('file-input').value = '';
}

function takePhoto() {
    // For web version, we'll just trigger file input
    document.getElementById('file-input').click();
}

async function startAIAnalysis(file) {
    console.log('Starting AI analysis for file:', file.name);
    
    // Show AI analysis loading
    document.getElementById('ai-analysis').style.display = 'block';
    
    try {
        // Extract EXIF data (geotagging info)
        const exifData = await extractEXIFData(file);
        console.log('EXIF data:', exifData);
        
        // Send to backend for AI analysis
        const analysisResult = await analyzeImageWithAI(file, exifData);
        console.log('AI analysis result:', analysisResult);
        
        // Display results
        displayAnalysisResults(analysisResult);
        
    } catch (error) {
        console.error('AI analysis error:', error);
        showMessage('AI analysis failed. Please try again.', 'error');
        document.getElementById('ai-analysis').style.display = 'none';
    }
}

async function extractEXIFData(file) {
    return new Promise((resolve) => {
        // For demo purposes, we'll simulate EXIF data
        // In a real app, you'd use a library like exif-js
        const mockExifData = {
            latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
            longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
            altitude: 920 + Math.random() * 100,
            timestamp: new Date().toISOString(),
            camera: 'Mobile Camera',
            resolution: '4032x3024'
        };
        
        setTimeout(() => resolve(mockExifData), 1000);
    });
}

async function analyzeImageWithAI(file, exifData) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('exif_data', JSON.stringify(exifData));
    
    try {
        const response = await fetch(`http://10.0.3.193:8000/analyze-plantation`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            // Fallback to mock data if backend is not available
            return generateMockAnalysis(exifData);
        }
    } catch (error) {
        console.log('Backend not available, using mock data');
        return generateMockAnalysis(exifData);
    }
}

function generateMockAnalysis(exifData) {
    const plantTypes = ['Mango', 'Coconut', 'Teak', 'Bamboo', 'Eucalyptus', 'Neem'];
    const growthStages = ['Seedling', 'Young Plant', 'Mature Tree', 'Fruiting'];
    
    return {
        location: `Lat: ${exifData.latitude.toFixed(4)}, Lng: ${exifData.longitude.toFixed(4)}`,
        area: (Math.random() * 5 + 0.5).toFixed(2) + ' hectares',
        plant_type: plantTypes[Math.floor(Math.random() * plantTypes.length)],
        planting_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        growth_stage: growthStages[Math.floor(Math.random() * growthStages.length)],
        confidence: (Math.random() * 0.3 + 0.7).toFixed(2)
    };
}

function displayAnalysisResults(results) {
    // Hide AI analysis loading
    document.getElementById('ai-analysis').style.display = 'none';
    
    // Show auto-filled details
    document.getElementById('auto-location').textContent = results.location;
    document.getElementById('auto-area').textContent = results.area;
    document.getElementById('auto-plant-type').textContent = results.plant_type;
    document.getElementById('auto-planting-date').textContent = results.planting_date;
    document.getElementById('auto-growth-stage').textContent = results.growth_stage;
    document.getElementById('auto-confidence').textContent = `${(results.confidence * 100).toFixed(1)}%`;
    
    document.getElementById('auto-details').style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        document.getElementById('auto-details').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

async function submitPlantationRequest() {
    if (!currentUser) {
        showMessage('Please login first', 'error');
        return;
    }
    
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Please select an image first', 'error');
        return;
    }
    
    // Get the auto-filled data
    const plantationData = {
        location: document.getElementById('auto-location').textContent,
        area: document.getElementById('auto-area').textContent,
        plant_type: document.getElementById('auto-plant-type').textContent,
        planting_date: document.getElementById('auto-planting-date').textContent,
        growth_stage: document.getElementById('auto-growth-stage').textContent
    };
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('user_id', currentUser.id);
    formData.append('plantation_data', JSON.stringify(plantationData));
    
    try {
        showMessage('Submitting plantation request...', 'success');
        
        const response = await fetch(`http://10.0.3.193:8000/upload-request`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('Plantation request submitted successfully!', 'success');
            
            // Reset form
            removeImage();
            
            // Show wallet screen
            setTimeout(() => {
                showScreen('wallet-screen');
                loadWalletData();
            }, 2000);
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showMessage('Submission failed. Please try again.', 'error');
    }
}

// Old upload functions removed - now using AI-powered submitPlantationRequest()

async function loadWalletData() {
    if (!currentUser) return;
    
    try {
        // Load user credits
        const creditsResponse = await fetch(`${API_BASE_URL}/user/${currentUser.id}/credits`);
        if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            updateWalletDisplay(creditsData);
        }
        
        // Load marketplace data
        const marketplaceResponse = await fetch(`${API_BASE_URL}/marketplace`);
        if (marketplaceResponse.ok) {
            const marketplaceData = await marketplaceResponse.json();
            // You can use this data for additional features
        }
        
    } catch (error) {
        console.error('Error loading wallet data:', error);
    }
}

function updateWalletDisplay(data) {
    // Update total credits - show 0 for hackathon demo
    const totalCredits = 0; // Always show 0 for demo
    document.getElementById('total-credits').textContent = totalCredits;
    
    // Update stats - show 0 for hackathon demo
    document.getElementById('credits-earned').textContent = 0;
    document.getElementById('recent-transactions').textContent = 0;
    
    // Update transactions list - show empty for demo
    updateTransactionsList([]);
    
    // Update credits list - show empty for demo
    updateCreditsList([]);
}

function updateTransactionsList(transactions) {
    const container = document.getElementById('transactions-list');
    container.innerHTML = '';
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="transaction-item"><p>No transactions yet</p></div>';
        return;
    }
    
    transactions.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div class="transaction-icon ${tx.type}">
                <i class="fas fa-leaf"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-amount">${tx.amount} Credits</div>
                <div class="transaction-date">${new Date(tx.timestamp).toLocaleDateString()}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateCreditsList(credits) {
    const container = document.getElementById('credits-list');
    container.innerHTML = '';
    
    if (credits.length === 0) {
        container.innerHTML = '<div class="credit-item"><p>No credits earned yet</p></div>';
        return;
    }
    
    credits.forEach(credit => {
        const item = document.createElement('div');
        item.className = 'credit-item';
        item.innerHTML = `
            <div class="credit-icon">
                <i class="fas fa-leaf"></i>
            </div>
            <div class="credit-details">
                <div class="credit-amount">${credit.amount} Credits</div>
                <div class="credit-date">${new Date(credit.timestamp).toLocaleDateString()}</div>
            </div>
            <button class="btn btn-secondary" onclick="downloadInvoice('${credit.id}')">
                <i class="fas fa-download"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

async function downloadInvoice(creditId) {
    try {
        const response = await fetch(`${API_BASE_URL}/invoice/${creditId}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${creditId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Failed to download invoice', 'error');
    }
}

function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show selected screen
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Load data based on screen
    if (screenId === 'wallet-screen') {
        loadWalletData();
    } else if (screenId === 'admin-screen') {
        loadAdminRequests();
    }
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

function showLoading(show) {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.classList.toggle('show', show);
    }
}

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

async function loadAdminRequests() {
    try {
        const response = await fetch(`http://10.0.3.193:8000/admin/requests`);
        if (response.ok) {
            const data = await response.json();
            updateAdminStats(data);
            displayAdminRequests(data.requests);
        }
    } catch (error) {
        console.error('Error loading admin requests:', error);
    }
}

function updateAdminStats(data) {
    const pendingCount = data.requests.filter(req => req.status === 'pending').length;
    const approvedCount = data.requests.filter(req => req.status === 'approved').length;
    
    document.getElementById('pending-requests').textContent = pendingCount;
    document.getElementById('approved-requests').textContent = approvedCount;
}

function displayAdminRequests(requests) {
    const container = document.getElementById('requests-list');
    container.innerHTML = '';
    
    if (requests.length === 0) {
        container.innerHTML = '<div class="request-item"><p>No pending requests</p></div>';
        return;
    }
    
    requests.forEach(request => {
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
            <div class="request-header">
                <span class="request-id">Request #${request.id}</span>
                <span class="request-status ${request.status}">${request.status}</span>
            </div>
            <div class="request-details">
                <div class="request-detail">
                    <label>User</label>
                    <span>${request.user_name}</span>
                </div>
                <div class="request-detail">
                    <label>Plant Type</label>
                    <span>${request.plant_type}</span>
                </div>
                <div class="request-detail">
                    <label>CO2 Removed</label>
                    <span>${request.co2_removed} tons</span>
                </div>
                <div class="request-detail">
                    <label>Date</label>
                    <span>${new Date(request.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="request-actions">
                <button class="btn btn-primary" onclick="approveRequest(${request.id})">
                    <i class="fas fa-check"></i>
                    Approve
                </button>
                <button class="btn btn-danger" onclick="rejectRequest(${request.id})">
                    <i class="fas fa-times"></i>
                    Reject
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function approveRequest(requestId) {
    try {
        const response = await fetch(`http://10.0.3.193:8000/admin/approve/${requestId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showMessage('Request approved successfully!', 'success');
            loadAdminRequests(); // Refresh the list
        } else {
            throw new Error('Approval failed');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showMessage('Failed to approve request', 'error');
    }
}

function rejectRequest(requestId) {
    showMessage('Reject functionality not implemented yet', 'error');
}
