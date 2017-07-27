function Node(val, supports) {
  this.data = val
  this.children = []
  this._id = uuid.v4()
  this.supports = supports
}

function Tree(val) {
  this._root = new Node(val)
}

function value(n, fn, strict) {
  if(strict) return fn(n.value)
  return fn(n.value) || fn(n.provisionalValue)
}

const isTrue = val => val === true
const isFalse = val => val === false

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
    fn(n)

    if(n.parent) apply(n.parent)
  }

  apply(seed)
}

Tree.prototype.traverseDF = function(matchFn, seed) {
  if(typeof seed === 'undefined') seed = this._root

  const find = node => node.children.reduce((acc, curr) => {
    if(matchFn(curr)) return curr
    return find(curr)
  }, false)

  if(matchFn(seed)) return seed

  return find(seed)
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

Tree.prototype.find = function(data, property = 'data') {
  return this.traverseDF(node => node[property] === data)
}

Tree.prototype.add = function(n, parent) {
  parent.children.push(n)
  n.parent = parent
}

Tree.prototype.remove = function(node) {
  let children = node.parent.children
  let index = children.map(c => c._id).indexOf(node._id)

  children.splice(index, 1)
}

Tree.prototype.solve = function(node, value) {
  node.value = value

  /*
  there are two constraints: 
  1) if a attacks b, then they can't both be true.
  2) if a is false, then one of its attackers must be true

  so the solution process is: 
  - we fix the value of the argument node. 
  - if it's true, then we can narrow down the domains of its attackers (they are all rejected)
  - if it's false, that's all we can do, unless it only has one attacker (then it is true)

  - propagate fixed values outward as far as you can

  - then you start solving the tree from the top, assigning provisional values to everything, and backtracking / reassigning when you come up against a violated constraint

  then:
  - figure out how to output multiple solutions
  */

  const resolve = n => {
    if(typeof n.value !== 'undefined') return false // already assigned

    const constrainedValue = forwardProp(n, true)
    if(constrainedValue) {
      n.value = constrainedValue.value
    }

    return false
  }

  // traverse down from seed
  this.traverseDF(resolve, node)

  if(node.parent) {
    // traverse up from seed
    this.traverseUp(backProp, node.parent)

    // traverse down from root
    this.traverseDF(resolve)    
  }

  // THEN (finally), output solutions with backtracking
  this.traverseDF(n => {
    if(typeof n.value === 'undefined') {
      const constrainedValue = forwardProp(n, false)
      if(constrainedValue) {
        n.provisionalValue = constrainedValue.value
      }

      if(typeof n.provisionalValue === 'undefined') { // if still no value...
        n.provisionalValue = Math.random() < 0.5 ? false : true
      }
    }

    // if there's a conflict, should return true
    // how could a conflict occur? a parent dictates one thing, but a child dictates another
    // it would be discovered if the child already has a value assigned to it, but its parent's provisional value wants the child's value to be something else

    // PROCESS:
    // x: what does the parent want me to be?
    // if i already have a value, and it's different from x, then we have a constraint violation
    // else, assign x to provisionalValue

    // once we have a constraint violation, we need to start over from the last node, and try a different value. if we still have a constraint violation, then we need to go up another node. 

    return false
  })
}

export default { Tree, Node }



