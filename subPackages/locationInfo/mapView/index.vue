<template>
  <view class="map-page">
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
        :enable-satellite="false"
        :enable-traffic="false"
        class="map-view"
        @markertap="onMarkerTap"
        @regionchange="onRegionChange"
      ></map>
    </view>

  </view>
</template>

<script>
import { locationTabList } from '@/commons/mock/index.js';

export default {
  data() {
    return {
      serverUrl: 'http://172.17.121.104:3000',
      addressId: null,
      mapCenter: {
        latitude: 39.9042, // 北京天安门坐标作为默认中心点
        longitude: 116.4074
      },
      mapScale: 16,
      mapMarkers: [],
      allLocations: [],
      currentLocation: null, // 目标地址详情
      userLocation: null // 用户当前位置
    };
  },
  onLoad(data) {
    const { addressId } = data || {};
    this.addressId = addressId;
    this.loadAllLocations();
    this.getUserLocation();
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
      console.log('更新地图标记，位置数量:', this.allLocations.length);
      
      // 添加用户当前位置标记（蓝色）
      if (this.userLocation && this.userLocation.latitude && this.userLocation.longitude) {
        console.log('添加用户位置标记:', this.userLocation.addressName);
        this.mapMarkers.push({
          id: 'user', // 用户位置使用特殊id
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
      
      // 显示所有位置（包括目标地址和其他位置）
      this.allLocations.forEach((location, index) => {
        if (location.latitude && location.longitude) {
          // 判断是否是目标地址
          const isTarget = this.currentLocation && location.addressId == this.currentLocation.addressId;
          
          this.mapMarkers.push({
            id: isTarget ? 'target' : index, // 目标地址使用特殊id，其他使用索引
            latitude: location.latitude,
            longitude: location.longitude,
            title: location.addressName,
            width: isTarget ? 30 : 20, // 目标地址更大
            height: isTarget ? 30 : 20,
            callout: {
              content: location.addressName,
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
      
      if (markerId === 'user') {
        // 用户位置不跳转，只显示提示
        uni.showToast({ title: '我的位置', icon: 'none' });
      } else if (markerId === 'target') {
        // 点击目标地址，跳转到720全景
        this.goTo720View(this.currentLocation);
      } else if (typeof markerId === 'number' && this.allLocations[markerId]) {
        // 点击其他位置，跳转到720全景
        this.goTo720View(this.allLocations[markerId]);
      }
    },
    
    onRegionChange(e) {
      console.log('地图区域变化:', e);
    },
    
    
    // 跳转到720全景
    goTo720View(location) {
      if (!location) {
        uni.showToast({ title: '位置信息无效', icon: 'none' });
        return;
      }
      
      // 构建720全景URL
      const panoramaUrl = `${this.serverUrl}/720?lat=${location.latitude}&lng=${location.longitude}&name=${encodeURIComponent(location.addressName)}`;
      
      // 跳转到720全景页面
      uni.navigateTo({
        url: `/subPackages/common/webview/index?url=${encodeURIComponent(panoramaUrl)}&title=${encodeURIComponent(location.addressName + ' - 720全景')}`
      });
    },
    
    getLocationTypeName(type) {
      return locationTabList.find(item => item.type === type)?.name || '未知类型';
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


.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-view {
  width: 100%;
  height: 100%;
}

</style>
