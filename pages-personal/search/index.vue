<template>
	<view class="content">
        <view class="top-bar">
            <view class="search-div">
                <image src="../../static/user/back.png" class="search-img" @tap="back"></image>
                <input type="text" placeholder="搜索用户" class="search" placeholder-style="color:#999;font-weight:400;" @input="onInputUser">
            </view>            
		</view>
        <view class="main">
            <view class="search-user result">
                <view class="title" v-if="qryUserInfo.length > 0">用户</view>
                <view class="list user" v-for="(item, index) in qryUserInfo" :key="index">
                    <view  @tap="gotoHome(item)" hover-class="none">
                        <image :src="item.imgurl"></image>
                    </view>
                    <view class="names">
                        <view class="name" v-html="item.names"></view>
                        <view class="email" v-html="item.emails"></view>
                    </view>
                    <view class="right-bt add" v-if="item.tip === 2" @tap="onAddGroup(item._id)">邀请群</view> 
                    <view class="right-bt send" v-if="item.tip === 1" @tap="toChatRoom(item)">发消息</view>
                    <view class="right-bt add" v-if="item.tip === 0" @tap="onAddFriend(item._id)">加好友</view>
                </view>
            </view>
        </view>
        <view class="modify" :style="{ bottom:-widHeight + 'px', 'display': isModify ? 'block' : 'none'  }" :animation="animation">
            <view class="modify-header">
                <view class="close" @tap="modify">取消</view>
                <view class="title">添加好友</view>
                <view class="define" @tap="addSubmit">确定</view>
            </view>
            <view class="modify-main">
                <textarea v-model="msg" class="modify-content" ></textarea>
            </view>
        </view>
	</view>
</template>

