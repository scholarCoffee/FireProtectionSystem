<template>
  <view class="map-page">
    <!-- 地图控制按钮（非选择模式显示） -->
    <view class="map-controls" v-if="!selectMode">
      <view class="control-btn" @click="toggleSidebar">
        <text class="control-text">菜单</text>
      </view>
    </view>
    
    <!-- 搜索按钮（选择模式显示） -->
    <view class="search-btn-container" v-if="selectMode">
      <view class="search-btn" @click="openLocationSearch">
        <image :src="serverUrl + '/static/icons/location/search.png'" class="search-btn-icon" />
        <text class="search-btn-text">搜索地点</text>
      </view>
    </view>
    
    <!-- 地图容器 -->
    <view class="map-container">
      <map 
        id="locationMap"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="mapScale"
        :markers="mapMarkers"
        :show-location="true"
        :enable-3D="true"
        :enable-zoom="true"
        :enable-scroll="true"
        :enable-rotate="false"
        :enable-overlooking="false"
         :enable-satellite="internalEnableSatellite"
        :enable-traffic="false"
        class="map-view"
        @markertap="onMarkerTap"
        @callouttap="onCalloutTap"
        @regionchange="onRegionChange"
        @tap="onMapTap"
      ></map>
      
    </view>

    <!-- 遮罩层 -->
    <view class="sidebar-mask" v-if="showSidebar && !selectMode" @click="hideSidebar"></view>

    <!-- 右侧抽屉（非选择模式显示） -->
    <view class="sidebar" :class="{ active: showSidebar }" v-if="!selectMode">
      <view class="sidebar-content">
        <scroll-view class="sidebar-body" scroll-y>
          <!-- 搜索框 -->
          <view class="menu-section search-section">
            <view class="search-input-wrapper">
              <image :src="serverUrl + '/static/icons/location/search.png'" class="search-icon" />
              <input 
                v-model="searchKeyword" 
                class="search-input" 
                placeholder="搜索地址编号/全景云编号/消火栓编号"
                @input="onSearchInput"
                @confirm="onSearchConfirm"
                confirm-type="search"
              />
              <view class="search-clear" v-if="searchKeyword" @click="clearSearch">
                <text class="clear-icon">×</text>
              </view>
            </view>
          </view>
          
          <!-- 卫星地图切换 -->
          <view class="menu-section">
            <view class="menu-item" @click="toggleSatellite">
               <text class="menu-item-text">{{ internalEnableSatellite ? '普通地图' : '卫星地图' }}</text>
               <view class="switch-wrapper">
                 <switch :checked="internalEnableSatellite" color="#1890ff" />
              </view>
            </view>
          </view>

          <!-- 单位类型选择 -->
          <view class="menu-section">
            <text class="menu-label">单位类型</text>
            <view class="menu-options">
              <!-- 全部选项放在首位 -->
              <view 
                class="menu-option"
                :class="{ active: selectedType === null }"
                @click="selectLocationType(null)"
              >
                <view class="checkbox">
                  <view class="checkbox-inner" v-if="selectedType === null"></view>
                </view>
                <text class="option-label">全部</text>
              </view>
              <!-- 其他类型选项 -->
              <view 
                v-for="(type, index) in locationTypeOptions" 
                :key="index"
                class="menu-option"
                :class="{ active: selectedType === type.value }"
                @click="selectLocationType(type.value)"
              >
                <view class="checkbox">
                  <view class="checkbox-inner" v-if="selectedType === type.value"></view>
                </view>
                <text class="option-label">{{ type.label }}</text>
              </view>
            </view>
          </view>

          <!-- 关键字选择（仅队站辖区显示） -->
          <view class="menu-section" v-if="selectedType === 3">
            <text class="menu-label">关键字</text>
            <view class="menu-options keyword-options">
              <view 
                v-for="(keyword, index) in keywordOptions" 
                :key="index"
                class="menu-option"
                :class="{ active: selectedKeyword === keyword.value }"
                @click="selectKeyword(keyword.value)"
              >
                <view class="checkbox">
                  <view class="checkbox-inner" v-if="selectedKeyword === keyword.value"></view>
                </view>
                <text class="option-label">{{ keyword.label }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import { locationTabList } from '@/commons/mock/index.js';

export default {
  props: {
    addressId: {
      type: [String, Number],
      default: null
    },
    enableSatellite: {
      type: Boolean,
      default: false
    },
    selectMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      mapCenter: {
        latitude: 39.9042, // 北京天安门坐标作为默认中心点
        longitude: 116.4074
      },
      mapScale: 16,
      mapMarkers: [],
      allLocations: [], // 所有地址数据
      filteredLocations: [], // 筛选后的地址数据
      currentLocation: null, // 目标地址详情
      userLocation: null, // 用户当前位置
      showSidebar: false, // 是否显示左侧抽屉
      selectedMapCenter: null, // 选择模式下选中的地图中心点
      locationTypeOptions: [], // 单位类型选项
      keywordOptions: [], // 关键字选项（队站辖区）
      selectedType: null, // 选中的单位类型
      selectedKeyword: null, // 选中的关键字（队站辖区）
      internalEnableSatellite: false, // 内部卫星地图状态
      searchKeyword: '' // 搜索关键词
    };
  },
  watch: {
    // 监听 prop 变化，同步到内部状态
    enableSatellite: {
      immediate: true,
      handler(newVal) {
        this.internalEnableSatellite = newVal;
      }
    }
  },
  mounted() {
    // 初始化单位类型选项
    this.locationTypeOptions = locationTabList.map(item => ({
      label: item.name,
      value: item.type
    }));
    // 非选择模式才加载地址列表
    if (!this.selectMode) {
      this.loadAllLocations();
    } else {
      // 选择模式下只获取用户位置
      this.getUserLocation();
    }
  },
  methods: {
    // 获取用户当前位置
    getUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          console.log('用户当前位置:', res);
          this.userLocation = {
            latitude: res.latitude,
            longitude: res.longitude,
            addressName: '我的位置',
            addressExt: '当前位置'
          };
          // 设置地图中心点为用户位置
          this.mapCenter = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          this.updateMapMarkers();
        },
        fail: (err) => {
          console.error('获取用户位置失败:', err);
          uni.showToast({ title: '获取位置失败', icon: 'none' });
        }
      });
    },
    
    async loadAllLocations() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/list',
            method: 'GET',
            data: { page: 1, pageSize: 100 },
            success: resolve,
            fail: reject
          });
        });
        
        if (res.data && res.data.code === 200) {
          this.allLocations = res.data.data?.list || [];
          console.log('加载的位置数据:', this.allLocations);
          
          // 从列表中过滤出目标地址
          if (this.addressId) {
            this.currentLocation = this.allLocations.find(location => 
              location.addressId == this.addressId
            );
            console.log('目标地址:', this.currentLocation);
          }
          
          // 初始化为全部数据
          this.filteredLocations = [...this.allLocations];
          this.updateMapMarkers();
        } else {
          console.log('API返回错误:', res.data);
        }
      } catch (error) {
        console.error('加载位置列表失败:', error);
        uni.showToast({ title: '加载位置列表失败', icon: 'none' });
      }
    },
    
    
    updateMapMarkers() {
      this.mapMarkers = [];
      
      // 选择模式下不显示任何标记，只显示地图
      if (this.selectMode) {
        // 设置地图中心点为用户位置（如果有）
        if (this.userLocation && this.userLocation.latitude && this.userLocation.longitude) {
          this.mapCenter = {
            latitude: this.userLocation.latitude,
            longitude: this.userLocation.longitude
          };
        }
        // 不添加任何标记，包括用户位置标记
        return;
      }
      
      // 非选择模式：显示所有地址标记
      console.log('更新地图标记，位置数量:', this.allLocations.length);
      
      // 添加用户当前位置标记（蓝色）
      if (this.userLocation && this.userLocation.latitude && this.userLocation.longitude) {
        console.log('添加用户位置标记:', this.userLocation.addressName);
        this.mapMarkers.push({
          id: -1, // 用户位置使用特殊id（负数）
          latitude: this.userLocation.latitude,
          longitude: this.userLocation.longitude,
          title: this.userLocation.addressName,
          // 用户位置使用蓝色标记
          width: 25,
          height: 25,
          callout: {
            content: `${this.userLocation.addressName}`,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            borderRadius: 6,
            bgColor: '#1890ff',
            padding: 6,
            display: 'ALWAYS',
            borderWidth: 2,
            borderColor: '#fff',
            textAlign: 'center'
          }
        });
      }
      
      // 显示筛选后的位置（包括目标地址和其他位置）
      this.filteredLocations.forEach((location, index) => {
        if (location.latitude && location.longitude) {
          // 判断是否是目标地址
          const isTarget = this.currentLocation && location.addressId == this.currentLocation.addressId;
          
          // 生成 callout 内容
          const calloutContent = this.generateCalloutContent(location);
          
          this.mapMarkers.push({
            id: isTarget ? -2 : index, // 目标地址使用特殊id（-2），其他使用索引
            latitude: location.latitude,
            longitude: location.longitude,
            title: location.addressName,
            width: isTarget ? 30 : 20, // 目标地址更大
            height: isTarget ? 30 : 20,
            callout: {
              content: calloutContent,
              color: isTarget ? '#fff' : '#333', // 目标地址白色文字
              fontSize: isTarget ? 14 : 12,
              fontWeight: 'bold',
              borderRadius: isTarget ? 8 : 6,
              bgColor: isTarget ? '#ff4d4f' : '#fff', // 目标地址红色背景
              padding: isTarget ? 8 : 6,
              display: 'ALWAYS',
              borderWidth: isTarget ? 2 : 1,
              borderColor: isTarget ? '#fff' : '#ff4d4f',
              textAlign: 'center'
            }
          });
        }
      });
      
      // 设置地图中心点
      if (this.userLocation && this.userLocation.latitude && this.userLocation.longitude) {
        this.mapCenter = {
          latitude: this.userLocation.latitude,
          longitude: this.userLocation.longitude
        };
      } else if (this.currentLocation && this.currentLocation.latitude && this.currentLocation.longitude) {
        this.mapCenter = {
          latitude: this.currentLocation.latitude,
          longitude: this.currentLocation.longitude
        };
      }
      
      console.log('最终标记数量:', this.mapMarkers.length);
    },
    
    onMarkerTap(e) {
       const markerId = e.detail.markerId;
       this.handleMarkerClick(markerId);
    },
    
    // 处理callout点击事件（点击文字气泡）
    onCalloutTap(e) {
       const markerId = e.detail.markerId;
       this.handleMarkerClick(markerId);
    },
    
    // 统一的标记点击处理逻辑
    handleMarkerClick(markerId) {
       if (markerId === -1) {
         // 用户位置不跳转，只显示提示
         uni.showToast({ title: '我的位置', icon: 'none' });
       } else if (markerId === -2) {
         // 点击目标地址，跳转到720全景
         if (this.currentLocation) {
           this.goTo720View(this.currentLocation);
         } else {
           uni.showToast({ title: '位置信息无效', icon: 'none' });
         }
       } else if (typeof markerId === 'number' && markerId >= 0) {
         // 点击其他位置，跳转到720全景
         const location = this.filteredLocations[markerId];
         if (location) {
           this.goTo720View(location);
         } else {
           uni.showToast({ title: '位置信息不存在', icon: 'none' });
         }
       }
    },
    
    onRegionChange(e) {
      console.log('地图区域变化:', e);
      // 在选择模式下，记录地图中心点变化（用户拖动地图）
      if (this.selectMode && e.type === 'end') {
        this.selectedMapCenter = {
          latitude: e.detail.centerLocation.latitude,
          longitude: e.detail.centerLocation.longitude
        };
      }
    },
    
    // 地图点击事件（选择模式）- 直接选择并返回
    onMapTap(e) {
      if (!this.selectMode) return;
      // 获取点击位置的经纬度
      if (e.detail && e.detail.latitude && e.detail.longitude) {
        this.selectedMapCenter = {
          latitude: e.detail.latitude,
          longitude: e.detail.longitude
        };
        // 更新地图中心点
        this.mapCenter = {
          latitude: e.detail.latitude,
          longitude: e.detail.longitude
        };
        // 直接选择并返回
        this.confirmLocationSelection();
      }
    },
     
     // 确认选择位置（选择模式）
    async confirmLocationSelection() {
       if (!this.selectMode) return;
       
       // 使用地图中心点作为选择的位置
       const selectedLocation = this.selectedMapCenter || this.mapCenter;
       
       if (!selectedLocation || !selectedLocation.latitude || !selectedLocation.longitude) {
         uni.showToast({
           title: '请先在地图上选择位置',
           icon: 'none'
         });
         return;
       }
       
       // 显示加载提示
       uni.showLoading({
         title: '获取地址信息...',
         mask: true
       });
       
       try {
         // 调用逆地理编码API获取地址名称
         const addressInfo = await this.reverseGeocode(selectedLocation.latitude, selectedLocation.longitude);
         
         // 触发位置选择事件
         this.$emit('location-selected', {
           latitude: selectedLocation.latitude,
           longitude: selectedLocation.longitude,
           name: addressInfo.name || this.searchKeyword || '已选择位置',
           address: addressInfo.address || addressInfo.fullAddress || `经度: ${selectedLocation.longitude}, 纬度: ${selectedLocation.latitude}`
         });
       } catch (error) {
         console.error('获取地址信息失败:', error);
         // 如果逆地理编码失败，仍然返回位置信息
         this.$emit('location-selected', {
           latitude: selectedLocation.latitude,
           longitude: selectedLocation.longitude,
           name: this.searchKeyword || '已选择位置',
           address: `经度: ${selectedLocation.longitude}, 纬度: ${selectedLocation.latitude}`
         });
       } finally {
         uni.hideLoading();
       }
     },
     
     // 逆地理编码：通过经纬度获取地址信息
     async reverseGeocode(latitude, longitude) {
       try {
         // 调用后端API进行逆地理编码
         const res = await new Promise((resolve, reject) => {
           uni.request({
             url: this.serverUrl + '/location/reverseGeocode',
             method: 'GET',
             data: {
               latitude: latitude,
               longitude: longitude
             },
             success: resolve,
             fail: reject
           });
         });
         
         if (res.data && res.data.code === 200) {
           const data = res.data.data || {};
           return {
             name: data.name || data.addressName || data.formatted_address || '',
             address: data.province + data.city + data.fullAddress
           };
         } else {
           throw new Error(res.data?.msg || '获取地址信息失败');
         }
       } catch (error) {
         console.error('逆地理编码失败:', error);
         // 如果后端API失败，尝试使用微信小程序的逆地理编码
         // #ifdef MP-WEIXIN
         try {
           // 微信小程序可以使用腾讯地图API
           // 这里需要配置腾讯地图的key，或者使用后端API
           throw error; // 暂时抛出错误，使用默认值
         } catch (e) {
           throw e;
         }
         // #endif
         throw error;
       }
     },
     
     // 打开位置搜索（选择模式）
     openLocationSearch() {
       // #ifdef MP-WEIXIN
       // 微信小程序使用 chooseLocation 进行搜索和选择
       uni.chooseLocation({
         success: (res) => {
           // 移动地图到搜索结果位置
           this.mapCenter = {
             latitude: res.latitude,
             longitude: res.longitude
           };
           this.selectedMapCenter = {
             latitude: res.latitude,
             longitude: res.longitude
           };
           // 直接选择并返回
           this.$emit('location-selected', {
             latitude: res.latitude,
             longitude: res.longitude,
             name: res.name,
             address: res.address
           });
         },
         fail: (err) => {
           console.error('搜索位置失败:', err);
           if (err.errMsg && !err.errMsg.includes('cancel')) {
             uni.showToast({
               title: '搜索失败，请重试',
               icon: 'none'
             });
           }
         }
       });
       // #endif
       
       // #ifndef MP-WEIXIN
       // 其他平台可以调用地图API进行搜索
       uni.showToast({
         title: '该平台暂不支持位置搜索',
         icon: 'none'
       });
       // #endif
     },
    
    
    // 跳转到720全景
    goTo720View(location) {
      const { allSenceLink } = location || {};
      // 跳转到720全景页面
      uni.navigateTo({
        url: `/subPackages/common/webview/index?url=${encodeURIComponent(allSenceLink)}&title=${encodeURIComponent(location.addressName + ' - 720全景')}`
      });
    },
    
    // 生成 callout 内容
    generateCalloutContent(location) {
      const parts = [];
      
      // 地址名称
      parts.push(location.addressName || '未知地址');
      // 如果是队站辖区，显示编号
      if (location.type === 3 && location.addressId) {
        // 判断是全景云还是消火栓
        const district = locationTabList.find(item => item.type === 3);
        const keywordOption = district?.keywordOptions?.find(opt => opt.value === location.keywordType);
        const category = keywordOption?.category || '';
        
        // 显示编号（全景云编号或消火栓编号）
        parts.push(`${location.addressId}`);
        
        // 消火栓显示性能参数
        if (category === 'hydrant') {
          const pressure = location.hydrantPressure || '';
          const flow = location.hydrantFlow || '';
          if (pressure || flow) {
            const paramParts = [];
            if (pressure) paramParts.push(`压力:${pressure}mpa`);
            if (flow) paramParts.push(`流量:${flow}L/s`);
            if (paramParts.length > 0) {
              parts.push(paramParts.join(' '));
            }
          }
        }
      }
      
      return parts.join(' | ');
    },
    
    // 切换左侧抽屉
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },

    // 显示左侧抽屉
    showSidebarMenu() {
      this.showSidebar = true;
    },

    // 隐藏左侧抽屉
    hideSidebar() {
      this.showSidebar = false;
    },

     // 切换卫星地图
     toggleSatellite() {
       this.internalEnableSatellite = !this.internalEnableSatellite;
       
       uni.showToast({ 
         title: this.internalEnableSatellite ? '已切换到卫星地图' : '已切换到普通地图', 
         icon: 'none',
         duration: 1500
       });
     },

    // 选择单位类型（立即触发筛选）
    selectLocationType(type) {
      this.selectedType = type;
      // 如果选择队站辖区，初始化关键字选项
      if (type === 3) {
        const district = locationTabList.find(item => item.type === 3);
        this.keywordOptions = district && Array.isArray(district.keywordOptions) 
          ? district.keywordOptions 
          : [];
        // 默认选择第一个关键字
        if (!this.selectedKeyword) {
          this.selectedKeyword = this.keywordOptions[0]?.value || 'all';
        }
      } else {
        // 非队站辖区，清空关键字
        this.selectedKeyword = null;
        this.keywordOptions = [];
      }
      // 立即触发筛选
      this.applyFilter();
    },

    // 选择关键字（队站辖区，立即触发筛选）
    selectKeyword(keyword) {
      this.selectedKeyword = keyword;
      // 立即触发筛选
      this.applyFilter();
    },

    // 应用筛选
    applyFilter() {
      // 根据筛选条件过滤地址
      this.filteredLocations = this.allLocations.filter(location => {
        // 类型筛选
        let typeMatch = true;
        if (this.selectedType !== null) {
          if (this.selectedType !== 3) {
            typeMatch = location.type === this.selectedType;
          } else {
            // 队站辖区需要匹配关键字
            if (this.selectedKeyword !== null && this.selectedKeyword !== 'all') {
              typeMatch = location.keywordType === this.selectedKeyword;
            } else {
              typeMatch = location.type === 3;
            }
          }
        }
        
        // 搜索关键词筛选（模糊匹配：地址编号/全景云编号/消火栓编号/地址名称/详细地址）
        let searchMatch = true;
        if (this.searchKeyword && this.searchKeyword.trim()) {
          // 处理搜索关键词：去除多余空格，转换为小写
          const keywords = this.searchKeyword.trim().toLowerCase().split(/\s+/).filter(k => k);
          
          // 获取所有可搜索的字段（去除空格，转换为小写）
          const searchFields = [
            (location.addressId || '').toString().replace(/\s+/g, '').toLowerCase(), // 地址编号/全景云编号/消火栓编号
            (location.addressName || '').toString().replace(/\s+/g, '').toLowerCase(), // 地址名称
            (location.addressExt || '').toString().replace(/\s+/g, '').toLowerCase() // 详细地址
          ].filter(field => field); // 过滤空字段
          
          // 合并所有字段为一个搜索文本
          const searchText = searchFields.join(' ');
          
          // 模糊匹配：所有关键词都必须在搜索文本中出现
          searchMatch = keywords.every(keyword => {
            // 支持包含匹配
            return searchText.includes(keyword);
          });
        }
        
        return typeMatch && searchMatch;
      });
      
      this.updateMapMarkers();
      
      // 如果搜索后只有一个结果，自动定位到该地点
      if (this.searchKeyword && this.searchKeyword.trim() && this.filteredLocations.length === 1) {
        const foundLocation = this.filteredLocations[0];
        if (foundLocation.latitude && foundLocation.longitude) {
          // 延迟执行，确保地图标记更新完成后再定位
          this.$nextTick(() => {
            setTimeout(() => {
              this.moveToLocation(foundLocation.latitude, foundLocation.longitude, 18);
            }, 300);
          });
        }
      }
    },
    
    // 搜索输入事件
    onSearchInput(e) {
      this.searchKeyword = e.detail.value || '';
      this.applyFilter();
    },
    
    // 搜索确认事件
    onSearchConfirm(e) {
      this.searchKeyword = e.detail.value || '';
      this.applyFilter();
    },
    
    // 清空搜索
    clearSearch() {
      this.searchKeyword = '';
      this.applyFilter();
    },
    
    // 移动地图到指定位置
    moveToLocation(latitude, longitude, scale = 16) {
      // 使用地图上下文API移动地图中心点
      // #ifdef MP-WEIXIN
      const mapContext = uni.createMapContext('locationMap', this);
      mapContext.moveToLocation({
        latitude: latitude,
        longitude: longitude,
        success: () => {
          // 更新地图中心点和缩放级别
          this.mapCenter = {
            latitude: latitude,
            longitude: longitude
          };
          this.mapScale = scale;
        },
        fail: (err) => {
          console.error('移动地图失败:', err);
          // 如果API失败，直接更新数据
          this.mapCenter = {
            latitude: latitude,
            longitude: longitude
          };
          this.mapScale = scale;
        }
      });
      // #endif
      
      // #ifndef MP-WEIXIN
      // 其他平台直接更新数据
      this.mapCenter = {
        latitude: latitude,
        longitude: longitude
      };
      this.mapScale = scale;
      // #endif
    }
  }
};
</script>

