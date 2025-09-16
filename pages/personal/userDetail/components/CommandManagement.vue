<template>
  <view class="command-management">
    <!-- 数据指挥列表 -->
    <scroll-view class="data-list" scroll-y="true" @scrolltolower="loadMore">
      <view v-if="loading" class="loading-container">
        <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="filteredList.length === 0" class="empty-container">
        <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
        <text class="empty-text">暂无数据指挥功能</text>
      </view>
      
      <view v-else class="list-content">
        <view class="data-item" v-for="(config, key) in filteredList" :key="key">
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
              <button class="action-icon-btn" @tap="editCommand(key, config)">
                <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon" />
              </button>
              <button class="action-icon-btn danger" @tap="deleteCommand(config)">
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
    </scroll-view>

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
</template>

<script>
export default {
  name: 'CommandManagement',
  props: {
    serverUrl: {
      type: String,
      default: 'https://www.xiaobei.space',
      required: true
    },
    searchKeyword: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      commandConfig: {},
      filteredList: [],
      // 本地编辑弹窗
      showCommandModal: false,
      commandModalMode: 'edit', // add | edit
      currentEditKey: '',
      editForm: { configId: '', title: '', desc: '', url: '' }
    }
  },
  
  watch: {
    searchKeyword: {
      handler(newVal) {
        this.filterData();
      },
      immediate: true
    }
  },
  
  mounted() {
    this.loadData();
  },
  
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/command/config',
            method: 'GET',
            header: {
              'Content-Type': 'application/json'
            },
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          this.commandConfig = result.data.data || {};
          this.filterData();
        } else {
          this.commandConfig = {};
          this.filterData();
        }
      } catch (error) {
        console.error('加载数据指挥配置失败:', error);
        this.commandConfig = {};
        this.filterData();
      } finally {
        this.loading = false;
      }
    },
    
    filterData() {
      if (!this.searchKeyword.trim()) {
        this.filteredList = Object.keys(this.commandConfig).map(key => ({
          key,
          ...this.commandConfig[key]
        }));
      } else {
        const keyword = this.searchKeyword.toLowerCase();
        this.filteredList = Object.keys(this.commandConfig)
          .filter(key => {
            const config = this.commandConfig[key];
            return (config.title && config.title.toLowerCase().includes(keyword)) ||
                   (config.desc && config.desc.toLowerCase().includes(keyword)) ||
                   (config.url && config.url.toLowerCase().includes(keyword));
          })
          .map(key => ({
            key,
            ...this.commandConfig[key]
          }));
      }
    },
    
    search(keyword) {
      this.searchKeyword = keyword;
    },
    
    loadMore() {
      // 可以在这里实现分页加载
    },
    
    // 数据指挥配置：新增/编辑/保存/删除
    openAddCommand() {
      this.commandModalMode = 'add';
      this.currentEditKey = '';
      this.editForm = { configId: '', title: '', desc: '', url: '' };
      this.showCommandModal = true;
    },
    
    editCommand(key, config) {
      this.commandModalMode = 'edit';
      this.currentEditKey = key;
      this.editForm = { 
        configId: config.configId || '',
        title: config.title || '', 
        desc: config.desc || '', 
        url: config.url || ''
      };
      this.showCommandModal = true;
    },

    deleteCommand(config) {
      uni.showModal({
        title: '确认删除',
        content: '确定删除该功能吗？',
        success: (res) => {
          if (res.confirm) {
            this.performDeleteCommand(config);
          }
        }
      });
    },
    
    async performDeleteCommand(config) {
      uni.showLoading({ title: '删除中...' });
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/command/delConfig',
            method: 'POST',
            header: {
              'Content-Type': 'application/json'
            },
            data: config,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          uni.showToast({ title: '已删除', icon: 'success', duration: 1000 });
          this.loadData();
        } else {
          throw new Error(result.data?.msg || '删除失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '删除失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },

    closeCommandModal() {
      this.showCommandModal = false;
    },

    async saveCommand() {
      // 简单校验
      if (!this.editForm.title || !this.editForm.url) {
        uni.showToast({ title: '请填写名称与地址', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '保存中...' });

      try {
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

        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/command/config',
            method: 'POST',
            header: {
              'Content-Type': 'application/json'
            },
            data: configData,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          this.showCommandModal = false;
          uni.showToast({ title: '已保存', icon: 'success', duration: 1000 });
          this.loadData();
        } else {
          throw new Error(result.data?.msg || '保存失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.command-management {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.data-list {
  flex: 1;
  padding: 20rpx;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.loading-icon, .empty-icon {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 20rpx;
}

.loading-text, .empty-text {
  font-size: 28rpx;
  color: #999;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.data-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.command-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-img {
  width: 30rpx;
  height: 30rpx;
  filter: brightness(0) invert(1);
}

.title-info {
  display: flex;
  flex-direction: column;
}

.title-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.command-type {
  font-size: 22rpx;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 12rpx;
  margin-right: 12rpx;
}

.action-icon-btn {
  padding: 8rpx;
  border-radius: 8rpx;
  background: #1890ff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  overflow: hidden;
}

.action-icon-btn.danger {
  background: #ff4d4f;
}

.action-icon {
  width: 32rpx;
  height: 32rpx;
  display: block;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.content-row {
  display: flex;
  align-items: flex-start;
}

.label {
  font-size: 24rpx;
  color: #999;
  min-width: 120rpx;
  margin-right: 16rpx;
}

.value {
  font-size: 24rpx;
  color: #333;
  flex: 1;
}

/* 弹窗样式 */
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
