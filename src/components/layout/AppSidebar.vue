<template>
  <div class="sidebar">
    <el-menu
      :default-active="$route.path"
      class="el-menu-vertical-demo"
      router
      background-color="#343a40"
      text-color="#bfcbd9"
      active-text-color="#ffd04b">
      <el-menu-item index="/dashboard">
        <i class="el-icon-s-home"></i>
        <span slot="title">我的主页</span>
      </el-menu-item>
      <el-menu-item index="/funds">
        <i class="el-icon-s-data"></i>
        <span slot="title">基金超市</span>
      </el-menu-item>
      <el-menu-item index="/my-holdings">
        <i class="el-icon-pie-chart"></i>
        <span slot="title">我的持仓</span>
      </el-menu-item>
      <el-menu-item index="/my-transactions">
        <i class="el-icon-s-order"></i>
        <span slot="title">交易记录</span>
      </el-menu-item>
       <el-menu-item index="/my-profile">
        <i class="el-icon-user"></i>
        <span slot="title">个人资料</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: 'AppSidebar'
};
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 240px;
  background-color: #343a40;
}
.el-menu {
  border-right: none;
}
</style>