<style scoped>
.map-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.map-controls {
  position: absolute;
  top: 40rpx;
  left: 20rpx;
  z-index: 1000;
}

.control-btn {
  background: linear-gradient(135deg, #4a90e2 0%, #5ba0f2 100%);
  border-radius: 25rpx;
  padding: 20rpx 40rpx;
  box-shadow: 0 6rpx 16rpx rgba(74, 144, 226, 0.2);
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.control-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.15);
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-view {
  width: 100%;
  height: 100%;
}

/* 遮罩层 */
.sidebar-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1999;
  animation: fadeIn 0.3s ease;
}

/* 右侧抽屉 */
.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 70%;
  max-width: 600rpx;
  height: 100%;
  background: #ffffff;
  z-index: 2000;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -4rpx 0 16rpx rgba(0, 0, 0, 0.1);
}

.sidebar.active {
  transform: translateX(0);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32rpx;
  box-sizing: border-box;
}

.menu-section {
  margin-bottom: 40rpx;
}

.menu-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 8rpx;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  transition: all 0.3s ease;
}

.menu-item:active {
  background: #e9ecef;
}

.menu-item-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.switch-wrapper {
  transform: scale(0.9);
}

.menu-options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
  width: 100%;
  box-sizing: border-box;
}

.menu-option {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 12rpx;
  background: #ffffff;
  transition: all 0.3s ease;
  flex: 0 0 calc(50% - 6rpx);
  box-sizing: border-box;
  min-width: 0;
}

