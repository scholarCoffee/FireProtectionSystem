<template>
  <scroll-view class="safety-detail-container" scroll-y="true" @scroll="handleScroll" :scroll-top="scrollTop">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-content">
        <image :src="serverUrl + '/static/icons/common/loading.png'" class="loading-icon" />
        <text class="loading-text">正在加载安全详情...</text>
      </view>
    </view>
    
    <!-- 顶部安全等级卡片 -->
    <view class="safety-header">
      <view class="safety-overview">
        <view class="safety-level">
          <view class="level-tag" :class="safetyLevelInfo.cssClass" :style="{ backgroundColor: safetyLevelInfo.cssColor }">
            <text>{{ safetyLevelInfo.level }}</text>
          </view>
        </view>
        <view class="safety-score">
          <text class="score-value">{{ safetyData.totalScore || 0 }}分</text>
        </view>
      </view>
      <view class="safety-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%', backgroundColor: safetyLevelInfo.cssColor }"></view>
        </view>
        <text class="progress-text">{{ safetyData.totalScore || 0 }}/{{ safetyData.maxPossibleScore || 100 }}分</text>
      </view>
    </view>
    
    <!-- 筛选区 -->
    <view class="filter-bar" :class="{ 'filter-bar-fixed': isFilterFixed }">
      <view class="filter-header" @tap="toggleFilter">
        <view class="filter-header-left">
          <image :src="serverUrl + '/static/icons/location/filter.png'" class="filter-icon" />
          <text class="filter-title">筛选条件</text>
        </view>
        <image :src="isFilterExpanded ? serverUrl + '/static/icons/common/up.png' : serverUrl + '/static/icons/common/down.png'" class="filter-arrow" />
      </view>
      <view class="filter-content" v-if="isFilterExpanded">
        <view class="filter-section">
          <text class="filter-section-title">分数筛选</text>
          <view class="filter-group">
            <text :class="['filter-btn', filterScore === null ? 'active' : '']" @tap="setFilterScore(null)">全部</text>
            <text :class="['filter-btn', filterScore === 0 ? 'active' : '']" @tap="setFilterScore(0)">0分</text>
            <text :class="['filter-btn', filterScore === 5 ? 'active' : '']" @tap="setFilterScore(5)">5分</text>
            <text :class="['filter-btn', filterScore === 10 ? 'active' : '']" @tap="setFilterScore(10)">10分</text>
          </view>
        </view>
        <view class="filter-section">
          <text class="filter-section-title">排序方式</text>
          <view class="sort-group">
            <text :class="['sort-btn', sortOrder === 'desc' ? 'active' : '']" @tap="setSortOrder('desc')">降序</text>
            <text :class="['sort-btn', sortOrder === 'asc' ? 'active' : '']" @tap="setSortOrder('asc')">升序</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 占位元素，防止固定时内容跳动 -->
    <view class="filter-placeholder" v-if="isFilterFixed"></view>
    
    <!-- 评分明细 -->
    <view class="score-details">
      <view class="detail-list">
        <!-- 有数据时显示列表 -->
        <view v-if="filteredAndSortedScoreItems.length > 0">
          <view class="detail-item" v-for="(itemConf, index) in filteredAndSortedScoreItems" :key="itemConf.id">
            <view class="item-header">
              <view class="item-title">
                <image :src="getCategoryIcon(itemConf.id)" class="category-icon" />
                <text>{{ itemConf.name }}</text>
              </view>
            </view>
            <view class="item-details">
              <view class="sub-item">
                <view class="sub-item-left">
                  <view class="sub-item-left-top">
                    <view class="sub-title">{{ itemConf.description || '' }}</view>
                    <view class="sub-option">{{ getOptionLabel(itemConf) }}</view>
                  </view>
                  <view class="sub-score">{{ getScoreLabelByConf(itemConf) }}</view>
                </view>
                <!-- 进度条移到sub-item下方 -->
                <view class="item-progress">
                  <view class="progress-bar">
                    <view class="progress-fill" :style="{ width: getScorePercent(itemConf) + '%', backgroundColor: safetyLevelInfo.cssColor }"></view>
                  </view>
                  <view class="progress-score-text">
                    <text>{{ itemConf.actualScore || 0 }}/{{ itemConf.weight || 10 }}分</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <!-- 无数据时显示空状态 -->
        <view v-else class="empty-state">
          <image :src="serverUrl + '/static/icons/common/no-data.png'" class="empty-icon" />
          <text class="empty-title">暂无数据</text>
          <text class="empty-desc">当前筛选条件下没有找到相关评分项</text>
          <view class="empty-action" @tap="clearFilter">
            <text class="action-btn">清除筛选</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部间距 -->
    <view class="bottom-spacing"></view>
  </scroll-view>
</template>

