class Bullet {

  static get() {
    const bullet = new Bullet();
    bullet.init();
    return bullet;
  }

  constructor() {
    this.init();
  }

  init() {
    this.x = 0;
    this.y = 0;
    this.direction = 0;
    this.speed = 0;
    this.runner = null;
    this.parent = null;
  }

  destroy() {
    this.runner.manager.remove(this.runner);
  }

  onVanish() { }

}

export { Bullet };