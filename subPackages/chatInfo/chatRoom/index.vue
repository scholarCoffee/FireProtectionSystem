<template>
    <view class="content" @keyboardheightchange="onKeyboardHeightChange">
        <view class="page-content">
            <scroll-view class="chat" scroll-y="true" :scroll-with-animation="scrollAnimation" @tap="onClickChatContent" :scroll-into-view="scrollToView" @scrolltoupper="nextPage" :style="{ 'height': chatHeight + 'px' }">
                <view class="chat-main">
                    <view class="chat-ls" v-for="(item, index) in chatMessageList" :key="index" :id="'chatMessageList' + item.id">     
                        <view class="chat-time" v-if="item.time != ''">{{ dateTime(item.time) }}</view>
                        <!-- 消息左边 -->
                        <view class="msg-m msg-left" v-if="item.fromId !== userInfo.id">
                            <image :src="item.avatarUrl" class="user-img"></image>
                            <view class="message" v-if="item.types === 0">
                                <view class="name-text">{{ item.nickName }}</view>
                                <view class="msg-text">{{ item.message }}</view>
                            </view>
                            <view class="message" v-if="item.types === 1">
                                <view class="name-text">{{ item.nickName }}</view>
                                <image :src="item.message" class="msg-img" @tap="previewImg(item.message)" mode="widthFix"></image>
                            </view>
                        </view>
                        <!-- 消息右边 -->
                        <view class="msg-m msg-right" v-else>
                            <image :src="item.avatarUrl" class="user-img"></image>
                            <view class="message" v-if="item.types === 0">
                                <view class="msg-text">{{ item.message }}</view>
                            </view>
                            <view class="message" v-if="item.types === 1">
                                <image :src="item.message" class="msg-img" @tap="previewImg(item.message)" mode="widthFix"></image>
                            </view>
                        </view>
                    </view>
                </view>
            </scroll-view>
            <view class="submit-container">
                <Submit ref="submit" @currentHeight="currentHeight" @sendMsg="sendMessage"></Submit>
            </view>
        </view>
    </view>
