import App from './App'
import Vue from 'vue'
import io from './commons/js/weapp.socket.io.js'
Vue.config.productionTip = false
// // 修改为 HTTPS 地址和 443 端口
// Vue.prototype.serverUrl = 'https://www.xiaobei.space' 
// // 修改后
// Vue.prototype.socket = io('wss://www.xiaobei.space', {
//     transports: ['websocket'], // 强制使用 WebSocket 协议
//     timeout: 10000 // 设置连接超时时间（毫秒）
// });
Vue.prototype.serverUrl = 'http://172.17.121.229:3000' 
Vue.prototype.socket = io('http://172.17.121.229:8002')
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
