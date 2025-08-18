<template>
  <!-- 应用的根容器 -->
  <div id="app">
    <!-- 路由视图组件，用于显示当前路由对应的页面组件 -->
    <router-view/>
  </div>
</template>

<style>
/* 全局CSS样式设置 */
body {
  margin: 0;  /* 清除默认边距 */
  /* 设置字体族，优先使用系统字体，提供良好的中英文显示效果 */
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  /* 开启字体平滑渲染，提升文字显示质量 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 优化Element UI组件的全局样式 */
.el-card__header {
  font-weight: bold;  /* 卡片头部文字加粗 */
}
</style>