import {createFileRoute} from '@tanstack/react-router'

import VaultDetail from '@/views/VaultDetail'

export const Route = createFileRoute('/vault/$vaultId')({
  component: VaultDetail,
})
