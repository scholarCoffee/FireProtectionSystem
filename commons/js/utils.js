export const dateTime = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diffTime = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    const hours = date.getHours().toString().padStart(2, '0'); // 补零
    const minutes = date.getMinutes().toString().padStart(2, '0'); // 补零

    if (diffTime < oneDay && date.getDate() === now.getDate()) {
        // 今天
        return `${hours}:${minutes}`;
    } else if (diffTime < 2 * oneDay && date.getDate() === now.getDate() - 1) {
        // 昨天
        return `昨天 ${hours}:${minutes}`;
    } else if (diffTime < 7 * oneDay) {
        // 最近7天
        return `${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
    } else {
        // 其他时间
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
    }
};


// 间隔时间差
export const spaceTime = (old, now) => {
    old = new Date(old)
    now = new Date(now)
    const told = old.getTime()
    const tnow = now.getTime()
    if (tnow > told + 1000*60*5) {
        return now;
    } // 5分钟内不显示
    return '';
}

// 搜索延时
export const debounce = (fn, delay = 500) => {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

// 处理时间格式，展示时间，格式为YYYY-MM-DD
export const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 处理时间格式，展示时间，格式为YYYY-MM-DD HH:mm:ss
export const formatDateTime = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
// 处理时间格式，展示时间，格式为YYYY-MM-DD HH:mm
export const formatDateTime2 = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 排序根据tip排序
export const sortByTip = (arr, key, tip) => {
    if (tip == 0) {
        // 降序
        arr.sort((a, b) => {
            return b[key] - a[key];
        });
    } else if (tip == 1) {
        // 升序
        arr.sort((a, b) => {
            return a[key] - b[key];
        });
    }
    return arr
}

// 生成时间戳（YYYYMMDD_HHmmss）
export const nowStamp = (date = new Date()) => {
    const d = new Date(date);
    const pad = (n) => (n < 10 ? ('0' + n) : '' + n);
    return (
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) + '_' +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds())
    );
}

// 拼接带日期时间子目录的上传url（确保以/开头）
export const withDatedPath = (basePath, date = new Date()) => {
    const stamp = nowStamp(date);
    const base = String(basePath || '').startsWith('/') ? basePath : ('/' + basePath);
    return `${base}/${stamp}`;
}

// 未读消息管理
let unreadCount = 0;

// 设置未读消息数
export const setUnreadCount = (count) => {
    unreadCount = count;
    updateTabBarBadge();
};

// 增加未读消息数
export const addUnreadCount = (count = 1) => {
    unreadCount += count;
    updateTabBarBadge();
};

// 减少未读消息数
export const reduceUnreadCount = (count = 1) => {
    unreadCount = Math.max(0, unreadCount - count);
    updateTabBarBadge();
};

// 清除未读消息数
export const clearUnreadCount = () => {
    unreadCount = 0;
    updateTabBarBadge();
};

// 获取未读消息数
export const getUnreadCount = () => {
    return unreadCount;
};

// 更新tabBar未读数
const updateTabBarBadge = () => {
    if (unreadCount > 0) {
        uni.setTabBarBadge({
            index: 1, // 聊天tab的索引
            text: unreadCount > 99 ? '99+' : unreadCount.toString()
        });
    } else {
        uni.removeTabBarBadge({
            index: 1
        });
    }
};

// 手机号码校验
export const validatePhone = (phone) => {
    if (!phone) {
        return { valid: false, message: '请输入手机号码' };
    }
    
    // 去除所有非数字字符
    const cleanPhone = phone.replace(/\D/g, '');
    
    // 检查长度
    if (cleanPhone.length !== 11) {
        return { valid: false, message: '手机号码必须为11位数字' };
    }
    
    // 检查是否以1开头
    if (!cleanPhone.startsWith('1')) {
        return { valid: false, message: '手机号码必须以1开头' };
    }
    
    // 检查第二位数字（运营商号段）
    const secondDigit = cleanPhone[1];
    const validSecondDigits = ['3', '4', '5', '6', '7', '8', '9'];
    if (!validSecondDigits.includes(secondDigit)) {
        return { valid: false, message: '请输入正确的手机号码' };
    }
    
    // 检查常见无效号码
    const invalidPatterns = [
        /^1[0-9]{10}$/, // 基本格式
        /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])[0-9]{8}$/ // 详细运营商号段
    ];
    
    // 使用更宽松的校验，只检查基本格式
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
        return { valid: false, message: '请输入正确的手机号码格式' };
    }
    
    return { valid: true, message: '手机号码格式正确', cleanPhone };
};

// 身份证号码校验
export const validateIdCard = (idCard) => {
    if (!idCard) {
        return { valid: false, message: '请输入身份证号码' };
    }
    
    const cleanIdCard = idCard.replace(/\s/g, '');
    
    // 18位身份证号码校验
    if (cleanIdCard.length === 18) {
        const reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
        if (!reg.test(cleanIdCard)) {
            return { valid: false, message: '请输入正确的18位身份证号码' };
        }
        return { valid: true, message: '身份证号码格式正确', cleanIdCard };
    }
    
    // 15位身份证号码校验（老版本）
    if (cleanIdCard.length === 15) {
        const reg = /^[1-9]\d{5}\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}$/;
        if (!reg.test(cleanIdCard)) {
            return { valid: false, message: '请输入正确的15位身份证号码' };
        }
        return { valid: true, message: '身份证号码格式正确', cleanIdCard };
    }
    
    return { valid: false, message: '身份证号码必须为15位或18位' };
};

// 邮箱校验
export const validateEmail = (email) => {
    if (!email) {
        return { valid: false, message: '请输入邮箱地址' };
    }
    
    const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!reg.test(email)) {
        return { valid: false, message: '请输入正确的邮箱格式' };
    }
    
    return { valid: true, message: '邮箱格式正确' };
};