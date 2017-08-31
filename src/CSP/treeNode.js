import randomModule from '../helpers/random'
const random = randomModule.random(42)

export default class Node {
  constructor(val, supports, extraData = {}, id) {
    this._id = typeof id === 'undefined' ? uuid.v4() : id
    
    this.data = val
    this.children = []
    this.leaves = 0
    this.supports = supports
    this.extraData = extraData  
    this.approbation = random.nextDouble() * 60
  }
}