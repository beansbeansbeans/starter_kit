import randomModule from './helpers/random'
const random = randomModule.random(42)

class Node {
  constructor(val, supports, extraData) {
    this.data = val
    this.children = []
    this.leaves = 0
    this._id = uuid.v4()
    this.supports = supports
    this.extraData = extraData    
  }
}

function Tree(val, extraData) {
  this._root = new Node(val, null, extraData)
  this._root.depth = 0
}

const constraintCheck = (fn, strict = true) => n => {
  let pass = true
  const constrainedValue = fn(n, strict)

  if(constrainedValue) {
    if(typeof n.value === 'undefined') {
      if(strict) {
        n.value = constrainedValue.value
      } else {
        n.provisionalValue = constrainedValue.value
      }
    } else {
      if(constrainedValue.value !== n.value) {
        pass = false
      }
    }
  }

  if(typeof n.value === 'undefined' && strict === false) {
    if(typeof n.provisionalValue === 'undefined') { // if still no value...
      n.provisionalValue = random.nextDouble() < 0.5 ? false : true
    }
  }

  return !pass
}

function value(n, fn, strict) {
  if(strict) return fn(n.value)
  return fn(n.value) || fn(n.provisionalValue)
}

const isTrue = val => val === true
const isFalse = val => val === false

/*
there are two constraints: 
1) if a attacks b, then they can't both be true.
2) if a is false, then one of its attackers must be true
*/

function forwardProp(n, strict) {
  if(n.parent) {
    if(value(n.parent, isTrue, strict)) { 
      if(!n.supports) {
        return { value: false } // constraint 1
      }
    } else if(value(n.parent, isFalse, strict)) {
      if(!n.supports && 
        n.parent.children
          .filter(n => !n.supports)
          .filter(n => value(n, isTrue, strict))
          .length < 1) {
        return { value: true } // constraint 2
      }
    }      
  }

  return false
}

function backProp(n) {
  const attackers = n.children.filter(n => !n.supports)

  // if the attackers of n are all false (or there are no attackers), then n is true
  if(!attackers.length || attackers.every(n => n.value === false)) {
    n.value = true

  // if one of the attackers of n is true, then n is false
  } else if(attackers.some(n => n.value === true)) {
    n.value = false
  }
}

Tree.prototype.traverseUp = function(fn, seed) {
  if(typeof seed === 'undefined') seed = this._root

  const apply = n => {
    if(fn(n)) return n

    if(n.parent) return apply(n.parent)

    return false
  }

  return apply(seed)
}

Tree.prototype.traverseDF = function(matchFn, seed, find = false) {
  if(typeof seed === 'undefined') seed = this._root

  const traverse = node => node.children.reduce((acc, curr) => {
    if(find && matchFn(acc)) return acc
    if(matchFn(curr)) return curr
    return traverse(curr)
  }, false)

  if(matchFn(seed)) return seed

  return traverse(seed)
}

Tree.prototype.traverseBF = function(matchFn) {
  let match, toSearch = [this._root]

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

Tree.prototype.countLeaves = function() {
  return this._root.leaves
}

Tree.prototype.getDepth = function() {
  let maxDepth = 0
  this.traverseDF(n => {
    if(n.depth > maxDepth) {
      maxDepth = n.depth
    }
  })

  return maxDepth + 1
}

Tree.prototype.find = function(data, property = 'data') {
  return this.traverseDF(node => node[property] === data, this._root, true)
}

Tree.prototype.add = function(n, parent) {
  n.leaves = 0
  n.children = []

  if(!n.supports) {
    parent.children.push(n)
  } else {
    parent.children.unshift(n)
  }

  n.parent = parent
  n.depth = parent.depth + 1

  if(parent.children.length > 1) {
    this.traverseUp(node => {
      if(node._id !== n._id) node.leaves++ }, n)    
  } else {
    parent.leaves++
  }
}

Tree.prototype.remove = function(node) {
  let children = node.parent.children, leaves = Math.max(1, node.leaves)

  if(children.length === 1 && node.children.length === 0) {
    node.parent.leaves--
  } else {
    this.traverseUp(n => {
      n.leaves -= leaves
      return false
    }, node)
  }

  let index = children.map(c => c._id).indexOf(node._id)
  children.splice(index, 1)
}

Tree.prototype.solve = function(arr) {
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
    
    let conflict = this.traverseDF(resolve, node) // traverse down from seed

    if(!conflict) {
      conflict = this.traverseUp(constraintCheck(backProp), node.parent) // traverse up from seed

      if(conflict) consistent = false
    } else {
      consistent = false
    }

    if(!consistent) break
  }

  if(consistent) {
    let conflict = this.traverseDF(resolve) // traverse down from root

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

      conflict = this.traverseDF(provisionalResolve)

      console.log(conflict)
    }
  } else {
    console.log("INCONSISTENT")
  }
}

Tree.prototype.reconcile = function(width, height) {
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

export default { Tree, Node }