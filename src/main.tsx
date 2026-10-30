import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Bootstrap } from './initialization/Bootstrap'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
