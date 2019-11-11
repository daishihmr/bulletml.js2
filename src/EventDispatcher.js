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

  fire(eventType, params) {
    if (this._listeners[eventType] == null) {
      return;
    }

    this._listeners[eventType].forEach(listener => listener(params));
  }

  clearAllListeners() {
    for (let eventType in this._listeners) {
      this._listeners[eventType].splice(0);
    }
  }

}

export { EventDispatcher }
