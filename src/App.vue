<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style>
/* 【核心修改】在这里添加全局CSS样式 */
body {
  margin: 0;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 优化Element UI组件的全局间距和对齐 */
.el-card__header {
  font-weight: bold;
}
</style>