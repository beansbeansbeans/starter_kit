import Tree from './tree'
import treeHelpers from './helpers'
const { constraintCheck, value, isTrue, isFalse, forwardProp, backProp } = treeHelpers

export default class AsyncTree extends Tree {
  * traverseUpAsync(fn, seed) {
    if(typeof seed === 'undefined') seed = this._root

    function* apply(n) {
      if(fn(n)) return false

      yield n

      if(n.parent) yield* apply(n.parent)
    }

    yield* apply(seed)
  }

  * traverseDFAsync(matchFn, seed) {
    if(typeof seed === 'undefined') seed = this._root

    function* iterate(node) {
      for(let i=0; i<node.children.length; i++) {
        let child = node.children[i]
        
        if(matchFn(child)) {
          return false
        }

        yield child
        yield* iterate(child)
      }        
    }

    let result = matchFn(seed)
    yield seed

    if(result) {
      yield false
    } else if(seed.children.length) {
      yield* iterate(seed)
    }
  }

  * solveAsync(arr) {
    let consistent = true, 
      self = this

    const resolve = constraintCheck(forwardProp)

    for(let i=0; i<arr.length; i++) {
      console.log(i)
      const { node, value } = arr[i]

      node.value = value

      console.log("------------------")
      console.log("traversing down", i)
      yield * self.traverseDFAsync(resolve, node)

      console.log("------------------")
      console.log("traversing up", i)
      yield * self.traverseUpAsync(constraintCheck(backProp), node.parent)
    }

    console.log("------------------")
    console.log("traversing down from root")
    yield * self.traverseDFAsync(resolve)

    console.log("------------------")
    console.log("traversing down with forward prop")
    yield * self.traverseDFAsync(constraintCheck(forwardProp, false))
  }
}