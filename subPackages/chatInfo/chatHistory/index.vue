<template>
    <view class="content">
        <!-- 搜索框 -->
        <view class="search-bar">
            <view class="search-input-wrap">
                <image class="search-icon" :src="serverUrl + '/static/icons/location/search.png'" />
                <input class="search-input" v-model="keyword" placeholder="按昵称或关键字搜索" @input="onKeywordInput" confirm-type="search" @confirm="onSearch"/>
                <view class="clear-btn" v-if="keyword" @tap="clearKeyword">清空</view>
            </view>
        </view>
        

        <scroll-view class="list" scroll-y :style="{ height: scrollHeight + 'px' }" @scrolltolower="loadMore">
            <view class="item" v-for="(msg, idx) in list" :key="idx">
                <text class="time">{{ dateTime(msg.time) }}</text>
                <view class="row" :class="{ right: msg.fromId === userInfo.userId }">
                    <image class="u-avatar" :src="msg.avatarUrl" />
                    <view class="bubble" v-if="msg.types === 0">{{ msg.message }}</view>
                    <image v-else-if="msg.types === 1" class="img" :src="serverUrl + msg.message" mode="widthFix" @tap="previewImg(serverUrl + msg.message)" />
                    <view v-else class="bubble">[暂不支持的消息类型]</view>
                </view>
            </view>
            <view class="load-end" v-if="finished">没有更多了</view>
        </scroll-view>
    </view>
</template>

<script>
import { dateTime } from '@/commons/js/utils.js'
export default {
    data() {
        return {
            serverUrl: 'https://www.xiaobei.space',
            groupId: '',
            groupName: '',
            groupAvatar: '',
            userInfo: {},
            list: [],
            page: 1,
            pageSize: 20,
            finished: false,
            scrollHeight: 600,
            keyword: '',
            debounceTimer: null
        }
    },
    onLoad(query) {
        this.groupId = query.groupId || ''
        this.groupName = decodeURIComponent(query.groupName || '')
        this.groupAvatar = decodeURIComponent(query.groupAvatar || '')
        const sys = uni.getSystemInfoSync()
        this.scrollHeight = sys.windowHeight - 110
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo) this.userInfo = userInfo
        this.fetch()
    },
    methods: {
        dateTime,
        fetch(reset = false) {
            if (reset) {
                this.page = 1
                this.finished = false
                this.list = []
            }
            if (this.finished) return
            uni.request({
                url: this.serverUrl + '/chat/getGroupMsg',
                method: 'POST',
                data: {
                    groupId: this.groupId,
                    userId: this.userInfo.userId,
                    nowPage: this.page,
                    pageSize: this.pageSize,
                    state: 1,
                    keyword: this.keyword || ''
                },
                success: (res) => {
                    const { code, data } = res.data || {}
                    if (code === 200) {
                        if (!data || data.length === 0) {
                            this.finished = true
                            return
                        }
                        const mapped = data.map(x => ({
                            ...x,
                            avatarUrl: this.serverUrl + x.avatarUrl
                        }))
                        this.list = this.list.concat(mapped)
                        if (data.length < this.pageSize) {
                            this.finished = true
                        } else {
                            this.page += 1
                        }
                    }
                }
            })
        },
        onKeywordInput() {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(() => this.fetch(true), 300)
        },
        onSearch() { this.fetch(true) },
        clearKeyword() { this.keyword = ''; this.fetch(true) },
        loadMore() { this.fetch() },
        previewImg(url) {
            uni.previewImage({ current: url, urls: [url] })
        }
    }
}
</script>

<style lang="scss">
.content { background: #f7f8fc; min-height: 100vh; }
.search-bar { background: #fff; padding: 10px 12px; }
.search-input-wrap { position: relative; background: #f5f6f7; border-radius: 18px; padding: 8px 36px 8px 32px; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; width: 16px; height: 16px; opacity: 0.6; }
.search-input { flex: 1; font-size: 14px; color: #333; }
.clear-btn { position: absolute; right: 10px; font-size: 12px; color: #1890ff; }
.header { display: flex; align-items: center; padding: 16px; background: #fff; }
.avatar { width: 40px; height: 40px; border-radius: 8px; margin-right: 12px; }
.meta { display: flex; flex-direction: column; }
.title { font-size: 16px; color: #333; font-weight: 600; }
.sub { font-size: 12px; color: #888; margin-top: 2px; }
.list { padding: 12px; }
.item { margin-bottom: 10px; }
.time { display: block; text-align: center; color: #999; font-size: 12px; margin: 6px 0; }
.row { display: flex; align-items: flex-end; }
.row.right { flex-direction: row-reverse; }
.u-avatar { width: 28px; height: 28px; border-radius: 6px; margin: 0 8px; }
.bubble { max-width: 70%; background: #fff; border-radius: 10px; padding: 8px 10px; font-size: 14px; color: #333; }
.row.right .bubble { background: #82f1007d; }
.img { max-width: 60vw; border-radius: 8px; }
.load-end { text-align: center; color: #999; padding: 10px 0; }
</style>


