<template>
    <view class="permission-page">
        <view class="header">
            <text class="header-title">权限管理</text>
            <text class="header-desc">管理您的功能使用权限</text>
        </view>
        
        <view class="permission-list">
            <!-- 群聊设置权限 -->
            <view class="permission-item">
                <view class="permission-info">
                    <view class="permission-icon-wrapper">
                        <image :src="serverUrl + '/static/icons/chat/chat.png'" mode="aspectFit" class="permission-icon"></image>
                    </view>
                    <view class="permission-content">
                        <text class="permission-title">群聊设置</text>
                        <text class="permission-desc">允许您创建和管理群聊，设置群聊规则</text>
                    </view>
                </view>
                <view class="permission-control">
                    <switch 
                        :checked="permissions.groupChatSettings" 
                        @change="onGroupChatSettingsChange"
                        color="#07c160"
                        :disabled="!canModifyPermissions"
                    />
                </view>
            </view>
            
            <!-- 其他权限可以在这里添加 -->
            <view class="permission-item disabled">
                <view class="permission-info">
                    <view class="permission-icon-wrapper disabled">
                        <image :src="serverUrl + '/static/icons/data/manage.png'" mode="aspectFit" class="permission-icon"></image>
                    </view>
                    <view class="permission-content">
                        <text class="permission-title">数据管理</text>
                        <text class="permission-desc">管理消防数据和报告（暂未开放）</text>
                    </view>
                </view>
                <view class="permission-control">
                    <switch :checked="false" disabled color="#07c160" />
                </view>
            </view>
        </view>
        
        <!-- 权限说明 -->
        <view class="permission-notice">
            <view class="notice-header">
                <image :src="serverUrl + '/static/icons/person/person.png'" mode="aspectFit" class="notice-icon"></image>
                <text class="notice-title">权限说明</text>
            </view>
            <view class="notice-content">
                <text class="notice-text">• 群聊设置：允许您创建群聊、邀请成员、设置群聊规则</text>
                <text class="notice-text">• 权限修改需要管理员审核，请耐心等待</text>
                <text class="notice-text">• 如有疑问，请联系系统管理员</text>
            </view>
        </view>
        
        <!-- 保存按钮 -->
        <view class="save-section" v-if="hasChanges">
            <button class="save-btn" @tap="savePermissions" :disabled="saving">
                {{ saving ? '保存中...' : '保存权限设置' }}
            </button>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            serverUrl: 'http://192.168.1.3:3000',
            permissions: {
                groupChatSettings: false
            },
            originalPermissions: {},
            hasChanges: false,
            saving: false,
            canModifyPermissions: true, // 是否可以修改权限
            userInfo: {}
        }
    },
    
    onLoad() {
        this.loadUserInfo();
        this.loadPermissions();
    },
    
    methods: {
        // 加载用户信息
        loadUserInfo() {
            const userInfo = uni.getStorageSync('userInfo');
            if (userInfo) {
                this.userInfo = userInfo;
            }
        },
        
        // 加载权限信息
        async loadPermissions() {
            try {
                uni.showLoading({ title: '加载中...' });
                
                const res = await new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/user/getPermissions',
                        method: 'POST',
                        data: {
                            userId: this.userInfo.id
                        },
                        success: resolve,
                        fail: reject
                    });
                });
                
                if (res.data?.code === 200 && res.data.data) {
                    const serverPermissions = res.data.data;
                    this.permissions = {
                        groupChatSettings: serverPermissions.groupChatSettings || false
                    };
                    // 保存原始权限状态
                    this.originalPermissions = { ...this.permissions };
                } else {
                    // 如果后端没有权限接口，使用默认权限
                    this.permissions = {
                        groupChatSettings: this.userInfo.permissionStatus >= 1
                    };
                    this.originalPermissions = { ...this.permissions };
                }
            } catch (err) {
                console.error('加载权限失败:', err);
                // 使用默认权限
                this.permissions = {
                    groupChatSettings: this.userInfo.permissionStatus >= 1
                };
                this.originalPermissions = { ...this.permissions };
            } finally {
                uni.hideLoading();
            }
        },
        
        // 群聊设置权限变更
        onGroupChatSettingsChange(e) {
            this.permissions.groupChatSettings = e.detail.value;
            this.checkChanges();
        },
        
        // 检查是否有变更
        checkChanges() {
            this.hasChanges = JSON.stringify(this.permissions) !== JSON.stringify(this.originalPermissions);
        },
        
        // 保存权限设置
        async savePermissions() {
            if (!this.hasChanges) return;
            
            try {
                this.saving = true;
                uni.showLoading({ title: '保存中...' });
                
                const res = await new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/user/updatePermissions',
                        method: 'POST',
                        data: {
                            userId: this.userInfo.id,
                            permissions: this.permissions
                        },
                        success: resolve,
                        fail: reject
                    });
                });
                
                if (res.data?.code === 200) {
                    // 更新原始权限状态
                    this.originalPermissions = { ...this.permissions };
                    this.hasChanges = false;
                    
                    // 更新本地用户信息
                    const userInfo = uni.getStorageSync('userInfo');
                    if (userInfo) {
                        userInfo.permissionStatus = this.permissions.groupChatSettings ? 1 : 0;
                        uni.setStorageSync('userInfo', userInfo);
                    }
                    
                    uni.showToast({
                        title: '权限设置已保存',
                        icon: 'success',
                        duration: 2000
                    });
                } else {
                    throw new Error(res.data?.msg || '保存失败');
                }
            } catch (err) {
                console.error('保存权限失败:', err);
                uni.showToast({
                    title: err.message || '保存失败，请重试',
                    icon: 'none',
                    duration: 2000
                });
                
                // 恢复原始权限状态
                this.permissions = { ...this.originalPermissions };
            } finally {
                this.saving = false;
                uni.hideLoading();
            }
        }
    }
}
</script>

<style lang="scss">
.permission-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding-bottom: 120rpx;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 40rpx 40rpx;
    color: #fff;
    text-align: center;
}

.header-title {
    display: block;
    font-size: 40rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
}

.header-desc {
    display: block;
    font-size: 28rpx;
    opacity: 0.9;
    line-height: 1.5;
}

.permission-list {
    margin: 30rpx;
}

.permission-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    &.disabled {
        opacity: 0.6;
        
        .permission-icon-wrapper {
            background: #ccc !important;
        }
    }
}

.permission-info {
    display: flex;
    align-items: center;
    flex: 1;
    margin-right: 30rpx;
}

.permission-icon-wrapper {
    width: 80rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #07c160 0%, #00a854 100%);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
    
    &.disabled {
        background: #ccc !important;
        box-shadow: none;
    }
}

.permission-icon {
    width: 40rpx;
    height: 40rpx;
    filter: brightness(0) invert(1);
}

.permission-content {
    flex: 1;
}

.permission-title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 8rpx;
}

.permission-desc {
    display: block;
    font-size: 26rpx;
    color: #666;
    line-height: 1.4;
}

.permission-control {
    flex-shrink: 0;
}

.permission-notice {
    margin: 30rpx;
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.notice-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
}

.notice-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: 16rpx;
}

.notice-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
}

.notice-content {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.notice-text {
    font-size: 26rpx;
    color: #666;
    line-height: 1.5;
}

.save-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    padding: 20rpx 30rpx;
    border-top: 1rpx solid #f0f0f0;
    box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.save-btn {
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
    
    &:disabled {
        background: #ccc;
        box-shadow: none;
    }
}
</style> 