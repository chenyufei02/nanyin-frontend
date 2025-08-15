import Vue from 'vue'
import Vuex from 'vuex'
import { getMyProfile } from '@/api/user' // 引入获取用户资料的API

Vue.use(Vuex)

export default new Vuex.Store({
  // state 用于存放全局共享的数据
  state: {
    // 初始化时，用户信息为空
    userProfile: null
  },

  // mutations 用于定义修改 state 的方法
  mutations: {
    // 定义一个方法，用于将获取到的用户信息存入 state
    SET_USER_PROFILE(state, profile) {
      state.userProfile = profile
    },
    // 定义一个方法，用于在退出登录时清空用户信息
    CLEAR_USER_PROFILE(state) {
      state.userProfile = null
    }
  },

  // actions 用于处理异步操作，比如API请求
  actions: {
    // 定义一个异步方法，用于从后端获取当前登录用户的个人资料
    async fetchUserProfile({ commit }) {
      try {
        // 调用API
        const profileData = await getMyProfile()
        // 如果成功获取数据，就调用 mutation 将数据存入 state
        commit('SET_USER_PROFILE', profileData)
      } catch (error) {
        console.error('获取用户个人资料失败:', error)
      }
    }
  },

  // getters 用于方便地从 state 中派生出一些状态，类似计算属性
  getters: {
    // 定义一个 getter，方便地获取用户名，并提供一个默认值
    username: state => {
      return state.userProfile ? state.userProfile.name : '用户'
    }
  }
})