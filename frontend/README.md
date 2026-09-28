# CarbonChain Frontend

Next.js and TypeScript web application for the CarbonChain carbon-credit marketplace.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx      # Navigation component
│   │   └── LoadingSpinner.jsx
│   ├── pages/              # Page components
│   │   ├── Login.jsx       # User registration/login
│   │   ├── Cultivator.jsx  # Cultivator dashboard
│   │   ├── Admin.jsx       # Admin dashboard
│   │   ├── Marketplace.jsx # Credit marketplace
│   │   └── Explorer.jsx    # Blockchain explorer
│   ├── styles/             # Global styles
│   │   └── global.css      # TailwindCSS + custom styles
│   ├── utils/              # Utility functions
│   │   └── api.js          # API client
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── package.json
├── tailwind.config.js      # TailwindCSS configuration
├── vite.config.js          # Vite configuration
└── README.md
```

## 🎨 Design System

### Colors
- **Primary Green**: `#22c55e` - Main brand color
- **Secondary Gray**: `#64748b` - Neutral elements
- **Success**: `#16a34a` - Success states
- **Warning**: `#f59e0b` - Warning states
- **Error**: `#dc2626` - Error states

### Typography
- **Headings**: Bold, modern sans-serif
- **Body**: Clean, readable text
- **Code**: Monospace for hashes and addresses

### Components

#### Buttons
```jsx
// Primary button
<button className="btn btn-primary">Primary Action</button>

// Secondary button
<button className="btn btn-secondary">Secondary Action</button>

// Outline button
<button className="btn btn-outline">Outline Action</button>
```

#### Cards
```jsx
<div className="card p-6">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

#### Inputs
```jsx
<input 
  className="input w-full" 
  placeholder="Enter text" 
/>
```

## 📱 Pages

### Login Page (`/login`)
- User registration form
- Role selection (Cultivator, Company, Admin)
- Wallet address input
- Form validation

### Cultivator Dashboard (`/`)
- Plantation photo upload
- CO2 removal estimation
- AI plant detection results
- Credit balance display
- Transaction history
- Invoice download

### Admin Dashboard (`/admin`)
- Pending request review
- Photo preview
- Approve/reject actions
- Request details

### Marketplace (`/marketplace`)
- Available credits listing
- Credit purchase interface
- Razorpay checkout linked to Polygon Amoy ownership transfer
- Market statistics

### Explorer (`/explorer`)
- Blockchain transaction history
- Animated timeline
- Transaction details
- Block information

## 🎭 Animations

### GSAP Integration
The application uses GSAP for smooth animations:

```javascript
import { gsap } from 'gsap';

// Fade in animation
gsap.fromTo('.element', 
  { opacity: 0, y: 30 },
  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
);

// Stagger animation
gsap.fromTo('.items', 
  { opacity: 0, x: -100 },
  { opacity: 1, x: 0, duration: 0.6, stagger: 0.1 }
);
```

### Custom CSS Animations
```css
/* Float animation */
.float-animation {
  animation: float 3s ease-in-out infinite;
}

/* Pulse glow effect */
.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Blockchain timeline */
.blockchain-timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #22c55e, #16a34a);
  transform: translateX(-50%);
}
```

## 🔌 API Integration

### API Client
The application uses Axios for API calls:

```javascript
// API base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Methods
```javascript
// Plantation requests
export const plantationAPI = {
  uploadRequest: (formData) => api.post('/upload-request', formData),
  getPendingRequests: () => api.get('/pending-requests'),
  approveRequest: (requestId, data) => api.post(`/approve-request/${requestId}`, data),
};

// Marketplace
export const marketplaceAPI = {
  getCredits: () => api.get('/marketplace'),
  buyCredits: (data) => api.post('/buy-credits', data),
};

// User management
export const userAPI = {
  getUserCredits: (userId) => api.get(`/user/${userId}/credits`),
};
```

## 🎯 State Management

### Local State
Each component manages its own state using React hooks:

```javascript
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
```

### Global State
User authentication state is managed globally:

```javascript
// App.jsx
const [user, setUser] = useState(null);

// Pass user data to all components
<CultivatorDashboard user={user} />
```

### Local Storage
User session is persisted in localStorage:

```javascript
// Save user session
localStorage.setItem('user', JSON.stringify(userData));

// Load user session
const savedUser = localStorage.getItem('user');
if (savedUser) {
  setUser(JSON.parse(savedUser));
}
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile first approach */
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

/* Grid layouts */
.grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

/* Responsive text */
.text-responsive {
  @apply text-sm sm:text-base lg:text-lg;
}
```

### Mobile Navigation
```javascript
// Mobile menu state
const [isMenuOpen, setIsMenuOpen] = useState(false);

// Toggle mobile menu
<button onClick={() => setIsMenuOpen(!isMenuOpen)}>
  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
</button>
```

## 🎨 Styling

### TailwindCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          // ... more shades
          900: '#14532d',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'bounce-in': 'bounceIn 0.8s ease-out',
      },
    },
  },
  plugins: [],
};
```

### Custom CSS
```css
/* Global styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700;
  }
}
```

## 🧪 Testing

### Running Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:coverage
```

### Example Test
```javascript
import { render, screen } from '@testing-library/react';
import Login from './pages/Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByText('Welcome to CarbonChain')).toBeInTheDocument();
});
```

## 🚀 Build and Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deployment Options

#### Vercel
1. Connect your GitHub repository
2. Configure build settings
3. Deploy automatically

#### Netlify
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

#### Manual Deployment
1. Build the project: `npm run build`
2. Upload `dist` folder to your web server
3. Configure server to serve SPA

## 🔧 Configuration

### Environment Variables
Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CarbonChain
```

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Check if backend server is running
   - Verify API base URL configuration
   - Check CORS settings

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify all dependencies are installed

3. **Styling Issues**
   - Check TailwindCSS configuration
   - Verify CSS imports
   - Check for conflicting styles

4. **Animation Issues**
   - Ensure GSAP is properly imported
   - Check animation target elements exist
   - Verify animation timing

### Debug Mode
Enable debug mode for development:

```javascript
// Add to main.jsx
if (import.meta.env.DEV) {
  console.log('Development mode enabled');
}
```

## 📊 Performance Optimization

### Code Splitting
```javascript
// Lazy load components
const AdminDashboard = lazy(() => import('./pages/Admin'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### Image Optimization
```javascript
// Lazy load images
<img 
  src={imageUrl} 
  loading="lazy" 
  alt="Plantation photo"
/>
```

### Bundle Analysis
```bash
npm run build -- --analyze
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.









