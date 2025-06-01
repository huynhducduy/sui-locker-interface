/// <reference types="vite/client" />
declare const __COMMIT_HASH__: string

interface ImportMetaEnv {
  // MARK: BEGIN .env environment variables
  readonly VITE_APP_NAME: string
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_SENTRY_DSN: string

  // SUI Locker specific environment variables
  readonly VITE_SUI_LOCKER_PACKAGE_ID: string
  readonly VITE_SUI_LOCKER_GLOBAL_STATE_ID: string
  readonly VITE_SUI_NETWORK: string
  // MARK: END .env environment variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
