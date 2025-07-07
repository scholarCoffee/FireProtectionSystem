<template>
    <view class="container">
        <!-- 安全区域适配 -->
        <view class="safe-area-top"></view>
        <!-- Logo区域 -->
        <view class="logo-area">
            <image class="logo-image" src="/static/fire.png" mode="aspectFit"></image>
        </view>
        <!-- 表单区域 -->
        <view class="form-container">
            <view class="welcome-text">欢迎回来</view>
            <!-- 输入框区域 -->
            <view class="input-group">
                <view class="input-item">
                    <text class="iconfont icon-user"></text>
                    <input 
                        type="text" 
                        v-model="username" 
                        placeholder="用户名" 
                        class="input-field"
                        placeholder-class="placeholder" 
                        adjust-position
                        confirm-type="next"
                        maxlength="20"
                    />
                    <text class="clear-icon" v-if="username" @tap="clearUsername">×</text>
                </view>
                
                <view class="input-item">
                    <text class="iconfont icon-lock"></text>
                    <input 
                        :type="showPassword ? 'text' : 'password'" 
                        v-model="password" 
                        placeholder="密码" 
                        class="input-field password"
                        placeholder-class="placeholder"
                        confirm-type="done"
                        maxlength="20"
                        @confirm="navigateToLogin"
                    />
                    <text class="eye-icon" @tap="togglePasswordVisibility">
                        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                    </text>
                </view>
            </view>
            
            <!-- 错误提示 -->
            <view class="error-tip" v-if="isOk">
                <text class="error-icon">!</text>
                <text class="error-text">用户名或密码错误</text>
            </view>
            
            <!-- 记住密码和忘记密码 -->
            <view class="auxiliary-row">
                <view class="remember-pwd">
                    <view class="checkbox" :class="{ checked: rememberPwd }" @tap="toggleRememberPwd">
                        <view class="inner-check" v-if="rememberPwd"></view>
                    </view>
                    <text>记住密码</text>
                </view>
                <view class="forgot-password" >
                    <text @tap="navigateToRegister" class="forgot-register">注册</text>
                    <text @tap="navigateToResetPassword">忘记密码?</text>
                </view>
            </view>
            
            <!-- 登录按钮 -->
            <button class="login-btn" @tap="navigateToLogin" hover-class="button-hover">
                登录
            </button>
            
            <!-- 其他登录方式 -->
            <!-- <view class="other-login-methods">
                <view class="divider">
                    <view class="line"></view>
                    <text>其他登录方式</text>
                    <view class="line"></view>
                </view>
                <view class="social-icons">
                    <view class="social-icon wechat">
                        <text class="iconfont icon-wechat"></text>
                    </view>
                </view>
            </view> -->
        </view>
        
        <!-- 底部安全区域 -->
        <view class="safe-area-bottom"></view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                username: '',
                password: '',
                isOk: false,
                showPassword: false,
                rememberPwd: false
            }
        },
        onLoad(e) {
            // 检查是否开启了记住密码
            const savedInfo = uni.getStorageSync('savedLoginInfo');
            if (savedInfo) {
                this.username = savedInfo.username || '';
                this.password = savedInfo.password || '';
                this.rememberPwd = true;
            }
            
            const { username, oldName } = e || {}
            if (username) {
                this.username = username
                uni.showToast({
                    title: '注册成功请登录',
                    icon: 'none',
                    duration: 2000
                });
            } else if (oldName) {
                this.username = oldName
                uni.showToast({
                    title: '登录过期请重新登录',
                    icon: 'none',
                    duration: 2000
                });
            }
            
            // 设置导航栏
            uni.setNavigationBarColor({
                frontColor: '#000000',
                backgroundColor: '#ffffff'
            });
        },
        methods: {
            clearUsername() {
                this.username = '';
            },
            togglePasswordVisibility() {
                this.showPassword = !this.showPassword;
            },
            toggleRememberPwd() {
                this.rememberPwd = !this.rememberPwd;
            },
            navigateToRegister() {
                uni.navigateTo({
                    url: '/pages-personal/register/index'
                });
            },
			navigateToResetPassword() {
				uni.navigateTo({
					url: '/pages-personal/resetPassword/index'
				});
			},
            navigateToLogin() {
                if (this.username.length === 0 || this.password.length === 0) {
                    uni.showToast({
                        title: '用户名或密码不能为空',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                
                // 显示加载中
                uni.showLoading({
                    title: '登录中...'
                });
                
                uni.request({
                    url: this.serverUrl + '/signIn/login', // 替换为你的登录接口地址
                    method: 'POST',
                    data: {
                        name: this.username,
                        pwd: this.password
                    },
                    success: (res) => {
                        this.isOk = false; // 隐藏错误提示
                        const { data, code, msg } = res.data
                        if (code === 200) {
                            // 保存用户信息
                            uni.setStorageSync('userInfo', {
                                userName: data.name,
                                imgUrl: data.imgurl,
                                token: data.token,
                                userId: data.id
                            });
                            
                            // 如果选择记住密码，保存登录信息
                            if (this.rememberPwd) {
                                uni.setStorageSync('savedLoginInfo', {
                                    username: this.username,
                                    password: this.password
                                });
                            } else {
                                uni.removeStorageSync('savedLoginInfo');
                            }
                            
                            uni.hideLoading();
                            uni.showToast({
                                title: '登录成功',
                                icon: 'success',
                                duration: 2000
                            });
                            uni.navigateTo({
                                url: '/pages/index/index'
                            });
                        } else {
                            uni.hideLoading();
                            uni.showToast({
                                title: msg || '登录失败',
                                icon: 'none',
                                duration: 2000
                            });
                            this.isOk = true; // 显示错误提示
                            this.password = ''; // 清空密码
                        }
                    },
                    fail: (err) => {
                        uni.hideLoading();
                        this.isOk = true;
                        this.password = ''; // 清空密码
                        uni.showToast({
                            title: '登录失败，请稍后再试',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            }
        }
    }
</script>

<style lang="scss">
    /* 容器适配全面屏设备 */
    .container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: #fff;
        position: relative;
    }
    
    /* 适配顶部安全区域 */
    .safe-area-top {
        height: 0;
        padding-top: constant(safe-area-inset-top); /* iOS 11.0 */
        padding-top: env(safe-area-inset-top); /* iOS 11.2+ */
    }
    
    /* 适配底部安全区域 */
    .safe-area-bottom {
        height: 0;
        padding-bottom: constant(safe-area-inset-bottom); /* iOS 11.0 */
        padding-bottom: env(safe-area-inset-bottom); /* iOS 11.2+ */
    }
    
    /* 顶部导航区域 */
    .header {
        display: flex;
        justify-content: flex-end;
        padding: 30rpx;
        
        .register-btn {
            color: #5d7df9;
            font-size: 32rpx;
            padding: 20rpx;
            /* 增加点击区域大小 */
            position: relative;
            
            &::after {
                content: "";
                position: absolute;
                top: -10rpx;
                left: -10rpx;
                right: -10rpx;
                bottom: -10rpx;
            }
        }
    }
    
    /* Logo区域 */
    .logo-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 40rpx 0;
        
        .logo-image {
            width: 160rpx;
            height: 160rpx;
            margin-bottom: 20rpx;
        }
        
        .app-title {
            font-size: 44rpx;
            font-weight: 600;
            color: #333;
        }
    }
    
    /* 表单容器 */
    .form-container {
        padding: 40rpx;
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .welcome-text {
            font-size: 48rpx;
            font-weight: 500;
            color: #333;
            margin-bottom: 50rpx;
        }
        
        .input-group {
            margin-bottom: 30rpx;
            
            .input-item {
                display: flex;
                align-items: center;
                background-color: #f5f6fa;
                border-radius: 50rpx;
                padding: 10rpx 30rpx;
                margin-bottom: 30rpx;
                height: 90rpx;
                
                .iconfont {
                    margin-right: 20rpx;
                    font-size: 40rpx;
                    color: #999;
                    /* 图标占位 */
                    &.icon-user:before {
                        content: "👤";
                    }
                    &.icon-lock:before {
                        content: "🔒";
                    }
                }
                
                .input-field {
                    flex: 1;
                    height: 90rpx;
                    font-size: 32rpx;
                    color: #333;
                }
                .password {
					position: relative;
					display: block;
					height: 100%;
					background: none;
					color: inherit;
					opacity: 1;
					font: inherit;
					line-height: inherit;
					letter-spacing: inherit;
					text-align: inherit;
					text-indent: inherit;
					text-transform: inherit;
					text-shadow: inherit;
					border:none;
				}
				.password:hover,:active,:focus {
					outline: none;
					background: none;
					color: inherit;
					border: none !important
				}
				
                .placeholder {
                    color: #999;
                }
                
                .clear-icon, .eye-icon {
                    padding: 10rpx 15rpx;
                    color: #999;
                    font-size: 40rpx;
                }
            }
        }
        
        /* 错误提示样式 */
        .error-tip {
            display: flex;
            align-items: center;
            margin-bottom: 20rpx;
            
            .error-icon {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 36rpx;
                height: 36rpx;
                border-radius: 50%;
                background-color: #ff5252;
                color: white;
                font-size: 24rpx;
                margin-right: 10rpx;
            }
            
            .error-text {
                color: #ff5252;
                font-size: 28rpx;
            }
        }
        
        /* 记住密码和忘记密码行 */
        .auxiliary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 60rpx;
            
            .remember-pwd {
                display: flex;
                align-items: center;
                font-size: 28rpx;
                color: #666;
                
                .checkbox {
                    width: 36rpx;
                    height: 36rpx;
                    border-radius: 6rpx;
                    border: 2rpx solid #ccc;
                    margin-right: 10rpx;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    
                    &.checked {
                        // 勾选呈现勾选状态
                        border-color: #5d7df9;
                        background-color: #5d7df9;

                        &::after {
                            content: "";
                            width: 12rpx;
                            height: 20rpx;
                            border-right: 4rpx solid #fff;
                            border-bottom: 4rpx solid #fff;
                            transform: rotate(45deg) translate(-2rpx, -2rpx);
                            position: absolute;
                        }
                    }
                }
            }
            
            .forgot-register {
                margin-right: 18rpx;
            }

            .forgot-password {
                font-size: 28rpx;
                color: #5d7df9;
            }
        }
        
        /* 登录按钮 */
        .login-btn {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 90rpx;
            background: linear-gradient(135deg, #6e8efb, #5d7df9);
            border-radius: 45rpx;
            color: white;
			width: 100%;
            font-size: 34rpx;
            font-weight: 500;
            box-shadow: 0 10rpx 20rpx rgba(93, 125, 249, 0.3);
            margin-bottom: 60rpx;
            
            &.button-hover {
                background: linear-gradient(135deg, #5d7df9, #4b6be6);
                transform: scale(0.98);
                opacity: 0.9;
            }
        }
        
        /* 其他登录方式 */
        .other-login-methods {
            margin-top: auto;
            
            .divider {
                display: flex;
                align-items: center;
                margin-bottom: 40rpx;
                
                .line {
                    flex: 1;
                    height: 1px;
                    background-color: #eee;
                }
                
                text {
                    padding: 0 20rpx;
                    color: #999;
                    font-size: 26rpx;
                }
            }
            
            .social-icons {
                display: flex;
                justify-content: center;
                
                .social-icon {
                    width: 80rpx;
                    height: 80rpx;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 0 30rpx;
                    
                    &.wechat {
                        background-color: #07c160;
                    }
                    
                    &.qq {
                        background-color: #12b7f5;
                    }
                    
                    &.weibo {
                        background-color: #e6162d;
                    }
                    
                    .iconfont {
                        color: #fff;
                        font-size: 40rpx;
                        
                        &.icon-wechat:before {
                            content: "W";
                        }
                        &.icon-qq:before {
                            content: "Q";
                        }
                        &.icon-weibo:before {
                            content: "微";
                        }
                    }
                }
            }
        }
    }
</style>
