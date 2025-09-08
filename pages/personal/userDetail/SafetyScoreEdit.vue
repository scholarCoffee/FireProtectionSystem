<template>
  <view class="safety-score-edit">
    <!-- 头部总分显示 -->
    <view class="header-score-section">
      <view class="total-score-display">
        <view class="score-header">
          <text class="total-score-label">总分：</text>
          <text class="total-score-value">{{ calculateTotalScore() }}分</text>
          <text class="total-score-level" :class="safetyLevelClass">({{ safetyLevelText }})</text>
        </view>
        
        <!-- 分数进度条 -->
        <view class="score-progress-container">
          <view class="progress-bar">
            <view 
              class="progress-fill" 
              :style="{ width: Math.min(calculateTotalScore(), 100) + '%' }"
              :class="progressBarClass"
            ></view>
          </view>
          <view class="progress-labels">
            <text class="progress-label">0分</text>
            <text class="progress-label">50分</text>
            <text class="progress-label">100分</text>
          </view>
        </view>
      </view>
      
      <!-- 评分标准图标 -->
      <view class="score-standard-icon" @tap="showScoreStandard">
        <text class="icon-text">评分标准</text>
        <image :src="serverUrl + '/static/icons/common/question-active.png'" class="info-icon" />
      </view>
    </view>

    <!-- 表单内容 -->
    <scroll-view class="form-container" scroll-y="true">
      <view class="form-content">
        <!-- 评分项列表 -->
        <view class="score-items-section">
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
                    <image :src="serverUrl + '/static/icons/common/check-green.png'" class="check-icon" />
                  </view>
                </view>
                
                <!-- 备注输入框 -->
                <view class="remark-section" v-if="item.score !== undefined">
                  <textarea 
                    v-model="item.remark" 
                    class="remark-input" 
                    :placeholder="getRemarkPlaceholder(key, item.score)"
                    maxlength="200"
                    auto-height
                    show-confirm-bar="false"
                  />
                  <text class="remark-count">{{ (item.remark || '').length }}/200</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="footer-btn cancel-btn" @tap="goBack">取消</button>
      <button class="footer-btn confirm-btn" @tap="saveData">保存</button>
    </view>

    <!-- 评分标准弹窗 -->
    <view class="score-standard-modal" v-if="showScoreStandardModal" @tap="hideScoreStandard">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">评分标准</text>
          <view class="close-btn" @tap="hideScoreStandard">
            <text class="close-icon">×</text>
          </view>
        </view>
        <scroll-view class="modal-body" scroll-y="true">
          <view class="standard-content">
            <view class="standard-item" v-for="(item, index) in scoreStandardList" :key="index">
              <view class="item-number">{{ index + 1 }}</view>
              <view class="item-content">
                <text class="item-title">{{ item.title }}</text>
                <view class="item-scores">
                  <text class="score-item" v-for="score in item.scores" :key="score.points">
                    {{ score.text }}：{{ score.points }}分
                  </text>
                </view>
              </view>
            </view>
            <view class="total-rule">
              <text class="rule-title">总分规则：</text>
              <text class="rule-content">100分，90分以上为优秀，70-89分为一般，70分以下为较差</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import { 
  scoreStandardList,
  getScoreItemName, 
  getScoreItemOptions,
  getSafetyLevelByScore,
  getSafetyLevelText,
  getSafetyLevelClass,
  getProgressBarClass
} from './components/safetyScoreData.js';

