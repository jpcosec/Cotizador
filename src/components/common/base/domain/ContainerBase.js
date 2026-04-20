import { Actorlike, Alpineable } from '../../mixins/ui/index.js';
import { Aggregable, Rulable, Storable } from '../../mixins/domain/index.js';

const ContainerMixin = (Base) => Alpineable(Storable(Rulable(Aggregable(Actorlike(Base)))));

export class ContainerBase extends ContainerMixin(class {}) {}
