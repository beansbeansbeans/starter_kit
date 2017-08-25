import randomModule from '../helpers/random'
const random = randomModule.random(42)
import schemeGenerators from './scheme'
import schemeData from './config'

let root,
  directory = {},
  schemes = Object.keys(schemeGenerators)

function randomScheme() { 
  return schemes[Math.floor(random.nextDouble() * schemes.length)] 
}

const find = (id, seed) => {
  if(typeof seed === 'undefined') seed = root

  if(seed.id === id) return seed

  return seed.attackers.reduce((acc, curr) => {
    if(acc.id === id) return acc

    return find(id, curr)
  }, false)
}

const create = num => {
  root = schemeGenerators[randomScheme()]({ id: uuid.v4() })

  directory[root.id] = root

  for(let i=0; i<num; i++) {
    let keys = Object.keys(directory),
      randomID = keys[Math.floor(random.nextDouble() * keys.length)],
      randomParent = directory[randomID],
      randomSchemeType = randomScheme(),

      child = schemeGenerators[randomSchemeType]({ id: uuid.v4() })

    directory[child.id] = child

    randomParent.attackers.push({
      critical_question_id: 
        Math.floor(random.nextDouble() * schemeData[randomSchemeType].critical_questions.length),
      node: child
    })
  }

  return {
    root,
    find,
    getRandomAttacker: function(id) {
      let attackers = find(id).attackers

      return attackers[Math.floor(random.nextDouble() * attackers.length)].node
    }
  }
}

export default create