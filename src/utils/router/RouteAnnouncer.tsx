import {announce} from '@react-aria/live-announcer'

import {TITLE} from '@/constants/config'
import {LOADING} from '@/constants/magicStrings'

export default memo(function RouteAnnouncer() {
  const {subscribe} = useRouter()
  const matches = useMatches()

  const latestTitle = useRef('')

  useEffect(() => {
    const announceTitle = () => {
      setTimeout(() => {
        const currentTitle = document.title.replace(` - ${TITLE}`, '')

        if (currentTitle === LOADING || currentTitle === latestTitle.current) {
          announceTitle()
          return
        }

        latestTitle.current = currentTitle

        const messsage = `Navigated to ${currentTitle}`
        console.log(messsage)
        announce(messsage, 'polite')
      }, 100)
    }

    const unsubscribe = subscribe('onResolved', info => {
      if (info.pathChanged) {
        announceTitle()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [matches, subscribe])

  return null
})
