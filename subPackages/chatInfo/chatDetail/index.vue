<template>
    <view class="content">
        <view class="header">
            <image class="avatar" :src="detail.groupAvatar" />
            <view class="meta">
                <text class="title">{{ detail.groupName || '群详情' }}</text>
            </view>
        </view>

        <view class="card">
            <view class="row"><text class="label">群名称</text><text class="value">{{ detail.groupName }}（{{ (detail.members && detail.members.length) || 0 }}）</text></view>
            <view class="row" v-if="detail.description"><text class="label">群描述</text><text class="value">{{ detail.description }}</text></view>
        </view>

        <view class="card">
            <view class="section-title">群成员</view>
            <view class="members">
                <view class="member" v-for="(m, i) in (detail.members || [])" :key="i">
                    <image class="m-avatar" :src="serverUrl + m.avatarUrl" />
                    <text class="m-name ellipsis">{{ m.nickName }}</text>
                </view>
            </view>
        </view>
    </view>
    
</template>

<script>
export default {
    data() {
        return {
            serverUrl: 'https://www.xiaobei.space',
            groupId: '',
            detail: {}
        }
    },
    onLoad(query) {
        this.groupId = query.groupId || ''
        this.fetchInfo()
    },
    methods: {
        fetchInfo() {
            // 与 DataEdit.vue 一致，调用 /group/detail 获取详情
            uni.request({
                url: this.serverUrl + '/group/detail',
                method: 'GET',
                data: { groupId: this.groupId },
                success: (res) => {
                    const { code, data } = res.data || {}
                    if (code === 200 && data) {
                        this.detail = data
                    } else {
                        this.detail = {}
                    }
                },
                fail: () => { this.detail = {} }
            })
        },
        
    }
}
</script>

<style lang="scss">
.content { min-height: 100vh; background: linear-gradient(135deg, #f8faff 0%, #e6f7ff 100%); }
.header { display: flex; align-items: center; padding: 20rpx 24rpx; background: #ffffff; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); }
.avatar { width: 88rpx; height: 88rpx; border-radius: 50%; margin-right: 16rpx; border: 3rpx solid #e6f7ff; }
.meta { display: flex; flex-direction: column; }
.title { font-size: 32rpx; color: #333333; font-weight: 600; }
.sub { font-size: 24rpx; color: #8a8a8a; margin-top: 6rpx; }
.card { background: #ffffff; margin: 20rpx 24rpx; padding: 20rpx; border-radius: 16rpx; box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08); }
.row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.row:last-child { border-bottom: none; }
.label { color: #666666; font-size: 26rpx; white-space: nowrap; margin-right: 16rpx; }
.value { color: #333333; font-weight: 500; font-size: 26rpx; }
.section-title { font-size: 28rpx; color: #333333; font-weight: 600; margin-bottom: 16rpx; }
.members { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16rpx 12rpx; }
.member { display: flex; flex-direction: column; align-items: center; padding: 12rpx 0; background: linear-gradient(135deg, #fafbff 0%, #ffffff 100%); border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.m-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; margin-bottom: 8rpx; border: 2rpx solid #e6f7ff; }
.m-name { font-size: 24rpx; color: #333333; text-align: center; max-width: 140rpx; }
.m-mobile { font-size: 22rpx; color: #999999; }
.ellipsis { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* 小屏优化 */
@media (max-width: 600rpx) {
  .members { grid-template-columns: repeat(4, 1fr); }
}
</style>


