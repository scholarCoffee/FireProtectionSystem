<template>
    <view class="content">
        <!-- 如果用户未登录，显示登录提示和按钮 -->
        <view v-if="!isLoggedIn" class="login-prompt">
            <view class="login-container">
                <image :src="serverUrl + '/static/icons/person/person.png'" class="login-avatar"></image>
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
                        <image :src="serverUrl + '/static/icons/common/right.png'" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="column">
                <view class="row" @tap="modifyUserInfo('nickName', '昵称', userInfo.nickName)">
                    <view class="title">昵称：</view>
                    <view class="cont">{{ userInfo.nickName }}</view>
                    <view class="more">
                        <image :src="serverUrl + '/static/icons/common/right.png'" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            <view class="column">
                <view class="row">
                    <view class="title">手机：</view>
                    <view class="cont">
                        <text v-if="userInfo.phone" class="phone-text">{{ formatPhone(userInfo.phone) }}</text>
                        <button v-else open-type="getPhoneNumber" @getphonenumber="onWechatPhoneResult" class="hidden-phone-btn">点击绑定手机号</button>
                    </view>
                    <view class="more">
                        <image :src="serverUrl + '/static/icons/common/right.png'" mode="aspectFit"></image>
                    </view>
                </view>
            </view>
            
            <!-- 管理后台入口 -->
            <view class="column settings-column">
                <view class="row settings-row" @tap="goToDataManagement">
                    <view class="settings-content">
                        <view class="settings-icon-wrapper">
                            <image :src= "serverUrl + '/static/icons/person/settings.png'" mode="aspectFit" class="settings-icon"></image>
                        </view>
                        <text class="settings-text">设置</text>
                    </view>
                    <view class="more">
                        <image :src="serverUrl + '/static/icons/common/right.png'" mode="aspectFit"></image>
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
                    permissionStatus: 0,
                    id: '',
                    phone: ''
                },
                isLoggedIn: false, // 用户是否已登录
                serverUrl: 'http://172.20.10.2:3000',
                showModifyModal: false, // 是否显示修改弹窗
                modifyValue: '', // 修改的值
                modifyType: '', // 修改类型
                modifyTitle: '', // 修改标题
                tempFilePaths: '',
            }
        },
        onShow() {
            // #ifndef MP-WEIXIN
            // 非微信小程序：生成假数据
            if (!uni.getStorageSync('userInfo')) {
                const mockUserInfo = {
                    id: 'o782m7VVE2mElMJV18aNxzYQaxts',
                };
                // 根据id
                uni.request({
                    url: this.serverUrl + '/user/getById',
                    method: 'POST',
                    data: {
                        id: mockUserInfo.id
                    },
                    success: (res) => {
                        if (res.data && res.data.code === 200) {
                            mockUserInfo = res.data.data;
                            uni.setStorageSync('userInfo', mockUserInfo);
                        }
                    }
                });
            }
            // #endif
            this.getStorages(); // 获取本地存储的用户信息
        },
        methods: {
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { id, nickName, avatarUrl, phone, permissionStatus } = userInfo;
                    this.userInfo = {
                        id,
                        avatarUrl,
                        nickName,
                        phone,
                        permissionStatus: permissionStatus || 0
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
                                id: this.userInfo.id,
                                url: '/uploadImg/userImg',
                                name: 'userImg_' + this.userInfo.id + Math.ceil(Math.random()*10),
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
            async onGetUserInfo(e) {
                if (!e.detail?.userInfo) {
                    uni.showToast({
                        title: '需要授权获取头像昵称',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }

                uni.showLoading({ title: '登录中...' });
                
                try {
                    // 1. 获取微信登录code
                    const loginRes = await new Promise((resolve, reject) => {
                        uni.login({
                            provider: 'weixin',
                            success: resolve,
                            fail: reject
                        });
                    });

                    const { code } = loginRes;
                    const { nickName, avatarUrl } = e.detail.userInfo;

                    // 2. 仅将必要信息传给后端（依赖后端通过code获取openid）
                    const res = await new Promise((resolve, reject) => {
                        uni.request({
                            url: this.serverUrl + '/user/loginOrUpdate', // 后端统一接口：登录或更新
                            method: 'POST',
                            data: {
                                code, // 关键：用于后端获取openid
                                nickName,
                                avatarUrl,
                                encryptedData: e.detail.encryptedData,
                                signature: e.detail.signature
                            },
                            success: resolve,
                            fail: reject
                        });
                    });

                    if (res.data?.code === 200 && res.data.data) {
                        const serverUser = res.data.data;
                        // 3. 存储后端返回的用户信息（包含唯一id）
                        const userInfo = {
                            id: serverUser.id, // 后端返回的唯一标识
                            nickName: serverUser.nickName || nickName,
                            avatarUrl: serverUser.avatarUrl || avatarUrl,
                            permissionStatus: serverUser.permissionStatus || 1
                        };
                        uni.setStorageSync('userInfo', userInfo);
                        
                        // 更新页面数据
                        this.userInfo = { ...this.userInfo, ...userInfo };
                        this.isLoggedIn = true;
                        
                        uni.showToast({ title: '登录成功', icon: 'success' });
                    } else {
                        uni.showToast({ title: '登录失败', icon: 'none' });
                    }
                } catch (err) {
                    console.error('登录异常:', err);
                    uni.showToast({ title: '登录失败', icon: 'none' });
                } finally {
                    uni.hideLoading();
                }
            },
            
            // 处理微信返回的手机号信息
            onWechatPhoneResult(e) {
                const { encryptedData, iv, errMsg } = e.detail;
                console.log( encryptedData, iv, errMsg)
                // 处理"无权限"错误
                if (errMsg === 'getPhoneNumber:fail no permission') {
                    uni.showModal({
                        title: '授权失败',
                        content: '请点击"点击绑定手机号"按钮，并在弹窗中选择"允许"以完成绑定',
                        showCancel: false,
                        success: () => {
                            // 重新显示按钮，让用户再次尝试
                            this.$forceUpdate(); // 强制刷新视图，确保按钮可见
                        }
                    });
                    return;
                }
                
                // 处理用户拒绝授权
                if (errMsg.includes('fail user deny')) {
                    uni.showToast({
                        title: '需要授权才能绑定手机号',
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }
                
                // 获取登录凭证code
                uni.showLoading({ title: '绑定中...' });
                uni.login({
                    provider: 'weixin',
                    success: (loginRes) => {
                        if (loginRes.code) {
                            // 调用后端接口解密手机号
                            uni.request({
                                url: this.serverUrl + '/whitelistUserService/getPhoneNumber',
                                method: 'POST',
                                data: {
                                    code: loginRes.code,
                                    encryptedData,
                                    iv,
                                    userId: this.userInfo.id
                                },
                                success: (res) => {
                                    uni.hideLoading();
                                    if (res.data && res.data.code === 200) {
                                        uni.showToast({
                                            title: '手机号绑定成功',
                                            icon: 'success',
                                            duration: 2000
                                        });
                                        // 更新用户信息
                                        this.userInfo.phone = res.data.data.phone;
                                        // 更新本地存储
                                        const userInfo = uni.getStorageSync('userInfo');
                                        if (userInfo) {
                                            userInfo.phone = res.data.data.phone;
                                            uni.setStorageSync('userInfo', userInfo);
                                        }
                                    } else {
                                        uni.showToast({
                                            title: res.data?.msg || '绑定失败',
                                            icon: 'none',
                                            duration: 2000
                                        });
                                    }
                                },
                                fail: (err) => {
                                    uni.hideLoading();
                                    console.error('绑定手机号失败', err);
                                    uni.showToast({
                                        title: '网络错误，绑定失败',
                                        icon: 'none',
                                        duration: 2000
                                    });
                                }
                            });
                        } else {
                            uni.hideLoading();
                            uni.showToast({
                                title: '获取登录凭证失败',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: () => {
                        uni.hideLoading();
                        uni.showToast({
                            title: '获取登录状态失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                });
            },
            // 格式化手机号
            formatPhone(phone) {
                if (!phone) return '';
                return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
            },
            
            // 管理后台相关方法
            goToDataManagement() {
                uni.navigateTo({
                    url: '/pages/personal/userDetail/DataManagement'
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
        
        &.settings-column {
            margin-top: 40rpx;
            border: 2rpx solid #f0f0f0;
            
            .settings-row {
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                border-bottom: none;
                
                &:active {
                    background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
                }
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
            
            .phone-text {
                color: #333;
                font-weight: 500;
            }
            
            .phone-placeholder {
                color: #999;
                font-style: italic;
            }
        }
        
        .settings-content {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 20rpx;
            padding-right: 20rpx;
        }
        
        .settings-icon-wrapper {
            width: 60rpx;
            height: 60rpx;
            background: linear-gradient(135deg, #666 0%, #666 100%);
            border-radius: 12rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
        }
        
        .settings-icon {
            width: 32rpx;
            height: 32rpx;
            filter: brightness(0) invert(1);
        }
        
        .settings-text {
            font-size: 30rpx;
            font-weight: 600;
            color: #333;
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
        border-color: #1296db;
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
        color: #1296db;
        
        &:active {
            background: #f0f9f0;
        }
    }
}

// 手机绑定按钮样式
.hidden-phone-btn {
    background: transparent;
    border: none !important;
    color: #999;
    font-style: italic;
    font-size: 30rpx;
    padding: 0;
    margin: 0;
    line-height: 1;
    text-align: left;
    position: relative;
    
    &:active {
        opacity: 0.7;
    }
    &::after {
        content: " ";
        width: 0;
        height: 0;
    }
}
</style>