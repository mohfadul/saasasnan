# Healthcare SaaS Mobile App

A comprehensive React Native mobile application for patients to manage their healthcare appointments, medical records, billing, and communication with their dental practice.

## Features

### 🔐 Authentication
- Secure login and registration
- JWT token-based authentication
- Automatic token refresh
- Biometric authentication support
- Password recovery

### 📅 Appointments
- View upcoming and past appointments
- Book new appointments with available time slots
- Reschedule and cancel appointments
- Appointment reminders and notifications
- Provider selection and availability

### 📋 Medical Records
- Access clinical notes and treatment history
- View treatment plans and progress
- Download and share medical documents
- Health summary and analytics
- Medication tracking

### 💳 Billing & Payments
- View invoices and payment history
- Make secure online payments
- Payment method management
- Insurance information tracking
- Outstanding balance monitoring

### 🔔 Notifications
- Push notifications for appointments
- Billing and payment alerts
- Clinical updates and reminders
- Emergency contact notifications

### 👤 Profile Management
- Personal information management
- Insurance details and emergency contacts
- Medical history and allergies
- Privacy settings and preferences

## Technology Stack

### Core Technologies
- **React Native 0.72.6** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation 6** - Navigation and routing
- **TanStack Query** - Data fetching and state management
- **Zustand** - Lightweight state management

### UI & Styling
- **React Native Paper** - Material Design components
- **React Native Vector Icons** - Icon library
- **React Native Calendars** - Calendar components
- **React Native Reanimated** - Smooth animations
- **Custom styling** - Tailwind-inspired design system

### Data & API
- **Axios** - HTTP client for API communication
- **AsyncStorage** - Local data persistence
- **React Native Keychain** - Secure credential storage
- **React Query** - Server state management

### Additional Features
- **React Native Firebase** - Push notifications and analytics
- **React Native Image Picker** - Photo and document capture
- **React Native QR Code** - QR code generation and scanning
- **React Native Signature** - Digital signature capture
- **React Native Share** - Document sharing capabilities

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components
│   │   ├── appointments/   # Appointment-related components
│   │   ├── billing/        # Billing and payment components
│   │   └── notifications/  # Notification components
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── home/          # Dashboard and home screen
│   │   ├── appointments/  # Appointment management screens
│   │   ├── records/       # Medical records screens
│   │   ├── billing/       # Billing and payment screens
│   │   ├── profile/       # Profile and settings screens
│   │   └── common/        # Shared screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/          # API services and utilities
│   ├── store/             # State management (Zustand)
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main application component
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **iOS Setup (macOS only)**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update API endpoints and configuration

5. **Run the application**
   ```bash
   # Start Metro bundler
   npm start
   
   # Run on Android
   npm run android
   
   # Run on iOS
   npm run ios
   ```

## API Integration

The mobile app integrates with the Healthcare SaaS backend API:

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Appointment Endpoints
- `GET /appointments` - Get user appointments
- `POST /appointments` - Book new appointment
- `PATCH /appointments/:id/reschedule` - Reschedule appointment
- `PATCH /appointments/:id/cancel` - Cancel appointment
- `GET /appointments/available-slots` - Get available time slots

### Clinical Endpoints
- `GET /clinical/notes` - Get clinical notes
- `GET /clinical/treatment-plans` - Get treatment plans
- `GET /clinical/notes/:id` - Get specific clinical note
- `GET /clinical/treatment-plans/:id` - Get specific treatment plan

### Billing Endpoints
- `GET /billing/invoices` - Get invoices
- `GET /billing/payments` - Get payment history
- `POST /billing/payments` - Make payment
- `GET /billing/invoices/:id` - Get specific invoice

## Key Features Implementation

### 1. Authentication Flow
```typescript
// Secure token storage with automatic refresh
const { login, logout, isAuthenticated } = useAuthStore();

// Automatic token refresh on API calls
apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken();
      return apiService(originalRequest);
    }
  }
);
```

### 2. Appointment Booking
```typescript
// Real-time availability checking
const { data: availableSlots } = useQuery({
  queryKey: ['available-slots', providerId, date],
  queryFn: () => apiService.getAvailableSlots(providerId, date),
  enabled: !!providerId && !!date,
});

// Optimistic updates for better UX
const bookAppointmentMutation = useMutation({
  mutationFn: apiService.bookAppointment,
  onSuccess: () => {
    queryClient.invalidateQueries(['appointments']);
    showSuccessToast('Appointment booked successfully!');
  },
});
```

### 3. Push Notifications
```typescript
// Firebase messaging setup
import messaging from '@react-native-firebase/messaging';

// Request permission and get token
const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;
  
  if (enabled) {
    const token = await messaging().getToken();
    await apiService.updateDeviceToken(token);
  }
};
```

### 4. Offline Support
```typescript
// Offline data caching with React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});
```

## Security Features

### Data Protection
- **Encrypted Storage**: Sensitive data encrypted using React Native Keychain
- **Token Management**: Secure JWT token storage with automatic refresh
- **API Security**: All API calls include authentication headers
- **Input Validation**: Client-side validation for all forms

### Privacy Compliance
- **HIPAA Compliance**: Patient data protection measures
- **Secure Communication**: HTTPS for all API communications
- **Data Minimization**: Only necessary data stored locally
- **User Consent**: Clear privacy policies and consent mechanisms

## Performance Optimizations

### 1. Image Optimization
- Lazy loading for images
- Image caching and compression
- Progressive image loading

### 2. Data Fetching
- React Query for efficient data caching
- Optimistic updates for better UX
- Background data synchronization

### 3. Navigation Performance
- Lazy loading of screen components
- Navigation state persistence
- Smooth transitions with Reanimated

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Code Quality
```bash
npm run lint
npm run type-check
```

## Deployment

### Android
1. Generate signed APK:
   ```bash
   npm run build:android
   ```

2. Upload to Google Play Store

### iOS
1. Build for release:
   ```bash
   npm run build:ios
   ```

2. Upload to App Store Connect

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## Support

For support and questions:
- Email: support@healthcaresaas.com
- Documentation: [docs.healthcaresaas.com](https://docs.healthcaresaas.com)
- Issues: [GitHub Issues](https://github.com/healthcaresaas/mobile-app/issues)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
