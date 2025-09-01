<template>
  <view class="data-edit">
    <!-- 表单内容 -->
    <scroll-view class="form-container" scroll-y="true">
      <!-- Location表单 -->
      <LocationForm 
        v-if="type === 'location'"
        ref="locationFormRef"
        :serverUrl="serverUrl"
        :editId="editId"
        :initialData="locationInitialData"
        @add-safety-score="addSafetyScore"
        @edit-safety-score="editSafetyScore"
      />
      <!-- Chat表单 -->
      <ChatForm 
        v-if="type === 'chat'"
        ref="chatFormRef"
        :serverUrl="serverUrl"
        :initialData="chatInitialData"
      />
      <!-- Command表单 -->
      <CommandForm 
        v-if="type === 'command'"
        ref="commandFormRef"
        :serverUrl="serverUrl"
        :initialData="commandInitialData"
      />
      <!-- 底部占位，防止内容被固定按钮遮挡 -->
      <view class="scroll-spacer"></view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="footer-btn cancel-btn" @tap="goBack">取消</button>
      <button class="footer-btn confirm-btn" @tap="saveData">保存</button>
    </view>
  </view>
</template>

<script>
import SafetyScoreDetail from './components/SafetyScoreDetail.vue'
import LocationForm from './components/LocationForm.vue'
import ChatForm from './components/ChatForm.vue'
import CommandForm from './components/CommandForm.vue'

