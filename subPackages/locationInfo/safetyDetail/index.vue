<template>
  <view class="safety-detail-container">
    <!-- 顶部安全等级卡片 -->
    <view class="safety-header">
      <view class="safety-overview">
        <view class="safety-level">
          <text class="level-label">安全等级</text>
          <view class="level-tag" :class="safeLevelClass">
            <text>{{ safetyData.safeLevelName }}</text>
          </view>
        </view>
        <view class="safety-score">
          <text class="score-label">安全分数</text>
          <text class="score-value">{{ safetyData.safetyScore || 0 }}分</text>
        </view>
      </view>
      <view class="safety-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">{{ safetyData.safetyScore || 0 }}/100分</text>
      </view>
    </view>

    <!-- 评分明细 -->
    <view class="score-details">
      <view class="section-title">
        <text>评分明细</text>
      </view>
      
      <view class="detail-list">
        <view class="detail-item" v-for="(item, index) in safetyData.scoreDetails" :key="index">
          <view class="item-header">
            <view class="item-title">
              <image :src="getCategoryIcon(item.category)" class="category-icon" />
              <text>{{ item.categoryName }}</text>
            </view>
            <view class="item-score">
              <text class="score">{{ item.score }}分</text>
              <text class="total">/{{ item.totalScore }}分</text>
            </view>
          </view>
          
          <view class="item-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: (item.score / item.totalScore * 100) + '%' }"></view>
            </view>
          </view>
          
          <view class="item-details" v-if="item.subItems && item.subItems.length > 0">
            <view class="sub-item" v-for="(subItem, subIndex) in item.subItems" :key="subIndex">
              <text class="sub-title">{{ subItem.name }}</text>
              <text class="sub-score">{{ subItem.score }}分</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 安全建议 -->
    <view class="safety-suggestions" v-if="safetyData.suggestions && safetyData.suggestions.length > 0">
      <view class="section-title">
        <text>安全建议</text>
      </view>
      
      <view class="suggestion-list">
        <view class="suggestion-item" v-for="(suggestion, index) in safetyData.suggestions" :key="index">
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
      safetyData: {
        safeLevelId: 1,
        safeLevelName: '优秀',
        safetyScore: 85,
        scoreDetails: [
          {
            category: 'fire_equipment',
            categoryName: '消防设备',
            score: 25,
            totalScore: 30,
            subItems: [
              { name: '灭火器配置', score: 10 },
              { name: '消防栓状态', score: 8 },
              { name: '自动报警系统', score: 7 }
            ]
          },
          {
            category: 'safety_management',
            categoryName: '安全管理',
            score: 20,
            totalScore: 25,
            subItems: [
              { name: '安全制度', score: 8 },
              { name: '人员培训', score: 7 },
              { name: '应急预案', score: 5 }
            ]
          },
          {
            category: 'building_structure',
            categoryName: '建筑结构',
            score: 18,
            totalScore: 20,
            subItems: [
              { name: '疏散通道', score: 10 },
              { name: '防火分区', score: 8 }
            ]
          },
          {
            category: 'environment',
            categoryName: '环境安全',
            score: 12,
            totalScore: 15,
            subItems: [
              { name: '周边环境', score: 7 },
              { name: '安全距离', score: 5 }
            ]
          },
          {
            category: 'maintenance',
            categoryName: '维护保养',
            score: 10,
            totalScore: 10,
            subItems: [
              { name: '设备维护', score: 6 },
              { name: '定期检查', score: 4 }
            ]
          }
        ],
        suggestions: [
          '建议增加灭火器数量，确保每个区域都有足够的消防设备',
          '加强员工消防安全培训，提高安全意识',
          '完善应急预案，定期组织消防演练',
          '定期检查消防设备，确保设备正常运行'
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
    safeLevelClass() {
      const map = { 1: 'safety-excellent', 2: 'safety-good', 3: 'safety-normal', 4: 'safety-danger' };
      return map[this.safetyData.safeLevelId] || '';
    },
    
    progressPercent() {
      return this.safetyData.safetyScore || 0;
    }
  },
  
  methods: {
    fetchSafetyDetail() {
      // 这里调用接口获取安全详情数据
      uni.request({
        url: this.serverUrl + '/location/safety-detail',
        method: 'GET',
        data: { addressId: this.addressId },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            this.safetyData = res.data.data || this.safetyData;
          } else {
            uni.showToast({ title: '获取安全详情失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    
    getCategoryIcon(category) {
      const iconMap = {
        fire_equipment: '/static/icons/location/safe.png',
        safety_management: '/static/icons/location/safe.png',
        building_structure: '/static/icons/location/safe.png',
        environment: '/static/icons/location/safe.png',
        maintenance: '/static/icons/location/safe.png'
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
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #F8F9FA, #FFFFFF);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.sub-item:hover {
  background: linear-gradient(135deg, #E3F2FD, #F8F9FA);
  transform: translateX(2px);
}

.sub-title {
  font-size: 12px;
  color: #666;
}

.sub-score {
  font-size: 12px;
  color: #1890FF;
  font-weight: bold;
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
.safety-excellent { background-color: #00B42A; }
.safety-good { background-color: #FF7D00; }
.safety-normal { background-color: #FFB400; }
.safety-danger { background-color: #F53F3F; }
</style> 