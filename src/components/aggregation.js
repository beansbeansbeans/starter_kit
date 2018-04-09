import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)

class Aggregation extends Component {
  state = {

  }

  componentWillMount() {
    bindAll(this, [])
  }

  render() {
    return (
      <div id="aggregation-wrapper">
        lol
      </div>
    )
  }
}

export default Aggregation