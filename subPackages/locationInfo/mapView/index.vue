<template>
  <map-view :address-id="currentAddressId" />
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
  }
};
</script>

<style scoped>
/* 样式由子组件处理 */
</style>
