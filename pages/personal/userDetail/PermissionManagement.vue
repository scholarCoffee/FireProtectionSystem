<template>
    <view class="permission-page">
        <!-- 可滚动内容区域：用户列表 + 权限说明 -->
        <scroll-view class="content-scroll" scroll-y="true">
            <!-- 用户列表 -->
            <view class="user-list-section">
                <view class="section-header">
                    <text class="section-title">用户列表</text>
                    <text class="user-count">共 {{ userList.length }} 人</text>
                </view>
                <view class="user-list">
                    <view 
                        class="user-item" 
                        v-for="(user, index) in userList" 
                        :key="user.id"
                        :class="{ 'current-user': user.id === currentUserId }"
                    >
                        <view class="user-info">
                            <view class="user-avatar">
                                <image 
                                    :src="serverUrl + (user.avatar || '/static/icons/person/default-avatar.png')" 
                                    mode="aspectFill" 
                                    class="avatar-img"
                                />
                                <view class="user-status" :class="statusClassMap[user.status] || 'status-active'">
                                    <text class="status-text">{{ statusTextMap[user.status] || '正常' }}</text>
                                </view>
                            </view>
                            <view class="user-details">
                                <text class="user-name">{{ user.name }}</text>
                                <text class="user-role">{{ getUserRoleText(user.permissionStatus) }}</text>
                                <text class="user-phone">{{ user.phone || '未设置手机号' }}</text>
                            </view>
                        </view>
                        
                        <view class="user-permissions">
                            <view class="permission-item">
                                <text class="permission-label">群聊</text>
                                <switch 
                                    :checked="user.permissions.groupChat" 
                                    @change="(e) => updateUserPermission(user.id, 'groupChat', e.detail.value)"
                                    color="#07c160"
                                    :disabled="!canManageUser(user)"
                                />
                            </view>
                            
                            <view class="permission-item">
                                <text class="permission-label">设置</text>
                                <switch 
                                    :checked="user.permissions.settings" 
                                    @change="(e) => updateUserPermission(user.id, 'settings', e.detail.value)"
                                    color="#1890ff"
                                    :disabled="!canManageUser(user)"
                                />
                            </view>
                            
                            <view class="permission-item">
                                <text class="permission-label">权限管理</text>
                                <switch 
                                    :checked="user.permissions.admin" 
                                    @change="(e) => updateUserPermission(user.id, 'admin', e.detail.value)"
                                    color="#ff9500"
                                    :disabled="!canManageUser(user)"
                                />
                            </view>
                        </view>
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
                    <text class="notice-text">• 群聊：允许用户参与群聊和创建群组</text>
                    <text class="notice-text">• 设置：允许用户修改个人设置和系统配置</text>
                    <text class="notice-text">• 权限管理：允许用户管理其他用户的权限（超级管理员）</text>
                    <text class="notice-text">• 权限修改需要管理员审核，请谨慎操作</text>
                </view>
            </view>
            <!-- 底部占位，避免被固定按钮遮挡 -->
            <view class="scroll-spacer"></view>
        </scroll-view>
        
        <!-- 保存按钮 -->
        <view class="save-section" v-if="hasChanges">
            <button class="save-btn" @tap="saveAllPermissions" :disabled="saving">
                {{ saving ? '保存中...' : '保存所有权限设置' }}
            </button>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            serverUrl: 'https://www.xiaobei.space',
            currentUserId: '',
            userList: [],
            originalPermissions: {},
            hasChanges: false,
            saving: false,
            currentUserRole: 0, // 默认普通用户
            // 模板映射，避免 :class 调用方法
            statusClassMap: {
                active: 'status-active',
                inactive: 'status-inactive',
                pending: 'status-pending'
            },
            statusTextMap: {
                active: '正常',
                inactive: '禁用',
                pending: '待审核'
            },
            // 微信小程序兼容的状态映射
            statusMap: {
                'active': { text: '正常', class: 'status-active' },
                'inactive': { text: '禁用', class: 'status-inactive' },
                'pending': { text: '待审核', class: 'status-pending' }
            }
        }
    },
    
    onLoad() {
        this.loadCurrentUser();
        this.loadUserList();
    },
    
    methods: {
        // 加载当前用户信息
        loadCurrentUser() {
            const userInfo = uni.getStorageSync('userInfo');
            if (userInfo) {
                this.currentUserId = userInfo.id;
                this.currentUserRole = userInfo.permissionStatus || 0; // 使用 permissionStatus
            }
        },
        
        // 加载用户列表
        async loadUserList() {
            try {
                uni.showLoading({ title: '加载中...' });
                
                const res = await new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/user/list',
                        method: 'GET',
                        data: {},
                        success: resolve,
                        fail: reject
                    });
                });
                
                if (res.data?.code === 200 && res.data.data) {
                    this.userList = res.data.data.map(user => ({
                        ...user,
                        permissions: {
                            groupChat: user.permissions?.groupChat || false,
                            settings: user.permissions?.settings || false,
                            admin: user.permissions?.admin || false
                        }
                    }));
                } else {
                    throw new Error('获取用户列表失败');
                }
                
                // 保存原始权限状态
                this.saveOriginalPermissions();
            } catch (err) {
                console.error('加载用户列表失败:', err);
                uni.showToast({
                    title: '加载用户列表失败',
                    icon: 'none',
                    duration: 2000
                });
            } finally {
                uni.hideLoading();
            }
        },
        

        
        // 保存原始权限状态
        saveOriginalPermissions() {
            this.originalPermissions = {};
            this.userList.forEach(user => {
                this.originalPermissions[user.id] = { ...user.permissions };
            });
        },
        
        // 检查是否可以管理用户（根据接口返回的 permissionStatus）
        canManageUser(user) {
            if (this.currentUserRole === 2) return true; // 超级管理员可以管理所有用户
            if (this.currentUserRole === 1 && user.permissionStatus !== 2) return true; // 管理员可以管理非超级管理员用户
            return false;
        },
        
        // 获取用户状态样式类（微信小程序兼容）
        getUserStatusClass(status) {
            // #ifdef MP-WEIXIN
            return this.statusMap[status]?.class || 'status-active';
            // #endif
            // #ifndef MP-WEIXIN
            const statusMap = {
                'active': 'status-active',
                'inactive': 'status-inactive',
                'pending': 'status-pending'
            };
            return statusMap[status] || 'status-active';
            // #endif
        },
        
        // 获取用户状态文本（微信小程序兼容）
        getUserStatusText(status) {
            // #ifdef MP-WEIXIN
            return this.statusMap[status]?.text || '正常';
            // #endif
            // #ifndef MP-WEIXIN
            const statusMap = {
                'active': '正常',
                'inactive': '禁用',
                'pending': '待审核'
            };
            return statusMap[status] || '正常';
            // #endif
        },
        
        // 获取用户角色文本（根据接口返回的 permissionStatus）
        getUserRoleText(permissionStatus) {
            const roleMap = {
                2: '超级管理员',
                1: '管理员',
                0: '普通用户'
            };
            return roleMap[permissionStatus] || '普通用户';
        },
        
        // 更新用户权限
        updateUserPermission(userId, permissionType, value) {
            const user = this.userList.find(u => u.id === userId);
            if (user) {
                user.permissions[permissionType] = value;
                this.checkChanges();
            }
        },
        
        // 检查是否有变更
        checkChanges() {
            this.hasChanges = false;
            for (const userId in this.originalPermissions) {
                const original = this.originalPermissions[userId];
                const current = this.userList.find(u => u.id === userId)?.permissions;
                if (JSON.stringify(original) !== JSON.stringify(current)) {
                    this.hasChanges = true;
                    break;
                }
            }
        },
        
        // 保存所有权限设置
        async saveAllPermissions() {
            if (!this.hasChanges) return;
            
            try {
                this.saving = true;
                uni.showLoading({ title: '保存中...' });
                
                const res = await new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/user/updatePermissions',
                        method: 'POST',
                        data: {
                            permissions: this.userList.map(user => ({
                                userId: user.id,
                                permissions: user.permissions
                            }))
                        },
                        success: resolve,
                        fail: reject
                    });
                });
                
                if (res.data?.code === 200) {
                    // 更新原始权限状态
                    this.saveOriginalPermissions();
                    this.hasChanges = false;
                    
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
                this.userList.forEach(user => {
                    if (this.originalPermissions[user.id]) {
                        user.permissions = { ...this.originalPermissions[user.id] };
                    }
                });
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
}

