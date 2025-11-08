# CarbonChain Mobile App

React Native mobile application for the CarbonChain carbon credit marketplace.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Expo CLI
- Expo Go app on your mobile device

### Installation

1. **Navigate to mobile directory:**
```bash
cd mobile
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start Expo development server:**
```bash
npx expo start
```

4. **Run on device:**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator
   - Or press `a` for Android emulator

## 📱 Features

### Core Features
- **User Registration** with role selection
- **Photo Upload** for plantation requests
- **AI Plant Detection** results display
- **Wallet Management** with credit balance
- **Transaction History** viewing
- **PDF Invoice** download and viewing
- **Offline Support** with AsyncStorage

### User Roles
- **Cultivator**: Upload plantations, earn credits
- **Company**: Purchase credits (future feature)
- **Admin**: Review requests (future feature)

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── screens/             # Screen components
│   │   ├── LoginScreen.js   # User registration
│   │   ├── UploadScreen.js  # Photo upload
│   │   ├── WalletScreen.js  # Credit management
│   │   └── InvoiceViewerScreen.js # PDF viewing
│   └── utils/               # Utility functions
│       └── api.js           # API client
├── App.js                   # Main app component
├── app.json                 # Expo configuration
├── package.json
└── README.md
```

## 🎨 Design System

### Colors
- **Primary Green**: `#22c55e` - Main brand color
- **Background**: `#f0fdf4` - Light green background
- **Text**: `#374151` - Dark gray text
- **Secondary**: `#6b7280` - Medium gray

### Components

#### Buttons
```javascript
// Primary button
<Button mode="contained" buttonColor="#22c55e">
  Primary Action
</Button>

// Outlined button
<Button mode="outlined" textColor="#22c55e">
  Secondary Action
</Button>
```

#### Cards
```javascript
<Card style={styles.card}>
  <Card.Content>
    <Title>Card Title</Title>
    <Paragraph>Card content</Paragraph>
  </Card.Content>
</Card>
```

#### Inputs
```javascript
<TextInput
  style={styles.input}
  placeholder="Enter text"
  value={value}
  onChangeText={setValue}
/>
```

## 📱 Screens

### Login Screen
- **Purpose**: User registration and role selection
- **Features**:
  - Name input
  - Wallet address input
  - Role selection (Cultivator, Company, Admin)
  - Form validation
  - API integration

```javascript
const handleSubmit = async () => {
  const response = await fetch('http://localhost:5000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  
  if (response.ok) {
    const userData = await response.json();
    onLogin(userData);
  }
};
```

### Upload Screen
- **Purpose**: Upload plantation photos and details
- **Features**:
  - Camera integration
  - Gallery access
  - CO2 estimation input
  - AI detection results
  - Form submission

```javascript
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });
  
  if (!result.canceled) {
    setUploadData({ ...uploadData, photo: result.assets[0] });
  }
};
```

### Wallet Screen
- **Purpose**: View credits and transaction history
- **Features**:
  - Credit balance display
  - Transaction history
  - Invoice download
  - Pull-to-refresh
  - Navigation to upload

```javascript
const fetchUserData = async () => {
  const response = await userAPI.getUserCredits(user.id);
  setUserCredits(response.data);
};
```

### Invoice Viewer Screen
- **Purpose**: View and download PDF invoices
- **Features**:
  - Invoice details display
  - PDF download
  - Share functionality
  - Professional formatting

## 🔌 API Integration

### API Client
```javascript
// API configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods
export const plantationAPI = {
  uploadRequest: (formData) => api.post('/upload-request', formData),
};

export const userAPI = {
  getUserCredits: (userId) => api.get(`/user/${userId}/credits`),
};
```

### File Upload
```javascript
const formData = new FormData();
formData.append('photo', {
  uri: uploadData.photo.uri,
  type: 'image/jpeg',
  name: 'photo.jpg',
});
formData.append('user_id', user.id);
formData.append('co2_removed', uploadData.co2_removed);
```

## 💾 Data Persistence

### AsyncStorage
User session is persisted using AsyncStorage:

```javascript
// Save user session
await AsyncStorage.setItem('user', JSON.stringify(userData));

// Load user session
const savedUser = await AsyncStorage.getItem('user');
if (savedUser) {
  setUser(JSON.parse(savedUser));
}

// Clear user session
await AsyncStorage.removeItem('user');
```

### State Management
```javascript
// Local state for each screen
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);

// Global state passed through navigation
<Stack.Screen 
  name="Upload" 
  component={UploadScreen}
  initialParams={{ user }}
/>
```

