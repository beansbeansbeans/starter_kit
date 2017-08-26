import helpers from '../helpers/helpers'
const { pipe, withConstructor } = helpers
import schemes from './config'

const schemeGenerators = {}, matchInterpolator = /{{([^}]+)}}/g

const canDisplay = o => {
  return {
    ...o,

    display() {
      return o.conclusion.replace(matchInterpolator, 
        (_, match) => o.variables[match])
    }
  }
}

for(scheme in schemes) {
  let obj = schemes[scheme],
    variableSources = obj.premises.join(" ").concat(obj.conclusion),
    variables = [],
    res

  while((res = matchInterpolator.exec(variableSources)) !== null) {
    if(variables.indexOf(res[1]) === -1) variables.push(res[1])
  }

  let defaults = {
    variables: variables.reduce((acc, curr) => {
      acc[curr] = Math.random().toFixed(3)
      return acc
    }, {}),
    attackers: [],
    defenders: []
  }

  schemeGenerators[scheme] = config => pipe(
    canDisplay,
    withConstructor(schemeGenerators[scheme]))
  (Object.assign(defaults, obj, config))
}

export default schemeGenerators