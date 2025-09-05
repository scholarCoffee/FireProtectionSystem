import App from './App'
import Vue from 'vue'
import io from './commons/js/weapp.socket.io.js'
Vue.config.productionTip = false
Vue.prototype.serverUrl = 'https://www.xiaobei.space' 

// 明确指定socket.io路径，与Nginx配置匹配
Vue.prototype.socket = io('wss://www.xiaobei.space', {
    transports: ['websocket'],
    timeout: 10000,
    path: '/socket.io',  // 添加路径配置
    reconnection: true,  // 开启自动重连
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// 添加连接状态监听，便于调试
Vue.prototype.socket.on('connect', () => {
    console.log('WebSocket连接成功');
});

Vue.prototype.socket.on('connect_error', (err) => {
    console.error('连接错误:', err.message);
});

Vue.prototype.socket.on('disconnect', (reason) => {
    console.log('连接断开:', reason);
});

App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()