.content-scroll {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 120rpx; /* 预留底部按钮高度 */
    // #ifdef H5
    padding-top: 80rpx; /* 贴边衔接，降低顶部内边距 */
    // #endif
    box-sizing: border-box;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 40rpx 40rpx;
    color: #fff;
    text-align: center;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    position: relative;
}

.header::after { content: none; }

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

.user-list-section {
    margin: 0 0 16rpx 0; /* 左右贴边，上边无间距与 header 无缝衔接 */
    background: #fff;
    border-radius: 0; /* 顶部不圆角，贴边卡片 */
    overflow: hidden;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.section-header {
    padding: 20rpx 24rpx;
    border-bottom: 1rpx solid #f0f0f0;
    background: #f8f9fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
}

.user-count {
    font-size: 24rpx;
    color: #666;
    background: #e8f4ff;
    padding: 6rpx 12rpx;
    border-radius: 20rpx;
}

.user-list {
    padding: 0;
}

.user-item {
    padding: 18rpx 24rpx;
    border-bottom: 1rpx solid #f5f5f5;
    transition: background-color 0.2s ease;
    
    &:last-child {
        border-bottom: none;
    }
    
    &:hover {
        background: #fafbfc;
    }
    
    &.current-user {
        background: linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%);
        border-left: 4rpx solid #1890ff;
    }
}

.user-info {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
}

.user-avatar {
    position: relative;
    margin-right: 20rpx;
}

.avatar-img {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: #f0f0f0;
}

.user-status {
    position: absolute;
    bottom: -4rpx;
    right: -4rpx;
    min-width: 32rpx;
    height: 32rpx;
    border-radius: 16rpx;
    border: 2rpx solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8rpx;
    box-sizing: border-box;
    
    &.status-active {
        background: #52c41a;
    }
    
    &.status-inactive {
        background: #ff4d4f;
    }
    
    &.status-pending {
        background: #faad14;
    }
}

.status-text {
    font-size: 20rpx;
    color: #fff;
    font-weight: 500;
    white-space: nowrap;
    line-height: 1;
}

.user-details {
    flex: 1;
}

.user-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 8rpx;
}

.user-role {
    display: block;
    font-size: 24rpx;
    color: #1890ff;
    background: #e6f7ff;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    margin-bottom: 8rpx;
    width: fit-content;
}

.user-phone {
    display: block;
    font-size: 24rpx;
    color: #666;
}

.user-permissions {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.permission-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8rpx 0;
}

.permission-label {
    font-size: 24rpx;
    color: #333;
    font-weight: 500;
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
    z-index: 10;
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

/* 底部占位，避免被固定按钮遮挡 */
.scroll-spacer {
    height: 140rpx;
}
</style> 