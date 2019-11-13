import { expToFunc } from "./Expressions";
import { EventDispatcher } from "./EventDispatcher";
import { Bullet } from "./Bullet";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

class Runner extends EventDispatcher {

  constructor() {
    super();
    this.running = false;
  }

  init(bullet, root, manager, actions, scope) {
    this.running = true;
    this.bullet = bullet;
    this.root = root;
    this.manager = manager;

    const onNewBullet = (params) => {
      const newBullet = Bullet.get();

      newBullet.x = params.initialX;
      newBullet.y = params.initialY;
      newBullet.direction = params.initialDirection;
      newBullet.speed = params.initialSpeed;
      newBullet.parent = this.bullet;

      const newRunner = params.actions.length > 0
        ? Runner.get(newBullet, root, manager, params.actions, params.scope)
        : SimpleRunner.get(newBullet, manager);
      newRunner.on("newbullet", onNewBullet);

      newBullet.runner = newRunner;

      manager.fire("newrunner", newRunner);
      manager.onFire({ bullet: newBullet, runner: newRunner, spec: params.spec });
    };

    if (actions == null) actions = this.root.actions.filter(_ => _.label != null && _.label.startsWith("top"));

    this.topRunners = actions.map(action => {
      const runner = SubRunner.get(bullet, action, root, manager, scope);
      runner.on("newbullet", onNewBullet);
      runner.on("vanish", () => this.fire("vanish"));
      return runner;
    });
  }

  update(deltaTimeMs) {
    if (!this.running) return;
    this.topRunners.forEach(_ => _.update(deltaTimeMs));
  }

  destroy() {
    this.running = false;
    this._dispose();
    this.clearAllListeners();
    this.topRunners.forEach(subRunner => {
      subRunner._dispose();
      subRunner.clearAllListeners();
    });
    this.topRunners.splice(0);
    this.bullet._dispose();
  }

  isCompleted() {
    return !this.topRunners.some(_ => _.isCompleted());
  }

}

class SubRunner extends EventDispatcher {

  constructor() {
    super();
    this.running = false;
    this.chDir = {
      enabled: false,
      frame: 0,
      to: 0,
      delta: 0,
      duration: 0,
      time: 0,
      type: null,
    };
    this.chSpd = {
      enabled: false,
      frame: 0,
      to: 0,
      delta: 0,
      duration: 0,
      time: 0,
      type: null,
    };

    this.acl = {
      enabled: false,
      duration: 0,
      time: 0,
    };
    this.aclH = {
      from: 0,
      to: 0,
      delta: 0,
      type: null,
    };
    this.aclV = {
      from: 0,
      to: 0,
      delta: 0,
      type: null,
    };
  }

  init(bullet, action, root, manager, scope) {
    this.running = true;
    this.currentAction = action;
    this.bullet = bullet;
    this.root = root;
    this.manager = manager;

    this.waitCount = 0;
    this.waitFor = 0;

    this.scopeStack = [];
    if (scope != null) this.scopeStack.push(scope);

    this.lastSpeed = 0;
    this.lastDirection = 0;
    this.velocityH = 0;
    this.velocityV = 0;

    this.chDir.enabled = false;
    this.chDir.frame = 0;
    this.chDir.to = 0;
    this.chDir.delta = 0;
    this.chDir.duration = 0;
    this.chDir.time = 0;
    this.chDir.type = null;

    this.chSpd.enabled = false;
    this.chSpd.frame = 0;
    this.chSpd.to = 0;
    this.chSpd.delta = 0;
    this.chSpd.duration = 0;
    this.chSpd.time = 0;
    this.chSpd.type = null;

    this.acl.enabled = false;
    this.acl.duration = 0;
    this.acl.time = 0;

    this.aclH.from = 0;
    this.aclH.to = 0;
    this.aclH.delta = 0;
    this.aclH.type = null;

    this.aclV.from = 0;
    this.aclV.to = 0;
    this.aclV.delta = 0;
    this.aclV.type = null;

    const gen = function* (node) {
      if (node.name == "actionRef") {
        const scope = this.calcParams(node.params);
        this.scopeStack.push(scope);
        yield* gen(this.findAction(node.label));
        this.scopeStack.pop();
      } else {
        yield node;
        if (node.name == "action") {
          for (let i = 0; i < node.children.length; i++) {
            yield* gen(node.children[i]);
          }
        } else if (node.name == "repeat") {
          const times = this.calcExp(node.times);
          for (let i = 0; i < times; i++) {
            if (node.action) {
              yield* gen(node.action);
            } else if (node.actionRef) {
              const scope = this.calcParams(node.actionRef.params);
              this.scopeStack.push(scope);
              yield* gen(this.findAction(node.actionRef.label));
              this.scopeStack.pop();
            }
          }
        }
      }
    }.bind(this);

    this.generator = gen(action);
    this.iterator = this.generator.next();
  }

