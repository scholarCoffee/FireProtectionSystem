<template>
  <view class="safety-score-edit">
    <!-- 表单内容 -->
    <scroll-view class="form-container" scroll-y="true">
      <view class="form-content">
        <!-- 评分项列表 -->
        <view class="score-items-section">
          <view class="section-header">
            <text class="section-title">安全评分配置</text>
          </view>
          
          <!-- 评分项列表 -->
          <view class="score-items-list">
            <view class="score-item" v-for="(item, key) in scoreItems" :key="key">
              <view class="item-header">
                <text class="item-name">{{ getScoreItemName(key) }}</text>
                <view class="item-score">
                  <text class="score-value">{{ item.score }}分</text>
                </view>
              </view>
              
              <!-- 选项列表 -->
              <view class="options-list">
                <view 
                  class="option-item" 
                  v-for="option in getScoreItemOptions(key)" 
                  :key="option.score"
                  :class="{ 'active': item.score === option.score }"
                  @tap="selectOption(key, option)"
                >
                  <view class="option-content">
                    <text class="option-score">{{ option.score }}分</text>
                    <text class="option-text">{{ option.text }}</text>
                  </view>
                  <view class="option-check" v-if="item.score === option.score">
                    <image :src="serverUrl + '/static/icons/common/check.png'" class="check-icon" />
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 总分显示 -->
        <view class="total-score-section">
          <view class="total-score-display">
            <text class="total-score-label">总分：</text>
            <text class="total-score-value">{{ calculateTotalScore() }}分</text>
            <text class="total-score-level">({{ getSafetyLevelText(getSafetyLevelByScore(calculateTotalScore())) }})</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="footer-btn cancel-btn" @tap="goBack">取消</button>
      <button class="footer-btn confirm-btn" @tap="saveData">保存</button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SafetyScoreEdit',
  data() {
    return {
      mode: 'add', // add 或 edit
      addressId: '',
      scoreItems: {},
      serverUrl: this.$store?.state?.serverUrl || ''
    }
  },
  onLoad(options) {
    this.mode = options.mode || 'add';
    this.addressId = options.addressId || '';
    
    this.initScoreItems();
    
    if (this.mode === 'edit') {
      this.loadEditData();
    }
  },
  methods: {
    // 初始化评分项
    initScoreItems() {
      this.scoreItems = {
        naturalWaterSource: { score: 0, option: '无', itemId: 'naturalWaterSource' },
        outdoorHydrant: { score: 0, option: '无', itemId: 'outdoorHydrant' },
        vehicleAccess: { score: 0, option: '消防车不通行', itemId: 'vehicleAccess' },
        outdoorHydrantWater: { score: 0, option: '无水', itemId: 'outdoorHydrantWater' },
        controlRoom: { score: 0, option: '都不可', itemId: 'controlRoom' },
        buildingHydrant: { score: 0, option: '全部没水', itemId: 'buildingHydrant' },
        fireElevator: { score: 0, option: '都没有', itemId: 'fireElevator' },
        stairwellType: { score: 0, option: '都不是', itemId: 'stairwellType' },
        unitConnection: { score: 0, option: '全不贯通', itemId: 'unitConnection' },
        emergencyTeam: { score: 0, option: '无', itemId: 'emergencyTeam' }
      };
    },
    
    // 获取评分项中文名称
    getScoreItemName(key) {
      const nameMap = {
        'naturalWaterSource': '天然河流',
        'outdoorHydrant': '周边消火栓',
        'vehicleAccess': '单位通行',
        'outdoorHydrantWater': '室外消火栓',
        'controlRoom': '消防控制室好用',
        'buildingHydrant': '室内消火栓',
        'fireElevator': '有无消防电梯',
        'stairwellType': '楼梯间类型',
        'unitConnection': '单元之间是否贯通',
        'emergencyTeam': '快速处置小分队'
      };
      return nameMap[key] || key;
    },
    
    // 获取评分项选项
    getScoreItemOptions(key) {
      const optionsMap = {
        naturalWaterSource: [
          { score: 0, text: '无' },
          { score: 10, text: '有' }
        ],
        outdoorHydrant: [
          { score: 0, text: '无' },
          { score: 10, text: '有' }
        ],
        vehicleAccess: [
          { score: 0, text: '消防车不通行' },
          { score: 5, text: '消防车通行' },
          { score: 10, text: '云梯通行' }
        ],
        outdoorHydrantWater: [
          { score: 0, text: '无水' },
          { score: 10, text: '有水' }
        ],
        controlRoom: [
          { score: 0, text: '都不可' },
          { score: 5, text: '只启泵' },
          { score: 10, text: '能启泵排烟' }
        ],
        buildingHydrant: [
          { score: 0, text: '全部没水' },
          { score: 5, text: '部分没水' },
          { score: 10, text: '都有水' }
        ],
        fireElevator: [
          { score: 0, text: '都没有' },
          { score: 5, text: '部分有' },
          { score: 10, text: '全部有' }
        ],
        stairwellType: [
          { score: 0, text: '都不是' },
          { score: 5, text: '部分是防烟楼梯间' },
          { score: 10, text: '都是防烟楼梯间' }
        ],
        unitConnection: [
          { score: 0, text: '全不贯通' },
          { score: 5, text: '部分贯通' },
          { score: 10, text: '都贯通' }
        ],
        emergencyTeam: [
          { score: 0, text: '无' },
          { score: 10, text: '有' }
        ]
      };
      return optionsMap[key] || [];
    },
    
    // 选择选项
    selectOption(key, option) {
      this.scoreItems[key] = {
        score: option.score,
        option: option.text,
        itemId: key
      };
    },
    
    // 计算总分
    calculateTotalScore() {
      let totalScore = 0;
      for (const key in this.scoreItems) {
        if (this.scoreItems[key] && typeof this.scoreItems[key].score === 'number') {
          totalScore += this.scoreItems[key].score;
        }
      }
      return totalScore;
    },
    
    // 根据总分获取安全等级
    getSafetyLevelByScore(totalScore) {
      if (totalScore >= 90) {
        return 1; // 优秀
      } else if (totalScore >= 70) {
        return 2; // 一般
      } else {
        return 3; // 较差
      }
    },
    
    // 获取安全等级文本
    getSafetyLevelText(levelId) {
      const levelMap = {
        1: '优秀',
        2: '一般',
        3: '较差'
      };
      return levelMap[levelId] || '未知';
    },
    
    // 加载编辑数据
    async loadEditData() {
      uni.showLoading({ title: '加载中...' });
      try {
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/detail',
            method: 'GET',
            data: { addressId: this.addressId },
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          const responseData = result.data.data;
          if (responseData.fireSafetyScore && responseData.fireSafetyScore.scoreItems) {
            this.scoreItems = { ...responseData.fireSafetyScore.scoreItems };
          }
        } else {
          throw new Error(result.data?.msg || '加载数据失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '加载数据失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 返回
    goBack() {
      uni.navigateBack();
    },
    
    // 保存数据
    async saveData() {
      uni.showLoading({ title: this.mode === 'edit' ? '更新中...' : '保存中...' });
      try {
        const url = this.serverUrl + '/safety-score/save';
        const data = {
          addressId: this.addressId,
          scoreItems: this.scoreItems
        };
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'POST',
            data: data,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          uni.showToast({
            title: this.mode === 'edit' ? '更新成功' : '保存成功',
            icon: 'success',
            duration: 1500
          });
          
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
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
    }
  }
}
</script>

<style lang="scss" scoped>
.safety-score-edit {
  height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
}

/* 表单容器 */
.form-container {
  flex: 1;
  padding: 0;
  padding-bottom: 160rpx;
  height: calc(100vh - 160rpx);
}

.form-content {
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  border: none;
  margin-top: 20rpx;
}

/* 评分项样式 */
.score-items-section {
  background: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1890ff;
}

.score-items-list {
  padding: 0 32rpx;
}

.score-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.item-score {
  display: flex;
  align-items: center;
}

.score-value {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 600;
  background: linear-gradient(135deg, #e6f7ff 0%, #d6f4ff 100%);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

/* 选项列表样式 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
  
  &.active {
    background: #e6f7ff;
    border-color: #1890ff;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.option-content {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.option-score {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 600;
  min-width: 60rpx;
}

.option-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 400;
}

.option-check {
  display: flex;
  align-items: center;
}

.check-icon {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.8;
}

/* 总分显示样式 */
.total-score-section {
  margin-top: 20rpx;
  background: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.total-score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
}

.total-score-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.total-score-value {
  font-size: 36rpx;
  color: #1890ff;
  font-weight: 600;
  margin: 0 8rpx;
}

.total-score-level {
  font-size: 24rpx;
  color: #666666;
  font-weight: 400;
}

/* 底部按钮 */
.footer {
  display: flex;
  padding: 20rpx 32rpx;
  gap: 20rpx;
  background: #ffffff;
  border-top: 1rpx solid #e5e5e5;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.footer-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  &::before {
    display: none;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.cancel-btn {
  background: #ffffff;
  color: #666666;
  border: 1rpx solid #e5e5e5;
  
  &:active {
    background: #f8f8f8;
  }
}

.confirm-btn {
  background: #1890ff;
  color: #ffffff;
  
  &:active {
    background: #096dd9;
  }
}
</style>
