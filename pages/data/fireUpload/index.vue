<template>
  <view class="fire-upload-page">
    <view class="form-container">
      <!-- 救援地址 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">救援地址 <text class="required">*</text></text>
          <view class="address-selector" :class="{ 'disabled': situationId && !isChangeTask }" @tap="goToAddressSelector">
            <view class="address-info">
              <text class="address-text" :class="{'placeholder':!selectedAddress.addressName}">{{ selectedAddress.addressName || '请选择救援地址' }}</text>
              <!-- <text class="floor-info" v-if="selectedAddress.rescueFloor">{{ selectedAddress.rescueFloor }}层</text> -->
            </view>
            <image v-if="!situationId || isChangeTask" :src="serverUrl + '/static/icons/common/right.png'" class="arrow-icon" />
          </view>
        </view>
      </view>
      
      <!-- 支援信息 -->
      <view class="form-section" v-if="isCommitTask && supportContent">
        <view class="form-row">
          <text class="section-title">支援信息</text>
        </view>
        <view class="support-content-box">
          <text class="support-content-text">{{ supportContent }}</text>
        </view>
      </view>

      <!-- 当前地址 -->
      <view class="form-section">
        <view class="form-row" @tap="toggleCurrentAddress">
          <text class="section-title">当前地址</text>
          <image :src="serverUrl + '/static/icons/common/down.png'" class="toggle-icon" :class="{ 'expanded': showCurrentAddress }" />
        </view>
        <view class="current-address-content" v-if="showCurrentAddress">
          <view v-if="currentLocationLoading" class="loading-state">
            <text class="loading-text">获取中...</text>
          </view>
          <view v-else-if="currentLocation" class="current-location-info">
            <view class="location-header">
              <text class="location-name">{{ matchedAddress ? matchedAddress.addressName : (currentLocation.addressName || '当前位置') }}</text>
              <text class="location-match-status" :class="matchedAddress ? 'match-success' : 'match-fail'">
                {{ matchedAddress ? '已匹配' : '未录入' }}
              </text>
            </view>
            <text class="location-match-tip" v-if="!matchedAddress">请选择救援地址</text>
          </view>
          <view v-else class="error-state">
            <text class="error-text">获取位置失败</text>
          </view>
        </view>
      </view>

      <!-- 已有救援单位显示 -->
      <view class="form-section" v-if="situationId && existingUnits.length > 0">
        <view class="form-row" @tap="toggleExistingUnits">
          <text class="section-title">已有救援单位</text>
          <image :src="serverUrl + '/static/icons/common/down.png'" class="toggle-icon" :class="{ 'expanded': showExistingUnits }" />
        </view>
        <view class="existing-units-content" v-if="showExistingUnits">
          <view v-for="(unit, index) in existingUnits" :key="index" class="existing-unit-card">
            <view class="unit-info-row">
              <view class="unit-name-wrapper">
                <text class="unit-name">{{ unit.unitName }}</text>
                <view class="unit-status-badge" :class="unit.unitStatus === 'rescue' ? 'rescue-badge' : 'support-badge'">
                  <view class="status-dot"></view>
                  <text class="status-text">{{ unit.unitStatus === 'rescue' ? '救援单位' : '支援单位' }}</text>
                </view>
              </view>
              <text class="unit-time" v-if="unit.rescueTime">{{ formatTime(unit.rescueTime) }}</text>
            </view>
            <!-- 任务组列表 -->
            <view v-if="unit.taskGroups && unit.taskGroups.length > 0" class="existing-task-groups">
              <view v-for="(taskGroup, tgIdx) in unit.taskGroups" :key="tgIdx" class="existing-task-group">
                <view class="task-group-badge">任务组{{ tgIdx + 1 }}</view>
                <view class="task-group-details-row">
                  <text class="detail-text" v-if="taskGroup.carNames && taskGroup.carNames.length > 0">参战车辆：{{ taskGroup.carNames.join('、') }}</text>
                  <text class="detail-text" v-if="taskGroup.direction">方位：{{ getDirectionName(taskGroup.direction) }}</text>
                  <text class="detail-text" v-if="taskGroup.floor">楼层：{{ taskGroup.floor }}层</text>
                  <text class="detail-text" v-if="taskGroup.taskType">任务：{{ getTaskTypeName(taskGroup.taskType) }}</text>
                  
                  <!-- 搜救任务特殊字段 -->
                  <template v-if="isSearchTask(taskGroup)">
                    <text class="detail-text" v-if="getSearchPower(taskGroup)">搜救力量：{{ getSearchPower(taskGroup) }}</text>
                    <text class="detail-text" v-if="getSearchResult(taskGroup)">搜救结果：{{ getSearchResult(taskGroup) }}</text>
                  </template>
                  
                  <!-- 排烟任务特殊字段 -->
                  <template v-else-if="isSmokeTask(taskGroup)">
                    <text class="detail-text" v-if="getSmokePower(taskGroup)">排烟力量：{{ getSmokePower(taskGroup) }}</text>
                  </template>
                  
                  <!-- 供水任务特殊字段 -->
                  <template v-else-if="isWaterTask(taskGroup)">
                    <text class="detail-text" v-if="getTargetUnit(taskGroup)">目标中队：{{ getTargetUnit(taskGroup) }}</text>
                    <text class="detail-text" v-if="getTargetCars(taskGroup)">目标车辆：{{ getTargetCars(taskGroup) }}</text>
                  </template>
                  
                  <!-- 其他任务类型：显示作战力量 -->
                  <template v-else>
                    <text class="detail-text" v-if="getTaskPower(taskGroup)">{{ getTaskPowerLabel(taskGroup) }}：{{ getTaskPower(taskGroup) }}</text>
                  </template>
                  
                  <text class="detail-text" v-if="taskGroup.description">描述：{{ taskGroup.description }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 参战队站单位 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">参战队站<text class="required">*</text></text>
          <view class="assign-summary">
            <text class="summary-text" :class="{ placeholder: selectedUnits.length === 0 }">
              {{ selectedUnits.length === 0 ? '' : `已参战${selectedUnits.length}个` }}
            </text>
          </view>
          <view class="add-unit-btn" @tap="showUnitSelector">
            <text class="add-text">添加单位</text>
          </view>
        </view>
        
        <!-- 已选择的救援单位列表（内联配置） -->
        <view class="selected-units" v-if="selectedUnits.length > 0">
          <view v-for="(unit, index) in selectedUnits" :key="index" class="unit-item" :class="{ 'disabled-unit': isChangeTask && unit.unitStatus === 'support' }">
            <!-- 顶部标题 + 操作 -->
            <view class="unit-header">
              <text class="unit-title">{{ unit.label }}</text>
              <view class="unit-status-badge" v-if="isChangeTask" :class="unit.unitStatus === 'rescue' ? 'rescue-badge' : 'support-badge'">
                <view class="status-dot"></view>
                <text class="status-text">{{ unit.unitStatus === 'rescue' ? '救援单位' : '支援单位' }}</text>
              </view>
            </view>
            <view class="remove-btn" v-if="!(isChangeTask && unit.unitStatus === 'support')" @tap="removeUnit(index)">
              <image :src="serverUrl + '/static/icons/common/close.png'" class="remove-icon" />
            </view>
            <!-- 内联配置区域 -->
            <view class="unit-config-inline" :class="{ 'disabled-config': isChangeTask && unit.unitStatus === 'support' }">
              <!-- 参战车辆选择 -->
              <view class="config-section config-section-inline">
                <view class="car-selector" :class="{ 'disabled': isChangeTask && unit.unitStatus === 'support' }" @tap="showCarDrawer(unit, index)">
                  <text class="car-text">{{ getCarNames(unit) || '选择参战车辆' }}</text>
                  <image v-if="!(isChangeTask && unit.unitStatus === 'support')" :src="serverUrl + '/static/icons/common/down.png'" class="arrow-icon" />
                </view>
              </view>

              <!-- 任务配置组列表 -->
              <view v-for="(taskGroup, taskGroupIndex) in unit.taskGroups" :key="taskGroupIndex" class="task-group-item" :class="{ 'disabled-task-group': isChangeTask && unit.unitStatus === 'support' }">
                <view class="task-group-badge">任务组{{ taskGroupIndex + 1 }}</view>
                <view class="task-group-header">
                  <text class="task-group-label">参战车辆</text>
                  <view class="task-group-cars-selector" :class="{ 'disabled': isChangeTask && unit.unitStatus === 'support' }" @tap="showTaskGroupCarDrawer(unit, index, taskGroupIndex)">
                    <text class="task-group-cars" :class="{'placeholder': !getTaskGroupCarsText(taskGroup)}">{{ getTaskGroupCarsText(taskGroup) || '选择参战车辆' }}</text>
                    <image v-if="!(isChangeTask && unit.unitStatus === 'support')" :src="serverUrl + '/static/icons/common/down.png'" class="arrow-icon" />
                  </view>
                </view>
                <view class="remove-task-group-btn" v-if="!(isChangeTask && unit.unitStatus === 'support')" @tap="removeTaskGroup(unit, taskGroupIndex, index)">
                  <image :src="serverUrl + '/static/icons/common/close.png'" class="remove-icon" />
                </view>

                <!-- 任务类型 -->
                <view class="config-section">
                  <text class="config-label">任务类型 <text class="required">*</text></text>
                  <picker :value="taskGroup.taskTypeIndex" :range="taskTypeOptions" range-key="label" :disabled="isChangeTask && unit.unitStatus === 'support'" @change="onTaskTypeChange($event, taskGroup)" @bindchange="onTaskTypeChange($event, taskGroup)" class="form-picker">
                    <view class="picker-display" :class="{ 'disabled': isChangeTask && unit.unitStatus === 'support' }">
                      <text class="picker-text" :class="{'placeholder':!taskGroup.taskType}">{{ getTaskTypeText(taskGroup) }}</text>
                      <image v-if="!(isChangeTask && unit.unitStatus === 'support')" :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                    </view>
                  </picker>
                </view>

                <!-- 动态内容（所有任务类型都显示，包括灭火/堵截，但搜救/排烟任务不显示input类型）- 放在任务类型下面 -->
                <view class="config-section" v-if=" !isWaterTask(taskGroup) && taskGroup && taskGroup.taskType && taskGroup.taskConfig && !isSearchTask(taskGroup) && !isSmokeTask(taskGroup)">
                  <text class="config-label">{{ getTaskContentTitle(taskGroup) }}</text>
                  <view v-if="taskGroup.taskConfig && taskGroup.taskConfig.uiType === 'select'" class="form-picker-section">
                    <view class="force-options">
                      <view v-for="opt in taskGroup.taskConfig.options" :key="opt" class="force-option" :class="{ active: taskGroup.taskExtra[taskGroup.taskConfig.actionKey] === opt, disabled: isChangeTask && unit.unitStatus === 'support' }" @tap="selectTaskOption($event, opt, taskGroup)">
                        <text class="force-label">{{ opt }}</text>
                      </view>
                    </view>
                  </view>
                  <view v-else-if="taskGroup.taskConfig && taskGroup.taskConfig.uiType === 'input'" class="input-container">
                    <input v-model="taskGroup.taskExtra[taskGroup.taskConfig.actionKey]" class="form-input" :disabled="isChangeTask && unit.unitStatus === 'support'" :placeholder="taskGroup.taskConfig.placeholder || '请输入'" v-if="taskGroup.taskExtra && taskGroup.taskConfig" />
                  </view>
                  <view v-else-if="taskGroup.taskConfig && taskGroup.taskConfig.uiType === 'select-collection' && !isWaterTask(taskGroup)" class="form-picker-section">
                    <picker :value="taskGroup.dynamicSelectIndex" :range="assignedUnitOptions" range-key="label" :disabled="isChangeTask && unit.unitStatus === 'support'" @change="onDynamicSelectChange($event, taskGroup)" @bindchange="onDynamicSelectChange($event, taskGroup)" class="form-picker">
                      <view class="picker-display" :class="{ 'disabled': isChangeTask && unit.unitStatus === 'support' }">
                        <text class="picker-text" :class="{'placeholder':!taskGroup.taskExtra[taskGroup.taskConfig.actionKey]}">{{ getDynamicSelectText(taskGroup) }}</text>
                        <image v-if="!(isChangeTask && unit.unitStatus === 'support')" :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                      </view>
                    </picker>
                  </view>
                </view>

                <!-- 供水任务特殊字段（目标中队和目标车辆） -->
                <template v-if="isWaterTask(taskGroup)">
                  <!-- 目标中队 -->
                  <view class="config-section">
                    <text class="config-label">目标中队</text>
                    <view class="form-picker-section">
                      <picker :value="getTargetUnitIndex(taskGroup)" :range="getIdleUnitOptions()" range-key="label" :disabled="isChangeTask && unit.unitStatus === 'support'" @change="onTargetUnitChange($event, taskGroup)" @bindchange="onTargetUnitChange($event, taskGroup)" class="form-picker">
                        <view class="picker-display" :class="{ 'disabled': isChangeTask && unit.unitStatus === 'support' }">
                          <text class="picker-text" :class="{'placeholder':!getTargetUnitValue(taskGroup)}">{{ getTargetUnitText(taskGroup) }}</text>
                          <image v-if="!(isChangeTask && unit.unitStatus === 'support')" :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                        </view>
                      </picker>
                    </view>
                  </view>
                  <!-- 目标车辆（只在选择了目标中队后显示） -->
                  <view class="config-section" v-if="getTargetUnitValue(taskGroup)">
                    <text class="config-label">目标车辆</text>
                    <view class="form-picker-section">
                      <view class="force-options">
                        <view v-for="car in getIdleCarOptionsForUnit(taskGroup)" :key="car.value" class="force-option" :class="{ active: isTargetCarSelected(car, taskGroup), disabled: isChangeTask && unit.unitStatus === 'support' }" @tap="selectTargetCar(car, taskGroup)">
                          <text class="force-label">{{ car.label }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                </template>

                <!-- 搜救任务特殊字段 -->
                <template v-if="isSearchTask(taskGroup)">
                  <!-- 搜救力量 -->
                  <view class="config-section">
                    <text class="config-label">搜救力量</text>
                    <view class="form-picker-section">
                      <view class="force-options">
                        <view v-for="opt in searchPowerOptions" :key="opt" class="force-option" :class="{ active: taskGroup.searchPower === opt, disabled: isChangeTask && unit.unitStatus === 'support' }" @tap="selectSearchPower(opt, taskGroup)">
                          <text class="force-label">{{ opt }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                  
                  <!-- 搜救结果 -->
                  <view class="config-section">
                    <text class="config-label">搜救结果</text>
                    <view class="form-picker-section">
                      <view class="force-options">
                        <view v-for="opt in searchResultOptions" :key="opt" class="force-option" :class="{ active: taskGroup.searchResult === opt, disabled: isChangeTask && unit.unitStatus === 'support' }" @tap="selectSearchResult(opt, taskGroup)">
                          <text class="force-label">{{ opt }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                </template>

                <!-- 排烟任务特殊字段 -->
                <template v-if="isSmokeTask(taskGroup)">
                  <!-- 排烟力量 -->
                  <view class="config-section">
                    <text class="config-label">排烟力量</text>
                    <view class="form-picker-section">
                      <view class="force-options">
                        <view v-for="opt in smokePowerOptions" :key="opt" class="force-option" :class="{ active: taskGroup.smokePower === opt, disabled: isChangeTask && unit.unitStatus === 'support' }" @tap="selectSmokePower(opt, taskGroup)">
                          <text class="force-label">{{ opt }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                </template>

                <!-- 任务位置（选择车辆后显示） -->
                <view class="config-section" v-if="taskGroup.cars && taskGroup.cars.length > 0">
                  <text class="config-label">任务位置</text>
                  <view class="task-location-selector" :class="{ 'disabled': isChangeTask && unit.unitStatus === 'support' }" @tap="openTaskLocationSelector(taskGroup)">
                    <text class="task-location-text" :class="{'placeholder':!getTaskLocationText(taskGroup)}">{{ getTaskLocationText(taskGroup) || '请选择任务位置' }}</text>
                    <image v-if="!(isChangeTask && unit.unitStatus === 'support')" :src="serverUrl + '/static/icons/location/showLocation.png'" class="map-icon-small" />
                  </view>
                </view>

                <!-- 共用字段：层数、方位、描述 -->
                <template v-if="shouldShowFloor(taskGroup) || shouldShowDirection(taskGroup) || shouldShowDescription(taskGroup)">
                  <!-- 层数和方位在同一行 -->
                  <view class="config-section floor-direction-row" v-if="shouldShowFloor(taskGroup) || shouldShowDirection(taskGroup)">
                    <!-- 方位 -->
                    <view class="floor-direction-item" v-if="shouldShowDirection(taskGroup)">
                      <text class="config-label">{{ getDirectionLabel(taskGroup) }}</text>
                      <view class="form-picker-row">
                        <picker :value="taskGroup.directionIndex" :range="directionOptions" range-key="label" :disabled="isChangeTask && unit.unitStatus === 'support'" @change="onDirectionChange($event, taskGroup)" @bindchange="onDirectionChange($event, taskGroup)" class="form-picker">
                          <view class="picker-display" :class="{ 'disabled': isChangeTask && unit.unitStatus === 'support' }">
                            <text class="picker-text" :class="{'placeholder':!taskGroup.direction}">{{ getDirectionText(taskGroup) }}</text>
                            <image v-if="!(isChangeTask && unit.unitStatus === 'support')" :src="serverUrl + '/static/icons/common/down.png'" class="picker-arrow" />
                          </view>
                        </picker>
                      </view>
                    </view>
                    <!-- 层数 -->
                    <view class="floor-direction-item" v-if="shouldShowFloor(taskGroup)">
                      <text class="config-label">层数</text>
                      <view class="input-container">
                        <input v-model="taskGroup.floor" class="form-input" :disabled="isChangeTask && unit.unitStatus === 'support'" type="number" maxlength="2" placeholder="请输入层数(0~99)" @input="onFloorInput(taskGroup, $event)" />
                      </view>
                    </view>
                  </view>
                  
                  <!-- 描述 -->
                  <view class="config-section" v-if="shouldShowDescription(taskGroup)">
                    <text class="config-label">描述</text>
                    <view class="textarea-container">
                      <textarea v-model="taskGroup.description" class="form-textarea" :disabled="isChangeTask && unit.unitStatus === 'support'" maxlength="200" auto-height show-confirm-bar="false" placeholder="请输入描述信息（200字以内）" @input="onDescriptionInput(taskGroup)" />
                    </view>
                  </view>
                </template>
              </view>

              <!-- 添加任务组按钮 -->
              <view class="config-section" v-if="unit.selectedCars && unit.selectedCars.length > 0 && hasAvailableCars(unit) && !(isChangeTask && unit.unitStatus === 'support')">
                <button class="add-task-btn" @tap="addNewTaskGroup(unit, index)">
                  <text class="add-task-text">+ 添加任务组</text>
                </button>
              </view>
              <!-- 提示：所有车辆已分配 -->
              <view class="config-section" v-if="unit.selectedCars && unit.selectedCars.length > 0 && !hasAvailableCars(unit) && unit.taskGroups && unit.taskGroups.length > 0">
                <view class="no-available-cars-tip">所有车辆已分配到任务组</view>
              </view>

            </view>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view class="form-section">
        <view class="form-row">
          <text class="section-title">备注</text>
        </view>
        <view class="remark-textarea-container">
          <textarea v-model="formData.remark" class="form-textarea" maxlength="500" auto-height show-confirm-bar="false" placeholder="请输入备注信息" />
        </view>
      </view>
      <view class="form-bottom-spacer"></view>
    </view>

    <!-- 上一次记录提示弹窗 -->
    <view class="last-record-modal-mask" v-if="showLastRecordModal" @tap="dismissLastRecord">
      <view class="last-record-modal" @tap.stop>
        <view class="last-record-modal-header">
          <text class="last-record-modal-title">提示</text>
        </view>
        <view class="last-record-modal-body">
          <text class="last-record-modal-content">检测到您上一次的救援地址信息，是否沿用？</text>
          <view class="last-record-modal-address" v-if="lastRecordData && lastRecordData.addressName">
            <text class="last-record-address-label">救援地址：</text>
            <text class="last-record-address-text">{{ lastRecordData.addressName }}</text>
          </view>
        </view>
        <view class="last-record-modal-footer">
          <view class="last-record-modal-btn cancel-btn" @tap="dismissLastRecord">不使用</view>
          <view class="last-record-modal-btn confirm-btn" @tap="useLastRecord">使用</view>
        </view>
      </view>
    </view>

    <!-- 提交 -->
    <view class="submit-section">
      <button class="submit-btn" @tap="submitForm">{{ submitting ? '提交中...' : '提交' }}</button>
    </view>

    <!-- 参战车辆选择抽屉（底部弹出） -->
    <view class="drawer-mask" v-if="carDrawerVisible" @tap="hideCarDrawer">
      <view class="drawer-panel" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">选择参战车辆</text>
          <view class="drawer-close" @tap="hideCarDrawer">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="drawer-body">
          <view v-for="(car, idx) in getAvailableCarsForUnit()" :key="idx" class="drawer-item" :class="{ active: isCarTempSelected(car), disabled: isCarRescuing(car) }" @tap="toggleCarInDrawer(car)">
            <view class="checkbox">
              <view class="checkbox-inner" v-if="isCarTempSelected(car)"></view>
            </view>
            <view class="drawer-item-info">
              <text class="unit-label">{{ car.label }}</text>
            </view>
            <text class="status-badge" :class="isCarRescuing(car) ? 'rescuing' : 'idle'">{{ getCarStatusText(car) }}</text>
          </view>
        </view>
        <view class="drawer-footer">
          <button class="confirm-btn" @tap="confirmCarDrawer">确定</button>
        </view>
      </view>
    </view>

    <!-- 救援单位选择抽屉（底部弹出） -->
    <view class="drawer-mask" v-if="showUnitDrawer" @tap="hideUnitSelector">
      <view class="drawer-panel" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">选择救援单位</text>
          <view class="drawer-close" @tap="hideUnitSelector">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="drawer-body">
          <view v-for="(unit, index) in fireUnitOptions" :key="index" class="drawer-item" :class="{ disabled: isAlreadyAssigned(unit) || !unit.canSelect, active: !isAlreadyAssigned(unit) && unit.canSelect && isUnitSelected(unit) }" @tap="onPickUnit(unit)">
            <view class="checkbox">
              <view class="checkbox-inner" v-if="isUnitSelected(unit)"></view>
            </view>
            <view class="drawer-item-info">
              <text class="unit-label">{{ unit.label }}</text>
            </view>
            <text class="status-badge" :class="isAlreadyAssigned(unit) || !unit.canSelect ? 'disabled' : (unit.status === 'rescuing_all' || unit.status === 'rescuing_partial' ? 'rescuing' : 'idle')">{{ getDrawerUnitStatusText(unit) }}</text>
          </view>
        </view>
        <view class="drawer-footer">
          <button class="confirm-btn" @tap="confirmUnits">确定</button>
        </view>
      </view>
    </view>

    <!-- 任务组车辆选择抽屉（底部弹出） -->
    <view class="drawer-mask" v-if="taskGroupCarDrawerVisible" @tap="hideTaskGroupCarDrawer">
      <view class="drawer-panel" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">选择参战车辆（可多选）</text>
          <view class="drawer-close" @tap="hideTaskGroupCarDrawer">
            <image :src="serverUrl + '/static/icons/common/close.png'" class="close-icon" />
          </view>
        </view>
        <view class="drawer-body">
          <view v-for="(car, idx) in getAvailableCarsForTaskGroup()" :key="idx" class="drawer-item" :class="{ active: isTaskGroupCarSelected(car), disabled: isCarUsedInTaskGroup(getCurrentUnitForTaskGroup(), car) }" @tap="toggleTaskGroupCar(car)">
            <view class="checkbox">
              <view class="checkbox-inner" v-if="isTaskGroupCarSelected(car)"></view>
            </view>
            <view class="drawer-item-info">
              <text class="unit-label">{{ car.label }}</text>
              <text class="car-used-tip" v-if="isCarUsedInTaskGroup(getCurrentUnitForTaskGroup(), car)">已使用</text>
            </view>
          </view>
        </view>
        <view class="drawer-footer">
          <button class="confirm-btn" @tap="confirmTaskGroupCars">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { directionOptions, searchPowerOptions, searchResultOptions, smokePowerOptions } from '@/commons/js/fireStatus.js'

export default {
  name: 'FireUpload',
  data() {
    return {
      serverUrl: 'https://www.xiaobei.space',
      situationId: '', // 已有火场情况ID
      isChangeTask: false, // 是否是变更任务
      isCommitTask: false, // 是否是任务下达
      formData: {
        addressId: '',
        addressName: '',
        locationType: '',
        remark: '',
        assignedUnits: [] // 参战的救援单位列表
      },
      fireUnitOptions: [],
      fireCarOptions: [],
      directionOptions: directionOptions,
      searchPowerOptions: searchPowerOptions,
      searchResultOptions: searchResultOptions,
      smokePowerOptions: smokePowerOptions,
      taskTypeOptions: [],
      selectedAddress: {},
      submitting: false,
      selectedUnits: [], // 已选择的救援单位
      existingUnits: [], // 已有救援单位（从服务器加载）
      showUnitDrawer: false,
      carDrawerVisible: false,
      currentUnitIndex: -1, // 当前单位索引
      tempSelectedUnits: [], // 临时选择的单位
      tempSelectedCars: [], // 车辆抽屉的临时选择
      taskGroupCarDrawerVisible: false, // 任务组车辆选择抽屉显示状态
      currentTaskGroupUnitIndex: -1, // 当前任务组所属单位索引
      currentTaskGroupIndex: -1, // 当前编辑的任务组索引（-1表示新建）
      tempTaskGroupCars: [], // 任务组临时选择的车辆
      unitCarMap: {}, // 单位-车辆映射关系 { unitId: [carId1, carId2, ...] } 表示当前单位已使用的车辆
      showCurrentAddress: true, // 是否展开当前地址（默认展开）
      currentLocation: null, // 当前位置信息
      currentLocationLoading: false, // 是否正在获取位置
      matchedAddress: null, // 匹配到的地址
      showLastRecordModal: false, // 显示上一次记录弹窗
      lastRecordData: null, // 上一次记录的数据
      supportContent: '', // 支援信息
      initData: {}, // 初始数据
      showExistingUnits: false, // 是否展开已有救援单位（默认缩回）
      currentTaskGroupForLocation: null // 当前选择任务位置的任务组
    }
  },
  computed: {
    // 供水选择集合：只能选择已参战的救援单位
    assignedUnitOptions() {
      return (this.selectedUnits || []).map(u => ({ label: u.label, value: u.value }))
    }
  },
  onLoad(options) {
    this.loadStaticData()
    // 检查是否是变更任务
    if (options && options.taskType === 'change') {
      this.isChangeTask = true
    }
    // 检查是否是任务下达（commit）
    if (options && options.taskType === 'commit') {
      this.isCommitTask = true
      // 任务下达场景：当前地址默认缩回
      this.showCurrentAddress = false
    }
    // 检查是否从火场详情页跳转过来
    if (options && options.situationId) {
      this.situationId = options.situationId
      // 延迟加载，确保静态数据已加载完成
      this.$nextTick(() => {
        this.loadExistingFireData()
      })
    } else {
      // 如果不是编辑模式，先查询上一次记录
      this.checkLastRecord()
      // 自动获取当前位置并匹配
      this.getCurrentLocationAndMatch()
    }
  },
  methods: {
    async loadStaticData() {
      try {
        // 直接从本地存储读取静态数据
        const fireUnits = uni.getStorageSync('static_fireUnits') || []
        const fireCars = uni.getStorageSync('static_fireCars') || []
        const taskTypes = uni.getStorageSync('static_taskTypes') || []
        
        this.fireUnitOptions = fireUnits
        this.fireCarOptions = fireCars
        this.taskTypeOptions = taskTypes.map(it => ({ ...it }))
        
        // 获取单位和车辆状态（合并接口）
        await this.loadUnitAndCarStatus()
      } catch (e) {
        uni.showToast({ title: '加载数据失败', icon: 'none' })
      }
    },
    // 加载单位和车辆状态（合并接口）
    async loadUnitAndCarStatus() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/fire/unitAndCarStatus',
            method: 'GET',
            success: resolve,
            fail: reject
          })
        })
        
        if (res && res.data && res.data.code === 200) {
          const data = res.data.data || {}
          // 单位-车辆映射关系（优先使用接口返回的，否则从静态资源构建）
          // unitCarMap 表示当前单位已使用的车辆
          if (data.unitCarMap) {
            // 将后端返回的 unitCarMap 中的车辆ID统一转换为字符串
            this.unitCarMap = {}
            Object.keys(data.unitCarMap).forEach(unitId => {
              const carIds = data.unitCarMap[unitId] || []
              this.unitCarMap[unitId] = carIds.map(id => String(id)).filter(id => id)
            })
          } else {
            this.buildUnitCarMap()
          }
          // 更新单位状态
          this.updateUnitStatus()
        }
      } catch (e) {
        console.error('获取单位和车辆状态失败:', e)
        // 不显示错误提示，静默处理
      }
    },
    // 构建单位-车辆映射关系（从静态资源获取）
    buildUnitCarMap() {
      const fireUnits = uni.getStorageSync('static_fireUnits') || []
      const fireCars = uni.getStorageSync('static_fireCars') || []
      
      this.unitCarMap = {}
      fireUnits.forEach(unit => {
        // 从静态资源中获取该单位的所有车辆
        // 根据实际的数据结构匹配，车辆可能通过 unitId、unitCode 或其他字段关联
        const unitCars = fireCars.filter(car => {
          // 支持多种匹配方式
          const unitValue = String(unit.value || '')
          const unitId = String(unit.id || '')
          const unitCode = String(unit.code || '')
          
          const carUnitId = String(car.unitId || '')
          const carUnitCode = String(car.unitCode || '')
          
          return carUnitId === unitValue || 
                 carUnitId === unitId || 
                 carUnitCode === unitCode ||
                 (car.unit && (String(car.unit.value || '') === unitValue || String(car.unit.id || '') === unitId))
        })
        
        // 提取车辆ID，统一转换为字符串
        const carIds = unitCars.map(car => String(car.value || car.id || car.carId || '')).filter(id => id)
        this.unitCarMap[unit.value] = carIds
      })
    },
    // 更新单位状态
    updateUnitStatus() {
      // 获取当前表单中已选择单位使用的所有车辆ID（包括已有支持车辆）
      const selectedCarIds = new Set()
      this.selectedUnits.forEach(unit => {
        if (unit.selectedCars && unit.selectedCars.length > 0) {
          unit.selectedCars.forEach(car => {
            if (car.value) {
              selectedCarIds.add(String(car.value))
            }
          })
        }
      })
      
      this.fireUnitOptions = this.fireUnitOptions.map(unit => {
        const unitCarIds = this.unitCarMap[unit.value] || []
        if (unitCarIds.length === 0) {
          // 如果没有车辆，默认为空闲
          return {
            ...unit,
            status: 'idle',
            statusText: '空闲中',
            canSelect: true
          }
        }
        
        // 将单位车辆ID转换为字符串数组，便于匹配
        const unitCarIdsStr = unitCarIds.map(id => String(id))
        
        // 检查该单位正在使用的车辆数量
        // 包括：1. unitCarMap中已使用的车辆 2. 当前表单中已选择的车辆（selectedCarIds）
        const usingCarCount = unitCarIdsStr.filter(carId => {
          // 检查是否在unitCarMap中（已使用的车辆）
          const isInUnitCarMap = unitCarIdsStr.includes(carId)
          
          // 检查是否在当前表单已选择的车辆中
          const isInSelectedCars = selectedCarIds.has(carId)
          
          return isInUnitCarMap || isInSelectedCars
        }).length

        
        if (usingCarCount === 0) {
          // 所有车辆都空闲
          return {
            ...unit,
            status: 'idle',
            statusText: '空闲中',
            canSelect: true
          }
        } else if (usingCarCount === this.fireCarOptions.length) {
          // 所有车辆都在使用（包括接口返回的占用车辆 + 当前表单中已选择的车辆）
          return {
            ...unit,
            status: 'rescuing_all',
            statusText: '救援中（全部）',
            canSelect: false
          }
        } else {
          // 部分车辆在使用，还有空闲车辆
          return {
            ...unit,
            status: 'rescuing_partial',
            statusText: '救援中（局部）',
            canSelect: true
          }
        }
      })
    },
    // 加载已有火场数据
    async loadExistingFireData() {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await new Promise((resolve, reject) => {
          uni.request({ 
            url: this.serverUrl + '/fire/detail', 
            method: 'GET', 
            data: { situationId: this.situationId }, 
            success: resolve, 
            fail: reject 
          })
        })
        
        if (res && res.data && res.data.code === 200) {
          const fireData = res.data.data || {}
          this.initData = fireData
          
          // 填充地址信息
          this.selectedAddress = {
            addressId: fireData.addressId,
            addressName: fireData.addressName,
            rescueFloor: fireData.rescueFloor
          }
          this.formData.addressId = fireData.addressId
          this.formData.addressName = fireData.addressName
          this.formData.locationType = fireData.locationType
          this.formData.remark = fireData.remark || ''
          
          // 如果是任务下达场景，保存支援信息
          if (this.isCommitTask && fireData.supportContent) {
            this.supportContent = fireData.supportContent
          }
          
          // 如果是变更任务，加载任务组信息到selectedUnits（救援单位和支援单位都加载，但支援单位禁用）
          if (this.isChangeTask && fireData.assignedUnits && fireData.assignedUnits.length > 0) {
            // 所有单位都加载到selectedUnits（支援单位会显示禁用状态）
            this.selectedUnits = fireData.assignedUnits.map(unit => {
              // 收集该单位所有任务组使用的车辆ID
              const allCarIds = new Set()
              const taskGroups = (unit.taskGroups || []).map(taskGroup => {
                const carIds = taskGroup.carIds || []
                carIds.forEach(id => allCarIds.add(String(id)))
                
                // 获取任务类型索引
                const taskTypeIndex = this.getTaskTypeIndex(taskGroup.taskType)
                const taskTypeOption = this.taskTypeOptions[taskTypeIndex] || {}
                
                // 获取任务配置
                const taskConfig = this.getTaskConfig(taskGroup.taskType)
                
                // 构建车辆对象数组
                const cars = []
                if (taskGroup.carIds && taskGroup.carIds.length > 0) {
                  taskGroup.carIds.forEach(carId => {
                    const car = this.fireCarOptions.find(c => String(c.value) === String(carId))
                    if (car) {
                      cars.push({ ...car })
                    }
                  })
                }
                
                // 获取方向索引
                const directionIndex = this.getDirectionIndex(taskGroup.direction)
                
                // 构建任务组对象
                const taskExtra = taskGroup.taskExtra || {}
                const tg = {
                  cars: cars,
                  floor: taskGroup.floor || '',
                  direction: taskGroup.direction || 1,
                  directionIndex: directionIndex,
                  description: taskGroup.description || '',
                  taskType: taskGroup.taskType || '',
                  taskTypeIndex: taskTypeIndex,
                  taskConfig: taskConfig,
                  taskExtra: taskExtra,
                  dynamicSelectIndex: 0,
                  // 搜救任务特殊字段（优先从taskGroup获取，否则从taskExtra获取）
                  searchPower: taskGroup.searchPower || taskExtra.searchPower || '',
                  searchResult: taskGroup.searchResult || taskExtra.searchResult || '',
                  // 排烟任务特殊字段（优先从taskGroup获取，否则从taskExtra获取）
                  smokePower: taskGroup.smokePower || taskExtra.smokePower || '',
                  // 供水任务和排烟任务特殊字段
                  targetCars: [],
                  // 任务位置信息
                  taskLocation: taskGroup.taskLocation || null
                }
                
                // 处理供水任务的目标车辆
                if (this.isWaterTask(tg) && taskGroup.targetCars && taskGroup.targetCars.length > 0) {
                  tg.targetCars = taskGroup.targetCars.map(tc => {
                    const car = this.fireCarOptions.find(c => String(c.value) === String(tc.carId || tc.value))
                    return car ? { ...car } : null
                  }).filter(Boolean)
                }
                
                // 排烟任务不需要目标车辆，初始化为空数组
                if (this.isSmokeTask(tg)) {
                  tg.targetCars = []
                }
                
                // 处理供水任务的目标中队（单选）
                if (this.isWaterTask(tg)) {
                  // 兼容旧数据：从 taskExtra.targetUnit 获取（单选）
                  if (taskGroup.taskExtra && taskGroup.taskExtra.targetUnit) {
                    // 暂时保存目标单位ID，后续处理
                    tg._targetUnitId = String(taskGroup.taskExtra.targetUnit)
                  }
                  // 兼容多选数据：从 targetUnits 数组获取第一个
                  else if (taskGroup.targetUnits && Array.isArray(taskGroup.targetUnits) && taskGroup.targetUnits.length > 0) {
                    const firstUnit = taskGroup.targetUnits[0]
                    const unitId = firstUnit.unitId || firstUnit.value || firstUnit
                    tg._targetUnitId = String(unitId)
                  }
                }
                
                return tg
              })
              
              // 构建该单位的车辆列表（所有任务组使用的车辆）
              const selectedCars = []
              allCarIds.forEach(carId => {
                const car = this.fireCarOptions.find(c => String(c.value) === String(carId))
                if (car) {
                  selectedCars.push({ ...car })
                }
              })
              
              // 从fireUnitOptions中找到对应的单位信息
              const unitOption = this.fireUnitOptions.find(u => String(u.value) === String(unit.unitId))
              
              return {
                ...(unitOption || { label: unit.unitName, value: unit.unitId }),
                selectedCars: selectedCars,
                taskGroups: taskGroups,
                unitStatus: unit.unitStatus || 'rescue',
                rescueTime: unit.rescueTime || new Date().toISOString()
              }
            })
            
            // 处理供水任务的目标中队（需要在selectedUnits构建完成后）
            // 使用$nextTick确保数据已更新
            this.$nextTick(() => {
              this.selectedUnits.forEach(unit => {
                if (unit.taskGroups && unit.taskGroups.length > 0) {
                  unit.taskGroups.forEach(taskGroup => {
                    if (this.isWaterTask(taskGroup) && taskGroup._targetUnitId) {
                      // 从空闲中队中查找目标单位
                      const targetUnit = this.fireUnitOptions.find(u => 
                        String(u.value) === String(taskGroup._targetUnitId) && 
                        (u.status === 'idle' || (u.canSelect === true && u.status !== 'rescuing_all'))
                      )
                      if (targetUnit) {
                        // 更新taskExtra中的targetUnit
                        if (!taskGroup.taskExtra) {
                          this.$set(taskGroup, 'taskExtra', {})
                        }
                        this.$set(taskGroup.taskExtra, 'targetUnit', String(targetUnit.value))
                        // 兼容旧数据：同时更新 targetUnits 数组
                        this.$set(taskGroup, 'targetUnits', [{ ...targetUnit }])
                      }
                      // 清除临时字段
                      delete taskGroup._targetUnitId
                    }
                  })
                }
              })
              // 强制更新视图
              this.$forceUpdate()
            })
            
            // 强制清除所有排烟任务的目标车辆
            this.selectedUnits.forEach(unit => {
              if (unit.taskGroups && unit.taskGroups.length > 0) {
                unit.taskGroups.forEach(taskGroup => {
                  if (this.isSmokeTask(taskGroup)) {
                    this.$set(taskGroup, 'targetCars', [])
                  }
                })
              }
            })
            
            // 更新表单数据
            this.updateFormData()
            // 更新单位状态
            this.updateUnitStatus()
          } else {
            // 如果不是变更任务，保存已有救援单位到单独的数据中
            if (fireData.assignedUnits && fireData.assignedUnits.length > 0) {
              this.existingUnits = fireData.assignedUnits.map(unit => ({
                unitId: unit.unitId,
                unitName: unit.unitName,
                unitStatus: unit.unitStatus || 'rescue',
                rescueTime: unit.rescueTime || new Date().toISOString(),
                taskGroups: unit.taskGroups || [] // 保存任务组数据
              }))
            }
          }
        }
      } catch (e) {
        uni.showToast({ title: '加载火场数据失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    // 获取方向索引
    getDirectionIndex(direction) {
      const index = this.directionOptions.findIndex(opt => opt.value === direction)
      return index >= 0 ? index : 0
    },
    // 获取任务类型索引
    getTaskTypeIndex(taskType) {
      const index = this.taskTypeOptions.findIndex(opt => opt.value === taskType)
      return index >= 0 ? index : 0
    },
    // 获取任务配置
    getTaskConfig(taskType) {
      const taskTypeOption = this.taskTypeOptions.find(opt => opt.value === taskType)
      return taskTypeOption ? taskTypeOption.config : null
    },
    // 获取方向名称
    getDirectionName(direction) {
      const option = this.directionOptions.find(opt => opt.value === direction)
      return option ? option.label : direction
    },
    // 获取任务类型名称
    getTaskTypeName(taskType) {
      const option = this.taskTypeOptions.find(opt => opt.value === taskType)
      return option ? option.label : taskType
    },
    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return ''
      const d = new Date(timeStr)
      const y = d.getFullYear()
      const m = String(d.getMonth()+1).padStart(2,'0')
      const da = String(d.getDate()).padStart(2,'0')
      const h = String(d.getHours()).padStart(2,'0')
      const mi = String(d.getMinutes()).padStart(2,'0')
      return `${y}-${m}-${da} ${h}:${mi}`
    },
    goToAddressSelector() {
      // 如果有situationId且不是变更任务，则不允许修改地址
      if (this.situationId && !this.isChangeTask) {
        uni.showToast({ title: '已有火场情况无法修改地址', icon: 'none' })
        return
      }
      
      uni.navigateTo({
        url: '/pages/data/addressSelector/index?mode=select',
        success: (res) => {
          res.eventChannel.on('addressSelected', (data) => {
            this.selectedAddress = data
            this.formData.addressId = data.addressId
            this.formData.addressName = data.addressName
            this.formData.locationType = data.locationType
          })
        }
      })
    },
    // 显示救援单位选择器
    showUnitSelector() {
      if (!this.formData.addressId) {
        uni.showToast({ title: '请先选择救援地址', icon: 'none' })
        return
      }
      // 变更任务场景下允许添加新单位（用于添加救援单位）
      this.tempSelectedUnits = [...this.selectedUnits]
      this.showUnitDrawer = true
    },
    hideUnitSelector() {
      this.showUnitDrawer = false
    },
    // 选择救援单位
    onPickUnit(unit) {
      if (this.isAlreadyAssigned(unit)) return
      // 检查是否可以选择（如果所有车辆都在使用，则不能选择）
      if (!unit.canSelect) return
      const index = this.tempSelectedUnits.findIndex(item => item.value === unit.value)
      if (index > -1) {
        this.tempSelectedUnits.splice(index, 1)
      } else {
        // 变更任务场景下，新添加的单位默认为救援单位（可编辑）
        // 非变更任务场景下，如果有situationId则默认为支援单位，否则为救援单位
        const defaultUnitStatus = this.isChangeTask ? 'rescue' : (this.situationId ? 'support' : 'rescue')
        this.tempSelectedUnits.push({
          ...unit,
          selectedCars: [],
          unitStatus: defaultUnitStatus,
          rescueTime: new Date().toISOString() // 救援时间设为当前时间
        })
      }
    },
    // 打开车辆抽屉
    showCarDrawer(unit, index) {
      // 如果是变更任务场景且是支援单位，不允许修改
      if (this.isChangeTask && unit.unitStatus === 'support') {
        uni.showToast({ title: '变更任务场景下无法修改支援单位的车辆', icon: 'none' })
        return
      }
      
      this.currentUnitIndex = index
      
      // 如果是变更任务场景，加载当前单位已有的参战车辆
      if (this.isChangeTask && this.selectedUnits[index] && this.selectedUnits[index].selectedCars) {
        // 直接使用当前单位已选择的车辆作为临时选择
        this.tempSelectedCars = this.selectedUnits[index].selectedCars.map(car => ({ ...car }))
      } else {
        // 非变更任务场景，初始化为空数组
        this.tempSelectedCars = []
      }
      
      // 先获取可用车辆列表
      const availableCars = this.getAvailableCarsForUnit()
      
      // 如果没有可用车辆，提示并返回
      if (availableCars.length === 0) {
        uni.showToast({ title: '当前参战车辆已经全部选择完毕', icon: 'none' })
        return
      }
      
      this.carDrawerVisible = true
    },
    hideCarDrawer() {
      this.carDrawerVisible = false
    },
    toggleCarInDrawer(car) {
      // 如果车辆正在使用，不允许选择
      if (this.isCarRescuing(car)) {
        uni.showToast({ title: '该车辆正在使用中', icon: 'none' })
        return
      }
      
      // 车辆未被占用，可以选择（显示"空闲中"）
      const i = this.tempSelectedCars.findIndex(c => c.value === car.value)
      if (i > -1) {
        // 取消选择
        this.tempSelectedCars.splice(i, 1)
      } else {
        // 选择车辆
        this.tempSelectedCars.push(car)
      }
    },
    isCarTempSelected(car) {
      return this.tempSelectedCars.some(c => c.value === car.value)
    },
    getCarStatusText(car) {
      // 如果车辆正在使用，显示"救援中"；否则显示"空闲中"（可以选择）
      return this.isCarRescuing(car) ? '救援中' : '空闲中'
    },
    // 获取当前单位的可用车辆列表
    getAvailableCarsForUnit() {
      if (this.currentUnitIndex === -1) return []
      
      const currentUnit = this.selectedUnits[this.currentUnitIndex]
      if (!currentUnit || !currentUnit.value) return []
      
      // 获取该单位的所有车辆（从fireCarOptions中筛选，根据unitId等字段匹配）
      const unitValue = String(currentUnit.value || '')
      const unitId = String(currentUnit.id || '')
      const unitCode = String(currentUnit.code || '')
      
      // 从fireCarOptions中筛选出属于该单位的所有车辆
      const unitCars = this.fireCarOptions.filter(car => {
        const carUnitId = String(car.unitId || '')
        const carUnitCode = String(car.unitCode || '')
        return carUnitId === unitValue || 
               carUnitId === unitId || 
               carUnitCode === unitCode ||
               (car.unit && (String(car.unit.value || '') === unitValue || String(car.unit.id || '') === unitId))
      })
      
      // 获取unitCarMap中该单位已使用的车辆ID（unitCarMap表示当前单位已使用的车辆）
      const usedCarIds = this.unitCarMap[currentUnit.value] || []
      const usedCarIdsStr = usedCarIds.map(id => String(id))
      
      // 如果是变更任务场景，返回：已选中的车辆 + 剩余可用车辆
      if (this.isChangeTask) {
        // 1. 获取当前单位已选中的车辆ID
        const selectedCarIds = new Set()
        if (currentUnit.selectedCars && currentUnit.selectedCars.length > 0) {
          currentUnit.selectedCars.forEach(car => {
            if (car.value) {
              selectedCarIds.add(String(car.value))
            }
          })
        }
        
        // 2. 从initData中获取初始数据中该单位的车辆（用于对比）
        const initCarIds = new Set() // 初始数据中该单位的车辆ID
        if (this.initData && this.initData.assignedUnits) {
          const initUnit = this.initData.assignedUnits.find(unit => String(unit.unitId) === String(currentUnit.value))
          if (initUnit && initUnit.carInfo && Array.isArray(initUnit.carInfo)) {
            initUnit.carInfo.forEach(car => {
              if (car.carId) {
                initCarIds.add(String(car.carId))
                // 如果初始数据中有该车辆，也加入已选中列表（用于对比）
                selectedCarIds.add(String(car.carId))
              }
            })
          }
        }
        
        // 3. 从unitCarMap中获取当前单位已使用的车辆ID（用于过滤剩余可用车辆）
        const occupiedCarIds = new Set() // 被占用的车辆ID（从unitCarMap获取）
        
        // 从unitCarMap中获取当前单位已使用的车辆ID
        const usedCarIds = this.unitCarMap[currentUnit.value] || []
        usedCarIds.forEach(usedCarId => {
          const usedCarIdStr = String(usedCarId)
          // 检查该车辆是否属于当前单位的所有车辆
          const isUnitCar = unitCars.some(car => {
            const carId = String(car.value || car.id || car.carId || '')
            return carId === usedCarIdStr
          })
          if (isUnitCar) {
            occupiedCarIds.add(usedCarIdStr)
          }
        })
        
        // 4. 合并：初始数据中的车辆 + 当前选中的车辆 + 剩余可用车辆 
        const result = []
        
        // 先添加初始数据中的车辆（默认勾选）
        if (this.initData && this.initData.assignedUnits) {
          const initUnit = this.initData.assignedUnits.find(unit => String(unit.unitId) === String(currentUnit.value))
          if (initUnit && initUnit.carInfo && Array.isArray(initUnit.carInfo)) {
            initUnit.carInfo.forEach(carInfo => {
              const carId = String(carInfo.carId)
              // 从unitCars中找到对应的车辆对象
              const car = unitCars.find(c => String(c.value || c.id || c.carId || '') === carId)
              if (car) {
                result.push({ ...car })
              }
            })
          }
        }
        
        // 再添加当前表单中已选中的车辆（排除已在初始数据中的车辆，避免重复）
        if (currentUnit.selectedCars && currentUnit.selectedCars.length > 0) {
          currentUnit.selectedCars.forEach(car => {
            const carId = String(car.value || car.id || car.carId || '')
            // 如果不在初始数据中，才添加（避免重复）
            if (!initCarIds.has(carId)) {
              result.push({ ...car })
            }
          })
        }
        
        // 再添加剩余可用车辆（排除已选中的车辆和被占用的车辆）
        unitCars.forEach(car => {
          const carId = String(car.value || car.id || car.carId || '')
          if (!selectedCarIds.has(carId) && !occupiedCarIds.has(carId)) {
            result.push(car)
          }
        })
      
        return result
      }
      
      // 非变更任务场景，返回不属于该单位的车辆（保持原有逻辑）
      const unitCarIdsStr = usedCarIdsStr
      return this.fireCarOptions.filter(car => {
        const carId = String(car.value || car.id || car.carId || '')
        return !(carId && unitCarIdsStr.includes(carId))
      })
    },
    // 检查车辆是否正在救援（只检查当前单位的车辆占用情况）
    isCarRescuing(car) {
      if (!car || !car.value) return false
      
      // 确保只检查属于当前单位的车辆
      if (this.currentUnitIndex === -1) return false
      
      const currentUnit = this.selectedUnits[this.currentUnitIndex]
      if (!currentUnit || !currentUnit.value) return false
      
      // 验证车辆是否属于当前单位（从fireCarOptions中筛选）
      const unitValue = String(currentUnit.value || '')
      const unitId = String(currentUnit.id || '')
      const unitCode = String(currentUnit.code || '')
      const carId = String(car.value)
      
      // 检查车辆是否属于当前单位
      const isUnitCar = this.fireCarOptions.some(fireCar => {
        const fireCarId = String(fireCar.value || fireCar.id || fireCar.carId || '')
        if (fireCarId !== carId) return false
        
        const carUnitId = String(fireCar.unitId || '')
        const carUnitCode = String(fireCar.unitCode || '')
        return carUnitId === unitValue || 
               carUnitId === unitId || 
               carUnitCode === unitCode ||
               (fireCar.unit && (String(fireCar.unit.value || '') === unitValue || String(fireCar.unit.id || '') === unitId))
      })
      
      // 如果车辆不属于当前单位，返回false（不应该出现在列表中）
      if (!isUnitCar) return false
      
      // 如果是变更任务场景，检查车辆是否被占用但不在已选中列表中
      if (this.isChangeTask) {
        // 从unitCarMap中检查当前单位是否已使用该车辆
        const usedCarIds = this.unitCarMap[currentUnit.value] || []
        const usedCarIdsStr = usedCarIds.map(id => String(id))
        const isInUnitCarMap = usedCarIdsStr.includes(carId)
        
        // 如果被占用，检查是否在已选中列表中
        if (isInUnitCarMap) {
          const selectedCarIds = new Set()
          
          // 检查当前表单中已选中的车辆
          if (currentUnit.selectedCars && currentUnit.selectedCars.length > 0) {
            currentUnit.selectedCars.forEach(selectedCar => {
              if (selectedCar.value) {
                selectedCarIds.add(String(selectedCar.value))
              }
            })
          }
          
          // 检查初始数据中是否已选择当前车辆（变更任务场景下的对比）
          if (this.isChangeTask && this.initData && this.initData.assignedUnits) {
            const initUnit = this.initData.assignedUnits.find(unit => String(unit.unitId) === String(currentUnit.value))
            if (initUnit && initUnit.carInfo && Array.isArray(initUnit.carInfo)) {
              const isInInitData = initUnit.carInfo.some(car => String(car.carId) === carId)
              if (isInInitData) {
                selectedCarIds.add(carId)
              }
            }
          }
          
          // 如果被占用但不在已选中列表中，返回true（不可选）
          if (!selectedCarIds.has(carId)) {
            return true
          }
        }
        // 变更任务场景下，已选中的车辆即使被占用也可以选择（因为已经在当前火场情况中）
        return false
      }
      
      // 非变更任务场景，从unitCarMap中检查当前单位是否已使用该车辆
      const usedCarIds = this.unitCarMap[currentUnit.value] || []
      const usedCarIdsStr = usedCarIds.map(id => String(id))
      const isInUnitCarMap = usedCarIdsStr.includes(carId)
      return isInUnitCarMap
    },
    confirmCarDrawer() {
      const list = [...this.tempSelectedCars]
      if (this.currentUnitIndex > -1 && this.selectedUnits[this.currentUnitIndex]) {
        const unit = this.selectedUnits[this.currentUnitIndex]
        this.$set(unit, 'selectedCars', list)
        
        // 初始化任务组列表
        if (!unit.taskGroups) {
          this.$set(unit, 'taskGroups', [])
        }
        
        // 如果任务组存在，同步更新任务组的参战车辆
        if (unit.taskGroups && unit.taskGroups.length > 0) {
          // 获取新的参战车辆ID集合
          const newSelectedCarIds = new Set(list.map(car => String(car.value)))
          
          // 遍历所有任务组，更新车辆列表
          unit.taskGroups.forEach(taskGroup => {
            if (taskGroup.cars && taskGroup.cars.length > 0) {
              // 过滤出仍然在新的参战车辆列表中的车辆
              const validCars = taskGroup.cars.filter(car => {
                const carId = String(car.value || car.id || car.carId || '')
                return newSelectedCarIds.has(carId)
              })
              
              // 更新任务组的车辆列表
              this.$set(taskGroup, 'cars', validCars)
              
              // 如果是供水任务，也需要更新目标车辆
              if (this.isWaterTask(taskGroup) && taskGroup.targetCars && taskGroup.targetCars.length > 0) {
                const validTargetCars = taskGroup.targetCars.filter(car => {
                  const carId = String(car.value || car.id || car.carId || '')
                  return newSelectedCarIds.has(carId)
                })
                this.$set(taskGroup, 'targetCars', validTargetCars)
              }
            }
          })
        } else {
          // 如果没有任务组，自动创建一个任务组（非变更任务场景）
          if (!this.isChangeTask && list.length > 0) {
            // 如果只有一辆车，默认添加到任务组1
            const defaultCars = list.length === 1 ? [list[0]] : []
            const newTaskGroup = this.createDefaultTaskGroup(defaultCars)
            unit.taskGroups.push(newTaskGroup)
          }
        }
      }
      // 同步更新表单数据
      this.updateFormData()
      // 更新单位状态（因为已选择的车辆会影响其他单位的状态）
      this.updateUnitStatus()
      this.carDrawerVisible = false
    },
    getCarNames(unit) {
      if (!unit || !unit.selectedCars || unit.selectedCars.length === 0) return ''
      return unit.selectedCars.map(c => c.label).join('、')
    },
    // 任务组相关方法
    showTaskGroupCarDrawer(unit, unitIndex, taskGroupIndex) {
      // 如果是变更任务场景且是支援单位，不允许修改
      if (this.isChangeTask && unit.unitStatus === 'support') {
        uni.showToast({ title: '变更任务场景下无法修改支援单位的任务组', icon: 'none' })
        return
      }
      
      this.currentTaskGroupUnitIndex = unitIndex
      this.currentTaskGroupIndex = taskGroupIndex !== undefined ? taskGroupIndex : -1
      // 如果是编辑现有任务组，初始化已选择的车辆
      if (this.currentTaskGroupIndex >= 0 && unit.taskGroups && unit.taskGroups[this.currentTaskGroupIndex]) {
        this.tempTaskGroupCars = [...(unit.taskGroups[this.currentTaskGroupIndex].cars || [])]
      } else {
        this.tempTaskGroupCars = []
      }
      this.taskGroupCarDrawerVisible = true
    },
    hideTaskGroupCarDrawer() {
      this.taskGroupCarDrawerVisible = false
      this.currentTaskGroupIndex = -1
    },
    toggleTaskGroupCar(car) {
      // 检查车辆是否已被使用
      if (this.currentTaskGroupUnitIndex === -1) return
      const unit = this.selectedUnits[this.currentTaskGroupUnitIndex]
      
      // 如果是编辑模式，排除当前任务组
      if (this.currentTaskGroupIndex >= 0) {
        // 检查车辆是否在其他任务组中使用（排除当前任务组）
        const otherTaskGroups = (unit.taskGroups || []).filter((tg, idx) => idx !== this.currentTaskGroupIndex)
        const usedInOthers = otherTaskGroups.some(tg => 
          tg.cars && tg.cars.some(c => c.value === car.value)
        )
        if (usedInOthers) {
          uni.showToast({ title: '该车辆已在其他任务组中使用', icon: 'none' })
          return
        }
      } else {
        // 新建模式，检查所有任务组
        if (this.isCarUsedInTaskGroup(unit, car)) {
          uni.showToast({ title: '该车辆已在其他任务组中使用', icon: 'none' })
          return
        }
      }
      
      const i = this.tempTaskGroupCars.findIndex(c => c.value === car.value)
      if (i > -1) {
        this.tempTaskGroupCars.splice(i, 1)
      } else {
        this.tempTaskGroupCars.push({ ...car })
      }
    },
    isTaskGroupCarSelected(car) {
      return this.tempTaskGroupCars.some(c => c.value === car.value)
    },
    confirmTaskGroupCars() {
      if (this.currentTaskGroupUnitIndex === -1) {
        this.hideTaskGroupCarDrawer()
        return
      }
      
      if (this.tempTaskGroupCars.length === 0) {
        uni.showToast({ title: '请至少选择一辆车', icon: 'none' })
        return
      }
      
      const unit = this.selectedUnits[this.currentTaskGroupUnitIndex]
      if (!unit.taskGroups) {
        this.$set(unit, 'taskGroups', [])
      }
      
      // 如果是编辑现有任务组
      if (this.currentTaskGroupIndex >= 0 && unit.taskGroups[this.currentTaskGroupIndex]) {
        // 更新现有任务组的车辆
        this.$set(unit.taskGroups[this.currentTaskGroupIndex], 'cars', [...this.tempTaskGroupCars])
        const taskGroup = unit.taskGroups[this.currentTaskGroupIndex]
        // 排烟任务不需要目标车辆，确保为空数组
        if (this.isSmokeTask(taskGroup)) {
          this.$set(taskGroup, 'targetCars', [])
        }
        // 供水任务的目标中队和目标车辆需要用户手动选择（从空闲状态的中队和车辆中选择）
      } else {
        // 创建新的任务组（默认任务类型为灭火）
        const newTaskGroup = this.createDefaultTaskGroup([...this.tempTaskGroupCars])
        unit.taskGroups.push(newTaskGroup)
        // 注意：新创建的任务组默认是灭火任务，如果后续切换为供水任务，会在 onTaskTypeChange 中处理目标中队的自动选择
      }
      
      this.updateFormData()
      this.hideTaskGroupCarDrawer()
      this.$forceUpdate()
    },
    async removeTaskGroup(unit, taskGroupIndex, unitIndex) {
      // 确认删除
      const unitName = unit?.label || '该单位'
      const taskGroupNum = taskGroupIndex + 1
      const confirmResult = await new Promise((resolve) => {
        uni.showModal({
          title: '确认删除',
          content: `确定要删除${unitName}的任务组${taskGroupNum}吗？`,
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })
      
      if (!confirmResult) return
      
      if (unit.taskGroups && unit.taskGroups.length > taskGroupIndex) {
        // 获取要删除的任务组使用的车辆ID
        const deletedCarIds = (unit.taskGroups[taskGroupIndex].cars || []).map(car => car.value)
        
        // 删除任务组
        unit.taskGroups.splice(taskGroupIndex, 1)
        
        // 获取剩余任务组使用的所有车辆ID
        const remainingUsedCarIds = this.getUsedCarIds(unit)
        
        // 从参战车辆中移除被删除任务组使用的车辆（如果这些车辆不在其他任务组中使用）
        if (unit.selectedCars && unit.selectedCars.length > 0) {
          unit.selectedCars = unit.selectedCars.filter(car => {
            // 如果车辆在被删除的任务组中使用
            if (deletedCarIds.includes(car.value)) {
              // 检查是否在其他任务组中使用，如果不在，则移除
              return remainingUsedCarIds.includes(car.value)
            }
            // 如果车辆不在被删除的任务组中，保留
            return true
          })
        }
        
        this.updateFormData()
        this.$forceUpdate()
      }
    },
    getTaskGroupCarsText(taskGroup) {
      if (!taskGroup || !taskGroup.cars || taskGroup.cars.length === 0) return ''
      return taskGroup.cars.map(c => c.label).join('、')
    },
    // 获取已在任务组中的车辆ID列表
    getUsedCarIds(unit) {
      if (!unit || !unit.taskGroups) return []
      const usedIds = []
      unit.taskGroups.forEach(taskGroup => {
        if (taskGroup.cars && taskGroup.cars.length > 0) {
          taskGroup.cars.forEach(car => {
            if (car.value && !usedIds.includes(car.value)) {
              usedIds.push(car.value)
            }
          })
        }
      })
      return usedIds
    },
    // 检查车辆是否已被使用
    isCarUsedInTaskGroup(unit, car) {
      // 如果是编辑模式，排除当前任务组
      if (this.currentTaskGroupIndex >= 0 && unit && unit.taskGroups) {
        const otherTaskGroups = unit.taskGroups.filter((tg, idx) => idx !== this.currentTaskGroupIndex)
        return otherTaskGroups.some(tg => 
          tg.cars && tg.cars.some(c => c.value === car.value)
        )
      }
      // 新建模式，检查所有任务组
      const usedIds = this.getUsedCarIds(unit)
      return usedIds.includes(car.value)
    },
    // 检查是否有可用车辆
    hasAvailableCars(unit) {
      if (!unit || !unit.selectedCars || unit.selectedCars.length === 0) return false
      const usedIds = this.getUsedCarIds(unit)
      return unit.selectedCars.some(car => !usedIds.includes(car.value))
    },
    getCurrentUnitForTaskGroup() {
      if (this.currentTaskGroupUnitIndex === -1) return null
      return this.selectedUnits[this.currentTaskGroupUnitIndex]
    },
    getAvailableCarsForTaskGroup() {
      if (this.currentTaskGroupUnitIndex === -1) return []
      const unit = this.selectedUnits[this.currentTaskGroupUnitIndex]
      if (!unit || !unit.selectedCars) return []
      // 返回所有车辆，但标记哪些已被使用（编辑模式下排除当前任务组）
      return unit.selectedCars
    },
    // 创建默认任务组（默认任务类型为灭火）
    createDefaultTaskGroup(cars = []) {
      // 查找灭火任务类型的索引
      let fireTaskTypeIndex = 0
      const fireTaskType = this.taskTypeOptions.find((opt, idx) => {
        const label = opt.label || ''
        if (label.includes('灭火') || opt.value === '1' || opt.value === 'fire') {
          fireTaskTypeIndex = idx
          return true
        }
        return false
      })
      
      const taskGroup = {
        cars: cars,
        floor: '',
        direction: 1, // 默认正东
        directionIndex: 0, // 正东是第一个选项
        description: '',
        taskType: fireTaskType ? fireTaskType.value : (this.taskTypeOptions[0]?.value || ''),
        taskTypeIndex: fireTaskTypeIndex,
        taskConfig: fireTaskType ? fireTaskType.config : null,
        taskExtra: {},
        dynamicSelectIndex: 0
      }
      
      return taskGroup
    },
    // 添加新任务组
    addNewTaskGroup(unit, unitIndex) {
      // 如果是变更任务场景且是支援单位，不允许添加
      if (this.isChangeTask && unit.unitStatus === 'support') {
        uni.showToast({ title: '变更任务场景下无法为支援单位添加任务组', icon: 'none' })
        return
      }
      
      // 检查是否有可用车辆
      if (!this.hasAvailableCars(unit)) {
        uni.showToast({ title: '所有车辆已分配到任务组', icon: 'none' })
        return
      }
      
      if (!unit.taskGroups) {
        this.$set(unit, 'taskGroups', [])
      }
      
      // 创建新的空任务组（默认任务类型为灭火）
      const newTaskGroup = this.createDefaultTaskGroup([])
      
      unit.taskGroups.push(newTaskGroup)
      this.updateFormData()
      this.$forceUpdate()
    },
    isUnitSelected(unit) {
      return this.tempSelectedUnits.some(item => item.value === unit.value)
    },
    isAlreadyAssigned(unit) {
      return this.selectedUnits.some(item => item.value === unit.value)
    },
    // 抽屉内单位状态文案：若已参战（禁用），固定显示"正在使用"，否则按原状态显示
    getDrawerUnitStatusText(unit) {
      if (this.isAlreadyAssigned(unit)) {
        return '正在使用'
      }
      // 使用更新后的状态文本
      return unit.statusText || '空闲中'
    },
    confirmUnits() {
      this.selectedUnits = [...this.tempSelectedUnits]
      this.updateFormData()
      // 更新单位状态（因为已选择的单位会影响其他单位的状态）
      this.updateUnitStatus()
      
      // 如果只有一个参战单位，自动为所有供水任务设置目标中队
      if (this.assignedUnitOptions.length === 1) {
        this.$nextTick(() => {
          const targetUnit = this.assignedUnitOptions[0]
          this.selectedUnits.forEach(unit => {
            if (unit.taskGroups && unit.taskGroups.length > 0) {
              unit.taskGroups.forEach(taskGroup => {
                if (this.isWaterTask(taskGroup) && taskGroup.taskConfig && taskGroup.taskConfig.actionKey) {
                  // 如果目标中队未设置，自动设置为唯一的参战单位
                  if (!taskGroup.taskExtra || !taskGroup.taskExtra[taskGroup.taskConfig.actionKey]) {
                    if (!taskGroup.taskExtra) {
                      this.$set(taskGroup, 'taskExtra', {})
                    }
                    this.$set(taskGroup, 'dynamicSelectIndex', 0)
                    this.$set(taskGroup.taskExtra, taskGroup.taskConfig.actionKey, String(targetUnit.value))
                  }
                }
              })
            }
          })
          this.updateFormData()
          this.$forceUpdate()
        })
      }
      
      this.hideUnitSelector()
    },
    // 方向选择
    onDirectionChange(e, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        const value = e.detail ? e.detail.value : e.value
        taskGroup.directionIndex = Number(value)
        
        // 使用 $set 确保响应式更新
        this.$set(taskGroup, 'direction', this.directionOptions[taskGroup.directionIndex]?.value || '')
        
        // 更新表单数据
        this.updateFormData()
        // 强制更新视图
        this.$forceUpdate()
      } catch (error) {
        console.error('onDirectionChange error:', error)
      }
    },
    // 层数输入处理（0-99）
    onFloorInput(taskGroup, e) {
      // 如果是变更任务场景，检查当前单位是否是支援单位
      if (this.isChangeTask) {
        const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
        if (unit && unit.unitStatus === 'support') {
          uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
          return
        }
      }
      
      let val = String(e.detail.value || '').replace(/\D/g, '')
      if (val === '') { 
        this.$set(taskGroup, 'floor', '')
        this.updateFormData()
        return 
      }
      let num = parseInt(val, 10)
      if (isNaN(num) || num < 0) num = 0
      if (num > 99) num = 99
      this.$set(taskGroup, 'floor', String(num))
      // 更新表单数据
      this.updateFormData()
    },
    getDirectionText(taskGroup) {
      return (this.directionOptions[taskGroup.directionIndex] && this.directionOptions[taskGroup.directionIndex].label) || '正东'
    },
    // 获取方位标签（根据任务类型）
    getDirectionLabel(taskGroup) {
      if (this.isFireTask(taskGroup)) {
        return '灭火方位'
      } else if (this.isBlockTask(taskGroup)) {
        return '堵截方位'
      } else if (this.isSearchTask(taskGroup)) {
        return '搜救方位'
      } else if (this.isSmokeTask(taskGroup)) {
        return '排烟方位'
      }
      return '方位'
    },
    // 判断是否需要显示层数字段
    shouldShowFloor(taskGroup) {
      return this.isFireOrBlockTask(taskGroup) || this.isSearchTask(taskGroup) || this.isSmokeTask(taskGroup)
    },
    // 判断是否需要显示方位字段
    shouldShowDirection(taskGroup) {
      return this.isFireOrBlockTask(taskGroup) || this.isSearchTask(taskGroup) || this.isSmokeTask(taskGroup)
    },
    // 判断是否需要显示描述字段
    shouldShowDescription(taskGroup) {
      return this.isFireOrBlockTask(taskGroup) || this.isSearchTask(taskGroup) || this.isSmokeTask(taskGroup) || this.isWaterTask(taskGroup)
    },
    // 判断是否是灭火或堵截任务
    isFireOrBlockTask(taskGroup) {
      if (!taskGroup || !taskGroup.taskType) return false
      // 根据任务类型值判断，需要查看实际的任务类型值
      const taskTypeValue = String(taskGroup.taskType)
      // 假设灭火是1，堵截是2，需要根据实际情况调整
      return taskTypeValue === '1' || taskTypeValue === '2' || 
             taskGroup.taskType === 'fire' || taskGroup.taskType === 'block' ||
             (this.taskTypeOptions[taskGroup.taskTypeIndex] && 
              (this.taskTypeOptions[taskGroup.taskTypeIndex].label === '灭火' || 
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '堵截' ||
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '灭火救援' ||
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '堵截救援'))
    },
    // 任务类型选择
    onTaskTypeChange(e, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        const value = e.detail ? e.detail.value : e.value
        taskGroup.taskTypeIndex = Number(value)
        const picked = this.taskTypeOptions[taskGroup.taskTypeIndex] || {}
        
        // 使用 $set 确保响应式更新
        this.$set(taskGroup, 'taskType', picked.value || '')
        this.$set(taskGroup, 'taskConfig', picked.config || null)
        this.$set(taskGroup, 'taskExtra', {})
        this.$set(taskGroup, 'dynamicSelectIndex', 0)
        
        // 更新表单数据
        this.updateFormData()
        
        // 如果是灭火或堵截任务，初始化特殊字段
        if (this.isFireOrBlockTask(taskGroup)) {
          // 初始化层数（空）
          if (!taskGroup.floor) {
            this.$set(taskGroup, 'floor', '')
          }
          // 初始化方位（默认正东，value为1）
          if (!taskGroup.direction) {
            this.$set(taskGroup, 'direction', 1)
            this.$set(taskGroup, 'directionIndex', 0) // 正东是第一个选项
          }
          // 初始化描述（空）
          if (!taskGroup.description) {
            this.$set(taskGroup, 'description', '')
          }
          // 清除搜救相关字段
          this.$set(taskGroup, 'searchPower', '')
          this.$set(taskGroup, 'searchResult', '')
        } else if (this.isSearchTask(taskGroup)) {
          // 如果是搜救任务，初始化特殊字段
          // 初始化搜救力量（空）
          if (!taskGroup.searchPower) {
            this.$set(taskGroup, 'searchPower', '')
          }
          // 初始化搜救结果（空）
          if (!taskGroup.searchResult) {
            this.$set(taskGroup, 'searchResult', '')
          }
          // 初始化层数（空）
          if (!taskGroup.floor) {
            this.$set(taskGroup, 'floor', '')
          }
          // 初始化方位（默认正东，value为1）
          if (!taskGroup.direction) {
            this.$set(taskGroup, 'direction', 1)
            this.$set(taskGroup, 'directionIndex', 0) // 正东是第一个选项
          }
          // 初始化描述（空）
          if (!taskGroup.description) {
            this.$set(taskGroup, 'description', '')
          }
          // 清除排烟相关字段
          this.$set(taskGroup, 'smokePower', '')
        } else if (this.isSmokeTask(taskGroup)) {
          // 如果是排烟任务，初始化特殊字段
          // 初始化排烟力量（空）
          if (!taskGroup.smokePower) {
            this.$set(taskGroup, 'smokePower', '')
          }
          // 排烟任务不需要目标车辆，强制清除为空数组
          this.$set(taskGroup, 'targetCars', [])
          // 初始化层数（空）
          if (!taskGroup.floor) {
            this.$set(taskGroup, 'floor', '')
          }
          // 初始化方位（默认正东，value为1）
          if (!taskGroup.direction) {
            this.$set(taskGroup, 'direction', 1)
            this.$set(taskGroup, 'directionIndex', 0) // 正东是第一个选项
          }
          // 初始化描述（空）
          if (!taskGroup.description) {
            this.$set(taskGroup, 'description', '')
          }
          // 清除搜救相关字段
          this.$set(taskGroup, 'searchPower', '')
          this.$set(taskGroup, 'searchResult', '')
        } else if (this.isWaterTask(taskGroup)) {
          // 如果是供水任务，初始化特殊字段
          // 初始化目标车辆（空数组，用户需要手动选择空闲车辆）
          if (!taskGroup.targetCars) {
            this.$set(taskGroup, 'targetCars', [])
          }
          // 初始化目标中队（空数组，用户需要手动选择空闲中队）
          if (!taskGroup.targetUnits) {
            this.$set(taskGroup, 'targetUnits', [])
          }
          // 初始化描述（空）
          if (!taskGroup.description) {
            this.$set(taskGroup, 'description', '')
          }
        } else {
          // 如果不是灭火/堵截/搜救/排烟/供水，清除这些字段
          this.$set(taskGroup, 'floor', '')
          this.$set(taskGroup, 'direction', '')
          this.$set(taskGroup, 'directionIndex', 0)
          this.$set(taskGroup, 'description', '')
          this.$set(taskGroup, 'searchPower', '')
          this.$set(taskGroup, 'searchResult', '')
          this.$set(taskGroup, 'smokePower', '')
          this.$set(taskGroup, 'targetCars', [])
        }
        
        // 如果 taskConfig 存在且有 actionKey，初始化 taskExtra（非供水任务）
        if (taskGroup.taskConfig && taskGroup.taskConfig.actionKey && !this.isWaterTask(taskGroup)) {
          // 其他情况初始化为空
          this.$set(taskGroup.taskExtra, taskGroup.taskConfig.actionKey, '')
        }
        
        // 强制更新视图
        this.$forceUpdate()
      } catch (error) {
        console.error('onTaskTypeChange error:', error)
      }
    },
    getTaskTypeText(unit) {
      return (this.taskTypeOptions[unit.taskTypeIndex] && this.taskTypeOptions[unit.taskTypeIndex].label) || '请选择任务类型'
    },
    getTaskContentTitle(taskGroup) {
      if (!taskGroup || !taskGroup.taskType) return '任务内容'
      
      // 判断是否是灭火任务
      if (this.isFireTask(taskGroup)) {
        return '灭火力量'
      }
      // 判断是否是堵截任务
      if (this.isBlockTask(taskGroup)) {
        return '堵截力量'
      }
      // 判断是否是供水任务
      if (this.isWaterTask(taskGroup)) {
        return '目标中队'
      }
      
      const map = this.taskTypeOptions.find(it => it.value === taskGroup.taskType)
      return map ? map.label : '任务内容'
    },
    // 判断是否是灭火任务
    isFireTask(taskGroup) {
      if (!taskGroup || !taskGroup.taskType) return false
      const taskTypeValue = String(taskGroup.taskType)
      return taskTypeValue === '1' || 
             taskGroup.taskType === 'fire' ||
             (this.taskTypeOptions[taskGroup.taskTypeIndex] && 
              (this.taskTypeOptions[taskGroup.taskTypeIndex].label === '灭火' || 
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '灭火救援'))
    },
    // 判断是否是堵截任务
    isBlockTask(taskGroup) {
      if (!taskGroup || !taskGroup.taskType) return false
      const taskTypeValue = String(taskGroup.taskType)
      return taskTypeValue === '2' || 
             taskGroup.taskType === 'block' ||
             (this.taskTypeOptions[taskGroup.taskTypeIndex] && 
              (this.taskTypeOptions[taskGroup.taskTypeIndex].label === '堵截' || 
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '堵截救援'))
    },
    // 判断是否是搜救任务
    isSearchTask(taskGroup) {
      if (!taskGroup || !taskGroup.taskType) return false
      const taskTypeValue = String(taskGroup.taskType)
      return taskTypeValue === '3' || 
             taskGroup.taskType === 'search' ||
             (this.taskTypeOptions[taskGroup.taskTypeIndex] && 
              (this.taskTypeOptions[taskGroup.taskTypeIndex].label === '搜救' || 
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '人员搜救' ||
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '搜救救援'))
    },
    // 判断是否是排烟任务
    isSmokeTask(taskGroup) {
      if (!taskGroup || !taskGroup.taskType) return false
      const taskTypeValue = String(taskGroup.taskType)
      return taskTypeValue === '4' || 
             taskGroup.taskType === 'smoke' ||
             (this.taskTypeOptions[taskGroup.taskTypeIndex] && 
              (this.taskTypeOptions[taskGroup.taskTypeIndex].label === '排烟' || 
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '排烟救援'))
    },
    // 判断是否是供水任务
    isWaterTask(taskGroup) {
      if (!taskGroup || !taskGroup.taskType) return false
      const taskTypeValue = String(taskGroup.taskType)
      return taskTypeValue === '5' || 
             taskGroup.taskType === 'water' || taskGroup.taskType === 'supply' ||
             (this.taskTypeOptions[taskGroup.taskTypeIndex] && 
              (this.taskTypeOptions[taskGroup.taskTypeIndex].label === '供水' || 
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '火场供水' ||
               this.taskTypeOptions[taskGroup.taskTypeIndex].label === '供水救援'))
    },
    // 获取任务组的作战力量
    getTaskPower(taskGroup) {
      if (!taskGroup || !taskGroup.taskExtra) return ''
      
      const taskExtra = taskGroup.taskExtra || {}
      const taskType = String(taskGroup.taskType || '')
      
      // 根据任务类型获取作战力量
      if (taskType === '1' && taskExtra.firePower) {
        return taskExtra.firePower // 灭火力量
      }
      if (taskType === '2' && taskExtra.blockPower) {
        return taskExtra.blockPower // 堵截力量
      }
      
      return ''
    },
    // 获取任务组的作战力量标签（根据任务类型）
    getTaskPowerLabel(taskGroup) {
      if (!taskGroup) return '作战力量'
      
      const taskType = String(taskGroup.taskType || '')
      
      if (taskType === '1') return '灭火力量'
      if (taskType === '2') return '堵截力量'
      if (taskType === '3') return '搜救力量'
      if (taskType === '4') return '排烟力量'
      if (taskType === '5') return '目标中队'
      
      return '作战力量'
    },
    // 获取搜救力量
    getSearchPower(taskGroup) {
      if (!taskGroup) return ''
      // 优先从 taskGroup 顶层获取
      if (taskGroup.searchPower) return taskGroup.searchPower
      // 其次从 taskExtra 获取
      if (taskGroup.taskExtra && taskGroup.taskExtra.searchPower) {
        return taskGroup.taskExtra.searchPower
      }
      return ''
    },
    // 获取搜救结果
    getSearchResult(taskGroup) {
      if (!taskGroup) return ''
      // 优先从 taskGroup 顶层获取
      if (taskGroup.searchResult) return taskGroup.searchResult
      // 其次从 taskExtra 获取
      if (taskGroup.taskExtra && taskGroup.taskExtra.searchResult) {
        return taskGroup.taskExtra.searchResult
      }
      return ''
    },
    // 获取排烟力量
    getSmokePower(taskGroup) {
      if (!taskGroup) return ''
      // 优先从 taskGroup 顶层获取
      if (taskGroup.smokePower) return taskGroup.smokePower
      // 其次从 taskExtra 获取
      if (taskGroup.taskExtra && taskGroup.taskExtra.smokePower) {
        return taskGroup.taskExtra.smokePower
      }
      return ''
    },
    // 获取目标中队（供水任务）- 单选
    getTargetUnit(taskGroup) {
      if (!taskGroup) return ''
      const unitValue = this.getTargetUnitValue(taskGroup)
      if (!unitValue) return ''
      const targetUnit = this.fireUnitOptions.find(u => String(u.value) === unitValue)
      return targetUnit ? targetUnit.label : unitValue
    },
    // 获取目标车辆（供水任务）
    getTargetCars(taskGroup) {
      if (!taskGroup) return ''
      // 从 targetCars 数组获取
      if (taskGroup.targetCars && Array.isArray(taskGroup.targetCars) && taskGroup.targetCars.length > 0) {
        return taskGroup.targetCars.map(car => car.carName || car.name || car.label || '').filter(Boolean).join('、')
      }
      return ''
    },
    getDynamicSelectText(taskGroup) {
      if (!taskGroup) return '请选择目标中队'
      const idx = taskGroup.dynamicSelectIndex
      return (this.assignedUnitOptions[idx] && this.assignedUnitOptions[idx].label) || '请选择目标中队'
    },
    // 任务选项选择
    selectTaskOption(event, val, taskGroup) {
      try {
        // 阻止事件冒泡
        if (event && event.stopPropagation) {
          event.stopPropagation()
        }
        
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        if (!taskGroup || !taskGroup.taskConfig) return
        
        // 确保 taskExtra 对象存在
        if (!taskGroup.taskExtra) {
          this.$set(taskGroup, 'taskExtra', {})
        }
        
        // 确保 val 是基本类型，避免循环引用
        let safeVal = val
        if (typeof val === 'object' && val !== null) {
          // 如果是对象，转换为字符串或提取基本值
          safeVal = JSON.stringify(val)
        }
        
        this.$set(taskGroup.taskExtra, taskGroup.taskConfig.actionKey, safeVal)
        
        // 更新表单数据
        this.updateFormData()
        // 强制更新视图
        this.$forceUpdate()
      } catch (e) {
        console.error('selectTaskOption error:', e)
      }
    },
    // 选择搜救力量
    selectSearchPower(val, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        this.$set(taskGroup, 'searchPower', val)
        this.updateFormData()
        this.$forceUpdate()
      } catch (e) {
        console.error('selectSearchPower error:', e)
      }
    },
    // 选择搜救结果
    selectSearchResult(val, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        this.$set(taskGroup, 'searchResult', val)
        this.updateFormData()
        this.$forceUpdate()
      } catch (e) {
        console.error('selectSearchResult error:', e)
      }
    },
    // 选择排烟力量
    selectSmokePower(val, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        this.$set(taskGroup, 'smokePower', val)
        this.updateFormData()
        this.$forceUpdate()
      } catch (e) {
        console.error('selectSmokePower error:', e)
      }
    },
    // 获取空闲状态的中队列表
    getIdleUnitOptions() {
      // 返回所有空闲状态的中队（status === 'idle' 或 canSelect === true）
      return this.fireUnitOptions.filter(unit => {
        return unit.status === 'idle' || (unit.canSelect === true && unit.status !== 'rescuing_all')
      })
    },
    // 获取目标中队的值（单选）
    getTargetUnitValue(taskGroup) {
      if (!taskGroup) return ''
      // 优先从 taskExtra.targetUnit 获取（单选）
      const taskExtra = taskGroup.taskExtra || {}
      if (taskExtra.targetUnit) {
        return String(taskExtra.targetUnit)
      }
      // 兼容旧数据：从 supplyTarget 获取
      if (taskExtra.supplyTarget) {
        return String(taskExtra.supplyTarget)
      }
      // 兼容多选数据：从 targetUnits 数组获取第一个
      if (taskGroup.targetUnits && Array.isArray(taskGroup.targetUnits) && taskGroup.targetUnits.length > 0) {
        return String(taskGroup.targetUnits[0].value)
      }
      return ''
    },
    // 获取目标中队的显示文本
    getTargetUnitText(taskGroup) {
      const unitValue = this.getTargetUnitValue(taskGroup)
      if (!unitValue) return '请选择目标中队'
      const unit = this.fireUnitOptions.find(u => String(u.value) === unitValue)
      return unit ? unit.label : '请选择目标中队'
    },
    // 获取目标中队在选项中的索引
    getTargetUnitIndex(taskGroup) {
      const unitValue = this.getTargetUnitValue(taskGroup)
      if (!unitValue) return 0
      const idleUnits = this.getIdleUnitOptions()
      const index = idleUnits.findIndex(u => String(u.value) === unitValue)
      return index >= 0 ? index : 0
    },
    // 获取指定中队下的空闲车辆列表
    getIdleCarOptionsForUnit(taskGroup) {
      if (!taskGroup) return []
      
      const targetUnitValue = this.getTargetUnitValue(taskGroup)
      if (!targetUnitValue) return []
      
      // 从unitCarMap中获取目标中队的所有车辆ID（因为fireCarOptions是固定枚举值，需要通过unitCarMap来关联）
      const targetUnitCarIds = this.unitCarMap[targetUnitValue] || []
      const targetUnitCarIdsStr = targetUnitCarIds.map(id => String(id))
      
      // 如果unitCarMap中没有该中队的车辆，返回空数组
      if (targetUnitCarIdsStr.length === 0) {
        // 尝试从buildUnitCarMap的逻辑中获取（如果unitCarMap还未构建）
        // 这里直接返回空，因为如果unitCarMap没有数据，说明该中队没有车辆
        return []
      }
      
      // 从fireCarOptions中筛选出属于该中队的车辆（通过unitCarMap中的车辆ID匹配）
      const canSelectCars = this.fireCarOptions.filter(car => {
        const carId = String(car.value || car.id || car.carId || '')
        return !targetUnitCarIdsStr.includes(carId)
      })
      return canSelectCars
    },
    // 获取空闲状态的车辆列表
    getIdleCarOptions() {
      // 获取所有正在使用的车辆ID（从unitCarMap和当前表单中已选择的车辆）
      const usedCarIds = new Set()
      
      // 从unitCarMap中获取所有已使用的车辆
      Object.keys(this.unitCarMap || {}).forEach(unitId => {
        const carIds = this.unitCarMap[unitId] || []
        carIds.forEach(carId => {
          usedCarIds.add(String(carId))
        })
      })
      
      // 从当前表单中已选择的车辆获取
      this.selectedUnits.forEach(unit => {
        if (unit.selectedCars && unit.selectedCars.length > 0) {
          unit.selectedCars.forEach(car => {
            if (car.value) {
              usedCarIds.add(String(car.value))
            }
          })
        }
      })
      
      // 返回所有不在使用中的车辆（空闲状态）
      return this.fireCarOptions.filter(car => {
        const carId = String(car.value || car.id || car.carId || '')
        return !usedCarIds.has(carId)
      })
    },
    // 目标中队选择变化（下拉框）
    onTargetUnitChange(e, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        const value = e.detail ? e.detail.value : e.value
        const idleUnits = this.getIdleUnitOptions()
        const selectedUnit = idleUnits[Number(value)]
        
        if (!selectedUnit) return
        
        // 确保 taskExtra 对象存在
        if (!taskGroup.taskExtra) {
          this.$set(taskGroup, 'taskExtra', {})
        }
        
        // 更新目标中队（单选）
        this.$set(taskGroup.taskExtra, 'targetUnit', String(selectedUnit.value))
        
        // 清除之前选择的目标车辆（因为中队改变了）
        this.$set(taskGroup, 'targetCars', [])
        
        // 兼容旧数据：同时更新 targetUnits 数组（只保留一个）
        this.$set(taskGroup, 'targetUnits', [{ ...selectedUnit }])
        
        this.updateFormData()
        this.$forceUpdate()
      } catch (e) {
        console.error('onTargetUnitChange error:', e)
      }
    },
    // 判断目标车辆是否被选中
    isTargetCarSelected(car, taskGroup) {
      if (!taskGroup.targetCars || !Array.isArray(taskGroup.targetCars)) return false
      return taskGroup.targetCars.some(tc => String(tc.value) === String(car.value))
    },
    // 选择目标车辆
    selectTargetCar(car, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        if (!taskGroup.targetCars) {
          this.$set(taskGroup, 'targetCars', [])
        }
        const index = taskGroup.targetCars.findIndex(tc => tc.value === car.value)
        if (index > -1) {
          taskGroup.targetCars.splice(index, 1)
        } else {
          taskGroup.targetCars.push({ ...car })
        }
        this.updateFormData()
        this.$forceUpdate()
      } catch (e) {
        console.error('selectTargetCar error:', e)
      }
    },
    // 动态选择变化
    onDynamicSelectChange(e, taskGroup) {
      try {
        // 如果是变更任务场景，检查当前单位是否是支援单位
        if (this.isChangeTask) {
          const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
          if (unit && unit.unitStatus === 'support') {
            uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
            return
          }
        }
        
        const value = e.detail ? e.detail.value : e.value
        taskGroup.dynamicSelectIndex = Number(value)
        const picked = this.assignedUnitOptions[taskGroup.dynamicSelectIndex]
        
        if (taskGroup.taskConfig) {
          // 确保 taskExtra 对象存在
          if (!taskGroup.taskExtra) {
            this.$set(taskGroup, 'taskExtra', {})
          }
          
          // 确保值是基本类型，避免循环引用
          let safeValue = ''
          if (picked && picked.value) {
            if (typeof picked.value === 'object' && picked.value !== null) {
              safeValue = JSON.stringify(picked.value)
            } else {
              safeValue = String(picked.value)
            }
          }
          
          this.$set(taskGroup.taskExtra, taskGroup.taskConfig.actionKey, safeValue)
          
          // 更新表单数据
          this.updateFormData()
          // 强制更新视图
          this.$forceUpdate()
        }
      } catch (e) {
        console.error('onDynamicSelectChange error:', e)
      }
    },
    // 描述输入处理
    onDescriptionInput(taskGroup) {
      // 如果是变更任务场景，检查当前单位是否是支援单位
      if (this.isChangeTask) {
        const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
        if (unit && unit.unitStatus === 'support') {
          // 恢复原值，不允许修改
          this.$forceUpdate()
          return
        }
      }
      
      // 更新表单数据
      this.updateFormData()
    },
    // 打开任务位置选择器
    openTaskLocationSelector(taskGroup) {
      // 如果是变更任务场景，检查当前单位是否是支援单位
      if (this.isChangeTask) {
        const unit = this.selectedUnits.find(u => u.taskGroups && u.taskGroups.includes(taskGroup))
        if (unit && unit.unitStatus === 'support') {
          uni.showToast({ title: '变更任务场景下无法修改支援单位内容', icon: 'none' })
          return
        }
      }
      
      // 检查是否已选择车辆
      if (!taskGroup.cars || taskGroup.cars.length === 0) {
        uni.showToast({ title: '请先选择参战车辆', icon: 'none' })
        return
      }
      
      // 保存当前任务组，用于回调
      this.currentTaskGroupForLocation = taskGroup
      
      // 跳转到地图选择页面
      uni.navigateTo({
        url: `/subPackages/locationInfo/mapView/index?enableSatellite=true&mode=select`,
        success: (res) => {
          // 页面打开成功，监听页面返回事件
          res.eventChannel.on('locationSelected', (data) => {
            this.handleTaskLocationResult(data, taskGroup)
          })
        },
        fail: (err) => {
          console.error('打开地图页面失败:', err)
          // 如果跳转失败，回退到原来的选择方式
          // #ifdef MP-WEIXIN
          uni.chooseLocation({
            success: (res) => {
              this.handleTaskLocationResult(res, taskGroup)
            },
            fail: (err) => {
              console.error('选择位置失败:', err)
            }
          })
          // #endif
        }
      })
    },
    // 处理任务位置选择结果
    handleTaskLocationResult(locationData, taskGroup) {
      if (locationData && locationData.latitude && locationData.longitude) {
        // 初始化任务位置信息
        if (!taskGroup.taskLocation) {
          this.$set(taskGroup, 'taskLocation', {})
        }
        
        // 保存位置信息
        this.$set(taskGroup.taskLocation, 'latitude', locationData.latitude)
        this.$set(taskGroup.taskLocation, 'longitude', locationData.longitude)
        this.$set(taskGroup.taskLocation, 'addressName', locationData.name || '')
        this.$set(taskGroup.taskLocation, 'address', locationData.address || '')
        
        // 更新表单数据
        this.updateFormData()
        this.$forceUpdate()
        
        uni.showToast({
          title: '任务位置已设置',
          icon: 'success'
        })
      } else {
        uni.showToast({
          title: '您未选择位置，请重新选择',
          icon: 'none'
        })
      }
      
      // 清空当前任务组引用
      this.currentTaskGroupForLocation = null
    },
    // 获取任务位置显示文本
    getTaskLocationText(taskGroup) {
      if (!taskGroup || !taskGroup.taskLocation || !taskGroup.taskLocation.addressName) {
        return ''
      }
      return taskGroup.taskLocation.addressName
    },
    // 更新表单数据
    updateFormData() {
      this.formData.assignedUnits = this.selectedUnits.map(unit => ({
        unitId: unit.value,
        unitName: unit.label,
        carInfo: (unit.selectedCars || []).map(car => ({
          carId: car.value,
          carName: car.label
        })),
        taskGroups: (unit.taskGroups || []).map(taskGroup => {
          const taskGroupData = {
            carIds: (taskGroup.cars || []).map(car => car.value),
            carNames: (taskGroup.cars || []).map(car => car.label),
            floor: taskGroup.floor || '', // 层数
            direction: taskGroup.direction || '', // 方位
            description: taskGroup.description || '', // 描述
            searchPower: taskGroup.searchPower || '', // 搜救力量
            searchResult: taskGroup.searchResult || '', // 搜救结果
            smokePower: taskGroup.smokePower || '', // 排烟力量
            targetCars: (taskGroup.targetCars || []).map(car => ({
              carId: car.value,
              carName: car.label
            })), // 目标车辆（供水任务）
            taskType: taskGroup.taskType || '',
            taskExtra: taskGroup.taskExtra || {},
            // 任务位置信息
            taskLocation: taskGroup.taskLocation || null
          }
          
          // 供水任务：添加目标中队（单选）
          if (this.isWaterTask(taskGroup)) {
            const targetUnitValue = this.getTargetUnitValue(taskGroup)
            if (targetUnitValue) {
              // 更新 taskExtra.targetUnit
              if (!taskGroupData.taskExtra) {
                taskGroupData.taskExtra = {}
              }
              taskGroupData.taskExtra.targetUnit = String(targetUnitValue)
              // 兼容旧数据：同时更新 targetUnits 数组
              const targetUnit = this.fireUnitOptions.find(u => String(u.value) === targetUnitValue)
              if (targetUnit) {
                taskGroupData.targetUnits = [{
                  unitId: targetUnit.value,
                  unitName: targetUnit.label || ''
                }]
              }
            }
          }
          
          return taskGroupData
        }),
        unitStatus: unit.unitStatus || 'rescue', // 单位状态：rescue-首次救援单位，support-支援单位
        rescueTime: unit.rescueTime || new Date().toISOString() // 救援时间，以每次提交为基准
      }))
    },
    // 移除救援单位
    async removeUnit(index) {
      // 确认删除
      const unitName = this.selectedUnits[index]?.label || '该救援单位'
      const confirmResult = await new Promise((resolve) => {
        uni.showModal({
          title: '确认删除',
          content: `确定要删除${unitName}吗？`,
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })
      
      if (!confirmResult) return
      
      this.selectedUnits.splice(index, 1)
      this.updateFormData()
      // 更新单位状态（因为移除单位后，车辆会释放，其他单位的状态可能改变）
      this.updateUnitStatus()
    },
    
    // 查询上一次记录
    async checkLastRecord() {
      try {
        const currentUser = uni.getStorageSync('userInfo') || {}
        if (!currentUser.userId) return
        
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/fire/lastRecord',
            method: 'GET',
            data: {
              issuePersonId: currentUser.userId
            },
            success: resolve,
            fail: reject
          })
        })
        
        if (res?.data?.code === 200 && res.data.data) {
          this.lastRecordData = res.data.data
          // 延迟显示弹窗，让页面先加载
          this.$nextTick(() => {
            setTimeout(() => {
              this.showLastRecordModal = true
            }, 500)
          })
        }
      } catch (e) {
        console.error('查询上一次记录失败:', e)
        // 静默处理，不影响正常流程
      }
    },
    // 使用上一次记录
    useLastRecord() {
      if (!this.lastRecordData) return
      
      const lastRecord = this.lastRecordData
      // 填充救援地址（如果当前没有选择地址，或者当前地址不是录入的地址）
      if (lastRecord.addressId && (!this.selectedAddress.addressId || !this.matchedAddress)) {
        this.selectedAddress = {
          addressId: lastRecord.addressId,
          addressName: lastRecord.addressName || '',
          rescueFloor: lastRecord.rescueFloor || ''
        }
        this.formData.addressId = lastRecord.addressId
        this.formData.addressName = lastRecord.addressName || ''
        this.formData.locationType = lastRecord.locationType || ''
      }
      
      // 关闭弹窗
      this.showLastRecordModal = false
      this.lastRecordData = null
    },
    // 不使用上一次记录
    dismissLastRecord() {
      this.showLastRecordModal = false
      this.lastRecordData = null
    },
    // 切换当前地址显示
    toggleCurrentAddress() {
      this.showCurrentAddress = !this.showCurrentAddress
      // 如果展开且还没有获取位置，则获取
      if (this.showCurrentAddress && !this.currentLocation && !this.currentLocationLoading) {
        this.getCurrentLocationAndMatch()
      }
    },
    // 切换已有救援单位显示
    toggleExistingUnits() {
      this.showExistingUnits = !this.showExistingUnits
    },
    
    // 获取当前位置并匹配地址
    async getCurrentLocationAndMatch() {
      // 如果有situationId，不自动获取位置
      if (this.situationId) return
      
      this.currentLocationLoading = true
      try {
        // 获取用户当前位置
        const locationRes = await new Promise((resolve, reject) => {
          uni.getLocation({
            type: 'gcj02',
            success: resolve,
            fail: reject
          })
        })
        
        if (locationRes.latitude && locationRes.longitude) {
          this.currentLocation = {
            latitude: locationRes.latitude,
            longitude: locationRes.longitude,
            addressName: '当前位置'
          }
          
          // 调用逆地理编码获取地址名称
          try {
            const geocodeRes = await new Promise((resolve, reject) => {
              uni.request({
                url: this.serverUrl + '/location/reverseGeocode',
                method: 'GET',
                data: {
                  latitude: locationRes.latitude,
                  longitude: locationRes.longitude
                },
                success: resolve,
                fail: reject
              })
            })
            
            if (geocodeRes?.data?.code === 200) {
              const data = geocodeRes.data.data || {}
              this.currentLocation.addressName = data.name || data.addressName || data.formatted_address || '当前位置'
              this.currentLocation.addressExt = data.address || data.fullAddress || ''
            }
          } catch (e) {
            console.error('逆地理编码失败:', e)
          }
          
          // 匹配地址列表
          await this.matchAddressWithLocation(locationRes.latitude, locationRes.longitude)
        }
      } catch (error) {
        console.error('获取位置失败:', error)
        this.currentLocation = null
      } finally {
        this.currentLocationLoading = false
      }
    },
    
    // 匹配地址列表
    async matchAddressWithLocation(latitude, longitude) {
      try {
        // 获取地址列表（获取所有地址进行匹配）
        const res = await new Promise((resolve, reject) => {
          uni.request({
            url: this.serverUrl + '/location/list',
            method: 'GET',
            data: { page: 1, pageSize: 1000 }, // 获取足够多的地址进行匹配
            success: resolve,
            fail: reject
          })
        })
        
        if (res?.data?.code === 200) {
          // 兼容不同的返回格式
          const data = res.data.data || {}
          const addressList = data.list || data || []
          
          // 计算距离，找到最近的地址（阈值：100米内认为匹配）
          let matched = null
          let minDistance = Infinity
          const threshold = 100 // 100米
          
          addressList.forEach(address => {
            if (address.latitude && address.longitude) {
              const distance = this.calculateDistance(
                latitude, longitude,
                address.latitude, address.longitude
              )
              
              if (distance <= threshold && distance < minDistance) {
                minDistance = distance
                matched = address
              }
            }
          })
          
          this.matchedAddress = matched
          
          // 如果匹配到地址（是录入的地址），且救援地址为空，自动填充
          if (matched && !this.selectedAddress.addressId && !this.situationId) {
            this.selectedAddress = {
              addressId: matched.addressId,
              addressName: matched.addressName,
              rescueFloor: matched.rescueFloor
            }
            this.formData.addressId = matched.addressId
            this.formData.addressName = matched.addressName
            this.formData.locationType = matched.type || matched.locationType
          }
        }
      } catch (error) {
        console.error('匹配地址失败:', error)
      }
    },
    
    // 计算两点间距离（米）
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000 // 地球半径（米）
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },
    async submitForm() {
      // 验证必填字段
      const fd = this.formData
      if (!fd.addressId) {
        uni.showToast({ title: '请选择救援地址', icon: 'none' })
        return
      }
      if (this.selectedUnits.length === 0) {
        uni.showToast({ title: '请至少选择一个救援单位', icon: 'none' })
        return
      }
      
      // 验证每个单位的配置
      for (let i = 0; i < this.selectedUnits.length; i++) {
        const unit = this.selectedUnits[i]
        if (unit.selectedCars.length === 0) {
          uni.showToast({ title: `请为${unit.label}选择参战车辆`, icon: 'none' })
          return
        }
        
        if (!unit.taskGroups || unit.taskGroups.length === 0) {
          uni.showToast({ title: `请为${unit.label}添加至少一个车辆任务`, icon: 'none' })
          return
        }
        
        // 检查参战车辆是否都已分配到任务组
        const usedCarIds = this.getUsedCarIds(unit)
        const unassignedCars = unit.selectedCars.filter(car => !usedCarIds.includes(car.value))
        if (unassignedCars.length > 0) {
          const unassignedCarNames = unassignedCars.map(car => car.label).join('、')
          uni.showToast({ 
            title: `${unit.label}的参战车辆未全部分配：${unassignedCarNames}`, 
            icon: 'none',
            duration: 3000
          })
          return
        }
        
        // 验证每个任务组的配置
        for (let j = 0; j < unit.taskGroups.length; j++) {
          const taskGroup = unit.taskGroups[j]
          if (!taskGroup.cars || taskGroup.cars.length === 0) {
            uni.showToast({ title: `请为${unit.label}的任务组${j + 1}选择参战车辆`, icon: 'none' })
            return
          }
          if (!taskGroup.taskType) {
            uni.showToast({ title: `请为${unit.label}的任务组${j + 1}选择任务类型`, icon: 'none' })
            return
          }
          // 验证灭火/堵截任务的特殊字段
          if (this.isFireOrBlockTask(taskGroup)) {
            // 层数验证（可选，如果填写了必须是0-99的正整数）
            if (taskGroup.floor !== undefined && taskGroup.floor !== '') {
              const floorNum = parseInt(taskGroup.floor, 10)
              if (isNaN(floorNum) || floorNum < 0 || floorNum > 99) {
                uni.showToast({ title: `请为${unit.label}的任务组${j + 1}输入正确的层数(0-99)`, icon: 'none' })
                return
              }
            }
            // 描述验证（可选，如果填写了必须在200字以内）
            if (taskGroup.description && taskGroup.description.length > 200) {
              uni.showToast({ title: `请为${unit.label}的任务组${j + 1}的描述控制在200字以内`, icon: 'none' })
              return
            }
            // 验证灭火/堵截任务的动态内容（如1枪、2枪等）
            if (taskGroup.taskConfig && taskGroup.taskConfig.actionKey) {
              const taskExtraValue = taskGroup.taskExtra[taskGroup.taskConfig.actionKey]
              if (!taskExtraValue || taskExtraValue.trim() === '') {
                uni.showToast({ title: `请为${unit.label}的任务组${j + 1}选择${this.getTaskContentTitle(taskGroup)}`, icon: 'none' })
                return
              }
            }
          } else if (this.isSearchTask(taskGroup)) {
            // 验证搜救任务的特殊字段
            // 搜救力量验证（可选）
            // 搜救结果验证（可选）
            // 层数验证（可选，如果填写了必须是0-99的正整数）
            if (taskGroup.floor !== undefined && taskGroup.floor !== '') {
              const floorNum = parseInt(taskGroup.floor, 10)
              if (isNaN(floorNum) || floorNum < 0 || floorNum > 99) {
                uni.showToast({ title: `请为${unit.label}的任务组${j + 1}输入正确的层数(0-99)`, icon: 'none' })
                return
              }
            }
            // 描述验证（可选，如果填写了必须在200字以内）
            if (taskGroup.description && taskGroup.description.length > 200) {
              uni.showToast({ title: `请为${unit.label}的任务组${j + 1}的描述控制在200字以内`, icon: 'none' })
              return
            }
          } else if (this.isSmokeTask(taskGroup)) {
            // 验证排烟任务的特殊字段
            // 排烟力量验证（可选）
            // 排烟任务不需要目标车辆，不需要验证
            // 层数验证（可选，如果填写了必须是0-99的正整数）
            if (taskGroup.floor !== undefined && taskGroup.floor !== '') {
              const floorNum = parseInt(taskGroup.floor, 10)
              if (isNaN(floorNum) || floorNum < 0 || floorNum > 99) {
                uni.showToast({ title: `请为${unit.label}的任务组${j + 1}输入正确的层数(0-99)`, icon: 'none' })
                return
              }
            }
            // 描述验证（可选，如果填写了必须在200字以内）
            if (taskGroup.description && taskGroup.description.length > 200) {
              uni.showToast({ title: `请为${unit.label}的任务组${j + 1}的描述控制在200字以内`, icon: 'none' })
              return
            }
          } else if (this.isWaterTask(taskGroup)) {
            // 验证供水任务的特殊字段
            // 验证目标中队（必填）
            const targetUnitValue = this.getTargetUnitValue(taskGroup)
            if (!targetUnitValue || targetUnitValue.trim() === '') {
              uni.showToast({ title: `请为${unit.label}的任务组${j + 1}选择目标中队`, icon: 'none' })
              return
            }
            // 验证目标车辆（必填，至少选择一辆）
            if (!taskGroup.targetCars || taskGroup.targetCars.length === 0) {
              uni.showToast({ title: `请为${unit.label}的任务组${j + 1}选择目标车辆`, icon: 'none' })
              return
            }
            // 描述验证（可选，如果填写了必须在200字以内）
            if (taskGroup.description && taskGroup.description.length > 200) {
              uni.showToast({ title: `请为${unit.label}的任务组${j + 1}的描述控制在200字以内`, icon: 'none' })
              return
            }
          } else {
            // 验证其他任务类型的动态内容
            if (taskGroup.taskConfig && taskGroup.taskConfig.actionKey) {
              const taskExtraValue = taskGroup.taskExtra[taskGroup.taskConfig.actionKey]
              if (!taskExtraValue || taskExtraValue.trim() === '') {
                uni.showToast({ title: `请为${unit.label}的任务组${j + 1}选择${this.getTaskContentTitle(taskGroup)}`, icon: 'none' })
                return
              }
            }
          }
        }
      }
      
      // 确认提交
      let confirmResult = false
      
      // 如果是任务下达场景，显示特殊确认提示
      if (this.isCommitTask) {
        confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认操作',
            content: '请确认当前操作仅由指挥部或者主战队站执行？',
            confirmText: '确认',
            cancelText: '取消',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
      } else {
        // 非任务下达场景，显示普通确认提示
        confirmResult = await new Promise((resolve) => {
          uni.showModal({
            title: '确认提交',
            content: '确定要提交火场情况信息吗？',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false)
          })
        })
      }
      
      if (!confirmResult) return
      
      try {
        this.submitting = true
        uni.showLoading({ title: '提交中...' })
        
        // 提交前再次更新表单数据，确保数据是最新的
        this.updateFormData()
        
        const currentUser = uni.getStorageSync('userInfo') || {}
        const now = new Date()
        
        const payload = { 
          ...this.formData, 
          issuePersonId: currentUser.userId || '', 
          issuePersonName: currentUser.nickName || '',
          issueTime: now.toISOString(), 
          updateTime: now.toISOString()
        }
        
        // 如果有situationId，将其作为参数提交
        if (this.situationId) {
          payload.situationId = this.situationId
        }
        
        // 如果是变更任务场景，传递taskType参数
        if (this.isChangeTask) {
          payload.taskType = 'change'
        }
        // 如果是任务下达场景，传递taskType参数
        if (this.isCommitTask) {
          payload.taskType = 'commit'
        }
        
        const res = await new Promise((resolve, reject) => {
          uni.request({ 
            url: this.serverUrl + '/fire/upload', 
            method: 'POST', 
            data: payload, 
            success: resolve, 
            fail: reject 
          })
        })
        if (res?.data?.code === 200) {
          uni.showToast({ title: '提交成功', icon: 'success' })
          // 如果是变更任务，返回上一页（会刷新详情页或查询页）
          if (this.isChangeTask) {
            setTimeout(() => {
              uni.navigateBack()
            }, 1200)
          } else if (this.situationId) {
            // 如果有situationId但不是变更任务，跳转到任务查询页面
            setTimeout(() => {
              uni.redirectTo({ url: '/pages/data/taskQuery/index' })
            }, 1200)
          } else {
            // 新建任务，跳转到火场查询页面
            setTimeout(() => {
              uni.redirectTo({ url: '/pages/data/fireQuery/index' })
            }, 1200)
          }
        } else {
          throw new Error(res?.data?.msg || '提交失败')
        }
      } catch (e) {
        uni.showToast({ title: e.message || '提交失败', icon: 'none' })
      } finally {
        this.submitting = false
        uni.hideLoading()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.fire-upload-page { min-height: 100vh; background: #f0f8ff; padding-bottom: constant(safe-area-inset-bottom); padding-bottom: env(safe-area-inset-bottom); display: flex; flex-direction: column; }
.form-container { flex: 1; padding: 24rpx; padding-bottom: 24rpx; overflow-y: auto; -webkit-overflow-scrolling: touch; max-height: calc(100vh - 120rpx); }
.form-section { background: #fff; border-radius: 12rpx; margin-bottom: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04); overflow: hidden; border: 1rpx solid #f0f8ff; }
.form-section:active { box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06); }
.form-row { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: #333; }
.required { color: #ff4d4f; margin-left: 4rpx; }
.assign-summary { flex: 1; display: flex; justify-content: flex-start; padding-left: 16rpx; }
.summary-text { font-size: 24rpx; color: #1890ff; font-weight: 500; background: #f0f8ff; padding: 6rpx 12rpx; border-radius: 6rpx; display: inline-block; }
.summary-text.placeholder { color: #999; background: transparent; padding: 0; }
.address-selector { flex: 1; display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f0f8ff; border-radius: 8rpx; margin-left: 24rpx; border: 1rpx solid #f0f8ff; transition: all 0.2s; }
.address-selector:active { background: #e6f7ff; border-color: #f0f8ff; }
.address-selector.disabled { background: #e6f7ff; border-color: #f0f8ff; cursor: not-allowed; opacity: 0.6; }
.address-info { display: flex; align-items: center; gap: 12rpx; flex: 1; }
.address-text { font-size: 26rpx; color: #333; flex: 1; }
.address-text.placeholder { color: #999; }
.arrow-icon { width: 32rpx; height: 32rpx; opacity: .6; }
.form-textarea { width: 100%; min-height: 160rpx; padding: 16rpx; background: #f0f8ff; border: 1rpx solid #f0f8ff; border-radius: 8rpx; font-size: 26rpx; color: #333; margin: 0; box-sizing: border-box; line-height: 1.6; transition: all 0.2s; }
.form-textarea:focus { background: #fff; border-color: #1890ff; }
.form-textarea:disabled { background: #fafafa; border-color: #e8e8e8; opacity: 0.6; color: #999; }
.textarea-container { padding: 0}
.remark-textarea-container { padding: 0 24rpx 24rpx 24rpx; }
.form-bottom-spacer { height: 120rpx; }

/* 当前地址相关样式 */
.toggle-icon {
  width: 32rpx;
  height: 32rpx;
  opacity: 0.6;
  transition: transform 0.3s ease;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.current-address-content {
  padding: 0 24rpx 24rpx;
}

.loading-state,
.error-state {
  padding: 16rpx;
  text-align: center;
  background: #f0f8ff;
  border-radius: 8rpx;
  border: 1rpx solid #f0f8ff;
}

.loading-text,
.error-text {
  font-size: 24rpx;
  color: #666;
}

.current-location-info {
  padding: 16rpx;
  background: #f0f8ff;
  border-radius: 8rpx;
  border: 1rpx solid #f0f8ff;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.location-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.location-name {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-match-status {
  font-size: 22rpx;
  font-weight: 500;
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.location-match-status.match-success {
  color: #52c41a;
  background: #f6ffed;
  border: 1rpx solid #f0f8ff;
}

.location-match-status.match-fail {
  color: #ff4d4f;
  background: #fff1f0;
  border: 1rpx solid #f0f8ff;
}

.location-match-tip {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 救援单位相关样式 */
.add-unit-btn { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 20rpx; background: #fff; border: 1rpx solid #f0f8ff; border-radius: 8rpx; transition: all 0.2s; }
.add-unit-btn:active { background: #e6f7ff; }

/* 支援信息样式 */
.support-content-box {
  padding: 0 24rpx 24rpx;
}

.support-content-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  padding: 16rpx;
  background: linear-gradient(135deg, #fff1f0, #fff);
  border-left: 4rpx solid #ff4d4f;
  border-radius: 8rpx;
}

/* 已有救援单位样式 */
.existing-units-content { padding: 0 24rpx 24rpx; }
.existing-unit-card { background: #f0f8ff; border-radius: 8rpx; padding: 16rpx; margin-bottom: 12rpx; border: 1rpx solid #f0f8ff; }
.existing-unit-card:last-child { margin-bottom: 0; }
.unit-info-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; gap: 12rpx; }
.unit-name-wrapper { display: flex; align-items: center; gap: 12rpx; flex: 1; min-width: 0; }
.unit-name { font-size: 26rpx; color: #333; font-weight: 600; flex-shrink: 0; }
.unit-status-badge { display: flex; align-items: center; gap: 6rpx; padding: 4rpx 12rpx; border-radius: 16rpx; font-size: 20rpx; font-weight: 500; }
.unit-status-badge.rescue-badge { background: linear-gradient(135deg, #1890ff, #40a9ff); color: #fff; }
.unit-status-badge.support-badge { background: linear-gradient(135deg, #fa8c16, #ffa940); color: #fff; }
.status-dot { width: 6rpx; height: 6rpx; border-radius: 50%; background: rgba(255, 255, 255, 0.9); }
.status-text { font-size: 20rpx; font-weight: 500; }
.unit-time { font-size: 22rpx; color: #999; flex-shrink: 0; white-space: nowrap; }
.existing-task-groups { margin-top: 12rpx; }
.existing-task-group { background: #fff; border-radius: 8rpx; padding: 12rpx; margin-bottom: 12rpx; position: relative; border-left: 4rpx solid #1890ff; }
.existing-task-group:last-child { margin-bottom: 0; }
.task-group-badge { position: absolute; top: 0; left: 0; background: linear-gradient(135deg, #1890ff, #40a9ff); color: #fff; font-size: 20rpx; font-weight: 600; padding: 4rpx 12rpx; border-radius: 8rpx 0 8rpx 0; z-index: 1; }
.task-group-details-row { display: flex; flex-direction: column; gap: 8rpx; margin-top: 24rpx; }
.detail-text { font-size: 22rpx; color: #666; line-height: 1.5; }
.add-text { font-size: 24rpx; color: #1890ff; font-weight: 500; }
.selected-units { padding: 0 20rpx 8rpx; }
.unit-item { background: #fff; border-radius: 12rpx; margin: 0 4rpx 14rpx 4rpx; box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04); border: 1rpx solid #f0f8ff; position: relative; overflow: visible; }
.unit-item.disabled-unit { background: #fafafa; opacity: 0.8; }
.unit-header { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 16rpx 8rpx 16rpx; gap: 12rpx; }
.unit-title { font-size: 28rpx; color: #1f2d3d; font-weight: 700; flex: 1; }
.unit-config-inline.disabled-config { opacity: 0.6; pointer-events: none; }
.unit-config-inline { padding: 8rpx 16rpx 14rpx 16rpx; background: #fff; border: 0; border-bottom-left-radius: 12rpx; border-bottom-right-radius: 12rpx; }
.config-section { margin-bottom: 24rpx; }
.config-section:last-child { margin-bottom: 0; }
.config-section-inline { display: flex; align-items: center; gap: 12rpx; }
.config-section-inline .config-label { margin-bottom: 0; flex-shrink: 0; }
.config-section-inline .car-selector { margin-top: 0; flex: 1; }
.add-task-btn { width: 100%; height: 64rpx; background: linear-gradient(135deg, #1890ff, #40a9ff); color: #fff; border: none; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; margin-top: 8rpx; box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.2); }
.add-task-btn:active { background: linear-gradient(135deg, #40a9ff, #1890ff); opacity: 0.9; }
.add-task-text { color: #fff; }
.task-group-item { margin-bottom: 24rpx; padding: 20rpx; background: #fff; border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04); border: 1rpx solid #f0f8ff; position: relative; overflow: visible; }
.task-group-item.disabled-task-group { background: #fafafa; opacity: 0.8; }
.task-group-badge { position: absolute; top: 0; left: 0; background: linear-gradient(135deg, #1890ff, #40a9ff); color: #fff; font-size: 20rpx; font-weight: 600; padding: 4rpx 12rpx; border-radius: 12rpx 0 12rpx 0; z-index: 1; box-shadow: 0 2rpx 4rpx rgba(24, 144, 255, 0.3); line-height: 1.2; }
.task-group-item:last-child { margin-bottom: 0; }
.task-group-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 20rpx; }
.task-group-item .config-section { margin-bottom: 20rpx; }
.task-group-item .config-section:last-child { margin-bottom: 0; }
.task-group-label { font-size: 24rpx; color: #333; font-weight: 500; flex-shrink: 0; }
.task-group-title { font-size: 26rpx; color: #1890ff; font-weight: 600; flex-shrink: 0; }
.task-group-cars-selector { display: flex; align-items: center; flex: 1; min-width: 0; padding: 10rpx 14rpx; background: #f0f8ff; border-radius: 8rpx; border: 1rpx solid #f0f8ff; transition: all 0.2s; }
.task-group-cars-selector:active { background: #e6f7ff; border-color: #f0f8ff; }
.task-group-cars-selector.disabled { background: #fafafa; border-color: #e8e8e8; opacity: 0.6; pointer-events: none; }
.task-group-cars { font-size: 22rpx; color: #666; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-group-cars.placeholder { color: #999; }
.remove-task-group-btn { position: absolute; top: -18rpx; right: -18rpx; width: 40rpx; height: 40rpx; border-radius: 50%; background: #ff4d4f; transition: background 0.2s; z-index: 2; display: flex; align-items: center; justify-content: center; box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3); }
.remove-task-group-btn:active { background: #ff7875; }
.remove-task-group-btn .remove-icon { width: 24rpx; height: 24rpx; opacity: 1; filter: brightness(0) invert(1); }
.no-available-cars-tip { font-size: 24rpx; color: #fa8c16; text-align: center; padding: 20rpx 16rpx; background: #fff7e6; border-radius: 8rpx; border: 1rpx solid #ffd591; margin-top: 8rpx; font-weight: 500; }
.car-used-tip { font-size: 22rpx; color: #ff4d4f; margin-left: 8rpx; }
.config-label { font-size: 24rpx; color: #333; font-weight: 500; margin-bottom: 12rpx; display: block; }
.input-container { margin-top: 12rpx; }
.form-input { width: 100%; height: 64rpx; padding: 0 16rpx; background: #f0f8ff; border: 1rpx solid #f0f8ff; border-radius: 8rpx; font-size: 26rpx; color: #333; box-sizing: border-box; transition: all 0.2s; line-height: 64rpx; }
.form-input:focus { background: #fff; border-color: #1890ff; }
.form-input:disabled { background: #fafafa; border-color: #e8e8e8; opacity: 0.6; color: #999; }
.form-picker-row { margin-top: 12rpx; }
/* 层数和方位同一行 */
.floor-direction-row { display: flex; gap: 16rpx; align-items: flex-start; }
.floor-direction-item { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.floor-direction-item .config-label { margin-bottom: 12rpx; }
.floor-direction-item .input-container { margin-top: 0; }
.floor-direction-item .form-picker-row { margin-top: 0; }
/* 确保同一行中的输入框和下拉框高度完全一致 */
.floor-direction-item .form-input,
.floor-direction-item .picker-display { height: 64rpx; min-height: 64rpx; max-height: 64rpx; }
.floor-direction-item .picker-display { display: flex; align-items: center; }
.form-picker-section { margin-top: 12rpx; }
.form-picker { width: 100%; }
.picker-display { display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f0f8ff; border-radius: 8rpx; border: 1rpx solid #f0f8ff; transition: all 0.2s; box-sizing: border-box; line-height: 64rpx; }
.picker-display:active { background: #e6f7ff; border-color: #f0f8ff; }
.picker-display.disabled { background: #fafafa; border-color: #e8e8e8; opacity: 0.6; pointer-events: none; }
.picker-text { font-size: 26rpx; color: #333; flex: 1; }
.picker-text.placeholder { color: #999; }
.picker-arrow { width: 32rpx; height: 32rpx; opacity: .6; }
.car-selector { display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f0f8ff; border-radius: 8rpx; border: 1rpx solid #f0f8ff; margin-top: 12rpx; transition: all 0.2s; }
.car-selector:active { background: #e6f7ff; border-color: #f0f8ff; }
.car-selector.disabled { background: #fafafa; border-color: #e8e8e8; opacity: 0.6; pointer-events: none; }
.car-text { font-size: 26rpx; color: #333; }
.task-location-selector { display: flex; align-items: center; justify-content: space-between; height: 64rpx; padding: 0 16rpx; background: #f0f8ff; border-radius: 8rpx; border: 1rpx solid #f0f8ff; margin-top: 12rpx; transition: all 0.2s; }
.task-location-selector:active { background: #e6f7ff; border-color: #f0f8ff; }
.task-location-selector.disabled { background: #fafafa; border-color: #e8e8e8; opacity: 0.6; pointer-events: none; }
.task-location-text { font-size: 26rpx; color: #333; flex: 1; }
.task-location-text.placeholder { color: #999; }
.map-icon-small { width: 28rpx; height: 28rpx; opacity: 0.7; flex-shrink: 0; }
.force-options { display: flex; flex-wrap: wrap; gap: 8rpx; width: 100%; margin-top: 12rpx; }
.force-option { display: flex; align-items: center; justify-content: center; padding: 10rpx 16rpx; border: 1rpx solid #f0f8ff; border-radius: 8rpx; background: #f0f8ff; transition: background .2s, border-color .2s, color .2s; flex: 1; min-width: 0; height: 64rpx; box-sizing: border-box; }
.force-option:active { background: #e6f7ff; }
.force-option.active { border-color: #1890ff; background: #1890ff; color: #fff; }
.force-option.active .force-label { color: #fff; }
.force-option.disabled { background: #fafafa; border-color: #e8e8e8; opacity: 0.6; pointer-events: none; }
.force-label { font-size: 22rpx; color: #333; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.unit-info { flex: 1; min-width: 0; }
.unit-actions { display: flex; align-items: center; gap: 12rpx; }
.remove-btn { position: absolute; top: -18rpx; right: -18rpx; width: 40rpx; height: 40rpx; border-radius: 50%; background: #ff4d4f; transition: background 0.2s; z-index: 2; display: flex; align-items: center; justify-content: center; box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3); }
.remove-btn:active { background: #ff7875; }
.remove-btn .remove-icon { width: 24rpx; height: 24rpx; opacity: 1; filter: brightness(0) invert(1); }


.submit-section { position:fixed; bottom:0; left:0; right:0; background:#fff; padding:12rpx; padding-bottom: calc(24rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(24rpx + env(safe-area-inset-bottom)); box-shadow:0 -4rpx 16rpx rgba(0,0,0,.1); z-index:100; }
.submit-btn { width:100%; height:80rpx; background:linear-gradient(135deg,#1890ff,#40a9ff); color:#fff !important; border:none; border-radius:16rpx; font-size:32rpx; font-weight:600; box-shadow:0 4rpx 16rpx rgba(24,144,255,.3); }
.submit-btn:disabled { background:#d9d9d9; box-shadow:none; }

/* 底部抽屉样式 */
.drawer-mask { position: fixed; left:0; right:0; top:0; bottom:0; background: rgba(0,0,0,0.45); z-index: 1100; display: flex; align-items: flex-end; }
.drawer-panel { width: 100%; background: #fff; border-top-left-radius: 24rpx; border-top-right-radius: 24rpx; max-height: 88vh; display: flex; flex-direction: column; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 20rpx; border-bottom: 1rpx solid #f0f8ff; }
.drawer-title { font-size: 26rpx; font-weight: 600; color: #333; }
.drawer-close { padding: 16rpx; }
.close-icon { width: 32rpx; height: 32rpx; opacity: 0.6; }
.drawer-body { padding: 12rpx 28rpx 28rpx; overflow-y: auto; }
.drawer-item { display: flex; align-items: center; padding: 24rpx 0; }
.drawer-item.disabled { opacity: 0.5; pointer-events: none; }
.drawer-item .checkbox { 
  margin-right: 16rpx; 
  width: 32rpx; 
  height: 32rpx; 
  border: 1rpx solid #f0f8ff; 
  border-radius: 6rpx; 
  background: #fff; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  box-sizing: border-box; 
  transition: background .2s ease, border-color .2s ease, transform .1s ease; 
}
.drawer-item:active .checkbox { transform: scale(0.95); }
.drawer-item.active .checkbox { border-color: #1890ff; background: #1890ff; }
.drawer-item .checkbox-inner { 
  width: 18rpx; 
  height: 18rpx; 
  background: transparent; 
  transform: scale(0); 
  transition: transform .15s ease; 
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'); 
  background-size: 100% 100%; 
  background-repeat: no-repeat; 
  background-position: center center; 
}
.drawer-item.active .checkbox-inner { transform: scale(1); }
.drawer-item-info { display: flex; flex-direction: column; gap: 4rpx; flex: 1; }
.drawer-item .unit-label { font-size: 28rpx; }
.status-badge { font-size: 24rpx; padding: 8rpx 12rpx; border-radius: 8rpx; border: 1rpx solid #f0f8ff; background: #f0f8ff; color: #1890ff; white-space: nowrap; }
.status-badge.rescuing { background: #fff1f0; border: 1rpx solid #f0f8ff; color: #ff4d4f; }
.status-badge.idle { background: #f6ffed; border: 1rpx solid #f0f8ff; color: #52c41a; }
.status-badge.disabled { background: #e6f7ff; border: 1rpx solid #f0f8ff; color: #999; }
.drawer-footer { padding: 16rpx 24rpx 24rpx; border-top: 1rpx solid #f0f8ff; }
.confirm-btn { width: 100%; height: 64rpx; background: linear-gradient(135deg, #1890ff, #40a9ff); color: #fff; border: none; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; }

/* 上一次记录弹窗样式 */
.last-record-modal-mask { position: fixed; left: 0; right: 0; top: 0; bottom: 0; background: rgba(0, 0, 0, 0.45); z-index: 2000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
.last-record-modal { width: 640rpx; background: #fff; border-radius: 20rpx; overflow: hidden; animation: slideUp 0.3s ease; box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.15); }
.last-record-modal-header { padding: 40rpx 40rpx 28rpx; border-bottom: 1rpx solid #f0f8ff; background: linear-gradient(135deg, #f0f8ff 0%, #fff 100%); }
.last-record-modal-title { font-size: 34rpx; font-weight: 600; color: #1890ff; }
.last-record-modal-body { padding: 40rpx; }
.last-record-modal-content { font-size: 28rpx; color: #333; line-height: 1.8; display: block; margin-bottom: 24rpx; }
.last-record-modal-address { display: flex; align-items: flex-start; padding: 20rpx; background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%); border-radius: 12rpx; margin-top: 20rpx; border: 1rpx solid #d6e4ff; }
.last-record-address-label { font-size: 26rpx; color: #1890ff; margin-right: 12rpx; flex-shrink: 0; font-weight: 500; }
.last-record-address-text { font-size: 26rpx; color: #333; flex: 1; word-break: break-all; line-height: 1.6; }
.last-record-modal-footer { display: flex; border-top: 1rpx solid #f0f8ff; }
.last-record-modal-btn { flex: 1; height: 96rpx; display: flex; align-items: center; justify-content: center; font-size: 30rpx; font-weight: 500; transition: all 0.2s; }
.last-record-modal-btn.cancel-btn { color: #666; border-right: 1rpx solid #f0f8ff; }
.last-record-modal-btn.cancel-btn:active { background: #fafafa; }
.last-record-modal-btn.confirm-btn { color: #1890ff; font-weight: 600; background: linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%); }
.last-record-modal-btn.confirm-btn:active { background: linear-gradient(135deg, #e6f7ff 0%, #d6e4ff 100%); }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>