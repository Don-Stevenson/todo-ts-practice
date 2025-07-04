import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PracticeApp from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PracticeApp />
  </StrictMode>
)
