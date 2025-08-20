// 数据指挥功能配置
export const commandConfig = {
  // 数据分析
  'data-analysis': {
    url: 'https://example.com/data-analysis',
    title: '数据分析',
    desc: '实时数据监控与分析',
    icon: 'analysis'
  },
  
  // 报警管理
  'alarm-management': {
    url: 'https://example.com/alarm-management',
    title: '报警管理',
    desc: '报警信息处理与统计',
    icon: 'alarm'
  },
  
  // 设备监控
  'device-monitor': {
    url: 'https://example.com/device-monitor',
    title: '设备监控',
    desc: '设备状态实时监控',
    icon: 'device'
  },
  
  // 报表系统
  'report-system': {
    url: 'https://example.com/report-system',
    title: '报表系统',
    desc: '数据报表生成与导出',
    icon: 'report'
  }
};

// 获取所有配置
export const getAllCommands = () => {
  return Object.keys(commandConfig).map(key => ({
    key,
    ...commandConfig[key]
  }));
};

// 根据key获取配置
export const getCommandByKey = (key) => {
  return commandConfig[key] || null;
};

// 更新配置
export const updateCommandConfig = (key, newConfig) => {
  if (commandConfig[key]) {
    commandConfig[key] = { ...commandConfig[key], ...newConfig };
    return true;
  }
  return false;
}; 