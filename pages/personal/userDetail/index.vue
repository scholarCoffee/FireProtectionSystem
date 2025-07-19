<template>
    <view class="content">
        <!-- 如果用户未登录，显示登录提示和按钮 -->
        <view v-if="!isLoggedIn" class="login-prompt">
            <view class="login-container">
                <image src="/static/icons/person/person.png" class="login-avatar"></image>
                <text class="login-title">欢迎使用消防作战终端</text>
                <text class="login-desc">登录后即可管理个人信息</text>
                <button class="login-button" open-type="getUserInfo" @getuserinfo="onGetUserInfo">一键登录</button>
            </view>
        </view>
        <!-- 如果用户已登录，显示个人信息页面 -->
        <view v-else class="main">
            <view class="column heads">
                <view class="row" @tap="onChosenImage" >
                    <view class="title">头像：</view>
                    <view class="cont" >
                        <image :src="userInfo.avatarUrl" class="user-img"></image>
                    </view>
                    <view class="more" >
                        <image src="/static/icons/common/arrow-right.png" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="column">
                <view class="row" @tap="modifyUserInfo('nickName', '昵称', userInfo.nickName)">
                    <view class="title">昵称：</view>
                    <view class="cont">{{ userInfo.nickName }}</view>
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
    import { clearUnreadCount } from '@/commons/js/utils.js';
    export default {
        data() {
            return {
                userInfo: {
                    nickName: '', 
                    avatarUrl: '',
                    permissionStatus: 1,
                    id: ''
                },
                isLoggedIn: false, // 用户是否已登录
                showModifyModal: false, // 是否显示修改弹窗
                modifyValue: '', // 修改的值
                modifyType: '', // 修改类型
                modifyTitle: '', // 修改标题
                tempFilePaths: ''
            }
        },
        onShow() {
            this.getStorages(); // 获取本地存储的用户信息
        },
        methods: {
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { id, nickName, avatarUrl } = userInfo;
                    this.userInfo = {
                        id,
                        avatarUrl,
                        nickName
                    }
                    this.isLoggedIn = true; // 用户已登录
                } else {
                    this.isLoggedIn = false; // 用户未登录
                } 
            },
            onQuitLogin() {
                // 清楚缓存
                uni.removeStorageSync('userInfo')
                this.isLoggedIn = false; // 用户已退出登录
                // 清除未读消息数
                clearUnreadCount();
            },
            updateUserInfoToServer(data, successMsg = '更新成功') {
                uni.request({
                    url: this.serverUrl + '/user/update',
                    method: 'POST',
                    data,
                    success: (res) => {
                        if (res.data && res.data.code === 200) {
                            uni.showToast({
                                title: successMsg,
                                icon: 'success',
                                duration: 1200
                            });
                        } else {
                            uni.showToast({
                                title: res.data.msg || '后端同步失败',
                                icon: 'none',
                                duration: 1500
                            });
                        }
                    },
                    fail: () => {
                        uni.showToast({
                            title: '网络错误，未同步后端',
                            icon: 'none',
                            duration: 1500
                        });
                    }
                });
            },
            onChosenImage() {
                uni.chooseImage({
                    count: 1,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album'],
                    success: (res) => {
                        this.tempFilePaths = res.tempFilePaths.shift();
                        uni.uploadFile({
                            url: this.serverUrl + '/files/upload', // 替换为你的上传接口地址
                            filePath: this.tempFilePaths,
                            name: 'file',
                            fileType: 'image',
                            formData: {
                                id: this.userInfo.id
                            },
                            success: (res) => {
                                const backImg = JSON.parse(res.data).data;
                                const oldUserInfo = uni.getStorageSync('userInfo');
                                const newUserInfo = { ...oldUserInfo, avatarUrl: backImg };
                                uni.setStorageSync('userInfo', newUserInfo);
                                this.userInfo.avatarUrl = backImg;
                                this.tempFilePaths = '';
                                // 同步更新后端头像
                                this.updateUserInfoToServer(
                                    { id: this.userInfo.id, avatarUrl: backImg, type: 'avatarUrl' },
                                    '头像已同步'
                                );
                            },
                            fail: (err) => {
                                uni.showToast({
                                    title: '头像修改失败:' + err.errMsg,
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                        });
                    }
                });
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
                if (this.modifyType === 'nickName' && value.length > 20) {
                    uni.showToast({
                        title: '昵称不能超过20个字符',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                uni.showLoading({ title: '更新中...' });
                // 更新本地数据和本地存储
                if (this.modifyType === 'nickName') {
                    this.userInfo.nickName = value;
                    const userInfo = uni.getStorageSync('userInfo');
                    if (userInfo) {
                        userInfo.nickName = value;
                        uni.setStorageSync('userInfo', userInfo);
                    }
                    // 同步昵称到后端
                    this.updateUserInfoToServer(
                        { id: this.userInfo.id, nickName: value, type: 'nickName' },
                        '昵称已同步'
                    );
                }
                this.closeModal();
                uni.hideLoading();
                uni.showToast({
                    title: '更新成功',
                    icon: 'success',
                    duration: 1500
                });
            },
            // 微信一键登录新版，强制获取头像昵称
            async onGetUserInfo(e) {
                if (!e.detail || !e.detail.userInfo) {
                    uni.showToast({
                        title: '需要授权获取头像昵称',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                uni.showLoading({ title: '登录中...' });
                // 先获取微信登录code
                uni.login({
                    provider: 'weixin',
                    success: (loginRes) => {
                        const code = loginRes.code;
                        const { nickName, avatarUrl } = e.detail.userInfo;
                        // 你可以把 code、encryptedData、iv、userInfo 一起发给后端
                        // 这里只做本地存储和状态更新
                        const userInfo = {
                            code: code,
                            nickName: nickName,
                            avatarUrl: avatarUrl,
                            encryptedData: e.detail.encryptedData,
                            permissionStatus: 1,
                            id: e.detail.iv
                        };
                        uni.setStorageSync('userInfo', userInfo);
                        this.userInfo.nickName = nickName;
                        this.userInfo.avatarUrl = avatarUrl;
                        this.isLoggedIn = true;
                        uni.hideLoading();
                        uni.showToast({
                            title: '登录成功',
                            icon: 'success',
                            duration: 1500
                        });
                        // 调用接口存储用户信息
                        uni.request({
                            url: this.serverUrl + '/user/update', // 替换为你的后端登录接口
                            method: 'POST',
                            data: {
                                nickName: nickName,
                                avatarUrl: avatarUrl,
                                code: code,
                                encryptedData: e.detail.encryptedData,
                                permissionStatus: 1, 
                                id: e.detail.iv,
                                signature: e.detail.signature
                            },
                            success: (res) => {
                            
                            },
                            fail: () => {
                               
                            }
                        });
                    },
                    fail: () => {
                        uni.hideLoading();
                        uni.showToast({
                            title: '微信登录失败',
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
/* 内容区下移，避免被导航栏遮挡 */
.page-content {
  padding-top: 0;
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