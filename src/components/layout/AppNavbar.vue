<template>
  <div class="navbar">
    <div class="left-menu">
      <el-button
        icon="el-icon-arrow-left"
        circle
        @click="goBack"
        class="back-button"
        title="后退"
      ></el-button>
      <div class="brand">泓镜基金交易系统</div>
    </div>
    <div class="user-menu">
      <span>欢迎您, {{ computedUsername }}</span>
      <el-button type="text" class="logout-button" @click="logout">退出登录</el-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'AppNavbar',
  computed: {
    // 使用 mapGetters 辅助函数，将 store 中的 'username' getter 映射到组件的计算属性中
    // 这样我们就可以在模板中直接使用 'computedUsername' 了
    ...mapGetters({
      computedUsername: 'username'
    })
  },
  methods: {
    // 后退功能
    goBack() {
      this.$router.go(-1);
    },
    // 退出登录功能
    logout() {
      // 1. 清除本地存储的token
      localStorage.removeItem('authToken');
      // 【【【 新增以下代码 】】】
      // 2. 清除 Vuex store 中的用户信息
      this.$store.commit('CLEAR_USER_PROFILE');
      // 3. 跳转到登录页
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  /* 【核心修改】背景色改为标志性的黄色 */
  background-color: #ffc100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e7e7e7;
  z-index: 1000;
}
.left-menu {
  display: flex;
  align-items: center;
}
.back-button {
  margin-right: 15px;
}
.brand {
  font-weight: bold;
  font-size: 1.5rem; /* 加大字体 */
  color: #303133; /* 深灰色字体，比纯黑更柔和 */
}
.user-menu {
  color: #303133;
}
.logout-button {
  color: #303133;
  margin-left: 15px;
}
.logout-button:hover {
  color: #d32f2f;
}
</style>