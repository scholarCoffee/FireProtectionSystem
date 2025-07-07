<template>
    <view class="container">
        <!-- 安全区域适配 -->
        <view class="safe-area-top"></view>
        
        <!-- 顶部区域 -->
        <view class="header">
            <view class="back-btn" @tap="navigateBack">
                <text class="iconfont icon-back">←</text>
            </view>
        </view>
        
        <!-- Logo区域 -->
        <view class="logo-area">
            <image class="logo-image" src="/static/fire.png" mode="aspectFit"></image>
        </view>
        
        <!-- 表单区域 -->
        <view class="form-container">
            <view class="welcome-text">创建账号</view>
            
            <!-- 输入框区域 -->
            <view class="input-group">
                <view class="input-item">
                    <text class="iconfont icon-user">👤</text>
                    <input 
                        type="text" 
                        v-model="userName" 
                        placeholder="请输入用户名" 
                        class="input-field"
                        placeholder-class="placeholder" 
                        maxlength="20"
                        @blur="onInputUser"
                    />
                    <!-- <view class="status-icon" v-if="userName">
                        <text class="error" v-if="isUserEmploy">已占用</text>
                        <text class="iconfont icon-check success" v-else-if="isUser">✓</text>
                    </view> -->
                </view>
                
                <!-- <view class="input-item">
                    <text class="iconfont icon-email">✉️</text>
                    <input 
                        type="text" 
                        v-model="email" 
                        placeholder="请输入邮箱" 
                        class="input-field"
                        placeholder-class="placeholder"
                        maxlength="30" 
                        @blur="onInupuEmails"
                    />
                    <view class="status-icon" v-if="email">
                        <text class="error" v-if="isInvalid">邮箱无效</text>
                        <text class="error" v-else-if="isEmailEmploy">已占用</text>
                        <text class="iconfont icon-check success" v-else-if="isEmail">✓</text>
                    </view>
                </view> -->
                
                <view class="input-item">
                    <text class="iconfont icon-lock">🔒</text>
                    <input 
                        :type="type" 
                        v-model="password" 
                        placeholder="设置密码" 
                        class="input-field password"
                        placeholder-class="placeholder"
                        maxlength="20"
                        @input="onInputPassword"
                    />
                    <text class="eye-icon" @tap="looks">
                        {{ isLook ? '👁️' : '👁️‍🗨️' }}
                    </text>
                </view>
            </view>
            
            <!-- 密码规则提示 -->
            <view class="password-rules">
                <text>密码至少包含6个字符，建议使用字母、数字和符号的组合</text>
            </view>
            
            <!-- 注册按钮 -->
            <button 
                class="register-btn" 
                :class="{ 'register-btn-active': isSubmitOk }"
                :disabled="!isSubmitOk" 
                @tap="register" 
                hover-class="button-hover"
            >
                注册
            </button>
            
            <!-- 已有账号 -->
            <view class="has-account" @tap="navigateToLogin">
                <text>已有账号？立即登录</text>
            </view>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="safe-area-bottom"></view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                type: 'password', // 密码输入框类型
                isUser: false, // 用户名是否有效
                isEmail: false, // 邮箱是否有效
                email: '', // 邮箱输入值
                userName: '', // 用户名输入值
                password: '', // 密码输入值
                isLook: false, // 密码是否可见
                isInvalid: false, // 邮箱是否无效
                isUserEmploy: false, // 用户名是否已占用
                isEmailEmploy: false, // 邮箱是否已占用
            };
        },
        computed: {
            isSubmitOk() {
                // 注册按钮是否可用的计算属性
                return this.isUser && this.password.length >= 6;
            }
        },
        onLoad() {
            // 设置导航栏
            uni.setNavigationBarTitle({
                title: '注册账号'
            });
        },
        methods: {
            looks() {
                this.isLook = !this.isLook; // 切换密码可见状态
                this.type = this.isLook ? 'text' : 'password'; // 根据状态设置输入框类型
            },
            onInupuEmails(e) {
                // 邮箱验证逻辑
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 邮箱正则表达式    
                if (this.email.length > 0 && emailPattern.test(this.email)) {
                    this.isInvalid = false; // 邮箱无效提示隐藏
                    // 后端验证邮箱是否已被占用
                    this.matchEmail(); // 调用邮箱验证方法
                } else if (this.email.length > 0) {
                    this.isInvalid = true; // 显示邮箱无效提示
                    this.isEmail = false; // 邮箱无效
                    this.isEmailEmploy = false; // 隐藏邮箱已占用提示
                } else {
                    this.isInvalid = false;
                    this.isEmail = false; 
                    this.isEmailEmploy = false;
                }
            },
            matchEmail() {
                uni.showLoading({ title: '验证中...' });
                
                uni.request({
                    url: this.serverUrl + '/signUp/judge', // 替换为你的登录接口地址
                    method: 'POST',
                    data: {
                        data: this.email,
                        type: 'email'
                    },
                    success: (res) => {
                        uni.hideLoading();
                        const { data, code } = res.data
                        if (code === 200) {
                            // 表示邮箱已存在
                            if (data > 0) {
                                this.isEmail = false; // 邮箱无效
                                this.isEmailEmploy = true; // 显示邮箱已占用提示
                            } else {
                                this.isEmail = true; // 邮箱有效
                                this.isEmailEmploy = false; // 隐藏邮箱已占用提示
                            }
                        }
                        // 表示系统错误
                        else {
                            uni.showToast({
                                title: '系统出现错误',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: () => {
                        uni.hideLoading();
                        uni.showToast({
                            title: '网络错误，请稍后再试',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            onInputUser(e) {
                // 用户名验证逻辑
                if (this.userName.length > 0) {
                    uni.showLoading({ title: '验证中...' });
                    
                    uni.request({
                        url: this.serverUrl + '/signUp/judge', // 替换为你的接口地址
                        method: 'POST',
                        data: {
                            data: this.userName,
                            type: 'name'
                        },
                        success: (res) => {
                            uni.hideLoading();
                            const { data, code } = res.data
                            // 表示用户名已存在
                            if (code === 200) {
                                if (data > 0) {
                                    uni.showToast({
                                        title: '用户名已被占用',
                                        icon: 'none',
                                        duration: 2000
                                    });
                                    this.isUser = false; // 用户名无效
                                    this.isUserEmploy = true; // 显示用户名已占用提示
                                } else {
                                    this.isUser = true; // 用户名有效
                                    this.isUserEmploy = false; // 隐藏用户名已占用提示
                                }
                            }
                            // 表示系统错误
                            else {
                                uni.showToast({
                                    title: '系统出现错误',
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                        },
                        fail: () => {
                            uni.hideLoading();
                            uni.showToast({
                                title: '网络错误，请稍后再试',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    })
                } else {
                    this.isUser = false; // 用户名无效
                    this.isUserEmploy = false; // 隐藏用户名已占用提示
                }
            },
            onInputPassword(e) {
                // 密码简单验证
                this.password = e.target.value;
            },
            navigateBack() {
                uni.navigateBack();
            },
            navigateToLogin() {
                uni.navigateTo({
                    url: '/pages/signIn/index'
                });
            },
            register() {
                // 注册逻辑
                if (!this.isSubmitOk) {
                    uni.showToast({
                        title: '请填写正确的注册信息',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                
                // 显示加载中
                uni.showLoading({
                    title: '注册中...'
                });
                
                // 调用API进行注册
                uni.request({
                    url: this.serverUrl + '/signUp/register', // 替换为你的注册接口地址
                    method: 'POST',
                    data: {
                        name: this.userName,
                        mail: this.email,
                        pwd: this.password
                    },
                    success: (res) => {
                        uni.hideLoading();
                        const { code } = res.data
                        
                        if (code === 200) {
                            uni.showToast({
                                title: '注册成功',
                                icon: 'success',
                                duration: 2000
                            });
                            
                            // 成功后延迟跳转到登录页
                            setTimeout(() => {
                                uni.navigateTo({
                                    url: '/pages/signIn/index?username=' + this.userName
                                });
                            }, 1500);
                        } else {
                            uni.showToast({
                                title: '注册失败，请稍后再试',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: () => {
                        uni.hideLoading();
                        uni.showToast({
                            title: '网络错误，请稍后再试',
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
    
    /* Logo区域 */
    .logo-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 30rpx 0;
        
        .logo-image {
            width: 140rpx;
            height: 140rpx;
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
                    font-weight: 400;
                }
                
                .eye-icon {
                    padding: 10rpx 15rpx;
                    color: #999;
                    font-size: 40rpx;
                }
                
                .status-icon {
                    display: flex;
                    align-items: center;
                    
                    .success {
                        color: #07c160;
                        font-size: 36rpx;
                        font-weight: bold;
                    }
                    
                    .error {
                        color: #ff5252;
                        font-size: 24rpx;
                    }
                }
            }
        }
        
        /* 密码规则提示 */
        .password-rules {
            padding: 0 10rpx 40rpx;
            
            text {
                font-size: 24rpx;
                color: #999;
                line-height: 1.6;
            }
        }
        
        /* 注册按钮 */
        .register-btn {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 90rpx;
            background: #cccccc;
            border-radius: 45rpx;
            color: white;
            font-size: 34rpx;
			width: 100%;
            font-weight: 500;
            margin-bottom: 40rpx;
            
            &.register-btn-active {
                background: linear-gradient(135deg, #6e8efb, #5d7df9);
                box-shadow: 0 10rpx 20rpx rgba(93, 125, 249, 0.3);
            }
            
            &.button-hover {
                background: linear-gradient(135deg, #5d7df9, #4b6be6);
                transform: scale(0.98);
                opacity: 0.9;
            }
        }
        
        /* 已有账号链接 */
        .has-account {
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