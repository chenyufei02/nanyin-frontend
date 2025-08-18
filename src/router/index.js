import Vue from 'vue'
import VueRouter from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'

// 使用VueRouter插件
Vue.use(VueRouter)

// 定义路由配置数组
const routes = [
  {
    // 根路径配置
    path: '/',
    // 使用主布局组件作为容器
    component: AppLayout,
    // 默认重定向到用户仪表板
    redirect: '/dashboard',
    // 子路由配置 - 所有需要布局的页面都在这里
    children: [
      {
        // 用户仪表板路由
        path: 'dashboard',
        name: 'UserDashboard', // 路由名称，用于编程式导航
        component: () => import('../views/UserDashboard.vue'), // 懒加载组件
        meta: { requiresAuth: true } // 路由元信息，标记需要登录验证
      },
      {
        // 基金列表页路由
        path: 'funds',
        name: 'FundList',
        component: () => import('../views/FundList.vue'),
        meta: { requiresAuth: true }
      },
      {
        // 基金详情页路由，使用动态路由参数
        path: 'funds/:fundCode',
        name: 'FundDetail',
        component: () => import('../views/FundDetail.vue'),
        meta: { requiresAuth: true }
      },
      {
        // 基金赎回页面路由
        path: '/funds/:fundCode/redeem',
        name: 'FundRedeem',
        component: () => import('@/views/FundRedeem.vue'),
        meta: { requiresAuth: true }
      },
      {
        // 基金购买页面路由
        path: 'funds/:fundCode/purchase',
        name: 'FundPurchase',
        component: () => import('../views/FundPurchase.vue'),
        meta: { requiresAuth: true }
      },
      {
        // 我的持仓页面路由
        path: 'my-holdings',
        name: 'UserHolding',
        component: () => import('../views/UserHolding.vue'),
        meta: { requiresAuth: true }
      },
      {
        // 交易记录页面路由
        path: 'my-transactions',
        name: 'UserTransaction',
        component: () => import('../views/UserTransaction.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    // 登录页面路由 - 独立于主布局
    path: '/login',
    name: 'UserLogin',
    component: () => import('../views/UserLogin.vue')
    // 不需要登录验证
  },
  {
    // 注册页面路由 - 独立于主布局
    path: '/register',
    name: 'UserRegister',
    component: () => import('../views/UserRegister.vue')
    // 不需要登录验证
  }
]

// 创建路由实例
const router = new VueRouter({
  mode: 'history', // 使用HTML5 History模式，去除URL中的#号
  base: process.env.BASE_URL, // 应用的基路径
  routes // 路由配置
})

// 全局前置路由守卫 - 用于身份验证
router.beforeEach((to, from, next) => {
  // 检查目标路由是否需要身份验证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 从本地存储获取认证令牌
    const token = localStorage.getItem('authToken');
    if (token) {
      // 有令牌，允许访问
      next();
    } else {
      // 无令牌，重定向到登录页面
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始访问路径，登录后可重定向回来
      });
    }
  } else {
    // 不需要身份验证的路由，直接放行
    next();
  }
});

// 导出路由实例
export default router