  findAction(label) {
    return this.root.actions.find(_ => _.label == label);
  }

  findBullet(label) {
    return this.root.bullets.find(_ => _.label == label);
  }

  findFire(label) {
    return this.root.fires.find(_ => _.label == label);
  }

  isCompleted() {
    return this.iterator.done;
  }

  update(deltaTimeMs) {
    if (!this.running) return;

    const deltaFrame = deltaTimeMs / (1000 / 60);

    this.waitCount += deltaFrame;

    while (!this.iterator.done && this.waitFor <= this.waitCount) {
      this.currentAction = this.iterator.value;
      this.execTask(this.currentAction);
      this.iterator = this.generator.next();
    }

    if (this.chDir.enabled) {
      this.chDir.time += deltaFrame;
      if (this.chDir.time >= this.chDir.duration) this.chDir.enabled = false;

      if (this.chDir.type != "sequence") {
        if (this.chDir.time < this.chDir.duration) {
          this.bullet.direction = this.chDir.from + this.chDir.delta * (this.chDir.time / this.chDir.duration);
        } else {
          this.bullet.direction = this.chDir.to;
        }
      } else {
        this.bullet.direction += this.chDir.delta * deltaFrame;
      }
    }

    if (this.chSpd.enabled) {
      this.chSpd.time += deltaFrame;
      if (this.chSpd.time >= this.chSpd.duration) this.chSpd.enabled = false;

      if (this.chSpd.type != "sequence") {
        if (this.chSpd.time < this.chSpd.duration) {
          this.bullet.speed = this.chSpd.from + this.chSpd.delta * (this.chSpd.time / this.chSpd.duration);
        } else {
          this.bullet.speed = this.chSpd.to;
        }
      } else {
        this.bullet.speed += this.chSpd.delta * deltaFrame;
      }
    }


    if (this.acl.enabled) {
      let velocityH = Math.cos((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed;
      let velocityV = Math.sin((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed;

      this.acl.time += deltaFrame;
      if (this.acl.time >= this.acl.duration) this.acl.enabled = false;

      if (this.aclH.type != "sequence") {
        if (this.acl.time < this.acl.duration) {
          velocityH = this.aclH.from + this.aclH.delta * (this.acl.time / this.acl.duration);
        } else {
          velocityH = this.aclH.to;
        }
      } else {
        velocityH += this.aclH.delta * deltaFrame;
      }

      if (this.aclV.type != "sequence") {
        if (this.acl.time < this.acl.duration) {
          velocityV = this.aclV.from + this.aclV.delta * (this.acl.time / this.acl.duration);
        } else {
          velocityV = this.aclV.to;
        }
      } else {
        velocityV += this.aclV.delta * deltaFrame;
      }

      this.bullet.direction = 90 + Math.atan2(velocityV, velocityH) * RAD_TO_DEG;
      this.bullet.speed = Math.sqrt(Math.pow(velocityH, 2) + Math.pow(velocityV, 2));
    }

    this.bullet.x += Math.cos((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed * deltaFrame;
    this.bullet.y += Math.sin((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed * deltaFrame;
  }

  execTask(node) {
    switch (node.name) {
      case "fire":
        this.execFire(node);
        return;
      case "fireRef":
        this.execFireRef(node);
        return;
      case "changeDirection":
        this.execChangeDirection(node);
        return;
      case "changeSpeed":
        this.execChangeSpeed(node);
        return;
      case "accel":
        this.execAccel(node);
        return;
      case "vanish":
        this.execVanish(node);
        return;
      case "wait":
        this.execWait(node);
        return;
    }
  }

  execFire(node) {
    let bullet;
    let scope;
    if (node.bullet) {
      bullet = node.bullet;
      scope = this.scopeStack[this.scopeStack.length - 1];
    } else if (node.bulletRef) {
      bullet = this.findBullet(node.bulletRef.label);
      scope = this.calcParams(node.bulletRef.params);
    }

    const actions = bullet.actions.map(a => {
      if (a.name == "action") {
        return a;
      } else if (a.name == "actionRef") {
        return this.findAction(a.label);
      }
    });

    let dir = 0;
    const direction = bullet.direction || node.direction;
    if (direction != null) {
      if (node.bulletRef && bullet.direction) this.scopeStack.push(scope);

      if (direction.type == "aim") {
        dir = 90 + Math.atan2(this.manager.getPlayerY() - this.bullet.y, this.manager.getPlayerX() - this.bullet.x) * RAD_TO_DEG + this.calcExp(direction);
      } else if (direction.type == "absolute") {
        dir = this.calcExp(direction);
      } else if (direction.type == "relative") {
        dir = this.bullet.direction + this.calcExp(direction);
      } else if (direction.type == "sequence") {
        dir = this.lastDirection + this.calcExp(direction);
      }

      if (node.bulletRef && bullet.direction) this.scopeStack.pop();
    }

    let spd = 1;
    const speed = bullet.speed || node.speed;
    if (speed != null) {
      if (node.bulletRef && bullet.speed) this.scopeStack.push(scope);

      if (speed.type == "absolute") {
        spd = this.calcExp(speed);
      } else if (speed.type == "relative") {
        spd = this.bullet.speed + this.calcExp(speed);
      } else if (speed.type == "sequence") {
        spd = this.lastSpeed + this.calcExp(speed);
      }

      if (node.bulletRef && bullet.speed) this.scopeStack.pop();
    }

    this.fire("newbullet", {
      initialX: this.bullet.x,
      initialY: this.bullet.y,
      initialDirection: dir,
      initialSpeed: spd,
      actions,
      scope,
      spec: {
        label: bullet.label,
      },
    });

    this.lastDirection = dir;
    this.lastSpeed = spd;
  }

  execFireRef(node) {
    const scope = this.calcParams(node.params);
    this.scopeStack.push(scope);
    this.execFire(this.findFire(node.label));
    this.scopeStack.pop();
  }

  execChangeDirection(node) {
    this.chDir.type = node.direction.type;

    this.chDir.from = this.bullet.direction;
    if (node.direction.type == "aim") {
      this.chDir.to = 90 + Math.atan2(this.manager.getPlayerY() - this.bullet.y, this.manager.getPlayerX() - this.bullet.x) * RAD_TO_DEG + this.calcExp(node.direction);
    } else if (node.direction.type == "absolute") {
      this.chDir.to = this.calcExp(node.direction);
    } else if (node.direction.type == "relative") {
      this.chDir.to = this.chDir.from + this.calcExp(node.direction);
    } else if (node.direction.type == "sequence") {
      let delta = this.calcExp(node.direction);
      while (delta < -180) delta += 360;
      while (180 <= delta) delta -= 360;
      this.chDir.delta = delta;
    }

    if (node.direction.type != "sequence") {
      let delta = this.chDir.to - this.chDir.from;
      while (delta < -180) delta += 360;
      while (180 <= delta) delta -= 360;
      this.chDir.delta = delta;
    }

    this.chDir.time = 0;
    this.chDir.duration = this.calcExp(node.term);
    this.chDir.enabled = true;
  }

  execChangeSpeed(node) {
    this.chSpd.type = node.speed.type;

    this.chSpd.from = this.bullet.speed;
    if (node.speed.type == "absolute") {
      this.chSpd.to = this.calcExp(node.speed);
    } else if (node.speed.type == "relative") {
      this.chSpd.to = this.chSpd.from + this.calcExp(node.speed);
    } else if (node.speed.type == "sequence") {
      this.chSpd.delta = this.calcExp(node.speed);
    }

    if (node.speed.type != "sequence") {
      this.chSpd.delta = this.chSpd.to - this.chSpd.from;
    }

    this.chSpd.time = 0;
    this.chSpd.duration = this.calcExp(node.term);
    this.chSpd.enabled = true;
  }

  execAccel(node) {
    this.aclH.from = Math.cos((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed;
    if (node.horizontal) {
      this.aclH.type = node.horizontal.type;
      if (node.horizontal.type == "absolute") {
        this.aclH.to = this.calcExp(node.horizontal);
      } else if (node.horizontal.type == "relative") {
        this.aclH.to = this.aclH.from + this.calcExp(node.horizontal);
      } else if (node.horizontal.type == "sequence") {
        this.aclH.delta = this.calcExp(node.horizontal);
      }

      if (node.horizontal.type != "sequence") {
        this.aclH.delta = this.aclH.to - this.aclH.from;
      }
    } else {
      this.aclH.type = null;
      this.aclH.to = this.aclH.from;
      this.aclH.delta = 0;
    }

    this.aclV.from = Math.sin((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed;
    if (node.vertical) {
      this.aclV.type = node.vertical.type;
      if (node.vertical.type == "absolute") {
        this.aclV.to = this.calcExp(node.vertical);
      } else if (node.vertical.type == "relative") {
        this.aclV.to = this.aclV.from + this.calcExp(node.vertical);
      } else if (node.vertical.type == "sequence") {
        this.aclV.delta = this.calcExp(node.vertical);
      }

      if (node.vertical.type != "sequence") {
        this.aclV.delta = this.aclV.to - this.aclV.from;
      }
    } else {
      this.aclV.type = null;
      this.aclV.to = this.aclV.from;
      this.aclV.delta = 0;
    }

    this.acl.time = 0;
    this.acl.duration = this.calcExp(node.term);
    this.acl.enabled = true;
  }

  execVanish(node) {
    this.fire("vanish");
    this.waitCount = 0;
    this.waitFor = Number.MAX_VALUE;
  }

  execWait(node) {
    this.waitCount = 0;
    this.waitFor = this.calcExp(node);
  }

  findAction(label) {
    return this.root.actions.find(_ => _.label == label);
  }

  calcParams(params) {
    return params.map(_ => this.calcExp(_));
  }

  calcExp(hasExpression) {
    expToFunc(hasExpression);
    const scope = this.scopeStack[this.scopeStack.length - 1] || [];
    return hasExpression.expFunc(
      this.manager.getRandom(),
      this.manager.getRank(),
      ...scope
    );
  }

}

class SimpleRunner extends EventDispatcher {

  constructor() {
    super();
  }

  init(bullet, manager) {
    this.bullet = bullet;
    this.manager = manager;

    this.dx = Math.cos((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed;
    this.dy = Math.sin((-90 + this.bullet.direction) * DEG_TO_RAD) * this.bullet.speed;
  }

  update(deltaTimeMs) {
    const deltaFrame = deltaTimeMs / (1000 / 60);
    this.bullet.x += this.dx * deltaFrame;
    this.bullet.y += this.dy * deltaFrame;
  }

  destroy() {
    this._dispose();
    this.clearAllListeners();
    this.bullet._dispose();
  }

  isCompleted() {
    return true;
  }

}

Runner.get = (bullet, root, manager, action, scope) => {
  const runner = Runner.pool.get();
  if (runner) {
    runner.init(bullet, root, manager, action, scope);
    return runner;
  }
};

SubRunner.get = (bullet, action, root, manager, scope) => {
  const subRunner = SubRunner.pool.get();
  if (subRunner) {
    subRunner.init(bullet, action, root, manager, scope);
    return subRunner;
  }
};

SimpleRunner.get = (bullet, manager) => {
  const runner = SimpleRunner.pool.get();
  if (runner) {
    runner.init(bullet, manager);
    return runner;
  }
};

export { Runner, SubRunner, SimpleRunner };
