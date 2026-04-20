import { Actorlike, Alpineable, Eventable } from '../../mixins/ui/index.js';

const UIContainerMixin = (Base) => Alpineable(Eventable(Actorlike(Base)));

export class UIContainerBase extends UIContainerMixin(class {}) {}
