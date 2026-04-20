import { Alpineable, Eventable } from '../../mixins/ui/index.js';

const ViewMixin = (Base) => Alpineable(Eventable(Base));

export class ViewBase extends ViewMixin(class {}) {}
