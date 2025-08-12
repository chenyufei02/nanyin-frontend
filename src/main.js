import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import './plugins/element.js'
//导入全局样式表
import './assets/css/global.css'

import axios from 'axios'
//配置请求的根路径 要更改
axios.defaults.baseURL = 'http://localhost:8081/'
Vue.prototype.$http = axios
Vue.use(ElementUI);

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
