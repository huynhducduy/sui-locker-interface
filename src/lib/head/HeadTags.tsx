import {useSeoMeta} from 'unhead'

import {TITLE} from '@/constants/config'

const HeadTags = function (
  props: Readonly<Omit<Parameters<typeof useSeoMeta>[0], 'titleTemplate'>>,
) {
  useSeoMeta({...props, titleTemplate: (title?: string) => `${title} | ${TITLE}`})

  return null
}

export default memo(HeadTags)
