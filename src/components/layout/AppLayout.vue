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