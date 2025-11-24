<template>
  <view class="location-form">
    <!-- 默认图片配置（队站辖区不显示） -->
    <view class="location-info-section" v-if="formData.type !== 3">
      <view class="section-header">
        <text class="section-title">展示图片<text class="required">*</text></text>
      </view>
      <view class="default-image-upload-area">
        <!-- 已设置的默认图片 -->
        <view class="default-image-preview" v-if="formData.defaultImg">
          <image :src="resolveImageUrl(formData.defaultImg)" class="default-image" mode="aspectFill" />
          <view class="delete-btn-overlay">
            <button class="delete-btn-small" @tap="deleteDefaultImage">
              <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="delete-icon-small" />
            </button>
          </view>
        </view>
        <!-- 上传默认图片按钮 -->
        <view class="upload-default-btn" v-if="!formData.defaultImg" @tap="addDefaultImage">
          <image :src="serverUrl + '/static/icons/common/add-third-grey.png'" class="upload-icon" />
          <text class="upload-text">上传展示图片</text>
        </view>
        <!-- 错误提示 -->
        <view v-if="errors.defaultImg" class="error-message">
          <text class="error-text">{{ errors.defaultImg }}</text>
        </view>
      </view>
    </view>
    <!-- 位置信息区域 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-title">位置信息</text>
      </view>
      
      <!-- 队站辖区时，单位类型放在地址名称上面 -->
      <view class="form-item">
        <text class="form-label">单位类型 <text class="required">*</text></text>
        <picker 
          :value="formData.type" 
          :range="locationTypeOptions" 
          range-key="label"
          @change="onLocationTypeChange"
          class="form-picker"
        >
          <view class="picker-display">
            <text class="picker-text">{{ getLocationTypeText }}</text>
            <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
          </view>
        </picker>
      </view>

      <!-- 队站辖区时，新增关键字下拉选择（默认：全部） -->
      <view class="form-item" v-if="formData.type === 3">
        <text class="form-label">关键字</text>
        <picker 
          :value="keywordPickerIndex"
          :range="keywordOptions"
          range-key="label"
          @change="onKeywordChange"
          class="form-picker"
        >
          <view class="picker-display">
            <text class="picker-text">{{ getKeywordLabel }}</text>
            <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="form-label">地址名称 <text class="required">*</text></text>
        <view class="address-input-container">
          <input 
            v-model="formData.addressName" 
            :class="['form-input', (!formData.latitude || !formData.longitude) ? 'readonly-input' : '']"
            :placeholder="(!formData.latitude || !formData.longitude) ? '请先选择地址' : '可编辑地址名称'"
            maxlength="50"
            :readonly="!formData.latitude || !formData.longitude"
          />
          <view class="address-selector" @tap="openMapSelector">
            <image :src="serverUrl + '/static/icons/location/showLocation.png'" class="map-icon" />
            <text class="address-selector-text">选择地址</text>
          </view>
        </view>
      </view>
      
      <!-- 详细地址（消火栓显示，全景云不显示） -->
      <view class="form-item" v-if="formData.type === 3 && isHydrant">
        <text class="form-label">详细地址 <text class="required">*</text></text>
        <input 
          v-model="formData.addressExt" 
          :class="['form-input', (!formData.latitude || !formData.longitude) ? 'readonly-input' : '']"
          :placeholder="(!formData.latitude || !formData.longitude) ? '请先选择地址' : '可编辑详细地址'"
          maxlength="200"
          :readonly="!formData.latitude || !formData.longitude"
        />
      </view>
      <!-- 详细地址（非队站辖区显示） -->
      <view class="form-item" v-if="formData.type !== 3">
        <text class="form-label">详细地址 <text class="required">*</text></text>
        <input 
          v-model="formData.addressExt" 
          :class="['form-input', (!formData.latitude || !formData.longitude) ? 'readonly-input' : '']"
          :placeholder="(!formData.latitude || !formData.longitude) ? '请先选择地址' : '可编辑详细地址'"
          maxlength="200"
          :readonly="!formData.latitude || !formData.longitude"
        />
      </view>
        
      <!-- 地址编号（根据类型显示不同标签） -->
      <view class="form-item">
        <text class="form-label">
          <text v-if="formData.type === 3 && isPanorama">全景云编号</text>
          <text v-else-if="formData.type === 3 && isHydrant">消火栓编号</text>
          <text v-else>地址编号</text>
          <text class="required">*</text>
        </text>
        <input 
          v-model="formData.addressId" 
          class="form-input" 
          :placeholder="formData.type === 3 && isPanorama ? '请输入全景云编号' : (formData.type === 3 && isHydrant ? '请输入消火栓编号' : '请输入地址编号')"
          maxlength="20"
          @input="onAddressIdInput"
        />
      </view>
      
      <!-- 经纬度显示 -->
      <view class="form-item coordinates-display" v-if="formData.latitude && formData.longitude">
        <text class="form-label">位置坐标</text>
        <view class="coordinates-info">
          <view class="coordinate-item">
            <text class="coordinate-label">经度:</text>
            <text class="coordinate-value">{{ formData.longitude }}</text>
          </view>
          <view class="coordinate-item">
            <text class="coordinate-label">纬度:</text>
            <text class="coordinate-value">{{ formData.latitude }}</text>
          </view>
        </view>
      </view>
        
      <!-- 全景云地址（全景云显示，消火栓不显示） -->
      <view class="form-item" v-if="formData.type === 3 && isPanorama">
        <text class="form-label">全景云地址 <text class="required">*</text></text>
        <view class="url-display" @tap="openLinkModal">
          <text class="url-display-text">{{ formData.allSenceLink || '请输入全景云地址' }}</text>
          <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="edit-inline-icon" />
        </view>
      </view>
      <!-- 全景云地址（非队站辖区显示） -->
      <view class="form-item" v-if="formData.type !== 3">
        <text class="form-label">全景云地址 <text class="required">*</text></text>
        <view class="url-display" @tap="openLinkModal">
          <text class="url-display-text">{{ formData.allSenceLink || '请输入全景云地址' }}</text>
          <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="edit-inline-icon" />
        </view>
      </view>
      
      <!-- 消火栓性能参数（仅消火栓显示） -->
      <view class="form-item" v-if="formData.type === 3 && isHydrant">
        <text class="form-label">性能参数 <text class="required">*</text></text>
        <view class="hydrant-params">
          <view class="param-item">
            <text class="param-label">压力:</text>
            <input 
              v-model="formData.hydrantPressure" 
              :class="['param-input', errors.hydrantPressure ? 'param-input-error' : '']"
              placeholder="请输入消火栓压力"
              type="digit"
              maxlength="10"
            />
            <text class="param-unit">mpa</text>
          </view>
          <view class="param-item">
            <text class="param-label">流量:</text>
            <input 
              v-model="formData.hydrantFlow" 
              :class="['param-input', errors.hydrantFlow ? 'param-input-error' : '']"
              placeholder="请输入消火栓流量"
              type="digit"
              maxlength="10"
            />
            <text class="param-unit">L/s</text>
          </view>
        </view>
        <!-- 错误提示 -->
        <view v-if="errors.hydrantPressure || errors.hydrantFlow" class="error-message">
          <text class="error-text">{{ errors.hydrantPressure || errors.hydrantFlow }}</text>
        </view>
      </view>
      
      <!-- 描述字段（队站辖区不显示） -->
      <view class="form-item description-item" v-if="formData.type !== 3">
        <text class="form-label">描述</text>
        <textarea 
          v-model="formData.description" 
          class="form-textarea" 
          placeholder="请输入描述信息"
          maxlength="500"
          auto-height
          show-confirm-bar="false"
        />
      </view>
      
    </view>

    <!-- 安全信息区域（队站辖区不显示） -->
    <view class="safety-section" v-if="formData.type !== 3">
      <view class="section-header">
        <text class="section-title">安全信息</text>
        <view class="header-actions">
          <image 
            v-if="!formData.fireSafetyScore" 
            :src="serverUrl + '/static/icons/common/add-sec-white.png'" 
            class="action-icon add-icon" 
            @tap="addSafetyScore" 
          />
          <image 
            v-else 
            :src="serverUrl + '/static/icons/common/edit-white.png'" 
            class="action-icon edit-icon" 
            @tap="editSafetyScore" 
          />
        </view>
      </view>
        
      <view v-if="formData.fireSafetyScore" class="safety-content">
        <view class="safety-summary">
          <view class="safety-score-display">
            <view class="score-display-content">
              <text class="score-label">总分:</text>
              <text class="score-value">{{ calculateTotalScore() }}分</text>
              <text class="level-value" :class="safetyLevelClass">
                ({{ safetyLevelText }})
              </text>
            </view>
            <!-- 分数进度条 -->
            <view class="score-progress-section">
              <view class="progress-bar-container">
                <view class="progress-bar">
                <view 
                    class="progress-fill" 
                    :style="{ width: Math.min(calculateTotalScore(), 100) + '%' }"
                    :class="progressBarClass"
                  ></view>
                </view>
                <view class="progress-markers">
                  <view class="marker">
                    <text class="marker-text">0分</text>
                  </view>
                  <view class="marker">
                    <text class="marker-text">50分</text>
                  </view>
                  <view class="marker">
                    <text class="marker-text">100分</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">暂无安全评分信息，点击上方"+"添加</text>
      </view>
    </view>
      
    <!-- 户主信息（仅：高层小区 type === 1，队站辖区不显示） -->
    <view class="config-section" v-if="formData.type === 1 && formData.type !== 3">
      <view class="section-header">
        <text class="section-title">户主信息</text>
        <view class="header-actions">
          <image 
            :src="serverUrl + '/static/icons/common/edit-white.png'" 
            class="action-icon edit-icon" 
            @tap="goOwnerInfoEdit" 
          />
        </view>
      </view>
      <view class="form-item">
        <text class="form-label">当前住户总数</text>
        <view class="owner-inline">
          <view class="owner-badge">
            <text class="badge-num">{{ residentCount }}</text>
            <text class="badge-suffix">人</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 可出行大门配置（队站辖区不显示） -->
    <view class="config-section" v-if="formData.type !== 3">
      <view class="section-header">
        <text class="section-title">可出行大门配置</text>
      </view>
      
      <view class="gate-list">
        <view class="gate-item" v-for="(gate, index) in gateOptions" :key="index">
          <text class="gate-name">{{ gate.name }}</text>
          <switch 
            class="gate-switch"
            :checked="isGateSelected(gate.name)" 
            @change="toggleGate(gate.name)"
            color="#1890ff"
          />
        </view>
      </view>
        
      <!-- 错误提示 -->
      <view v-if="errors.enterGateList" class="error-message">
        <text class="error-text">{{ errors.enterGateList }}</text>
      </view>
    </view>
      
    <!-- 联系人配置（队站辖区不显示） -->
    <view class="config-section" v-if="formData.type !== 3">
      <view class="section-header">
        <text class="section-title">联系人配置</text>
        <view class="header-actions">
          <image :src="serverUrl + '/static/icons/common/add-sec-white.png'" class="action-icon add-icon" @tap="showContactModal('add')" />
        </view>
      </view>
        
      <view class="contact-list" v-if="formData.phoneList && formData.phoneList.length > 0">
        <view class="contact-item" v-for="(contact, index) in formData.phoneList" :key="index">
          <view class="contact-info">
            <view class="contact-header">
              <text class="contact-name">{{ contact.name }}</text>
              <text class="contact-type">{{ getContactTypeText(contact.type) }}</text>
            </view>
            <text class="contact-phone">{{ contact.phone }}</text>
          </view>
          <view class="contact-actions">
            <image :src="serverUrl + '/static/icons/common/edit-white.png'" class="action-icon edit-icon" @tap="showContactModal('edit', index)" />
            <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon delete-icon" @tap="deletePhoneContact(index)" />
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">暂无联系人，点击上方"+"添加</text>
      </view>
      
      <!-- 错误提示 -->
      <view v-if="errors.phoneList" class="error-message">
        <text class="error-text">{{ errors.phoneList }}</text>
      </view>
    </view>

    <!-- 联系人弹窗 -->
    <view class="contact-modal" v-if="showContactModalFlag" @tap="hideContactModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ contactModalMode === 'add' ? '添加联系人' : '编辑联系人' }}</text>
          <view class="close-btn" @tap="hideContactModal">
            <text class="close-icon">×</text>
          </view>
        </view>  
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">联系人姓名 <text class="required">*</text></text>
          <input 
            v-model="contactForm.name" 
            class="form-modal-input" 
            placeholder="请输入联系人姓名"
            maxlength="20"
          />
        </view>
        <view class="form-group">
          <text class="form-label">联系电话 <text class="required">*</text></text>
          <input 
            v-model="contactForm.phone" 
            class="form-modal-input" 
            placeholder="请输入联系电话"
            maxlength="15"
            type="number" 
          />
        </view>
      
        <view class="form-group">
          <text class="form-label">联系人类型 <text class="required">*</text></text>
          <view class="contact-type-options">
            <view 
              v-for="option in contactTypeOptions" 
              :key="option.value"
              class="type-option"
              :class="{ 
                'active': contactForm.type === option.value,
                'disabled': (option.value === 1 && contactTypeLimits.unitFull && contactModalMode === 'add') || 
                          (option.value === 2 && contactTypeLimits.fireFull && contactModalMode === 'add')
              }"
              @tap="selectContactType(option.value)"
            >
              <view class="checkbox">
                <view class="checkbox-inner" v-if="contactForm.type === option.value"></view>
              </view>
              <text class="type-label">{{ option.label }}</text>
            </view>
          </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="footer-btn cancel-btn" @tap="hideContactModal">取消</button>
          <button class="footer-btn confirm-btn" @tap="saveContact">确定</button>
        </view>
      </view>
    </view>

    <!-- 全景云地址弹窗 -->
    <view class="contact-modal" v-if="showLinkModalFlag" @tap="closeLinkModal">
      <view class="modal-content link-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">编辑全景云地址</text>
          <view class="close-btn" @tap="closeLinkModal">
            <text class="close-icon">×</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">全景云地址 <text class="required">*</text></text>
            <view class="url-input-container">
              <textarea
                v-model="tempAllSenceLink"
                class="form-modal-textarea"
                placeholder="请输入完整的全景云地址，例如: https://71ez3e7oi8u.720yun.com/my/scene/path"
                maxlength="500"
                auto-height
                show-confirm-bar="false"
              />
            </view>
            <text class="tip-text">请输入完整的全景云地址URL</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="footer-btn cancel-btn" @tap="closeLinkModal">取消</button>
          <button class="footer-btn confirm-btn" @tap="confirmLink">确定</button>
        </view>
      </view>
    </view>
      
    <!-- 消防地图配置（队站辖区不显示） -->
    <view class="config-section" v-if="formData.type !== 3">
      <view class="section-header">
        <text class="section-title">消防地图</text>
      </view>
      
      <view class="image-upload-area">
        <!-- 已上传的图片 -->
        <view class="image-list" v-if="formData.imgList && formData.imgList.length > 0">
          <view class="image-item" v-for="(img, index) in formData.imgList" :key="index">
            <image :src="resolveImageUrl(img)" class="map-image" mode="aspectFill" />
            <view class="image-overlay">
              <view class="image-actions">
                <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="action-icon delete-icon" @tap="deleteImage(index)" />
              </view>
            </view>
          </view>
        </view>
        
        <!-- 上传按钮 -->
        <view class="upload-btn" v-if="formData.imgList && formData.imgList.length < 3" @tap="addImage">
          <image :src="serverUrl + '/static/icons/common/add-third-grey.png'" class="upload-icon" />
          <text class="upload-text">上传图片</text>
        </view>
      </view>
    </view>

    <!-- 作战实景部署（仅：重点单位 type === 2，队站辖区不显示） -->
    <view class="config-section" v-if="formData.type === 2 && formData.type !== 3">
      <view class="section-header">
        <text class="section-title">作战实景部署</text>
      </view>
      <view class="deployment-section">
        <!-- 消防单位选择器 -->
        <view class="form-item">
          <text class="form-label">消防单位</text>
          <picker 
            :value="fireUnitPickerIndex" 
            :range="fireUnitOptions" 
            range-key="label"
            @change="onFireUnitChange"
            class="form-picker"
          >
            <view class="picker-display">
              <text class="picker-text">{{ getFireUnitText(selectedFireUnit) }}</text>
              <image :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
            </view>
          </picker>
        </view>

        <!-- 已上传：视频或动画（图片），仅 1 个 -->
        <view v-if="currentDeploymentPath" class="video-wrapper">
          <video 
            v-if="isVideoPath(currentDeploymentPath)" 
            :src="resolveImageUrl(currentDeploymentPath)" 
            class="deploy-video" 
            controls
            preload="metadata"
            webkit-playsinline
            playsinline
            x5-video-player-type="h5"
            x5-video-player-fullscreen="true"
            show-fullscreen-btn="true"
            enable-progress-gesture="true"
            vslide-gesture-in-fullscreen="true"
          ></video>
          <image v-else :src="resolveImageUrl(currentDeploymentPath)" class="deploy-image" mode="aspectFill" />
          <!-- 删除按钮放在右上角 -->
          <view class="delete-btn-overlay">
            <button class="delete-btn-small" @tap="deleteDeploymentMedia">
              <image :src="serverUrl + '/static/icons/common/delete-white.png'" class="delete-icon-small" />
            </button>
          </view>
        </view>
        <!-- 未获取：根据消防单位加载部署素材或手动上传 -->
        <view class="upload-card" v-else @tap="chooseDeploymentMedia">
          <image :src="serverUrl + '/static/icons/common/add-third-grey.png'" class="upload-card-icon" />
          <view class="upload-card-texts">
            <text class="upload-card-title">选择消防单位或上传</text>
            <text class="upload-card-sub">为所选消防单位上传或替换部署素材（视频/动画）</text>
          </view>
        </view>
        
        <!-- 上传loading状态 -->
        <view v-if="uploadingDeployment" class="upload-loading">
          <view class="loading-spinner"></view>
          <text class="loading-text">上传中...</text>
        </view>
      </view>
    </view>

    <!-- 自定义底部选择器（替代系统 actionSheet，保证纯白底无阴影） -->
    <view class="sheet-mask" v-if="showMediaSheet" @tap="closeSheet">
      <view class="sheet-panel" @tap.stop>
        <view class="sheet-item" @tap="onSelectSheet('video')">上传视频</view>
        <view class="sheet-item" @tap="onSelectSheet('image')">上传动画</view>
        <view class="sheet-cancel" @tap="closeSheet">取消</view>
      </view>
    </view>

  </view>
