<template>
    <view class="content">
        <!-- 如果用户未登录，显示登录提示和按钮 -->
        <view v-if="!isLoggedIn" class="login-prompt">
            <view class="prompt-text">您需要登录才能访问该页面。</view>
            <button class="login-button" @tap="wxLogin">请登录</button>
        </view>
        <!-- 如果用户已登录，显示个人信息页面 -->
        <view v-else class="main">
            <view class="column heads">
                <view class="row" @tap="chooseImage" >
                    <view class="title">头像：</view>
                    <view class="cont" >
                        <image :src="tempFilePaths" class="user-img"></image>
                    </view>
                    <view class="more" >
                        <image src="../../static/user/arrow-right.png" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="column">
                <view class="row" @tap="modify('markname', '昵称', user.markname, false)">
                    <view class="title">昵称：</view>
                    <view class="cont">{{ user.markname }}</view>
                    <view class="more">
                        <image src="../../static/user/arrow-right.png" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="column" @tap="modify('pwd', '密码', '', true)">
                <view class="row">
                    <view class="title">密码：</view>
                    <view class="cont">**********</view>
                    <view class="more">
                        <image src="../../static/user/arrow-right.png" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="bt2" @tap="quit">退出登录</view>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                uid: '', // 用户ID
                token: '', // 用户token
                myname: '', // 用户名
                user: {},
                index: 0,
                tempFilePaths: '/static/1.png',
                pwd: '', // 密码
                oldData: '',
                modifyTitle: '',
                data: '修改的内容', // 签名内容
                ispwd: false, 
                pwd: undefined, // 密码
                type: '', // 修改类型
                animation: {}, // 动画对象
                isModify: false, // 是否显示修改弹窗
                widHeight: 1000, // 组件高度
                isLoggedIn: false // 用户是否已登录
            }
        },
        computed: {},
        onLoad(e) {
            const { id } = e || {}
            this.id = id
            this.getStorages(); // 获取本地存储的用户信息
        },
        methods: {
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { userId, token, userName } = userInfo;
                    this.uid = userId; // 用户ID
                    this.token = token; // 用户token
                    this.myname = userName;
                    this.isLoggedIn = true; // 用户已登录
                    this.getUser(); // 获取用户信息
                } else {
                    this.isLoggedIn = false; // 用户未登录
                } 
            },
            // 获取用户信息
            getUser() {
                uni.request({
                    url: this.serverUrl + '/user/detail', // 替换为你的登录接口地址,
                    method: 'POST',
                    data: {
                        id: this.id,
                        token: this.token
                    },
                    success: (res) => {
                        const { data, code } = res.data
                        if (code === 200) {
                            let { sex, name, imgurl, explain, birth, phone } = data || {}
                            this.tempFilePaths = this.serverUrl + imgurl; // 头像URL
                            if (!phone) {
                                phone = '000'
                            }
                            this.user = {
                                ...data,
                                explain,
                                phone,
                                birth,
                                markname: ''
                            }
                            this.getMarkName(); // 获取好友昵称
                        } else {
                            uni.showToast({
                                title: '获取用户信息失败',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '获取用户信息失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            quit() {
                // 清楚缓存
                uni.removeStorageSync('userInfo')
                this.isLoggedIn = false; // 用户已退出登录
                uni.navigateTo({
                    url: '/pages/signIn/index?oldName=' + this.myname
                });
            },
            chooseImage() {
                uni.chooseImage({
                    count: 1,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album'],
                    success: (res) => {
                        this.tempFilePaths = res.tempFilePaths.shift() 
                        uni.uploadFile({
                            url: this.serverUrl + '/files/upload', // 替换为你的上传接口地址
                            filePath: this.tempFilePaths,
                            name: 'file',
                            fileType: 'image',
                            formData: {
                                url: 'user',
                                name: this.uid,
                                token: this.token
                            },
                            success: (res) => {
                                const backImg = JSON.parse(res.data).data
                                uni.setStorageSync('userInfo', {
                                    'userId': this.uid,
                                    'userName': this.myname,
                                    'imgUrl': backImg,
                                    'token': this.token
                                })
                                this.update(backImg, 'imgurl', undefined)
                            },
                            fail: (err) => {
                                uni.showToast({
                                    title: '头像修改失败:' + err.errMsg,
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                        })
                    }
                })
            },
            update(value, type, pwd) {
                uni.request({
                    url: this.serverUrl + '/user/update', // 替换为你的登录接口地址,
                    method: 'POST',
                    data: {
                        uid: this.uid,
                        data: value,
                        type: type,
                        pwd: pwd,
                        token: this.token
                    },
                    success: (res) => {
                        const { code, data } = res.data
                        if (code === 200) { 
                            this.user[type] = data[type]
                            if (type === 'pwd') {
                                // 用户需重新登录
                                // 清楚缓存
                                uni.removeStorageSync('userInfo')
                                this.isLoggedIn = false; // 用户已退出登录
                                uni.navigateTo({
                                    url: '/pages/signIn/index?oldName=' + this.myname
                                });
                            }
                        } else if (code === 400) {
                            uni.showToast({
                                title: '密码错误',
                                icon: 'none',
                                duration: 2000
                            });
                        } else if (code === 201) {
                            uni.showToast({
                                title: '已被占用',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '获取好友昵称失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            // 微信一键登录
            wxLogin() {
                uni.login({
                    provider: 'weixin',
                    success: (loginRes) => {
                        if (loginRes.code) {
                            // 发送 code 到后台换取用户信息
                            uni.request({
                                url: this.serverUrl + '/user/wxLogin', // 替换为你的微信登录接口地址
                                method: 'POST',
                                data: {
                                    code: loginRes.code
                                },
                                success: (res) => {
                                    const { code, data } = res.data;
                                    if (code === 200) {
                                        const { userId, token, userName } = data;
                                        this.uid = userId;
                                        this.token = token;
                                        this.myname = userName;
                                        this.isLoggedIn = true; // 用户已登录
                                        uni.setStorageSync('userInfo', {
                                            'userId': userId,
                                            'userName': userName,
                                            'token': token
                                        });
                                        this.getUser(); // 获取用户信息
                                    } else {
                                        uni.showToast({
                                            title: '登录失败',
                                            icon: 'none',
                                            duration: 2000
                                        });
                                    }
                                },
                                fail: (err) => {
                                    uni.showToast({
                                        title: '登录失败',
                                        icon: 'none',
                                        duration: 2000
                                    });
                                }
                            });
                        } else {
                            uni.showToast({
                                title: '获取登录凭证失败',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '登录失败',
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
        background-color: #f8f8f8;
        min-height: 100vh;
    }
    
    .login-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
    }
    
    .prompt-text {
        font-size: 30rpx;
        color: $uni-text-color;
        margin-bottom: 20rpx;
    }
    
    .login-button {
        width: 90%;
        height: 90rpx;
        line-height: 90rpx;
        text-align: center;
        font-size: 32rpx;
        color: $uni-color-warning;
        background-color: #fff;
        border-radius: 45rpx;
        box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    }
    
    .main {
        padding-top: 20rpx;
        padding-bottom: 100rpx;
        
        .column {
            margin: 20rpx 30rpx;
            background-color: #fff;
            border-radius: 16rpx;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
            overflow: hidden;
            
            &.heads {
                .row {
                    padding: 20rpx 30rpx;
                }
            }
            
            .row {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 0 30rpx;
                min-height: 100rpx;
                border-bottom: 1px solid rgba(230, 230, 230, 0.5);
                
                &:last-child {
                    border-bottom: none;
                }
            }
            
            .title {
                width: 160rpx;
                font-size: 30rpx;
                color: $uni-text-color;
            }
            
            .user-img {
                width: 80rpx;
                height: 80rpx;
                border-radius: 10rpx;
                object-fit: cover;
            }
            
            .cont {
                flex: 1;
                font-size: 30rpx;
                color: $uni-text-color-grey;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding-right: 20rpx;
            }
            
            .more {
                width: 40rpx;
                height: 100rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                
                image {
                    width: 30rpx;
                    height: 30rpx;
                }
            }
            
            // 日期选择器样式优化
            .uni-input {
                font-size: 30rpx;
                color: $uni-text-color-grey;
            }
            
            // 选择器样式优化
            .picker {
                font-size: 30rpx;
                color: $uni-text-color-grey;
            }
        }
        
        .bt2 {
            margin: 40rpx auto;
            width: 90%;
            height: 90rpx;
            line-height: 90rpx;
            text-align: center;
            font-size: 32rpx;
            color: $uni-color-warning;
            background-color: #fff;
            border-radius: 45rpx;
            box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
        }
    }
    
    // 优化小程序按钮
    .bt2 {
        position: relative;    
        &:after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    }
</style>