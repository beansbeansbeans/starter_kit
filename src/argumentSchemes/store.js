import randomModule from '../helpers/random'
const random = randomModule.random(42)
import schemeGenerators from './scheme'

let root,
  schemes = Object.keys(schemeGenerators)

function randomScheme() { 
  return schemes[Math.floor(random.nextDouble() * schemes.length)] 
}

const create = num => {
  root = schemeGenerators[randomScheme()]()

  console.log(root.display())

  return root
}

export default create