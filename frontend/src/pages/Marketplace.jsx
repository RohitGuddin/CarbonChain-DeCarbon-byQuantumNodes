import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { 
  ShoppingCart, 
  Leaf, 
  CreditCard, 
  TrendingUp,
  User,
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react';
import { marketplaceAPI, co2API } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Payment reference id for the Razorpay order
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Marketplace = ({ user }) => {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [buying, setBuying] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [co2Data, setCo2Data] = useState([]);
  const [co2Loading, setCo2Loading] = useState(true);

  useEffect(() => {
    gsap.fromTo('.marketplace-container', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
    fetchCredits();
    fetchCo2DeclineProfile();
  }, []);

  const fetchCo2DeclineProfile = async () => {
    try {
      setCo2Loading(true);
      const response = await co2API.getDeclineProfile();
      setCo2Data(response.data.data || []);
    } catch (error) {
      console.error('Error fetching CO2 decline profile:', error);
      setCo2Data([]);
    } finally {
      setCo2Loading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await marketplaceAPI.getCredits();
      setCredits(response.data.credits || []);
    } catch (error) {
      setMessage('Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrice = async (creditId, currentPrice, creditStatus, e) => {
    // Prevent event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Ensure type consistency for comparison
    const normalizedCreditId = Number(creditId);
    const normalizedEditingPrice = editingPrice ? Number(editingPrice) : null;
    
    console.log('🔧 handleSetPrice called:', { 
      creditId, 
      normalizedCreditId,
      currentPrice, 
      creditStatus, 
      editingPrice,
      normalizedEditingPrice,
      priceInput,
      creditIdType: typeof creditId, 
      editingPriceType: typeof editingPrice,
      willSave: normalizedEditingPrice === normalizedCreditId
    });
    
    // Only allow price editing for approved credits
    if (creditStatus !== 'approved') {
      setMessage('You can only set price after your plantation request is automatically approved (Mangrove detected)');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (normalizedEditingPrice === normalizedCreditId) {
      // Save price
      console.log('💾 Saving price...', { priceInput, creditId: normalizedCreditId });
      const price = parseFloat(priceInput);
      console.log('💾 Parsed price:', price);
      
      if (isNaN(price) || price <= 0) {
        console.log('❌ Invalid price:', price);
        setMessage('Please enter a valid price greater than 0');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      setUpdatingPrice(true);
      console.log('💾 Making API call...', { price, userId: user.id, creditId });
      
      try {
        const response = await fetch(`/api/credit/${creditId}/set-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_per_credit: price,
            user_id: user.id
          })
        });

        console.log('💾 API Response status:', response.status);
        const data = await response.json();
        console.log('💾 API Response data:', data);

        if (response.ok) {
          console.log('✅ Price updated successfully!');
          setMessage('Price updated successfully! The total price has been recalculated.');
          setTimeout(() => setMessage(''), 3000);
          setEditingPrice(null);
          setPriceInput('');
          fetchCredits(); // Refresh credits to show updated total_price
        } else {
          console.error('❌ API Error:', data);
          setMessage(data.error || 'Failed to update price');
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        console.error('❌ Error updating price:', error);
        setMessage('Failed to update price: ' + error.message);
        setTimeout(() => setMessage(''), 3000);
      } finally {
        setUpdatingPrice(false);
      }
    } else {
      // Start editing
      setEditingPrice(normalizedCreditId);
      setPriceInput(currentPrice ? currentPrice.toString() : '100');
    }
  };

  const cancelPriceEdit = () => {
    setEditingPrice(null);
    setPriceInput('');
  };

  const handleBuyCredits = async (creditId, creditsToBuy) => {
    setBuying(creditId);
    setMessage('');

    try {
      // Find the credit to get its price
      const credit = credits.find(c => c.credit_id === creditId);
      if (!credit) {
        throw new Error('Credit not found');
      }
      
      // Calculate amount based on cultivator's price per credit
      const amount = creditsToBuy * credit.price_per_credit;
      
      // Create payment order
      const orderResponse = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: creditsToBuy,
          buyer_id: user.id,
          credit_id: creditId
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      console.log('Payment order created:', orderData);

        // Show Razorpay-style payment modal
        const showRazorpayModal = () => {
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.75);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease-out;
          `;

          // Add comprehensive CSS animations and styles
          const style = document.createElement('style');
          style.textContent = `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from { transform: translateY(-20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes checkmark {
              0% { transform: scale(0) rotate(45deg); opacity: 0; }
              50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
              100% { transform: scale(1) rotate(45deg); opacity: 1; }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }
            .razorpay-input:focus {
              border-color: #3395ff !important;
              box-shadow: 0 0 0 3px rgba(51, 149, 255, 0.1) !important;
              outline: none !important;
            }
            .razorpay-input:invalid {
              border-color: #ef4444 !important;
              animation: shake 0.5s ease-in-out;
            }
            .razorpay-button:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 8px 25px rgba(51, 149, 255, 0.4) !important;
            }
            .razorpay-button:active {
              transform: translateY(0) !important;
            }
          `;
          document.head.appendChild(style);
        
          const modalContent = document.createElement('div');
          modalContent.style.cssText = `
            background: white;
            border-radius: 16px;
            max-width: 420px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05);
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
          `;
        
        modalContent.innerHTML = `
          <div style="padding: 0;">
            <!-- Razorpay Header -->
            <div style="background: linear-gradient(135deg, #3395ff 0%, #1e40af 100%); padding: 24px; border-radius: 16px 16px 0 0; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -50%; right: -20%; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -30%; left: -10%; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
              <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
                <div style="display: flex; align-items: center;">
                  <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.5px;">Razorpay</div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">Secure Payment Gateway</div>
                  </div>
                </div>
                <button id="closeModal" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); font-size: 18px; color: white; cursor: pointer; padding: 10px; border-radius: 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); transition: all 0.2s;">&times;</button>
              </div>
            </div>

            <!-- Payment Summary -->
            <div style="padding: 28px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
              <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                  <span style="color: #64748b; font-size: 18px; font-weight: 600;">Amount to pay</span>
                  <span style="font-weight: 800; color: #1e293b; font-size: 28px; letter-spacing: -0.5px;">₹${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div style="border-top: 2px solid #f1f5f9; padding-top: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 15px; font-weight: 500;">Carbon Credits</span>
                    <span style="color: #1e293b; font-size: 15px; font-weight: 600;">${parseFloat(creditsToBuy).toFixed(2)} credits</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 15px; font-weight: 500;">Order ID</span>
                    <span style="color: #64748b; font-size: 13px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">${orderData.order_id}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 15px; font-weight: 500;">Merchant</span>
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                      <span style="color: #1e293b; font-size: 15px; font-weight: 600;">DeCarbon</span>
                      <span style="color: #94a3b8; font-size: 10px;">by QuantumNodes</span>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-size: 15px; font-weight: 500;">Payment Method</span>
                    <span style="color: #1e293b; font-size: 15px; font-weight: 600;">Credit/Debit Card</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Form -->
            <div style="padding: 28px;">
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 24px 0; letter-spacing: -0.3px;">Payment Details</h3>

                <div style="margin-bottom: 24px;">
                  <label style="display: block; font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 10px;">Card Number</label>
                  <div style="position: relative;">
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" class="razorpay-input" style="
                      width: 100%;
                      padding: 16px 20px;
                      border: 2px solid #e5e7eb;
                      border-radius: 12px;
                      font-size: 16px;
                      box-sizing: border-box;
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                      background: #fafafa;
                      font-weight: 500;
                    " value="4111 1111 1111 1111">
                    <div style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); display: flex; gap: 6px;">
                      <div style="width: 28px; height: 18px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                      <div style="width: 28px; height: 18px; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                    </div>
                  </div>
                </div>

                <div style="display: flex; gap: 20px; margin-bottom: 24px;">
                  <div style="flex: 1;">
                    <label style="display: block; font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 10px;">Expiry Date</label>
                    <input type="text" id="expiry" placeholder="MM/YY" class="razorpay-input" style="
                      width: 100%;
                      padding: 16px 20px;
                      border: 2px solid #e5e7eb;
                      border-radius: 12px;
                      font-size: 16px;
                      box-sizing: border-box;
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                      background: #fafafa;
                      font-weight: 500;
                    " value="12/25">
                  </div>
                  <div style="flex: 1;">
                    <label style="display: block; font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 10px;">CVV</label>
                    <input type="text" id="cvv" placeholder="123" class="razorpay-input" style="
                      width: 100%;
                      padding: 16px 20px;
                      border: 2px solid #e5e7eb;
                      border-radius: 12px;
                      font-size: 16px;
                      box-sizing: border-box;
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                      background: #fafafa;
                      font-weight: 500;
                    " value="123">
                  </div>
                </div>

                <div style="margin-bottom: 28px;">
                  <label style="display: block; font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 10px;">Name on Card</label>
                  <input type="text" id="cardName" placeholder="John Doe" class="razorpay-input" style="
                    width: 100%;
                    padding: 16px 20px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    font-size: 16px;
                    box-sizing: border-box;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: #fafafa;
                    font-weight: 500;
                  " value="${user.name}">
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 28px;">
                  <div style="color: #0f172a; font-size: 14px; line-height: 1.5; font-weight: 500;">
                    Razorpay collects the payment in INR. After confirmation, credit ownership is recorded on Polygon Amoy.
                  </div>
                </div>

                <!-- Pay Button -->
                <button id="payButton" class="razorpay-button" style="
                  width: 100%;
                  background: linear-gradient(135deg, #3395ff 0%, #1e40af 100%);
                  color: white;
                  border: none;
                  border-radius: 14px;
                  padding: 18px 24px;
                  font-size: 18px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  box-shadow: 0 6px 20px rgba(51, 149, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1);
                  position: relative;
                  overflow: hidden;
                  letter-spacing: -0.3px;
                ">
                  <span style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Pay ₹${parseFloat(amount).toFixed(2)}
                  </span>
                </button>

                <!-- Security Footer -->
                <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 2px solid #f1f5f9;">
                  <div style="display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 14px; gap: 12px; font-weight: 500;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #10b981;">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                      <span>Secured by Razorpay</span>
                    </div>
                    <div style="width: 6px; height: 6px; background: #10b981; border-radius: 50%;"></div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #10b981;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>SSL Encrypted</span>
                    </div>
                  </div>
                  <div style="margin-top: 8px; color: #94a3b8; font-size: 12px; font-weight: 400;">
                    Your payment information is secure and encrypted
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
          // Handle payment
          document.getElementById('payButton').onclick = async () => {
            const payButton = document.getElementById('payButton');
            payButton.innerHTML = `
              <span style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div style="width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                Processing Payment...
              </span>
            `;
            payButton.disabled = true;
            payButton.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
            payButton.style.boxShadow = '0 6px 20px rgba(107, 114, 128, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)';
          
          try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify payment
            const paymentData = {
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: `pay_${generateUUID().replace(/-/g, '')}`,
              razorpay_signature: `sig_${generateUUID().replace(/-/g, '')}`,
              buyer_id: user.id,
              credit_id: creditId,
              credits: creditsToBuy
            };
            
            console.log('Sending payment verification:', paymentData);
            
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentData)
            });

            console.log('Payment verification response status:', verifyResponse.status);
            
            if (verifyResponse.ok) {
              const result = await verifyResponse.json();
              console.log('Payment verification result:', result);
              
              // Show success animation
              payButton.innerHTML = `
                <span style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="animation: checkmark 0.6s ease-in-out; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Payment Successful!
                </span>
              `;
              payButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
              payButton.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)';
                
              // Wait a moment then close modal
              setTimeout(() => {
                setMessage(`Successfully purchased ${parseFloat(creditsToBuy).toFixed(2)} credits! Payment completed.`);
                fetchCredits();
                setBuying(null);
                document.body.removeChild(modal);
              }, 1500);
            } else {
              let errorData;
              try {
                errorData = await verifyResponse.json();
              } catch (e) {
                errorData = { error: `HTTP ${verifyResponse.status}: ${verifyResponse.statusText}` };
              }
              console.error('Payment verification failed:', errorData);
              
              // Show error state
              payButton.innerHTML = `
                <span style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  Payment Failed
                </span>
              `;
              payButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
              payButton.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)';
              
              setTimeout(() => {
                setMessage(`Payment verification failed: ${errorData.error || 'Unknown error'}`);
                setBuying(null);
                document.body.removeChild(modal);
              }, 2000);
            }
          } catch (error) {
            console.error('Payment error:', error);
            
            // Show error state
            payButton.innerHTML = `
              <span style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Payment Failed
              </span>
            `;
            payButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            payButton.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)';
            
            setTimeout(() => {
              setMessage(`Payment failed: ${error.message}`);
              setBuying(null);
              document.body.removeChild(modal);
            }, 2000);
          }
        };
        
          // Handle close
          const closeButton = document.getElementById('closeModal');
          closeButton.onclick = () => {
            setMessage('Payment cancelled');
            setBuying(null);
            document.body.removeChild(modal);
          };
          
          // Add hover effect to close button
          closeButton.onmouseover = () => {
            closeButton.style.background = 'rgba(255,255,255,0.25)';
            closeButton.style.transform = 'scale(1.05)';
          };
          closeButton.onmouseout = () => {
            closeButton.style.background = 'rgba(255,255,255,0.15)';
            closeButton.style.transform = 'scale(1)';
          };
        
        // Close on backdrop click
        modal.onclick = (e) => {
          if (e.target === modal) {
            setMessage('Payment cancelled');
            setBuying(null);
            document.body.removeChild(modal);
          }
        };
      };
      
      showRazorpayModal();

    } catch (error) {
      setMessage('Failed to initiate payment');
      setBuying(null);
    }
  };

  return (
    <div className="marketplace-container min-h-screen animated-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30"></div>
            <ShoppingCart className="h-16 w-16 text-green-500 relative z-10" />
          </div>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-4">
          Carbon Credit Marketplace
        </h1>
        <p className="text-lg text-gray-400">
          {user.role === 'cultivator' 
            ? 'View and monitor your carbon credits on the marketplace'
            : 'Buy and sell verified carbon credits'
          }
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg glass border animate-slide-up ${
          message.includes('Successfully') 
            ? 'border-green-500/50 bg-green-500/10 text-green-400' 
            : 'border-red-500/50 bg-red-500/10 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card card-glow p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30 hover-lift">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Market Stats
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold gradient-text">
                  {credits.length}
                </div>
                <div className="text-sm text-gray-400">Available Credits</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-text">
                  {credits.reduce((sum, credit) => sum + credit.credits, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Total Credits</div>
              </div>
            </div>
          </div>

          <div className="card card-glow p-6 hover-lift">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              {user.role === 'cultivator' ? 'Marketplace Overview' : 'How it Works'}
            </h3>
            <div className="space-y-3 text-sm text-gray-400">
            {user.role === 'cultivator' ? (
              <>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">1</div>
                  <span>View your carbon credits on the market</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">2</div>
                  <span>Monitor credit sales and pricing</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">3</div>
                  <span>Track your environmental impact</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">4</div>
                  <span>See how your credits are valued</span>
                </div>
              </>
            ) : (
              <>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">1</div>
                <span>Browse verified carbon credits</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">2</div>
                <span>Select credits to purchase</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">3</div>
                  <span>Complete Razorpay payment</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs font-bold border border-green-500/30">4</div>
                <span>Credits transferred to your wallet</span>
                </div>
              </>
            )}
          </div>
          
          {user.role !== 'cultivator' && (
            <div className="mt-6 p-4 glass border border-green-500/30 bg-green-500/10 rounded-lg">
              <h4 className="text-sm font-semibold text-green-400 mb-2">Purchase</h4>
              <p className="text-xs text-green-200">Razorpay confirms the INR payment. Polygon Amoy records the credit transfer to the company wallet.</p>
            </div>
          )}
          </div>
        </div>

        {/* Credits Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-400">Loading credits...</p>
              </div>
            </div>
          ) : credits.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-block p-6 glass border border-gray-800 rounded-full mb-4">
                <ShoppingCart className="h-12 w-12 text-gray-600" />
              </div>
              <p className="text-xl text-gray-400">No credits available for purchase</p>
              <p className="text-sm text-gray-500 mt-2">Credits will appear here when available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {credits.map((credit) => (
                <div key={credit.credit_id} className="card card-glow p-6 hover-lift" style={{ position: 'relative', overflow: 'visible' }}>
                  <div className="flex items-center justify-between mb-6" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-lg text-gray-200">{parseFloat(credit.credits).toFixed(2)} Credits</span>
                    </div>
                    <div className="text-right" style={{ position: 'relative', zIndex: 100 }}>
                      {(() => {
                        const canEdit = user.role === 'cultivator' && Number(credit.seller_id) === Number(user.id) && credit.status === 'approved';
                        if (user.role === 'cultivator') {
                          console.log('Price edit check:', {
                            canEdit,
                            userRole: user.role,
                            sellerId: credit.seller_id,
                            userId: user.id,
                            idsMatch: Number(credit.seller_id) === Number(user.id),
                            status: credit.status,
                            creditId: credit.credit_id
                          });
                        }
                        return canEdit;
                      })() ? (
                        Number(editingPrice) === Number(credit.credit_id) ? (
                          <div 
                            className="flex items-center space-x-2 relative z-50"
                            style={{ 
                              pointerEvents: 'auto',
                              isolation: 'isolate'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('💾 Enter key pressed, saving...');
                                  handleSetPrice(credit.credit_id, credit.price_per_credit, credit.status, e);
                                }
                              }}
                              className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm focus:outline-none focus:border-green-500 z-50 relative"
                              placeholder="Price"
                              autoFocus
                              style={{ pointerEvents: 'auto' }}
                            />
                            <div 
                              className="relative z-50"
                              style={{ pointerEvents: 'auto', isolation: 'isolate' }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('💾 Save button clicked:', {
                                    creditId: credit.credit_id,
                                    editingPrice,
                                    priceInput,
                                    updatingPrice,
                                    normalizedCreditId: Number(credit.credit_id),
                                    normalizedEditingPrice: editingPrice ? Number(editingPrice) : null,
                                    match: Number(editingPrice) === Number(credit.credit_id),
                                    disabled: updatingPrice
                                  });
                                  
                                  if (updatingPrice) {
                                    console.log('⚠️ Already updating, ignoring click');
                                    return;
                                  }
                                  
                                  // Force save by directly calling the save logic
                                  const price = parseFloat(priceInput);
                                  if (isNaN(price) || price <= 0) {
                                    console.log('❌ Invalid price:', price);
                                    setMessage('Please enter a valid price greater than 0');
                                    setTimeout(() => setMessage(''), 3000);
                                    return;
                                  }
                                  
                                  console.log('💾 Proceeding with save, calling handleSetPrice...');
                                  handleSetPrice(credit.credit_id, credit.price_per_credit, credit.status, e);
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('💾 Save button mousedown');
                                }}
                                disabled={updatingPrice}
                                className="p-2 text-green-500 hover:text-green-400 hover:bg-green-500/20 active:bg-green-500/30 transition-all cursor-pointer rounded-lg border border-green-500/30 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed relative z-50"
                                title={updatingPrice ? "Saving..." : "Save price"}
                                style={{ 
                                  pointerEvents: updatingPrice ? 'none' : 'auto', 
                                  minWidth: '36px', 
                                  minHeight: '36px',
                                  touchAction: 'manipulation',
                                  zIndex: 9999,
                                  position: 'relative'
                                }}
                              >
                                {updatingPrice ? (
                                  <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <div 
                              className="relative z-50"
                              style={{ pointerEvents: 'auto', isolation: 'isolate' }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('❌ Cancel button clicked');
                                  cancelPriceEdit();
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-all cursor-pointer rounded-lg border border-red-500/30 hover:border-red-500/50 relative z-50"
                                title="Cancel editing"
                                style={{ 
                                  pointerEvents: 'auto', 
                                  minWidth: '36px', 
                                  minHeight: '36px',
                                  touchAction: 'manipulation',
                                  zIndex: 9999,
                                  position: 'relative'
                                }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <div className="text-2xl font-bold gradient-text">
                              ₹{credit.total_price.toFixed(2)}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400">
                                ₹{credit.price_per_credit.toFixed(2)} per credit
                              </span>
                              <div 
                                className="relative z-10"
                                style={{ pointerEvents: 'auto' }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('✅ Edit button CLICKED:', { 
                                      creditId: credit.credit_id, 
                                      price: credit.price_per_credit, 
                                      status: credit.status,
                                      sellerId: credit.seller_id,
                                      userId: user.id,
                                      userRole: user.role,
                                      timestamp: new Date().toISOString()
                                    });
                                    // Call handleSetPrice
                                    handleSetPrice(credit.credit_id, credit.price_per_credit, credit.status, e);
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🖱️ Edit button mousedown');
                                  }}
                                  onMouseEnter={() => console.log('🖱️ Edit button hover')}
                                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/20 active:bg-green-500/30 transition-all cursor-pointer rounded-lg border border-gray-600 hover:border-green-500/50 relative z-10 flex items-center justify-center"
                                  title="Click to edit price per credit"
                                  style={{ 
                                    pointerEvents: 'auto', 
                                    minWidth: '36px', 
                                    minHeight: '36px',
                                    touchAction: 'manipulation'
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <>
                          <div className="text-2xl font-bold gradient-text">
                            ₹{credit.total_price.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ₹{credit.price_per_credit.toFixed(2)} per credit
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 glass border border-gray-800 p-2 rounded-lg">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{credit.seller_name}</span>
                    </div>
                    <div className="flex items-center space-x-2 glass border border-gray-800 p-2 rounded-lg">
                      <Leaf className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-300">{credit.plant_type}</span>
                    </div>
                    <div className="glass border border-gray-800 p-2 rounded-lg">
                      <span className="text-xs text-gray-400 block mb-1">CO2 Removed</span>
                      <span className="text-sm font-semibold text-green-400">{credit.co2_removed} tons</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(credit.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user.role === 'cultivator' ? (
                      Number(credit.seller_id) === Number(user.id) && credit.status === 'approved' ? (
                        <div className="w-full py-2.5 text-center text-sm text-green-400 glass border border-green-500/30 rounded-lg">
                          <span className="flex items-center justify-center">
                            <Leaf className="h-4 w-4 mr-1" />
                            Your Credit - Edit Price Above
                          </span>
                        </div>
                      ) : (
                        <div className="w-full py-2.5 text-center text-sm text-gray-500 glass border border-gray-800 rounded-lg">
                          <span className="flex items-center justify-center">
                            <Leaf className="h-4 w-4 mr-1" />
                            View Only - Cannot Purchase
                          </span>
                        </div>
                      )
                    ) : (
                      <>
                    <button
                      onClick={() => handleBuyCredits(credit.credit_id, 1)}
                          disabled={buying === credit.credit_id || credit.credits < 1}
                      className="w-full btn btn-primary py-2.5 text-sm flex items-center justify-center"
                    >
                      {buying === credit.credit_id ? (
                        <div className="flex items-center space-x-2">
                          <div className="spinner"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Buy 1 Credit
                        </>
                      )}
                    </button>
                    
                    {credit.credits > 1 && (
                      <button
                        onClick={() => handleBuyCredits(credit.credit_id, Math.min(credit.credits, 5))}
                            disabled={buying === credit.credit_id || credit.credits < 5}
                        className="w-full btn btn-outline py-2.5 text-sm"
                      >
                            Buy {parseFloat(Math.min(credit.credits, 5)).toFixed(2)} Credits
                      </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CO2 Decline Profile */}
      <div className="mt-8">
        <div className="card card-glow p-6 hover-lift">
          <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-green-500" />
            CO2 Decline Profile
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Track the cumulative CO2 removal from the atmosphere by all cultivators over time
          </p>
          
          {co2Loading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-400">Loading CO2 data...</p>
              </div>
            </div>
          ) : co2Data.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">No CO2 removal data available yet</p>
              <p className="text-sm text-gray-500 mt-2">Data will appear once cultivators start uploading approved plantations</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={co2Data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCo2Marketplace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'CO2 Removed (tons)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#e5e7eb'
                  }}
                  formatter={(value) => [`${value} tons`, 'CO2 Removed']}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend 
                  wrapperStyle={{ color: '#9ca3af' }}
                  formatter={(value) => 'Cumulative CO2 Removed'}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative_co2" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCo2Marketplace)" 
                  name="Cumulative CO2 Removed"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;




