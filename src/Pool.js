class Pool {

  constructor(clazz, count = 500, incr = 100) {
    this.Clazz = pooledMixin(clazz);
    this.incr = incr;

    this.pool = [];
    for (let i = 0; i < count; i++) {
      this.pool.push(new this.Clazz());
    }
  }

  get() {
    const ret = this.pool.find(_ => !_._isActive);
    if (ret) {
      ret._isActive = true;
    } else {
      for (let i = 0; i < this.incr; i++) {
        this.pool.push(new this.Clazz());
      }
      return this.get();
    }
    return ret;
  }

  getCount() {
    return this.pool.filter(_ => !_._isActive).length;
  }

}

const pooledMixin = Base => class extends Base {

  constructor() {
    super();
    this._dispose();
  }

  _dispose() {
    this._isActive = false;
  }

}

export { Pool };
