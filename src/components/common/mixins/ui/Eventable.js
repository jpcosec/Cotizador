export function Eventable(Base) {
  return class extends Base {
    _listeners = {};

    on(eventName, callback) {
      if (!this._listeners[eventName]) {
        this._listeners[eventName] = [];
      }

      this._listeners[eventName].push(callback);
      return this;
    }

    emit(eventName, data) {
      const callbacks = this._listeners[eventName] ?? [];
      for (const callback of callbacks) {
        callback(data);
      }
      return this;
    }

    off(eventName, callback) {
      const callbacks = this._listeners[eventName] ?? [];
      this._listeners[eventName] = callbacks.filter((item) => item !== callback);
      return this;
    }
  };
}
