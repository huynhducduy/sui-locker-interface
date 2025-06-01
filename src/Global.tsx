import "@suiet/wallet-kit/style.css"

import {announce} from '@react-aria/live-announcer'
import {addIntegration, tanstackRouterBrowserTracingIntegration} from '@sentry/react'

import { Toaster } from "@/components/ui/sonner"
import {loadSentryIntegrations} from '@/instrument'
import Head from '@/lib/head/Head'
import ThemeEffects from '@/lib/theme/ThemeEffects'
import {setupDapp, teardownDapp} from '@/setupDapp'
import RouteAnnouncer from '@/utils/router/RouteAnnouncer'

import {DEBUG} from './constants/config'
import SetupLockerKeyEffects from "./lib/locker/SetupLockerKeyEffect"

export default memo(function Global() {
  const router = useRouter()

  useEffect(function initLiveAnnouncer() {
    // fixes for https://github.com/adobe/react-spectrum/issues/5191
    announce(' ', 'polite', 0)
  }, [])

  useEffect(function setup() {
    setupDapp()

    return () => {
      teardownDapp()
    }
  }, [])

  useEffect(
    function addSentryIntegration() {
      if (DEBUG) return
      addIntegration(tanstackRouterBrowserTracingIntegration(router))
      loadSentryIntegrations()
    },
    [router],
  )
  return (
    <>
      <RouteAnnouncer />
      <Head />
      <Toaster />
      <ThemeEffects />
      <SetupLockerKeyEffects/>
    </>
  )
})
