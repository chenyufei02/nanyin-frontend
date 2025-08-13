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

       <el-menu-item index="/my-profile">
        <div class="menu-item-content">
          <i class="el-icon-user"></i>
          <span>个人资料</span>
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
  top: 60px; /* 从顶部导航栏下方开始 */
  left: 0;
  bottom: 0;
  width: 240px;
  background-color: #343a40;
  overflow-y: auto; /* 如果菜单项过多，允许滚动 */
}
.sidebar-menu {
  border-right: none; /* 移除Element UI默认的右边框 */
  height: 100%;
}

/* --- 【核心修改】 --- */

/* 1. 设置菜单项的Flex布局，实现内部元素水平居中 */
.menu-item-content {
  display: flex;
  align-items: center; /* 垂直居中（如果需要）*/
  width: 100%;
  padding-left: 20px; /* 统一的左内边距 */
}

/* 2. 调整图标和文字的样式 */
.menu-item-content i {
  margin-right: 10px; /* 图标和文字之间的间距 */
  font-size: 24px;    /* 稍微增大图标 */
}

.menu-item-content span {
  font-size: 20px;    /* 【核心修改】增大文字大小 */
}
</style>