import { Horizontal } from "./Horizontal";
import { Vertical } from "./Vertical";

class Accel {
  constructor() {
    this.name = "accel";

    this.parent = null;
    this.horizontal = new Horizontal();
    this.vertical = new Vertical();
    this.term = null;
  }
}

export { Accel };
