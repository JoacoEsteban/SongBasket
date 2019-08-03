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
      name: 'login',
      component: require('@/components/Login').default
    },
    {
      path: '/guest',
      name: 'guest',
      component: require('@/components/Guest').default
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
      children:[
        {
          path: '',
          name: 'playlists-list',
          component: require('@/components/Home/PlaylistsList').default
        },
        {
          path: 'playlist-view',
          name: 'playlist-view',
          component: require('@/components/Home/PlaylistView').default
        },
      ]
    },
  ]
})
