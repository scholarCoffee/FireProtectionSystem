<template>
    <view class="container">
        <!-- 安全区域适配 -->
        <view class="safe-area-top"></view>
        
        <!-- 顶部区域 -->
        <view class="header">
            <view class="back-btn" @tap="navigateBack">
                <text class="iconfont icon-back">←</text>
            </view>
            <view class="page-title">重置密码</view>
        </view>
        
        <!-- 表单区域 -->
        <view class="form-container">
            <view class="instruction-text">请输入账号信息并设置新密码</view>
            <!-- 输入框区域 -->
            <view class="input-group">
                <view class="input-item">
                    <text class="iconfont icon-user">👤</text>
                    <input 
                        type="text" 
                        v-model="username" 
                        placeholder="用户名" 
                        class="input-field"
                        placeholder-class="placeholder" 
                        maxlength="30"
                    />
                </view>                
                <view class="input-item">
                    <text class="iconfont icon-lock">🔒</text>
                    <input 
                        :type="showPassword ? 'text' : 'password'" 
                        v-model="newPassword" 
                        placeholder="新密码" 
                        class="input-field password"
                        placeholder-class="placeholder"
                        maxlength="20"
                    />
                    <text class="eye-icon" @tap="togglePasswordVisibility">
                        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                    </text>
                </view>
                
                <view class="input-item">
                    <text class="iconfont icon-lock">🔒</text>
                    <input 
                        :type="showConfirmPassword ? 'text' : 'password'" 
                        v-model="confirmPassword" 
                        placeholder="确认新密码" 
                        class="input-field password"
                        placeholder-class="placeholder"
                        maxlength="20"
                        @confirm="resetPassword"
                    />
                    <text class="eye-icon" @tap="toggleConfirmPasswordVisibility">
                        {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
                    </text>
                </view>
            </view>
            
            <!-- 错误提示 -->
            <view class="error-tip" v-if="errorMessage">
                <text class="error-icon">!</text>
                <text class="error-text">{{errorMessage}}</text>
            </view>
            
            <!-- 密码规则提示 -->
            <view class="password-rules">
                <text>密码至少包含6个字符，建议使用字母、数字和符号的组合</text>
            </view>
            
            <!-- 提交按钮 -->
            <button class="reset-btn" @tap="resetPassword" hover-class="button-hover">
                重置密码
            </button>
        
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
                verificationCode: '',
                newPassword: '',
                confirmPassword: '',
                showPassword: false,
                showConfirmPassword: false,
                errorMessage: '',
                isSending: false,
                countdown: 60,
                sendBtnText: '获取验证码'
            }
        },
        onLoad(e) {
            // 如果从登录页面传入了用户名
            if (e && e.username) {
                this.username = e.username;
            }
            
            // 设置导航栏
            uni.setNavigationBarTitle({
                title: '重置密码'
            });
        },
        methods: {
            navigateBack() {
                uni.navigateTo({
                    url: '/pages/signIn/index'
                });
            },
            togglePasswordVisibility() {
                this.showPassword = !this.showPassword;
            },
            toggleConfirmPasswordVisibility() {
                this.showConfirmPassword = !this.showConfirmPassword;
            },
            // 发送验证码
            // sendVerificationCode() {
            //     if (!this.username) {
            //         this.errorMessage = '请输入用户名/手机号/邮箱';
            //         return;
            //     }
                
            //     if (this.isSending) return;
                
            //     this.isSending = true;
            //     this.countdown = 60;
            //     this.sendBtnText = `${this.countdown}秒`;
                
            //     // 开始倒计时
            //     const timer = setInterval(() => {
            //         this.countdown--;
            //         this.sendBtnText = `${this.countdown}秒`;
                    
            //         if (this.countdown <= 0) {
            //             clearInterval(timer);
            //             this.isSending = false;
            //             this.sendBtnText = '重新获取';
            //         }
            //     }, 1000);
                
            //     // 发送验证码请求
            //     uni.request({
            //         url: this.serverUrl + '/reset/sendCode',
            //         method: 'POST',
            //         data: {
            //             account: this.username
            //         },
            //         success: (res) => {
            //             if (res.data.code === 200) {
            //                 uni.showToast({
            //                     title: '验证码已发送',
            //                     icon: 'success'
            //                 });
            //             } else {
            //                 this.errorMessage = res.data.message || '验证码发送失败';
            //                 // 如果发送失败，重置倒计时
            //                 clearInterval(timer);
            //                 this.isSending = false;
            //                 this.sendBtnText = '重新获取';
            //             }
            //         },
            //         fail: () => {
            //             this.errorMessage = '网络错误，请稍后再试';
            //             // 如果发送失败，重置倒计时
            //             clearInterval(timer);
            //             this.isSending = false;
            //             this.sendBtnText = '重新获取';
            //         }
            //     });
            // },
            // 重置密码
            resetPassword() {
                // 清除之前的错误信息
                this.errorMessage = '';
                
                // 验证输入
                if (!this.username) {
                    this.errorMessage = '请输入用户名';
                    return;
                }
                if (!this.newPassword) {
                    this.errorMessage = '请输入新密码';
                    return;
                }
                if (this.newPassword.length < 6) {
                    this.errorMessage = '密码长度不能少于6个字符';
                    return;
                }
                if (this.newPassword !== this.confirmPassword) {
                    this.errorMessage = '两次输入的密码不一致';
                    return;
                }
                
                // 显示加载
                uni.showLoading({
                    title: '处理中...'
                });
                
                // 发送重置密码请求
                uni.request({
                    url: this.serverUrl + '/signUp/updatePwd',
                    method: 'POST',
                    data: {
                        name: this.username,
                        pwd: this.newPassword
                    },
                    success: (res) => {
                        uni.hideLoading();
                        if (res.data.code === 200) {
                            uni.showToast({
                                title: '密码重置成功',
                                icon: 'success',
                                duration: 2000
                            });
                            
                            // 2秒后返回登录页
                            setTimeout(() => {
                                uni.navigateTo({
                                    url: `/pages/signIn/index?username=${this.username}`
                                });
                            }, 2000);
                        } else {
                            this.errorMessage = res.data.message || '密码重置失败';
                        }
                    },
                    fail: () => {
                        uni.hideLoading();
                        this.errorMessage = '网络错误，请稍后再试';
                    }
                });
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
        align-items: center;
        padding: 20rpx 30rpx;
        
        .back-btn {
            width: 60rpx;
            height: 60rpx;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-right: 20rpx;
            
            .icon-back {
                font-size: 40rpx;
                color: #333;
            }
        }
        
        .page-title {
            font-size: 36rpx;
            font-weight: 500;
            color: #333;
        }
    }
    
    /* 表单容器 */
    .form-container {
        padding: 40rpx;
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .instruction-text {
            font-size: 32rpx;
            color: #666;
            margin-bottom: 40rpx;
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
                
                &.verification-code {
                    padding-right: 10rpx;
                }
                
                .iconfont {
                    margin-right: 20rpx;
                    font-size: 40rpx;
                    color: #999;
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
                
                .password:hover,:active,:focus {
					outline: none;
					background: none;
					color: inherit;
					border: none !important
				}

                .placeholder {
                    color: #999;
                }
                
                .eye-icon {
                    padding: 10rpx 15rpx;
                    color: #999;
                    font-size: 40rpx;
                }
                
                .send-code-btn {
                    height: 70rpx;
                    line-height: 70rpx;
                    font-size: 26rpx;
                    padding: 0 20rpx;
                    background: #5d7df9;
                    border-radius: 35rpx;
                    color: #fff;
                    margin: 0;
                    
                    &[disabled] {
                        background: #cccccc;
                        color: #fff;
                    }
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
        
        /* 密码规则提示 */
        .password-rules {
            padding: 10rpx 0 40rpx;
            
            text {
                font-size: 24rpx;
                color: #999;
                line-height: 1.6;
            }
        }
        
        /* 重置按钮 */
        .reset-btn {
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
            margin-bottom: 40rpx;
            
            &.button-hover {
                background: linear-gradient(135deg, #5d7df9, #4b6be6);
                transform: scale(0.98);
                opacity: 0.9;
            }
        }
        
        /* 返回登录链接 */
        .back-to-login {
            text-align: center;
            margin-top: 20rpx;
            
            text {
                font-size: 28rpx;
                color: #5d7df9;
                padding: 20rpx;
            }
        }
    }
</style>