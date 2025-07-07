<template>
	<view class="content">
		<view class="top-bar">
			<navigator :url="'/pages-personal/userDetail/index?id=' + uid" hover-class="none" class="top-bar-left">
				<image :src="imgUrl" class="my-img"></image>
			</navigator>
			<view class="top-bar-right">
				<view class="search" @tap="toSearch"><image src="/static/user/search.png"></image></view>
				<view class="add" @tap="toBuildGroup"><image src="/static/add.png"></image></view>
			</view>
		</view>
		<view class="main main-content-adjust">
            <view class="refresh" v-if="isRefresh">
                <image src="/static/user/refresh.png" class="refresh-icon"></image>
                <text class="ref-title">下拉刷新</text>
            </view>
            <view class="noone" v-if="isNoFriendList">
                <image src="/static/home/emptyNo.png" mode="aspectFill"></image>
                <view class="no-friends">你还没有好友~</view>
                <view class="search-bt" @tap="toSearch">搜索好友</view>
            </view>
            <!-- 好友申请数量 -->
            <view class="friends" v-if="requestData > 0" @tap="toFriendRequest">
				<view class="friends-list friends-request">
                    <view class="friends-list-l">
                        <text class="tip">{{ requestData }}</text>
                        <image src="../../static/user/applyFriend.png" class="avatar"></image>
                    </view>
                    <view class="friends-list-r">
                        <view class="top">
                            <view class="name">好友申请</view>
                            <view class="time">{{ changeTime(requestTime) }}</view>
                        </view>
                        <view class="news">茫茫人海，相聚便是缘分</view>
                    </view>
                </view>
			</view>
            
            <!-- 消息分组 - 今天 -->
            <view class="message-group" v-if="todayMessages.length > 0">
                <view class="group-title">今天</view>
                <view class="friends">
                    <view class="friends-list" v-for="(friend, index) in todayMessages" :key="friend.id" @tap="toChatRoom(friend)">
                        <view class="friends-list-l">
                            <text class="tip" v-if="friend.tip > 0">{{ friend.tip }}</text>
                            <image :src="friend.imgUrl" class="avatar"></image>
                            <view class="groupm" v-if="friend.chatType == 1"></view>
                        </view>
                        <view class="friends-list-r">
                            <view class="top">
                                <view class="name">{{ friend.name }}</view>
                                <view class="time">{{ changeTime(friend.lastTime) }}</view>
                            </view>
                            <view class="news">{{ friend.message }}</view>
                        </view>
                    </view>
                </view>
            </view>
            
            <!-- 消息分组 - 最近七天 -->
            <view class="message-group" v-if="weekMessages.length > 0">
                <view class="group-title">最近七天</view>
                <view class="friends">
                    <view class="friends-list" v-for="(friend, index) in weekMessages" :key="friend.id" @tap="toChatRoom(friend)">
                        <view class="friends-list-l">
                            <text class="tip" v-if="friend.tip > 0">{{ friend.tip }}</text>
                            <image :src="friend.imgUrl" class="avatar"></image>
                            <view class="groupm" v-if="friend.chatType == 1"></view>
                        </view>
                        <view class="friends-list-r">
                            <view class="top">
                                <view class="name">{{ friend.name }}</view>
                                <view class="time">{{ changeTime(friend.lastTime) }}</view>
                            </view>
                            <view class="news">{{ friend.message }}</view>
                        </view>
                    </view>
                </view>
            </view>
            
            <!-- 更早的消息 -->
            <view class="message-group" v-if="earlierMessages.length > 0">
                <view class="group-title">更早</view>
                <view class="friends">
                    <view class="friends-list" v-for="(friend, index) in earlierMessages" :key="friend.id" @tap="toChatRoom(friend)">
                        <view class="friends-list-l">
                            <text class="tip" v-if="friend.tip > 0">{{ friend.tip }}</text>
                            <image :src="friend.imgUrl" class="avatar"></image>
                            <view class="groupm" v-if="friend.chatType == 1"></view>
                        </view>
                        <view class="friends-list-r">
                            <view class="top">
                                <view class="name">{{ friend.name }}</view>
                                <view class="time">{{ changeTime(friend.lastTime) }}</view>
                            </view>
                            <view class="news">{{ friend.message }}</view>
                        </view>
                    </view>
                </view>
            </view>
		</view>
	</view>
