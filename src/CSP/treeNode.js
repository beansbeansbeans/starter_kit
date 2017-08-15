export default class Node {
  constructor(val, supports, extraData) {
    this.data = val
    this.children = []
    this.leaves = 0
    this._id = uuid.v4()
    this.supports = supports
    this.extraData = extraData    
  }
}