<script>
export default {
  data() {
    return {
      safeId: null,
      loading: false,
      safetyData: {
        safeId: '',
        addressId: '',
        addressName: '',
        totalScore: 0,
        maxPossibleScore: 100,
        scorePercentage: 0,
        safetyLevel: '一般',
        safetyColor: '黄色',
        safetyCssClass: 'safety-normal',
        safetyCssColor: '#faad14',
        scoreItems: {},
        configVersion: '1.0.0',
        createTime: null,
        updateTime: null
      },
      config: {
        configVersion: '',
        configName: '',
        description: '',
        scoreConfig: {
          maxScore: 100,
          safetyLevels: [],
        },
        scoreItems: [],
        categories: []
      },
      filterScore: null, // 分数筛选
      sortOrder: 'desc', // 排序方式
      isFilterExpanded: false, // 筛选区展开状态
      isFilterFixed: false, // 筛选区是否固定
      scrollTop: 0, // 滚动位置
    };
  },
  
  onLoad(data) {
    const { safeId } = data || {};
    this.safeId = safeId;
    this.fetchSafetyDetail();
  },
  
  computed: {
    progressPercent() {
      return this.safetyData.scorePercentage || 0;
    },
    // 动态安全等级样式
    safetyLevelInfo() {
      const levels = (this.config.scoreConfig && this.config.scoreConfig.safetyLevels) || [];
      const score = this.safetyData.totalScore || 0;
      for (const lv of levels) {
        if (score >= lv.minScore && score <= lv.maxScore) {
          return lv;
        }
      }
      return levels[0] || { level: '一般', cssClass: 'safety-normal', cssColor: '#faad14' };
    },
    filteredAndSortedScoreItems() {
      // 只根据scoreItems罗列，不分组
      let arr = (this.config.scoreItems || []).map(conf => {
        // 取实际得分
        const scoreObj = (this.safetyData.scoreItems || {})[conf.id] || {};
        return {
          ...conf,
          actualScore: scoreObj.score,
          actualOption: scoreObj.option
        };
      });
      if (this.filterScore !== null) {
        arr = arr.filter(i => i.actualScore === this.filterScore);
      }
      arr = arr.slice().sort((a, b) => {
        if (this.sortOrder === 'desc') return (b.actualScore || 0) - (a.actualScore || 0);
        return (a.actualScore || 0) - (b.actualScore || 0);
      });
      return arr;
    }
  },
  
  methods: {
    fetchSafetyDetail() {
      this.loading = true;
      uni.showLoading({ title: '加载中...' });
      
      // 这里调用接口获取安全详情数据
      uni.request({
        url: this.serverUrl + '/fireSafetyScore/detail',
        method: 'GET',
        data: { safeId: this.safeId },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            // 兼容后端返回结构
            const detail = res.data.data.detail || res.data.data;
            const config = res.data.data.config || {};
            this.safetyData = detail;
            this.config = config;
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '查询数据出错，请稍后重试',
            icon: 'none',
            duration: 2000
          });
        },
        complete: () => {
          this.loading = false;
          uni.hideLoading();
        }
      });
    },   
    getCategoryIcon(id) {
      // 兼容原有逻辑
      switch (id) {
        case 'naturalWaterSource':
        case 'outdoorHydrantWater':
        case 'buildingHydrant':
          return this.serverUrl + '/static/icons/location/waterSource.png';
        case 'unitConnection':
          return this.serverUrl + '/static/icons/location/evacuation.png';
        case 'vehicleAccess':
          return this.serverUrl + '/static/icons/location/roadAccess.png';
        case 'outdoorHydrant':
          return this.serverUrl + '/static/icons/location/fireFacilities.png';
        case 'controlRoom':
        case 'fireElevator':
          return this.serverUrl + '/static/icons/location/controlSystem.png';
        case 'stairwellType':
        case 'emergencyTeam':
          return this.serverUrl + '/static/icons/location/emergencyManagement.png';
        default:
      }
    },
    setFilterScore(score) {
      this.filterScore = score;
    },
    setSortOrder(order) {
      this.sortOrder = order;
    },
    getScoreLabelByConf(itemConf) {
      if (itemConf.actualScore !== undefined) return (itemConf.actualScore || 0) + '分';
      return '0分';
    },
    getOptionLabel(itemConf) {
      return itemConf.actualOption || '';
    },
    getScorePercent(itemConf) {
      if (itemConf.weight === 0) return 0; // 避免除以0
      return (itemConf.actualScore / itemConf.weight) * 100;
    },
    toggleFilter() {
      this.isFilterExpanded = !this.isFilterExpanded;
    },
    clearFilter() {
      this.filterScore = null;
      this.sortOrder = 'desc';
    },
    handleScroll(e) {
      const scrollTop = e.detail.scrollTop;
      this.scrollTop = scrollTop;
      
      // 筛选区距离顶部的距离（调整阈值）
      const filterOffsetTop = 150; // 降低触发阈值
      const shouldFix = scrollTop > filterOffsetTop;
      console.log('滚动位置:', scrollTop, '是否固定:', shouldFix);
      this.isFilterFixed = shouldFix;
    }
  }
};
</script>

