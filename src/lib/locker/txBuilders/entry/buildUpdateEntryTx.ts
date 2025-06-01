import { Transaction } from "@mysten/sui/transactions";

import { SUI_LOCKER_FUNCTIONS } from "@/constants/sui";
import buildBaseTx from "@/lib/locker/txBuilders/buildBaseTx";

export default function buildUpdateEntryTx({
  entryId,
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
  entryId: string
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
  return buildBaseTx(SUI_LOCKER_FUNCTIONS.UPDATE_ENTRY, ({target, globalStateId}) => {
    const tx = new Transaction()

    tx.moveCall({
      target,
      arguments: [
        tx.object(entryId),
        tx.pure.option('string', name),
        tx.pure.option('string', hash),
        tx.pure.option('string', content),
        tx.pure.option('option<string>', entry_type),
        tx.pure.option('option<string>', description),
        tx.pure.option('vector<string>', tags),
        tx.pure.option('option<string>', notes),
        tx.pure.option('option<string>', image_url),
        tx.pure.option('option<string>', link),
        tx.object(globalStateId),
        tx.object('0x6'),
      ],
    })

    return tx
  })
}
