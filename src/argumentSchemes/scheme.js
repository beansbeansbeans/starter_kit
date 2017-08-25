import helpers from '../helpers/helpers'
const { pipe, withConstructor } = helpers
import schemes from './config'

const schemeGenerators = {}

const canDisplay = o => {
  return {
    ...o,

    display() {
      return o.conclusion.replace(/{{([^}]+)}}/g, 
        (_, match) => o.variables[match])
    }
  }
}

for(scheme in schemes) {
  let obj = schemes[scheme]

  let defaults = {
    variables: {
      'E': 'Doug',
      'S': 'pool',
      'A': 'pool is the best sport',
      'B': 'true'
    }
  }

  schemeGenerators[scheme] = config => pipe(
    canDisplay,
    withConstructor(schemeGenerators[scheme]))
  (Object.assign(defaults, obj, config))
}

const anExpertOpinion = schemeGenerators.expertOpinion({
  variables: {
    'E': 'Doug',
    'S': 'pool',
    'A': 'pool is the best sport',
    'B': 'true'
  }
})

export default schemeGenerators