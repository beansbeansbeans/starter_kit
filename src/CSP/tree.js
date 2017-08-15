import randomModule from '../helpers/random'
const random = randomModule.random(42)
import treeHelpers from './helpers'
const { constraintCheck, value, isTrue, isFalse, forwardProp, backProp } = treeHelpers
import Node from './treeNode'

export default class Tree {
  constructor(val, extraData) {
    this._root = new Node(val, null, extraData)
    this._root.depth = 0    
  }

  traverseUp(fn, seed) {
    if(typeof seed === 'undefined') seed = this._root

    const apply = n => {
      if(fn(n)) return n

      if(n.parent) return apply(n.parent)

      return false
    }

    return apply(seed)    
  }

  traverseDF(matchFn, seed, find = false) {
    if(typeof seed === 'undefined') seed = this._root

    if(matchFn(seed)) return seed

    return seed.children.reduce((acc, curr) => {
      if(find && matchFn(acc)) return acc

      return this.traverseDF(matchFn, curr, find)
    }, false)  
  }

  traverseBF(matchFn, seed) {
    if(typeof seed === 'undefined') seed = this._root

    let match, toSearch = [seed]

    function walk() {
      let newToSearch = []

      for(let i=0; i<toSearch.length; i++) {
        let node = toSearch[i]

        if(matchFn(node)) {
          match = node
          break
        }

        node.children.forEach(c => newToSearch.push(c))
      }

      toSearch = newToSearch

      if(!match && toSearch.length) walk()
    }

    walk()

    return match
  }

  countLeaves() {
    return this._root.leaves
  }

  getDepth() {
    let maxDepth = 0
    this.traverseDF(n => {
      if(n.depth > maxDepth) {
        maxDepth = n.depth
      }
    })

    return maxDepth + 1    
  }

  find(data, property = 'data') {
    return this.traverseDF(node => node[property] === data, this._root, true)
  }

  add(n, parent) {
    let leaves = Math.max(1, n.leaves)

    if(!n.supports) {
      parent.children.push(n)
    } else {
      parent.children.unshift(n)
    }

    n.parent = parent
    n.depth = parent.depth + 1

    if(parent.children.length > 1) {
      this.traverseUp(node => {
        if(node._id !== n._id) node.leaves += leaves }, n)    
    } else {
      parent.leaves += leaves
    }    
  }

  addBack(node) {
    const parent = node.parent
    const children = node.children
    const leaves = children.reduce((acc, curr) => acc + Math.max(1, curr.leaves), 0)

    for(let i=0; i<children.length; i++) {
      this.remove(children[i])
    }

    for(let i=0; i<children.length; i++) {
      children[i].parent = node
    }

    node.leaves = leaves
    this.add(node, parent)

    this.traverseBF(n => {
      if(n._id !== node._id) {
        n.depth++
      }

      return false
    }, node)
  }

  remove(node) {
    let children = node.parent.children, 
      leaves = Math.max(1, node.leaves)

    if(children.length === 1 && node.children.length < 2) { // if this is an only child, and it has one leaf or fewer...
      node.parent.leaves--
    } else {
      this.traverseUp(n => {
        if(n._id !== node._id) {
          n.leaves -= leaves
        }
        return false
      }, node)
    }

    let index = children.map(c => c._id).indexOf(node._id)
    children.splice(index, 1)    
  }

  removeSingle(node) {
    const parent = node.parent
    const children = node.children

    this.traverseBF(n => {
      if(n._id !== node._id) {
        n.depth--
      }

      return false
    }, node)

    this.remove(node)

    for(let i=0; i<children.length; i++) {
      this.add(children[i], parent)
    }
  }

  solve(arr) {
    /*
    so the solution process is: 
    - we fix the value of the argument node. 
    - if it's true, then we can narrow down the domains of its attackers (they are all rejected)
    - if it's false, that's all we can do, unless it only has one attacker (then it is true)

    - propagate fixed values outward as far as you can
    
    - (here) then you start solving the tree from the top, assigning provisional values to everything, and backtracking / reassigning when you come up against a violated constraint

    then:
    - figure out how to output multiple solutions
    */

    let consistent = true

    const resolve = constraintCheck(forwardProp)

    for(let i=0; i<arr.length; i++) {
      const { node, value } = arr[i]

      node.value = value
      
      let conflict = this.traverseDF(resolve, node, true) // traverse down from seed

      if(!conflict) {
        conflict = this.traverseUp(constraintCheck(backProp), node.parent) // traverse up from seed

        if(conflict) consistent = false
      } else {
        consistent = false
      }

      if(!consistent) break
    }

    if(consistent) {
      let conflict = this.traverseDF(resolve, this._root, true) // traverse down from root

      // if there's a conflict, should return true
      // how could a conflict occur? a parent dictates one thing, but a child dictates another
      // it would be discovered if the child already has a value assigned to it, but its parent's provisional value wants the child's value to be something else

      // PROCESS:
      // x: what does the parent want me to be?
      // if i already have a value, and it's different from x, then we have a constraint violation
      // else, assign x to provisionalValue

      // once we have a constraint violation, we need to start over from the last node, and try a different value. if we still have a constraint violation, then we need to go up another node.

      if(!conflict) {
        const provisionalResolve = constraintCheck(forwardProp, false)

        conflict = this.traverseDF(provisionalResolve, this._root, true)

        console.log(conflict)
      }
    } else {
      console.log("INCONSISTENT")
    }
  }

  reconcile(width, height) {
    let leaves = this.countLeaves(),
      depth = this.getDepth(),
      minHeight = height / leaves

    this.traverseDF(n => {
      let top = 0

      if(n.depth > 0) {
        let children = n.parent.children

        for(let i=0; i<children.length; i++) {
          if(children[i]._id === n._id) {
            if(i > 0) {
              let prevSib = children[i - 1]
              top = prevSib.top + prevSib.height
            } else {
              top = n.parent.top
            }
            break
          }
        }
      }

      n.top = top
      n.height = Math.max(minHeight, n.leaves * minHeight)
    })
  }

  scoreArguments(moralMatrix) { // dummy fn right now
    let scores = {}

    this.traverseDF(n => {
      scores[n._id] = -30 + random.nextDouble() * 60
      return false
    })

    return scores
  }
}