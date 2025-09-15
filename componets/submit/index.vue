<template>
    <view>
        <view class="submit">
            <view class="submit-chat">
                <view class="bt-img" @tap="onClickSpeak">
                    <image :src="speakIcon" class="icon gray"></image>
                </view>
                <textarea v-model="msg" :auto-height="false" :show-confirm-bar="false" :adjust-position="false" class="chat-send btn" :class="{ displayNone: isRecord}" @input="onClickInput" @focus="focus" @blur="onBlur"></textarea>
                <view class="record btn" :class="{ displayNone: !isRecord }" @longpress="touchstart" @touchend="touchend" @touchmove="touchmove" @touchcancel="touchcancel">按住说话</view>
                <view class="bt-img emoji-icon" @tap="onShowEmoji">
                    <image :src="serverUrl + '/static/icons/chat/smile.png'" class="icon gray"></image>
                </view>
                <view class="bt-img add-icon" @tap="onClickMore">
                    <image :src="serverUrl + '/static/icons/chat/add.png'" class="icon gray"></image>
                </view>
            </view>
            <view class="emoji" :class="{ displayNone: isEmoji }">
                <view class="emoji-send">
                    <view class="emoji-send-det" @tap="onDelEmoji">
                        <image :src="serverUrl + '/static/icons/chat/delete.png'"></image>
                    </view>
                    <view class="emoji-send-bt" @tap="onClickEmojiSend">发送</view>
                </view>
                <emoji @emotion="onClickEmoji" :height="260"></emoji>
                </view>
                <view class="more" :class="{ displayNone: isMore }">
                    <view class="more-list" v-for="(item, index) in moreList" :key="index" @tap="onClickInfo(item)">
                        <image :src="serverUrl + item.imgUrl"></image>
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
    import { chatSubmitList } from '@/commons/mock'
    import emoji from './../emoji/index.vue'
    const recorderManager = uni.getRecorderManager()
    export default {
        name: 'Submit',
        components: {
            emoji
        },
        data() {
            return {
                serverUrl: 'https://www.xiaobei.space',
                moreList: chatSubmitList,
                isRecord: false,
                isEmoji: true,
                isMore: true,
                isVoice: true,
                msg: '',
                speakIcon: '',
                timer: '',
                vlength: 0,
                pageY: 0,
                recordingStarted: false,
            }
        },
        mounted() {
            this.speakIcon = this.serverUrl + '/static/icons/chat/beforeSpeak.png'
            // 仅在真正开始录音后，才显示录音状态与计时
            recorderManager.onStart(() => {
                // 避免重复计时
                if (this.timer) {
                    clearInterval(this.timer)
                    this.timer = ''
                }
                this.isVoice = false
                this.vlength = 0
                let i = 1
                this.timer = setInterval(() => {
                    this.vlength = i
                    i++
                    if (i > 60) {
                        clearInterval(this.timer)
                        this.timer = ''
                        recorderManager.stop()
                    }
                }, 1000)
                this.recordingStarted = true
            })
            // 统一处理停止事件
            recorderManager.onStop((res) => {
                const { tempFilePath } = res || {}
                let data = {
                    voice: tempFilePath,
                    voiceTime: this.vlength
                }
                console.log('voice data', data, this.isVoice)
                if (!this.isVoice) {
                    this.send(data, 2)
                }
                this.vlength = 0
                this.isVoice = true
                this.recordingStarted = false
            })
            // 权限被拒或启动失败
            recorderManager.onError(() => {
                if (this.timer) {
                    clearInterval(this.timer)
                    this.timer = ''
                }
                this.vlength = 0
                this.isVoice = true
                this.recordingStarted = false
                uni.showToast({ title: '需要麦克风权限', icon: 'none' })
            })
        },
        methods: {
            hideSubmit() {
                uni.hideKeyboard()
                this.isEmoji = true
                this.isMore = true
                this.isRecord = false
                this.speakIcon = this.serverUrl + "/static/icons/chat/beforeSpeak.png"
                this.$nextTick(() => {
                    this.getElementHeight(0)
                    // 通知父组件滚动到底部
                    this.$emit('scrollToBottom')
                })
            },
            // 获取模块高度
            getElementHeight(value) {
                const query = uni.createSelectorQuery().in(this)
                query.select('.submit').boundingClientRect(data => {
                    const height = this.isEmoji && this.isMore ? data.height : (data.height + value)
                    this.$emit('currentHeight', height)
                }).exec()
            },
            // 点击切换音频
            onClickSpeak() {
                this.isEmoji = true
                this.isMore = true
                if(this.isRecord) {
                    this.speakIcon = this.serverUrl + "/static/icons/chat/beforeSpeak.png"
                } else {
                    this.speakIcon = this.serverUrl + "/static/icons/chat/speaking.png"
                }
                this.isRecord = !this.isRecord
            },
            // 点击表情
            onShowEmoji() {
                this.isEmoji = !this.isEmoji
                this.isMore = true
                this.isRecord = false
                this.speakIcon = this.serverUrl + "/static/icons/chat/beforeSpeak.png"
                this.$nextTick(() => {
                    this.getElementHeight(0)
                    // 延迟通知父组件滚动到底部，确保面板显示完成
                    setTimeout(() => {
                        this.$emit('scrollToBottom')
                    }, 100)
                })
            },
            // 点击表情
            onClickEmoji(data) {
                this.msg = this.msg + data
            },
            // 点击更多
            onClickInfo(item) {
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
                        // 增强：大小过滤与加载提示
                        try {
                            uni.showLoading({ title: '处理中...', mask: true })
                            const files = (res.tempFiles || []).length ? res.tempFiles : (res.tempFilePaths || []).map(p => ({ path: p, size: 0 }))
                            const MAX_SIZE = 10 * 1024 * 1024 // 10MB
                            const valid = files.filter(f => !f.size || f.size <= MAX_SIZE)
                            if (valid.length < files.length) {
                                uni.showToast({ title: '已跳过超过10MB的图片', icon: 'none' })
                            }
                            for (let i = 0; i < valid.length; i++) {
                                const path = valid[i].path || valid[i]
                                this.send(path, 1)
                            }
                        } finally {
                            uni.hideLoading()
                        }
                    },
                    fail: (err) => {
                        console.log(err)
                        uni.showToast({ title: '选择图片失败', icon: 'none' })
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
                this.pageY = e.changedTouches[0].pageY
                // 不在此时展示录音状态，等待权限通过且真正开始录音（onStart）
                recorderManager.start()
            },
            touchend(e) {
               if (this.timer) {
                   clearInterval(this.timer)
                   this.timer = ''
               }
               // 松开即发送：仅在已开始录音时才停止并触发 onStop
               if (this.recordingStarted) {
                   recorderManager.stop()
               }
            },
            touchcancel(e) {
                if (this.timer) {
                    clearInterval(this.timer)
                    this.timer = ''
                }
                if (this.recordingStarted) {
                    recorderManager.stop()
                }
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
                this.speakIcon = this.serverUrl + "/static/icons/chat/beforeSpeak.png"
                // iOS 表情包居中修复
                this.$nextTick(() => {
                    this.fixIOSEmojiAlignment()
                })
            },
            onBlur() {
                // 输入框失去焦点时的处理
            },
            // iOS 表情包居中修复
            fixIOSEmojiAlignment() {
                // 检测是否为iOS设备
                const systemInfo = uni.getSystemInfoSync()
                if (systemInfo.platform === 'ios') {
                    // 强制重新渲染输入框以修复表情包对齐
                    this.$forceUpdate()
                }
            },
            // 点击输入框
            onClickInput(e) {
                const { value } = e.target || {}
                const pos = value.indexOf('\n')
                if (pos != -1 && value.length > 0) {
                    this.send(this.msg, 0)
                }
            },
            onDelEmoji() {
                if (this.msg?.length > 0) {
                    this.msg = this.msg.substring(0, this.msg.length - 1)
                }
            },
            onClickEmojiSend() {
                if (this.msg?.length > 0) {
                    this.send(this.msg, 0)
                }
            },
            // 更多
            onClickMore() {
                this.isMore = !this.isMore
                this.isRecord = false
                this.speakIcon = this.serverUrl + "/static/icons/chat/beforeSpeak.png"
                this.isEmoji = true
                this.$nextTick(() => {
                    this.getElementHeight(0)
                    // 延迟通知父组件滚动到底部，确保面板显示完成
                    setTimeout(() => {
                        this.$emit('scrollToBottom')
                    }, 100)
                })
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
    background-color: #f7f8fc;
    border-top: 1px solid #eaeaea;
    width: 100%;
    z-index: 10002;
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
        height: 92rpx; /* 固定输入控件高度，避免切换时跳动 */
        padding: 10rpx;
        border: 1px solid #ccc;
        border-radius: 10rpx;
        background-color: #fff;
    }
    .chat-send {
        height: 46rpx; /* 强制 textarea 与录音按钮同高 */
        line-height: 46rpx;
    }
    .record {
        font-size: $uni-font-size-base;
        color: $uni-text-color-grey;
        text-align: center;
        height: 46rpx; /* 与输入框同高 */
        line-height: 46rpx;
    }
}
.emoji {
    width: 100%;
    height: 460rpx;
    background:  #f7f8fc;
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
            color: #fff;
            height: 88rpx;
            background: #1296DB;
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
    height: 460rpx;
    background:  #f7f8fc;
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