<template>
    <view class="content"> 
        <view class="top-bar">
            <view class="top-bar-left" @tap="navigateBack">
                <image src="../../static/user/back.png" class="back-img"></image>
            </view>
        </view>
        <view class="main">
            <view class="top">
                <!-- 群头像 -->
                <view class="group-img" @tap="chooseImage">
                    <image :src="tempFilePaths" class="group-img"></image>
                    <view class="upload-icon">
                        <image src="../../static/user/camera.png"></image>
                    </view>
                </view>
                <!-- 群名字 -->
                <view class="group-name">
                    <input v-model="name" class="group-name-input" type="text" placeholder="为群取个名字吧" placeholder-style="color:#aaa;" />
                </view>
                <view class="title">选择成员 <text class="selected-count">已选 {{selectedNo}} 人</text></view>
            </view>
            <!-- 选择用户 -->
            <view class="friends">
                <view class="user" v-for="(item, index) in friendsList" :key="index" @tap="selectFriend(index)">
                    <view class="selected" :class="{'isselected': item.selected}">
                        <image src="../../static/choose_bold.png" class="selected-img" v-if="item.selected"></image>
                    </view>
                    <image class="user-img" :src="item.imgurl"></image>
                    <view class="user-name">{{item.name}}</view>
                </view>
                
                <view class="no-friends" v-if="friendsList.length === 0">
                    <image src="../../static/home/emptyNo.png"></image>
                    <text>暂无好友可选</text>
                </view>
            </view>
        </view>
        <view class="bottom-bar">
            <view class="bottom-btn" :class="{
                'btn-active': selectedNo > 0 && name.length > 0
            }" @tap="createGroup">
                <text>创建群聊</text>
                <text class="count" v-if="selectedNo > 0">({{ selectedNo }})</text>
            </view>
        </view>
        <!-- 加载提示框 -->
        <view class="loading-overlay" v-if="isLoading">
            <view class="loading-content">
                <image src="../../static/loading.png" class="loading-icon"></image>
                <text>{{loadingText}}</text>
            </view>
        </view>
    </view> 