## 🎭 Navigation

### React Navigation Setup
```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

// Navigation structure
<Stack.Navigator>
  {user ? (
    <>
      <Stack.Screen name="Upload" component={UploadScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="InvoiceViewer" component={InvoiceViewerScreen} />
    </>
  ) : (
    <Stack.Screen name="Login" component={LoginScreen} />
  )}
</Stack.Navigator>
```

### Navigation Between Screens
```javascript
// Navigate to another screen
navigation.navigate('Wallet');

// Navigate with parameters
navigation.navigate('InvoiceViewer', { requestId: 123 });

// Go back
navigation.goBack();
```

## 📸 Image Handling

### Image Picker
```javascript
import * as ImagePicker from 'expo-image-picker';

// Request permissions
const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

// Pick from gallery
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 1,
});

// Take photo
const result = await ImagePicker.launchCameraAsync({
  allowsEditing: true,
  aspect: [4, 3],
  quality: 1,
});
```

### Image Display
```javascript
<Image 
  source={{ uri: imageUri }} 
  style={styles.image}
  resizeMode="cover"
/>
```

## 📄 PDF Handling

### PDF Download
```javascript
const downloadInvoice = async (requestId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/invoice/${requestId}`);
    const blob = await response.blob();
    
    // In production, use expo-file-system and expo-sharing
    Alert.alert('Success', 'Invoice downloaded successfully!');
  } catch (error) {
    Alert.alert('Error', 'Failed to download invoice');
  }
};
```

### PDF Viewing
```javascript
// Future implementation with expo-document-picker
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

const viewPDF = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
  });
  
  if (!result.canceled) {
    await Sharing.shareAsync(result.uri);
  }
};
```

## 🎨 Styling

### StyleSheet
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  card: {
    margin: 20,
    elevation: 4,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
```

### React Native Paper Theme
```javascript
import { Provider as PaperProvider } from 'react-native-paper';

const theme = {
  colors: {
    primary: '#22c55e',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#374151',
  },
};

<PaperProvider theme={theme}>
  <App />
</PaperProvider>
```

## 🔧 Configuration

### App Configuration
```json
// app.json
{
  "expo": {
    "name": "CarbonChain",
    "slug": "carbonchain-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#22c55e"
    }
  }
}
```

### Environment Variables
```javascript
// API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// For production
const API_BASE_URL = 'https://api.carbonchain.com/api';
```

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Example
```javascript
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from './src/screens/LoginScreen';

test('renders login form', () => {
  const { getByText } = render(<LoginScreen />);
  expect(getByText('CarbonChain')).toBeTruthy();
});
```

## 🚀 Build and Deployment

### Development Build
```bash
npx expo start
```

### Production Build
```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all
```

### App Store Deployment
```bash
# Submit to app stores
eas submit --platform all
```

## 📱 Platform-Specific Features

### iOS
- **Camera Integration**: Native camera access
- **Photo Library**: Access to photo library
- **Push Notifications**: Local notifications
- **Haptic Feedback**: Touch feedback

### Android
- **Permissions**: Runtime permission handling
- **File System**: Access to device storage
- **Background Tasks**: Background processing
- **Material Design**: Native Android styling

## 🔒 Security

### API Security
```javascript
// Secure API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Data Validation
```javascript
// Input validation
const validateInput = (input) => {
  if (!input || input.trim() === '') {
    Alert.alert('Error', 'Please fill in all fields');
    return false;
  }
  return true;
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro Bundler Error**
   - Clear cache: `npx expo start -c`
   - Reset Metro: `npx expo r -c`

2. **API Connection Error**
   - Check network connectivity
   - Verify API server is running
   - Check CORS settings

3. **Image Upload Error**
   - Check file permissions
   - Verify image format
   - Check file size limits

4. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear Expo cache: `npx expo r -c`
   - Check Expo CLI version

### Debug Mode
```javascript
// Enable debug mode
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs(['Warning: ...']);

// Enable debug logging
console.log('Debug info:', data);
```

## 📊 Performance Optimization

### Image Optimization
```javascript
// Optimize images
<Image 
  source={{ uri: imageUri }} 
  style={styles.image}
  resizeMode="cover"
  loadingIndicatorSource={require('./assets/loading.png')}
/>
```

### Memory Management
```javascript
// Clean up resources
useEffect(() => {
  return () => {
    // Cleanup function
    setData(null);
  };
}, []);
```

### Bundle Size
```bash
# Analyze bundle size
npx expo export --platform ios --dev false
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.









