import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

class ParallelCoordinates extends Component {
  constructor(props) {
    super(props) 

    this.state = {

    }
  }

  render() {
    return (<div id="parallel_coordinates">parallel coordinates</div>)
  }
}

export default ParallelCoordinates