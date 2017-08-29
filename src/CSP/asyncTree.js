import randomModule from '../helpers/random'
const random = randomModule.random(42)
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

  * traverseChildrenAsync(matchFn, seed) {
    let match
    for(let i=0; i<seed.children.length; i++) {
      console.log("traverse child", i, seed.children[i].data)
      let result = matchFn(seed.children[i])
      console.log(result)
      console.log("YIELDING")
      yield result

      if(result) {
        match = result
        break
      }
    }

    console.log("YIELDING OUTCOME OF CHILDREN TRAVERSAL")
    console.log(match)
    yield match
  }

  * traverseRandomAsync(matchFn, seed) {
    function* iterate(node) {
      let randomChild = node.children[Math.floor(random.nextDouble() * node.children.length)]

      matchFn(randomChild)

      yield randomChild
      yield* iterate(randomChild)
    }

    yield seed

    if(seed.children.length) {
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

  * resolveAsync() { // is the root warranted?
    let self = this

    function* isWarranted(node) {
      console.log("is warranted?", node)
      if(!node.children.length) yield true

      const warrantedAttacker = yield * self.traverseChildrenAsync(n => {
        console.log('in match fn', n.data)
        if(n.supports) return false

        if(n && (!n.children.length || isWarranted(n))) return true

        return false
      }, node)

      if(warrantedAttacker) return false
      return true
    }

    if(yield * isWarranted(this._root)) {
      console.log("root warranted")
    } else {
      console.log("root defeated")
    }
  }
}