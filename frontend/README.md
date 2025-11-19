# ChiroClickCRM Frontend

Production-ready React frontend for ChiroClickCRM - Norwegian Healthcare EHR/CRM System.

## 🚀 Features

### ✅ Security (Production-Ready)
- **CSRF Protection** - Automatic token handling in all API requests
- **Clerk Authentication** - OAuth 2.0 with 2FA enforcement
- **Multi-Tenant Isolation** - Organization ID in all requests
- **Input Sanitization** - DOMPurify for XSS prevention
- **Norwegian ID Validation** - Client-side Mod11 algorithm
- **Error Handling** - 429 (rate limit), 403 (2FA required) handling
- **Session Management** - Automatic timeout detection
- **Audit Logging** - Patient access tracking

### ✅ Norwegian Compliance
- **Fødselsnummer Validation** - Complete Mod11 checksum validation
- **ICPC-2 Codes** - Comprehensive diagnosis code database
- **Norwegian Language** - UI elements and formats
- **Currency** - NOK display and formatting
- **Date/Time** - Europe/Oslo timezone

### ✅ Clinical Features
- **SOAP Notes** - Structured clinical documentation
- **Quick Text Presets** - Efficiency tools for common phrases
- **Pain Scale (VAS)** - Visual analog scale 0-10
- **Diagnosis Codes** - ICPC-2 with search and filtering
- **Treatment Codes** - Norwegian takster with pricing
- **Red Flag Alerts** - Patient safety warnings
- **Clinical Validation** - Backend AI validation integration

### ✅ Performance
- **React Query** - Data caching and optimization
- **Lazy Loading** - Code splitting for faster initial load
- **Debounced Search** - Optimized API calls
- **Optimistic UI** - Instant feedback on mutations

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running on `http://localhost:3000`
- Clerk account with publishable key

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## ⚙️ Configuration

### Required Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Environment
VITE_ENV=development
```

### Clerk Setup

1. Create Clerk application at https://clerk.com
2. Enable **Email + Password** authentication
3. Enable **2FA** for admin users
4. Set user metadata schema:
   ```json
   {
     "publicMetadata": {
       "role": "PRACTITIONER",
       "organizationId": "org-xxx"
     }
   }
   ```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js           # API client with CSRF & auth
│   ├── components/
│   │   ├── clinical/
│   │   │   └── SoapNoteBuilder.jsx
│   │   ├── dashboard/
│   │   ├── patients/
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Badge.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Alert.jsx
│   │       └── LoadingSpinner.jsx
│   ├── hooks/
│   │   ├── useAuth.js          # Clerk auth wrapper
│   │   ├── usePatients.js      # Patient data fetching
│   │   ├── useEncounters.js    # Clinical notes fetching
│   │   └── useCodes.js         # ICPC-2 codes fetching
│   ├── utils/
│   │   └── norwegianIdValidation.js  # Mod11 validation
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind styles
├── public/
├── .env.example
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🔐 Security Features

### CSRF Token Handling

All non-GET requests automatically include CSRF token:

```javascript
// Automatic in api/client.js
headers: {
  'X-CSRF-Token': getCsrfToken()
}
```

### Organization Isolation

All requests include organization ID:

```javascript
headers: {
  'X-Organization-Id': getOrganizationId()
}
```

### Input Sanitization

All user input is sanitized before submission:

```javascript
import DOMPurify from 'dompurify';

const cleaned = DOMPurify.sanitize(userInput);
```

### Error Handling

```javascript
// 429 Rate Limit
if (response.status === 429) {
  alert(`Rate limit exceeded. Retry in ${data.retryAfter}s`);
}

// 403 2FA Required
if (response.status === 403 && data.action === 'ENABLE_2FA') {
  window.location.href = data.setupUrl;
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check
```

## 🏗️ Building for Production

```bash
# Create production build
npm run build

# Output in dist/ folder
```

### Production Checklist

- [ ] Set `VITE_ENV=production`
- [ ] Use production Clerk keys
- [ ] Configure production API URL
- [ ] Enable source maps for debugging
- [ ] Test CSRF token refresh
- [ ] Verify 2FA enforcement
- [ ] Test rate limiting behavior
- [ ] Verify audit logging
- [ ] Test GDPR export functionality

## 📚 API Integration

### Example: Fetching Patients

```javascript
import { usePatients } from './hooks/usePatients';

const { data, isLoading, error } = usePatients({ page: 1, limit: 20 });

if (isLoading) return <LoadingSpinner />;
if (error) return <Alert variant="danger">{error.message}</Alert>;

return (
  <div>
    {data.patients.map(patient => (
      <PatientCard key={patient.id} patient={patient} />
    ))}
  </div>
);
```

### Example: Creating Encounter

```javascript
import { useCreateEncounter } from './hooks/useEncounters';

const createEncounter = useCreateEncounter();

const handleSave = async (noteData) => {
  try {
    await createEncounter.mutateAsync({
      patientId: patient.id,
      subjective: noteData.subjective,
      objective: noteData.objective,
      assessment: noteData.assessment,
      plan: noteData.plan,
      diagnosisCodes: noteData.diagnosisCodes,
      treatmentCodes: noteData.treatmentCodes
    });
    alert('Encounter saved successfully!');
  } catch (error) {
    alert(`Failed: ${error.message}`);
  }
};
```

## 🔒 Norwegian ID Validation

```javascript
import { validateFodselsnummer, maskFodselsnummer } from './utils/norwegianIdValidation';

// Validate before submission
if (!validateFodselsnummer(fnr)) {
  setError('Invalid Norwegian fødselsnummer');
  return;
}

// Display masked version
const masked = maskFodselsnummer(fnr); // "01*******45"
```

## 🐛 Troubleshooting

### CSRF Token Errors

If you get "Invalid CSRF token" errors:

1. Check cookies are enabled
2. Verify `withCredentials: true` in axios config
3. Check backend allows `credentials: 'include'`

### 2FA Redirect Loop

If you get stuck in 2FA redirect:

1. Clear browser cookies
2. Log out of Clerk
3. Re-login and enable 2FA in Clerk dashboard

### Rate Limit Errors

If you hit rate limits during development:

1. Wait for the retry period
2. Use different test accounts
3. Contact backend admin to reset rate limit

## 📖 Documentation

- [Backend API Docs](../INTEGRATION_EXAMPLES.md)
- [Security Guide](../SECURITY.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Clerk Docs](https://clerk.com/docs)
- [React Query Docs](https://react-query.tanstack.com/)

## 🤝 Contributing

1. Create feature branch
2. Follow existing code style
3. Add tests for new features
4. Update documentation
5. Submit pull request

## 📝 License

MIT - See LICENSE file for details

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0
**Status:** Production-Ready
