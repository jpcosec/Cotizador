/**
 * XStateable mixin — thin wrapper for XState actor communication.
 *
 * Usage: class Foo extends XStateable(Base) { ... }
 *
 * Domain objects can hold a reference to the XState actor ref
 * so they can send events back to the machine when needed.
 * The actor ref is optional — classes work fine without one.
 */
export function XStateable(Base) {
  return class extends Base {
    _actorRef = null;

    setActorRef(ref) {
      this._actorRef = ref;
      return this;
    }

    sendEvent(type, payload = {}) {
      if (this._actorRef && typeof this._actorRef.send === 'function') {
        this._actorRef.send({ type, ...payload });
      }
    }

    get hasActorRef() {
      return this._actorRef !== null;
    }
  };
}
