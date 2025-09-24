### 火灾任务上报接口文档（含状态流转）

版本：2025-09-24（与 pages/data/fireUpload/index.vue 当前实现对齐）

### 目录
- 接口清单
- 统一返回规范
- 枚举/字典
- 火情上报 POST /fire/upload（含“救援中/空闲中”状态规则）
- 静态/字典数据（建议提供）
- 其他现有接口（便于联调）

---

### 接口清单
- 火情上报：POST `/fire/upload`
-（建议）字典数据：
  - GET `/static/fireUnits`（救援单位目录）
  - GET `/static/fireCars`（救援车辆目录）
  - GET `/static/taskTypes`（任务类型与动态配置）
-（现有）
  - GET `/owner/list`
  - POST `/owner/delete`

---

### 统一返回规范
成功：
```json
{ "code": 200, "msg": "success", "data": { /* 任意对象或ID */ } }
```
失败：
```json
{ "code": 4xx/5xx, "msg": "错误描述" }
```

错误码建议：
- 400 参数/业务校验错误
- 409 资源冲突（如车辆重复分配）
- 500 服务端异常

---

### 枚举/字典
- directionOptions（示例）
```json
[
  { "label": "东侧", "value": "east" },
  { "label": "南侧", "value": "south" },
  { "label": "西侧", "value": "west" },
  { "label": "北侧", "value": "north" }
]
```
- 状态字段（单位/车辆）：
  - `status`: "idle"（空闲中）/ "rescuing"（救援中），也可 0/1 映射

---

### 火情上报
- 方法/路径：POST `/fire/upload`
- 功能：提交一次火情任务（地址信息 + 指派单位 + 每单位任务配置 + 车辆）。
- 成功后“状态流转”规则：
  1) 请求通过业务校验并成功落库后，将本次 `assignedUnits` 中涉及的“救援单位”的 `status` 统一置为 `rescuing`；
  2) 同时将每个单位下 `carIds` 对应的“救援车辆”的 `status` 统一置为 `rescuing`；
  3) 若某单位/车辆已处于 `rescuing`，允许重复设置但不得产生冲突；
  4) 若存在车辆或单位被其它任务占用的冲突，应返回 409 并给出冲突详情（如下所示）。

- 请求体（JSON）
```json
{
  "addressId": "1",
  "addressName": "金诚护理院",
  "locationType": 1,
  "remark": "现场烟雾较大，电气风险",
  "assignedUnits": [
    {
      "unitId": "UNIT001",
      "unitName": "一中队",
      "rescueFloor": "12",
      "direction": "",
      "taskType": "search",
      "taskExtra": { "searchTarget": "elderly" },
      "carIds": ["CAR001", "CAR003"],
      "carNames": ["1号车", "3号车"]
    }
  ],
  "issuePersonId": "U12345",
  "issuePersonName": "张三",
  "issueTime": "2025-09-24T10:20:30.000Z",
  "updateTime": "2025-09-24T10:20:30.000Z"
}
```

- 字段说明与约束：
  - `addressId`：必填
  - `locationType`：必填。1=楼层搜救；非1=出行/撤离方向
  - `assignedUnits`：数组，至少1项
    - `unitId`/`unitName`：必填（来自单位字典）
    - `rescueFloor`：当 `locationType=1` 时必填，必须是 1-100 的正整数；超过100仍需在后端兜底为100
    - `direction`：当 `locationType≠1` 时必填，取值来自 `directionOptions.value`
    - `taskType`：必填；`taskExtra`：若任务类型的配置存在 `actionKey`，则对应键的值必填
    - `carIds`：至少1个；`carNames` 同步（展示用）

- 业务校验（后端必须实现）：
  - `addressId` 非空，`assignedUnits` 非空
  - `locationType=1` ⇒ `rescueFloor ∈ [1,100]`（后端仍需兜底）
  - `locationType≠1` ⇒ `direction` 为合法字典值
  - `taskType` 合法，若存在 `actionKey` ⇒ `taskExtra[actionKey]` 非空
  - 车辆唯一占用：`carIds` 不可与其它处于救援中的任务存在交集，否则：
    ```json
    { "code": 409, "msg": "车辆不可重复分配: 1号车, 3号车" }
    ```

- 成功响应示例：
```json
{ "code": 200, "msg": "success", "data": { "id": "FIRE_TASK_20250924_001" } }
```

> 实施建议：将状态置为 `rescuing` 的动作纳入同一事务，确保“任务入库 + 状态更新”一致性。

---

### 静态/字典数据（建议）

1) GET `/static/fireUnits`
```json
[
  { "label": "一中队", "value": "UNIT001", "status": "idle" },
  { "label": "二中队", "value": "UNIT002", "status": "rescuing" }
]
```

2) GET `/static/fireCars`
```json
[
  { "label": "1号车", "value": "CAR001", "status": "idle" },
  { "label": "2号车", "value": "CAR002", "status": "rescuing" }
]
```

3) GET `/static/taskTypes`
```json
[
  { "label": "搜索救援", "value": "search",
    "config": { "uiType": "select", "actionKey": "searchTarget", "options": ["老人","儿童","伤员"] } },
  { "label": "撤离引导", "value": "evacuate",
    "config": { "uiType": "select-collection", "actionKey": "waterSupportUnit" } },
  { "label": "其他说明", "value": "misc",
    "config": { "uiType": "input", "actionKey": "note", "placeholder": "请输入说明" } }
]
```

---

### 其他现有接口（联调参考）

1) GET `/owner/list`
- Query：`addressId`（必填）、`building`、`unit`、`floor`、`roomNo`、`status`、`page`、`pageSize`
- 响应（两种任一）：
```json
{ "code": 200, "data": { "list": [], "pagination": { "current":1, "pageSize":20, "total":0, "totalPages":0, "hasNext":false, "hasPrev":false } } }
```
或
```json
{ "code": 200, "data": [] }
```
错误示例：`{ "code": 400, "message": "缺少addressId参数" }`

2) POST `/owner/delete`
```json
{ "id": "OWNER1758175934931582", "addressId": "1" }
```
响应：`{ "code": 200, "msg": "success" }`

---

### 备注与扩展
- 若需要“任务结束/撤销”时将单位与车辆状态恢复为 `idle`，可新增接口：
  - POST `/fire/finish` 传入任务ID，后端将涉及单位/车辆状态重置，并记录完成时间与日志。
- 为便于运维，可增加状态审计表（单位、车辆的状态变更历史）。


