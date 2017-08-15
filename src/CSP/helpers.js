import randomModule from '../helpers/random'
const random = randomModule.random(42)

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

export default {
  constraintCheck, value, isTrue, isFalse, forwardProp, backProp
}