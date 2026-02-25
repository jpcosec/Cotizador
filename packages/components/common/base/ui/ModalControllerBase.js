import {
  Alpineable,
  Eventable,
  Formable,
  Modalable,
  Serviceable
} from '../../mixins/ui/index.js';

const ModalControllerMixin = (Base) =>
  Alpineable(Eventable(Serviceable(Formable(Modalable(Base)))));

export class ModalControllerBase extends ModalControllerMixin(class {}) {}
