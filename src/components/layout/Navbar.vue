<template>
  <div class="navbar-top">
    <a class="navbar-brand" href="#">基金交易系统</a>
    <div class="user-info">
      <span>欢迎您</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppNavbar' // 使用多词命名
};
</script>

<style scoped>
.navbar-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e7e7e7;
  z-index: 1000;
}
.navbar-brand {
  font-weight: bold;
  color: #333;
  text-decoration: none;
}
.user-info {
  margin-left: auto;
}
</style>