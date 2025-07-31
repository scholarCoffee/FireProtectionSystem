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
        <!-- 已登录但未绑定手机号 -->
        <view v-else-if="userInfo.permissionStatus === 0" class="no-permission">
            <view class="permission-container">
                <image src="/static/icons/common/no-data.png" class="permission-img"></image>
                <text class="permission-title">当前用户未绑定手机号</text>
                <text class="permission-desc">请先在个人页绑定手机号</text>
            </view>
        </view>
        <!-- 已登录但无权限提示 -->
        <view v-else-if="userInfo.permissionStatus === 1" class="no-permission">
            <view class="permission-container">
                <image src="/static/icons/common/no-data.png" class="permission-img"></image>
                <text class="permission-title">当前用户无群聊权限</text>
                <text class="permission-desc">请联系维护人员开通权限</text>
            </view>
        </view>
        <!-- 已登录且有权限内容 -->
        <view v-else class="main main-content-adjust">
            <!-- 群聊列表 -->
            <view class="groups-container" v-if="groupsList.length > 0">
                <view class="group-item" 
                      v-for="(group, index) in groupsList" 
                      :key="group.groupId" 
                      @tap="goToChatRoom(group)">
                    <!-- 左侧头像与未读提示 -->
                    <view class="group-left">
                        <text class="unread-tip" v-if="group.tip > 0">{{ group.tip }}</text>
                        <image :src="group.groupAvatar" class="group-avatar"></image>
                        <!-- 群组标识 -->
                        <view class="group-tag"></view> 
                    </view>
                    
                    <!-- 右侧信息 -->
                    <view class="group-right">
                        <view class="group-top">
                            <text class="group-name">{{ group.groupName }}</text>
                            <text class="msg-time">{{ changeTime(group.lastTime) }}</text>
                        </view>
                        <text class="last-msg">{{ group.message }}</text>
                    </view>
                </view>
            </view>

            <!-- 无群聊时显示 -->
            <view class="no-group" v-if="groupsList.length === 0">
                <image src="/static/icons/common/no-data.png" class="no-group-img"></image>
                <text class="no-group-text">暂无群聊</text>
            </view>
        </view>
    </view>
</template>

