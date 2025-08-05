<template>
  <view class="filter-bar">
    <!-- 搜索框 -->
    <view class="search-container">
      <view class="search-input-wrapper">
        <image :src="serverUrl + '/static/icons/common/search.png'" class="search-icon" />
        <input 
          v-model="searchKeyword" 
          class="search-input" 
          placeholder="搜索地址ID或地址名称"
          @input="onSearchInput"
          @confirm="onSearchConfirm"
        />
        <view v-if="searchKeyword" class="clear-btn" @tap="clearSearch">
          <image :src="serverUrl + '/static/icons/common/clear.png'" class="clear-icon" />
        </view>
      </view>
    </view>
    
    <!-- 类型筛选 -->
    <view class="filter-container">
      <view class="filter-label">类型筛选：</view>
      <view class="filter-options">
        <view 
          class="filter-option" 
          :class="{ active: selectedTypes.length === 0 }"
          @tap="selectAllTypes"
        >
          <text>全部</text>
        </view>
        <view 
          v-for="type in typeOptions" 
          :key="type.value"
          class="filter-option" 
          :class="{ active: isTypeSelected(type.value) }"
          @tap="toggleType(type.value)"
        >
          <text>{{ type.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'FilterBar',
  props: {
    typeOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space/api',
      searchKeyword: '',
      selectedTypes: []
    }
  },
  methods: {
    onSearchInput(e) {
      this.searchKeyword = e.detail.value;
      this.$emit('search-change', this.searchKeyword);
    },
    
    onSearchConfirm() {
      this.$emit('search-confirm', this.searchKeyword);
    },
    
    clearSearch() {
      this.searchKeyword = '';
      this.$emit('search-change', '');
    },
    
    selectAllTypes() {
      this.selectedTypes = [];
      this.$emit('type-change', []);
    },
    
    toggleType(typeValue) {
      const index = this.selectedTypes.indexOf(typeValue);
      if (index > -1) {
        this.selectedTypes.splice(index, 1);
      } else {
        this.selectedTypes.push(typeValue);
      }
      this.$emit('type-change', this.selectedTypes);
    },
    
    isTypeSelected(typeValue) {
      return this.selectedTypes.includes(typeValue);
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-bar {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border-bottom: 1rpx solid rgba(24, 144, 255, 0.1);
  padding: 20rpx 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.05);
}

/* 搜索框样式 */
.search-container {
  margin-bottom: 20rpx;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 12rpx;
  border: 1rpx solid rgba(24, 144, 255, 0.2);
  padding: 0 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.1);
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: #1890ff;
    box-shadow: 0 2rpx 12rpx rgba(24, 144, 255, 0.2);
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
  height: 72rpx;
  border: none;
  background: transparent;
  font-size: 28rpx;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  &::placeholder {
    color: #bfbfbf;
    font-size: 28rpx;
  }
}

.clear-btn {
  padding: 8rpx;
  margin-left: 8rpx;
}

.clear-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.6;
}

/* 筛选条件样式 */
.filter-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
}

.filter-label {
  font-size: 28rpx;
  color: #1890ff;
  font-weight: 600;
  margin-right: 8rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-option {
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
  background: #ffffff;
  border: 1rpx solid rgba(24, 144, 255, 0.2);
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  &:active {
    transform: translateY(1rpx);
  }
  
  &.active {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    color: #ffffff;
    border-color: #1890ff;
    box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
  }
}

/* 移动端优化 */
@media (max-width: 750rpx) {
  .filter-bar {
    padding: 16rpx 24rpx;
  }
  
  .search-input-wrapper {
    padding: 0 16rpx;
  }
  
  .search-input {
    height: 68rpx;
    font-size: 26rpx;
    
    &::placeholder {
      font-size: 26rpx;
    }
  }
  
  .filter-label {
    font-size: 26rpx;
  }
  
  .filter-option {
    padding: 10rpx 16rpx;
    font-size: 24rpx;
  }
}

/* 超小屏幕优化 */
@media (max-width: 600rpx) {
  .filter-bar {
    padding: 12rpx 20rpx;
  }
  
  .search-input-wrapper {
    padding: 0 12rpx;
  }
  
  .search-input {
    height: 64rpx;
    font-size: 24rpx;
    
    &::placeholder {
      font-size: 24rpx;
    }
  }
  
  .filter-label {
    font-size: 24rpx;
  }
  
  .filter-option {
    padding: 8rpx 12rpx;
    font-size: 22rpx;
  }
}
</style> 