export default {
  components: {
    SafetyScoreDetail,
    LocationForm,
    ChatForm,
    CommandForm
  },
  name: 'DataEdit',
  data() {
    return {
      type: 'location', // location 或 safety 或 command
      mode: 'add', // add 或 edit
      editId: '', // 编辑时的ID
      commandKey: '', // 数据指挥的key
      serverUrl: 'http://192.168.1.4:3000',
      // 子组件初始化数据（避免父传子双向修改）
      chatInitialData: {},
      commandInitialData: {},
      locationInitialData: {}
    }
  },
  computed: {
    isEdit() {
      return this.mode === 'edit';
    },
  },
  onLoad(options) {
    this.type = options.type || 'location';
    this.mode = options.mode || 'add';
    this.editId = options.id || '';
    // 如果是数据指挥编辑模式，设置初始数据
    if (this.type === 'command' && options.key) {
      this.commandKey = options.key;
      this.commandInitialData = {
        commandTitle: decodeURIComponent(options.title || ''),
        commandDesc: decodeURIComponent(options.desc || ''),
        commandUrl: decodeURIComponent(options.url || '')
      };
      this.$nextTick(() => {
        this.$refs.commandFormRef && this.$refs.commandFormRef.setFormData(this.commandInitialData);
      })
    }
    
    // 检查是否有本地保存的安全评分
    this.checkLocalSafetyScore();
    if (this.isEdit && this.editId && this.type !== 'command') {
      this.loadEditData();
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    async loadEditData() {
      uni.showLoading({ title: '加载中...' });
      try {
        const url = this.type === 'location' 
          ? this.serverUrl + '/location/detail'
          : this.serverUrl + '/group/detail';
        let data = {
          id: this.editId
        }
        if (this.type === 'location') {
          delete data.id;
          data.addressId = this.editId;
        } else if (this.type === 'chat') {
          delete data.id;
          data.groupId = this.editId;
        }
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'GET',
            data: data,
            success: resolve,
            fail: reject
          });
        });
        
        if (result.data && result.data.code === 200) {
          const responseData = result.data.data;
          
          // 处理位置数据
          if (this.type === 'location') {
            // 通过子组件回填
            this.locationInitialData = responseData
            this.$nextTick(() => {
              this.$refs.locationFormRef && this.$refs.locationFormRef.setFormData(this.locationInitialData)
            })
          } else if (this.type === 'chat') {
            // 处理聊天数据 -> 通过子组件回填
            this.chatInitialData = responseData
            this.$nextTick(() => {
              this.$refs.chatFormRef && this.$refs.chatFormRef.setFormData(this.chatInitialData);
            })
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
    async saveData() {
      let submissionData = {}; // 提交数据
      
      // 子组件数据准备
      if (this.type === 'location') {
        const childOk = await (this.$refs.locationFormRef?.validate?.() ?? true)
        if (!childOk) return
        const loc = this.$refs.locationFormRef?.getFormData?.() || {}
        // 自动设置安全等级（根据评分计算）
        const totalScore = (() => {
          if (!loc.fireSafetyScore || !loc.fireSafetyScore.scoreItems) return 0
          let s = 0
          const items = loc.fireSafetyScore.scoreItems
          for (const k in items) if (items[k] && typeof items[k].score === 'number') s += items[k].score
          return s
        })()
        loc.safeLevelId = this.getSafetyLevelByScore(totalScore)
        submissionData = { ...loc }
      }

      // 命令、聊天：先从子组件获取数据
      if (this.type === 'command') {
        const childOk = await (this.$refs.commandFormRef?.validate?.() ?? true)
        if (!childOk) { uni.hideLoading(); return }
        const cmd = this.$refs.commandFormRef?.getFormData?.() || {}
        submissionData = { ...cmd }
        return;
      }
      
      if (this.type === 'chat') {
        const childOk = await (this.$refs.chatFormRef?.validate?.() ?? true)
        if (!childOk) { uni.hideLoading(); return }
        const chat = this.$refs.chatFormRef?.getFormData?.() || {}
        submissionData = { ...chat }
      }
      
      uni.showLoading({ title: this.isEdit ? '更新中...' : '保存中...' });
      try {        
        const url = this.type === 'location' 
          ? this.serverUrl + '/location/save'
          : this.serverUrl + '/chat/save';
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url,
            method: 'POST',
            data: submissionData,
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
          
          // 返回上一页并刷新数据
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
    },
    // 计算安全评分总分（从LocationForm子组件获取数据）
    calculateTotalScore() {
      const locationForm = this.$refs.locationFormRef;
      if (!locationForm) return 0;
      
      const formData = locationForm.getFormData();
      if (!formData.fireSafetyScore || !formData.fireSafetyScore.scoreItems) {
        return 0;
      }
      let totalScore = 0;
      const scoreItems = formData.fireSafetyScore.scoreItems;
      for (const key in scoreItems) {
        if (scoreItems[key] && typeof scoreItems[key].score === 'number') {
          totalScore += scoreItems[key].score;
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

    // 新增方法：添加安全评分
    addSafetyScore() {
      const locationForm = this.$refs.locationFormRef;
      const formData = locationForm ? locationForm.getFormData() : {};
      uni.navigateTo({
        url: `/pages/personal/userDetail/SafetyScoreEdit?mode=add&safeId=${formData.safeId || ''}&addressId=${formData.addressId || ''}`,
        events: {
          // 监听安全评分更新事件
          safetyScoreUpdated: (data) => {
            if (data.isLocal) {
              // 本地保存的安全评分
              this.handleLocalSafetyScore(data);
            } else {
              // 编辑模式的安全评分
              this.handleEditSafetyScore(data);
            }
          }
        }
      });
    },

    // 新增方法：编辑安全评分
    editSafetyScore() {
      const locationForm = this.$refs.locationFormRef;
      const formData = locationForm ? locationForm.getFormData() : {};
      uni.navigateTo({
        url: `/pages/personal/userDetail/SafetyScoreEdit?mode=edit&safeId=${formData.safeId || ''}&addressId=${formData.addressId || ''}`,
        events: {
          // 监听安全评分更新事件
          safetyScoreUpdated: (data) => {
            if (data.isLocal) {
              // 本地保存的安全评分
              this.handleLocalSafetyScore(data);
            } else {
              // 编辑模式的安全评分
              this.handleEditSafetyScore(data);
            }
          }
        }
      });
    },
    
    // 处理本地保存的安全评分
    handleLocalSafetyScore(data) {
      // 通过子组件更新数据
      const locationForm = this.$refs.locationFormRef;
      if (locationForm) {
        const currentFormData = locationForm.getFormData();
        currentFormData.fireSafetyScore = {
          scoreItems: data.scoreItems,
          isLocal: true
        };
        locationForm.setFormData(currentFormData);
      }
      
      // 清除本地存储的安全评分
      uni.removeStorageSync('tempSafetyScore');
      
      // 显示提示
      uni.showToast({
        title: '安全评分已填充，请完善地址信息后保存',
        icon: 'none',
        duration: 3000
      });
    },
    
    // 处理编辑模式的安全评分
    handleEditSafetyScore(data) {
      // 通过子组件更新数据
      const locationForm = this.$refs.locationFormRef;
      if (locationForm) {
        const currentFormData = locationForm.getFormData();
        if (data.addressId === currentFormData.addressId) {
          currentFormData.fireSafetyScore = {
            scoreItems: data.scoreItems,
            safeId: data.safeId
          };
          locationForm.setFormData(currentFormData);
          
          // 显示更新成功提示
          uni.showToast({
            title: '安全评分已更新',
            icon: 'success',
            duration: 2000
          });
        }
      }
    },
    
    // 检查本地保存的安全评分
    checkLocalSafetyScore() {
      try {
        const localData = uni.getStorageSync('tempSafetyScore');
        if (localData && localData.isLocal) {
          // 自动填充安全评分到LocationForm
          this.$nextTick(() => {
            const locationForm = this.$refs.locationFormRef;
            if (locationForm) {
              const currentFormData = locationForm.getFormData();
              currentFormData.fireSafetyScore = {
                scoreItems: localData.scoreItems,
                isLocal: true
              };
              locationForm.setFormData(currentFormData);
            }
          });
          
          // 显示提示
          uni.showToast({
            title: '检测到本地安全评分，已自动填充',
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        console.log('检查本地安全评分失败:', error);
      }
    },
    

  }
}
</script>

<style lang="scss" scoped>
.data-edit {
  height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
}

/* 表单容器 */
.form-container {
  flex: 1;
  padding: 0;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); /* 适配H5/iOS底部安全区 */
  height: calc(100vh - 80rpx);
  overflow-y: auto;
}

/* 占位，确保最后一块内容不会被底部按钮遮挡（scroll-view 对 padding 支持有限时的兜底） */
.scroll-spacer {
  height: calc(140rpx + env(safe-area-inset-bottom));
}

/* 底部按钮 */
  .footer {
    display: flex;
  padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom)) 20rpx;
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

/* 移动端优化 */
@media (max-width: 750rpx) {
  .footer {
    padding: 16rpx 24rpx 30rpx 24rpx;
    gap: 20rpx;
  }
}

/* 超小屏幕优化 */
@media (max-width: 600rpx) {
  .footer {
    padding: 16rpx 20rpx 30rpx 20rpx;
    gap: 16rpx;
  }
}
</style>