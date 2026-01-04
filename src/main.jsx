import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from './App.jsx'
import ErrorBoundary from './component/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <App />
      </ErrorBoundary>
  </Provider>
)
