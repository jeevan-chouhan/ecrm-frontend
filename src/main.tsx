// IMPORTANT: Initialize CSS variables FIRST before any other imports
// This ensures CSS variables are set before CSS is loaded, preventing FOUC
import './utils/initCssVariables'

import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './redux/store'
import './language' // Initialize i18n
import './index.css'
import App from './App.tsx'
import { GlobalLoader, Toast } from './components/index.ts'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<GlobalLoader />}>
              <GlobalLoader />
              <Toast />
              <App />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>
)
