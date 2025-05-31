// TODO: use t3-env (@t3-oss/env-core) + TypeMap (typemap)
// NOTE: remember to update vite-env.d.ts
export const APP_NAME = import.meta.env.VITE_APP_NAME
export const API_URL = import.meta.env.VITE_API_URL
export const TITLE = import.meta.env.VITE_APP_TITLE
export const DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION
export const MODE = import.meta.env.MODE
export const DEBUG = ['test', 'development'].includes(MODE)
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
// eslint-disable-next-line sonarjs/no-redundant-boolean -- not redundant
export const ENABLE_DEVTOOLS: boolean = MODE === 'development' && false
export const COMMIT_HASH = __COMMIT_HASH__

// -----------------------------------------------------------------------------
