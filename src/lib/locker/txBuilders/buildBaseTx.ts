import type {Transaction} from '@mysten/sui/transactions'

import {SUI_LOCKER_CONFIG} from '@/constants/sui'

export default function buildBaseTx(
  functionName: string,
  builder: ({packageId, globalStateId, target}: {packageId: string; globalStateId: string; target: string}) => Transaction,
) {
  const packageId = SUI_LOCKER_CONFIG.PACKAGE_ID
  const globalStateId = SUI_LOCKER_CONFIG.GLOBAL_STATE_ID

  const target = `${packageId}::${SUI_LOCKER_CONFIG.MODULE_NAME}::${functionName}`

  return builder({
    target,
    packageId,
    globalStateId,
  })
}
