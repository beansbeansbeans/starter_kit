import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

const getDistance = {
  'euclidean': vectorLength,
  'manhattan': manhattanLength,
  'fractional': fractional(0.5)
}

let closestCount = 3
const resolution = 20

class Aggregation extends Component {
  constructor(props) {
    super(props)

    let bins = []
    for(let i=0; i<resolution; i++) bins.push(0)

    this.setState({
      bins: bins,
      scale: 0,
      data: null
    })
  }

  componentWillMount() {
    bindAll(this, ['aggregate'])

    Promise.all(['aggregations'].map(getData)).then(resp => {
      this.setState({ data: resp[0] })
    })
  }

  aggregate() {
    this.setState({ scale: this.state.scale + 1 })
  }

  render({}, { bins, data, scale }) {
    let theBins = []
    if(data) {
      theBins = data.euclidean['100'][scale]
    }
    let total = theBins.reduce((acc, curr) => acc + curr, 0)

    return (
      <div id="aggregation-wrapper">
        <div id="histogram">{theBins.map(bin => {
          return <div class="bin">
            <div style={`height: ${100 * bin/total}%`} class="contents"></div>
          </div>
        })}</div>
        <div id="labels">{theBins.map((bin, i) => {
          return <div class="label">{(i / theBins.length).toFixed(2)}</div>
        })}</div>
        <div class="input-wrapper">
          <div class="scale">{scale}</div>
          <button onClick={this.aggregate}>aggregate</button>
        </div>
      </div>
    )
  }
}

export default Aggregation