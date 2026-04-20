import { ViewBase } from '../../common/base/ui/ViewBase.js';

export class ValidationSummary extends ViewBase {
  constructor(lines = []) {
    super();
    this._lines = [...lines];
  }

  setLines(lines = []) {
    this._lines = [...lines];
    return this;
  }

  confirm() {
    this.emit('SUMMARY_CONFIRMED', { lines: [...this._lines] });
    return this;
  }

  toDisplayObject() {
    return {
      lines: [...this._lines],
      count: this._lines.length
    };
  }
}

export function createValidationSummary(lines = []) {
  return new ValidationSummary(lines);
}
