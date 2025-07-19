<template>
    <view class="content">
        <!-- 未登录提示 -->
        <view v-if="!isLoggedIn" class="not-logged-in">
            <view class="login-container">
                <image src="/static/icons/person/person.png" class="login-avatar"></image>
                <text class="login-title">欢迎使用消防作战终端</text>
                <text class="login-desc">登录后即可查看群聊消息</text>
                <button class="login-btn" open-type="getUserInfo" @getuserinfo="onGetUserInfo">一键登录</button>
            </view>
        </view>
        <!-- 已登录但无权限提示 -->
        <view v-else-if="!hasChatPermission" class="no-permission">
            <view class="permission-container">
                <image src="/static/icons/common/no-data.png" class="permission-img"></image>
                <text class="permission-title">当前用户无群聊权限</text>
                <text class="permission-desc">请联系维护人员开通权限</text>
            </view>
        </view>
        <!-- 已登录且有权限内容 -->
        <view v-else class="main main-content-adjust">
            <!-- 下拉刷新提示 -->
            <view class="refresh" v-if="isRefresh">
                <image src="/static/icons/common/refresh.png" class="refresh-icon"></image>
                <text class="ref-title">下拉刷新</text>
            </view>

            <!-- 群聊列表 -->
            <view class="groups-container" v-if="groupsList.length > 0">
                <view class="group-item" 
                      v-for="(group, index) in groupsList" 
                      :key="group.id" 
                      @tap="toChatRoom(group)">
                    <!-- 左侧头像与未读提示 -->
                    <view class="group-left">
                        <text class="unread-tip" v-if="group.tip > 0">{{ group.tip }}</text>
                        <image :src="group.imgUrl" class="group-avatar"></image>
                        <view class="group-tag"></view> <!-- 群组标识 -->
                    </view>
                    
                    <!-- 右侧信息 -->
                    <view class="group-right">
                        <view class="group-top">
                            <text class="group-name">{{ group.name }}</text>
                            <text class="msg-time">{{ changeTime(group.lastTime) }}</text>
                        </view>
                        <text class="last-msg">{{ group.message }}</text>
                    </view>
                </view>
            </view>

            <!-- 无群聊时显示 -->
            <view class="no-group" v-if="groupsList.length === 0 && !isRefresh">
                <image src="/static/icons/common/no-data.png" class="no-group-img"></image>
                <text class="no-group-text">暂无群聊</text>
            </view>
        </view>
    </view>
</template>

