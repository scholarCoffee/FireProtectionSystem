<template>
  <map-view 
    ref="mapViewRef" 
    :address-id="currentAddressId"
    :enable-satellite="enableSatellite"
    :select-mode="selectMode"
    @location-selected="onLocationSelected"
  />
</template>

<script>
import MapView from '@/componets/mapView/index.vue';

export default {
  components: {
    MapView
  },
  data() {
    return {
      currentAddressId: null,
      enableSatellite: false,
      selectMode: false
    };
  },
  onLoad(options) {
    // 从跳转参数中获取addressId
    if (options.addressId) {
      this.currentAddressId = options.addressId;
    }
    // 是否默认显示卫星地图
    if (options.enableSatellite === 'true') {
      this.enableSatellite = true;
    }
    // 是否为选择模式
    if (options.mode === 'select') {
      this.selectMode = true;
    }
  },
  onShow() {
    // 每次页面显示时更新用户位置（微信小程序页面生命周期）
    if (this.$refs.mapViewRef && typeof this.$refs.mapViewRef.getUserLocation === 'function') {
      this.$refs.mapViewRef.getUserLocation();
    }
  },
  methods: {
    onLocationSelected(data) {
      // 通过事件通道返回选择的位置
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel && typeof eventChannel.emit === 'function') {
        eventChannel.emit('locationSelected', data);
      }
      // 返回上一页
      uni.navigateBack({
        delta: 1
      });
    }
  }
};
</script>

<style scoped>
/* 样式由子组件处理 */
</style>
