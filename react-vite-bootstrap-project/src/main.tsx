import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import { initTelemetry } from '@/shared/telemetry/sentryTelemetry';
import '@/shared/global.css';

initTelemetry();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
