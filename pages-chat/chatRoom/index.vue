<template>
    <view class="content">
        <view class="top-bar">
            <view class="top-bar-left" @tap="backOne">
                <image src="../../static/user/back.png" class="back-img"></image>
            </view>
            <view class="top-bar-center"><view class="top-bar-name">{{ name }}</view></view>
            <view class="top-bar-right">
                <view class="group-img" v-if="isGroup" @tap="goGroupHome"><image :src="imgurl"></image></view>
            </view>
        </view>
        <scroll-view class="chat" scroll-y="true" :scroll-with-animation="scrollAnimation" :scroll-into-view="scrollToView" @scrolltoupper="nextPage">
            <view class="chat-main" :style="{ 'padding-bottom': inputh + 'px'}">
                <view class="chat-ls" v-for="(item, index) in chatMessage" :key="index" :id="'chatMessage' + item.id">     
                    <view class="chat-time" v-if="item.time != ''">{{ dateTime(item.time) }}</view>
                    <view class="msg-m msg-left" v-if="item.fromId !== uid"  @tap="goUserHome(item.fromId)">
                        <image :src="item.imgurl" class="user-img"></image>
                        <view class="message" v-if="item.types === 0">
                            <view class="name-text" v-if="isGroup">{{ item.name }}</view>
                            <view class="msg-text">{{ item.message }}</view>
                        </view>
                        <view class="message" v-if="item.types === 1">
                            <view class="name-text" v-if="isGroup">{{ item.name }}</view>
                            <image :src="item.message" class="msg-img" @tap="previewImg(item.message)" mode="widthFix"></image>
                        </view>
                        <!-- <view class="message" v-if="item.types === 2">
                            <view class="name-text" v-if="isGroup">{{ item.name }}</view>
                            <view class="msg-text voice" :style="{
                                'width': item.message.time*4 + 'px'
                            }" @tap="playVoice(item.message.voice)"> 
                                <image src="../../static/yy.png" class="voice-img"></image>
                                {{ item.message.time }}"
                            </view>    
                        </view> -->
                        <!-- <view class="message" v-if="item.types === 3" @tap="openLocation(item.message)">
                            <view class="name-text" v-if="isGroup">{{ item.name }}</view>
                            <view class="msg-map">
                                <view class="map-name">{{ item.message.name }}</view>
                                <view class="map-address">{{ item.message.address }}</view>   
                                <image src="../../static/6.png" class="msg-img" mode="aspectFit"></image>                 -->
                                <!-- <map class="map" :longitude="item.message.longitude" :latitude="item.message.latitude" :markers="cover(item.message)"></map>    
                            </view>
                        </view> -->
                    </view>
                    <view class="msg-m msg-right" v-else>
                        <image :src="item.imgurl" class="user-img"  @tap="goUserHome(item.fromId)"></image>
                        <view class="message" v-if="item.types === 0">
                            <view class="msg-text">{{ item.message }}</view>
                        </view>
                        <view class="message" v-if="item.types === 1">
                            <image :src="item.message" class="msg-img" @tap="previewImg(item.message)" mode="widthFix"></image>
                        </view>
                        <!-- <view class="message" v-if="item.types === 2">
                            <view class="msg-text voice" :style="{
                                'width': item.message.time*4 + 'px'
                            }" @tap="playVoice(item.message.voice)">
                                {{ item.message.time }}"
                                <image src="../../static/yy.png" class="voice-img"></image>
                            </view>    
                        </view>  -->
                        <!-- <view class="message" v-if="item.types === 3">
                            <view class="msg-map" @tap="openLocation(item.message)">
                                <view class="map-name">{{ item.message.name }}</view>
                                <view class="map-address">{{ item.message.address }}</view>                    
                                <image src="../../static/6.png" class="msg-img" mode="aspectFit"></image> -->
                                <!-- <map class="map" :longitude="item.message.longitude" :latitude="item.message.latitude" :markers="cover(item.message)"></map>    
                            </view>
                        </view> -->
                    </view>
                </view>
            </view>
            <!-- <view class="padbt"></view> -->
        </scroll-view>
        <view class="submit-container">
            <submit @currentHeight="currentHeight" @sendMsg="sendMessage"></submit>
        </view>
    </view>
