export default class Node {
  constructor(val, supports, extraData, id) {
    this._id = typeof id === 'undefined' ? uuid.v4() : id
    
    this.data = val
    this.children = []
    this.leaves = 0
    this.supports = supports
    this.extraData = extraData    
  }
}