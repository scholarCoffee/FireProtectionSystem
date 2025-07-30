<template>
  <view class="safety-detail-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-content">
        <image src="/static/icons/common/loading.png" class="loading-icon" />
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
    <view class="filter-bar">
      <view class="filter-group">
        <text :class="['filter-btn', filterScore === null ? 'active' : '']" @tap="setFilterScore(null)">全部</text>
        <text :class="['filter-btn', filterScore === 0 ? 'active' : '']" @tap="setFilterScore(0)">0分</text>
        <text :class="['filter-btn', filterScore === 5 ? 'active' : '']" @tap="setFilterScore(5)">5分</text>
        <text :class="['filter-btn', filterScore === 10 ? 'active' : '']" @tap="setFilterScore(10)">10分</text>
      </view>
      <view class="sort-group">
        <text :class="['sort-btn', sortOrder === 'desc' ? 'active' : '']" @tap="setSortOrder('desc')">降序</text>
        <text :class="['sort-btn', sortOrder === 'asc' ? 'active' : '']" @tap="setSortOrder('asc')">升序</text>
      </view>
    </view>
    <!-- 评分明细 -->
    <view class="score-details">
      <view class="detail-list">
        <view class="detail-item" v-for="(itemConf, index) in filteredAndSortedScoreItems" :key="itemConf.id">
          <view class="item-header">
            <view class="item-title">
              <image :src="getCategoryIcon(itemConf.id)" class="category-icon" />
              <text>{{ itemConf.name }}</text>
            </view>
            <view class="item-score">
              <text class="score">{{ getScoreLabelByConf(itemConf) }}</text>
            </view>
          </view>
          <!-- 新增：进度条展示得分/总分 -->
          <view class="item-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: getScorePercent(itemConf) + '%', backgroundColor: safetyLevelInfo.cssColor }"></view>
            </view>
            <view class="progress-score-text">
              <text>{{ itemConf.actualScore || 0 }}/{{ itemConf.weight || 10 }}分</text>
            </view>
          </view>
          <view class="item-details">
            <view class="sub-item">
              <view class="sub-item-left">
                <text class="sub-title">{{ itemConf.description || '' }}</text>
                <text class="sub-option">{{ getOptionLabel(itemConf) }}</text>
              </view>
              <text class="sub-score">{{ getScoreLabelByConf(itemConf) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <!-- 底部间距 -->
    <view class="bottom-spacing"></view>
  </view>
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
    // 动态评分明细，按config.categories顺序分组
    categoryDetails() {
      if (!this.config.categories.length) return [];
      const categories = this.config.categories.map(cat => ({
        ...cat,
        score: 0,
        maxScore: 0,
        items: []
      }));
      // 评分项配置
      const itemConfigMap = {};
      (this.config.scoreItems || []).forEach(item => {
        itemConfigMap[item.id] = item;
      });
      // 评分项分组
      Object.keys(this.safetyData.scoreItems || {}).forEach(itemId => {
        const itemScore = this.safetyData.scoreItems[itemId];
        const itemConf = itemConfigMap[itemId];
        if (!itemConf) return;
        const catIdx = categories.findIndex(c => c.name === itemConf.category || c.id === itemConf.category);
        if (catIdx > -1) {
          categories[catIdx].maxScore += itemConf.weight;
          categories[catIdx].score += itemScore.score;
          categories[catIdx].items.push({
            name: itemConf.name,
            score: itemScore.score,
            option: itemScore.option
          });
        }
      });
      return categories;
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
            uni.showToast({
              title: '数据加载成功',
              icon: 'success',
              duration: 1500
            });
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '网络错误，使用模拟数据',
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
      return '/static/icons/location/' + id + '.png';
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
    }
  }
};
</script>

<style scoped>
.safety-detail-container {
  min-height: 100vh;
  height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 100px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
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
  background: linear-gradient(134deg, #2196f3, #1890ff);
  margin: 10px;
  border-radius: 16px;
  padding: 12px 24px;
  box-shadow: 0 8px 24px #2196f370;
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
  background-color: hsla(0, 0%, 100%, .6);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff, #ffffff);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
  font-weight: bold;
}

/* 评分明细卡片 */
.score-details {
  background-color: #FFF;
  margin: 10px;
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
.item-score {
  display: flex;
  align-items: center;
  gap: 2px;
}
.score {
  font-size: 18px;
  font-weight: bold;
  color:#FF6B35;
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
.item-progress .progress-fill {
  background: linear-gradient(90deg, #1890FF, #40A9FF);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.item-progress .progress-score-text {
  display: flex;
  justify-content: flex-end;
  font-weight: bold;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}
.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.sub-item {
  display: flex;
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
.sub-title {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
}
.sub-option {
  font-size: 11px;
  color: #1890FF;
  background: rgba(24, 144, 255, 0.1);
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
  color: #1890FF;
  font-weight: bold;
  background: rgba(24, 144, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 40px;
  text-align: center;
}

/* 安全建议 */
.safety-suggestions {
  background-color: #FFF;
  margin: 10px;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.suggestion-icon {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #FF6B35, #FF8E53);
  color: #FFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
}

.suggestion-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  flex: 1;
}

/* 筛选区 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 0 16px;
  margin-bottom: 2px;
}
.filter-group, .sort-group {
  display: flex;
  gap: 8px;
}
.filter-btn, .sort-btn {
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 3px 12px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.filter-btn.active, .sort-btn.active {
  color: #fff;
  background: #1890FF;
}

/* 底部间距 */
.bottom-spacing {
  height: 60px;
  width: 100%;
}

/* 安全等级颜色 */
.safety-excellent { background-color: #52c41a; }
.safety-normal { background-color: #faad14; }
.safety-poor { background-color: #ff4d4f; }
</style> 