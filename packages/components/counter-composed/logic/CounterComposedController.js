import { UIContainerBase } from '../../common/base/ui/UIContainerBase.js';

export class CounterComposedController extends UIContainerBase {
  constructor(actors) {
    super();
    if (!actors) {
      throw new Error('CounterComposedController requires actors');
    }
    this._actors = actors;
    this._subscriptions = [];
    this.globalCount = 0;
    this.localA = 0;
    this.localB = 0;
    this.totalA = 0;
    this.totalB = 0;
    this.syncFromActors();
  }

  initSubscriptions(onChange = () => {}) {
    this.destroy();

    const syncAndNotify = () => {
      this.syncFromActors();
      onChange(this.toDisplayObject());
    };

    this._subscriptions = [
      this._actors.global.subscribe(syncAndNotify),
      this._actors.childA.subscribe(syncAndNotify),
      this._actors.childB.subscribe(syncAndNotify)
    ];

    syncAndNotify();
    return this;
  }

  destroy() {
    for (const unsubscribe of this._subscriptions) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }

    this._subscriptions = [];
    return this;
  }

  syncFromActors() {
    this.globalCount = this._actors.global.getSnapshot().context.count;
    this.localA = this._actors.childA.getSnapshot().context.count;
    this.localB = this._actors.childB.getSnapshot().context.count;
    this.totalA = this.globalCount + this.localA;
    this.totalB = this.globalCount + this.localB;
    return this;
  }

  incrementGlobal() {
    this._actors.global.send({ type: 'INCREMENT' });
    return this;
  }

  decrementGlobal() {
    this._actors.global.send({ type: 'DECREMENT' });
    return this;
  }

  resetGlobal() {
    this._actors.global.send({ type: 'RESET' });
    return this;
  }

  incrementA() {
    this._actors.childA.send({ type: 'INCREMENT' });
    return this;
  }

  decrementA() {
    this._actors.childA.send({ type: 'DECREMENT' });
    return this;
  }

  resetA() {
    this._actors.childA.send({ type: 'RESET' });
    return this;
  }

  incrementB() {
    this._actors.childB.send({ type: 'INCREMENT' });
    return this;
  }

  decrementB() {
    this._actors.childB.send({ type: 'DECREMENT' });
    return this;
  }

  resetB() {
    this._actors.childB.send({ type: 'RESET' });
    return this;
  }

  toDisplayObject() {
    return {
      globalCount: this.globalCount,
      localA: this.localA,
      localB: this.localB,
      totalA: this.totalA,
      totalB: this.totalB
    };
  }
}
