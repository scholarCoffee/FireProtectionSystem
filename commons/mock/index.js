export const locationTabList = [
    { name: '高层小区', type: 1, icon: '/static/icons/location/community.png', activeIcon: '/static/icons/location/community-active.png' },
    { name: '重点单位', type: 2, icon: '/static/icons/location/factory.png', activeIcon: '/static/icons/location/factory-active.png' },
    { 
        name: '队站辖区', 
        type: 3, 
        icon: '/static/icons/location/shop.png', 
        activeIcon: '/static/icons/location/shop-active.png', 
        keywordOptions: [
            { label: '全部', value: 'all', category: '' },
            { label: '虞山森林-全景云', value: 'yushanForestPanorama', category: 'panorama' },
            { label: '虞山森林-消火栓', value: 'yushanForestHydrant', category: 'hydrant' },
            { label: '虞山城区-全景云', value: 'yushanCityPanorama', category: 'panorama' },
            { label: '虞山城区-消火栓', value: 'yushanCityHydrant', category: 'hydrant' }
        ]
    }
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