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

export { Action };
