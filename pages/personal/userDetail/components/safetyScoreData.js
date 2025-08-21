// 安全评分通用数据
export const scoreStandardList = [
  {
    title: '天然河流',
    scores: [
      { text: '有', points: 10 },
      { text: '无', points: 0 }
    ]
  },
  {
    title: '周边消火栓',
    scores: [
      { text: '有', points: 10 },
      { text: '无', points: 0 }
    ]
  },
  {
    title: '单位通行',
    scores: [
      { text: '云梯通行', points: 10 },
      { text: '消防车通行', points: 5 },
      { text: '消防车不通行', points: 0 }
    ]
  },
  {
    title: '室外消火栓',
    scores: [
      { text: '有水', points: 10 },
      { text: '无水', points: 0 }
    ]
  },
  {
    title: '消防控制室',
    scores: [
      { text: '能启泵排烟', points: 10 },
      { text: '只启泵', points: 5 },
      { text: '都不可', points: 0 }
    ]
  },
  {
    title: '室内消火栓',
    scores: [
      { text: '都有水', points: 10 },
      { text: '部分没水', points: 5 },
      { text: '全部没水', points: 0 }
    ]
  },
  {
    title: '消防电梯',
    scores: [
      { text: '全部有', points: 10 },
      { text: '部分有', points: 5 },
      { text: '都没有', points: 0 }
    ]
  },
  {
    title: '楼梯间类型',
    scores: [
      { text: '都是防烟楼梯间', points: 10 },
      { text: '部分是防烟楼梯间', points: 5 },
      { text: '都不是', points: 0 }
    ]
  },
  {
    title: '单元贯通',
    scores: [
      { text: '都贯通', points: 10 },
      { text: '部分贯通', points: 5 },
      { text: '全不贯通', points: 0 }
    ]
  },
  {
    title: '快速处置小分队',
    scores: [
      { text: '有', points: 10 },
      { text: '无', points: 0 }
    ]
  }
];

// 评分项配置
export const scoreItemsConfig = {
  naturalWaterSource: {
    name: '天然河流',
    options: [
      { score: 10, text: '有', remark: '请填写具体河流名称和距离' },
      { score: 0, text: '无', remark: '请填写无河流的原因' }
    ]
  },
  outdoorHydrant: {
    name: '周边消火栓',
    options: [
      { score: 10, text: '有', remark: '请填写消火栓数量和位置' },
      { score: 0, text: '无', remark: '请填写无消火栓的原因' }
    ]
  },
  vehicleAccess: {
    name: '单位通行',
    options: [
      { score: 10, text: '云梯通行', remark: '请填写云梯车可到达的具体位置' },
      { score: 5, text: '消防车通行', remark: '请填写消防车可到达的具体位置' },
      { score: 0, text: '消防车不通行', remark: '请填写消防车无法通行的具体原因' }
    ]
  },
  outdoorHydrantWater: {
    name: '室外消火栓',
    options: [
      { score: 10, text: '有水', remark: '请填写消火栓水压和流量情况' },
      { score: 0, text: '无水', remark: '请填写消火栓无水的具体原因' }
    ]
  },
  controlRoom: {
    name: '消防控制室',
    options: [
      { score: 10, text: '能启泵排烟', remark: '请填写控制室设备运行状态' },
      { score: 5, text: '只启泵', remark: '请填写启泵功能正常，排烟功能异常的原因' },
      { score: 0, text: '都不可', remark: '请填写控制室无法使用的具体原因' }
    ]
  },
  buildingHydrant: {
    name: '室内消火栓',
    options: [
      { score: 10, text: '都有水', remark: '请填写消火栓水压和覆盖范围' },
      { score: 5, text: '部分没水', remark: '请填写哪些楼层或区域没水及原因' },
      { score: 0, text: '全部没水', remark: '请填写全部消火栓没水的具体原因' }
    ]
  },
  fireElevator: {
    name: '消防电梯',
    options: [
      { score: 10, text: '全部有', remark: '请填写消防电梯数量和运行状态' },
      { score: 5, text: '部分有', remark: '请填写哪些区域有消防电梯，哪些没有' },
      { score: 0, text: '都没有', remark: '请填写无消防电梯的具体原因' }
    ]
  },
  stairwellType: {
    name: '楼梯间类型',
    options: [
      { score: 10, text: '都是防烟楼梯间', remark: '请填写防烟楼梯间的数量和位置' },
      { score: 5, text: '部分是防烟楼梯间', remark: '请填写哪些是防烟楼梯间，哪些不是' },
      { score: 0, text: '都不是', remark: '请填写楼梯间类型和无法改造的原因' }
    ]
  },
  unitConnection: {
    name: '单元贯通',
    options: [
      { score: 10, text: '都贯通', remark: '请填写贯通的具体方式和位置' },
      { score: 5, text: '部分贯通', remark: '请填写哪些单元贯通，哪些不贯通' },
      { score: 0, text: '全不贯通', remark: '请填写单元间无法贯通的具体原因' }
    ]
  },
  emergencyTeam: {
    name: '快速处置小分队',
    options: [
      { score: 10, text: '有', remark: '请填写小分队人员数量和装备情况' },
      { score: 0, text: '无', remark: '请填写无快速处置小分队的原因' }
    ]
  }
};

// 获取评分项中文名称
export const getScoreItemName = (key) => {
  const nameMap = {
    'naturalWaterSource': '天然河流',
    'outdoorHydrant': '周边消火栓',
    'vehicleAccess': '单位通行',
    'outdoorHydrantWater': '室外消火栓',
    'controlRoom': '消防控制室',
    'buildingHydrant': '室内消火栓',
    'fireElevator': '消防电梯',
    'stairwellType': '楼梯间类型',
    'unitConnection': '单元贯通',
    'emergencyTeam': '快速处置小分队'
  };
  return nameMap[key] || key;
};

// 获取评分项选项
export const getScoreItemOptions = (key) => {
  return scoreItemsConfig[key]?.options || [];
};

// 根据总分获取安全等级
export const getSafetyLevelByScore = (totalScore) => {
  if (totalScore >= 90) {
    return 1; // 优秀
  } else if (totalScore >= 70) {
    return 2; // 一般
  } else {
    return 3; // 较差
  }
};

// 获取安全等级文本
export const getSafetyLevelText = (levelId) => {
  const levelMap = {
    1: '优秀',
    2: '一般',
    3: '较差'
  };
  return levelMap[levelId] || '未知';
};

// 获取安全等级颜色类
export const getSafetyLevelClass = (levelId) => {
  switch (levelId) {
    case 1:
      return 'level-excellent';
    case 2:
      return 'level-good';
    case 3:
      return 'level-poor';
    default:
      return '';
  }
};

// 获取进度条CSS类名
export const getProgressBarClass = (levelId) => {
  switch (levelId) {
    case 1:
      return 'progress-excellent';
    case 2:
      return 'progress-good';
    case 3:
      return 'progress-poor';
    default:
      return '';
  }
};
