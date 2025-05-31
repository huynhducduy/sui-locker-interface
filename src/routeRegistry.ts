/* eslint-disable no-barrel-files/no-barrel-files -- this file need to be a barrel */
import {Route as HomeRoute} from '@/routes/index'

export type RegisteredRoutes = typeof HomeRoute

export {HomeRoute}
/* eslint-enable no-barrel-files/no-barrel-files -- this file need to be a barrel */
