<template>
  <div class="sidebar">
    <el-menu
      :default-active="$route.path"
      class="sidebar-menu"
      router
      background-color="#343a40"
      text-color="#bfcbd9"
      active-text-color="#ffc100">

      <el-menu-item index="/dashboard">
        <div class="menu-item-content">
          <i class="el-icon-s-home"></i>
          <span>我的主页</span>
        </div>
      </el-menu-item>

      <el-menu-item index="/funds">
        <div class="menu-item-content">
          <i class="el-icon-s-data"></i>
          <span>基金超市</span>
        </div>
      </el-menu-item>

      <el-menu-item index="/my-holdings">
        <div class="menu-item-content">
          <i class="el-icon-pie-chart"></i>
          <span>我的持仓</span>
        </div>
      </el-menu-item>

      <el-menu-item index="/my-transactions">
        <div class="menu-item-content">
          <i class="el-icon-s-order"></i>
          <span>交易记录</span>
        </div>
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
  overflow-y: auto;
}

.sidebar-menu {
  border-right: none;
  height: 100%;
  padding-top: 10px;
}

/* --- 【核心修改】 --- */

/* 覆盖Element UI默认样式，为每个菜单项增加上下内边距 */
.sidebar-menu >>> .el-menu-item {
  padding-top: 15px !important;
  padding-bottom: 15px !important;
  height: auto;
  line-height: normal;
}


.menu-item-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding-left: 20px;
}

.menu-item-content i {
  margin-right: 10px;
  font-size: 20px;
}

.menu-item-content span {
  font-size: 20px;
}
</style>