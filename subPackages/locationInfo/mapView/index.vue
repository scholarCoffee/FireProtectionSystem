<template>
  <map-view ref="mapViewRef" :address-id="currentAddressId" />
</template>

<script>
import MapView from '@/componets/mapView/index.vue';

export default {
  components: {
    MapView
  },
  data() {
    return {
      currentAddressId: null
    };
  },
  onLoad(options) {
    // 从跳转参数中获取addressId
    if (options.addressId) {
      this.currentAddressId = options.addressId;
    }
  },
  onShow() {
    // 每次页面显示时更新用户位置（微信小程序页面生命周期）
    if (this.$refs.mapViewRef && typeof this.$refs.mapViewRef.getUserLocation === 'function') {
      this.$refs.mapViewRef.getUserLocation();
    }
  }
};
</script>

<style scoped>
/* 样式由子组件处理 */
</style>
