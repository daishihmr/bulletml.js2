class EventDispatcher {

  constructor() {
    this._listeners = {};
  }

  on(eventType, listener) {
    if (this._listeners[eventType] == null) {
      this._listeners[eventType] = [];
    }
    this._listeners[eventType].push(listener);
  }

  off(eventType, listener) {
    if (this._listeners[eventType] == null) {
      return;
    }
    const idx = this._listeners[eventType].indexOf(listener);
    if (idx >= 0) this._listeners[eventType].splice(idx, 1);
  }

  fire(eventType, params) {
    if (this._listeners[eventType] == null) {
      return;
    }

    this._listeners[eventType].forEach(listener => listener(params));
  }

}

export { EventDispatcher }
