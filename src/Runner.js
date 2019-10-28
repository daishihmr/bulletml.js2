import { expToFunc } from "./Expressions";
import { EventDispatcher } from "./EventDispatcher";
import { Bullet } from "./Bullet";
import { EmptyAction } from "./element/Action";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

class Runner extends EventDispatcher {

  constructor(bullet, root, manager, action, scope) {
    super();
    this.running = false;
    this.init(bullet, root, manager, action, scope);
  }

  init(bullet, root, manager, actions, scope) {
    this.running = true;
    this.bullet = bullet;
    this.root = root;
    this.manager = manager;

    const onNewBullet = (params) => {
      const newBullet = new Bullet();
      newBullet.x = params.initialX;
      newBullet.y = params.initialY;
      newBullet.direction = params.initialDirection;
      newBullet.speed = params.initialSpeed;
      newBullet.parent = this.bullet;

      const newRunner = new Runner(newBullet, root, manager, params.actions, params.scope);
      newRunner.on("newbullet", onNewBullet);

      newBullet.runner = newRunner;

      manager.fire("newrunner", newRunner);
      manager.onFire({ bullet: newBullet, runner: newRunner, spec: params.spec });
    };

    if (actions == null) actions = this.root.actions.filter(_ => _.label != null && _.label.startsWith("top"));

    this.topRunners = actions.map(action => {
      const runner = new SubRunner(bullet, action, root, manager, scope);
      runner.on("newbullet", onNewBullet);
      runner.on("vanish", () => this.fire("vanish"));
      return runner;
    });
  }

  update(deltaTimeMs) {
    if (!this.running) return;
    this.topRunners.forEach(_ => _.update(deltaTimeMs));
  }

  isDone() {
    return !this.topRunners.some(_ => _.isDone());
  }

}

class SubRunner extends EventDispatcher {

  constructor(bullet, action, root, manager, scope) {
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
    };
    this.acl = {
      enabled: false,
      accelV: 0,
      accelH: 0,
      duration: 0,
      time: 0,
    };
    this.init(bullet, action, root, manager, scope);
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

    this.acl.enabled = false;
    this.acl.accelV = 0;
    this.acl.accelH = 0;
    this.acl.duration = 0;
    this.acl.time = 0;

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

  isDone() {
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
      if (this.chDir.type != "sequence") {
        this.chDir.time += deltaFrame;
        if (this.chDir.time < this.chDir.duration) {
          this.bullet.direction = this.chDir.from + this.chDir.delta * (this.chDir.time / this.chDir.duration);
        } else {
          this.bullet.direction = this.chDir.to;
          this.chDir.enabled = false;
        }
      } else {
        this.bullet.direction += this.chDir.delta * deltaFrame;
        if (this.chDir.time >= this.chDir.duration) {
          this.chDir.enabled = false;
        }
      }
    }

    if (this.chSpd.enabled) {
      this.chSpd.time += deltaFrame;
      if (this.chSpd.time < this.chSpd.duration) {
        this.bullet.speed = this.chSpd.from + this.chSpd.delta * (this.chSpd.time / this.chSpd.duration);
      } else {
        this.bullet.speed = this.chSpd.to;
        this.chSpd.enabled = false;
      }
    }
    if (this.acl.enabled) {
      this.acl.time += deltaFrame;
      if (this.acl.time <= this.acl.duration) {
        this.speed += Math.sqrt(Math.pow(this.acl.accelH * deltaFrame, 2) + Math.pow(this.acl.accelV * deltaFrame, 2));
      } else {
        this.acl.enabled = false;
      }
    }

    this.bullet.x += Math.cos(this.bullet.direction * DEG_TO_RAD) * this.bullet.speed * deltaFrame;
    this.bullet.y += Math.sin(this.bullet.direction * DEG_TO_RAD) * this.bullet.speed * deltaFrame;
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
      this.scopeStack.push(scope);
    }

    let actions;
    if (bullet.actions.length > 0) {
      actions = bullet.actions.map(a => {
        if (a.name == "action") {
          return a;
        } else if (a.name == "actionRef") {
          return this.findAction(a.label);
        }
      });
    } else {
      actions = [EmptyAction];
    }

    let dir = 0;
    const direction = bullet.direction || node.direction;
    if (direction != null) {
      if (direction.type == "aim") {
        dir = Math.atan2(this.manager.getPlayerY() - this.bullet.y, this.manager.getPlayerX() - this.bullet.x) * RAD_TO_DEG + this.calcExp(direction);
      } else if (direction.type == "absolute") {
        dir = -90 + this.calcExp(direction);
      } else if (direction.type == "relative") {
        dir = this.bullet.direction + this.calcExp(direction);
      } else if (direction.type == "sequence") {
        dir = this.lastDirection + this.calcExp(direction);
      }
    }

    let spd = 1;
    const speed = bullet.speed || node.speed;
    if (speed != null) {
      if (speed.type == "absolute") {
        spd = this.calcExp(speed);
      } else if (speed.type == "relative") {
        spd = this.bullet.speed + this.calcExp(speed);
      } else if (speed.type == "sequence") {
        spd = this.lastSpeed + this.calcExp(speed);
      }
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

    if (node.bulletRef) {
      this.scopeStack.pop();
    }
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
      this.chDir.to = Math.atan2(this.manager.getPlayerY() - this.bullet.y, this.manager.getPlayerX() - this.bullet.x) * RAD_TO_DEG + this.calcExp(node.direction);
    } else if (node.direction.type == "absolute") {
      this.chDir.to = -90 + this.calcExp(node.direction);
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
    this.chSpd.from = this.bullet.speed;
    if (node.speed.type == "absolute") {
      this.chSpd.to = this.calcExp(node.speed);
    } else if (node.speed.type == "relative") {
      this.chSpd.to = this.chSpd.from + this.calcExp(node.speed);
    } else if (node.speed.type == "sequence") {
      this.chSpd.to = this.lastSpeed + this.calcExp(node.speed);
    }
    this.chSpd.delta = this.chSpd.to - this.chSpd.from;
    this.chSpd.time = 0;
    this.chSpd.duration = this.calcExp(node.term);
    this.chSpd.enabled = true;
  }

  execAccel(node) {
    if (node.horizontal.type == "absolute") {
      this.acl.accelH = this.calcExp(node.horizontal);
    } else if (node.horizontal.type == "relative") {
      // TODO
      this.acl.accelH = this.calcExp(node.horizontal);
    } else if (node.horizontal.type == "sequence") {
      // TODO
      this.acl.accelH = this.calcExp(node.horizontal);
    }

    if (node.vertical.type == "absolute") {
      this.acl.accelV = this.calcExp(node.vertical);
    } else if (node.vertical.type == "relative") {
      // TODO
      this.acl.accelV = this.calcExp(node.vertical);
    } else if (node.vertical.type == "sequence") {
      // TODO
      this.acl.accelV = this.calcExp(node.vertical);
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

export { Runner, SubRunner };
