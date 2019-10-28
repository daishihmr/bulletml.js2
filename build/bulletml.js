(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.BulletML = {}));
}(this, function (exports) { 'use strict';

	class Horizontal {
	  constructor() {
	    this.name = "horizontal";

	    this.type = "absolute";
	    this.expression = "0";
	    this.expFunc = null;
	  }
	}

	class Vertical {
	  constructor() {
	    this.name = "vertical";

	    this.type = "absolute";
	    this.expression = "0";
	    this.expFunc = null;
	  }
	}

	class Accel {
	  constructor() {
	    this.name = "accel";

	    this.parent = null;
	    this.horizontal = new Horizontal();
	    this.vertical = new Vertical();
	    this.term = null;
	  }
	}

	class Action {
	  constructor() {
	    this.name = "action";

	    this.label = null;
	    this.parent = null;
	    this.children = [];
	  }

	  add(child) {
	    child.parent = this;
	    this.children.push(child);
	  }
	}

	const EmptyAction = new Action();

	class ActionRef {
	  constructor() {
	    this.name = "actionRef";

	    this.label = null;
	    this.parent = null;
	    this.params = [];
	  }
	}

	class Bullet {
	  constructor() {
	    this.name = "bullet";

	    this.label = null;
	    this.direction = null;
	    this.speed = null;
	    this.actions = [];
	  }
	}

	class BulletRef {
	  constructor() {
	    this.name = "bulletRef";

	    this.label = null;
	    this.params = [];
	  }
	}

	class ChangeDirection {
	  constructor() {
	    this.name = "changeDirection";

	    this.parent = null;
	    this.direction = null;
	    this.term = null;
	  }
	}

	class ChangeSpeed {
	  constructor() {
	    this.name = "changeSpeed";

	    this.parent = null;
	    this.speed = null;
	    this.term = null;
	  }
	}

	class Direction {
	  constructor() {
	    this.name = "direction";

	    this.type = "aim";
	    this.expression = "0";
	    this.expFunc = null;
	  }
	}

	class Speed {
	  constructor() {
	    this.name = "speed";

	    this.type = "absolute";
	    this.expression = "1";
	    this.expFunc = null;

	    this.id = Math.random();
	  }
	}

	class Fire {
	  constructor() {
	    this.name = "fire";

	    this.label = null;
	    this.parent = null;
	    this.direction = new Direction();
	    this.speed = new Speed();
	    this.bullet = null;
	    this.bulletRef = null;
	  }
	}

	class FireRef {
	  constructor() {
	    this.name = "fireRef";

	    this.label = null;
	    this.parent = null;
	    this.params = [];
	  }
	}

	class Param {
	  constructor() {
	    this.name = "param";

	    this.expression = "0";
	    this.expFunc = null;
	  }
	}

	class Repeat {
	  constructor() {
	    this.name = "repeat";

	    this.parent = null;
	    this.times = null;
	    this.action = null;
	    this.actionRef = null;
	  }
	}

	class Root {
	  constructor() {
	    this.name = "bulletml";

	    this.type = "none";
	    this.actions = [];
	    this.bullets = [];
	    this.fires = [];
	  }
	}

	class Term {
	  constructor() {
	    this.name = "term";

	    this.expression = "0";
	    this.expFunc = null;
	  }
	}

	class Times {
	  constructor() {
	    this.name = "times";

	    this.expression = "1";
	    this.expFunc = null;
	  }
	}

	class Vanish {
	  constructor() {
	    this.name = "vanish";

	    this.parent = null;
	  }
	}

	class Wait {
	  constructor() {
	    this.name = "wait";

	    this.parent = null;
	    this.expression = "0";
	    this.expFunc = null;
	  }
	}

	const parse = (doc) => {
	  if (typeof (doc) == "string") {
	    const parser = new DOMParser();
	    doc = parser.parseFromString(doc, "application/xml");
	  }

	  if (doc.querySelector("parsererror")) {
	    console.error("parser error\n" + doc.querySelector("parsererror").children[1].textContent);
	    throw "パースエラー";
	  }

	  if (doc.children[0].nodeName == "bulletml") {
	    return parseRoot(doc.children[0]);
	  } else {
	    return null;
	  }
	};

	const parseRoot = (element) => {
	  const root = new Root();

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "action":
	        root.actions.push(parseAction(child));
	        break;
	      case "bullet":
	        root.bullets.push(parseBullet(child));
	        break;
	      case "fire":
	        root.fires.push(parseFire(child));
	        break;
	    }
	  }

	  return root;
	};

	const parseAction = (element) => {
	  const action = new Action();
	  if (element.hasAttribute("label")) {
	    action.label = element.attributes.label.value;
	  }

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "repeat":
	        action.add(parseRepeat(child));
	        break;
	      case "fire":
	        action.add(parseFire(child));
	        break;
	      case "fireRef":
	        action.add(parseFireRef(child));
	        break;
	      case "changeSpeed":
	        action.add(parseChangeSpeed(child));
	        break;
	      case "changeDirection":
	        action.add(parseChangeDirection(child));
	        break;
	      case "accel":
	        action.add(parseAccel(child));
	        break;
	      case "wait":
	        action.add(parseWait(child));
	        break;
	      case "vanish":
	        action.add(parseVanish());
	        break;
	      case "action":
	        action.add(parseAction(child));
	        break;
	      case "actionRef":
	        action.add(parseActionRef(child));
	        break;
	    }
	  }

	  return action;
	};

	const parseRepeat = (element) => {
	  const repeat = new Repeat();

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "times":
	        repeat.times = parseTimes(child);
	        break;
	      case "action":
	        repeat.action = parseAction(child);
	        break;
	      case "actionRef":
	        repeat.actionRef = parseActionRef(child);
	        break;
	    }
	  }

	  return repeat;
	};

	const parseTimes = (element) => {
	  const times = new Times();
	  times.expression = element.textContent.trim();
	  return times;
	};

	const parseTerm = (element) => {
	  const term = new Term();
	  term.expression = element.textContent.trim();
	  return term;
	};

	const parseParam = (element) => {
	  const param = new Param();
	  param.expression = element.textContent.trim();
	  return param;
	};

	const parseSpeed = (element) => {
	  const speed = new Speed();
	  if (element.hasAttribute("type")) {
	    speed.type = element.attributes.type.value;
	  }
	  speed.expression = element.textContent.trim();
	  return speed;
	};

	const parseDirection = (element) => {
	  const direction = new Direction();
	  if (element.hasAttribute("type")) {
	    direction.type = element.attributes.type.value;
	  }
	  direction.expression = element.textContent.trim();
	  return direction;
	};

	const parseHorizontal = (element) => {
	  const horizontal = new Horizontal();
	  if (element.hasAttribute("type")) {
	    horizontal.type = element.attributes.type.value;
	  }
	  horizontal.expression = element.textContent.trim();
	  return horizontal;
	};

	const parseVertical = (element) => {
	  const vertical = new Vertical();
	  if (element.hasAttribute("type")) {
	    vertical.type = element.attributes.type.value;
	  }
	  vertical.expression = element.textContent.trim();
	  return vertical;
	};

	const parseWait = (element) => {
	  const wait = new Wait();
	  wait.expression = element.textContent.trim();
	  return wait;
	};

	const parseVanish = (element) => {
	  const vanish = new Vanish();
	  return vanish;
	};

	const parseBullet = (element) => {
	  const bullet = new Bullet();

	  if (element.hasAttribute("label")) {
	    bullet.label = element.attributes.label.value;
	  }

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "speed":
	        bullet.speed = parseSpeed(child);
	        break;
	      case "direction":
	        bullet.direction = parseDirection(child);
	        break;
	      case "action":
	        bullet.actions.push(parseAction(child));
	        break;
	      case "actionRef":
	        bullet.actions.push(parseActionRef(child));
	        break;
	    }
	  }

	  return bullet;
	};

	const parseFire = (element) => {
	  const fire = new Fire();

	  if (element.hasAttribute("label")) {
	    fire.label = element.attributes.label.value;
	  }

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "speed":
	        fire.speed = parseSpeed(child);
	        break;
	      case "direction":
	        fire.direction = parseDirection(child);
	        break;
	      case "bullet":
	        fire.bullet = parseBullet(child);
	        break;
	      case "bulletRef":
	        fire.bulletRef = parseBulletRef(child);
	        break;
	    }
	  }

	  return fire;
	};

	const parseActionRef = (element) => {
	  const actionRef = new ActionRef();
	  if (element.hasAttribute("label")) {
	    actionRef.label = element.attributes.label.value;
	  }

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    if (child.nodeName == "param") {
	      actionRef.params.push(parseParam(child));
	    }
	  }

	  return actionRef;
	};

	const parseBulletRef = (element) => {
	  const bulletRef = new BulletRef();
	  if (element.hasAttribute("label")) {
	    bulletRef.label = element.attributes.label.value;
	  }

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    if (child.nodeName == "param") {
	      bulletRef.params.push(parseParam(child));
	    }
	  }

	  return bulletRef;
	};

	const parseFireRef = (element) => {
	  const fireRef = new FireRef();
	  if (element.hasAttribute("label")) {
	    fireRef.label = element.attributes.label.value;
	  }

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    if (child.nodeName == "param") {
	      fireRef.params.push(parseParam(child));
	    }
	  }

	  return fireRef;
	};

	const parseChangeSpeed = (element) => {
	  const changeSpeed = new ChangeSpeed();

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "speed":
	        changeSpeed.speed = parseSpeed(child);
	        break;
	      case "term":
	        changeSpeed.term = parseTerm(child);
	        break;
	    }
	  }

	  return changeSpeed;
	};

	const parseChangeDirection = (element) => {
	  const changeDirection = new ChangeDirection();

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "direction":
	        changeDirection.direction = parseDirection(child);
	        break;
	      case "term":
	        changeDirection.term = parseTerm(child);
	        break;
	    }
	  }

	  return changeDirection;
	};

	const parseAccel = (element) => {
	  const accel = new Accel();

	  for (let i = 0; i < element.childElementCount; i++) {
	    const child = element.children[i];
	    switch (child.nodeName) {
	      case "horizontal":
	        accel.horizontal = parseHorizontal(child);
	        break;
	      case "vertical":
	        accel.vertical = parseVertical(child);
	        break;
	      case "term":
	        accel.term = parseTerm(child);
	        break;
	    }
	  }

	  return accel;
	};

	const expToFunc = (hasExpression) => {
	  if (hasExpression.expFunc == null) {
	    hasExpression.expFunc = toFunc(hasExpression.expression);
	  }};

	const toFunc = (str) => {
	  if (!str) {
	    return () => 0;
	  } else if (typeof (str) == "number") {
	    return () => str;
	  } else if (!Number.isNaN(Number(str))) {
	    const value = Number(str);
	    return () => value;
	  } else {
	    check(str);
	    return new Function(["$rand", "$rank", "$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8"], "return " + str);
	  }
	};

	const check = (str) => {
	  // 危険なコードをブロックしたい気持ち
	  assert(str.indexOf("=") < 0);
	  assert(str.indexOf("{") < 0);
	  assert(str.indexOf("}") < 0);
	  assert(str.indexOf(":") < 0);
	  assert(str.indexOf("window") < 0);
	  assert(str.indexOf("location") < 0);
	  assert(str.indexOf("navigator") < 0);
	  assert(str.indexOf("document") < 0);
	};

	const assert = (bool) => {
	  if (!bool) throw "AssertionError";
	};

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

	class Bullet$1 {

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

	  onVanish() {}

	}

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
	      const newBullet = new Bullet$1();
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

	exports.Bullet = Bullet$1;
	exports.Manager = Manager;
	exports.Runner = Runner;
	exports.parse = parse;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=bulletml.js.map
