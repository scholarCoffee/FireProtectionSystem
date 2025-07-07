<template>
	<view class="content">
		<view class="top-bar">
			<view class="top-bar-left" @tap="navigateBack">
				<image src="../../static/user/back.png" class="back-img"></image>
			</view>
            <view class="top-bar-center">
                <view class="title">好友请求</view>
            </view>
		</view>
		<view class="main" v-if="requesters.length > 0">
            <view class="requester" v-for="(item, index) in requesters" :key="index" :class="{'requester-transition': item.isTransition}">
                <view class="request-top">
                   <view class="reject btn" @tap="refuse(item.id, index)">
                       拒绝 
                   </view>
                   <view class="header-img">
                        <image :src="item.imgUrl"></image> 
                   </view>
                   <view class="aggree btn" @tap="agree(item.id, index)">
                       同意 
                   </view>
                </view>
                <view class="request-center">
                    <view class="title">{{ item.name }}</view>
                    <view class="time">{{ changeTime(item.lastTime) }}</view>
                </view>
                <view class="notic">
                    <text>留言：</text>
                    {{ item.message || '对方没有留言' }}
                </view>
                <view class="actions">
                    <view class="action-btn view-profile" @tap="viewProfile(item.id)">
                        查看资料
                    </view>
                </view>
            </view>
        </view>
        <view class="main empty-main" v-else>
            <view class="requester empty-requester">
                <view class="request-top">
                   <view class="header-img">
                        <image src="../../static/user/empty.png"></image> 
                   </view>
                </view>
                <view class="request-center">
                    <view class="title">暂无好友请求</view>
                    <view class="subtitle">可以去探索更多好友</view>
                </view>
                <view class="find-friends-btn" @tap="findFriends">
                    查找好友
                </view>
            </view>
        </view>
	</view>
</template>

