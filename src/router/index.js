import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'UserDashboard', // 确保name是唯一的
        component: () => import('../views/UserDashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'funds',
        name: 'FundList', // 确保name是唯一的
        component: () => import('../views/FundList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'funds/:fundCode',
        name: 'FundDetail', // 确保name是唯一的
        component: () => import('../views/FundDetail.vue'),
        meta: { requiresAuth: true }
      },
      // 【核心修正】确保“我的持仓”和“交易记录”的路由只定义一次
      {
        path: 'my-holdings',
        name: 'UserHolding', // 确保name是唯一的
        component: () => import('../views/UserHolding.vue'), // 假设您已创建此文件
        meta: { requiresAuth: true }
      },
      {
        path: 'my-transactions',
        name: 'UserTransaction', // 确保name是唯一的
        component: () => import('../views/UserTransaction.vue'), // 假设您已创建此文件
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'UserLogin', // 确保name是唯一的
    component: () => import('../views/UserLogin.vue')
  },
  {
    path: '/register',
    name: 'UserRegister', // 确保name是唯一的
    component: () => import('../views/UserRegister.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 全局前置守卫 (保持不变)
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = localStorage.getItem('authToken');
    if (token) {
      next();
    } else {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }
  } else {
    next();
  }
});

export default router