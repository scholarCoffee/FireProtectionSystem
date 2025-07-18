<template>
    <view class="content">
        <!-- 顶部导航栏 -->
        <!-- <view class="nav-bar">
            <view class="nav-left" v-if="showBack" @click="goBack">
                <image src="/static/icons/common/back.png" class="nav-back-icon" />
            </view>
            <view class="nav-title">个人信息</view>
            <view class="nav-right"></view>
        </view> -->
        <!-- 如果用户未登录，显示登录提示和按钮 -->
        <view v-if="!isLoggedIn" class="login-prompt">
            <view class="login-container">
                <image src="/static/icons/person/person.png" class="login-avatar"></image>
                <text class="login-title">欢迎使用消防作战终端</text>
                <text class="login-desc">登录后即可管理个人信息</text>
                <button class="login-button" @tap="wxLogin">一键登录</button>
            </view>
        </view>
        <!-- 如果用户已登录，显示个人信息页面 -->
        <view v-else class="main">
            <view class="column heads">
                <view class="row" @tap="onChosenImage" >
                    <view class="title">头像：</view>
                    <view class="cont" >
                        <image :src="userInfo.avatar" class="user-img"></image>
                    </view>
                    <view class="more" >
                        <image src="/static/icons/common/arrow-right.png" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="column">
                <view class="row" @tap="modifyUserInfo('markname', '昵称', userInfo.markname)">
                    <view class="title">昵称：</view>
                    <view class="cont">{{ userInfo.markname }}</view>
                    <view class="more">
                        <image src="/static/icons/common/arrow-right.png" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="bt2" @tap="onQuitLogin">退出登录</view>
        </view>
        
        <!-- 昵称修改弹窗 -->
        <view v-if="showModifyModal" class="modal-overlay" @tap="closeModal">
            <view class="modal-content" @tap.stop>
                <view class="modal-header">
                    <text class="modal-title">{{ modifyTitle }}</text>
                </view>
                <view class="modal-body">
                    <input 
                        type="text" 
                        v-model="modifyValue" 
                        class="modify-input"
                        placeholder="请输入修改内容"
                        maxlength="20"
                        focus
                    />
                </view>
                <view class="modal-footer">
                    <button class="modal-btn cancel-btn" @tap="closeModal">取消</button>
                    <button class="modal-btn confirm-btn" @tap="confirmModify">确认</button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                userInfo: {
                    uid: '', // 用户ID
                    token: '', // 用户token
                    userName: '', // 用户名
                    markname: '', // 昵称
                    avatar: '' // 头像
                },
                isLoggedIn: false, // 用户是否已登录
                showModifyModal: false, // 是否显示修改弹窗
                modifyValue: '', // 修改的值
                modifyType: '', // 修改类型
                modifyTitle: '', // 修改标题
                showBack: false, // 是否显示返回按钮，适配小程序
            }
        },
        onLoad(data) {
            this.getStorages(); // 获取本地存储的用户信息
        },
        onShow() {
            // #ifdef MP
            const pages = getCurrentPages();
            this.showBack = pages.length > 1;
            // #endif
        },
        methods: {
            goBack() {
                uni.navigateBack();
            },
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { userId, token, userName } = userInfo;
                    this.userInfo = {
                        uid: userId,
                        token: token,
                        userName: userName,
                        markname: '',
                        avatar: ''
                    }
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
            onQuitLogin() {
                // 清楚缓存
                uni.removeStorageSync('userInfo')
                this.isLoggedIn = false; // 用户已退出登录
            },
            onChosenImage() {
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
            // 修改用户信息
            modifyUserInfo(type, title, currentValue) {
                this.modifyType = type;
                this.modifyTitle = '修改' + title;
                this.modifyValue = currentValue || '';
                this.showModifyModal = true;
            },
            
            // 关闭弹窗
            closeModal() {
                this.showModifyModal = false;
                this.modifyValue = '';
                this.modifyType = '';
                this.modifyTitle = '';
            },
            
            // 确认修改
            confirmModify() {
                const value = this.modifyValue.trim();
                if (!value) {
                    uni.showToast({
                        title: '请输入内容',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                
                if (this.modifyType === 'markname' && value.length > 20) {
                    uni.showToast({
                        title: '昵称不能超过20个字符',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                
                // 模拟更新用户信息
                uni.showLoading({
                    title: '更新中...'
                });
                
                setTimeout(() => {
                    // 更新本地数据
                    if (this.modifyType === 'markname') {
                        this.userInfo.markname = value;
                        // 更新本地存储
                        const userInfo = uni.getStorageSync('userInfo');
                        if (userInfo) {
                            userInfo.markname = value;
                            uni.setStorageSync('userInfo', userInfo);
                        }
                    }
                    
                    this.closeModal();
                    uni.hideLoading();
                    uni.showToast({
                        title: '更新成功',
                        icon: 'success',
                        duration: 1500
                    });
                }, 1000);
            },
            // 微信一键登录
            wxLogin() {
                uni.showLoading({
                    title: '登录中...'
                });
                
                // 模拟登录过程
                setTimeout(() => {
                    // 生成假数据
                    const mockUserInfo = {
                        userId: 'user_' + Date.now(),
                        token: 'token_' + Math.random().toString(36).substr(2, 9),
                        userName: '测试用户',
                        imgUrl: '/static/icons/chat/person-avatar.png',
                        openId: 'openid_' + Math.random().toString(36).substr(2, 15),
                        unionId: 'unionid_' + Math.random().toString(36).substr(2, 15)
                    };
                    
                    // 保存用户信息到本地存储
                    uni.setStorageSync('userInfo', mockUserInfo);
                    
                    // 更新组件状态
                    this.uid = mockUserInfo.userId;
                    this.token = mockUserInfo.token;
                    this.myname = mockUserInfo.userName;
                    this.isLoggedIn = true;
                    
                    // 获取用户信息
                    this.getUser();
                    
                    uni.hideLoading();
                    uni.showToast({
                        title: '登录成功',
                        icon: 'success',
                        duration: 1500
                    });
                }, 1500);
            }
        }
    }
</script>

<style lang="scss">
.content {
    background-color: #f8f8f8;
    min-height: 100vh;
}
/* 顶部导航栏样式 */
.nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    z-index: 100;
    padding-top: var(--status-bar-height, 0); /* 适配小程序 */
}
.nav-left, .nav-right {
    width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.nav-title {
    flex: 1;
    text-align: center;
    font-size: 17px;
    font-weight: bold;
    color: #222;
}
.nav-back-icon {
    width: 22px;
    height: 22px;
}
/* 内容区下移，避免被导航栏遮挡 */
.page-content {
  margin-top: 44px;
  padding-top: var(--status-bar-height, 0);
}
.main, .login-prompt, .login-container {
  margin-top: 0;
}

.login-prompt {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: linear-gradient(135deg, hsla(0, 0%, 100%, .95) 0%, #e5e5e5 100%);
}

.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60rpx 40rpx;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10rpx);
    max-width: 600rpx;
    width: 90%;
}

.login-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    margin-bottom: 30rpx;
    border: 4rpx solid #fff;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.login-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
    text-align: center;
}

.login-desc {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 40rpx;
    text-align: center;
    line-height: 1.5;
}

.login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 88rpx;
    background: #07c160;
    color: #fff;
    border: none;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: 500;
    box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.3);
    transition: all 0.3s ease;
    
    &:active {
        transform: translateY(2rpx);
        box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.3);
    }
}

.wechat-icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 16rpx;
}

.prompt-text {
    font-size: 30rpx;
    color: $uni-text-color;
    margin-bottom: 20rpx;
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

// 弹窗样式
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    width: 80%;
    max-width: 600rpx;
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
    padding: 30rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
}

.modal-body {
    padding: 30rpx;
}

.modify-input {
    width: 100%;
    height: 80rpx;
    padding: 0 20rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 8rpx;
    font-size: 28rpx;
    color: #333;
    background: #fafafa;
    box-sizing: border-box;
    
    &:focus {
        border-color: #07c160;
        background: #fff;
    }
}

.modal-footer {
    display: flex;
}

.modal-btn {
    flex: 1;
    height: 88rpx;
    border: none;
    font-size: 30rpx;
    font-weight: 500;
    background: transparent;
    
    &.cancel-btn {
        color: #666;
        &:active {
            background: #f5f5f5;
        }
    }
    
    &.confirm-btn {
        color: #07c160;
        
        &:active {
            background: #f0f9f0;
        }
    }
}
</style>