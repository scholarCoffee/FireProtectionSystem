<template>
    <view>
        <view class="top-bar bgbar" :animation="animationData1">
            <view class="top-bar-left" @tap="navigateBack">
                <image src="../../static/user/back.png" class="back-img"></image>
            </view>
        </view>
        <view class="bg">
            <image :src="groupInfo.imgurl" class="bg-img" mode="aspectFill"></image>
        </view>
        <view class="main">
            <view class="main-inner">
                <view class="inf">
                    <view class="name">{{ groupInfo.name }}</view>
                    <view class="time">{{ formatDate(groupInfo.time) }}</view>
                    <view class="notice">{{ groupInfo.notice }}</view>
                </view>
                <view class="member">
                    <view class="top">
                        <view class="title">群成员</view>
                        <view class="more" v-if="isGroupMaster">管理群成员</view>
                    </view>
                    <view class="member-ls">
                        <view class="member-li" v-for="(item, index) in groupMemberList" :key="index">
                            <view class="imgs" @tap="deleteGroupMember(item)">
                                <image src="../../static/delete.png" mode="aspectFill" class="delete-img" v-if="isGroupMaster && item.uid != groupInfo.uid "></image>
                                <image :src="item.imgurl" mode="aspectFill" class="user-img"></image>
                            </view>
                            <view class="name">{{ item.name }}</view>
                        </view>
                        <view class="member-li">
                            <view class="imgs" v-if="isGroupMaster" @tap="addGroupMember">
                                <image src="../../static/add.png" mode="aspectFill" class="user-add"></image>
                            </view>
                        </view>
                    </view>
                    <view class="clear"></view>
                </view>
                <view class="mitem">
                    <view class="row" @tap="modify('name', '群名称', groupInfo.name)">
                        <view class="title">群名称</view>
                        <view class="cont">{{ groupInfo.name }}</view>
                        <view class="more" v-if="isGroupMaster">
                            <image src="../../static/user/arrow-right.png" mode="aspectFill" class="more-img"></image>
                        </view>
                    </view>
                    <view class="row">
                        <view class="title">群头像</view>
                        <view class="cont" @tap="chooseImage">
                            <image :src="groupInfo.imgurl" class="bg-inner-img" mode="aspectFill"></image>
                        </view>
                    </view>
                    <view class="row" @tap="modify('notice', '群公告', groupInfo.notice)">
                        <view class="title">群公告</view>
                        <view class="cont">{{ groupInfo.notice }}</view>
                        <view class="more" v-if="isGroupMaster">
                            <image src="../../static/user/arrow-right.png" mode="aspectFill" class="more-img"></image>
                        </view>
                    </view>
                    <!-- <view class="row" @tap="modify('markname', '群内名', '今天天气真好')">
                        <view class="title">群内名</view>
                        <view class="cont">{{ groupInfo.markname }}</view>
                        <view class="more">
                            <image src="../../static/user/arrow-right.png" mode="aspectFill" class="more-img"></image>
                        </view>
                    </view> -->
                    <!-- <view class="row">
                        <view class="title">消息免打扰</view>
                        <view class="cont"></view>
                        <view class="more">
                            <switch :checked="swit" @change="switchChange" color="rgba(255, 288, 49, 1)" class="switch"/>
                            <image src="../../static/user/arrow-right.png" mode="aspectFill" class="more-img"></image>
                        </view>
                    </view> -->
                </view>
                <view class="bt2" @tap="onDealGroup">{{ isGroupMaster ? '解散群' : '退出群'  }}</view>
            </view>
        </view>
        <view class="modify" :style="{ bottom:-widHeight + 'px', 'display': isModify ? 'block' : 'none'  }" :animation="animation">
            <view class="modify-header">
                <view class="close" @tap="modify">取消</view>
                <view class="title">{{ modifyTitle }}</view>
                <view class="define" @tap="modifySubmit">确定</view>
            </view>
            <view class="modify-main">
                <textarea v-model="data" class="modify-content" ></textarea>
            </view>
        </view>
    </view>
