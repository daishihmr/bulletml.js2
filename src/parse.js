import { Accel } from "./element/Accel.js";
import { Action } from "./element/Action.js";
import { ActionRef } from "./element/ActionRef.js";
import { Bullet } from "./element/Bullet.js";
import { BulletRef } from "./element/BulletRef.js";
import { ChangeDirection } from "./element/ChangeDirection.js";
import { ChangeSpeed } from "./element/ChangeSpeed.js";
import { Direction } from "./element/Direction.js";
import { Fire } from "./element/Fire.js";
import { FireRef } from "./element/FireRef.js";
import { Horizontal } from "./element/Horizontal.js";
import { Param } from "./element/Param.js";
import { Repeat } from "./element/Repeat.js";
import { Root } from "./element/Root.js";
import { Speed } from "./element/Speed.js";
import { Term } from "./element/Term.js";
import { Times } from "./element/Times.js";
import { Vanish } from "./element/Vanish.js";
import { Vertical } from "./element/Vertical.js";
import { Wait } from "./element/Wait.js";

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
        action.add(parseVanish(child));
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

export { parse };
