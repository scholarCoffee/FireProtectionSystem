export const locationInfo = [
    { 
        addressName: '江苏省苏州市工业园区东方之门', // 地址名称
        addressId: '123456',  
        addressExt: '江苏省苏州市工业园区东方之门北座负一楼303号', // 地址详情地址
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 1, // 类型 1-高层小区 2-重点单位 3-沿街商铺
        safeLevelId: 1, // 评估等级 1-优秀 2-良好 3-一般 4-较差 
        safeLevelName: '优秀', // 安全等级描述 1-优秀 2-良好 3-一般 4-较差
        safeLevelDesc: '该单位安全设施完备，符合消防安全标准。', // 安全等级描述
        phoneList: [ // 联系电话列表
            { phone: '0512-12345678', name: '张三', type: 1 }, // type 1-单位负责人 2-消防负责人
            { phone: '0512-87654321', name: '李四', type: 2 }
        ],
        enterGateList: [ // 进出口列表
            { name: '东门', type: 1 }, // type 1-东门 2-南门 3-西门 4-北门
            { name: '南门', type: 2 },
            { name: '西门', type: 3 },
            { name: '北门', type: 4 }
        ],
    },
    { 
        addressName: '江苏省苏州市姑苏区虎丘山风景区', 
        addressId: '654321',  
        addressExt: '江苏省苏州市姑苏区虎丘山风景区南门', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 2, 
        safeLevelId: 2, 
        safeLevelName: '良好', 
        safeLevelDesc: '该单位安全设施较为完备，符合消防安全标准。', 
        phoneList: [
            { phone: '0512-23456789', name: '王五', type: 1 },
            { phone: '0512-98765432', name: '赵六', type: 2 }
        ],
        enterGateList: [
            { name: '南门', type: 1 },
            { name: '西门', type: 2 }
        ],
    },
    { 
        addressName: '江苏省苏州市姑苏区平江路历史街区', 
        addressId: '789012',  
        addressExt: '江苏省苏州市姑苏区平江路历史街区东段', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 3, 
        safeLevelId: 3, 
        safeLevelName: '一般', 
        safeLevelDesc: '该单位安全设施一般，需加强消防安全管理。', 
        phoneList: [
            { phone: '0512-34567890', name: '孙七', type: 1 },
            { phone: '0512-09876543', name: '周八', type: 2 }
        ],
        enterGateList: [
            { name: '东门', type: 1 },
            { name: '北门', type: 2 }
        ],
    },
    // 可以继续添加更多的单位信息
    { 
        addressName: '江苏省苏州市姑苏区金鸡湖景区', 
        addressId: '345678',  
        addressExt: '江苏省苏州市姑苏区金鸡湖景区西侧', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 1, 
        safeLevelId: 1, 
        safeLevelName: '优秀', 
        safeLevelDesc: '该单位安全设施完备，符合消防安全标准。', 
        phoneList: [
            { phone: '0512-45678901', name: '钱九', type: 1 },
            { phone: '0512-10987654', name: '吴十', type: 2 }
        ],
        enterGateList: [
            { name: '西门', type: 1 },
            { name: '南门', type: 2 }
        ],
    },
    { 
        addressName: '江苏省苏州市姑苏区拙政园', 
        addressId: '456789',  
        addressExt: '江苏省苏州市姑苏区拙政园东侧', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 2, 
        safeLevelId: 2, 
        safeLevelName: '良好', 
        safeLevelDesc: '该单位安全设施较为完备，符合消防安全标准。', 
        phoneList: [
            { phone: '0512-56789012', name: '郑十一', type: 1 },
            { phone: '0512-21098765', name: '冯十二', type: 2 }
        ],
        enterGateList: [
            { name: '东门', type: 1 },
            { name: '北门', type: 2 }
        ],
    },
    { 
        addressName: '江苏省苏州市姑苏区狮子林', 
        addressId: '567890',  
        addressExt: '江苏省苏州市姑苏区狮子林南侧', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 3, 
        safeLevelId: 3, 
        safeLevelName: '一般', 
        safeLevelDesc: '该单位安全设施一般，需加强消防安全管理。', 
        phoneList: [
            { phone: '0512-67890123', name: '陈十三', type: 1 },
            { phone: '0512-32109876', name: '杨十四', type: 2 }
        ],
        enterGateList: [
            { name: '南门', type: 1 },
            { name: '西门', type: 2 }
        ],
    },
    { 
        addressName: '江苏省苏州市姑苏区寒山寺', 
        addressId: '678901',  
        addressExt: '江苏省苏州市姑苏区寒山寺北侧', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 1, 
        safeLevelId: 4, 
        safeLevelName: '较差', 
        safeLevelDesc: '该单位安全设施较差，需立即整改。较差原因：消防设施老旧，存在安全隐患。', 
        phoneList: [
            { phone: '0512-78901234', name: '赵十五', type: 1 },
            { phone: '0512-43210987', name: '钱十六', type: 2 }
        ],
        enterGateList: [
            { name: '北门', type: 1 },
            { name: '东门', type: 2 }
        ],
    },
    { 
        addressName: '江苏省苏州市姑苏区网师园', 
        addressId: '789012',  
        addressExt: '江苏省苏州市姑苏区网师园西侧', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 1, 
        safeLevelId: 1, 
        safeLevelName: '良好', 
        safeLevelDesc: '该单位安全设施较为完备，符合消防安全标准。', 
        phoneList: [
            { phone: '0512-89012345', name: '孙十七', type: 1 },
            { phone: '0512-54321098', name: '周十八', type: 2 }
        ],
        enterGateList: [
            { name: '西门', type: 1 },
            { name: '南门', type: 2 }
        ],
    },
    { 
        addressName: '江苏省苏州市姑苏区留园', 
        addressId: '890123',  
        addressExt: '江苏省苏州市姑苏区留园东侧', 
        allSenceLink: 'https://www.720yun.com/vr/471j5gmwvu2', 
        type: 1, 
        safeLevelId: 1, 
        safeLevelName: '良好', 
        safeLevelDesc: '该单位安全设施较为完备，符合消防安全标准。', 
        phoneList: [
            { phone: '0512-90123456', name: '郑十九', type: 1 },
            { phone: '0512-65432109', name: '冯二十', type: 2 }
        ],
        enterGateList: [
            { name: '东门', type: 1 },
            { name: '北门', type: 2 }
        ],
    }
]

