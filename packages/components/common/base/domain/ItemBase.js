import { Actorlike, Alpineable } from '../../mixins/ui/index.js';
import { Prizable, Rulable, Storable } from '../../mixins/domain/index.js';

const ItemMixin = (Base) => Alpineable(Storable(Rulable(Prizable(Actorlike(Base)))));

export class ItemBase extends ItemMixin(class {}) {}
