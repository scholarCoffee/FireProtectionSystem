import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
import io from './componets/socket/weapp.socket.io.js'

Vue.config.productionTip = false
// 修改为 HTTPS 地址和 443 端口
Vue.prototype.serverUrl = 'https://www.xiaobei.space' 
// 修改为 HTTPS 地址和 443 端口
// 修改后
Vue.prototype.socket = io('wss://www.xiaobei.space', {
    transports: ['websocket'], // 强制使用 WebSocket 协议
    rejectUnauthorized: false, // 开发环境下忽略证书验证（生产环境建议移除）
    timeout: 10000 // 设置连接超时时间（毫秒）
});

App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif