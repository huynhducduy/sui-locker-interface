import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildCreateEntryTx({
  vaultId,
  name,
  hash,
  content,
  entry_type,
  description,
  tags,
  notes,
  image_url,
  link,
}: {
  vaultId: string,
  name: string,
  hash: string,
  content: string,
  entry_type?: string | undefined | null,
  description?: string | undefined | null,
  tags?: string[] | undefined | null,
  notes?: string | undefined | null,
  image_url?: string | undefined | null,
  link?: string | undefined | null,
}) {
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.CREATE_ENTRY, ({globalStateId, target}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.object(vaultId),
        tx.pure.string(name),
        tx.pure.string(hash),
        tx.pure.string(content),
        tx.pure.string(entry_type ?? ''),
        tx.pure.string(description ?? ''),
        tx.pure.vector("string", tags ?? []),
        tx.pure.string(notes ?? ''),
        tx.pure.string(image_url ?? ''),
        tx.pure.string(link ?? ''),
        tx.object(globalStateId),
        tx.object('0x6'),
      ],
    })

    return tx
  })
}
