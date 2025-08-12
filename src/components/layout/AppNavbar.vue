<template>
  <div class="navbar">
    <div class="brand">基金交易系统</div>
    <div class="user-menu">
      <span>欢迎您</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppNavbar' // 遵循多词命名规范
};
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e7e7e7;
  z-index: 1000;
}
.brand {
  font-weight: bold;
  font-size: 1.2rem;
}
</style>