import App from './App'
import Vue from 'vue'
import io from './componets/socket/weapp.socket.io.js'
import authMixin from './commons/mixins/authMixin.js'

Vue.mixin(authMixin)
Vue.config.productionTip = false
// // 修改为 HTTPS 地址和 443 端口
// Vue.prototype.serverUrl = 'https://www.xiaobei.space' 
// // 修改后
// Vue.prototype.socket = io('wss://www.xiaobei.space', {
//     transports: ['websocket'], // 强制使用 WebSocket 协议
//     rejectUnauthorized: false, // 开发环境下忽略证书验证（生产环境建议移除）
//     timeout: 10000 // 设置连接超时时间（毫秒）
// });
Vue.prototype.serverUrl = 'http://192.168.3.87:3000' 
Vue.prototype.socket = io('http://192.168.3.87:8002')
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
