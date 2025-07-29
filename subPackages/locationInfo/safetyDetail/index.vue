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
          <text class="level-label">安全等级</text>
          <view class="level-tag" :class="safetyData.safetyCssClass" :style="{ backgroundColor: safetyData.safetyCssColor }">
            <text>{{ safetyData.safetyLevel }}</text>
          </view>
        </view>
        <view class="safety-score">
          <text class="score-label">安全分数</text>
          <text class="score-value">{{ safetyData.totalScore || 0 }}分</text>
        </view>
      </view>
      <view class="safety-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%', backgroundColor: safetyData.safetyCssColor }"></view>
        </view>
        <text class="progress-text">{{ safetyData.totalScore || 0 }}/{{ safetyData.maxPossibleScore || 100 }}分</text>
      </view>
    </view>

    <!-- 评分明细 -->
    <view class="score-details">
      <view class="section-title">
        <text>评分明细</text>
      </view>
      
      <view class="detail-list">
        <view class="detail-item" v-for="(category, index) in categoryDetails" :key="index">
          <view class="item-header">
            <view class="item-title">
              <image :src="getCategoryIcon(category.id)" class="category-icon" />
              <text>{{ category.name }}</text>
            </view>
            <view class="item-score">
              <text class="score">{{ category.score }}分</text>
              <text class="total">/{{ category.maxScore }}分</text>
            </view>
          </view>
          
          <view class="item-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: (category.score / category.maxScore * 100) + '%', backgroundColor: safetyData.safetyCssColor }"></view>
            </view>
          </view>
          
          <view class="item-details" v-if="category.items && category.items.length > 0">
            <view class="sub-item" v-for="(item, subIndex) in category.items" :key="subIndex">
              <view class="sub-item-left">
                <text class="sub-title">{{ item.name }}</text>
                <text class="sub-option">{{ item.option }}</text>
              </view>
              <text class="sub-score">{{ item.score }}分</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 安全建议 -->
    <view class="safety-suggestions" v-if="safetySuggestions.length > 0">
      <view class="section-title">
        <text>安全建议</text>
      </view>
      
      <view class="suggestion-list">
        <view class="suggestion-item" v-for="(suggestion, index) in safetySuggestions" :key="index">
          <view class="suggestion-icon">
            <text>{{ index + 1 }}</text>
          </view>
          <text class="suggestion-text">{{ suggestion }}</text>
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
      addressId: null,
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
      // 评分配置数据
      scoreConfig: {
        categories: [
          { id: 'waterSource', name: '水源配置', description: '天然水源和消火栓配置' },
          { id: 'roadAccess', name: '道路通行', description: '消防车辆通行条件' },
          { id: 'fireFacilities', name: '消防设施', description: '消火栓等消防设备' },
          { id: 'controlSystem', name: '控制系统', description: '消防控制室设备' },
          { id: 'evacuation', name: '疏散设施', description: '电梯和楼梯间' },
          { id: 'buildingLayout', name: '建筑布局', description: '建筑单元连通性' },
          { id: 'emergencyManagement', name: '应急管理', description: '应急人员配置' }
        ],
        scoreItems: [
          { id: 'naturalWaterSource', name: '单位周边100m范围内有无天然水源', category: 'waterSource', weight: 10 },
          { id: 'outdoorHydrant', name: '单位周边50m内有无室外消火栓', category: 'waterSource', weight: 10 },
          { id: 'vehicleAccess', name: '单位内部车辆是否能通行', category: 'roadAccess', weight: 10 },
          { id: 'buildingHydrant', name: '单位内部建筑消火栓是否都有水', category: 'fireFacilities', weight: 10 },
          { id: 'outdoorHydrantWater', name: '单位内部室外消火栓是否有水', category: 'fireFacilities', weight: 10 },
          { id: 'controlRoom', name: '单位消防控制室使用情况', category: 'controlSystem', weight: 10 },
          { id: 'fireElevator', name: '单位内部消防电梯情况', category: 'evacuation', weight: 10 },
          { id: 'stairwellType', name: '单位内部楼梯间类型', category: 'evacuation', weight: 10 },
          { id: 'unitConnection', name: '单位各单元之间连通情况', category: 'buildingLayout', weight: 10 },
          { id: 'emergencyTeam', name: '单位是否存在处置小分队', category: 'emergencyManagement', weight: 10 }
        ]
      }
    };
  },
  
  onLoad(data) {
    const { addressId } = data || {};
    this.addressId = addressId;
    this.fetchSafetyDetail();
  },
  
  computed: {
    progressPercent() {
      return this.safetyData.scorePercentage || 0;
    },
    
    categoryDetails() {
      const categories = {};
      
      // 初始化分类
      this.scoreConfig.categories.forEach(category => {
        categories[category.id] = {
          ...category,
          score: 0,
          maxScore: 0,
          items: []
        };
      });
      
      // 计算每个分类的分数
      this.scoreConfig.scoreItems.forEach(item => {
        const category = categories[item.category];
        if (category) {
          category.maxScore += item.weight;
          
          const scoreItem = this.safetyData.scoreItems[item.id];
          if (scoreItem) {
            category.score += scoreItem.score;
            category.items.push({
              name: item.name,
              score: scoreItem.score,
              option: scoreItem.option
            });
          }
        }
      });
      
      return Object.values(categories);
    },
    
    safetySuggestions() {
      const suggestions = [];
      const score = this.safetyData.totalScore || 0;
      
      // 根据分数生成建议
      if (score < 60) {
        suggestions.push('安全等级较差，建议立即进行全面的消防安全检查');
        suggestions.push('加强消防设施维护，确保所有设备正常运行');
        suggestions.push('完善应急预案，定期组织消防演练');
        suggestions.push('增加消防设备配置，提高安全防护能力');
      } else if (score < 80) {
        suggestions.push('安全等级一般，建议加强薄弱环节的改进');
        suggestions.push('定期检查消防设备，确保设备完好有效');
        suggestions.push('加强员工消防安全培训，提高安全意识');
        suggestions.push('完善消防管理制度，建立长效机制');
      } else {
        suggestions.push('安全等级优秀，继续保持良好的消防安全管理');
        suggestions.push('定期进行消防安全检查，确保安全水平持续提升');
        suggestions.push('加强消防知识宣传，提高全员安全意识');
      }
      
      return suggestions;
    }
  },
  
  methods: {
    fetchSafetyDetail() {
      this.loading = true;
      uni.showLoading({ title: '加载中...' });
      
      // 这里调用接口获取安全详情数据
      uni.request({
        url: this.serverUrl + '/location/safety-detail',
        method: 'GET',
        data: { addressId: this.addressId },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            this.safetyData = res.data.data || this.safetyData;
            uni.showToast({
              title: '数据加载成功',
              icon: 'success',
              duration: 1500
            });
          } else {
            // 使用模拟数据
            this.loadMockData();
            uni.showToast({
              title: '使用模拟数据',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          console.error('获取安全详情失败:', err);
          // 使用模拟数据
          this.loadMockData();
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
    
    loadMockData() {
      // 模拟数据，根据JSON文件中的示例
      this.safetyData = {
        safeId: 'SAFE002',
        addressId: this.addressId || '654321',
        addressName: '江苏省苏州市姑苏区虎丘山风景区',
        totalScore: 85,
        maxPossibleScore: 100,
        scorePercentage: 85,
        safetyLevel: '一般',
        safetyColor: '黄色',
        safetyCssClass: 'safety-normal',
        safetyCssColor: '#faad14',
        scoreItems: {
          naturalWaterSource: { score: 10, option: '有', itemId: 'naturalWaterSource' },
          outdoorHydrant: { score: 10, option: '有', itemId: 'outdoorHydrant' },
          vehicleAccess: { score: 5, option: '小型消防车能通行', itemId: 'vehicleAccess' },
          buildingHydrant: { score: 10, option: '都有水', itemId: 'buildingHydrant' },
          outdoorHydrantWater: { score: 10, option: '全部有水', itemId: 'outdoorHydrantWater' },
          controlRoom: { score: 5, option: '只能启动1个', itemId: 'controlRoom' },
          fireElevator: { score: 5, option: '部分消防电梯', itemId: 'fireElevator' },
          stairwellType: { score: 10, option: '都是防烟楼梯间', itemId: 'stairwellType' },
          unitConnection: { score: 10, option: '都能连通', itemId: 'unitConnection' },
          emergencyTeam: { score: 10, option: '是', itemId: 'emergencyTeam' }
        },
        configVersion: '1.0.0',
        createTime: new Date(),
        updateTime: new Date()
      };
    },
    
    getCategoryIcon(category) {
      const iconMap = {
        waterSource: '/static/icons/location/safe.png',
        roadAccess: '/static/icons/location/safe.png',
        fireFacilities: '/static/icons/location/safe.png',
        controlSystem: '/static/icons/location/safe.png',
        evacuation: '/static/icons/location/safe.png',
        buildingLayout: '/static/icons/location/safe.png',
        emergencyManagement: '/static/icons/location/safe.png'
      };
      return iconMap[category] || '/static/icons/location/safe.png';
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

/* 顶部安全等级卡片 */
.safety-header {
  background: linear-gradient(135deg, #FF6B35, #FF8E53);
  margin: 10px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.25);
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
  background-color: #f0f0f0;
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
  text-align: center;
}

/* 评分明细 */
.score-details {
  background-color: #FFF;
  margin: 10px;
  border-radius: 8px;
  padding: 20px;
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
  font-size: 16px;
  font-weight: bold;
  color: #333;
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
}

.item-progress .progress-fill {
  background: linear-gradient(90deg, #1890FF, #40A9FF);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.sub-item-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1;
  margin-right: 12px;
}

.sub-title {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
}

.sub-option {
  font-size: 11px;
  color: #666;
  background: rgba(24, 144, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
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