export default {
  name: 'SafetyScoreEdit',
  data() {
    return {
      mode: 'add', // add 或 edit
      serverUrl: 'https://www.xiaobei.space',
      addressId: '',
      safeId: '',
      scoreItems: {},
      showScoreStandardModal: false, // 控制评分标准弹窗的显示
      scoreStandardList: scoreStandardList // 使用导入的评分标准列表
    }
  },
  computed: {
    // 安全等级相关的计算属性
    safetyLevelClass() {
      const totalScore = this.calculateTotalScore();
      const level = getSafetyLevelByScore(totalScore);
      return getSafetyLevelClass(level);
    },
    
    safetyLevelText() {
      const totalScore = this.calculateTotalScore();
      const level = getSafetyLevelByScore(totalScore);
      return getSafetyLevelText(level);
    },
    
    progressBarClass() {
      const totalScore = this.calculateTotalScore();
      const level = getSafetyLevelByScore(totalScore);
      return getProgressBarClass(level);
    }
  },
  onLoad(options) {
    this.mode = options.mode || 'add';
    this.addressId = options.addressId || '';
    this.safeId = options.safeId || '';
    this.initScoreItems();
    
    if (this.mode === 'edit') {
      this.loadEditData();
    }
  },
  methods: {
    // 导入的函数，使其在模板中可用
    getScoreItemName,
    getScoreItemOptions,
    getSafetyLevelByScore,
    getSafetyLevelText,
    getSafetyLevelClass,
    getProgressBarClass,
    
    // 初始化评分项
    initScoreItems() {
      this.scoreItems = {
        naturalWaterSource: { score: 10, option: '有', itemId: 'naturalWaterSource', remark: '' },
        outdoorHydrant: { score: 10, option: '有', itemId: 'outdoorHydrant', remark: '' },
        vehicleAccess: { score: 10, option: '云梯通行', itemId: 'vehicleAccess', remark: '' },
        outdoorHydrantWater: { score: 10, option: '有水', itemId: 'outdoorHydrantWater', remark: '' },
        controlRoom: { score: 10, option: '能启泵排烟', itemId: 'controlRoom', remark: '' },
        buildingHydrant: { score: 10, option: '都有水', itemId: 'buildingHydrant', remark: '' },
        fireElevator: { score: 10, option: '全部有', itemId: 'fireElevator', remark: '' },
        stairwellType: { score: 10, option: '都是防烟楼梯间', itemId: 'stairwellType', remark: '' },
        unitConnection: { score: 10, option: '都贯通', itemId: 'unitConnection', remark: '' },
        emergencyTeam: { score: 10, option: '有', itemId: 'emergencyTeam', remark: '' }
      };
    },
    
    // 选择选项
    selectOption(key, option) {
      this.scoreItems[key] = {
        score: option.score,
        option: option.text,
        itemId: key,
        remark: this.scoreItems[key]?.remark || '' // 保留原有备注
      };
    },
    
    // 获取备注占位符文本
    getRemarkPlaceholder(key, score) {
      const options = getScoreItemOptions(key);
      const option = options.find(opt => opt.score === score);
      return option ? option.remark : '请填写备注信息';
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
    
    // 显示评分标准
    showScoreStandard() {
      this.showScoreStandardModal = true;
    },

    // 隐藏评分标准弹窗
    hideScoreStandard() {
      this.showScoreStandardModal = false;
    },
    
    // 保存数据
    async saveData() {
      // 验证评分项是否完整
      if (!this.validateScoreItems()) {
        uni.showToast({
          title: '请完善所有评分项',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      if (this.mode === 'edit' && this.addressId) {
        // 编辑模式：直接更新安全评分
        await this.updateSafetyScore();
      } else {
        // 新建模式：只保存到本地，不调用API
        this.saveSafetyScoreToLocal();
      }
    },
    
    // 验证评分项完整性
    validateScoreItems() {
      for (const key in this.scoreItems) {
        if (!this.scoreItems[key] || typeof this.scoreItems[key].score !== 'number') {
          return false;
        }
      }
      return true;
    },
    
    // 更新安全评分（编辑模式）
    async updateSafetyScore() {
      uni.showLoading({ title: '更新中...' });
      try {
        const url = this.serverUrl + '/fireSafetyScore/update';
        const data = {
          addressId: this.addressId,
          scoreItems: this.scoreItems,
          safeId: this.safeId
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
          this.handleSaveSuccess('更新成功');
        } else {
          throw new Error(result.data?.msg || '更新失败');
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 保存安全评分到本地（新建模式）
    saveSafetyScoreToLocal() {
      // 显示保存成功提示
      uni.showToast({
        title: '安全评分已保存',
        icon: 'success',
        duration: 1500
      });
      
      // 发送事件通知 DataEdit 页面
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel) {
        eventChannel.emit('safetyScoreUpdated', {
          scoreItems: this.scoreItems,
          isLocal: true,
          message: '安全评分已保存到本地，请在地址信息中完善后统一保存'
        });
      }
      
      // 延迟返回，让用户看到提示
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    },
    
    // 处理保存成功（编辑模式）
    handleSaveSuccess(message) {
      uni.showToast({
        title: message,
        icon: 'success',
        duration: 1500
      });
      
      // 发送事件通知 DataEdit 页面刷新数据
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel) {
        eventChannel.emit('safetyScoreUpdated', {
          addressId: this.addressId,
          scoreItems: this.scoreItems,
          safeId: this.safeId,
          isLocal: false
        });
      }
      
      setTimeout(() => {
        uni.navigateBack();
      }, 1000);
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
  padding-bottom: 120rpx;
  height: calc(100vh - 260rpx);
}

/* 头部总分区域 */
.header-score-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  padding: 20rpx 32rpx;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1rpx solid #e8f4f8;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.total-score-display {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.score-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
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
  
  &.level-excellent {
    color: #52c41a;
    font-weight: 600;
  }
  
  &.level-good {
    color: #1890ff;
    font-weight: 600;
  }
  
  &.level-poor {
    color: #fa8c16;
    font-weight: 600;
  }
}

/* 分数进度条 */
.score-progress-container {
  width: 100%;
  margin-top: 8rpx;
  position: relative;
}

.progress-bar {
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.3s ease-in-out;
  
  &.progress-excellent {
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  }
  
  &.progress-good {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  }
  
  &.progress-poor {
    background: linear-gradient(135deg, #fa8c16 0%, #faad14 100%);
  }
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  padding: 0 10rpx;
}

.progress-label {
  font-size: 20rpx;
  color: #999;
}

/* 评分标准图标 */
.score-standard-icon {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 16rpx;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
  border-radius: 20rpx;
  border: 1rpx solid #d6f4ff;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
    background: linear-gradient(135deg, #e6f7ff 0%, #d6f4ff 100%);
  }
}

.info-icon {
  top: 2rpx;
  width: 32rpx;
  height: 32rpx;
  opacity: 0.8;
}

.icon-text {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 500;
}

.form-content {
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  border: none;
}

/* 评分项样式 */
.score-items-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border: 1rpx solid #e8f4f8;
}

/* .section-header 与 .section-title 未在模板中使用，移除冗余样式 */

.score-items-list {
  padding: 0 32rpx 80rpx 32rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
  line-height: 1.4;
}

.item-score {
  display: flex;
  align-items: center;
}

.score-value {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 600;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

/* 选项列表样式 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 20rpx;
  border-radius: 12rpx;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &.active {
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border-color: #1890ff;
    box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.25);
    transform: translateY(-2rpx);
  }
  
  &:hover:not(.active) {
    background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
    border-color: #91d5ff;
    transform: translateY(-1rpx);
  }
  
  &:active {
    transform: scale(0.98) translateY(0);
  }
}

.option-content {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
}

.option-score {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 600;
  min-width: 60rpx;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  text-align: center;
}

.option-text {
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: 400;
  line-height: 1.4;
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

/* 备注区域样式 */
.remark-section {
  margin-top: 20rpx;
  border-radius: 16rpx;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #91d5ff;
    background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%);
    box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.1);
  }
}

.remark-input {
  width: 100%;
  min-height: 100rpx;
  padding: 20rpx 24rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333333;
  background: #ffffff;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1.6;
  transition: all 0.3s ease;
  box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  
  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 6rpx rgba(24, 144, 255, 0.15), inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    outline: none;
    transform: translateY(-2rpx);
  }
  
  &::placeholder {
    color: #999999;
    font-size: 24rpx;
    font-weight: 400;
    font-style: italic;
  }
}

.remark-count {
  position: absolute;
  bottom: 12rpx;
  right: 24rpx;
  font-size: 22rpx;
  color: #666666;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  padding: 6rpx 12rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(10rpx);
  border: 1rpx solid #e8f4f8;
  transition: all 0.3s ease;
  
  &::before {
    content: '字符数：';
    margin-right: 4rpx;
    color: #999999;
    font-size: 20rpx;
  }
}
/* 底部按钮 */
.footer {
  display: flex;
  padding: 16rpx 20rpx;
  gap: 24rpx;
  background: #ffffff;
  border-top: 1rpx solid #e8f4ff;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.footer-btn {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
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
  background: #f5f5f5;
  color: #666666;
  font-weight: 400;
  font-size: 24rpx;
  border: none !important;

  &::after {
    border: none !important;
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #ffffff;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 400;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 评分标准弹窗样式 */
.score-standard-modal {
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
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  animation: slideInUp 0.3s ease-out;
  transform-origin: center;
}

@keyframes slideInUp {
  from {
    transform: translateY(50rpx) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #1890ff 100%);
  }
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1890ff;
  position: relative;
  
  &::before {
    content: '📋';
    margin-right: 12rpx;
    font-size: 28rpx;
  }
}

.close-btn {
  padding: 12rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40rpx;
  height: 40rpx;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:active {
    transform: scale(0.9);
    background: #e0e0e0;
  }
}

.close-icon {
  font-size: 30rpx;
  color: #666;
  font-weight: 300;
}

.modal-body {
  box-sizing: border-box;
  flex: 1;
  padding: 10rpx 20rpx;
  overflow-y: auto;
}

.standard-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.standard-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%);
  border: 1rpx solid #e1e8ed;
  transition: all 0.3s ease;
  margin-bottom: 8rpx;
  
  &:hover {
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border-color: #91d5ff;
    transform: translateX(6rpx);
    box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.2);
  }
}

.item-number {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 600;
  min-width: 40rpx;
  height: 40rpx;
  text-align: center;
  line-height: 40rpx;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 50%;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}


.score-item {
  font-size: 22rpx;
  color: #666;
  font-weight: 400;
  padding: 10rpx 16rpx;
  margin: 30rpx 0;
  border-radius: 16rpx;
  border: 1rpx solid #e8f4f8;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.2);
  }
}

.total-rule {
  margin-top: 24rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  background: linear-gradient(135deg, #fff7e6 0%, #fff2d9 100%);
  border: 1rpx solid #ffd591;

}

.rule-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #d46b08;
  margin-bottom: 8rpx;
  display: block;
  position: relative;
  &::before {
    content: '🎯';
    position: absolute;
    top: 0rpx;
    right: 0rpx;
    background: #ffffff;
    padding: 6rpx;
    border-radius: 50%;
    font-size: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }
}

.rule-content {
  font-size: 24rpx;
  color: #d46b08;
  line-height: 1.5;
  font-weight: 500;
}
</style>
