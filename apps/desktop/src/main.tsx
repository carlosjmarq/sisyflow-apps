import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { MotionConfig } from 'motion/react'
import App from './App'
import { ToastProvider } from './components/ui'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import 'material-symbols/rounded.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={400}>
          <ToastProvider>
            <AuthProvider>
              <HashRouter>
                <App />
              </HashRouter>
            </AuthProvider>
          </ToastProvider>
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  </React.StrictMode>,
)
