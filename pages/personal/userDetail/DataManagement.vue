<template>
  <view class="data-management">
    <!-- 标签页切换 -->
    <view class="tab-container">
      <view class="tab-bar">
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'location' }"
          @tap="switchTab('location')"
        >
          <image :src="currentTab === 'location' ? serverUrl + '/static/icons/location/location-active.png' : serverUrl + '/static/icons/location/location.png'" class="tab-icon" />
          <text class="tab-text">位置信息</text>
        </view>

        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'chat' }"
          @tap="switchTab('chat')"
        >
          <image :src="currentTab === 'chat' ? serverUrl + '/static/icons/chat/chat-active.png' : serverUrl + '/static/icons/chat/chat.png'" class="tab-icon" />
          <text class="tab-text">聊天管理</text>
        </view>
        
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'command' }"
          @tap="switchTab('command')"
        >
          <image :src="currentTab === 'command' ? serverUrl + '/static/icons/data/manage-active.png' : serverUrl + '/static/icons/data/manage.png'" class="tab-icon" />
          <text class="tab-text">数据指挥</text>
        </view>
      </view>
    </view>

    <!-- 搜索和操作栏 -->
    <view class="action-bar" v-if="currentTab == 'location'">
      <view class="search-container">
        <image :src="serverUrl + '/static/icons/location/search.png'" class="search-icon" />
        <input 
          v-model="searchKeyword" 
          class="search-input" 
          :placeholder="getSearchPlaceholder()"
          @input="onSearchInput"
        />
      </view>
      <view class="action-buttons">
        <button class="action-btn add-btn" @tap="showAddModal">
          <image :src="serverUrl + '/static/icons/common/add-white.png'" class="btn-icon" />
          <text>新增</text>
        </button>
        <button class="action-btn refresh-btn" @tap="refreshData">
          <image :src="serverUrl + '/static/icons/common/refresh-white.png'" class="btn-icon" />
          <text>刷新</text>
        </button>
      </view>
    </view>

    <!-- 位置信息内容 -->
    <view v-if="currentTab === 'location'" class="location-content">
      <LocationManagement 
        :serverUrl="serverUrl"
        :searchKeyword="searchKeyword"
        ref="locationManagement"
      />
    </view>
    <!-- 聊天管理内容 -->
    <view v-if="currentTab === 'chat'" class="chat-content">
      <ChatManagement 
        :serverUrl="serverUrl"
        :searchKeyword="searchKeyword"
        ref="chatManagement"
      />
    </view>
    
    <!-- 数据指挥内容 -->
    <view v-if="currentTab === 'command'" class="command-content">
      <view class="command-list">
        <view 
          class="command-item" 
          v-for="(config, key) in commandConfig" 
          :key="key"
          @tap="editCommand(key, config)"
        >
          <view class="item-header">
            <view class="item-title">
              <view class="command-avatar" :data-icon="config.icon || 'analysis'">
                <image :src="serverUrl + '/static/icons/data/' + (config.icon || 'analysis') + '.png'" class="avatar-img" />
              </view>
              <view class="title-info">
                <text class="title-text">{{ config.title }}</text>
                <text class="command-type">数据指挥</text>
              </view>
            </view>
            <view class="item-actions">
              <button class="action-icon-btn" @tap.stop="editCommand(key, config)">
                <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon" />
              </button>
              <button class="action-icon-btn danger" @tap.stop="deleteCommand(config)">
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon" />
              </button>
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">功能描述：</text>
              <text class="value">{{ config.desc }}</text>
            </view>
            <view class="content-row">
              <text class="label">访问地址：</text>
              <text class="value">{{ config.url }}</text>
            </view>
          </view>
        </view>
      </view>

       <!-- 本地编辑弹窗 -->
       <view class="command-modal" v-if="showCommandModal" @tap="closeCommandModal">
         <view class="modal-content" @tap.stop>
           <view class="modal-header">
             <text class="modal-title">{{ commandModalMode === 'add' ? '新增功能' : '编辑功能' }}</text>
             <text class="modal-close" @tap="closeCommandModal">×</text>
           </view>
           <view class="modal-body">
             <view class="modal-form-item">
               <text class="modal-label">功能名称</text>
               <input v-model="editForm.title" class="modal-input" placeholder="请输入功能名称" maxlength="50" />
             </view>
             <view class="modal-form-item">
               <text class="modal-label">功能描述</text>
               <textarea v-model="editForm.desc" class="modal-textarea" placeholder="请输入功能描述" maxlength="200" auto-height show-confirm-bar="false" />
             </view>
             <view class="modal-form-item">
               <text class="modal-label">访问地址</text>
               <input v-model="editForm.url" class="modal-input" placeholder="请输入访问地址" maxlength="500" />
             </view>
             
           </view>
           <view class="modal-footer">
             <button class="footer-btn cancel" @tap="closeCommandModal">取消</button>
             <button class="footer-btn confirm" @tap="saveCommand">保存</button>
           </view>
         </view>
       </view>
     </view>
  </view>