<script>
    import { dateTime, setUnreadCount, reduceUnreadCount, clearUnreadCount } from '@/commons/js/utils.js';
    export default {
        data() {
            return {
                groupsList: [], // 群聊列表
                userInfo: {
                    nickName: '', 
                    avatarUrl: '',
                    permissionStatus: 1,
                    id: ''
                },
                permissionStatus: 0, // 权限状态
                isInit: false, // 是否初始化
                isRefresh: false, // 刷新状态
                socket: null, // 显式定义socket
                isLoggedIn: false, // 用户是否登录
            }
        },
        computed: {
            hasChatPermission() {
                return this.userInfo.permissionStatus === 1;
            }
        },
        onLoad() {
            this.initSocket(); // 初始化socket
        },
        onShow() {
            this.checkLoginStatus(); // 检查登录状态
        },
        onPullDownRefresh() {
            this.loadGroups(); // 下拉刷新
        },
        onUnload() {
            // 移除socket监听（增加空值检查）
            if (this.socket) {
                this.socket.off('groupMsgFront', this.handleGroupMsg);
                this.socket.off('leaveChatRoomFront', this.handleLeaveRoom);
            }
        },
        methods: {
            // 检查登录状态
            checkLoginStatus() {
                // #ifndef MP-WEIXIN
                // 非微信小程序：生成假数据
                const mockUserInfo = {
                    userId: '687a6f59e83419906c0699e0',
                    nickName: 'admin',
                    avatarUrl: '/static/icons/chat/person-avatar.png',
                    permissionStatus: 1 // 默认有权限
                };
                uni.setStorageSync('userInfo', mockUserInfo);

                // #endif
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { id, nickName, avatarUrl, permissionStatus } = userInfo;
                    this.userInfo = {
                        id,
                        nickName,
                        avatarUrl,
                        permissionStatus
                    }
                    this.isLoggedIn = true;
                    // 页面显示时更新未读数
                    if (this.hasChatPermission) {
                        this.loadGroups(); // 加载群聊列表
                    }
                } else {
                    this.isLoggedIn = false;    
                    // 清除未读数
                    clearUnreadCount();
                }
            },
            // 初始化socket连接
            initSocket() {
                // 创建socket实例（假设使用uni-app的WebSocket）
                this.socket = uni.connectSocket({
                    url: this.serverUrl + '/socket', // 替换为实际socket地址
                    success: () => {
                        console.log('Socket连接成功');
                    },
                    fail: (err) => {
                        console.error('Socket连接失败:', err);
                    }
                });
                
                // 监听socket连接成功
                this.socket.onOpen(() => {
                    console.log('Socket已连接');
                    this.isInit = true;
                    this.getStorages(); // 连接成功后获取用户信息并登录
                });
                
                // 监听群消息
                this.socket.onMessage((res) => {
                    try {
                        const data = JSON.parse(res.data);
                        if (data.type === 'groupMsg') {
                            this.handleGroupMsg(data);
                        } else if (data.type === 'leaveChatRoom') {
                            this.handleLeaveRoom(data);
                        }
                    } catch (err) {
                        console.error('解析Socket消息失败:', err);
                    }
                });
                
                // 监听错误和关闭
                this.socket.onError((err) => {
                    console.error('Socket错误:', err);
                });
                
                this.socket.onClose(() => {
                    console.log('Socket已关闭');
                });
            },

            // 获取本地存储的用户信息
            getStorages() {
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { id, nickName, avatarUrl, permissionStatus } = userInfo;
                    this.userInfo = {
                        id,
                        nickName,
                        avatarUrl,
                        permissionStatus
                    }
                    this.isLoggedIn = true;
                    // 登录socket（增加socket检查）
                    if (this.isInit && this.socket) {
                        this.socket.send({
                            data: JSON.stringify({
                                type: 'login',
                                uid: this.userInfo.id
                            })
                        });
                    }
                } else {
                    this.isLoggedIn = false;
                }
            },

            // 加载群聊列表
            loadGroups() {
                this.isRefresh = true;
                this.groupsList = [];
                uni.request({
                    url: this.serverUrl + '/index/getGroup',
                    method: 'POST',
                    data: { permissionStatus: this.userInfo.permissionStatus, status: 1 },
                    success: (res) => {
                        const { code, data } = res.data || {};
                        if (code === 200 && Array.isArray(data)) {
                            this.groupsList = this.formatGroups(data);
                            // 按最后消息时间排序（最新的在前面）
                            this.groupsList.sort((a, b) => {
                                const timeA = new Date(a.lastTime || 0);
                                const timeB = new Date(b.lastTime || 0);
                                return timeB - timeA;
                            });
                            // 更新tabBar未读数
                            this.updateTabBarBadge();
                        } else {
                            console.error('获取群聊列表失败:', res.data);
                        }
                    },
                    fail: (err) => {
                        console.error('加载群聊失败：', err);
                    },
                    complete: () => {
                        this.isRefresh = false;
                        uni.stopPullDownRefresh();
                    }
                });
            },

            // 格式化群聊数据
            formatGroups(groups) {
                return groups.map(group => ({
                    id: group.id,
                    name: group.markname || group.name || '未命名群组',
                    imgUrl: '/static/icons/chat/defautl-group.png',
                    lastTime: group.lastTime ? new Date(group.lastTime) : new Date(),
                    message: group.msg ? `${group.username || '群成员'}: ${group.msg}` : '暂无消息',
                    tip: group.tip || 0,
                    chatType: 1
                }));
            },

            // 处理新群消息
            handleGroupMsg(data) {
                if (!data || !data.groupID || !this.hasChatPermission) return;
                
                const { msg, userID, groupID, name } = data;
                let content = '';
                
                // 格式化消息内容
                if (msg && typeof msg.types === 'number') {
                    switch (msg.types) {
                        case 0: content = msg.message || ''; break;
                        case 1: content = '[图片]'; break;
                        case 2: content = '[音频]'; break;
                        case 3: content = '[位置]'; break;
                        default: content = '[未知消息]';
                    }
                }

                // 更新群聊列表
                const index = this.groupsList.findIndex(g => g.id === groupID);
                if (index > -1) {
                    // 已存在的群聊：更新信息并置顶
                    const group = { ...this.groupsList[index] };
                    group.lastTime = new Date();
                    group.message = userID === this.userInfo.id ? content : `${name || '群成员'}: ${content}`;
                    group.tip = (group.tip || 0) + 1;
                    
                    // 使用不可变数据模式更新数组
                    this.groupsList = [group, ...this.groupsList.filter((_, i) => i !== index)];
                    
                    // 更新tabBar未读数
                    this.updateTabBarBadge();
                } else {
                    // 新群聊（理论上不会出现，因为初始化时已加载所有群）
                    console.warn('收到未知群组的消息:', groupID);
                }
            },

            // 处理离开群聊
            handleLeaveRoom(data) {
                if (!data || !data.groupId || !this.hasChatPermission) return;
                
                const { uid, groupId } = data;
                if (uid !== this.userInfo.id) return; // 只处理当前用户
                
                // 清除未读提示
                const index = this.groupsList.findIndex(g => g.id === groupId);
                if (index > -1) {
                    this.groupsList[index].tip = 0;
                    // 触发更新
                    this.groupsList = [...this.groupsList];
                    // 更新tabBar未读数
                    this.updateTabBarBadge();
                }
            },

            // 更新tabBar未读数
            updateTabBarBadge() {
                const totalUnread = this.groupsList.reduce((sum, group) => sum + (group.tip || 0), 0);
                setUnreadCount(totalUnread);
            },

            // 时间格式化（增加错误处理）
            changeTime(time) {
                try {
                    return time ? dateTime(time) : '';
                } catch (err) {
                    console.error('时间格式化错误:', err);
                    return '';
                }
            },

            // 进入群聊房间
            toChatRoom(group) {
                if (!group || !group.id || !this.hasChatPermission) return;
                
                const { id, name, imgUrl } = group;
                
                // 清除该群的未读消息数
                const index = this.groupsList.findIndex(g => g.id === id);
                if (index > -1 && this.groupsList[index].tip > 0) {
                    const oldTip = this.groupsList[index].tip;
                    this.groupsList[index].tip = 0;
                    this.groupsList = [...this.groupsList];
                    // 减少对应的未读数
                    reduceUnreadCount(oldTip);
                }
                
                uni.navigateTo({
                    url: `/subPackages/chatInfo/chatRoom/index?id=${id}&name=${name}&imgurl=${imgUrl}&chatType=1`
                });
            },
            // 微信一键登录新版，强制获取头像昵称
            async onGetUserInfo(e) {
                if (!e.detail || !e.detail.userInfo) {
                    uni.showToast({
                        title: '需要授权获取头像昵称',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                uni.showLoading({ title: '登录中...' });
                
                uni.login({
                    provider: 'weixin',
                    success: (loginRes) => {
                        const code = loginRes.code;
                        const { nickName, avatarUrl } = e.detail.userInfo;
                        
                        // 调用后端接口存储用户信息
                        uni.request({
                            url: this.serverUrl + '/user/update', // 替换为你的后端登录接口
                            method: 'POST',
                            data: {
                                nickName: nickName,
                                avatarUrl: avatarUrl,
                                code: code,
                                encryptedData: e.detail.encryptedData,
                                permissionStatus: 1, 
                                id: e.detail.iv,
                                signature: e.detail.signature
                            },  
                            success: (res) => {
                                if (res.data && res.data.code === 200) {
                                    const userInfo = res.data.data;
                                    uni.setStorageSync('userInfo', userInfo);
                                    this.isLoggedIn = true;
                                    
                                    // 登录socket
                                    if (this.isInit && this.socket) {
                                        this.socket.send({
                                            data: JSON.stringify({
                                                type: 'login',
                                                uid: this.userInfo.id
                                            })
                                        });
                                    }
                                    
                                    // 加载群聊列表
                                    this.loadGroups();
                                    
                                    uni.hideLoading();
                                    uni.showToast({
                                        title: '登录成功',
                                        icon: 'success',
                                        duration: 1500
                                    });
                                } else {
                                    uni.hideLoading();
                                    uni.showToast({
                                        title: res.data.msg || '登录失败',
                                        icon: 'none',
                                        duration: 2000
                                    });
                                }
                            },
                            fail: () => {
                                uni.hideLoading();
                                uni.showToast({
                                    title: '网络错误',
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                        });
                    },
                    fail: () => {
                        uni.hideLoading();
                        uni.showToast({
                            title: '微信登录失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                });
            }
        }
    }
</script>

<style lang="scss">
    .content {
        height: 100vh;
        background-color: #f7f8fc;
        padding-bottom: env(safe-area-inset-bottom);
    }
    /* 内容区下移，避免被导航栏遮挡 */
    .page-content {
        padding-top: 0;
    }
    .main, .not-logged-in, .groups-container, .no-group {
        margin-top: 0;
    }

    .main {
        padding: 16rpx;
    }

    /* 下拉刷新 */
    .refresh {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rpx 0;
        color: #8a8a8a;
        
        .refresh-icon {
            width: 36rpx;
            height: 36rpx;
            animation: spin 1.2s linear infinite;
        }

        .ref-title {
            margin-top: 10rpx;
            font-size: 26rpx;
        }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* 群聊列表容器 */
    .groups-container {
        margin-top: 10rpx;
    }

    /* 群聊项 */
    .group-item {
        display: flex;
        align-items: center;
        padding: 20rpx 16rpx;
        margin-bottom: 10rpx;
        background: #fff;
        border-radius: 16rpx;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
        transition: background-color 0.2s;
        
        &:active {
            background-color: #f5f5f5;
        }
    }

    /* 左侧头像区域 */
    .group-left {
        position: relative;
        margin-right: 20rpx;
        
        .group-avatar {
            width: 88rpx;
            height: 88rpx;
            border-radius: 16rpx; /* 圆角头像 */
            object-fit: cover;
        }

        .unread-tip {
            position: absolute;
            top: -6rpx;
            right: -6rpx;
            min-width: 36rpx;
            height: 36rpx;
            line-height: 36rpx;
            font-size: 22rpx;
            text-align: center;
            color: #fff;
            background-color: #ff5252;
            border-radius: 50%;
            box-shadow: 0 2rpx 4rpx rgba(255, 82, 82, 0.3);
        }

        .group-tag {
            position: absolute;
            bottom: 6rpx;
            right: 6rpx;
            width: 24rpx;
            height: 24rpx;
            background-color: #5d7df9;
            border-radius: 50%;
            border: 3rpx solid #fff;
        }
    }

    /* 右侧信息区域 */
    .group-right {
        flex: 1;
        overflow: hidden;
        padding: 6rpx 0;
    }

    .group-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;
    }

    .group-name {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        max-width: 70%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .msg-time {
        font-size: 24rpx;
        color: #999;
    }

    .last-msg {
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* 无群聊状态 */
    .no-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 400rpx;
        color: #8a8a8a;
        
        .no-group-img {
            width: 160rpx;
            height: 160rpx;
            margin-bottom: 20rpx;
            opacity: 0.7;
        }

        .no-group-text {
            font-size: 28rpx;
        }
    }

    /* 未登录提示 */
    .not-logged-in {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, hsla(0, 0%, 100%, .95) 0%, #e5e5e5 100%);
    }
    
    .login-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60rpx 40rpx;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24rpx;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10rpx);
        max-width: 600rpx;
        width: 90%;
    }
    
    .login-avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        margin-bottom: 30rpx;
        border: 4rpx solid #fff;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    }
    
    .login-title {
        font-size: 36rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 16rpx;
        text-align: center;
    }
    
    .login-desc {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 40rpx;
        text-align: center;
        line-height: 1.5;
    }
    
    .login-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 88rpx;
        background: #07c160;
        color: #fff;
        border: none;
        border-radius: 44rpx;
        font-size: 32rpx;
        font-weight: 500;
        box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.3);
        transition: all 0.3s ease;
        
        &:active {
            transform: translateY(2rpx);
            box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.3);
        }
    }

    /* 无权限提示 */
    .no-permission {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, hsla(0, 0%, 100%, .95) 0%, #e5e5e5 100%);
    }
    
    .permission-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60rpx 40rpx;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24rpx;
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10rpx);
        max-width: 600rpx;
        width: 90%;
    }
    
    .permission-img {
        width: 160rpx;
        height: 160rpx;
        margin-bottom: 30rpx;
        opacity: 0.7;
    }
    
    .permission-title {
        font-size: 36rpx;
        font-weight: 600;
        color: #ff5252;
        margin-bottom: 16rpx;
        text-align: center;
    }
    
    .permission-desc {
        font-size: 28rpx;
        color: #666;
        text-align: center;
        line-height: 1.5;
    }
</style>