<style scoped>
.safety-detail-container {
  height: 100vh;
  background-color: #f5f5f5;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  padding-bottom: 0;
}

/* 加载状态 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-icon {
  width: 48px;
  height: 48px;
  animation: rotate 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  color: #666;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 恢复最初主色调：安全等级色为主，卡片白色，分数/进度条用原色 */
.safety-header {
  background: linear-gradient(135deg, #667eea 0%, #007aff 100%);
  margin: 10px;
  border-radius: 16px;
  padding: 12px 24px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  position: relative;
  overflow: hidden;
}
.safety-header::before {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
.safety-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.safety-level {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.level-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}
.level-tag {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  color: #FFF;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}
.safety-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.score-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}
.score-value {
  font-size: 36px;
  font-weight: bold;
  color: #FFFFFF;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.safety-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.progress-bar {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFFFFF, rgba(255, 255, 255, 0.9));
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
}

/* 评分明细卡片 */
.score-details {
  margin: 10px;
}
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.detail-item {
  padding: 18px;
  background: linear-gradient(135deg, #FFFFFF, #F8F9FA);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin-bottom: 10px;
}
.detail-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}
.category-icon {
  width: 16px;
  height: 16px;
}
.total {
  font-size: 12px;
  color: #999;
}
.item-progress {
  margin-bottom: 10px;
}
.item-progress .progress-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.sub-item {
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  background: linear-gradient(135deg, #F8F9FA, #FFFFFF);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  margin-bottom: 8px;
}
.sub-item:hover {
  background: linear-gradient(135deg, #E3F2FD, #F8F9FA);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.sub-item-left {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 4px;
}
.sub-title {
  font-size: 12px;
  color: #353535;
  font-weight: 500;
  line-height: 1.4;
}
.sub-option {
  font-size: 11px;
  color: #fff;
  background: #007affd1;;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  word-break: break-all;
  white-space: pre-line;
  max-width: 100%;
  line-height: 1.6;
}
.sub-score {
  font-size: 14px;
  color: #007affd1;;
  font-weight: bold;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 40px;
  text-align: center;
  align-self: flex-start;
  margin-top: 2px;
}
.item-progress {
  width: 100%;
  margin: 8px 0;
}
.item-progress .progress-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}
.item-progress .progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #007aff 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.progress-score-text {
  font-size: 11px;
  color: #FF8A65;
  font-weight: bold;
  text-align: right;
}
/* 筛选区 */
.filter-bar {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin: 10px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.04);
  transition: all 0.3s ease;
  z-index: 100;
}
.filter-bar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  border-radius: 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  width: 100%;
  background: #fff;
}
.filter-placeholder {
  height: 60px; /* 减小占位高度 */
  width: 100%;
}
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.filter-header:active {
  background-color: #f8f9fa;
}
.filter-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}
.filter-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.filter-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}
.filter-content {
  padding: 0 16px 16px 16px;
  border-top: 1px solid #f0f0f0;
  animation: slideDown 0.3s ease;
}
.filter-section {
  margin-bottom: 12px;
}
.filter-section:last-child {
  margin-bottom: 0;
}
.filter-section-title {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 6px;
  display: block;
}
.filter-group, .sort-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-btn, .sort-btn {
  font-size: 13px;
  color: #666;
  background: #f8f9fa;
  border-radius: 16px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  font-weight: 500;
}
.filter-btn.active, .sort-btn.active {
  color: #fff;
  background: #667eea;
  border-color: #667eea;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}
.filter-btn.score-0.active {
  background: #95a5a6;
  border-color: #95a5a6;
  box-shadow: 0 2px 6px rgba(149, 165, 166, 0.3);
}
.filter-btn.score-5.active {
  background: #3498db;
  border-color: #3498db;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}
.filter-btn.score-10.active {
  background: #e67e22;
  border-color: #e67e22;
  box-shadow: 0 2px 6px rgba(230, 126, 34, 0.3);
}
.filter-btn:hover, .sort-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}
.empty-icon {
  width: 80px;
  height: 80px;
  opacity: 0.5;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}
.empty-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
  line-height: 1.5;
}
.empty-action {
  margin-top: 8px;
}
.action-btn {
  background: #667eea;
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.action-btn:active {
  transform: scale(0.95);
  background: #5a6fd8;
}
.bottom-spacing {
  height: 100px;
  width: 100%;
  background: transparent;
  min-height: 100px;
}
</style> 