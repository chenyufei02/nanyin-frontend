<template>
  <div class="app-layout">
    <app-navbar />  <app-sidebar /> <div class="main-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import AppNavbar from './AppNavbar.vue';
import AppSidebar from './AppSidebar.vue'; // 确保Sidebar组件已按规范重命名

export default {
  name: 'AppLayout',
  components: {
    AppNavbar,
    AppSidebar
  },
  created() {
    // 当这个布局组件被创建时（通常在登录成功后），
    // 立即向 Vuex store 发起一个 action，去获取用户个人资料
    this.$store.dispatch('fetchUserProfile');
  }
};
</script>

<style scoped>
.main-content {
  position: absolute;
  top: 60px;
  left: 240px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 20px;
  /* 将主内容区也设置为Flexbox布局 */
  display: flex;
  flex-direction: column; /* 让子元素垂直排列 */
}
</style>