import { Runner, SubRunner } from "./Runner";
import { Bullet } from "./Bullet";

class Pool {

  constructor(runnerCount = 50, subRunnerCount = 500, bulletCount = 500) {
    this.runnerPool = [];
    for (let i = 0; i < runnerCount; i++) {
      this.runnerPool.push(new Runner());
    }

    this.subRunnerPool = [];
    for (let i = 0; i < subRunnerCount; i++) {
      this.runnerPool.push(new SubRunner());
    }

    this.bulletPool = [];
    for (let i = 0; i < bulletCount; i++) {
      this.runnerPool.push(new Bullet());
    }
  }

}

export { Pool };