</template>
<script>
    import { formatDate } from '../../commons/js/utils.js'
    export default {
        data() {
            return {
                formatDate,
                uid: '',
                token: '',
                groupMemberList: [],
                groupInfo: {
                    id: '', // 群ID
                    uid: '', // 群主ID
                    name: '', // 群名称
                    imgurl: '', // 群头像
                    notice: '', // 群公告
                    markname: '', // 群内名
                },
                top: 0,
                animationData1: {},
                modifyTitle: '',
                oldData: '', // 原数据
                data: '修改的内容', // 签名内容
                type: '', // 修改类型
                animation: {}, // 动画对象
                isModify: false, // 是否显示修改弹窗
                widHeight: 1000, // 组件高度
            }
        },
        computed: {
            isGroupMaster() {
                return this.groupInfo.uid === this.uid
            },
        },
        onLoad(e) {
            const { gid, gimg } = e || {}
            this.groupInfo.id = gid || ''
            this.groupInfo.imgurl = gimg || ''
            // 监听群成员变更
            this.listenGroupMemberChange()
        },
        onShow() {
            // 获取登录信息
            this.getStorages()
            this.getGroupMemberList()
        },
        onReady() {
            this.getTop()
        },
        onPageScroll(e) {
            this.getTop()
            this.addAnimat()
        },
        methods: {
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { userId, token } = userInfo;
                    this.uid = userId; // 用户ID
                    this.token = token; // 用户token
                } else {
                    uni.navigateTo({
                        url: '/pages/signIn/index'
                    });
                } 
            },
            navigateBack() {
                uni.navigateBack({
                    delta: 1
                });
            },
            chooseImage() {
                if (!this.isGroupMaster) return
                uni.chooseImage({
                    count: 1,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: (res) => {
                         this.groupInfo.imgurl = res.tempFilePaths[0]
                         uni.uploadFile({
                            url: this.serverUrl + '/files/upload', // 替换为你的上传接口地址
                            filePath: this.tempFilePaths,
                            name: 'file',
                            fileType: 'image',
                            formData: {
                                url: 'group',
                                name: this.uid,
                                token: this.token
                            },
                            success: (res) => {
                                
                            },
                            fail: (err) => {
                                uni.showToast({
                                    title: '头像修改失败',
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                        })
                    }
                })
            },
            getGroupMemberList() {
                this.groupMemberList = []
                // 获取群成员列表
                uni.request({
                    url: this.serverUrl + '/group/getGroupDetail',
                    method: 'POST',
                    data: {
                        gid: this.groupInfo.id,
                        token: this.token
                    },
                    success: (res) => {
                        const { code, data } = res.data
                        if (code == 200) {
                            const { groupInfo, groupMemberList } = data
                            this.groupInfo.name = groupInfo.name
                            this.groupInfo.imgurl = this.serverUrl + groupInfo.imgurl
                            this.groupInfo.notice = groupInfo.notice
                            this.groupInfo.markname = groupInfo.markname
                            this.groupInfo.time = groupInfo.time
                            this.groupInfo.uid = groupInfo.userID
                            this.groupMemberList = groupMemberList.map(item => {
                                return {
                                    ...item,
                                    imgurl: this.serverUrl + item.imgurl
                                }
                            })
                            // 群主放在第一个
                            this.groupMemberList.sort((a, b) => {
                                return a.uid === this.groupInfo.uid ? -1 : 1
                            })
                        } else {
                            uni.showToast({
                                title: '获取群成员失败',
                                icon: 'none',
                                duration: 2000
                            });
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '获取群成员失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            getTop() {
                const query = uni.createSelectorQuery().in(this)
                query.select('.main-inner').boundingClientRect((rect) => {
                    this.top = rect.top
                }).exec()
            },
            // 顶部切换动画
            addAnimat() {
                var animation = uni.createAnimation({
                    duration: 300,
                    timingFunction: 'ease'
                })
                if (this.top > 180) {
                    animation.opacity(1).step()
                } else {
                    animation.opacity(0).step()
                }
                this.animationData1 = animation.export()
            },
            modify(type, title, data) {
                if (!this.isGroupMaster) return 
                this.type = type
                this.modifyTitle = title
                this.oldData = data
                this.data = data
                this.isModify = !this.isModify
                const animation = uni.createAnimation({
                    duration: 300,
                    timingFunction: 'ease',
                })
                if (this.isModify) {
                    animation.bottom(0).step()
                } else {
                    animation.bottom(-this.widHeight).step()
                }
                this.animation = animation.export()
            },
            modifySubmit() {
                if (this.data.length > 0 && this.data != this.oldData) {
                    this.update(this.data, this.type)
                }
                this.modify()
            },
            update(value, type) {
                uni.request({
                    url: this.serverUrl + '/group/updateGroup', // 替换为你的登录接口地址,
                    method: 'POST',
                    data: {
                        gid: this.groupInfo.id,
                        value: value,
                        type: type,
                        token: this.token
                    },
                    success: (res) => {
                        const { code, data } = res.data
                        if (code === 200) { 
                            this.groupInfo[type] = data[type]
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '获取群详情失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
            listenGroupMemberChange() {
                
            },
            deleteGroupMember(item) {
                uni.showModal({
                    title: '删除群成员',
                    content: '确定要删除该成员吗？',
                    success: (res) => {
                        if (res.confirm) {
                            this.dealGroup('remove', item)
                        }
                    }
                })
            },
            addGroupMember() {
                uni.navigateTo({
                    url: '/pages-personal/search/index?gid=' + this.groupInfo.id
                })
            },
            onDealGroup() {
                if (this.isGroupMaster) {
                    uni.showModal({
                        title: '解散群',
                        content: '确定要解散该群吗？',
                        success: (res) => {
                            if (res.confirm) {
                                this.dealGroup('delete')
                            }
                        }
                    })
                } else {
                    uni.showModal({
                        title: '退出群',
                        content: '确定要退出该群吗？',
                        success: (res) => {
                            if (res.confirm) {
                                const item = this.groupMemberList.find(item => item.uid === this.uid)
                                this.dealGroup('exit', item)
                            }
                        }
                    })
                }
            },
            dealGroup(type, item) {
                uni.request({
                    url: this.serverUrl + '/group/deleteGroup', // 替换为你的登录接口地址,
                    method: 'POST',
                    data: {
                        gid: this.groupInfo.id,
                        type: type,
                        uid: item ? item.uid : this.uid,
                        token: this.token
                    },
                    success: (res) => {
                        const { code } = res.data
                        if (code === 200) {
                            if (type === 'remove') {
                                this.getGroupMemberList()
                            } else {
                                // 退回到首页
                                uni.navigateTo({
                                    url: '../index/index'
                                })
                            }
                        }
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '操作失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })
            },
        }
    }
</script>
<style lang="scss">
    @import "../../commons/css/top-bar.scss"; // 引入公共样式
    .clear {
        opacity: 0;
        clear: both;
    }
    
    .bg {
        width: 100%;
        height: 100%;
        background-color: #fff;
        position: fixed;
        top: 0;
        left: 0;
        z-index: -1;
        
        .bg-img {
            width: 100%;
            height: 750rpx;
            object-fit: cover; // 确保图片适当覆盖区域
        }
    }
    
    .top-bar {
        &.bgbar {
            background-color: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
        }
    }
    
    .main {
        padding-top: 400rpx;
        padding-bottom: 20rpx;
        .main-inner {
            width: 100%;
            min-height: 700rpx;
            background-color: #fff;
            border-radius: 40rpx 40rpx 0 0;
            box-shadow: 0 -5rpx 20rpx rgba(0, 0, 0, 0.05);
        }
        
        .inf {
            padding: $uni-spacing-row-base $uni-spacing-col-base 40rpx;
            box-sizing: border-box;
            border-bottom: 1px solid #eee;
            
            .name {
                float: left;
                font-size: 40rpx;
                font-weight: 600;
                color: #272832;
                line-height: 66rpx;
            }
            
            .time {
                float: right;
                font-size: 26rpx;
                color: rgba(39, 40, 50, 0.5);
                line-height: 66rpx;
            }
            
            .notice {
                padding-top: 20rpx;
                font-size: 28rpx;
                color: #272832;
                line-height: 40rpx;
                clear: both;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
            }
        }
        
        .member {
            border-bottom: 1px solid #eee;
            
            .top {
                padding: $uni-spacing-row-base $uni-spacing-col-base 0;
                box-sizing: border-box;
                height: 100rpx;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                
                .title {
                    flex: 1;
                    font-size: 32rpx;
                    font-weight: 600;
                    color: #272832;
                }
                
                .more {
                    font-size: 28rpx;
                    font-weight: 400;
                    color: rgba(39, 40, 50, 0.6);
                    padding-right: 10rpx;
                }
            }
            
            .member-ls {
                width: 100%;
                padding: 20rpx;
                box-sizing: border-box;
                display: flex;
                flex-wrap: wrap;
            }
            
            .member-li {
                width: 20%;
                padding: 10rpx;
                box-sizing: border-box;
                text-align: center;
                margin-bottom: 20rpx;
                
                .imgs {
                    position: relative;
                    width: 100rpx;
                    height: 100rpx;
                    margin: 0 auto;
                    border-radius: 20rpx;
                    overflow: hidden;
                    background-color: $uni-color-primary;
                }
                
                .user-img {
                    width: 100%;
                    height: 100%;
                    border-radius: 20rpx;
                    object-fit: cover;
                }
                
                .delete-img {
                    position: absolute;
                    top: -10rpx;
                    right: -10rpx;
                    z-index: 10;
                    width: 36rpx;
                    height: 36rpx;
                    background-color: #fff;
                    border-radius: 50%;
                }
                
                .name {
                    margin-top: 10rpx;
                    font-size: 24rpx;
                    color: #272832;
                    line-height: 34rpx;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    overflow: hidden; 
                }
                
                .user-add {
                    width: 100rpx;
                    height: 100rpx;
                    padding: 28rpx;
                    box-sizing: border-box;
                    border-radius: 20rpx;
                    border: 1rpx dashed #ccc;
                }
            }
        }
        
        .mitem {
            display: flex;
            flex-direction: column;
            padding-top: 22rpx;
            width: 100%;
            border-bottom: 1px solid #eee;
            
            .row {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 0 30rpx;
                min-height: 100rpx;
                border-bottom: 1px solid $uni-border-color; 
                
                &:last-child {
                    border-bottom: none;
                }
            }
            
            .title {
                width: 150rpx;
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
                padding: 20rpx 0;
            }
            
            .cont {
                flex: 1;
                font-size: $uni-font-size-lg;
                color: $uni-text-color-grey;
                padding: 20rpx 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .bg-inner-img {
                width: 90rpx;
                height: 90rpx;
                border-radius: 10rpx;
                margin: 10rpx 0;
                object-fit: cover;
            }
            
            .more {
                padding-left: 20rpx;
                
                image {
                    width: 32rpx;
                    height: 32rpx;
                }
            }
        }
        
        .bt2 {
            margin: 40rpx auto;
            text-align: center;
            font-size: 32rpx;
            color: $uni-color-warning;
            line-height: 88rpx;
            border-radius: 44rpx;
            background-color: #f8f8f8;
        }
    }
    
    .modify {
        position: fixed; 
        z-index: 1001;
        left: 0;
        width: 100%;
        height: 100%;
        background: #fff;
        
        .modify-header {
            width: 100%;
            height: 88rpx;
            padding-top: var(--status-bar-height);
            display: flex;
            flex-direction: row;
            align-items: center;
            border-bottom: 1px solid $uni-border-color;
            
            .close {
                padding-left: $uni-spacing-col-base;
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
                line-height: 88rpx;
            }
            
            .title {
                flex: 1;
                text-align: center;
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
                line-height: 88rpx;
            }
            
            .define {
                padding-right: $uni-spacing-col-base;
                font-size: $uni-font-size-lg;
                color: $uni-color-success;
                line-height: 88rpx;
            }
        }
        
        .modify-main {
            display: flex;
            padding: $uni-spacing-col-base;
            flex-direction: column;
            
            .modify-content {
                padding: 20rpx;
                width: 100%;
                box-sizing: border-box;
                height: 300rpx;
                background: $uni-bg-color-grey;
                border-radius: $uni-border-radius-base;
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
                line-height: 44rpx;
            }
        }
    }
    
    /* #ifdef MP */
    .top-bar, .modify-header {
        padding-top: 40rpx; // 小程序状态栏适配
    }
    
    // 优化小程序中的按钮点击区域
    .member-li .imgs, .bt2 {
        position: relative;
        
        &:after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    }
    /* #endif */
</style>