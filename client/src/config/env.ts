export const config = {
  apiBaseUrl: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/xml-signature',
  appEnv: import.meta.env?.VITE_APP_ENV || 'development',
  ttn: {
    authUser: import.meta.env?.VITE_TTN_AUTH_USER || 'ICONEFE',
    authPass: import.meta.env?.VITE_TTN_AUTH_PASS || 'V@xP!8mK#z73Lq9W',
    companyId: import.meta.env?.VITE_TTN_COMPANY_ID || '0786415L',
  },
} as const;

export const isDevelopment = config.appEnv === 'development';
export const isProduction = config.appEnv === 'production';
