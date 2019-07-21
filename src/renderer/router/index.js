import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
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
      path: '*',
      redirect: '/'
    },
    {
      path: '/home',
      name: 'home',
      component: require('@/components/Home/Home').default
    },
    {
      path: '/playlist',
      name: 'playlist-view',
      component: require('@/components/Home/PlaylistView').default
    },
  ]
})
