<template>
  <view class="data-management">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-left" @tap="goBack">
        <image src="https://www.xiaobei.space/static/icons/common/left.png" class="back-icon" />
        <text class="back-text">返回</text>
      </view>
      <text class="header-title">数据后台管理</text>
      <view class="header-right"></view>
    </view>

    <!-- 标签页切换 -->
    <view class="tab-container">
      <view class="tab-bar">
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'location' }"
          @tap="switchTab('location')"
        >
          <image :src="currentTab === 'location' ? 'https://www.xiaobei.space/static/icons/location/location-active.png' : 'https://www.xiaobei.space/static/icons/location/location.png'" class="tab-icon" />
          <text class="tab-text">位置信息</text>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'safety' }"
          @tap="switchTab('safety')"
        >
          <image :src="currentTab === 'safety' ? 'https://www.xiaobei.space/static/icons/data/alarm-active.png' : 'https://www.xiaobei.space/static/icons/data/alarm.png'" class="tab-icon" />
          <text class="tab-text">安全信息</text>
        </view>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="action-left">
        <button class="action-btn add-btn" @tap="showAddModal">
          <image src="https://www.xiaobei.space/static/icons/chat/add.png" class="btn-icon" />
          <text>新增</text>
        </button>
        <button class="action-btn refresh-btn" @tap="refreshData">
          <image src="https://www.xiaobei.space/static/icons/common/loading.png" class="btn-icon" />
          <text>刷新</text>
        </button>
      </view>
      <view class="action-right">
        <text class="data-count">共 {{ currentDataList.length }} 条</text>
      </view>
    </view>

    <!-- 数据列表 -->
    <scroll-view class="data-list" scroll-y="true" @scrolltolower="loadMore">
      <view v-if="loading" class="loading-container">
        <image src="https://www.xiaobei.space/static/icons/common/loading.png" class="loading-icon" />
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="currentDataList.length === 0" class="empty-container">
        <image src="https://www.xiaobei.space/static/icons/common/no-data.png" class="empty-icon" />
        <text class="empty-text">暂无数据</text>
      </view>
      
      <view v-else class="list-content">
        <!-- Location数据项 -->
        <view v-if="currentTab === 'location'" class="data-item" v-for="item in currentDataList" :key="item.id">
          <view class="item-header">
            <view class="item-title">
              <image :src="getLocationTypeIcon(item.type)" class="type-icon" />
              <text class="title-text">{{ item.addressName }}</text>
            </view>
            <view class="item-actions">
              <button class="action-icon-btn" @tap="editItem(item)">
                <image src="https://www.xiaobei.space/static/icons/chat/edit.png" class="action-icon" />
              </button>
              <button class="action-icon-btn delete-btn" @tap="deleteItem(item)">
                <image src="https://www.xiaobei.space/static/icons/chat/delete.png" class="action-icon" />
              </button>
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">地址：</text>
              <text class="value">{{ item.addressExt }}</text>
            </view>
            <view class="content-row">
              <text class="label">类型：</text>
              <text class="value">{{ getLocationTypeName(item.type) }}</text>
            </view>
            <view class="content-row">
              <text class="label">安全等级：</text>
              <text class="value">{{ item.safeLevelName || '未设置' }}</text>
            </view>
            <view class="content-row">
              <text class="label">描述：</text>
              <text class="value">{{ item.description || '暂无描述' }}</text>
            </view>
          </view>
        </view>

        <!-- Safety数据项 -->
        <view v-if="currentTab === 'safety'" class="data-item" v-for="item in currentDataList" :key="item.id">
          <view class="item-header">
            <view class="item-title">
              <image src="https://www.xiaobei.space/static/icons/data/alarm.png" class="type-icon" />
              <text class="title-text">{{ item.name }}</text>
            </view>
            <view class="item-actions">
              <button class="action-icon-btn" @tap="editItem(item)">
                <image src="https://www.xiaobei.space/static/icons/chat/edit.png" class="action-icon" />
              </button>
              <button class="action-icon-btn delete-btn" @tap="deleteItem(item)">
                <image src="https://www.xiaobei.space/static/icons/chat/delete.png" class="action-icon" />
              </button>
            </view>
          </view>
          <view class="item-content">
            <view class="content-row">
              <text class="label">描述：</text>
              <text class="value">{{ item.description || '暂无描述' }}</text>
            </view>
            <view class="content-row">
              <text class="label">权重：</text>
              <text class="value">{{ item.weight || 0 }}</text>
            </view>
                         <view class="content-row">
               <text class="label">状态：</text>
               <text class="value" :class="item.status === 1 ? 'status-active' : 'status-inactive'">{{ getStatusText(item.status) }}</text>
             </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 新增/编辑弹窗 -->
    <view v-if="showAddEditModal" class="modal-overlay" @tap="closeAddEditModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEdit ? '编辑' : '新增' }}{{ currentTab === 'location' ? '位置' : '安全' }}信息</text>
          <text class="modal-close" @tap="closeAddEditModal">×</text>
        </view>
        
        <view class="modal-body">
          <!-- Location表单 -->
          <view v-if="currentTab === 'location'" class="form-content">
            <view class="form-item">
              <text class="form-label">地址名称 *</text>
              <input 
                v-model="formData.addressName" 
                class="form-input" 
                placeholder="请输入地址名称"
                maxlength="50"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label">详细地址 *</text>
              <input 
                v-model="formData.addressExt" 
                class="form-input" 
                placeholder="请输入详细地址"
                maxlength="200"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label">位置类型 *</text>
              <picker 
                :value="formData.type - 1" 
                :range="locationTypeOptions" 
                range-key="label"
                @change="onLocationTypeChange"
                class="form-picker"
              >
                <view class="picker-display">
                  <text>{{ getLocationTypeText(formData.type) }}</text>
                  <image src="https://www.xiaobei.space/static/icons/common/down.png" class="picker-arrow" />
                </view>
              </picker>
            </view>
            
            <view class="form-item">
              <text class="form-label">安全等级</text>
              <picker 
                :value="formData.safeLevelId - 1" 
                :range="safetyLevelOptions" 
                range-key="label"
                @change="onSafetyLevelChange"
                class="form-picker"
              >
                <view class="picker-display">
                  <text>{{ getSafetyLevelText(formData.safeLevelId) }}</text>
                  <image src="https://www.xiaobei.space/static/icons/common/down.png" class="picker-arrow" />
                </view>
              </picker>
            </view>
            
            <view class="form-item">
              <text class="form-label">描述</text>
              <textarea 
                v-model="formData.description" 
                class="form-textarea" 
                placeholder="请输入描述信息"
                maxlength="500"
              />
            </view>
          </view>

          <!-- Safety表单 -->
          <view v-if="currentTab === 'safety'" class="form-content">
            <view class="form-item">
              <text class="form-label">名称 *</text>
              <input 
                v-model="formData.name" 
                class="form-input" 
                placeholder="请输入名称"
                maxlength="50"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label">描述</text>
              <textarea 
                v-model="formData.description" 
                class="form-textarea" 
                placeholder="请输入描述信息"
                maxlength="500"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label">权重 *</text>
              <input 
                v-model="formData.weight" 
                class="form-input" 
                type="number"
                placeholder="请输入权重"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label">状态</text>
              <picker 
                :value="formData.status - 1" 
                :range="statusOptions" 
                range-key="label"
                @change="onStatusChange"
                class="form-picker"
              >
                <view class="picker-display">
                  <text>{{ getStatusText(formData.status) }}</text>
                  <image src="https://www.xiaobei.space/static/icons/common/down.png" class="picker-arrow" />
                </view>
              </picker>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @tap="closeAddEditModal">取消</button>
          <button class="modal-btn confirm-btn" @tap="saveData">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'DataManagement',
  data() {
    return {
      currentTab: 'location', // 当前标签页
      loading: false,
      locationList: [],
      safetyList: [],
      showAddEditModal: false,
      isEdit: false,
      formData: {},
      serverUrl: 'https://www.xiaobei.space',
      
      // 选项数据
      locationTypeOptions: [
        { value: 1, label: '高层小区' },
        { value: 2, label: '重点单位' },
        { value: 3, label: '沿街商铺' }
      ],
      safetyLevelOptions: [
        { value: 1, label: '优秀' },
        { value: 2, label: '良好' },
        { value: 3, label: '一般' },
        { value: 4, label: '危险' }
      ],
      statusOptions: [
        { value: 1, label: '启用' },
        { value: 0, label: '禁用' }
      ]
    }
  },
  computed: {
    currentDataList() {
      return this.currentTab === 'location' ? this.locationList : this.safetyList;
    }
  },
  onLoad() {
    this.loadData();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    switchTab(tab) {
      this.currentTab = tab;
      this.loadData();
    },
    
    async loadData() {
      this.loading = true;
      try {
        if (this.currentTab === 'location') {
          await this.loadLocationData();
        } else {
          await this.loadSafetyData();
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        uni.showToast({
          title: '加载数据失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.loading = false;
      }
    },
    
    async loadLocationData() {
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/location/list',
          method: 'GET',
          success: (res) => {
            if (res.data && res.data.code === 200) {
              this.locationList = res.data.data || [];
            } else {
              this.locationList = [];
            }
            resolve();
          },
          fail: reject
        });
      });
    },
    
    async loadSafetyData() {
      return new Promise((resolve, reject) => {
        uni.request({
          url: this.serverUrl + '/safety/list',
          method: 'GET',
          success: (res) => {
            if (res.data && res.data.code === 200) {
              this.safetyList = res.data.data || [];
            } else {
              this.safetyList = [];
            }
            resolve();
          },
          fail: reject
        });
      });
    },
    
    refreshData() {
      this.loadData();
    },
    
    loadMore() {
      // 可以在这里实现分页加载
    },
    
    showAddModal() {
      this.isEdit = false;
      this.resetFormData();
      this.showAddEditModal = true;
    },
    
    editItem(item) {
      this.isEdit = true;
      this.formData = { ...item };
      this.showAddEditModal = true;
    },
    
    deleteItem(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除这个${this.currentTab === 'location' ? '位置' : '安全'}信息吗？`,
        success: (res) => {
          if (res.confirm) {
            this.performDelete(item);
          }
        }
      });
    },
    
    async performDelete(item) {
      uni.showLoading({ title: '删除中...' });
      try {
        const url = this.currentTab === 'location' 
          ? this.serverUrl + '/location/delete'
          : this.serverUrl + '/safety/delete';
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'POST',
            data: { id: item.id },
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
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
    
    closeAddEditModal() {
      this.showAddEditModal = false;
      this.resetFormData();
    },
    
    resetFormData() {
      if (this.currentTab === 'location') {
        this.formData = {
          addressName: '',
          addressExt: '',
          type: 1,
          safeLevelId: 1,
          description: ''
        };
      } else {
        this.formData = {
          name: '',
          description: '',
          weight: '',
          status: 1
        };
      }
    },
    
    onLocationTypeChange(e) {
      this.formData.type = this.locationTypeOptions[e.detail.value].value;
    },
    
    onSafetyLevelChange(e) {
      this.formData.safeLevelId = this.safetyLevelOptions[e.detail.value].value;
    },
    
    onStatusChange(e) {
      this.formData.status = this.statusOptions[e.detail.value].value;
    },
    
    async saveData() {
      // 表单验证
      if (this.currentTab === 'location') {
        if (!this.formData.addressName.trim()) {
          uni.showToast({
            title: '请输入地址名称',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        if (!this.formData.addressExt.trim()) {
          uni.showToast({
            title: '请输入详细地址',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      } else {
        if (!this.formData.name.trim()) {
          uni.showToast({
            title: '请输入名称',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        if (!this.formData.weight || this.formData.weight <= 0) {
          uni.showToast({
            title: '请输入有效权重',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      }
      
      uni.showLoading({ title: this.isEdit ? '更新中...' : '保存中...' });
      try {
        const url = this.currentTab === 'location' 
          ? this.serverUrl + '/location/save'
          : this.serverUrl + '/safety/save';
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'POST',
            data: this.formData,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          uni.showToast({
            title: this.isEdit ? '更新成功' : '保存成功',
            icon: 'success',
            duration: 1500
          });
          this.closeAddEditModal();
          this.loadData();
        } else {
          throw new Error(result.data?.msg || '操作失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 工具方法
    getLocationTypeIcon(type) {
      const iconMap = {
        1: 'https://www.xiaobei.space/static/icons/location/community.png',
        2: 'https://www.xiaobei.space/static/icons/location/factory.png',
        3: 'https://www.xiaobei.space/static/icons/location/shop.png'
      };
      return iconMap[type] || iconMap[1];
    },
    
    getLocationTypeName(type) {
      const nameMap = { 1: '高层小区', 2: '重点单位', 3: '沿街商铺' };
      return nameMap[type] || '未知类型';
    },
    
    getLocationTypeText(type) {
      const option = this.locationTypeOptions.find(item => item.value === type);
      return option ? option.label : '请选择类型';
    },
    
    getSafetyLevelText(levelId) {
      const option = this.safetyLevelOptions.find(item => item.value === levelId);
      return option ? option.label : '请选择等级';
    },
    
         getStatusText(status) {
       const option = this.statusOptions.find(item => item.value === status);
       return option ? option.label : '请选择状态';
     }
  }
}
</script>

<style lang="scss" scoped>
.data-management {
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.back-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 10rpx;
}

.back-text {
  font-size: 28rpx;
  color: #333;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.header-right {
  width: 80rpx;
}

/* 标签页 */
.tab-container {
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
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
  padding: 20rpx 0;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #07c160;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #07c160;
  border-radius: 2rpx;
}

.tab-icon {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 8rpx;
}

.tab-text {
  font-size: 24rpx;
  color: #666;
}

.tab-item.active .tab-text {
  color: #07c160;
  font-weight: 500;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.action-left {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: none;
  background: #f5f5f5;
  color: #666;
}

.add-btn {
  background: #07c160;
  color: #fff;
}

.refresh-btn {
  background: #1890ff;
  color: #fff;
}

.btn-icon {
  width: 24rpx;
  height: 24rpx;
  margin-right: 8rpx;
}

.data-count {
  font-size: 24rpx;
  color: #999;
}

/* 数据列表 */
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
  width: 80rpx;
  height: 80rpx;
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

.type-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 12rpx;
}

.title-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.item-actions {
  display: flex;
  gap: 12rpx;
}

.action-icon-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon-btn.delete-btn {
  background: #ff4d4f;
}

.action-icon {
  width: 32rpx;
  height: 32rpx;
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

.status-active {
  color: #07c160;
}

.status-inactive {
  color: #ff4d4f;
}

/* 弹窗样式 */
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
  width: 90%;
  max-height: 80%;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  padding: 30rpx;
  overflow-y: auto;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.form-input {
  height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  background: #fafafa;
}

.form-textarea {
  height: 120rpx;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  background: #fafafa;
  resize: none;
}

.form-picker {
  height: 80rpx;
}

.picker-display {
  height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28rpx;
  color: #333;
}

.picker-arrow {
  width: 24rpx;
  height: 24rpx;
}

.modal-footer {
  display: flex;
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #07c160;
  color: #fff;
}
</style> 