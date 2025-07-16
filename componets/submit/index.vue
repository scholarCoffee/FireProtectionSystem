<template>
    <view>
        <view class="submit">
            <view class="submit-chat">
                <view class="bt-img" @tap="onClickRecords">
                    <image :src="toc" class="icon gray"></image>
                </view>
                <textarea v-model="msg" auto-height="true" class="chat-send btn" :class="{ displayNone: isRecord}" @input="onClickInput" @focus="focus"></textarea>
                <view class="record btn" :class="{ displayNone: !isRecord }" @longpress="touchstart" @touchend="touchend" @touchmove="touchmove">按住说话</view>
                <view class="bt-img emoji-icon" @tap="onClickEmoji">
                    <image src="/static/icons/chat/emoji.png" class="icon gray"></image>
                </view>
                <view class="bt-img add-icon" @tap="moreFun">
                    <image src="/static/icons/chat/add.png" class="icon gray"></image>
                </view>
            </view>
            <view class="emoji" :class="{ displayNone: isEmoji }">
                <view class="emoji-send">
                    <view class="emoji-send-det" @tap="emojiDel">
                        <image src="/static/icons/chat/emojiDel.png"></image>
                    </view>
                    <view class="emoji-send-bt" @tap="emojiSend">发送</view>
                </view>
                <emoji @emotion="emotion" :height="260"></emoji>
                </view>
                <view class="more" :class="{ displayNone: isMore }">
                    <view class="more-list" v-for="(item, index) in moreList" :key="index" @tap="onClickMore(item)">
                        <image :src="item.imgUrl"></image>
                        <view class="more-list-text">{{ item.text }}</view>
                    </view>
                </view>
        </view>
        <view class="voice-bg" :class="{ displayNone: isVoice }">
            <view class="voice-bg-len">
                <view class="voice-bg-time" :style="{
                    'width': vlength/0.6 + '%'
                }">{{ vlength }}</view>
            </view>
            <view class="voice-del">上滑取消录音</view>
        </view>
    </view>
</template>
<script>
    import emoji from './../emoji/index.vue'
    const recorderManager = uni.getRecorderManager()
    export default {
        name: 'Submit',
        components: {
            emoji
        },
        data() {
            return {
                moreList: [{
                    imgUrl: '../../static/img.png',
                    key: 1,
                    text: '图片'
                }, {
                    imgUrl: '../../static/photo.png',
                    key: 2,
                    text: '拍照'
                }, {
                    imgUrl: '../../static/location.png',
                    key: 3,
                    text: '位置'
                }, {
                    imgUrl: '../../static/video.png',
                    key: 4,
                    text: '视频'
                }, {
                    imgUrl: '../../static/file.png',
                    key: 5,
                    text: '文件'
                }],
                isRecord: false,
                isEmoji: true,
                isMore: true,
                isVoice: true,
                msg: '',
                toc: '/static/icons/chat/yy.png',
                timer: '',
                vlength: 0,
                pageY: 0,
            }
        },
        methods: {
            // 获取模块高度
            getElementHeight(value) {
                const query = uni.createSelectorQuery().in(this)
                query.select('.submit').boundingClientRect(data => {
                    const height = this.isEmoji && this.isMore ? data.height : (data.height + value)
                    this.$emit('currentHeight', height)
                }).exec()
            },
            // 点击切换音频
            onClickRecords() {
                this.isEmoji = true
                this.isMore = true
                if(this.isRecord) {
                    this.toc = "/static/icons/chat/clickSpeak.png"
                } else {
                    this.toc = "/static/icons/chat/speak.png"
                }
                this.isRecord = !this.isRecord
            },
            // 点击表情
            onClickEmoji() {
                this.isEmoji = !this.isEmoji
                this.isMore = true
                this.isRecord = false
                this.toc = "/static/icons/chat/clickSpeak.png"
                setTimeout(() => { 
                    this.getElementHeight(0)
                }, 0)
            },
            emotion(e) {
                this.msg = this.msg + e
            },
            onClickMore(item) {
              const { key } = item || {}
              switch(key) {
                case 1:
                    this.sendImg(item)
                    break
                case 2:
                    this.sendImg(item)
                    break
                case 3:
                    this.chooseLocation(item)
                    break
                case 4:
                    this.$emit('sendVideo', item)
                    break
                case 5:
                    this.$emit('sendFile', item)
                    break
                default:
                    break
              }
            },
            sendImg(e) {
                const { key } = e || {}
                let sourceType = ['album', 'camera']
                let count = 9
                if (key === 1 ) {
                    count = 9
                    sourceType = ['album']
                } else {
                    count = 1
                    sourceType = ['camera']
                }
                uni.chooseImage({
                    count: count,
                    sizeType: ['original', 'compressed'],
                    sourceType: sourceType,
                    success: (res) => {
                        const filePaths = res.tempFilePaths
                        for (let i = 0; i < filePaths.length; i++) {
                            this.send(filePaths[i], 1)
                        }
                    },
                    fail: (err) => {
                        console.log(err)
                    }
                })
            },
            chooseLocation() {
                uni.chooseLocation({
                    success: (res) => {
                        const { name, address, latitude, longitude } = res || {}
                        let data = {
                            name: name,
                            address: address,
                            latitude: latitude,
                            longitude: longitude
                        }
                        this.send(JSON.stringify(data), 3)
                    },
                    fail: (err) => {
                        console.log(err)
                    }
                })
            },
            touchstart(e) {
                let i = 1
                this.pageY = e.changedTouches[0].pageY
                this.isVoice = false
                this.timer = setInterval(() => {
                    this.vlength = i
                    i++
                    if (i > 60) {
                        clearInterval(this.timer)
                        this.touchend()
                    }
                }, 1000)
                recorderManager.start()
            },
            touchend(e) {
               clearInterval(this.timer)
               recorderManager.stop()
               recorderManager.onStop((res) => {
                    const { tempFilePath } = res || {}
                    let data = { 
                        voice: tempFilePath,
                        time: this.vlength,
                    }
                    if (!this.isVoice) {
                        this.send(data, 2)
                    }
                    this.vlength = 0
                    this.isVoice = true
                })
            },
            touchmove(e) {
                if (this.pageY - e.changedTouches[0].pageY > 100) {
                    this.isVoice = true
                    this.vlength = 0
                } 
            },
            focus() {
                this.isEmoji = true
                this.isMore = true
                this.isRecord = false
                this.toc = "/static/icons/chat/clickSpeak.png"
                setTimeout(() => {
                    this.getElementHeight(0)
                }, 10)
            },
            // 点击输入框
            onClickInput(e) {
                const { value } = e.target || {}
                const pos = value.indexOf('\n')
                if (pos != -1 && value.length > 0) {
                    this.send(this.msg, 0)
                }
            },
            emojiDel() {
                if (this.msg?.length > 0) {
                    this.msg = this.msg.substring(0, this.msg.length - 1)
                }
            },
            emojiSend() {
                if (this.msg?.length > 0) {
                    this.send(this.msg, 0)
                }
            },
            // 更多
            moreFun() {
                this.isMore = !this.isMore
                this.isRecord = false
                this.toc = "/static/icons/chat/clickSpeak.png"
                this.isEmoji = true
                setTimeout(() => {
                    this.getElementHeight(0)
                }, 0)
            },
            send(msg, types) {
                let data = {
                    message: msg,
                    types: types,
                }
                this.$emit('sendMsg', data)
                setTimeout(() => {
                    this.msg = ''
                }, 0)
            }
        }
    }
