import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue' // 引入主布局

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard', // 登录后默认跳转到“我的主页/仪表盘”
    children: [
      {
        path: 'dashboard', // 注意，子路由的path前面不加'/'
        name: 'UserDashboard',
        component: () => import('../views/UserDashboard.vue'),
        meta: { requiresAuth: true } // 【新增】标记这个页面需要登录
      },
      {
        path: 'funds',
        name: 'FundList',
        component: () => import('../views/FundList.vue'),
        meta: { requiresAuth: true } // 【新增】标记这个页面需要登录
      },
      // ... 其他需要登录才能访问的页面，都在children里配置，并加上 meta: { requiresAuth: true }
    ]
  },
  {
    path: '/login',
    name: 'UserLogin',
    component: () => import('../views/UserLogin.vue')
  },
  {
    path: '/register',
    name: 'UserRegister',
    component: () => import('../views/UserRegister.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// --- 【核心修改】添加全局前置守卫 ---
router.beforeEach((to, from, next) => {
  // 检查目标路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查本地存储中是否有token
    const token = localStorage.getItem('authToken');
    if (token) {
      // 如果有token，用户已登录，正常放行
      next();
    } else {
      // 如果没有token，用户未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 可以选择性地记录用户原本想去的页面
      });
    }
  } else {
    // 如果目标路由不需要认证（比如登录页、注册页），直接放行
    next();
  }
});


export default router