</template>

<script>
    import { dateTime, sortByTip } from './../../commons/js/utils.js'; // 导入 dateTime 函数
	export default {
		data() {
			return {
                friendsList: [], // 好友列表
                groupsList:[], // 群组列表
                uid: '', // 用户ID
                userName: '', // 用户名
                imgUrl: '', // 头像URL
                token: '', // 用户token
                requestData: 0, // 好友申请数
                requestTime: '', // 最后申请时间
                isInit: false, // 是否初始化
                isRefresh: false,
                isNoFriendList: false,
                todayMessages: [], // 今天的消息
                weekMessages: [], // 最近七天的消息
                earlierMessages: [] // 更早的消息
			}
		},
        onLoad() {
            this.isInit = true
            this.initSocketInfo()
        },
        onShow() {
            // 获取登录信息
            this.getStorages()
            // 页面加载时获取好友请求
            this.getHomeInfo()
        },
        onPullDownRefresh() {
            this.getStorages()
            this.getHomeInfo()
        },
        onUnload() {
            // 断开socket连接
            this.socket.off('msgFront', this.friendMsgListener)
            this.socket.off('groupMsgFront', this.groupMsgListener)
            this.socket.off('leaveChatRoomFront', this.leaveChatRoomMsgListener)
        },
		methods: {
            initSocketInfo() {
                // 连接好友socket
                this.receiveFriendSocketMsg()
                // 接收群组消息
                this.receiveGroupSocketMsg()
                // 离开聊天室
                this.receiveLeaveChatRoomSocketMsg()
            },
            changeTime(time) {
                return dateTime(time)
            },
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { userId, userName, imgUrl, token } = userInfo;
                    this.uid = userId; // 用户ID
                    this.userName = userName; // 用户名
                    this.imgUrl = this.serverUrl + imgUrl; // 头像URL
                    this.token = token; // 用户token
                    if (this.isInit) {
                        this.socket.emit('login', this.uid)
                        this.isInit = false
                    }
                } else {
                    uni.navigateTo({
                        url: '/pages/signIn/index'
                    });
                } 
            },
            // 好友申请
            getFriendsRequest() {
                return new Promise((resolve, reject) => {
                    this.requestData = 0
                    this.requestTime = ''
                    uni.request({
                        url: this.serverUrl + '/index/getFriend', // 替换为你的登录接口地址,
                        method: 'POST',
                        data: {
                            uid: this.uid,
                            state: 1, // 2表示好友申请
                            token: this.token
                        },
                        success: (res) => {
                            const { data, code } = res.data
                            if (code === 200) {
                                this.requestData = data.length; // 更新好友申请数量
                                if (data.length > 0) {
                                    this.requestTime = data[0].lastTime
                                    for(let i = 0 ; i < data.length; i++) {
                                        if (this.requestTime < data[i].lastTime) {
                                            this.requestTime = data[i].lastTime; // 更新最后申请时间
                                        }
                                    }
                                }
                                resolve()
                            } else {
                                reject('好友申请存在问题')
                            }
                        },
                        fail: (err) => {
                            reject('好友申请失败：' + err)
                        }
                    })
                })
            },
            receiveFriendSocketMsg() {
                this.socket.on('msgFront', this.friendMsgListener)
            },
            friendMsgListener(msg, fromid) {
                let nmsg = ''
                if (msg.types === 0) {
                    nmsg = msg.message
                } else if (msg.types === 1) {
                    nmsg = '[图片]'
                } else if (msg.types === 2) {
                    nmsg = '[音频]'
                } else if (msg.types === 3) {
                    nmsg = '[位置]'
                }
                for(let i = 0 ; i < this.friendsList.length ; i++) {
                    if (this.friendsList[i].id === fromid) {
                        let e = this.friendsList[i]
                        e.lastTime = new Date()
                        e.message = nmsg 
                        e.tip++
                        this.friendsList.splice(i, 1)
                        this.friendsList.unshift(e)
                        
                        // 更新消息分组
                        this.updateGroupsAfterNewMessage(e)
                        break
                    }
                }
            },
            receiveGroupSocketMsg() {
                this.socket.on('groupMsgFront', this.groupMsgListener)
            },
            // 接受群组
            groupMsgListener(data) {
                const { msg, userID, groupID, name, imgurl } = data || {}
                let nmsg = ''
                if (msg.types === 0) {
                    nmsg = msg.message
                } else if (msg.types === 1) {
                    nmsg = '[图片]'
                } else if (msg.types === 2) {
                    nmsg = '[音频]'
                } else if (msg.types === 3) {
                    nmsg = '[位置]'
                }
                for(let i = 0 ; i < this.friendsList.length ; i++) {
                    if (this.friendsList[i].id === groupID) {
                        let e = this.friendsList[i]
                        e.lastTime = new Date()
                        if (userID == this.uid) {
                            e.message = nmsg
                        } else {
                            e.message = name + ': ' + nmsg
                        }
                        e.tip++
                        this.friendsList.splice(i, 1)
                        this.friendsList.unshift(e)
                        
                        // 更新消息分组
                        this.updateGroupsAfterNewMessage(e)
                        break
                    }
                }
            },
            receiveLeaveChatRoomSocketMsg() {
                this.socket.on('leaveChatRoomFront', this.leaveChatRoomMsgListener)
            },
            leaveChatRoomMsgListener(uid, fid) {
                // 离开聊天室更新聊天tip
                for(let i = 0 ; i < this.friendsList.length ; i++) {
                    if (this.friendsList[i].id === fid) {
                        let e = this.friendsList[i]
                        e.tip = 0
                        this.friendsList.splice(i, 1, e)
                    }
                }
            },
            getHomeInfo() {
                this.friendsList = []
                this.groupsList = []
                this.isRefresh = true
                // 页面加载获取好友
                Promise.all([
                    this.getFriendsRequest(),
                    this.getFriendsList(),
                    this.getGroup()
                ]).then(() => {
                    this.friendsList = this.groupsList.concat(this.friendsList)
                    if (this.friendsList?.length > 0 || this.requestData > 0) {
                        this.friendsList = sortByTip(this.friendsList, 'lastTime', 0)
                        this.isNoFriendList = false
                        this.groupMessagesByDate()
                    } else {
                        this.isNoFriendList = true
                    }
                }).catch((error) => {
                    uni.showToast({
                        title: error,
                        icon: 'none',
                        duration: 2000
                    });
                }).finally(() => {
                    this.isRefresh = false
                    uni.stopPullDownRefresh()
                })   
            },

            getFriendsList() {
                return new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/index/getFriend', // 替换为你的登录接口地址,
                        method: 'POST',
                        data: {
                            uid: this.uid,
                            state: 0, 
                            token: this.token
                        },
                        success: (res) => {
                            const { data, code } = res.data
                            if (code === 200) {
                                if (data.length > 0) {
                                    for(let i = 0; i < data.length ; i++) {
                                        data[i].imgUrl = this.serverUrl + data[i].imgurl
                                        if (data[i].markname) {
                                            data[i].name = data[i].markname
                                        }
                                        if (data[i].id != this.uid) {
                                            data[i].message = data[i].msg
                                        } 
                                        this.friendsList.push(data[i])
                                    }
                                }
                                resolve()
                            } else {
                                uni.showToast({
                                    title: '获取好友请求失败',
                                    icon: 'none',
                                    duration: 2000
                                });
                                reject(new Error('获取好友请求失败'));
                            }
                        },
                        fail: (err) => {
                            uni.showToast({
                                title: '获取好友请求失败',
                                icon: 'none',
                                duration: 2000
                            });
                            reject(err);
                        }
                    })
                })
            },
            // 好友列表
            getGroup() {
                return new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/index/getGroup', // 替换为你的登录接口地址,
                        method: 'POST',
                        data: {
                            uid: this.uid,
                            state: 0, 
                            token: this.token
                        },
                        success: (res) => {
                            const { data, code } = res.data
                            if (code === 200) {
                                if (data.length > 0) {
                                    for(let i = 0; i < data.length ; i++) {
                                        data[i].imgUrl = this.serverUrl + data[i].imgurl
                                        if (data[i].markname) {
                                            data[i].name = data[i].markname
                                        }
                                        if (data[i].id != this.uid && data[i].msg) {
                                            data[i].message = data[i].username + ': ' + data[i].msg
                                        } 
                                        this.groupsList.push(data[i])
                                        // 加入群组监听
                                        this.socket.emit('groupServer', data[i].id)
                                    }
                                }
                                resolve()
                            } else {
                                reject('获取创建群消息失败');
                            }
                        },
                        fail: (err) => {
                            reject('获取创建群消息失败' + err);
                        }
                    })
                })
            },
            
            // 按日期对消息进行分组
            groupMessagesByDate() {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                const oneWeekAgo = new Date(today)
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                
                this.todayMessages = []
                this.weekMessages = []
                this.earlierMessages = []
                
                this.friendsList.forEach(friend => {
                    if (!friend.lastTime) return
                    
                    const messageDate = new Date(friend.lastTime)
                    messageDate.setHours(0, 0, 0, 0)
                    
                    if (messageDate.getTime() === today.getTime()) {
                        this.todayMessages.push(friend)
                    } else if (messageDate >= oneWeekAgo) {
                        this.weekMessages.push(friend)
                    } else {
                        this.earlierMessages.push(friend)
                    }
                })
            },
            
            // 当接收新消息时更新分组
            updateGroupsAfterNewMessage(updatedFriend) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                const messageDate = new Date(updatedFriend.lastTime)
                messageDate.setHours(0, 0, 0, 0)
                
                // 从所有分组中移除该好友
                this.todayMessages = this.todayMessages.filter(f => f.id !== updatedFriend.id)
                this.weekMessages = this.weekMessages.filter(f => f.id !== updatedFriend.id)
                this.earlierMessages = this.earlierMessages.filter(f => f.id !== updatedFriend.id)
                
                // 添加到合适的分组
                if (messageDate.getTime() === today.getTime()) {
                    this.todayMessages.unshift(updatedFriend)
                } else {
                    const oneWeekAgo = new Date(today)
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                    
                    if (messageDate >= oneWeekAgo) {
                        this.weekMessages.unshift(updatedFriend)
                    } else {
                        this.earlierMessages.unshift(updatedFriend)
                    }
                }
            },
            toSearch() {
                uni.navigateTo({
                    url: '/pages-personal/search/index'
                });
            },
            toBuildGroup() {
                uni.navigateTo({
                    url: '/pages-chat/buildGroup/index'
                });
            },
            toFriendRequest() {
                uni.navigateTo({
                    url: '/pages-chat/friendRequest/index'
                });
            },
            toChatRoom(data) {
                const { id, name, imgurl, chatType } = data || {}
                uni.navigateTo({
                    url: '/pages-chat/chatRoom/index?id=' + id + '&name=' + name + '&imgurl=' + imgurl + '&chatType=' + chatType
                });
            },
		}
	}