</template>
  
<script>
  import { locationTabList } from '@/commons/mock/index.js'
  import { 
    getSafetyLevelByScore, 
    getSafetyLevelText, 
    getSafetyLevelClass, 
    getProgressBarClass 
  } from './safetyScoreData.js';
  import { withDatedPath, debounce } from '@/commons/js/utils.js'

  export default {
    name: 'LocationForm',
    props: {
      serverUrl: {
        type: String,
        required: true
      },
      editId: {
        type: String,
        default: ''
      },
      initialData: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        // 子组件本地状态
        formData: {
          addressName: '',
          addressExt: '',
          addressId: '',
          allSenceLink: '',
          type: 1,
          keywordType: '',
          description: '',
          ownerInfo: {
            total: 0,
            count: 0
          },
          fireUnitDeploymentMap: [],
          fireSafetyScore: null,
          enterGateList: [],
          phoneList: [],
          imgList: [],
          defaultImg: '',
          // 消火栓性能参数
          hydrantPressure: '0.05',
          hydrantFlow: '10'
        },
        errors: {},
        tempAllSenceLink: '', // 临时存储全景云地址（用于弹窗编辑）
        locationTypeOptions: [], // 单位类型选项
        // 队站辖区关键字选项
        keywordOptions: [],
        keywordPickerIndex: 0,
        // 消防单位相关
        fireUnitOptions: [],
        selectedFireUnit: null,
        fireUnitPickerIndex: 0,
        gateOptions: [
          { name: '东门', type: 1 },
          { name: '南门', type: 2 },
          { name: '西门', type: 3 },
          { name: '北门', type: 4 }
        ],
        contactTypeOptions: [
          { value: 1, label: '单位负责人' },
          { value: 2, label: '消防负责人' }
        ],
        showContactModalFlag: false,
        contactModalMode: 'add',
        contactForm: {
          name: '',
          phone: '',
          type: 1,
          index: -1
        },
        showMediaSheet: false,
        uploadingDeployment: false,
        // 节流时间戳
        throttleTimestamps: { chooseMedia: 0, addImage: 0, addDefault: 0 },
        // 全景云地址编辑弹窗
        showLinkModalFlag: false,
        tempAllSenceLinkSuffix: '',
        // 户主统计
        residentCount: 0
      }
    },
    created() {
      // 初始化单位类型选项
      this.locationTypeOptions = locationTabList.map(item => ({
        value: item.type,
        label: item.name
      }));
      // 初始化"队站辖区"的关键字选项（过滤掉"全部"）
      const district = locationTabList.find(item => item.type === 3)
      const allKeywords = (district && Array.isArray(district.keywordOptions) && district.keywordOptions.length > 0)
        ? district.keywordOptions
        : []
      // 过滤掉"全部"选项
      this.keywordOptions = allKeywords.filter(item => item.value !== 'all')
      // 默认关键字：虞山森林-全景云
      if (!this.formData.keywordType) {
        const defaultKeyword = this.keywordOptions.find(item => item.value === 'yushanForestPanorama')
        this.formData.keywordType = defaultKeyword ? defaultKeyword.value : (this.keywordOptions[0]?.value || '')
      }
      this.setFormData(this.initialData)
      // 重点单位下拉：预加载消防单位
      this.fetchFireUnits()
      // 防抖：地址编号唯一性校验
      this.debouncedCheckAddressId = debounce(this.checkAddressIdRaw, 600)
    },
    computed: {
      contactTypeLimits() {
        const unitContacts = this.formData?.phoneList?.filter(contact => contact.type === 1);
        const fireContacts = this.formData?.phoneList?.filter(contact => contact.type === 2);
        
        return {
          unitFull: unitContacts?.length >= 1,
          fireFull: fireContacts?.length >= 1
        };
      },
      getLocationTypeText() {
        if (this.locationTypeOptions.length === 0 || !this.formData.type) return '请选择类型'
        return this.locationTypeOptions.find(item => item.value === this.formData.type).label
      },
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
      },
      // 当前选中消防单位对应的素材路径
      currentDeploymentPath() {
        if (!this.selectedFireUnit) return ''
        const list = this._ensureDeploymentArray(this.formData.fireUnitDeploymentMap)
        const found = list.find(it => String(it.key) === String(this.selectedFireUnit))
        return found ? found.data || '' : ''
      },
      // 关键字当前显示的 label（根据 value 反查）
      getKeywordLabel() {
        if (!Array.isArray(this.keywordOptions) || this.keywordOptions.length === 0) return ''
        const found = this.keywordOptions.find(o => String(o.value) === String(this.formData.keywordType))
        return found ? found.label : (this.keywordOptions[0]?.label || '')
      },
      // 判断当前关键字类型是全景云还是消火栓
      currentKeywordCategory() {
        if (!this.formData.keywordType || this.formData.type !== 3) return ''
        const found = this.keywordOptions.find(o => String(o.value) === String(this.formData.keywordType))
        return found ? found.category : ''
      },
      // 是否为全景云
      isPanorama() {
        return this.currentKeywordCategory === 'panorama'
      },
      // 是否为消火栓
      isHydrant() {
        return this.currentKeywordCategory === 'hydrant'
      }
    },
    methods: {      
      // 是否需要节流：同一 key 在 wait 内仅触发一次
      shouldThrottle(key, wait = 800) {
        const now = Date.now()
        const last = this.throttleTimestamps?.[key] || 0
        if (now - last < wait) return true
        if (this.throttleTimestamps) this.throttleTimestamps[key] = now
        return false
      },

      getFormData() { 
        return { 
          ...this.formData,
          // 确保经纬度信息被包含在提交数据中
          latitude: this.formData.latitude || null,
          longitude: this.formData.longitude || null,
          keywordType: this.formData.keywordType || 'all'
        } 
      },
      setFormData(data = {}) {
        if (Object.keys(data).length > 0) {
          this.formData = { ...this.formData, ...data }
          // 队站辖区：同步关键字默认值与索引（按 value 匹配）
          if (this.formData.type === 3) {
            const incomingKeyword = data.keywordType || this.formData.keywordType
            const idx = this.keywordOptions.findIndex(o => String(o.value) === String(incomingKeyword))
            if (idx >= 0) {
              this.formData.keywordType = this.keywordOptions[idx].value
              this.keywordPickerIndex = idx
            } else {
              // 默认选择"虞山森林-全景云"
              const defaultKeyword = this.keywordOptions.find(item => item.value === 'yushanForestPanorama')
              this.formData.keywordType = defaultKeyword ? defaultKeyword.value : (this.keywordOptions[0]?.value || '')
              const defaultIdx = this.keywordOptions.findIndex(o => String(o.value) === String(this.formData.keywordType))
              this.keywordPickerIndex = defaultIdx >= 0 ? defaultIdx : 0
            }
          }
          // 从 location/detail 返回的 ownerInfo 节点回填住户总数
          const ownerInfo = data && data.ownerInfo
          if (ownerInfo && typeof ownerInfo.total === 'number') {
            this.residentCount = ownerInfo.total
          } else if (ownerInfo && typeof ownerInfo.count === 'number') {
            this.residentCount = ownerInfo.count
          }
        } else {
          this.formData = this.$options.data().formData
          this.residentCount = 0
        }
      },
      validate() {
        this.errors = {}
        const fd = this.formData
        const must = v => v && String(v).trim()
        
        // 检查是否选择了地址（必须有经纬度）
        if (!fd.latitude || !fd.longitude) {
          this.errors.addressName = '请先选择地址'
          uni.showToast({ title: '请先选择地址', icon: 'none' })
          return false
        }
        
        if (!must(fd.addressName)) this.errors.addressName = '请先选择地址'
        if (!must(fd.addressId)) this.errors.addressId = '请输入地址编号'
        if (!fd.type) this.errors.type = '请输入单位类型'
        
        // 队站辖区根据类型验证不同字段
        if (fd.type === 3) {
          // 全景云：验证全景云编号、地址名称、全景云地址
          if (this.isPanorama) {
            if (!must(fd.addressId)) this.errors.addressId = '请输入全景云编号'
            if (!must(fd.addressName)) this.errors.addressName = '请先选择地址'
            if (!must(fd.allSenceLink)) this.errors.allSenceLink = '请输入全景云地址'
          }
          // 消火栓：验证消火栓编号、地址名称、详细地址、性能参数
          if (this.isHydrant) {
            if (!must(fd.addressId)) this.errors.addressId = '请输入消火栓编号'
            if (!must(fd.addressName)) this.errors.addressName = '请先选择地址'
            if (!must(fd.addressExt)) this.errors.addressExt = '请先选择地址'
            if (!must(fd.hydrantPressure)) this.errors.hydrantPressure = '请输入消火栓压力'
            if (!must(fd.hydrantFlow)) this.errors.hydrantFlow = '请输入消火栓流量'
          }
        } else {
          // 非队站辖区：验证详细地址和全景云地址
          if (!must(fd.addressExt)) this.errors.addressExt = '请先选择地址'
          if (!must(fd.allSenceLink)) this.errors.allSenceLink = '请输入全景云地址'
          if (!must(fd.defaultImg)) this.errors.defaultImg = '必须配置一张默认图片'
          if (!Array.isArray(fd.enterGateList) || fd.enterGateList.length === 0) this.errors.enterGateList = '至少需要选择一个可出行大门'
          if (!Array.isArray(fd.phoneList) || fd.phoneList.length === 0) this.errors.phoneList = '至少需要配置一个联系人'
          if (!Array.isArray(fd.imgList) || fd.imgList.length === 0) this.errors.imgList = '至少需要配置一张消防地图'
        }
        const ok = Object.values(this.errors).every(e => !e)
        if (!ok) {
          const msg = Object.values(this.errors).find(e => !!e) || '请完善必填项'
          uni.showToast({ title: msg, icon: 'none' })
        }
        return ok
      },
      // 输入事件处理（已移除未使用的空方法）
      
      async onAddressIdInput(e) {
        this.debouncedCheckAddressId(e?.detail?.value || '')
      },
      async checkAddressIdRaw(value) {
        if (!String(value || '').trim()) {
          this.errors.addressId = '请输入地址编号'
          return
        }
        try {
          const res = await new Promise((resolve, reject) => {
            uni.request({
              url: this.serverUrl + '/location/checkAddressId?addressId=' + encodeURIComponent(value),
              method: 'GET',
              success: resolve,
              fail: reject
            })
          })
          if (res?.data?.data?.exists) {
            this.errors.addressId = res?.data?.msg || '地址编号已存在'
            uni.showToast({ title: res?.data?.msg || '地址编号已存在', icon: 'none' })
          } else {
            this.errors.addressId = ''
          }
        } catch (e) {
          this.errors.addressId = e?.message || '校验失败'
        }
      },
      
      // 打开/关闭全景云地址弹窗
      openLinkModal() {
        this.tempAllSenceLink = this.formData.allSenceLink || ''
        this.showLinkModalFlag = true
      },
      closeLinkModal() {
        this.showLinkModalFlag = false
      },
      confirmLink() {
        const link = String(this.tempAllSenceLink || '').trim()
        this.formData.allSenceLink = link
        if (this.errors.allSenceLink) this.errors.allSenceLink = ''
        this.closeLinkModal()
      },
      // 关键字选择处理（队站辖区）
      onKeywordChange(e) {
        const idx = Number(e?.detail?.value || 0)
        this.keywordPickerIndex = idx
        const opt = this.keywordOptions[idx] || this.keywordOptions[0]
        this.formData.keywordType = opt ? opt.value : ''
        // 切换关键字类型时，清空相关字段
        if (opt && opt.category === 'panorama') {
          // 切换到全景云，清空消火栓相关字段
          this.formData.hydrantPressure = ''
          this.formData.hydrantFlow = ''
        } else if (opt && opt.category === 'hydrant') {
          // 切换到消火栓，清空全景云地址
          this.formData.allSenceLink = ''
        }
      },
      // 住户数量从 location/detail 接口的 ownerInfo 节点回填
      // 跳转户主编辑页
      goOwnerInfoEdit() {
        const addressId = this.formData.addressId || this.editId || ''
        if (!addressId) {
          uni.showToast({ title: '请先填写地址编号', icon: 'none' })
          return
        }
        uni.navigateTo({
          url: `/pages/personal/userDetail/OwnerInfo?mode=edit&addressId=${encodeURIComponent(addressId)}`
        })
      },
      
      onLocationTypeChange(e) {
        const newType = this.locationTypeOptions[e.detail.value].value;
        const oldType = this.formData.type
        // 如果类型发生变化，处理相关字段
        if (newType !== oldType) {
          const originalList = this._ensureDeploymentArray(this.formData.fireUnitDeploymentMap)
          // 清空相关字段
          if (oldType === 2) {
            this.formData.fireUnitDeploymentMap = []
          }
          // 如果切换到重点单位（type=2），反填作战实景部署
          if (newType === 2 && originalList.length > 0) {
            this.formData.fireUnitDeploymentMap = [...originalList]
          }
          // 切换到队站辖区（type=3）时，确保关键字有默认值与索引（按 value 匹配）
          if (newType === 3) {
            if (!this.formData.keywordType) {
              // 默认选择"虞山森林-全景云"
              const defaultKeyword = this.keywordOptions.find(item => item.value === 'yushanForestPanorama')
              this.formData.keywordType = defaultKeyword ? defaultKeyword.value : (this.keywordOptions[0]?.value || '')
            }
            const idx = this.keywordOptions.findIndex(o => String(o.value) === String(this.formData.keywordType))
            this.keywordPickerIndex = idx >= 0 ? idx : 0
          }
        }
        this.$set(this.formData, 'type', newType)
      },
      // 消防单位
      async fetchFireUnits() {
        try {
          const res = await new Promise((resolve, reject) => {
            uni.request({
              url: this.serverUrl + '/static/data',
              method: 'GET',
              data: { type: 'fireUnits', key: 'unitList' },
              success: resolve,
              fail: reject
            })
          })
          const list = res?.data?.data || []
          // 后端静态数据：data1 为展示名称(value)，data2 为唯一key
          this.fireUnitOptions = list.map((it, idx) => ({ label: it.data1, value: String(it.data2), index: idx }))
          // 如果已有部署映射但暂无文字 value，尝试补齐 value 显示名
          if (Array.isArray(this.formData.fireUnitDeploymentMap)) {
            this.formData.fireUnitDeploymentMap = this.formData.fireUnitDeploymentMap.map(item => ({
              key: String(item.key),
              value: item.value || (this.fireUnitOptions.find(o => String(o.value) === String(item.key))?.label || ''),
              data: item.data || ''
            }))
          }
          // 默认选中第一个
          if (this.fireUnitOptions.length > 0) {
            this.fireUnitPickerIndex = 0
            this.selectedFireUnit = this.fireUnitOptions[0].value
            // 不自动拉取部署素材，改为用户手动上传
          }
        } catch (e) {
          this.fireUnitOptions = []
        }
      },
      getFireUnitText(val) {
        const opt = this.fireUnitOptions.find(it => it.value === val)
        return opt ? opt.label : '请选择消防单位'
      },
      onFireUnitChange(e) {
        const idx = e.detail.value
        this.fireUnitPickerIndex = idx
        const opt = this.fireUnitOptions[idx]
        this.selectedFireUnit = opt ? opt.value : null
        // 不自动拉取素材，改为仅根据选择显示本地映射并支持手动上传
      }, 
      getContactTypeText(type) {
        const option = this.contactTypeOptions.find(item => item.value === type);
        return option ? option.label : '未知类型';
      },
      
      // 可出行大门管理方法
      isGateSelected(gateName) {
        return this.formData?.enterGateList?.some(gate => gate.name === gateName);
      },
      
      toggleGate(gateName) {
        const existingIndex = this.formData.enterGateList.findIndex(gate => gate.name === gateName);
        if (existingIndex >= 0) {
          this.formData.enterGateList.splice(existingIndex, 1);
        } else {
          const gateOption = this.gateOptions.find(option => option.name === gateName);
          this.formData.enterGateList.push({
            name: gateName,
            type: gateOption ? gateOption.type : this.formData.enterGateList.length + 1
          });
        }
        
        if (this.errors.enterGateList) { this.errors.enterGateList = '' }
      },
      
      // 联系人管理方法
      showContactModal(mode = 'add', index = -1) {
        if (mode === 'add' && this.formData.phoneList.length >= 2) {
          uni.showToast({
            title: '最多只能配置2个联系人',
            icon: 'none'
          });
          return;
        }
        
        this.contactModalMode = mode;
        this.contactForm.name = '';
        this.contactForm.phone = '';
        this.contactForm.type = 1;
        this.contactForm.index = index;
        
        if (mode === 'edit' && index >= 0 && this.formData.phoneList[index]) {
          const contact = this.formData.phoneList[index];
          this.contactForm.name = contact.name;
          this.contactForm.phone = contact.phone;
          this.contactForm.type = contact.type;
        }
        
        this.showContactModalFlag = true;
      },
      
      hideContactModal() {
        this.showContactModalFlag = false;
      },
  
      selectContactType(type) {
        this.contactForm.type = type;
      },
  
      saveContact() {
        this.hideContactModal();
        if (!this.contactForm.name || !this.contactForm.phone || !this.contactForm.type) {
          uni.showToast({
            title: '请填写完整信息',
            icon: 'none'
          });
          return;
        }
  
        if (this.contactModalMode === 'add') {
          if (this.contactForm.type === 1 && this.contactTypeLimits.unitFull) {
            uni.showToast({
              title: '单位负责人已配置，不能重复添加',
              icon: 'none'
            });
            return;
          }
          if (this.contactForm.type === 2 && this.contactTypeLimits.fireFull) {
            uni.showToast({
              title: '消防负责人已配置，不能重复添加',
              icon: 'none'
            });
            return;
          }
          
          this.formData.phoneList.push({
            name: this.contactForm.name,
            phone: this.contactForm.phone,
            type: this.contactForm.type
          });
        } else if (this.contactModalMode === 'edit') {
          const oldContact = this.formData.phoneList[this.contactForm.index];
          if (oldContact.type !== this.contactForm.type) {
            if (this.contactForm.type === 1 && this.contactTypeLimits.unitFull) {
              uni.showToast({
                title: '单位负责人已配置，不能重复添加',
                icon: 'none'
              });
              return;
            }
            if (this.contactForm.type === 2 && this.contactTypeLimits.fireFull) {
              uni.showToast({
                title: '消防负责人已配置，不能重复添加',
                icon: 'none'
              });
              return;
            }
          }
          
          this.formData.phoneList[this.contactForm.index] = {
            name: this.contactForm.name,
            phone: this.contactForm.phone,
            type: this.contactForm.type
          };
        }
              
        if (this.errors.phoneList) { this.errors.phoneList = '' }
        
        uni.showToast({
          title: this.contactModalMode === 'add' ? '联系人添加成功' : '联系人更新成功',
          icon: 'success'
        });
      },
      
      deletePhoneContact(index) {
        if (this.formData.phoneList.length <= 1) {
          uni.showToast({
            title: '至少需要配置一个联系人',
            icon: 'none'
          });
          return;
        }
        
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这个联系人吗？',
          success: (res) => {
            if (res.confirm) {
              this.formData.phoneList.splice(index, 1);
              
              if (this.errors.phoneList) { this.errors.phoneList = '' }
            }
          }
        });
      },
    
      // 图片管理方法
      addImage() {
        if (this.shouldThrottle('addImage')) return
        if (this.formData.imgList.length >= 3) {
          uni.showToast({
            title: '最多只能上传3张图片',
            icon: 'none'
          });
          return;
        }
        
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: (res) => {
            const filePath = (res.tempFilePaths && res.tempFilePaths[0]) || (res.tempFiles && res.tempFiles[0]?.path) || '';
            if (!filePath) {
              uni.showToast({ title: '未选择有效图片', icon: 'none' });
              return;
            }
            uni.showLoading({ title: '上传中...' });
            uni.uploadFile({
              url: this.serverUrl + '/files/upload',
              filePath,
              name: 'file',
              fileType: 'image',
              formData: {
                addressId: this.formData.addressId || this.editId || '',
                url: withDatedPath('/uploadImg/locationEdit'),
                name: 'locationImg_' + this.editId + Math.ceil(Math.random()*10),
              },
              success: (uploadRes) => {
                try {
                  const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
                  const backImg = parsed?.data || '';
                  if (!backImg) {
                    throw new Error('上传返回为空');
                  }
                  this.formData.imgList.push(backImg);
                  uni.showToast({ title: '图片上传成功', icon: 'success' });
                } catch (e) {
                  uni.showToast({ title: '图片解析失败', icon: 'none' });
                }
              },
              fail: (err) => {
                uni.showToast({ title: '上传失败: ' + (err?.errMsg || ''), icon: 'none' });
              },
              complete: () => {
                uni.hideLoading();
              }
            });
          },
          fail: () => {
            uni.showToast({ title: '取消选择', icon: 'none' });
          }
        });
      },
      
      deleteImage(index) {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这张图片吗？',
          success: (res) => {
            if (res.confirm) {
              this.formData.imgList.splice(index, 1);
            }
          }
        });
      },
      
      // 判断路径是否为视频
      isVideoPath(path) {
        if (!path) return false
        const p = String(path).toLowerCase()
        return p.endsWith('.mp4') || p.endsWith('.mov') || p.endsWith('.m4v') || p.endsWith('.webm') || p.endsWith('.ogg')
      },
      // 解析图片URL（微信小程序兼容）
      resolveImageUrl(path) {
        if (!path) return '';
        // 如果已经是完整的HTTPS URL，直接返回
        if (path.startsWith('https://')) return path;
        // 如果是相对路径，拼接服务器地址
        if (path.startsWith('/')) {
          return this.serverUrl + path;
        }
        // 其他情况，添加斜杠后拼接
        return this.serverUrl + '/' + path;
      },

      // 作战实景部署：统一选择器
      chooseDeploymentMedia() {
        if (this.shouldThrottle('chooseMedia')) return
        this.showMediaSheet = true
      },
            // 作战实景部署：统一上传方法（视频或动画）
      addDeploymentMedia(mediaType) {
        const isVideo = mediaType === 'video';
        const chooseMethod = isVideo ? uni.chooseVideo : uni.chooseImage;
        const chooseOptions = isVideo ? {
          sourceType: ['album', 'camera'],
          compressed: true
        } : {
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        };
        
        chooseMethod({
          ...chooseOptions,
          success: (res) => {
            const filePath = isVideo ? res.tempFilePath : 
              (res.tempFilePaths && res.tempFilePaths[0]) || (res.tempFiles && res.tempFiles[0]?.path) || '';
            
            if (!filePath) {
              uni.showToast({ 
                title: `未选择有效${isVideo ? '视频' : '图片'}`, 
                icon: 'none' 
              });
              return;
            }
            
            this.uploadingDeployment = true;
            uni.uploadFile({
              url: this.serverUrl + '/files/upload',
              filePath,
              name: 'file',
              fileType: isVideo ? 'video' : 'image',
              formData: {
                addressId: this.formData.addressId || this.editId || '',
                url: isVideo ? withDatedPath('/uploadVideo/locationEdit') : withDatedPath('/uploadImg/locationEdit'),
                name: `battle${isVideo ? 'Video' : 'Anim'}_${this.editId || 'temp'}_${Date.now()}`
              },
              success: (uploadRes) => {
                try {
                  const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
                  const backPath = parsed?.data || '';
                  if (!backPath) throw new Error('上传返回为空');
                  // 将素材与选中的消防单位建立映射（数组：{ key, value, data }）
                  if (this.selectedFireUnit) {
                    const label = this.getFireUnitText(this.selectedFireUnit)
                    this._upsertDeploymentEntry({ key: String(this.selectedFireUnit), value: label, data: backPath })
                  }
                  
                  uni.showToast({ 
                    title: `${isVideo ? '视频' : '动画'}上传成功`, 
                    icon: 'success' 
                  });
                } catch (e) {
                  console.error(`${isVideo ? '视频' : '动画'}解析失败:`, e);
                  uni.showToast({ 
                    title: `${isVideo ? '视频' : '动画'}解析失败`, 
                    icon: 'none' 
                  });
                }
              },
              fail: (err) => {
                console.error(`${isVideo ? '视频' : '动画'}上传失败:`, err);
                uni.showToast({ 
                  title: `上传失败: ${err?.errMsg || ''}`, 
                  icon: 'none' 
                });
              },
              complete: () => {
                this.uploadingDeployment = false;
              }
            });
          },
          fail: () => uni.showToast({ title: '取消选择', icon: 'none' })
        });
      },
      
      // 自定义选择器
      closeSheet() { this.showMediaSheet = false },
      onSelectSheet(type) {
        this.showMediaSheet = false;
        this.addDeploymentMedia(type);
      },
      deleteDeploymentMedia() {
        uni.showModal({
          title: '确认删除',
          content: '确定删除该作战素材吗？',
          success: (res) => {
            if (res.confirm) {
              const list = this._ensureDeploymentArray(this.formData.fireUnitDeploymentMap)
              const idx = list.findIndex(it => String(it.key) === String(this.selectedFireUnit))
              if (idx > -1) {
                list.splice(idx, 1)
                this.formData.fireUnitDeploymentMap = list
              }
              uni.showToast({ title: '删除成功', icon: 'success' })
            }
          }
        })
      },
      // 工具方法：保证为数组结构
      _ensureDeploymentArray(raw) {
        if (Array.isArray(raw)) return raw
        if (raw && typeof raw === 'object') {
          return Object.keys(raw).map(k => ({ key: String(k), value: this.getFireUnitText(k), data: raw[k] }))
        }
        return []
      },
      // 工具方法：插入或更新条目
      _upsertDeploymentEntry(entry) {
        const list = this._ensureDeploymentArray(this.formData.fireUnitDeploymentMap)
        const idx = list.findIndex(it => String(it.key) === String(entry.key))
        if (idx > -1) {
          const updated = list.slice()
          updated[idx] = { ...updated[idx], ...entry }
          this.$set(this.formData, 'fireUnitDeploymentMap', updated)
        } else {
          const updated = list.concat([{ key: String(entry.key), value: entry.value || '', data: entry.data || '' }])
          this.$set(this.formData, 'fireUnitDeploymentMap', updated)
        }
        this.$nextTick(() => {})
      },
      // 默认图片管理方法
      addDefaultImage() {
        if (this.shouldThrottle('addDefault')) return
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: (res) => {
            const filePath = (res.tempFilePaths && res.tempFilePaths[0]) || (res.tempFiles && res.tempFiles[0]?.path) || '';
            if (!filePath) {
              uni.showToast({ title: '未选择有效图片', icon: 'none' });
              return;
            }
            uni.showLoading({ title: '上传中...' });
            uni.uploadFile({
              url: this.serverUrl + '/files/upload',
              filePath,
              name: 'file',
              fileType: 'image',
              formData: {
                addressId: this.formData.addressId || this.editId || '',
                url: withDatedPath('/uploadImg/locationEdit'),
                name: 'locationDefaultImg_' + this.editId + Math.ceil(Math.random()*10),
              },
              success: (uploadRes) => {
                try {
                  const parsed = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
                  const backImg = parsed?.data || '';
                  if (!backImg) {
                    throw new Error('上传返回为空');
                  }
                  this.formData.defaultImg = backImg;
                  if (this.errors.defaultImg) {
                    this.$emit('clear-error', 'defaultImg');
                  }
                  uni.showToast({ title: '默认图片上传成功', icon: 'success' });
                } catch (e) {
                  uni.showToast({ title: '图片解析失败', icon: 'none' });
                }
              },
              fail: (err) => {
                uni.showToast({ title: '上传失败: ' + (err?.errMsg || ''), icon: 'none' });
              },
              complete: () => {
                uni.hideLoading();
              }
            });
          },
          fail: () => {
            uni.showToast({ title: '取消选择', icon: 'none' });
          }
        });
      },
      
      deleteDefaultImage() {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除默认图片吗？',
          success: (res) => {
            if (res.confirm) {
              this.formData.defaultImg = '';
              if (this.errors.defaultImg) {
                this.$emit('clear-error', 'defaultImg');
              }
              uni.showToast({ title: '默认图片已删除', icon: 'success' });
            }
          }
        });
      },
      
      // 计算安全评分总分
      calculateTotalScore() {
        if (!this.formData.fireSafetyScore || !this.formData.fireSafetyScore.scoreItems) {
          return 0;
        }
        let totalScore = 0;
        const scoreItems = this.formData.fireSafetyScore.scoreItems;
        for (const key in scoreItems) {
          if (scoreItems[key] && typeof scoreItems[key].score === 'number') {
            totalScore += scoreItems[key].score;
          }
        }
        return totalScore;
      },

      // 添加安全评分
      addSafetyScore() {
        this.$emit('add-safety-score');
      },

      // 编辑安全评分
      editSafetyScore() {
        this.$emit('edit-safety-score');
      },
      
      // 打开地图选择器（跳转到卫星地图页面）
      openMapSelector() {
        // 跳转到地图页面，默认显示卫星地图
        uni.navigateTo({
          url: `/subPackages/locationInfo/mapView/index?enableSatellite=true&mode=select`,
          success: (res) => {
            // 页面打开成功，监听页面返回事件
            res.eventChannel.on('locationSelected', (data) => {
              this.handleLocationResult(data);
            });
          },
          fail: (err) => {
            console.error('打开地图页面失败:', err);
            // 如果跳转失败，回退到原来的选择方式
            // #ifdef MP-WEIXIN
            uni.chooseLocation({
              success: (res) => {
                this.handleLocationResult(res);
              },
              fail: (err) => {
                console.error('选择位置失败:', err);
              }
            });
            // #endif
          }
        });
      },
      
      // 处理位置选择结果
      handleLocationResult(locationData) {
        if (locationData && locationData.name) {
          // 回填地址信息
          this.formData.addressName = locationData.name || '';
          this.formData.addressExt = locationData.address || '';
          
          // 如果有经纬度，保存到表单数据中
          if (locationData.latitude && locationData.longitude) {
            this.formData.latitude = locationData.latitude;
            this.formData.longitude = locationData.longitude;
          }
          
          // 强制更新视图
          this.$forceUpdate();
          
          uni.showToast({
            title: '地址信息已更新',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: '您未选择地址，请点击地址选择器重新选择',
            icon: 'none'
          });
        }
      },
      
      // 获取当前位置（H5端）
      getCurrentLocation() {
        uni.getLocation({
          type: 'gcj02',
          success: (res) => {
            console.log('获取位置成功:', res);
            // 保存经纬度信息
            this.formData.latitude = res.latitude;
            this.formData.longitude = res.longitude;
            
            uni.showToast({
              title: '位置信息已获取',
              icon: 'success'
            });
          },
          fail: (err) => {
            console.error('获取位置失败:', err);
            // 检查是否是权限问题
            if (err.errMsg && err.errMsg.includes('auth deny')) {
              this.showLocationAuthModal();
            } else {
              uni.showToast({
                title: '获取位置失败',
                icon: 'none'
              });
            }
          }
        });
      },
      
      // 显示定位授权提示
      showLocationAuthModal() {
        uni.showModal({
          title: '需要定位权限',
          content: '为了获取您的位置信息，请在设置中开启定位权限',
          showCancel: true,
          cancelText: '取消',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              // 打开设置页面
              uni.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.userLocation']) {
                    uni.showToast({
                      title: '定位权限已开启',
                      icon: 'success'
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  }
  </script>

<style lang="scss" scoped>
@import '@/commons/css/safety-score.css';
/* 根容器样式 */
.location-form {
  width: 100%;
  min-height: 100%;
  padding: 0;
  background: #f5f5f5;
}

/* 通用区域样式 */
.location-info-section,
.safety-section,
.config-section {
  background: #ffffff;
  margin-top: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  border-radius: 16rpx;
  
  &:first-child {
    margin-top: 0;
  }
}

/* 通用区域头部样式 */
.section-header {
  padding: 12rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333333;
    .required { color: #ff4d4f; }
  }
}

.header-actions {
  display: flex;
  align-items: center;
}

/* 位置信息区域特殊设置 */
.location-info-section .section-header {
  padding: 12rpx 24rpx;
}

/* 安全信息区域内容 */
.safety-content {
  padding: 12rpx 20rpx;
  width: 100%;
  box-sizing: border-box;
  
  .safety-summary {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    gap: 16rpx;
  }
  
  .safety-score-display {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    box-sizing: border-box;
    gap: 12rpx;
    background: linear-gradient(135deg, #f8faff 0%, #f0f8ff 100%);
    border: 1rpx solid #e6f4ff;
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    transition: all 0.3s ease;
    width: 100%;
    min-width: 0;
    
    .score-display-content {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      gap: 8rpx;
    }
    
    &:hover {
      transform: translateY(-2rpx);
      box-shadow: 0 4rpx 16rpx rgba(24, 144, 255, 0.15);
    }
  }
  
  .score-label {
    font-size: 26rpx;
    color: #333333;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .score-value {
    font-size: 32rpx;
    color: #007aff;
    font-weight: 700;
    white-space: nowrap;
  }
  
  .level-value {
    font-size: 26rpx;
    font-weight: 500;
    white-space: nowrap;
    
    &.excellent {
      color: #34c759;
    }
    
    &.good {
      color: #007aff;
    }
    
    &.poor {
      color: #ff9500;
    }
  }
  
  /* 分数进度条样式 */
  .score-progress-section {
    width: 100%;
  }
  
  .progress-bar-container {
    position: relative;
    width: 100%;
  }
  
  .progress-bar {
    height: 14rpx;
    background: #e8f4ff;
    border-radius: 8rpx;
    overflow: hidden;
    position: relative;
    width: 100%;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 8rpx;
    transition: width 0.6s ease;
  }
  
  .progress-markers {
    display: flex;
    justify-content: space-between;
    position: relative;
    width: 100%;
  }
  
  .marker {
    position: relative;
    width: 60rpx;
    text-align: center;
    
    &::before {
      content: '';
      position: absolute;
      top: -6rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 2rpx;
      height: 10rpx;
      background: #d9d9d9;
    }
  }
  
  .marker-text {
    font-size: 20rpx;
    color: #666666;
    font-weight: 500;
  }
}

/* 配置区域内容 */
.gate-list,
.contact-list {
  padding: 0 24rpx;
}

.gate-item,
.contact-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #fafbfc;
  }
}

/* 联系人弹窗样式 */
.contact-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8rpx);
}

.modal-content {
  width: 95%;
  max-width: 700rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 
    0 32rpx 64rpx rgba(0, 0, 0, 0.15),
    0 8rpx 32rpx rgba(0, 0, 0, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  align-items: center;
  background: #ffffff;
  position: relative;
  color: #1f2d3d;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2d3d;
  flex: 1;
  text-align: left;
  padding-left: 0;
  letter-spacing: 0.5rpx;
}

.close-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30rpx;
  color: #666;
  font-weight: 300;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: #f5f7fa;
  backdrop-filter: none;
  
  &:active {
    background: #f0f0f0;
    transform: scale(0.9) rotate(90deg);
  }
}

.modal-body {
  padding: 24rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  background: #ffffff;
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 弹窗中的表单标签样式 */
.form-group .form-label {
  font-size: 30rpx;
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: 0.5rpx;
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 12rpx;
  margin-top: 8rpx;
}

.form-group .required {
  color: #e74c3c;
  margin-left: 6rpx;
  font-weight: 700;
  font-size: 32rpx;
}

.form-modal-input {
  height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.contact-type-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.type-option {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  &:active {
    transform: scale(0.98) translateY(2rpx);
  }
  
  &.active {
    border-color: #1890ff;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(24, 144, 255, 0.03) 100%);
    box-shadow: 
      0 0 0 6rpx rgba(24, 144, 255, 0.1),
      0 4rpx 16rpx rgba(24, 144, 255, 0.15);
    transform: translateY(-2rpx);
  }
}

.checkbox {
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid #cbd5e0;
  border-radius: 6rpx;
  margin-right: 16rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
}

.type-option.active .checkbox {
  border-color: #1890ff;
  background: #1890ff;
}

.checkbox-inner {
  width: 20rpx;
  height: 20rpx;
  background: transparent;
  border-radius: 0;
  transform: scale(0);
  animation: checkmark 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  position: relative;
  
  /* 使用图片 */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.type-option.active .checkbox-inner {
  transform: scale(1);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>');
}

.type-label {
  font-size: 24rpx;
  color: #2c3e50;
  font-weight: 500;
  flex: 1;
}

@keyframes checkmark {
  from {
    transform: scale(0) rotate(-45deg);
  }
  to {
    transform: scale(1) rotate(0deg);
  }
}

.modal-footer {
  display: flex;
  padding: 10rpx;
  border-top: 1rpx solid #e1e8ed;
  background: #ffffff;
  gap: 20rpx;
}

.footer-btn {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:active {
    transform: translateY(3rpx);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:active::before {
    left: 100%;
  }
}

.cancel-btn {
  color: #636e72;
}

/* 确认按钮继承footer-btn的样式，只需要特殊背景 */
.confirm-btn { background: #1890ff; color: #ffffff; }

/* 链接弹窗体更紧凑 */
.link-modal { max-width: 720rpx; }

.tip-text {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8c8c8c;
  padding-left: 2rpx;
}

/* 弹窗动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(80rpx) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 表单项样式 */
.form-item {
  margin: 0;
  padding: 12rpx 20rpx; /* 增加上下间距 */
  display: flex;
  align-items: center;
  min-height: 72rpx;
  background: #ffffff;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #fafbfc;
  }
}

/* 表单项中的标签样式 */
.form-item .form-label {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #333333;
  font-weight: 600;
  margin-right: 24rpx;
  min-width: 160rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.5rpx;
}

.owner-inline { display: flex; align-items: center; gap: 16rpx; margin-left: auto; }
.owner-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 6rpx;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0faff 100%);
  border: 1rpx solid #bae7ff;
  border-radius: 24rpx;
  padding: 6rpx 14rpx;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.08);
}
.badge-num {
  font-size: 28rpx;
  font-weight: 700;
  color: #1890ff;
  line-height: 1;
}
.badge-suffix {
  font-size: 22rpx;
  color: #1890ff;
  opacity: 0.8;
}


/* 链接展示区（点击唤起弹窗） */
.url-display {
  flex: 1;
  min-height: 64rpx;
  padding: 0 14rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border: 2rpx solid #e8f1ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
}

.url-display-text {
  flex: 1;
  font-size: 24rpx;
  color: #1f2d3d;
  word-break: break-all;
  padding-right: 12rpx;
}

.edit-inline-icon {
  width: 32rpx;
  height: 32rpx;
  padding: 6rpx;
  border-radius: 10rpx;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

/* URL 组合输入样式 */
.url-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 12rpx;
  .url-input {
    flex: 1;
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 12rpx;
    border: 2rpx solid #e6e6e6;
  }
}

/* 弹窗中的竖向布局与多行输入 */
.url-input-container.vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 8rpx;
  padding: 0;
}
.url-input.multiline {
  padding: 0;
}
.form-modal-textarea {
  min-height: 120rpx;
  padding: 12rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  text-align: left;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.form-item .required {
  color: #ff4d4f;
  font-weight: 600;
  margin-left: 4rpx;
}

.form-input {
  flex: 1;
  height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  letter-spacing: 0.3rpx;
  transition: all 0.3s ease;
  
  &:focus {
    background: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #95a5a6;
    font-size: 24rpx;
    font-weight: 400;
  }
}

.form-textarea {
  flex: 1;
  min-height: 120rpx; /* 提升基础高度 */
  padding: 16rpx; /* 增加内边距，提升可读性 */
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  text-align: left;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  line-height: 1.5;
  transition: all 0.3s ease;
  
  &:focus {
    background: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #95a5a6; /* 与输入框placeholder保持一致 */
    font-size: 24rpx;
    font-weight: 400;
    opacity: 0.8;
  }
}

/* 描述字段特殊样式 */
.description-item {
  align-items: flex-start;
  margin-bottom: 20rpx;
  min-height: 120rpx; /* 区块整体最小高度 */
  
  .form-label {
    display: flex;
    align-items: center;
  }
  
  .form-textarea {
    min-height: 120rpx; /* 两处 textarea 高度统一 */
    max-height: 300rpx;
    overflow-y: auto;
    padding: 0rpx 10rpx; /* 与输入框视觉对齐（微信小程序） */
    display: block;
    width: 100%;
    background: #ffffff;
  }
}

/* 地址输入容器样式 */
.address-input-container {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}

.address-input-container .form-input {
  flex: 1;
  margin-right: 0;
}

/* 地址选择器样式 */
.address-selector {
  height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border: 2rpx solid #e8f1ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 140rpx;
  flex-shrink: 0;
  
  &:active {
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%);
    border-color: #1890ff;
    box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.15);
    transform: translateY(-1rpx);
  }
}