export const locationTabList = [
    { name: '高层小区', type: 1, icon: '/static/icons/location/community.png', activeIcon: '/static/icons/location/community-active.png' },
    { name: '重点单位', type: 2, icon: '/static/icons/location/factory.png', activeIcon: '/static/icons/location/factory-active.png' },
    { name: '沿街商铺', type: 3, icon: '/static/icons/location/shop.png', activeIcon: '/static/icons/location/shop-active.png' }
]

// export const chatSubmitList = [{
//     imgUrl: '/static/icons/chat/img.png',
//     key: 1,
//     text: '图片'
// }, {
//     imgUrl: '/static/icons/chat/photo.png',
//     key: 2,
//     text: '拍照'
// }, {
//     imgUrl: '/static/icons/chat/chatLocation.png',
//     key: 3,
//     text: '位置'
// }, {
//     imgUrl: '/static/icons/chat/video.png',
//     key: 4,
//     text: '视频'
// }, {
//     imgUrl: '/static/icons/chat/file.png',
//     key: 5,
//     text: '文件'
// }]
export const chatSubmitList = [{
    imgUrl: '/static/icons/chat/img.png',
    key: 1,
    text: '图片'
}, {
    imgUrl: '/static/icons/chat/photo.png',
    key: 2,
    text: '拍照'
}]