</template>

<script>
import LocationManagement from './components/LocationManagement.vue'
import ChatManagement from './components/ChatManagement.vue'

export default {
  name: 'DataManagement',
  components: {
    LocationManagement,
    ChatManagement
  },
  data() {
    return {
      currentTab: 'location', // 当前标签页
      searchKeyword: '', // 搜索关键词
      searchTimer: null, // 搜索防抖定时器
      serverUrl: 'http://172.17.121.229:3000',
      // 数据指挥配置（从接口获取）
      commandConfig: {},
      // 本地编辑弹窗
      showCommandModal: false,
      commandModalMode: 'edit', // add | edit
      currentEditKey: '',
      editForm: { configId: '', title: '', desc: '', url: '' }
    }
  },

  methods: {
    // 从接口获取数据指挥配置
    loadCommandConfig() {
      uni.request({
        url: this.serverUrl + '/command/config',
        method: 'GET',
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            // 根据新的数据结构，直接使用 res.data.data
            this.commandConfig = res.data.data || {};
            console.log('获取数据指挥配置成功:', this.commandConfig);
          } else {
            this.commandConfig = {};
            console.error('获取数据指挥配置失败:', res.data?.msg || '未知错误');
          }
        },
        fail: (err) => {
          console.error('获取数据指挥配置异常:', err);
          this.commandConfig = {};
          uni.showToast({ 
            title: '获取配置失败', 
            icon: 'none',
            duration: 2000
          });
        }
      });
    },

    // 保存数据指挥配置到接口
    saveCommandConfig(configData) {
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/command/config',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: configData,
          success: (res) => {
            if (res.data && res.data.code === 200) {
              resolve({ success: true, data: res.data.data });
            } else {
              resolve({ 
                success: false, 
                message: res.data?.msg || '保存失败' 
              });
            }
          },
          fail: (err) => {
            console.error('保存数据指挥配置异常:', err);
            resolve({ 
              success: false, 
              message: '网络异常，保存失败' 
            });
          }
        });
      });
    },

    // 删除数据指挥配置
    deleteCommandConfig(config) {
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/command/delConfig',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: config,
          success: (res) => {
            if (res.data && res.data.code === 200) {
              resolve({ success: true });
            } else {
              resolve({ 
                success: false, 
                message: res.data?.msg || '删除失败' 
              });
            }
          },
          fail: (err) => {
            console.error('删除数据指挥配置异常:', err);
            resolve({ 
              success: false, 
              message: '网络异常，删除失败' 
            });
          }
        });
      });
    },

    switchTab(tab) {
      this.currentTab = tab;
      this.searchKeyword = ''; // 切换标签时清空搜索
      if (tab === 'command') {
        this.loadCommandConfig();
      }
    },
    
    getSearchPlaceholder() {
      switch(this.currentTab) {
        case 'location':
          return '根据关键字查询位置信息';
        case 'chat':
          return '根据关键字查询聊天信息';
        case 'command':
          return '搜索数据指挥功能';
        default:
          return '搜索...';
      }
    },
    
    onSearchInput() {
      // 防抖搜索
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      this.searchTimer = setTimeout(() => {
        this.performSearch();
      }, 500);
    },
    
    performSearch() {
      // 根据当前标签页执行搜索
      if (this.currentTab === 'location' && this.$refs.locationManagement) {
        this.$refs.locationManagement.search(this.searchKeyword);
      } else if (this.currentTab === 'chat' && this.$refs.chatManagement) {
        this.$refs.chatManagement.search(this.searchKeyword);
      }
    },
    
    refreshData() {
      // 刷新当前组件的数据
      if (this.currentTab === 'location' && this.$refs.locationManagement) {
        this.$refs.locationManagement.loadData();
      } else if (this.currentTab === 'chat' && this.$refs.chatManagement) {
        this.$refs.chatManagement.loadData();
      }
    },
    
    showAddModal() {
      // 保持原有位置/聊天新增逻辑
      let url = ''
      if (this.currentTab === 'location') {
        url = `/pages/personal/userDetail/DataEdit?type=location&mode=add`
      } else if (this.currentTab === 'chat') {
        url = `/pages/personal/userDetail/DataEdit?type=chat&mode=add`
      } else if (this.currentTab === 'command') {
        this.openAddCommand()
        return
      }
      if (url) uni.navigateTo({ url })
    },

    // 数据指挥配置：新增/编辑/保存/删除
    openAddCommand() {
      this.commandModalMode = 'add'
      this.currentEditKey = ''
      this.editForm = { configId: '', title: '', desc: '', url: '' }
      this.showCommandModal = true
    },
    
    // 编辑数据指挥配置
    editCommand(key, config) {
      this.commandModalMode = 'edit'
      this.currentEditKey = key
      this.editForm = { 
        configId: config.configId || '',
        title: config.title || '', 
        desc: config.desc || '', 
        url: config.url || ''
      }
      this.showCommandModal = true
    },

    // 删除数据指挥配置
    deleteCommand(config) {
      uni.showModal({
        title: '确认删除',
        content: '确定删除该功能吗？',
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中...' });
            
            this.deleteCommandConfig(config).then((result) => {
              uni.hideLoading();
              
              if (result.success) {
                // 删除成功后重新加载数据
                this.loadCommandConfig();
                uni.showToast({ title: '已删除', icon: 'success', duration: 1000 });
              } else {
                uni.showToast({ 
                  title: result.message || '删除失败', 
                  icon: 'none', 
                  duration: 2000 
                });
              }
            });
          }
        }
      })
    },

    closeCommandModal() {
      this.showCommandModal = false
    },



    // 保存数据指挥配置
    saveCommand() {
      // 简单校验
      if (!this.editForm.title || !this.editForm.url) {
        uni.showToast({ title: '请填写名称与地址', icon: 'none' })
        return
      }

      uni.showLoading({ title: '保存中...' });

      let configData = {
        action: 'update',
        key: this.currentEditKey,
        data: {
          configId: this.editForm.configId,
          title: this.editForm.title,
          desc: this.editForm.desc,
          url: this.editForm.url
        }
      };

      this.saveCommandConfig(configData).then((result) => {
        uni.hideLoading();
        
        if (result.success) {
          // 保存成功后重新加载数据
          this.loadCommandConfig();
          this.showCommandModal = false;
          uni.showToast({ title: '已保存', icon: 'success', duration: 1000 });
        } else {
          uni.showToast({ 
            title: result.message || '保存失败', 
            icon: 'none', 
            duration: 2000 
          });
        }
      }).catch((error) => {
        uni.hideLoading();
        uni.showToast({ 
          title: '保存异常', 
          icon: 'none', 
          duration: 2000 
        });
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.data-management {
  height: 100vh;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
  display: flex;
  flex-direction: column;
}

/* 标签页 */
.tab-container {
  background: #fff;
  border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.05);
}

.tab-bar {
  display: flex;
  padding: 0 30rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0rpx 0 10rpx 0;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #1890ff;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 2rpx;
}

.tab-icon {
  width: 32rpx;
  height: 32rpx;
  margin-bottom: 4rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #8c8c8c;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: #40a9ff;
  font-weight: 600;
}

/* 搜索和操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 20rpx 0rpx 20rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.05);
  gap: 20rpx;
}

.search-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 24rpx;
  padding: 0 20rpx;
  margin: 6rpx 0;
  height: 64rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: #1890ff;
    background: #fff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
  }
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 16rpx;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 28rpx;
  color: #333;
  outline: none;
  
  &::placeholder {
    color: #999;
  }
}

.action-buttons {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
  min-width: 100rpx;
  height: 64rpx;
  padding: 0 20rpx;
}

.add-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
  
  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.3);
  }
}

.refresh-btn {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
  
  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
  }
}

.btn-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}

/* 内容区域 */
.location-content,
.chat-content,
.command-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许flex子项收缩 */
}

/* 数据指挥样式 */
.command-content {
  padding: 20rpx;
}

.command-toolbar {
	display: flex;
	justify-content: flex-end;
	padding: 0 0 16rpx 0;
}

.command-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.command-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:active {
    background-color: #f5f5f5;
  }
}