</script>
<style lang="scss">
    @import "../../commons/css/top-bar.scss"; // 引入统一顶部栏样式
    
    /* 全局容器 */
    .content {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background-color: #f7f8fc; // 更柔和的背景色
        position: relative;
        padding-bottom: env(safe-area-inset-bottom); // 适配iPhone底部安全区域
    }

    /* 主内容区域 */
    .main {
        flex: 1;
        padding: 20rpx 24rpx;
        width: 100%;
        box-sizing: border-box;
    }

    /* 下拉刷新提示 */
    .refresh {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rpx 0;
        color: #8a8a8a;
        
        .refresh-icon {
            width: 36rpx;
            height: 36rpx;
            animation: spin 1.2s linear infinite; // 添加旋转动画
        }

        .ref-title {
            margin-top: 10rpx;
            font-size: 26rpx;
            color: #8a8a8a;
            line-height: 1.5;
        }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* 空状态 */
    .noone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 120rpx 0;
        
        image {
            height: 280rpx;
            width: 180rpx;
            opacity: 0.8;
            margin-bottom: 20rpx;
        }
        
        .no-friends {
            font-size: 28rpx;
            color: #8a8a8a;
            margin-bottom: 40rpx;
        }
        
        .search-bt {
            font-size: 28rpx;
            color: #ffffff;
            padding: 20rpx 40rpx;
            background: linear-gradient(135deg, #6e8efb, #5d7df9); // 渐变按钮
            border-radius: 40rpx;
            box-shadow: 0 10rpx 20rpx rgba(93, 125, 249, 0.3);
            transition: transform 0.2s;
            
            &:active {
                transform: scale(0.95);
                opacity: 0.9;
            }
        }
    }
    
    /* 消息分组 */
    .message-group {
        margin-bottom: 24rpx;
        
        .group-title {
            font-size: 24rpx;
            color: #8a8a8a;
            padding: 16rpx 8rpx;
            font-weight: 500;
        }
    }

    /* 好友和群组列表 */
    .friends {
        .friends-list {
            background: #ffffff;
            border-radius: 20rpx;
            box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
            margin-bottom: 20rpx;
            padding: 24rpx;
            display: flex;
            align-items: center;
            position: relative;
            overflow: hidden;
            transition: transform 0.15s ease, background-color 0.15s ease;
            
            &:active {
                transform: scale(0.98);
                background: #f9f9f9;
            }
            
            /* 波纹效果 */
            &::after {
                content: '';
                display: block;
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                pointer-events: none;
                background-image: radial-gradient(circle, #5d7df9 10%, transparent 10.01%);
                background-repeat: no-repeat;
                background-position: 50%;
                transform: scale(10, 10);
                opacity: 0;
                transition: transform .5s, opacity 0.8s;
            }
            
            &:active::after {
                transform: scale(0, 0);
                opacity: 0.2;
                transition: 0s;
            }
            
            .friends-list-l {
                position: relative;
                margin-right: 24rpx;
                
                /* 头像样式 */
                image.avatar {
                    width: 88rpx;
                    height: 88rpx;
                    border-radius: 44rpx; // 圆形头像
                    box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
                    border: 3rpx solid #ffffff;
                    object-fit: cover; // 确保图片正确裁剪
                }
                
                /* 消息提示徽章 */
                .tip {
                    position: absolute;
                    top: -8rpx;
                    right: -8rpx;
                    min-width: 36rpx;
                    height: 36rpx;
                    padding: 0 8rpx;
                    line-height: 36rpx;
                    font-size: 22rpx;
                    font-weight: 500;
                    background: #ff5252; // 醒目的红色
                    color: #ffffff;
                    border-radius: 18rpx;
                    text-align: center;
                    box-shadow: 0 4rpx 8rpx rgba(255, 82, 82, 0.3);
                    z-index: 10;
                }
                
                /* 群组标识 */
                .groupm {
                    position: absolute;
                    bottom: 6rpx;
                    right: 6rpx;
                    width: 24rpx;
                    height: 24rpx;
                    background: #5d7df9; // 与应用主色调一致
                    border-radius: 12rpx;
                    border: 3rpx solid #ffffff;
                    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
                    z-index: 5;
                }
            }
            
            .friends-list-r {
                flex: 1;
                overflow: hidden;
                
                .top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10rpx;
                    
                    .name {
                        font-size: 32rpx;
                        font-weight: 600;
                        color: #333333;
                        max-width: 70%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    
                    .time {
                        font-size: 24rpx;
                        color: #999999;
                    }
                }
                
                .news {
                    font-size: 26rpx;
                    color: #666666;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
            }
        }
    }
    
    /* 特殊样式：好友申请项 */
    .friends-list:first-child {
        border-left: 4rpx solid #5d7df9; // 左侧边框强调
        
        .friends-list-r {
            .name {
                color: #5d7df9;
            }
        }
    }
</style>