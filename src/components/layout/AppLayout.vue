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
  margin-top: 60px;
  margin-left: 240px;
  padding: 20px;
}
</style>