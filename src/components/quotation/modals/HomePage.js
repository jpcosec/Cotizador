import { ViewBase } from '../../common/base/ui/ViewBase.js';

const DEFAULT_ACTIONS = [
  { id: 'NEW_QUOTATION', label: 'New Quotation', icon: 'sparkles' },
  { id: 'LOAD_PREVIOUS', label: 'Load Previous', icon: 'history' },
  { id: 'VIEW_DATABASE', label: 'View Database', icon: 'database' }
];

export class HomePage extends ViewBase {
  constructor(actions = DEFAULT_ACTIONS) {
    super();
    this._actions = [...actions];
  }

  isVisible() {
    return true;
  }

  getActions() {
    return [...this._actions];
  }

  clickAction(actionId) {
    this.emit(actionId, { action: actionId });
    return this;
  }

  toDisplayObject() {
    return {
      actions: this.getActions(),
      isVisible: this.isVisible()
    };
  }
}

export function createHomePage() {
  return new HomePage();
}