<script>
    import { debounce } from '../../commons/js/utils.js'
	export default {
		data() {
			return {
                qryUserInfo: [], // 搜索用户
                gid: '', // 群ID
                uid: '', // 用户ID
                fid: '', // 好友ID
                userName: '', // 用户名
                token: '', // 用户token
                msg: '', // 添加好友
                animation: {}, // 动画对象
                isModify: false, // 是否显示修改弹窗
                widHeight: 0, // 组件高度
			}
		},
        onLoad(e) {
            // 页面加载时获取好友列表
            this.gid = e.gid || ''
            this.getStorages()
        },
        onReady() {
            this.getElementStyle()
        },
		methods: {
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { userId, userName, token } = userInfo;
                    this.uid = userId; // 用户ID
                    this.userName = userName; // 用户名
                    this.token = token; // 用户token
                } else {
                    uni.navigateTo({
                        url: '/pages/signIn/index'
                    });
                } 
            },
            gotoHome(item) {
                uni.navigateTo({
                    url: '/pages-personal/home/index?id=' + item._id
                });
            },
            onInputUser(e) {
                this.qryUserInfo = []
                const { value } = e.target || {}
                if (value.length > 0) {
                    this.searchUserDb(value)
                } else {
                    this.qryUserInfo = []
                }
            },
            // 防抖函数
            searchUserDb: debounce(function (e) {
                this.qryUserInfo = []
                this.searchUser(e)
            }, 500),
            searchUser(inputVal) {
                // 搜索用户
                uni.request({
                    url: this.serverUrl + '/search/user', // 替换为你的登录接口地址,
                    method: 'POST',
                    data: {
                        data: inputVal,
                        token: this.token
                    },
                    success: (res) => {
                        const { code } = res.data
                        const result = res.data.data || []
                        if (code === 200 ) { 
                            for(let i = 0; i < result.length ; i++) {
                                if (this.gid !== '') {
                                    this.isGroup(result[i], inputVal)
                                } else {
                                    this.isFriend(result[i], inputVal)
                                }
                            }
                        } else if (code === 300) {
                            uni.navigateTo({
                                url: '/pages/signIn/index?oldName=' + this.userName
                            });
                        } else {
                            uni.showToast({
                                title: '没有搜索到相关用户',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '没有搜索到相关用户',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            // 判断是否是群成员
            isGroup(item, inputVal) {
                let tip = 3
                const exp = new RegExp(inputVal, 'g');
                if(item._id === this.uid) {
                    tip = 3
                    item.tip = tip
                    item.imgurl = this.serverUrl + item.imgurl
                    item.names = item.name.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                    item.emails = item.email.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                    this.qryUserInfo.push(item)
                    return
                }
                // 搜索用户
                uni.request({
                    url: this.serverUrl + '/search/isInGroupByFriend', // 替换为你的登录接口地址,
                    method: 'POST',
                    data: {
                        uid: this.uid,
                        fid: item._id,
                        gid: this.gid,
                        token: this.token
                    },
                    success: (res) => {
                        const { code } = res.data
                        if (code === 200) {
                           tip = 2
                           item.tip = tip
                           item.id = item._id
                           item.type = 1
                           item.imgurl = this.serverUrl + item.imgurl
                           item.names = item.name.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                           item.emails = item.email.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                           this.qryUserInfo.push(item)
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '没有搜索到相关用户',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            // 判断是否是好友
            isFriend(item, inputVal) {
                console.log(item)
                let tip = 0
                const exp = new RegExp(inputVal, 'g');
                if(item._id === this.uid) {
                    tip = 3
                    item.tip = tip
                    item.imgurl = this.serverUrl + item.imgurl
                    item.names = item.name.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                    item.emails = item.email.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                    this.qryUserInfo.push(item)
                    return
                }
                // 搜索用户
                uni.request({
                    url: this.serverUrl + '/search/isfriend', // 替换为你的登录接口地址,
                    method: 'POST',
                    data: {
                        uid: this.uid,
                        fid: item._id,
                        token: this.token
                    },
                    success: (res) => {
                        const { code } = res.data
                        if (code === 200) {
                           tip = 1
                        }
                        item.tip = tip
                        item.id = item._id
                        item.type = 0
                        item.imgurl = this.serverUrl + item.imgurl
                        item.names = item.name.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                        item.emails = item.email.replace(exp, "<span style='color: #4A4AFF;'>" + inputVal + "</span>")
                        this.qryUserInfo.push(item)
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '没有搜索到相关用户',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            onAddGroup(id) {
                // 提示确定
                uni.showModal({
                    title: '提示',
                    content: '确定邀请好友加入群聊吗？',
                    success: (res) => {
                        if (res.confirm) {
                            // 确定邀请好友
                            uni.request({
                                url: this.serverUrl + '/group/addGroupUser', // 替换为你的登录接口地址,
                                method: 'POST',
                                data: {
                                    userID: id,
                                    groupID: this.gid,
                                    token: this.token
                                },
                                success: (res) => {
                                    const { code } = res.data
                                    if (code === 200) {
                                        uni.showToast({
                                            title: '邀请成功',
                                            icon: 'success',
                                            duration: 2000
                                        });
                                        // 邀请成功返回
                                        uni.navigateBack({
                                            delta: 1
                                        });
                                    }
                                },
                                fail: (err) => {
                                    uni.showToast({
                                        title: '没有搜索到相关用户',
                                        icon: 'none',
                                        duration: 2000
                                    });
                                }
                            })
                        }
                    }
                })
            },
            onAddFriend(fid) {
                this.fid = fid
                this.msg = this.userName + ' 请求添加好友~'
                this.modify()
            },
            addSubmit() {
                if (this.msg.length > 0) {
                    this.modify()
                    // 搜索用户
                    uni.request({
                        url: this.serverUrl + '/friend/applyfriend', // 替换为你的登录接口地址,
                        method: 'POST',
                        data: {
                            uid: this.uid,
                            fid: this.fid,
                            token: this.token,
                            msg: this.msg
                        },
                        success: (res) => {
                            const { data, code } = res.data || {}
                            if (code === 200) {
                                // 是好友
                                uni.showToast({
                                    title: '添加好友成功',
                                    icon: 'success',
                                    duration: 2000
                                });
                            }
                        },
                        fail: (err) => {
                            uni.showToast({
                                title: '没有搜索到相关用户',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    })
                }
            },
            back() {
                uni.navigateBack({
                    delta: 1
                });
            },
            getElementStyle() {
                const query = uni.createSelectorQuery().in(this)
                query.select('.modify').boundingClientRect((rect) => {
                    this.widHeight = rect.height
                }).exec()
            },
            modify(type, data, ispwd) {
                if (ispwd) {
                    this.ispwd ='block'
                } else {
                    this.ispwd = 'none'
                }
                this.modifyTitle = type
                this.data = data
                this.isModify = !this.isModify
                const animation = uni.createAnimation({
                    duration: 300,
                    timingFunction: 'ease',
                })
                if (this.isModify) {
                    animation.bottom(0).step()
                } else {
                    animation.bottom(-this.widHeight).step()
                }
                this.animation = animation.export()
            },
            modifySubmit() {
                this.modify()
            },
            toChatRoom(data) {
                const { id, name, imgurl, type } = data || {}
                uni.navigateTo({
                    url: '/pages-chat/chatRoom/index?id=' + id + '&names=' + name + '&imgurl=' + imgurl + '&type=' + type
                });
            }
		}
	}
</script>

<style lang="scss">
    @import "../../commons/css/top-bar.scss"; // 引入公共样式
    .main {
        padding: 180rpx $uni-spacing-col-base 120rpx; // 调整顶部间距适配固定的搜索栏
        
        .result {
            padding-top: $uni-spacing-col-base;
            
            .title {
                font-size: 36rpx;
                font-weight: 600;
                color: $uni-text-color;
                line-height: 60rpx;
                margin-bottom: 20rpx;
            }
        }
        
        .list {
            width: 100%;
            height: auto; // 自适应高度
            padding: 20rpx 0;
            display: flex;
            align-items: center;
            border-bottom: 1px solid rgba(230, 230, 230, 0.5);
            
            image {
                width: 80rpx;
                height: 80rpx;
                border-radius: $uni-border-radius-base;
                background-color: #f8f8f8;
            }
        }
        
        .names {
            flex: 1;
            padding-left: $uni-spacing-col-base;
            overflow: hidden; // 防止文本溢出
        }
        
        .name {
            font-size: 32rpx;
            font-weight: 500;
            color: $uni-text-color;
            line-height: 44rpx;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .email {
            font-size: $uni-font-size-sm;
            line-height: 36rpx;
            color: $uni-text-color-grey;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .right-bt {
            min-width: 120rpx;
            height: 56rpx;
            border-radius: 28rpx;
            font-size: $uni-font-size-sm;
            line-height: 56rpx;
            text-align: center;
            margin-left: 16rpx;
            box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
        }
        
        .send {
            color: #fff;
            background: $uni-color-primary;
        }
        
        .add {
            color: $uni-color-success;
            background: rgba(74, 170, 255, 0.1);
        }
    }
    
    .modify {
        position: fixed; 
        z-index: 1002;
        left: 0;
        width: 100%;
        height: 100%;
        background: #fff;
        
        .modify-header {
            width: 100%;
            height: 88rpx;
            padding-top: var(--status-bar-height);
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid $uni-border-color;
            
            .close {
                padding-left: $uni-spacing-col-base;
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
                line-height: 88rpx;
            }
            
            .title {
                flex: auto;
                text-align: center;
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
                line-height: 88rpx;
            }
            
            .define {
                padding-right: $uni-spacing-col-base;
                font-size: $uni-font-size-lg;
                color: $uni-color-success;
                line-height: 88rpx;
            }
        }
        
        .modify-main {
            display: flex;
            padding: $uni-spacing-col-base;
            flex-direction: column;
            
            .modify-content {
                padding: 20rpx;
                width: 100%;
                box-sizing: border-box;
                height: 300rpx;
                background: $uni-bg-color-grey;
                border-radius: $uni-border-radius-base;
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
                line-height: 44rpx;
            }
        }
    }
    
    /* #ifdef MP */
    .top-bar {
        padding-top: 40rpx; // 小程序状态栏高度适配
    }
    
    .modify-header {
        padding-top: 40rpx;
    }
    /* #endif */
</style>
