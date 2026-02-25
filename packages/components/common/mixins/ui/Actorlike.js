export function Actorlike(Base) {
  return class extends Base {
    _actorRef = null;

    setActorRef(actorRef) {
      this._actorRef = actorRef ?? null;
      return this;
    }

    sendEvent(type, payload = {}) {
      if (this._actorRef && typeof this._actorRef.send === 'function') {
        this._actorRef.send({ type, ...payload });
      }
      return this;
    }

    getSnapshot() {
      return this._actorRef?.getSnapshot?.();
    }

    subscribe(callback) {
      return this._actorRef?.subscribe?.(callback);
    }

    get hasActorRef() {
      return this._actorRef !== null;
    }
  };
}