<script>
    import { dateTime, clearUnreadCount, addUnreadCount, reduceUnreadCount } from '@/commons/js/utils.js';
    export default {
        data() {
            return {
                groupsList: [], // 群聊列表
                userInfo: {
                    nickName: '', 
                    avatarUrl: '',
                    permissionStatus: 0,
                    id: ''
                },
                isLoggedIn: false, // 用户是否登录
                whiteList: [], // 白名单
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
            // 断开socket连接
            this.socket.off('groupMsgFront', this.groupMsgListener)
            this.socket.off('leaveChatRoomFront', this.leaveChatRoomMsgListener)
        },
        methods: {
            // 接受群组
            groupMsgListener(data) {
                const { messageInfo, userId, groupId, userName } = data || {}
                let nmsg = ''
                if (messageInfo.types === 0) {
                    nmsg = messageInfo.message
                } else if (messageInfo.types === 1) {
                    nmsg = '[图片]'
                } else if (messageInfo.types === 2) {
                    nmsg = '[音频]'
                } else if (messageInfo.types === 3) {
                    nmsg = '[位置]'
                }
                for(let i = 0 ; i < this.groupsList.length ; i++) {
                    if (this.groupsList[i].groupId === groupId) {
                        let e = this.groupsList[i]
                        e.lastTime = new Date()
                        if (userId == this.userInfo.id) {
                            e.message = nmsg
                        } else {
                            e.message = userName + ': ' + nmsg
                        }
                        e.tip++
                        this.groupsList.splice(i, 1)
                        this.groupsList.unshift(e)
                        break
                    }
                }
                // 增加未读消息数
                addUnreadCount()
            },
            leaveChatRoomMsgListener(uid, groupId, type, tip) {
                // 离开聊天室更新聊天tip
                for(let i = 0 ; i < this.groupsList.length ; i++) {
                    if (this.groupsList[i].groupId === groupId) {
                        let e = this.groupsList[i]
                        e.tip = 0
                        this.groupsList.splice(i, 1, e)
                        // 减少未读消息数
                        reduceUnreadCount(tip)
                    }
                }
            },
            // 检查登录状态
            checkLoginStatus() {
                // #ifndef MP-WEIXIN
                // 非微信小程序：生成假数据
                if (!uni.getStorageSync('userInfo')) {
                    const mockUserInfo = {
                        id: '687a6f59e83419906c0699f4',
                        nickName: '测试用户-小创',
                        avatarUrl: '/static/icons/chat/person-avatar.png',
                        permissionStatus: 0 // 默认无权限
                    };
                    uni.setStorageSync('userInfo', mockUserInfo);
                }
                // #endif
                this.getStorages();
            },
            // 初始化socket连接
            initSocket() {
                this.socket.on('groupMsgFront', this.groupMsgListener)
                this.socket.on('leaveChatRoomFront', this.leaveChatRoomMsgListener)
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
                    // 页面显示时更新未读数
                    if (this.userInfo.permissionStatus === 2) {
                        this.loadGroups(); // 加载群聊列表
                    }
                } else {
                    this.isLoggedIn = false;    
                    // 清除未读数
                    // clearUnreadCount();
                }
            },
            // 加载群聊列表
            loadGroups() {
                uni.showLoading({
                    title: '加载群聊列表...',
                    mask: true,
                    duration: 1500
                });
                this.groupsList = [];
                clearUnreadCount()
                uni.request({
                    url: this.serverUrl + '/group/getGroupList',
                    method: 'POST',
                    data: { permissionStatus: this.userInfo.permissionStatus, userId: this.userInfo.id },
                    success: async (res) => {
                        const { code, data } = res.data || {};
                        if (code === 200 && Array.isArray(data) && data.length > 0) {
                            // 调用后台接口，获取群列表最后消息
                            try {                                
                                const groupList = await Promise.all(data.map(item => {    
                                    return this.getGroupLastMsg(item)
                                }))
                                this.groupsList = this.formatGroups(groupList);
                            } catch (error) {
                                this.groupsList = [];
                                uni.showToast({
                                    title: '获取群聊列表失败',
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                            
                        } else {
                            this.groupsList = [];
                            uni.showToast({
                                title: '获取群聊列表失败',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: (err) => {
                        this.groupsList = [];
                        uni.showToast({
                            title: '获取群聊列表失败:' + err,
                            icon: 'none',
                            duration: 2000
                        });
                    },
                    complete: () => {
                        uni.stopPullDownRefresh();
                        uni.hideLoading();
                    }
                });
            },

            // 获取群列表最后消息
            getGroupLastMsg(groupInfo) {
                return new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/group/getLastGroupMsg',
                        method: 'POST',
                        data: { groupInfo: groupInfo, userId: this.userInfo.id },
                        success: (res) => {
                            const { code, data } = res.data || {};
                            if (code === 200) {
                                resolve({
                                    ...data.groupMessageInfo
                                });
                            }
                        },
                        fail: (err) => {
                            reject(err);
                        }
                    });
                })
            },
            // 格式化群聊数据
            formatGroups(groups) {
                return groups.map(group => {
                    // 加入群组监听
                    this.socket.emit('groupServer', group.groupId)
                    addUnreadCount(group.tip || 0)
                    return {
                        groupId: group.groupId,
                        sendMsgName: group.sendMsgName || '群成员',
                        sendMsgAvatar: group.sendMsgAvatar,
                        groupName: group.groupName,
                        groupAvatar: group.groupAvatar ? (this.serverUrl + group.groupAvatar) : '/static/icons/chat/defautl-group.png',
                        lastTime: group?.lastTime ? new Date(group?.lastTime) : new Date(),
                        message: group?.message ? `${group.sendMsgName || '群成员'}: ${group?.message}` : '暂无消息',
                        tip: group?.tip || 0
                    }
                })
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
            goToChatRoom(group) {
                if (!group || !group.groupId) return;
                const { groupId, groupName, groupAvatar } = group;
                uni.navigateTo({
                    url: `/subPackages/chatInfo/chatRoom/index?id=${groupId}&nickName=${groupName}&avatarUrl=${groupAvatar}&chatType=1`
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
            z-index: 100;
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
        line-clamp: 1;
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