</template>
<script>
    export default {
        data() {
            return {
                friendsList: [],
                uid: '',
                token: '',
                gimgurl: '/group/group.png',
                tempFilePaths: '../../static/1.png',
                selectedNo: 0,
                name: '',
                groupUserInfo: [],
                isLoading: false,
                loadingText: '正在创建群聊...'
            }
        },
        onLoad() {
            this.onSelectNumber()
            this.getStorages()
            this.getFriendsList()
        },
        methods: {
            navigateBack() {
                uni.navigateTo({
                    url: '/pages/index/index'
                })
            },
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
            chooseImage() {
                uni.chooseImage({
                    count: 1,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: (res) => {
                        this.tempFilePaths = res.tempFilePaths.shift();
                        // 显示加载提示
                        this.isLoading = true;
                        this.loadingText = '正在上传图片...';
                        
                        uni.uploadFile({
                            url: this.serverUrl + '/files/upload', // 替换为你的上传接口地址
                            filePath: this.tempFilePaths,
                            name: 'file',
                            fileType: 'image',
                            formData: {
                                url: 'user',
                                name: this.uid + new Date().getTime(),
                                token: this.token
                            },
                            success: (res) => {
                                try {
                                    const backImg = JSON.parse(res.data);
                                    this.gimgurl = backImg.data
                                    uni.showToast({
                                        title: '头像修改成功',
                                        icon: 'success',
                                        duration: 2000
                                    });
                                } catch (error) {
                                    uni.showToast({
                                        title: '解析返回数据失败',
                                        icon: 'none',
                                        duration: 2000
                                    });
                                }
                            },
                            fail: (err) => {
                                uni.showToast({
                                    title: '头像修改失败',
                                    icon: 'none',
                                    duration: 2000
                                });
                            },
                            complete: () => {
                                // 隐藏加载提示
                                this.isLoading = false;
                            }
                        });
                    },
                    fail: (err) => {
                        uni.showToast({
                            title: '选择图片失败',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                });
            },
            // 获取已选择个数
            onSelectNumber() {
                for(let i = 0; i < this.friendsList.length; i++) {
                    if(this.friendsList[i].selected) {
                        this.selectedNo++
                    }
                }
            },
            selectFriend(e) {
                if (this.friendsList[e].selected) {
                    this.friendsList[e].selected = false
                    this.selectedNo--
                } else {
                    this.selectedNo++
                    this.friendsList[e].selected = true
                }
                // 添加振动反馈
                uni.vibrateShort({
                    success: function () {}
                });
            },
            // 好友列表
            getFriendsList() {
                this.isLoading = true;
                this.loadingText = '加载好友列表...';
                
                this.friendsList = []
                uni.request({
					url: this.serverUrl + '/index/getFriend', // 替换为你的登录接口地址,
					method: 'POST',
					data: {
						uid: this.uid,
                        state: 0, // 2表示好友申请
						token: this.token
					},
					success: (res) => {
                        this.isRefresh = true
						const { data, code } = res.data
						if (code === 200) {
                            if (data.length > 0) {
                                // this.isNoone = false
                                for(let i = 0; i < data.length ; i++) {
                                    data[i].imgurl = this.serverUrl + data[i].imgurl
                                    data[i].selected = false
                                    if (data[i].markname) {
                                        data[i].name = data[i].markname
                                    }
                                    this.friendsList.push(data[i])
                                }
                            }
						} else {
							uni.showToast({
                                title: '获取好友列表失败',
                                icon: 'none',
                                duration: 2000
                            });
						}
					},
					fail: (err) => {
						uni.showToast({
							title: '获取好友列表失败' + err,
							icon: 'none',
							duration: 2000
						});
					},
                    complete: () => {
                        this.isLoading = false;
                    }
				})
            },
            // 创建群聊
            createGroup() {
                if (this.selectedNo > 0 && this.name.length > 0) {
                    this.groupUserInfo = [];
                    this.isLoading = true;
                    this.loadingText = '创建群聊中...';
                    
                    for(let i = 0 ;i < this.friendsList.length; i++) {
                        if (this.friendsList[i].selected) {
                            this.groupUserInfo.push(this.friendsList[i].id)
                        }
                    }
                    uni.request({
                        url: this.serverUrl + '/group/createGroup', // 替换为你的登录接口地址,
                        method: 'POST',
                        data: {
                            uid: this.uid,
                            token: this.token,
                            name: this.name,
                            imgurl: this.gimgurl,
                            groupUserInfo: this.groupUserInfo
                        },
                        success: (res) => {
                            const { data, code } = res.data
                            if (code === 200) {
                                uni.showToast({
                                    title: '创建成功',
                                    icon: 'success',
                                    duration: 2000
                                });
                                setTimeout(() => {
                                    uni.navigateTo({
                                        url: '../index/index'
                                    });
                                }, 1500);
                            } else {
                                uni.showToast({
                                    title: '创建失败',
                                    icon: 'none',
                                    duration: 2000
                                });
                            }
                        },
                        fail: (err) => {
                            uni.showToast({
                                title: '创建失败',
                                icon: 'none',
                                duration: 2000
                            });
                        },
                        complete: () => {
                            this.isLoading = false;
                        }
                    })
                } else {
                    uni.showToast({
                        title: '请至少选择一个好友并输入群名称',
                        icon: 'none',
                        duration: 2000
                    });
                }
            }
        }
    }
</script>
<style lang="scss">
    @import "../../commons/css/top-bar.scss"; // 引入公共样式
    .top-bar {
        background: rgba(255,255,255, 1);
        border-bottom: 1px solid $uni-border-color;
    }
    .main {
        display: flex;
        flex-direction: column;
        .top {
            position: fixed;
            padding-top: 200rpx;
            background-color: #fff;
            width: 100%;
            z-index: 99;
            box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
        }
        .group-img {
            width: 196rpx;
            height: 196rpx;
            margin: 0 auto;
            background: $uni-bg-color-grey;
            box-shadow: 0px 8rpx 16rpx rgba(0,0,0,0.1);
            border-radius: 40rpx;
            overflow: hidden;
            position: relative;
            
            image {
                width: 196rpx;
                height: 196rpx;
                object-fit: cover;
            }
            
            .upload-icon {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 60rpx;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                
                image {
                    width: 40rpx;
                    height: 40rpx;
                    object-fit: contain;
                }
            }
        }
        .group-name {
            padding: 52rpx $uni-spacing-col-base 0;
        }
        .group-name-input {
            text-align: center;
            height: 92rpx;
            background: $uni-bg-color-grey;
            border-radius: 46rpx;
            font-size: 32rpx;
            color: $uni-text-color;
        }
        .title {
            padding: $uni-spacing-col-base $uni-spacing-row-base 20rpx;
            font-size: 36rpx;
            font-weight: 600;
            color: $uni-text-color;
            line-height: 60rpx;
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .selected-count {
                font-size: 28rpx;
                font-weight: normal;
                color: $uni-text-color-grey;
            }
        }
        .friends {
            padding: 640rpx $uni-spacing-row-base 100rpx;
            .user {
                display: flex;
                flex-direction: row;
                align-items: center;
                height: 120rpx;
                background: #ffffff;
                margin-bottom: 20rpx;
                border-radius: 20rpx;
                padding: 0 20rpx;
                box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
                transform: translateZ(0);
                transition: all 0.2s ease;
                
                &:active {
                    transform: scale(0.98);
                    background: #f9f9f9;
                }
                
                .selected {
                    flex: none;
                    margin-right: 30rpx;
                    width: 48rpx;
                    height: 48rpx;
                    background: rgba(255, 228, 49, 0.5);
                    border-radius: 24rpx;
                    position: relative;
                    
                    .selected-img {
                        width: 30rpx;
                        height: 20rpx;
                        position: absolute;
                        left: 10rpx;
                        top: 16rpx
                    }
                }
                
                .isselected {
                    background: rgba(255, 228, 49, 1); 
                }
                
                .user-img {
                    width: 80rpx;
                    height: 80rpx;
                    background: #f2f2f2; 
                    border-radius: 16rpx;
                    object-fit: cover;
                }
                
                .user-name {
                    padding-left: 32rpx;
                    font-size: 30rpx;
                    color: $uni-text-color;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    overflow: hidden;
                }
            }
            
            .no-friends {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 60rpx 0;
                
                image {
                    width: 400rpx;
                    height: 240rpx;
                    margin-bottom: 20rpx;
                    opacity: 0.8;
                }
                
                text {
                    color: $uni-text-color-grey;
                    font-size: 28rpx;
                }
            }
        }
    }
    .bottom-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(250, 250, 250, 0.95);
        box-shadow: 0 -1px 10rpx rgba(0, 0, 0, 0.05);
        backdrop-filter: blur(10rpx);
        z-index: 100;
        
        .bottom-btn {
            margin: 0 $uni-spacing-col-base;
            height: 90rpx;
            border-radius: 45rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background: $uni-bg-color-grey;
            color: $uni-text-color-grey;
            font-size: 32rpx;
            transition: all 0.3s ease;
            
            .count {
                margin-left: 10rpx;
                font-weight: bold;
            }
        }
        
        .btn-active {
            background: $uni-color-primary;
            color: $uni-text-color;
            box-shadow: 0 8rpx 16rpx rgba(255, 228, 49, 0.3);
        }
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        
        .loading-content {
            background: #fff;
            border-radius: 16rpx;
            padding: 40rpx 60rpx;
            display: flex;
            flex-direction: column;
            align-items: center;
            
            .loading-icon {
                width: 80rpx;
                height: 80rpx;
                margin-bottom: 20rpx;
                animation: rotate 1.2s linear infinite;
            }
            
            text {
                font-size: 28rpx;
                color: $uni-text-color;
            }
        }
    }
    
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>