</template>
<script>
import { dateTime, spaceTime, fileNameTime, withDatedPath } from '@/commons/js/utils.js'; // 导入工具
import Submit from '@/componets/submit'
export default {
    data() {
        return {
            // 当前登录用户
            userInfo: {
                id: '', // 用户id
                nickName: '', // 用户昵称
                avatarUrl: '' // 用户头像
            },
            // 聊天室信息[一对一好友或者群]
            currentUserInfo: {
                id: '', // 聊天室id
                nickName: '', // 聊天室名称
                avatarUrl: '' // 聊天室头像
            },
            chatType: 1, // 0-好友，1-群
            chatMessageList: [],
            serverUrl: 'https://www.xiaobei.space',
            imgMsg: [],
            scrollToView: '',
            oldTime: 0,
            inputh: '54',
            chatHeight: 0, // 聊天框动态高度
            nowPage: 1,
            pageSize: 20,
            loadingTimers: '',
            isLoading: false,
            scrollAnimation: true
        }
    },
    components: { Submit },
    onLoad(e) {
        const { id, nickName, avatarUrl, chatType } = e || {}
        this.currentUserInfo.id = id 
        this.currentUserInfo.nickName = nickName
        this.currentUserInfo.avatarUrl = avatarUrl
        this.chatType = Number(chatType) || 1
        if (!this.isGroup) {
            this.receiveSelfSocketMsg()
        } else {
            this.receivceGroupSocketMsg()
        }
    },
    computed: { isGroup() { return this.chatType == 1 } },
    onShow() {
        this.getStorages()
        this.getChatMessageList()
        // 确保聊天框高度正确
        this.$nextTick(() => {
            this.initChatHeight();
        });
    },
    onUnload() {
        this.socket.off('msgFront', this.friendIndexServerListener)
        this.socket.off('groupMsgFront', this.groupIndexServerListener)
        clearInterval(this.loadingTimers)
    },
    // 拦截导航栏后退事件
    onBackPress(options) {
        // 判断是否是从导航栏后退按钮触发的
        if (['backbutton', 'navigateBack'].includes(options.from)) {
            // 执行自定义方法
            this.customBackMethod()
        }
        return false
    },
    methods: {
        withDatedPath,
        // 自定义后退方法
        customBackMethod() {
            this.socket.emit('leaveChatRoomServer', this.userInfo.id, this.currentUserInfo.id, this.chatType);
        },
        onClickChatContent() {
            // 点击聊天内容，隐藏键盘
            this.$refs.submit.hideSubmit()
        },
        // 监听键盘高度变化
        onKeyboardHeightChange(e) {
            const { height } = e.detail;
            if (height > 0) {
                // 键盘弹出，调整聊天框高度
                const systemInfo = uni.getSystemInfoSync();
                const windowHeight = systemInfo.windowHeight;
                this.chatHeight = windowHeight - height - this.inputh;
            } else {
                // 键盘隐藏，恢复聊天框高度
                this.initChatHeight();
            }
            // 滚动到底部
            this.$nextTick(() => {
                setTimeout(() => {
                    this.scrollToBottom();
                }, 100);
            });
        },
        dateTime,
        getStorages() {
            // 获取本地存储的用户信息
            const userInfo = uni.getStorageSync('userInfo');
            if (userInfo) {
                const { id, nickName, avatarUrl } = userInfo;
                this.userInfo.id = id
                this.userInfo.nickName = nickName
                this.userInfo.avatarUrl = avatarUrl
            }
        },
        nextPage() {
            if (this.isLoading) {
                this.isLoading = false;
                clearTimeout(this.loadingTimers);
                this.loadingTimers = setTimeout(() => {
                    this.pageSize += 20;
                    this.getChatMessageList('scrollTop');
                }, 1000);
            }
        },
        getChatMessageList(action) {
            // 获取消息列表
            uni.showToast({ title: '加载中...', icon: 'loading', duration: 5000 });
            this.chatMessageList = [];
            const url = this.isGroup ? this.serverUrl + '/chat/getGroupMsg' : this.serverUrl + '/chat/getSelfMsg';
            const data = {
                userId: this.userInfo.id,
                nowPage: this.nowPage,
                pageSize: this.pageSize,
                state: 1,
                ...(this.isGroup ? { groupId: this.currentUserInfo.id } : { friendId: this.currentUserInfo.id })
            };
            uni.request({
                url,
                method: 'POST',
                data,
                success: (res) => {
                    const { data, code } = res.data;
                    if (code === 200) {
                        data.reverse();
                        if (data.length > 0) {
                            let oldTime = data[0].time
                            let msgArr = []
                            for (let i = 0; i < data.length; i++) {
                                data[i].avatarUrl = this.serverUrl + data[i].avatarUrl;
                                if (i < data.length) {
                                    let t = spaceTime(oldTime, data[i].time);
                                    if (t) {
                                        oldTime = t
                                    }
                                    data[i].time = t;
                                    if (this.nowPage === 1) {
                                        if (data[i].time > this.oldTime) {
                                            this.oldTime = data[i].time
                                        }
                                    }
                                    if(data[i].types === 1) {
                                        data[i].message =  this.serverUrl + data[i].message;
                                        msgArr.push(data[i].message)
                                    }
                                    // if(data[i].types === 3) {
                                    //     data[i].message =  JSON.parse(data[i].message)
                                    //     msgArr.push(data[i].message)
                                    // }
                                } else {
                                    data[i].time = '';
                                }
                            }
                            if(action === 'scrollTop') {
                                this.chatMessageList = data.concat(this.chatMessageList);
                            } else {
                                this.chatMessageList = data
                            }
                            this.chatMessageList = this.chatMessageList.map((item, index) => {
                                item.id = index + 1
                                return item
                            })
                            this.imgMsg = this.imgMsg.concat(msgArr)
                        }
                        this.scrollToBottom(action)
                    } else {
                        uni.showToast({ title: '获取聊天信息失败', icon: 'none', duration: 5000 });
                    }
                },
                fail: () => {
                    uni.showToast({ title: '获取聊天信息失败', icon: 'none', duration: 5000 });
                },
                complete: () => {
                    uni.hideToast();
                }
            })
        },
        // 预览图片
        previewImg(url) {
            const index = this.imgMsg.findIndex(img => img === url);
            uni.previewImage({
                current: index,
                urls: this.imgMsg,
                longPressAction: {
                    itemList: ['保存图片', '发送给朋友', '收藏'],
                    success: function (res) {},
                    fail: function (res) {}
                }
            });
        },
        // 发送消息
        sendMessage(message) {
           this.receiveMessage(message, this.userInfo.id, this.userInfo.avatarUrl)
        },
        /**
         * 
         * @param messageInfo 消息信息
         * @param id 消息发送者id
         * @param avatarUrl 消息发送者头像
         */
        receiveMessage(messageInfo, id, avatarUrl) {
            const { types } = messageInfo || {}
            let { message } = messageInfo || {}
            // 发送消息
            if (types === 0 || types === 3) {
                this.sendSocket(messageInfo)
            } else if (types === 1) {
                this.imgMsg.push(message)
                const uploadTask = uni.uploadFile({
                    url: this.serverUrl + '/files/upload', // 仅为示例，非真实的接口地址
                    filePath: message,
                    fileType: 'image',
                    name: 'file',
                    formData: {
                        id: this.userInfo.id,
                        url: this.withDatedPath('/uploadImg/chatImg'),
                        name: 'chatImg_' + this.userInfo.id + Math.ceil(Math.random()*10),
                    },
                    success: (res) => {
                        // 处理返回的数据
                        res = JSON.parse(res.data)
                        console.log('上传成功', res)
                        let data = {
                            message: res.data,
                            types: types
                        }
                        this.sendSocket(data)
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '图片上传失败' + err,
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
                uploadTask.onProgressUpdate((res) => {
                    console.log('上传进度', res.progress)
                })
            }
            this.scrollAnimation = true
            let len = this.chatMessageList.length
            let nowTime = new Date();
            let t = spaceTime(this.oldTime, nowTime);
            if (t) {
                this.oldTime = t
            }
            nowTime = t;
            if (types == 3 ) {
                message = JSON.parse(message)
            }
            const data = {
                fromId: id, // 假设 1 表示当前用户
                message, // 消息内容
                types, // 假设 0 表示文本消息
                time: nowTime, // 消息时间
                avatarUrl: avatarUrl, // 假设当前用户头像
                id: len + 1// 消息数量
            }
            // 添加新消息到消息列表
            this.chatMessageList.push(data);
            this.$nextTick(() => {
                this.scrollToBottom(); // 滚动到底部
            }); 
        },
        // socekt聊天接受数据
        receiveSelfSocketMsg() {
            this.socket.on('msgFront', this.friendIndexServerListener)
        },
        friendIndexServerListener(data) {
            const { messageInfo, userId } = data
            if (userId == this.currentUserInfo.id && userId !== this.userInfo.id) {
                this.scrollAnimation = true
                let nowTime = new Date();
                let t = spaceTime(this.oldTime, nowTime);
                if (t) {
                    this.oldTime = t
                }
                if (messageInfo.types == 1 || messageInfo.types == 2) {
                    messageInfo.message = this.serverUrl + messageInfo.message
                }
                nowTime = t;
                const data = {
                    fromId: userId, // 假设 1 表示当前用户
                    message: messageInfo.message,
                    types: messageInfo.types, // 假设 0 表示文本消息
                    time: nowTime,
                    avatarUrl: this.userInfo.avatarUrl, // 假设当前用户头像
                    id: this.chatMessageList.length + 1
                }
                // 添加新消息到消息列表
                this.chatMessageList.push(data);
                if (messageInfo.types === 1) {
                    this.imgMsg.push(messageInfo.message)
                }
                this.$nextTick(() => {
                    this.scrollToBottom(); // 滚动到底部
                });
            } 
        },
        receivceGroupSocketMsg() {
            this.socket.on('groupMsgFront', this.groupIndexServerListener)
        },
        groupIndexServerListener(data) {
            const { messageInfo, userId, groupId, userName, userAvatar } = data
            if (groupId == this.currentUserInfo.id && userId !== this.userInfo.id) {
                this.scrollAnimation = true
                let nowTime = new Date();
                let t = spaceTime(this.oldTime, nowTime);
                if (t) {
                    this.oldTime = t
                }
                // 图片消息
                if (messageInfo.types == 1 || messageInfo.types == 2) {
                    messageInfo.message = this.serverUrl + messageInfo.message
                }
                nowTime = t;
                const data = {
                    fromId: userId, // 假设 1 表示当前用户
                    nickName: userName, // 当前用户名称
                    message: messageInfo.message,
                    types: messageInfo.types, // 假设 0 表示文本消息
                    time: nowTime,
                    avatarUrl: userAvatar, // 假设当前用户头像
                    id: this.chatMessageList.length + 1
                }
                // 添加新消息到消息列表
                this.chatMessageList.push(data);
                if (messageInfo.types === 1) {
                    this.imgMsg.push(messageInfo.message)
                }
                this.$nextTick(() => {
                    this.scrollToBottom(); // 滚动到底部
                });
            } 
        },
        // 聊天数据发送给后端
        sendSocket(data) {
            if(!this.isGroup) {
                this.socket.emit('msgServer', {
                    messageInfo: data,
                    userId: this.userInfo.id, // 信息来源：当前用户
                    userName: this.userInfo.nickName, // 当前用户名称
                    userAvatar: this.userInfo.avatarUrl, // 当前用户头像
                    friendId: this.currentUserInfo.id, // 当前好友id
                    friendName: this.currentUserInfo.nickName, // 当前好友名称
                    friendAvatar: this.currentUserInfo.avatarUrl, // 当前好友头像
                    time: new Date() // 消息时间
                })
            } else {
                this.socket.emit('groupMsgServer', {
                    messageInfo: data,
                    userId: this.userInfo.id, // 信息来源：当前用户
                    userName: this.userInfo.nickName, // 当前用户名称
                    userAvatar: this.userInfo.avatarUrl, // 当前用户头像
                    groupId: this.currentUserInfo.id, // 当前群id
                    nickName: this.currentUserInfo.nickName, // 当前用户名称
                    avatarUrl: this.currentUserInfo.avatarUrl, // 当前用户头像
                    time: new Date() // 消息时间
                })
            }
        },
        // 初始化聊天框高度
        initChatHeight() {
            const systemInfo = uni.getSystemInfoSync();
            const windowHeight = systemInfo.windowHeight;
            // 默认输入框高度96px，减去状态栏高度
            const statusBarHeight = systemInfo.statusBarHeight || 0;
            this.chatHeight = windowHeight - 54 - statusBarHeight;
        },
        // 处理输入框高度变化
        currentHeight(value) {
            this.inputh = value;
            // 动态调整聊天框高度
            const systemInfo = uni.getSystemInfoSync();
            const windowHeight = systemInfo.windowHeight;
            const statusBarHeight = systemInfo.statusBarHeight || 0;
            
            // 计算聊天框高度：窗口高度 - 输入框高度 - 状态栏高度
            this.chatHeight = windowHeight - value - statusBarHeight;
            this.scrollToBottom();
        },
        scrollToBottom(action) {
            this.scrollAnimation = true
            if (action === 'scrollTop') {
                // 向上加载历史消息，滚动到第一条消息
                this.$nextTick(() => {
                    if (this.chatMessageList.length > 0) {
                        this.scrollToView = 'chatMessageList' + this.chatMessageList[0].id;
                    }
                });
            } else {
                // 发送新消息或接收消息，滚动到底部
                this.$nextTick(() => {
                    setTimeout(() => {
                        const lastItem = this.chatMessageList[this.chatMessageList.length - 1];
                        if (lastItem) {
                            this.scrollToView = 'chatMessageList' + lastItem.id;
                        }
                    }, 150); // 增加延迟确保DOM完全渲染
                });
            }
            clearInterval(this.loadingTimers)
            this.isLoading = true
        }
    }
}
</script>
<style lang="scss">
page {
    height: 100%;
}
.content {
    height: 100%;
    background-color: #f7f8fc;
}
/* 内容区下移，避免被导航栏遮挡 */
.page-content {
  padding-top: 0;
}
.chat, .submit-container {
  margin-top: 0;
}
.chat {
    // 高度通过动态计算，不再使用固定高度
    .padbt {
        height: var(--status-bar-height);
        width: 100%;
    }
    .loading {
        text-align: center;
        .loading-img {
            width: 60rpx;
            height: 60rpx;
        }
    }
    .chat-main {
        padding-left: $uni-spacing-col-base;
        padding-right: $uni-spacing-col-base;
        display: flex;
        flex-direction: column;
        min-height: 100%; // 确保内容区域至少占满容器高度
    }
    .chat-ls {
        .chat-time {
            font-size: $uni-font-size-sm;
            color: rgba(39, 40, 50, 0.3);
            line-height: 34rpx;
            padding: 20rpx 0;
            text-align: center;
        }
        .msg-m {
            display: flex;
            padding: 20rpx 0;
            .user-img {
                flex: none;
                width: 58rpx;
                height: 58rpx;
                border-radius: $uni-border-radius-base;
            }
            .message {
               flex: none;
               max-width: 480rpx;
            }
            .name-text {
                padding: 0 20rpx;
            }
            .msg-text {
                padding: 20rpx;
                border-radius: 20rpx;
                font-size: 28rpx;
                line-height: 44rpx;
                word-break: break-all; // 防止长文本溢出
                word-wrap: break-word;
            }
            .msg-img {
                max-width: 60vw; // 适配不同屏幕
                border-radius: $uni-border-radius-base;
            }
            .msg-map {
                background: #fff;
                width: 464rpx;
                height: 284rpx;
                overflow: hidden;
                .map-name {
                    font-size: $uni-font-size-lg;
                    color: $uni-text-color;
                    line-height: 44rpx;
                    padding: 18rpx 24rpx 0 24rpx;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    line-clamp: 1;
                    overflow: hidden;
                }
                .map-address {
                    font-size: $uni-font-size-sm;
                    color: $uni-text-color-disable;
                    padding: 0rpx 24rpx;;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    line-clamp: 1;
                    overflow: hidden;
                }
                .map-img {
                    padding-top: 8rpx;
                    width: 480rpx;
                    height: 190rpx;
                }
            }
            .voice {
                min-width: 100rpx;
                max-width: 400rp;
            }
        }
        .msg-left {
            flex-direction: row;
            .msg-text {
                margin-left: 16rpx;
                background-color: #fff;
                color: #333;
                border-radius: 20rpx;
            }
            .msg-img {
                margin-left: 16rpx;
            }
            .msg-map {
                margin-left: 16rpx;
                border-radius: 0px 20rpx 20rpx 20rpx;
            }
            .voice {
                text-align: right;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .voice-img {
                float: left;
                transform: rotate(180deg);
                padding-bottom: 4rpx;
                width: 36rpx;
                height: 36rpx;
            }
        }
        .msg-right {
            flex-direction: row-reverse;
            .msg-text {
                margin-right: 16rpx;
                background-color: #82f1007d;
                color: #333;
                border-radius: 20rpx;
            }
            .msg-img {
                margin-right: 16rpx;
            }
            .msg-map {
                margin-right: 16rpx;
                border-radius: 0px 20rpx 20rpx 20rpx;
            }
            .voice {
                text-align: left;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .voice-img {
                float: right;
                padding-bottom: 0rpx;
                width: 36rpx;
                height: 36rpx;
            }
        }
    }
}
.submit-container {
    position: fixed;
    bottom: 0;
    width: 100%;
    background-color: #fff;
    border-top: 1px solid #eaeaea;
    z-index: 10;
    padding-bottom: env(safe-area-inset-bottom); // 适配全面屏
}
</style>    