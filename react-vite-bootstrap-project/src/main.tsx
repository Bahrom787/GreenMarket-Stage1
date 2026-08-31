import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import { initYandexMetrica } from '@/shared/analytics/yandexMetrica';
import { initTelemetry } from '@/shared/telemetry/sentryTelemetry';
import '@/shared/global.css';

initTelemetry();
initYandexMetrica();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