.address-selector-text {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
  letter-spacing: 0.3rpx;
  margin-left: 8rpx;
}

.address-selector .map-icon {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.7;
}

/* 经纬度显示样式 */
.coordinates-display {
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.coordinates-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 8rpx;
}

.coordinate-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  padding: 8rpx 12rpx;
  flex: 1 1 auto;
  min-width: 200rpx;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%);
  border-radius: 8rpx;
  border: 1rpx solid #bae7ff;
  word-wrap: break-word;
  word-break: break-all;
}

.coordinate-label {
  font-size: 24rpx;
  color: #333333;
  font-weight: 600;
  letter-spacing: 0.3rpx;
  flex-shrink: 0;
  white-space: nowrap;
}

.coordinate-value {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  word-wrap: break-word;
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

/* 只读输入框样式 */
.readonly-input {
  background: #f5f5f5 !important;
  color: #666666 !important;
  cursor: not-allowed !important;
  border-color: #d9d9d9 !important;
  
  &::placeholder {
    color: #999999 !important;
  }
  
  &:focus {
    background: #f5f5f5 !important;
    box-shadow: none !important;
    outline: none !important;
  }
}

/* 选择器样式 */
.form-picker {
  flex: 1;
}

.picker-display {
  width: 100%;
  height: 64rpx;
  padding: 0 16rpx;
  border: none;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 24rpx;
  color: #333333;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  transition: all 0.3s ease;
  
  .picker-text {
    margin-right: 16rpx;
  }
}

.picker-arrow {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.6;
}

/* 大门配置样式 */
.gate-name {
  font-size: 24rpx;
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: 0.3rpx;
}

.gate-switch {
  transform: scale(0.8);
}

/* 联系人样式 */
.contact-info {
  flex: 1;
  margin-right: 16rpx;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.contact-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  letter-spacing: 0.3rpx;
}

.contact-type {
  font-size: 24rpx;
  color: #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #cceeff 100%);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  margin-left: 16rpx;
  font-weight: 500;
}

.contact-phone {
  font-size: 24rpx;
  color: #34495e;
  font-weight: 400;
}

/* 图片上传区域样式 */
.image-upload-area {
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-items: flex-start;
}

/* 未上传卡片（作战实景部署） */
.upload-card {
  width: 100%;
  box-sizing: border-box;
  min-height: 140rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fafbfc;
  gap: 16rpx;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    background: #f0f8ff;
    transform: translateY(-2rpx);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.upload-card-icon {
  width: 60rpx;
  height: 60rpx;
  opacity: 0.7;
}

.upload-card-texts {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.upload-card-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

.upload-card-sub {
  font-size: 22rpx;
  color: #888;
}

/* 默认图片上传区域样式 */
.default-image-upload-area {
  padding: 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.default-image-preview {
  position: relative;
  width: 300rpx;
  height: 200rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #f5f5f5;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }
}

.default-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-default-btn {
  width: 300rpx;
  height: 200rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    background: #f0f8ff;
    transform: translateY(-2rpx);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

/* 删除按钮覆盖层样式 */
.delete-btn-overlay {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  z-index: 10;
}

.delete-btn-small {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #ffffff;
  border: none;
  padding: 8rpx 8rpx;
  font-size: 20rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.4);
  
  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.6);
  }
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 1rpx 4rpx rgba(255, 77, 79, 0.8);
  }
}

.delete-icon-small {
  width: 24rpx;
  height: 24rpx;
  filter: brightness(0) invert(1);
}

/* 图片列表样式 */
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.video-wrapper {
  position: relative;
  width: 100%;
  border-radius: 16rpx;
  overflow: hidden;
  background: #000;
  margin-bottom: 16rpx;
}

.deploy-video {
  width: 100%;
  height: 300rpx;
  background: #000;
}

.deploy-image {
  width: 100%;
  height: 300rpx;
  background: #f5f5f5;
  object-fit: cover;
}

/* 与消防地图保持相同的外边距与内部留白 */
.deployment-section {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  position: relative;
}

/* 上传loading状态样式 */
.upload-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  z-index: 10;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}



