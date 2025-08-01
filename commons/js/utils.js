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

// 文件夹使用的时间
export const fileNameTime = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}