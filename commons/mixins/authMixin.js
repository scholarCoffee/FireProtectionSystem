// common/mixins/authMixin.js
export default {
    onShow() {
      // 只在页面栈顶部页面执行
      if (typeof this.route === 'string' && getCurrentPages().slice(-1)[0].route !== this.route) return;
      const token = uni.getStorageSync('token');
      if (!token) {
        this.$nextTick(() => {
          uni.showModal({
            title: '提示',
            content: '当前用户未登录，请登录',
            confirmText: '去登录',
            cancelText: '关闭',
            success: (res) => {
              if (res.confirm) {
                this.wxLogin();
              }
            }
          });
        });
      }
    },
    methods: {
      wxLogin() {
        uni.login({
          provider: 'weixin',
          success: (loginRes) => {
            // 这里需要你替换为自己的后端登录接口
            uni.request({
              url: 'https://your-backend.com/api/wx-login',
              method: 'POST',
              data: { code: loginRes.code },
              success: (res) => {
                if (res.data.token) {
                  uni.setStorageSync('token', res.data.token);
                  uni.showToast({ title: '登录成功', icon: 'success' });
                  // 可选：拉取用户信息
                } else {
                  uni.showToast({ title: '登录失败', icon: 'none' });
                }
              }
            });
          }
        });
      }
    }
  };