<template>
    <view class="content">
        <!-- 未登录提示 -->
        <view v-if="!isLoggedIn" class="not-logged-in">
            <text>当前用户未登录，请登录</text>
            <button @click="loginWithWechat">请登录</button>
        </view>
        <!-- 已登录内容 -->
        <view v-else class="main main-content-adjust">
            <!-- 下拉刷新提示 -->
            <view class="refresh" v-if="isRefresh">
                <image src="/static/user/refresh.png" class="refresh-icon"></image>
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
                <image src="/static/chat/no-group.png" class="no-group-img"></image>
                <text class="no-group-text">暂无群聊</text>
            </view>
        </view>
    </view>
</template>

<script>
    import { dateTime } from './../../commons/js/utils.js';
    export default {
        data() {
            return {
                groupsList: [], // 群聊列表
                uid: '', // 用户ID
                token: '', // 用户token
                isInit: false, // 是否初始化
                isRefresh: false, // 刷新状态
                socket: null, // 显式定义socket
                isLoggedIn: false // 用户是否登录
            }
        },
        onLoad() {
            this.checkLoginStatus(); // 检查登录状态
            this.initSocket(); // 初始化socket
        },
        onShow() {
            this.getStorages(); // 获取登录信息
            this.loadGroups(); // 加载群聊列表
        },
        onPullDownRefresh() {
            this.loadGroups(true); // 下拉刷新
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
                const userInfo = uni.getStorageSync('userInfo');
                this.isLoggedIn = !!userInfo;
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
                    const { userId, token } = userInfo;
                    this.uid = userId;
                    this.token = token;
                    this.isLoggedIn = true;
                    // 登录socket（增加socket检查）
                    if (this.isInit && this.socket) {
                        this.socket.send({
                            data: JSON.stringify({
                                type: 'login',
                                uid: this.uid
                            })
                        });
                    }
                } else {
                    this.isLoggedIn = false;
                }
            },

            // 加载群聊列表
            loadGroups(isRefresh = false) {
                if (!this.isLoggedIn) return;
                if (!this.uid) return;
                
                this.isRefresh = !isRefresh ? true : this.isRefresh;
                uni.request({
                    url: this.serverUrl + '/index/getGroup',
                    method: 'POST',
                    data: { uid: this.uid, state: 0, token: this.token },
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
                    imgUrl: this.serverUrl + (group.imgurl || '/default_group_avatar.png'),
                    lastTime: group.lastTime ? new Date(group.lastTime) : new Date(),
                    message: group.msg ? `${group.username || '群成员'}: ${group.msg}` : '暂无消息',
                    tip: group.tip || 0,
                    chatType: 1
                }));
            },

            // 处理新群消息
            handleGroupMsg(data) {
                if (!data || !data.groupID) return;
                
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
                    group.message = userID === this.uid ? content : `${name || '群成员'}: ${content}`;
                    group.tip = (group.tip || 0) + 1;
                    
                    // 使用不可变数据模式更新数组
                    this.groupsList = [group, ...this.groupsList.filter((_, i) => i !== index)];
                } else {
                    // 新群聊（理论上不会出现，因为初始化时已加载所有群）
                    console.warn('收到未知群组的消息:', groupID);
                }
            },

            // 处理离开群聊
            handleLeaveRoom(data) {
                if (!data || !data.groupId) return;
                
                const { uid, groupId } = data;
                if (uid !== this.uid) return; // 只处理当前用户
                
                // 清除未读提示
                const index = this.groupsList.findIndex(g => g.id === groupId);
                if (index > -1) {
                    this.groupsList[index].tip = 0;
                    // 触发更新
                    this.groupsList = [...this.groupsList];
                }
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
                if (!group || !group.id) return;
                
                const { id, name, imgUrl } = group;
                uni.navigateTo({
                    url: `/pages-chat/chatRoom/index?id=${id}&name=${name}&imgurl=${imgUrl}&chatType=1`
                });
            },
            // 使用微信一键登录
            loginWithWechat() {
                uni.login({
                    provider: 'weixin',
                    success: (loginRes) => {
                        if (loginRes.code) {
                            // 获取用户信息
                            uni.getUserInfo({
                                provider: 'weixin',
                                success: (userRes) => {
                                    // 这里可以将用户信息发送到服务器进行验证和登录
                                    const { userInfo } = userRes;
                                    const { nickName, avatarUrl } = userInfo;
                                    // 假设服务器返回用户ID和token
                                    const userId = '123';
                                    const token = 'abc';
                                    // 保存用户信息到本地存储
                                    uni.setStorageSync('userInfo', { userId, token });
                                    this.isLoggedIn = true;
                                    this.uid = userId;
                                    this.token = token;
                                    // 登录socket
                                    if (this.isInit && this.socket) {
                                        this.socket.send({
                                            data: JSON.stringify({
                                                type: 'login',
                                                uid: this.uid
                                            })
                                        });
                                    }
                                    // 加载群聊列表
                                    this.loadGroups();
                                },
                                fail: (err) => {
                                    console.error('获取用户信息失败:', err);
                                }
                            });
                        } else {
                            console.error('登录失败:', loginRes.errMsg);
                        }
                    },
                    fail: (err) => {
                        console.error('微信登录失败:', err);
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: #8a8a8a;
    }
</style>