.command-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-img {
  width: 36rpx;
  height: 36rpx;
  filter: brightness(0) invert(1);
}

/* 为不同图标类型设置不同的渐变色，参考 command/index.vue */
.command-avatar[data-icon="analysis"] {
  background: linear-gradient(135deg, #667eea 0%, #a24b74 100%);
}

.command-avatar[data-icon="device"] {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.command-avatar[data-icon="report"] {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.command-type {
  font-size: 22rpx;
  color: #666;
}

/* ===== 数据指挥区域样式增强 ===== */
.command-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.command-item {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 20rpx;
	padding: 24rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.2);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
	backdrop-filter: blur(10rpx);

	&:active {
		transform: translateY(4rpx);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
	}
}

/* 头部区域 */
.item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.item-title {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.command-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
	border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.title-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.title-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #2c3e50;
	line-height: 1.2;
}

/* 操作按钮 */
.item-actions {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.action-icon-btn {
	width: 50rpx;
	height: 50rpx;
	border: none;
	background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
	box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.25);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	padding: 0;

	&::after {
		border: none;
	}

	&:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
	}
}

.action-icon {
	width: 32rpx;
	height: 32rpx;
	filter: brightness(0) invert(1);
	opacity: 0.95;
}

.action-icon-btn.danger {
	background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
	box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.25);
}

