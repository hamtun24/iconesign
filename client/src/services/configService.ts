import { config, isDevelopment, isProduction } from '../config/env';

export class ConfigService {
  static get apiBaseUrl(): string {
    return config.apiBaseUrl;
  }

  static get isProduction(): boolean {
    return isProduction;
  }

  static get isDevelopment(): boolean {
    return isDevelopment;
  }

  static get ttnCredentials() {
    return config.ttn;
  }

  static validateConfig(): void {
    const requiredVars = {
      VITE_API_BASE_URL: config.apiBaseUrl,
      VITE_TTN_AUTH_USER: config.ttn.authUser,
      VITE_TTN_AUTH_PASS: config.ttn.authPass,
      VITE_TTN_COMPANY_ID: config.ttn.companyId,
    };

    const missing = Object.entries(requiredVars)
      .filter(([key, value]) => !value || value === `undefined`)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      console.warn('Missing or undefined environment variables:', missing);
      
      if (isProduction) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }
  }

  static logConfig(): void {
    if (isDevelopment) {
      console.log('Configuration:', {
        apiBaseUrl: config.apiBaseUrl,
        appEnv: config.appEnv,
        ttnUser: config.ttn.authUser,
        // Don't log sensitive data like passwords
      });
    }
  }
}