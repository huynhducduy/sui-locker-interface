export const SUI_LOCKER_CONFIG = {
  // Package ID of the deployed sui_locker module
  PACKAGE_ID: import.meta.env.VITE_SUI_LOCKER_PACKAGE_ID,

  // Module name
  MODULE_NAME: 'sui_locker',

  // Global state object ID (shared object)
  GLOBAL_STATE_ID: import.meta.env.VITE_SUI_LOCKER_GLOBAL_STATE_ID,

  // Default network for development
  NETWORK: import.meta.env.VITE_SUI_NETWORK,
} as const

export const SUI_LOCKER_FUNCTIONS = {
  CREATE_USER_REGISTRY: 'create_user_registry_entry',
  CREATE_VAULT: 'create_vault',
  CREATE_ENTRY: 'create_entry',

  UPDATE_VAULT: 'update_vault',
  UPDATE_ENTRY: 'update_entry',
  DELETE_VAULT: 'delete_vault',
  DELETE_ENTRY: 'delete_entry',

  GET_VAULT_INFO: 'get_vault_info',
  GET_ENTRY_INFO: 'get_entry_info',
  GET_USER_REGISTRY_INFO: 'get_user_registry_info',
  GET_GLOBAL_STATS: 'get_global_stats',
  GET_USER_VAULTS: 'get_user_vaults',
  GET_USER_ENTRIES: 'get_user_entries',
  LIST_USER_VAULTS: 'list_user_vaults',
  LIST_USER_ENTRIES: 'list_user_entries',
  GET_USER_UNIQUE_TAGS: 'get_user_unique_tags',
  USER_HAS_REGISTRY: 'user_has_registry',
} as const