/* 内容区域 */
.item-content {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.content-row {
	display: flex;
	align-items: baseline;
	gap: 8rpx;
	padding: 8rpx 0;
	border-bottom: 1rpx dashed #f0f0f0;
}

.content-row:last-child {
	border-bottom: none;
}

.item-content .label {
	min-width: 140rpx;
	color: #8c8c8c;
	font-size: 24rpx;
}

.item-content .value {
	flex: 1;
	color: #333;
	font-size: 26rpx;
	line-height: 1.5;
	word-break: break-all;
	overflow: hidden;
	text-overflow: ellipsis;
}
/* ===== 数据指挥区域样式增强 END ===== */

/* ===== 本地编辑弹窗样式 ===== */
.command-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.modal-content {
	background: #ffffff;
	border-radius: 16rpx;
	width: 90%;
	max-height: 80%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12rpx 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
	background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
}

.modal-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1890ff;
}

.modal-close {
	font-size: 36rpx;
	color: #999999;
}

.modal-body {
	padding: 16rpx 24rpx;
	overflow-y: auto;
}

.modal-form-item {
	display: flex;
	align-items: center;
	padding: 12rpx 0;
}

.modal-label {
	min-width: 160rpx;
	font-size: 26rpx;
	color: #666;
}

.modal-input {
	flex: 1;
	height: 72rpx;
	padding: 0 16rpx;
	border: 2rpx solid #e8f4ff;
	border-radius: 12rpx;
	background: #ffffff;
	font-size: 26rpx;
}

.modal-textarea {
	flex: 1;
	min-height: 120rpx;
	padding: 12rpx 16rpx;
	border: 2rpx solid #e8f4ff;
	border-radius: 12rpx;
	background: #ffffff;
	font-size: 26rpx;
}



.modal-footer {
	display: flex;
	gap: 16rpx;
	padding: 12rpx 24rpx 20rpx 24rpx;
	border-top: 1rpx solid #f0f0f0;
	background: #ffffff;
}

.footer-btn {
	flex: 1;
	height: 68rpx;
	border-radius: 12rpx;
	border: none;
	font-size: 26rpx;
}

.footer-btn.cancel {
	background: #f5f5f5;
	color: #666;
}

.footer-btn.confirm {
	background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
	color: #ffffff;
}

</style> 