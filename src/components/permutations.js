import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)

class Permutations extends Component {
  constructor(props) {
    super(props)

    this.setState({

    })
  }

  render() {
    return (
      <div id="permutations">lol permutations</div>
    )
  }
}

export default Permutations