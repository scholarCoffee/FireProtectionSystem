import App from './App'
import Vue from 'vue'
import io from './commons/js/weapp.socket.io.js'
Vue.config.productionTip = false
Vue.prototype.serverUrl = 'https://www.xiaobei.space' 

// 明确指定socket.io路径，与Nginx配置匹配，并加强重连与鉴权
Vue.prototype.socket = io('wss://www.xiaobei.space', {
    path: '/socket.io/',
    transports: ['websocket'],
    forceNew: true,
    allowEIO3: true,
    // 连接与心跳参数，减小超时概率（需服务端支持 EIO 心跳）
    // 增加小程序特有的配置
    extraHeaders: {
        'Origin': 'https://www.xiaobei.space'  // 必须与域名一致
    },
    timeout: 20000,           // 连接超时
    pingInterval: 25000,      // 心跳间隔
    pingTimeout: 20000,       // 心跳超时
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000
});

// 连接状态监听
Vue.prototype.socket.on('connect', () => {
    console.log('WebSocket连接成功')
});

Vue.prototype.socket.on('connect_error', (err) => {
    console.error('websocket连接错误:', err && err.message)
});

Vue.prototype.socket.on('disconnect', (reason) => {
    console.log('websocket连接断开:', reason)
});

Vue.prototype.socket.on('reconnect_attempt', (attempt) => {
    console.log('websocket尝试重连:', attempt)
});

Vue.prototype.socket.on('reconnect', (attempt) => {
    console.log('websocket重连成功:', attempt)
});

Vue.prototype.socket.on('reconnect_error', (err) => {
    console.error('websocket重连错误:', err && err.message)
});

Vue.prototype.socket.on('reconnect_failed', () => {
    console.error('websocket重连失败，已达到最大次数')
});

// 前后台切换管理连接
if (typeof uni !== 'undefined' && uni.onAppHide && uni.onAppShow) {
    uni.onAppHide(() => {
        if (Vue.prototype.socket && Vue.prototype.socket.connected) {
            Vue.prototype.socket.close()
        }
    })
    uni.onAppShow(() => {
        if (Vue.prototype.socket && !Vue.prototype.socket.connected) {
            Vue.prototype.socket.connect()
        }
    })
}

App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()