</script>
<style lang="scss">
.submit {
    background: rgba(244,244,244,0.96);
    border-top: 1px solid #eaeaea;
    width: 100%;
    z-index: 10002;
    padding-bottom: env(safe-area-inset-bottom);
}
.submit-chat {
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    padding: 14rpx;
    image {
        width: 56rpx;
        height: 56rpx;
        margin: 0 10rpx;
        flex: auto;
    }
    .btn {
        flex: auto;
        margin: 0 10rpx;
        max-height: 160rpx;
        padding: 20rpx;
        border: 1px solid #ccc;
        border-radius: 10rpx;
        background-color: #fff;
    }
    .chat-send {
        line-height: 44rpx;
    }
    .record {
        font-size: $uni-font-size-lg;
        color: $uni-text-color-grey;
        text-align: center;
        line-height: 44rpx;
    }
}
.emoji {
    width: 100%;
    height: 460rpx;
    background: rgba(236, 237, 238, 1);
    box-shadow: 0 -1rpx 0 0 rgba(0,0,0,0.1);
    .emoji-send {
        width: 300rpx;
        height: 104rpx;
        padding-top: 24rpx;
        background-color: rgba(236,237,238,0.8);
        position: fixed;
        bottom: env(safe-area-inset-bottom);
        right: 0;
        display: flex;
        .emoji-send-bt {
            flex: 1;
            margin: 0 32rpx 0 20rpx;
            height: 88rpx;
            background: rgba(255,228, 49, 1);
            font-size: 32rpx;
            text-align: center;
            line-height: 88rpx;
            border-radius: 12rpx;
        }
        .emoji-send-det {
            flex: 1;
            margin: 0 32rpx 0 20rpx;
            height: 88rpx;
            background: #fff;
            font-size: 32rpx;
            text-align: center;
            line-height: 88rpx;
            border-radius: 12rpx;
            display: flex;
            justify-content: center;
            align-items: center;
            image {
                width: 62rpx;
                height: 62rpx;
            }
        }
    }
}
.more {
    width: 100%;
    height: 436rpx;
    background: rgba(236, 237, 238, 1);
    box-shadow: 0 -1rpx 0 0 rgba(0,0,0,0.1);
    padding: 8rpx 20rpx;
    box-sizing: border-box;
    .more-list {
        width: 25%;
        text-align: center;
        float: left;
        padding-top: 32rpx;
        image {
            width: 72rpx;
            height: 72rpx;
            padding: 24rpx;
            background: rgba(255,255,255,1);
            border-radius: 24rpx;
        }
        .more-list-text {
            font-size: 26rpx;
            font-weight: 500;
            color: #888;
            line-height: 36rpx;
        }
    }
}
.voice-bg {
    height: 100%;
    width: 100%;
    background-color: rgba(0,0,0,0.3);
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 1001;
    .voice-bg-len {
        height: 84rpx;
        width: 600rpx;
        position: absolute;
        top:0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        background-color: rgba(255,255,255,0.2);
        border-radius: 42rpx;
        text-align: center;
    }
    .voice-bg-time {
        display: inline-block ;
        line-height: 84rpx;
        width: 120rpx;
        min-width: 120rpx;
        border-radius: 42rpx;
        background-color: $uni-color-primary;
    }
    .voice-del {
        position: absolute;
        bottom: 148rpx;
        margin-bottom: env(safe-area-inset-bottom);
        width: 100%;
        text-align: center;
        font-size: $uni-font-size-base;
        color: #fff;
    }
}
.displayNone {
    display: none;
}
</style>