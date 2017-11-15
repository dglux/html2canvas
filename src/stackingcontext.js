var NodeContainer = require('./nodecontainer');

class StackingContext extends NodeContainer {
  constructor(hasOwnStacking, opacity, element, parent) {
    super(element, parent);

    this.ownStacking = hasOwnStacking;
    this.contexts = [];
    this.children = [];
    this.opacity = (this.parent ? this.parent.stack.opacity : 1) * opacity;
  }

  getParentStack(context) {
    const parentStack = this.parent ? this.parent.stack : null;
    return parentStack ?
      (parentStack.ownStacking ? parentStack : parentStack.getParentStack(context)) :
      context.stack;
  }
}

module.exports = StackingContext;