import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class DayTabs extends ViewBase {
  constructor(days = ['Dia 1']) {
    super();
    this._days = [...days];
    this._selectedDayIndex = 0;
  }

  setDays(days = []) {
    this._days = [...days];
    this._selectedDayIndex = 0;
    return this;
  }

  selectDay(index) {
    const target = Number(index);
    if (target >= 0 && target < this._days.length) {
      this._selectedDayIndex = target;
      this.emit('DAY_SELECTED', { index: target, label: this._days[target] });
    }
    return this;
  }

  toDisplayObject() {
    return {
      days: [...this._days],
      selectedDayIndex: this._selectedDayIndex
    };
  }
}

export function createDayTabs(days = ['Dia 1']) {
  return new DayTabs(days);
}
