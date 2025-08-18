
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_TTN_AUTH_USER: string;
  readonly VITE_TTN_AUTH_PASS: string;
  readonly VITE_TTN_COMPANY_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

