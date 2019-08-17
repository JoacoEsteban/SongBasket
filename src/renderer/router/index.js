import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '*',
      redirect: '/'
    },
    {
      path: '/',
      name: 'setup',
      component: require('@/components/Setup/Setup').default,
      children: [{
        path: '',
        name: 'set-home-folder',
        component: require('@/components/Setup/SetHomeFolder').default
      },
      {
        path: 'login',
        name: 'login',
        component: require('@/components/Login').default
      },
      {
        path: 'guest',
        name: 'guest',
        component: require('@/components/Setup/Guest').default
      },
      {
        path: 'guest-verify',
        name: 'guest-verify',
        component: require('@/components/Setup/GuestVerify').default
      }
      ]
    },
    {
      path: '/empty',
      name: 'empty',
      component: require('@/components/Empty').default
    },
    {
      path: '/home',
      name: 'home',
      component: require('@/components/Home/Home').default,
      children: [
        {
          path: '',
          name: 'playlists-list',
          component: require('@/components/Home/PlaylistsList').default
        },
        {
          path: 'playlist-view',
          name: 'playlist-view',
          component: require('@/components/Home/PlaylistView/PlaylistView').default
        }
      ]
    }
  ]
})
