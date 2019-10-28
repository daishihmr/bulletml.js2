import { Direction } from "./Direction";
import { Speed } from "./Speed";

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

export { Fire };