</template>
<script>
import { dateTime, spaceTime, fileNameTime } from './../../commons/js/utils.js'; // 导入 dateTime 函数
import Submit from './../../componets/submit'
// const innerAudioContext = uni.createInnerAudioContext()

export default {
    data() {
        return {
            uid: '', // 当前用户id
            id: '', // 当前id[一对一好友id或者群id]
            name: '', // 名称[好友名称或者群名称]
            imgurl: '', // 头像[好友头像或者群头像]
            chatType: 0, // 0-好友，1-群
            uimgurl: '',
            token: '',
            uname: '',
            chatMessage: [],
            imgMsg: [],
            scrollToView: '',
            oldTime: 0,
            inputh: '96',
            nowPage: 1,
            pageSize: 20,
            loadingTimers: '',
            isLoading: false,
            scrollAnimation: true
        }
    },
    components: { Submit },
    onLoad(e) {
        const { id, name, chatType, imgurl } = e || {}
        this.id = id
        this.name = name
        this.chatType = Number(chatType)
        this.imgurl = this.serverUrl + imgurl
        if (!this.isGroup) {
            this.receiveSelfSocketMsg()
        } else {
            this.receivceGroupSocketMsg()
        }
    },
    computed: {
        // 是否群聊
        isGroup() {
            return this.chatType == 1
        }
    },
    onShow() {
        this.getStorages()
        this.getChatMessage()
    },
    beforeDestroy() {
        this.socket.off('msgFront', this.friendIndexServerListener)
        this.socket.off('groupMsgFront', this.groupIndexServerListener)
        clearInterval(this.loadingTimers)
    },
    methods: {
        dateTime,
        getStorages() {
            // 获取本地存储的用户信息
            const userInfo = uni.getStorageSync('userInfo');
            if (userInfo) {
                const { userId, userName, imgUrl, token } = userInfo;
                this.uid = userId; // 用户ID
                this.uname = userName; // 用户名
                this.uimgurl = this.serverUrl + imgUrl; // 头像URL
                this.token = token; // 用户token
            } else {
                uni.navigateTo({
                    url: '/pages/signIn/index'
                });
            } 
        },
        backOne() {
            this.socket.emit('leaveChatRoomServer', this.uid, this.id)
            uni.navigateBack({
                delta: 1
            });
        },
        goUserHome(fromId) {
            uni.navigateTo({
                url: '/pages-personal/userDetail/index?id=' + fromId
            })
        },
        goGroupHome() {
            uni.navigateTo({
                url: '/pages-chat/grouphome/index?gid=' + this.id + '&gimg=' + this.imgurl
            })
        },
        nextPage() {
            if (this.isLoading) {
                this.isLoading = false
                // 节流
                this.loadingTimers = setTimeout(() => {
                    this.pageSize += 20
                    this.getChatMessage('scrollTop')
                }, 1000)
            }

        },
        getChatMessage(action) {
            // 获取消息列表
            uni.showToast({
                title: '加载中...',
                icon: 'loading',
                duration: 5000
            });
            this.chatMessage = []
            const url = this.isGroup ? this.serverUrl + '/chat/getGroupMsg' : this.serverUrl + '/chat/getSelfMsg'
            const data = {
                uid: this.uid,
                nowPage: this.nowPage,
                pageSize: this.pageSize,
                state: 1,
                token: this.token
            }
            if (this.isGroup) {
                data.gid = this.id
            } else {
                data.fid = this.id
            }
            uni.request({
                url, // 替换为你的登录接口地址,
                method: 'POST',
                data,
                success: (res) => {
                    const { data, code } = res.data
                    if (code === 200) {
                        // 反转消息列表
                        data.reverse();
                        if (data.length > 0) {
                            let oldTime = data[0].time
                            let msgArr = []
                            for (var i = 0; i < data.length; i++) {
                                data[i].imgurl = this.serverUrl + data[i].imgurl;
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
                            this.chatMessage = data.concat(this.chatMessage);
                            this.imgMsg = this.imgMsg.concat(msgArr)
                        }
                        this.scrollToBottom(action)
                    } else {
                        uni.showToast({
                            title: '获取聊天信息失败',
                            icon: 'none',
                            duration: 5000
                        });
                    }
                },
                fail: (err) => {
                    uni.showToast({
                        title: '获取聊天信息失败',
                        icon: 'none',
                        duration: 5000
                    });
                },
                complete: () => {
                    uni.hideToast()
                }
            })
        },
        // 预览图片
        previewImg(e) {
            let index = 0
            for(let i = 0; i < this.imgMsg.length; i++) {
                if(this.imgMsg[i] === e) {
                    index = i
                }
            }
            uni.previewImage({
                current: index,
                urls: this.imgMsg,
                longPressAction: {
                    itemList: ['保存图片', '发送给朋友', '收藏'],
                    success: function (res) {
                        console.log(res.tapIndex)
                    },
                    fail: function (res) {
                        console.log(res.errMsg)
                    }
                }
            });
        },
        // playVoice(e) {
        //     innerAudioContext.src = e
        //     innerAudioContext.play();
        // },
        // cover(e) {
        //     const { longitude, latitude, name, address } = e || {}
        //     let map = [{
        //         latitude: latitude,
        //         longitude: longitude,
        //         iconPath: '/static/6.png',
        //     }] 
        //     return map
        // },
        // openLocation(e) {
        //     const { longitude, latitude, name, address } = e || {}
        //     uni.openLocation({
        //         latitude: latitude,
        //         longitude: longitude,
        //         name: name,
        //         address: address,
        //         success: function (res) {
        //             console.log(res)
        //         },
        //         fail: function (res) {
        //             console.log(res.errMsg)
        //         }
        //     });
        // },
        sendMessage(e) {
           this.receiveMsg(e, this.uid, this.uimgurl, 0)
        },
        // 接收消息
        receiveMsg(e, id, img, tip) {
            // tip = 0 表示自己发送消息
            // socket提交
            if (e.types === 0 || e.types === 3) {
                this.sendSocket(e)
            } else if (e.types === 1) {
                this.imgMsg.push(e.message)
                const uploadTask = uni.uploadFile({
                    url: this.serverUrl + '/files/upload', // 仅为示例，非真实的接口地址
                    filePath: e.message,
                    fileType: 'image',
                    name: 'file',
                    formData: {
                        url: fileNameTime(new Date()),
                        name: new Date().getTime() + this.uid + Math.ceil(Math.random()*10),
                    },
                    success: (res) => {
                        // 处理返回的数据
                        res = JSON.parse(res.data)
                        console.log('上传成功', res)
                        let data = {
                            message: res.data,
                            types: e.types
                        }
                        this.sendSocket(data)
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '图片上传失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })

                uploadTask.onProgressUpdate((res) => {
                    console.log('上传进度', res.progress)
                })
            // } else if (e.types === 2) {
            //     let url = fileNameTime(new Date())
            //     const uploadTask = uni.uploadFile({
            //         url: this.serverUrl + '/files/upload', // 仅为示例，非真实的接口地址
            //         filePath: e.message.voice,
            //         name: 'file',
            //         formData: {
            //             url: url,
            //             name: new Date().getTime() + this.uid + Math.ceil(Math.random()*10),
            //         },
            //         success: (res) => {
            //             // 处理返回的数据
            //             res = JSON.parse(res.data)
            //             console.log('上传成功', res)
            //             let data = {
            //                 message: res.data,
            //                 types: e.types
            //             }
            //             this.sendSocket(data)
            //         },
            //         fail: (err) => {
            //             uni.showToast({
            //                 title: '语音上传失败',
            //                 icon: 'none',
            //                 duration: 2000
            //             });
            //         }
            //     })

            //     uploadTask.onProgressUpdate((res) => {
            //         console.log('上传进度', res.progress)
            //     })
            }
            const { message, types } = e || {}
            this.scrollAnimation = true
            let len = this.chatMessage.length
            let nowTime = new Date();
            let t = spaceTime(this.oldTime, nowTime);
            if (t) {
                this.oldTime = t
            }
            nowTime = t;
            if (e.types == 3 ) {
                e.message = JSON.parse(e.message)
            }
            const data = {
                fromId: id, // 假设 1 表示当前用户
                message: message,
                types: types, // 假设 0 表示文本消息
                time: nowTime,
                imgurl: img, // 假设当前用户头像
                id: len
            }
            // 添加新消息到消息列表
            this.chatMessage.push(data);
            this.$nextTick(() => {
                this.scrollToView = 'chatMessage' + len;
            }); 
            
        },
        // socekt聊天接受数据
        receiveSelfSocketMsg() {
            this.socket.on('msgFront', this.friendIndexServerListener)
        },
        friendIndexServerListener(data, fromid) {
            const { msg, userID } = data
            if (userID == this.id && userID !== this.uid) {
                console.log('')
                this.scrollAnimation = true
                let nowTime = new Date();
                let t = spaceTime(this.oldTime, nowTime);
                if (t) {
                    this.oldTime = t
                }
                if (msg.types == 1 || msg.types == 2) {
                    msg.message = this.serverUrl + msg.message
                }
                nowTime = t;
                const data = {
                    fromId: userID, // 假设 1 表示当前用户
                    message: msg.message,
                    types: msg.types, // 假设 0 表示文本消息
                    time: nowTime,
                    imgurl: this.imgurl, // 假设当前用户头像
                    id: this.chatMessage.length
                }
                // 添加新消息到消息列表
                this.chatMessage.push(data);
                if (msg.types === 1) {
                    this.imgMsg.push(msg.message)
                }
                this.$nextTick(() => {
                    this.scrollToView = 'chatMessage' + this.chatMessage[this.chatMessage.length - 1].id
                });
            } 
        },
        receivceGroupSocketMsg() {
            this.socket.on('groupMsgFront', this.groupIndexServerListener)
        },
        groupIndexServerListener(data) {
            const { msg, userID, groupID, name, imgurl } = data
            console.log('-------------')
            if (groupID == this.id && userID !== this.uid) {
                this.scrollAnimation = true
                let nowTime = new Date();
                let t = spaceTime(this.oldTime, nowTime);
                if (t) {
                    this.oldTime = t
                }
                if (msg.types == 1 || msg.types == 2) {
                    msg.message = this.serverUrl + msg.message
                }
                nowTime = t;
                const data = {
                    fromId: userID, // 假设 1 表示当前用户
                    name: name, 
                    message: msg.message,
                    types: msg.types, // 假设 0 表示文本消息
                    time: nowTime,
                    imgurl: imgurl, // 假设当前用户头像
                    id: this.chatMessage.length
                }
                // 添加新消息到消息列表
                this.chatMessage.push(data);
                if (msg.types === 1) {
                    this.imgMsg.push(msg.message)
                }
                this.$nextTick(() => {
                    this.scrollToView = 'chatMessage' + this.chatMessage[this.chatMessage.length - 1].id
                });
            } 
        },
        // 聊天数据发送给后端
        sendSocket(e) {
            if(!this.isGroup) {
                this.socket.emit('msgServer', e, this.uid, this.id)
            } else {
                this.socket.emit('groupMsgServer', {
                    msg: e,
                    userID: this.uid, // 信息来源：当前用户
                    groupID: this.id, // 当前群id
                    name: this.uname, // 当前用户名称
                    imgurl: this.uimgurl, // 当前用户头像
                })
            }
        },
        currentHeight(value) {
            this.inputh = value
            this.scrollToBottom()
        },
        scrollToBottom(action) {
            this.scrollAnimation = true
            if (action === 'scrollTop') {
                this.scrollToView = 'chatMessage' + this.chatMessage[0].id;
            } else {
                setTimeout(() => {
                    this.scrollToView = ''
                    this.scrollAnimation = false
                    this.$nextTick(() => {
                        const lastItem = this.chatMessage[this.chatMessage.length - 1];
                        if (lastItem) {
                            this.scrollToView = 'chatMessage' + lastItem.id;
                        }
                    });     
                }, 0);
            }
            clearInterval(this.loadingTimers)
            this.isLoading = true
        }
    }
}
</script>
<style lang="scss">
@import "../../commons/css/top-bar.scss"; // 引入公共样式
.displayNone {
    display: none;
}
page {
    height: 100%;
}
.content {
    height: 100%;
    background: rgba(244, 244, 244 ,1)
}
.chat {
    height: 100%; // 减去头部高度
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
        padding-top: 220rpx;
        display: flex;
        flex-direction: column;        
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
                background-color: #fff260;
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
                word-wrap: break-word; // 添加换行支持
                word-break: break-word; // 添加换行支持
            }
            .msg-img {
                max-width: 400rpx;
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
                    overflow: hidden;
                }
                .map-address {
                    font-size: $uni-font-size-sm;
                    color: $uni-text-color-disable;
                    padding: 0rpx 24rpx;;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
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
                background-color: rgba(255, 228, 49, 0.8);
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
}
</style>    