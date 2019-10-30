import Vue from 'vue'
import Router from 'vue-router'
import store from '../store'

import LoadingScreen from '../components/LoadingScreen/LoadingScreen'
import Setup from '../components/Setup/Setup'
import SetHomeFolder from '../components/Setup/SetHomeFolder'
import Login from '../components/Login'
import Guest from '../components/Setup/Guest'
import GuestVerify from '../components/Setup/GuestVerify'
import Empty from '../components/Empty'
import Home from '../components/Home/Home'
import PlaylistsList from '../components/Home/PlaylistsList'
import PlaylistView from '../components/Home/PlaylistView/PlaylistView'

Vue.use(Router)

let router = new Router({
  routes: [
    {
      path: '*',
      redirect: '/'
    },
    {
      path: '/',
      component: LoadingScreen
      // children: [{
      //   path: '',
      //   name: 'set-home-folder',
    },
    {
      path: '/setup',
      component: Setup,
      children: [{
        path: '',
        name: 'set-home-folder',
        component: SetHomeFolder
      },
      {
        path: 'login',
        name: 'login',
        component: Login
      },
      {
        path: 'guest',
        name: 'guest',
        component: Guest
      },
      {
        path: 'guest-verify',
        name: 'guest-verify',
        component: GuestVerify
      }
      ]
    },
    {
      path: '/empty',
      name: 'empty',
      component: Empty
    },
    {
      path: '/home',
      component: Home,
      children: [
        {
          path: '',
          name: 'playlists-list',
          component: PlaylistsList
        },
        {
          path: 'playlist-view',
          name: 'playlist-view',
          component: PlaylistView
        }
      ]
    }
  ]
})
router.beforeEach((to, from, next) => {
  console.log('to, ', to, 'from.', from, 'next', next)
  store.dispatch('routerAnimation', 'out')
  setTimeout(() => {
    next()
    setTimeout(() => {
      store.dispatch('routerAnimation', 'in')
    }, 100)
  }, 300)
})

export default router