/* 自定义底部选择器样式：纯白底、无阴影 */
.sheet-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.sheet-panel {
  width: 100%;
  background: #ffffff;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
  padding-bottom: env(safe-area-inset-bottom);
}
.sheet-item {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 30rpx;
  color: #333;
}

.sheet-cancel {
  margin-top: 12rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 30rpx;
  color: #1890ff;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 150rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #f5f5f5;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 16rpx;
}

/* 上传按钮样式 */
.upload-btn {
  width: 200rpx;
  height: 150rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    background: #f0f8ff;
    transform: translateY(-2rpx);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.upload-icon {
  width: 68rpx;
  height: 68rpx;
  margin-bottom: 12rpx;
  opacity: 0.6;
}

.upload-text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 16rpx;
}

/* 操作图标样式 */
.action-icon {
  width: 32rpx;
  height: 32rpx;
  padding: 6rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  transition: all 0.3s ease;
  
  &:active {
    background: #e6e6e6;
    transform: scale(0.95);
  }
}

.add-icon {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  
  &:active {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  }
}

.edit-icon {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  
  &:active {
    background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
  }
}

.delete-icon {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  margin-left: 16rpx;
  
  &:active {
    background: linear-gradient(135deg, #ff7875 0%, #ffa39e 100%);
  }
}

/* 空状态样式 */
.empty-state {
  padding: 48rpx 24rpx;
  text-align: center;
  color: #95a5a6;
  font-size: 28rpx;
  background: #fafbfc;
  border-radius: 12rpx;
  margin: 10rpx 24rpx;
  border: 2rpx dashed #d9d9d9;
}

.empty-text {
  color: #95a5a6;
  font-size: 28rpx;
  font-weight: 400;
}

/* 错误提示样式 */
.error-message {
  padding: 16rpx 24rpx;
  margin: 0 24rpx 16rpx 24rpx;
  background: linear-gradient(135deg, #fff2f0 0%, #ffebee 100%);
  border: 1rpx solid #ffccc7;
  border-radius: 12rpx;
  animation: shake 0.5s ease-in-out;
}

.error-text {
  color: #ff4d4f;
  font-size: 24rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  
  &::before {
    content: '⚠';
    margin-right: 8rpx;
    font-size: 28rpx;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4rpx); }
  75% { transform: translateX(4rpx); }
}

/* 消火栓性能参数样式 */
.hydrant-params {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  flex: 1;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12rpx;
  border: 2rpx solid #e8f1ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.06);
}

.param-label {
  font-size: 24rpx;
  color: #333333;
  font-weight: 600;
  min-width: 80rpx;
  flex-shrink: 0;
}

.param-input {
  flex: 1;
  height: 48rpx;
  padding: 0 12rpx;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #333333;
  background: #ffffff;
  box-sizing: border-box;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  
  &:focus {
    background: #ffffff;
    box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #95a5a6;
    font-size: 24rpx;
  }
}

.param-unit {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
  min-width: 60rpx;
  flex-shrink: 0;
}

.param-input-error {
  border: 2rpx solid #ff4d4f !important;
  background: #fff2f0 !important;
}
</style>