<script>
    import { dateTime } from './../../commons/js/utils.js'; // 导入 dateTime 函数
	export default {
		data() {
			return {
                requesters: [],
                uid: '',
                userName: '',
                token: '',
                pageLoading: false
			};
		},
        onLoad() {
            this.getStorages()
            this.friendRequest()
        },
		methods: {
            getStorages() {
                // 获取本地存储的用户信息
                const userInfo = uni.getStorageSync('userInfo');
                if (userInfo) {
                    const { userId, userName, imgUrl, token } = userInfo;
                    this.uid = userId; // 用户ID
                    this.userName = userName; // 用户名
                    this.imgUrl = this.serverUrl + imgUrl; // 头像URL
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
            changeTime(time) {
                return dateTime(time)
            },
            // 查看用户资料
            viewProfile(userId) {
                uni.navigateTo({
                    url: '/pages-personal/userDetail/index?id=' + userId
                });
            },
            // 查找好友
            findFriends() {
                uni.navigateTo({
                    url: '/pages-personal/search/index'
                });
            },
            // 获取留言增加空值处理
            getLeave(arr, i) {
                uni.request({
					url: this.serverUrl + '/index/getlastmsg', // 替换为你的登录接口地址,
					method: 'POST',
					data: {
						uid: this.uid,
                        fid: arr[i].id, // 2表示好友申请
						token: this.token
					},
					success: (res) => {
						const { data, code } = res.data
						if (code === 200) {
                            arr[i].message = data.message || '暂无留言'
                            // 添加loading状态属性
                            arr[i].refuseLoading = false
                            arr[i].agreeLoading = false
                            arr[i].isTransition = false
                            arr.splice(i, 1, arr[i])
						} else {
							console.log('获取留言失败');
						}
					},
					fail: (err) => {
						console.log('获取留言请求失败');
					}
				})
            },
            // 好友请求增加加载状态
            friendRequest() {
                this.pageLoading = true
                uni.showLoading({
                    title: '加载好友请求中...'
                });
                
                uni.request({
					url: this.serverUrl + '/index/getFriend',
					method: 'POST',
					data: {
						uid: this.uid,
                        state: 1,
						token: this.token
					},
					success: (res) => {
						const { data, code } = res.data
						if (code === 200) {
                            for(let i = 0 ; i < data.length; i ++) {
                                data[i].imgUrl = this.serverUrl + data[i].imgurl
                                this.getLeave(data, i)
                            }
                            this.requesters = data
						} else {
							uni.showToast({
                                title: '获取好友请求失败',
                                icon: 'none',
                                duration: 2000
                            });
						}
					},
					fail: (err) => {
						uni.showToast({
							title: '获取好友请求失败',
							icon: 'none',
							duration: 2000
						});
					},
                    complete: () => {
                        this.pageLoading = false
                        uni.hideLoading()
                    }
				})
            },
            // 拒绝好友申请
            refuse(fid, index) {
                // 先设置loading状态
                this.$set(this.requesters[index], 'refuseLoading', true)
                
                uni.request({
					url: this.serverUrl + '/friend/deleteFriend', // 替换为你的登录接口地址,
					method: 'POST',
					data: {
						uid: this.uid,
                        fid: fid, 
						token: this.token
					},
					success: (res) => {
						const { data, code } = res.data
						if (code === 200) {
                            // 添加过渡效果类
                            this.$set(this.requesters[index], 'isTransition', true)
                            
                            // 延迟后移除
                            setTimeout(() => {
                                this.requesters.splice(index, 1)
                                uni.showToast({
                                    title: '已拒绝该好友请求',
                                    icon: 'none',
                                    duration: 2000
                                })
                            }, 300)
						} else {
							uni.showToast({
                                title: '操作失败，请重试',
                                icon: 'none',
                                duration: 2000
                            });
                            this.$set(this.requesters[index], 'refuseLoading', false)
						}
					},
					fail: (err) => {
						uni.showToast({
							title: '网络错误，请重试',
							icon: 'none',
							duration: 2000
						});
                        this.$set(this.requesters[index], 'refuseLoading', false)
					}
				})
            },
            agree(fid, index) {
                // 先设置loading状态
                this.$set(this.requesters[index], 'agreeLoading', true)  
                uni.request({
					url: this.serverUrl + '/friend/updateFriendState', // 替换为你的登录接口地址,
					method: 'POST',
					data: {
						uid: this.uid,
                        fid: fid,
						token: this.token
					},
					success: (res) => {
						const { data, code } = res.data
						if (code === 200) {
                            // 添加过渡效果类
                            this.$set(this.requesters[index], 'isTransition', true)
                            
                            // 延迟后移除
                            setTimeout(() => {
                                this.requesters.splice(index, 1)
                                uni.showToast({
                                    title: '已添加为好友',
                                    icon: 'success',
                                    duration: 2000
                                })
                            }, 300)
						} else {
							uni.showToast({
                                title: '操作失败，请重试',
                                icon: 'none',
                                duration: 2000
                            });
                            this.$set(this.requesters[index], 'agreeLoading', false)
						}
					},
					fail: (err) => {
						uni.showToast({
							title: '网络错误，请重试',
							icon: 'none',
							duration: 2000
						});
                        this.$set(this.requesters[index], 'agreeLoading', false)
					}
				})
            }
		}
	}
</script>

<style lang="scss">
    @import "../../commons/css/top-bar.scss"; // 引入公共样式
	.top-bar {
        background: rgba(255,255,255,0.96);
        border-bottom:1px solid $uni-border-color;
        
        .request-count {
            min-width: 40rpx;
            height: 40rpx;
            background-color: #5d7df9;
            color: white;
            border-radius: 20rpx;
            text-align: center;
            line-height: 40rpx;
            font-size: 24rpx;
            padding: 0 10rpx;
        }
    }
    .main {
        padding: 108rpx $uni-spacing-col-base;
        
        &.empty-main {
            display: flex;
            justify-content: center;
            align-items: center;
            height: calc(100vh - 200rpx);
        }
        
        .requester {
            margin-top: 80rpx;
            padding: $uni-spacing-col-base;
            background: rgba(255,255,255,1);
            box-shadow: 0rpx 24rpx 65rpx -8rpx rgba(213, 213, 214, 0.5);
            border-radius: $uni-border-radius-base;
            transition: all 0.3s ease;
            
            &.requester-transition {
                transform: translateX(120%);
                opacity: 0;
            }
            
            &.empty-requester {
                text-align: center;
                box-shadow: none;
                background: transparent;
            }
        }
        
        .request-top {
            display: flex;
            flex-direction: row;
            
            .btn {
                flex: none;
                width: 160rpx;
                height: 64rpx;
                border-radius: 40rpx;
                line-height: 64rpx;
                font-size: $uni-font-size-lg;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                
                image {
                    width: 32rpx;
                    height: 32rpx;
                    margin-right: 6rpx;
                }
                
                .loading-circle {
                    width: 32rpx;
                    height: 32rpx;
                    border: 3rpx solid rgba(255, 255, 255, 0.3);
                    border-top: 3rpx solid #fff;
                    border-radius: 50%;
                    margin-right: 6rpx;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                &:active {
                    transform: scale(0.95);
                    opacity: 0.9;
                }
            }
            
            .reject {
                color: white;
                background: linear-gradient(135deg, #ff7676, #ff5252);
                box-shadow: 0 6rpx 20rpx rgba(255, 82, 82, 0.2);
            }
            
            .aggree {
                color: white;
                background: linear-gradient(135deg, #6e8efb, #5d7df9);
                box-shadow: 0 6rpx 20rpx rgba(93, 125, 249, 0.2);
            }
        }

        .header-img {
            flex: auto;
            margin-top: -72rpx;
            text-align: center;
            image {
                width: 144rpx;
                height: 144rpx;
                border-radius: 50%;
                border: 4rpx solid white;
                box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
            }
        }
        
        .request-center {
            padding-top: 20rpx;
            padding-bottom: 30rpx;
            text-align: center;
            
            .title {
                font-size: 36rpx;
                font-weight: 600;
                color: $uni-text-color;
                line-height: 50rpx;
            }
            
            .time {
                font-size: $uni-font-size-sm;
                color: $uni-text-color-disable;
                line-height: 34rpx;
                margin-top: 6rpx;
            }
            
            .subtitle {
                font-size: 28rpx;
                color: #8a8a8a;
                margin-top: 10rpx;
            }
        }
        
        .notic {
            padding: 20rpx $uni-spacing-col-base;
            border-radius: $uni-border-radius-base;
            font-size: $uni-font-size-sm;
            background-color: $uni-bg-color-grey;
            color: $uni-text-color;
            line-height: 40rpx;
            margin-bottom: 30rpx;
            
            text {
                color: #8a8a8a;
            }
        }
        
        .actions {
            display: flex;
            justify-content: space-between;
            padding: 0 20rpx;
            
            .action-btn {
                display: flex;
                align-items: center;
                font-size: 26rpx;
                color: #666;
                padding: 10rpx 20rpx;
                border-radius: 30rpx;
                background-color: #f5f5f5;
                
                image {
                    width: 32rpx;
                    height: 32rpx;
                    margin-right: 10rpx;
                }
                
                &:active {
                    background-color: #eaeaea;
                }
            }
            
            .block-user {
                color: #ff5252;
            }
        }
        
        .find-friends-btn {
            margin-top: 40rpx;
            padding: 20rpx 0;
            width: 260rpx;
            text-align: center;
            font-size: 28rpx;
            color: white;
            background: linear-gradient(135deg, #6e8efb, #5d7df9);
            border-radius: 40rpx;
            box-shadow: 0 10rpx 20rpx rgba(93, 125, 249, 0.3);
            display: inline-block;
            
            &:active {
                transform: scale(0.95);
                opacity: 0.9;
            }
        }
    }
</style>
