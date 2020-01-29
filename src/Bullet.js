class Bullet {

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
    if (this.runner) this.runner.manager.remove(this.runner);
  }

  onVanish() { }

}

Bullet.get = () => {
  const bullet = Bullet.pool.get();
  if (bullet) {
    bullet.init();
    return bullet;
  }
};

export { Bullet };