.menu-option.active {
  border-color: #1890ff;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(24, 144, 255, 0.03) 100%);
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #cbd5e0;
  border-radius: 6rpx;
  margin-right: 16rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  background: #ffffff;
  flex-shrink: 0;
}

.menu-option.active .checkbox {
  border-color: #1890ff;
  background: #1890ff;
}

.checkbox-inner {
  width: 20rpx;
  height: 20rpx;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.option-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 关键字选项一行显示一个 */
.keyword-options .menu-option {
  flex: 0 0 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 选择模式确认按钮 */
.select-confirm-btn {
  position: absolute;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: #ffffff;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.3);
  z-index: 1001;
  transition: all 0.3s ease;
}

.select-confirm-btn:active {
  transform: translateX(-50%) scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.4);
}

.confirm-btn-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
}

/* 搜索框样式（抽屉内） */
.search-section {
  margin-bottom: 32rpx;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e1e8ed;
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  border-color: #1890ff;
  background: #ffffff;
  box-shadow: 0 0 0 4rpx rgba(24, 144, 255, 0.1);
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  height: 64rpx;
  font-size: 26rpx;
  color: #333333;
  background: transparent;
  border: none;
  outline: none;
}

.search-input::placeholder {
  color: #999999;
  font-size: 24rpx;
}

.search-clear {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
  border-radius: 50%;
  background: #e0e0e0;
  transition: all 0.3s ease;
}

.search-clear:active {
  background: #d0d0d0;
  transform: scale(0.9);
}

.clear-icon {
  font-size: 32rpx;
  color: #666666;
  line-height: 1;
  font-weight: 300;
}

/* 搜索按钮样式（选择模式） */
.search-btn-container {
  position: absolute;
  top: 40rpx;
  right: 20rpx;
  z-index: 1000;
  display: flex;
  justify-content: center;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 40rpx;
  padding: 12rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1rpx solid #e0e0e0;
}

.search-btn:active {
  transform: scale(0.95);
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
  background: #f5f5f5;
}

.search-btn-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 8rpx;
  flex-shrink: 0;
}

.search-btn-text {
  font-size: 24rpx;
  font-weight: 400;
  color: #666666;
}
</style>

