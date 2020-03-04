import Vue from 'vue'
import Router from 'vue-router'
import store from '../store'

import LoadingScreen from '../components/LoadingScreen/LoadingScreen.vue'
import Setup from '../components/Setup/Setup.vue'
import SetHomeFolder from '../components/Setup/SetHomeFolder.vue'
import Login from '../components/Login.vue'
import Guest from '../components/Setup/Guest.vue'
import GuestVerify from '../components/Setup/GuestVerify.vue'
import Empty from '../components/Empty.vue'
import Home from '../components/Home/Home.vue'
import PlaylistsList from '../components/Home/PlaylistsList.vue'
import PlaylistView from '../components/Home/PlaylistView/PlaylistView.vue'

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
let transitioning = false
router.beforeEachQueue = [(to, from, next) => {
  if (transitioning) return
  transitioning = true
  let anim1
  let anim2 = 'fast '
  let pull = 'pull'
  let push = 'push'

  if (to.fullPath === '/home') {
    anim1 = pull
    anim2 += push
  } else {
    anim1 = push
    anim2 += pull
  }
  store.dispatch('routerAnimation', anim1)
  setTimeout(() => {
    next()
    store.dispatch('routerAnimation', anim2)
    setTimeout(() => {
      store.dispatch('routerAnimation', 'release')
      setTimeout(() => {
        transitioning = false
      }, 100)
    }, 100)
  }, 300)
}]
router.beforeEach((to, from, next) => router.beforeEachQueue.forEach((func, index, arr) => func(to, from, index === arr.length - 1 ? next : () => {})))

export default router
