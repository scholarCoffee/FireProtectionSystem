<template>
    <view class="permission-page">
        <!-- 可滚动内容区域：用户列表 + 权限说明 -->
        <scroll-view class="content-scroll" scroll-y="true">
            <!-- 搜索和用户列表标题 -->
            <view class="user-list-section">
                <view class="section-header">
                    <view class="search-container">
                        <input 
                            class="search-input" 
                            placeholder="搜索手机号或昵称" 
                            v-model="searchKeyword"
                            @input="onSearchInput"
                        />
                    </view>
                    <text class="user-count">用户：共计 {{ filteredUserList.length }} 人</text>
                </view>
                <view class="user-list">
                    <view 
                        class="user-item" 
                        v-for="(user, index) in filteredUserList" 
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
                                <view class="user-actions" v-if="canDeleteUser(user)">
                                    <text class="user-name">{{ user.nickName }}</text>
                                    <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="delete-icon" @tap="() => deleteUser(user.id)" />
                                </view>
                                <view class="user-role-phone">
                                     <text class="user-role">{{ getUserRoleText(user.permissionStatus) }}</text>
                                     <text class="user-phone">{{ user.phone || '未设置手机号' }}</text>
                                </view>
                             </view>
                        </view>
                        
                        <view class="user-permissions">
                            <!-- 用户身份选择器 -->
                            <view class="permission-item">
                                <text class="permission-label">用户身份</text>
                                <picker 
                                    :value="getUserRoleIndex(user.permissionStatus)" 
                                    :range="roleOptions" 
                                    @change="(e) => updateUserRole(user.id, e.detail.value)"
                                    :disabled="!canManageUser(user)"
                                >
                                    <view class="role-picker">
                                        <text class="role-picker-text">{{ getUserRoleText(user.permissionStatus) }}</text>
                                        <image :src="serverUrl + '/static/icons/common/right.png'" mode="aspectFit" class="picker-arrow"></image>
                                    </view>
                                </picker>
                            </view>
                            
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
                    <text class="notice-text">• 用户身份：超级管理员可以调整其他用户的身份（用户、管理员、超级管理员）</text>
                    <text class="notice-text">• 群聊：允许用户参与群聊和创建群组</text>
                    <text class="notice-text">• 设置：允许用户修改个人设置和系统配置</text>
                    <text class="notice-text">• 权限管理：允许用户管理其他用户的权限（超级管理员）</text>
                    <text class="notice-text">• 身份和权限修改需要超级管理员权限，请谨慎操作</text>
                </view>
            </view>
            <!-- 底部占位，避免被固定按钮遮挡 -->
            <view class="scroll-spacer"></view>
        </scroll-view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            serverUrl: 'http://172.17.121.229:3000',
            currentUserId: '',
            userList: [],
            filteredUserList: [],
            searchKeyword: '',

            currentUserRole: 0, // 默认普通用户
            // 用户身份选项
            roleOptions: ['普通用户', '管理员', '超级管理员'],
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
        this.checkPermission();
        this.loadUserList();
    },
    
    methods: {
        // 加载当前用户信息
        loadCurrentUser() {
            const userInfo = uni.getStorageSync('userInfo');
            if (userInfo) {
                this.currentUserId = userInfo.userId;
                this.currentUserRole = userInfo.permissionStatus || 0; // 使用 permissionStatus
            }
        },
        
        // 检查权限
        checkPermission() {
            if (this.currentUserRole !== 2) {
                uni.showModal({
                    title: '权限不足',
                    content: '您没有权限访问此页面，需要超级管理员权限',
                    showCancel: false,
                    success: () => {
                        uni.navigateBack();
                    }
                });
                return false;
            }
            return true;
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
                
                // 初始化过滤列表
                this.filteredUserList = [...this.userList];
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
        
        // 检查是否可以管理用户（只有超级管理员可以管理所有用户）
        canManageUser(user) {
            return this.currentUserRole === 2; // 只有超级管理员可以管理所有用户
        },
        
        // 是否可删除该用户
        canDeleteUser(user) {
            if (!this.canManageUser(user)) return false;
            if (user.id === this.currentUserId) return false; // 不能删除本人
            if (user.permissionStatus === 2) return false; // 不能删除超级管理员
            return true;
        },

        // 删除用户
        async deleteUser(userId) {
            const user = this.userList.find(u => u.id === userId);
            if (!user) return;
            if (!this.canDeleteUser(user)) {
                uni.showToast({ title: '无权删除该用户', icon: 'none' });
                return;
            }
            uni.showModal({
                title: '确认删除',
                content: '确定删除该成员吗？',
                success: async (res) => {
                    if (!res.confirm) return;
                    try {
                        uni.showLoading({ title: '删除中...' });
                        const resp = await new Promise((resolve, reject) => {
                            uni.request({
                                url: this.serverUrl + '/user/delete',
                                method: 'POST',
                                data: { userId },
                                success: resolve,
                                fail: reject
                            });
                        });
                        if (resp.data?.code === 200) {
                            // 从本地列表移除
                            this.userList = this.userList.filter(u => u.id !== userId);
                            this.filteredUserList = this.filteredUserList.filter(u => u.id !== userId);
                            uni.showToast({ title: '删除成功', icon: 'success' });
                        } else {
                            throw new Error(resp.data?.msg || '删除失败');
                        }
                    } catch (err) {
                        console.error('删除用户失败:', err);
                        uni.showToast({ title: err.message || '删除失败，请重试', icon: 'none' });
                    } finally {
                        uni.hideLoading();
                    }
                }
            });
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
        
        // 获取用户角色在选项中的索引
        getUserRoleIndex(permissionStatus) {
            return permissionStatus || 0;
        },
        
        // 更新用户身份
        async updateUserRole(userId, roleIndex) {
            const user = this.userList.find(u => u.id === userId);
            if (!user) return;
            
            // 不能修改自己的身份
            if (userId === this.currentUserId) {
                uni.showToast({
                    title: '不能修改自己的身份',
                    icon: 'none',
                    duration: 2000
                });
                return;
            }
            
            // 不能修改其他超级管理员
            if (user.permissionStatus === 2) {
                uni.showToast({
                    title: '不能修改其他超级管理员',
                    icon: 'none',
                    duration: 2000
                });
                return;
            }
            
            const newRole = roleIndex;
            const oldRole = user.permissionStatus;
            
            try {
                uni.showLoading({ title: '更新身份中...' });
                
                const res = await new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/user/updateRole',
                        method: 'POST',
                        data: {
                            userId: userId,
                            newRole: newRole
                        },
                        success: resolve,
                        fail: reject
                    });
                });
                
                if (res.data?.code === 200) {
                    // 更新本地数据
                    user.permissionStatus = newRole;
                    
                    // 根据新身份更新权限
                    if (newRole === 0) {
                        // 普通用户：关闭所有权限
                        user.permissions.groupChat = false;
                        user.permissions.settings = false;
                        user.permissions.admin = false;
                    } else if (newRole === 1) {
                        // 管理员：开启群聊和设置权限，关闭权限管理
                        user.permissions.groupChat = true;
                        user.permissions.settings = true;
                        user.permissions.admin = false;
                    } else if (newRole === 2) {
                        // 超级管理员：开启所有权限
                        user.permissions.groupChat = true;
                        user.permissions.settings = true;
                        user.permissions.admin = true;
                    }
                    
                    uni.showToast({
                        title: '身份更新成功',
                        icon: 'success',
                        duration: 1500
                    });
                } else {
                    throw new Error(res.data?.msg || '更新失败');
                }
            } catch (err) {
                console.error('更新用户身份失败:', err);
                uni.showToast({
                    title: err.message || '更新失败，请重试',
                    icon: 'none',
                    duration: 2000
                });
                
                // 恢复原始状态
                user.permissionStatus = oldRole;
                this.$forceUpdate();
            } finally {
                uni.hideLoading();
            }
        },
        
        // 更新用户权限
        async updateUserPermission(userId, permissionType, value) {
            const user = this.userList.find(u => u.id === userId);
            if (!user) return;
            
            try {
                uni.showLoading({ title: '更新中...' });
                
                const res = await new Promise((resolve, reject) => {
                    uni.request({
                        url: this.serverUrl + '/user/updatePermission',
                        method: 'POST',
                        data: {
                            userId: userId,
                            permissionType: permissionType,
                            value: value
                        },
                        success: resolve,
                        fail: reject
                    });
                });
                
                if (res.data?.code === 200) {
                    // 更新本地数据
                    user.permissions[permissionType] = value;
                    
                    uni.showToast({
                        title: '权限更新成功',
                        icon: 'success',
                        duration: 1500
                    });
                } else {
                    throw new Error(res.data?.msg || '更新失败');
                }
            } catch (err) {
                console.error('更新权限失败:', err);
                uni.showToast({
                    title: err.message || '更新失败，请重试',
                    icon: 'none',
                    duration: 2000
                });
                
                // 恢复原始状态
                user.permissions[permissionType] = !value;
                this.$forceUpdate();
            } finally {
                uni.hideLoading();
            }
        },
        
        // 搜索功能
        onSearchInput() {
            this.filterUserList();
        },
        
        // 过滤用户列表
        filterUserList() {
            if (!this.searchKeyword.trim()) {
                this.filteredUserList = [...this.userList];
                return;
            }
            
            const keyword = this.searchKeyword.toLowerCase().trim();
            this.filteredUserList = this.userList.filter(user => {
                const name = (user.nickName || '').toLowerCase();
                const phone = (user.phone || '').toLowerCase();
                return name.includes(keyword) || phone.includes(keyword);
            });
        },
        

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
    height: 100vh;
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

