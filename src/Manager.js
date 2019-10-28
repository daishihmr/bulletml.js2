import { Runner } from "./Runner";
import { EventDispatcher } from "./EventDispatcher";

class Manager extends EventDispatcher {

  constructor(params) {
    super();
    this.init(params);
  }

  init(params) {
    this.player = params.player;
    this.rank = 0;
    this.runners = [];
    this.toRemove = [];

    this.on("newrunner", (runner) => {
      runner.on("vanish", () => {
        this.remove(runner);
        runner.bullet.onVanish();
      });
      this.runners.push(runner);
    });
  }

  update(deltaTimeMs = 1000 / 60) {
    this.runners.forEach(_ => _.update(deltaTimeMs));

    this.toRemove.forEach(r => {
      const idx = this.runners.indexOf(r);
      if (idx >= 0) this.runners.splice(idx, 1);
    });
    this.toRemove.length = 0;
  }

  getPlayerX() {
    return this.player.x;
  }

  getPlayerY() {
    return this.player.y;
  }

  getRank() {
    return this.rank;
  }

  getRandom() {
    return Math.random();
  }

  run(bullet, root) {
    const runner = new Runner(bullet, root, this);
    this.fire("newrunner", runner);
    return runner;
  }

  remove(runner) {
    this.toRemove.push(runner);
  }

  createNewBullet(params) {
    return null;
  }

}

export { Manager };
