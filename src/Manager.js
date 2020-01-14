import { Runner, SubRunner, SimpleRunner } from "./Runner";
import { EventDispatcher } from "./EventDispatcher";
import { Bullet } from "./Bullet";
import { Pool } from "./Pool";

const MS = 1000 / 60;

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

    if (Runner.pool == null) Runner.pool = new Pool(Runner, params.runnerPoolCount || 500, params.runnerPoolIncr || 100);
    if (SubRunner.pool == null) SubRunner.pool = new Pool(SubRunner, params.subRunnerPoolCount || 1500, params.subRunnerPoolIncr || 100);
    if (SimpleRunner.pool == null) SimpleRunner.pool = new Pool(SimpleRunner, params.simpleRunnerPoolCount || 500, params.simpleRunnerPoolIncr || 100);
    if (Bullet.pool == null) Bullet.pool = new Pool(Bullet, params.bulletPoolCount || 500, params.bulletPoolIncr || 100);
  }

  update(deltaTimeMs = MS) {
    this.runners.forEach(_ => _.update(deltaTimeMs));

    for (let i = 0, len = this.toRemove.length; i < len; i++) {
      const r = this.toRemove[i];
      const idx = this.runners.indexOf(r);
      if (idx >= 0) {
        this.runners.splice(idx, 1);
      }
      r.destroy();
    }

    this.toRemove.splice(0);
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
    const runner = Runner.get(bullet, root, this);
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