.search-container {
    flex: 1;
    margin-right: 20rpx;
}

.search-input {
    width: 100%;
    height: 60rpx;
    background: #fff;
    border: 1rpx solid #e0e0e0;
    border-radius: 30rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    color: #333;
    box-sizing: border-box;
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

.user-role-phone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.user-role {
    display: block;
    font-size: 24rpx;
    color: #1890ff;
    background: #e6f7ff;
    border-radius: 12rpx;
    width: fit-content;
}

.user-phone {
    display: block;
    font-size: 24rpx;
    color: #666;
}

.user-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-left: 12rpx;
}

.delete-icon {
    width: 30rpx;
    height: 30rpx;
    padding: 6rpx;
    border-radius: 12rpx;
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
}

.user-permissions {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    padding: 20rpx;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 16rpx;
    border: 1rpx solid #e8f0fe;
    margin-top: 16rpx;
}

.permission-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
    
    &:first-child {
        padding-top: 0;
    }
}

.permission-label {
    font-size: 26rpx;
    color: #333;
    font-weight: 600;
    display: flex;
    align-items: center;
    
    &::before {
        content: '';
        width: 8rpx;
        height: 8rpx;
        background: #1890ff;
        border-radius: 50%;
        margin-right: 12rpx;
        display: inline-block;
    }
}

.role-picker {
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%);
    border: 2rpx solid #91d5ff;
    border-radius: 20rpx;
    padding: 12rpx 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.15);
    transition: all 0.3s ease;
    
    &:active {
        transform: scale(0.95);
        box-shadow: 0 1rpx 4rpx rgba(24, 144, 255, 0.2);
    }
}

.role-picker-text {
    font-size: 24rpx;
    color: #1890ff;
    font-weight: 500;
    margin-right: 12rpx;
}

.picker-arrow {
    width: 24rpx;
    height: 24rpx;
    opacity: 0.7;
    transition: transform 0.3s ease;
}

.role-picker:active .picker-arrow {
    transform: rotate(90deg);
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



/* 底部占位，避免被固定按钮遮挡 */
.scroll-spacer {
  height: calc(80rpx + env(safe-area-inset-bottom));
}
</style> 