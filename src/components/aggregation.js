import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)

class Aggregation extends Component {
  state = {
    scale: 1,
    scaledData: [],
    bins: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }

  componentWillMount() {
    bindAll(this, ['computeBins', 'aggregate'])
  }

  aggregate() {
    console.log("aggregate", this.state.scale)
  }

  computeBins() {
    let { scaledData } = this.state
    let bins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    for(let i=0; i<scaledData.length; i++) {
      let obj = scaledData[i]

      for(let j=0; j<bins.length; j++) {
        if(obj.polarity <= j / bins.length || j === bins.length - 1) {
          bins[j]++
          break
        }
      }
    }

    console.log(scaledData)
    console.log(bins)

    this.setState({ bins })
  }

  componentDidMount() {
    let sample = this.props.data['10']
    let scaledData = []

    for(let i=0; i<sample.length; i++) {
      scaledData.push(Object.assign(sample[i], {
        polarity: sample[i].polarity === 'pos' ? 1 : 0
      }))
    }
    
    this.setState({ scaledData }, this.computeBins)
  }

  render({}, { bins, scale }) {
    let total = bins.reduce((acc, curr) => acc + curr, 0)

    return (
      <div id="aggregation-wrapper">
        <div id="histogram">{bins.map(bin => {
          return <div class="bin">
            <div style={`height: ${100 * bin/total}%`} class="contents"></div>
          </div>
        })}</div>
        <div id="labels">{bins.map((bin, i) => {
          return <div class="label">{(i / bins.length).toFixed(1)}</div>
        })}</div>
        <div class="input-wrapper">
          <input onInput={e => {
            this.setState({ scale: e.target.value })
          }} value={scale} />
          <button onClick={this.aggregate}>aggregate</button>
        </div>
      </div>
    )
  }
}

export default Aggregation