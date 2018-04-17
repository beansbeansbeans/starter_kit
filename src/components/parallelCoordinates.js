import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

let res = 0.05
let dim = 10
let cellSize = 5

let binSearch = (range, lower, upper, val) => {
  let mid = lower + Math.floor((upper - lower) / 2)
  if(val > range[mid] && val < range[mid + 1] || mid === lower) {
    return mid
  }

  if(val > range[mid + 1]) return binSearch(range, mid + 1, upper, val)

  return binSearch(range, lower, mid, val)
}

class ParallelCoordinates extends Component {
  constructor(props) {
    super(props)

    let max = []
    let min = []
    let ranges = []
    let constraints = []
    for(let i=0; i<dim; i++) {
      max.push(0)
      min.push(Infinity)
      ranges.push([])
      constraints.push([0, 1/res])
    }

    this.state = {
      bins: this.getCleanBins(),
      max, min,
      ranges,
      overallMax: 0,
      constraints
    }
  }

  getCleanBins() {
    let bins = []
    for(let i=0; i<dim; i++) {
      bins.push([])
      for(let j=0; j<1/res; j++) {
        bins[i].push(0)
      }
    }

    return bins
  }

  getBin(val, dim) {
    let min = this.state.min[dim], max = this.state.max[dim]

    return binSearch(this.state.ranges[dim], 0, this.state.ranges[dim].length, val)
  }

  count() {
    let data = this.props.data[dim]
    let cleanBins = this.getCleanBins()
    let overallMax = this.state.overallMax
    let shouldRecomputeMax = overallMax === 0

    for(let i=0; i<data.length; i++) {
      let encoding = data[i].encoding
      for(let j=0; j<encoding.length; j++) {
        let val = encoding[j]

        let bin = this.getBin(val, j)

        cleanBins[j][bin]++

        if(shouldRecomputeMax && cleanBins[j][bin] > overallMax) overallMax = cleanBins[j][bin]
      }
    }

    console.log(cleanBins)

    this.setState({ bins: cleanBins, overallMax })
  }

  componentWillMount() {
    bindAll(this, ['count', 'getCleanBins', 'getBin'])

    let data = this.props.data[dim]
    let min = this.state.min, max = this.state.max, ranges = this.state.ranges

    for(let i=0; i<data.length; i++) {
      let encoding = data[i].encoding
      for(let j=0; j<dim; j++) {
        let val = encoding[j]

        if(val > max[j]) max[j] = val
        if(val < min[j]) min[j] = val
      }
    }

    for(let i=0; i<dim; i++) {
      let range = []
      for(let j=0; j<1/res; j++) {
        range.push(min[i] + (j * ((max[i] - min[i])/(1/res - 1))))
      }
      ranges[i] = range
    }

    this.setState({ min, max, ranges })
  }

  componentDidMount() {
    this.count()
  }

  render({}, { bins, max, min, overallMax, constraints }) {
    return (<div id="parallel_coordinates">{bins.map((bin, dim) => {
      return <div class="column-wrapper">
        <div class="label max">{max[dim].toFixed(2)}</div>
        <div class="column_plus_constraints">
          <div class="column">{bin.map(d => {
            return <div style={`width:${cellSize}px; height:${cellSize}px; background-color: rgba(255, 0, 0, ${d > 0 ? 0.05 + 0.95 * (d / overallMax) : 0})`} class="cell"></div>
          })}</div>
          <div style={`top:${constraints[dim][0] * cellSize}px`} class="constraint top"></div>
          <div style={`top:${constraints[dim][1] * cellSize}px`} class="constraint bottom"></div>
        </div>
        <div class="label min">{min[dim].toFixed(2)}</div>
      </div>
    })}</div>)
  }
}

export default ParallelCoordinates