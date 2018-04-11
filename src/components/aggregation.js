import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)

const getDistance = {
  'euclidean': vectorLength,
  'manhattan': manhattanLength
}

const closestCount = 3
const resolution = 20

class Aggregation extends Component {
  state = {
    scale: 1,
    scaledData: [],
    bins: []
  }

  constructor(props) {
    super(props)

    let bins = []
    for(let i=0; i<resolution; i++) bins.push(0)

    this.setState({
      bins: bins
    })
  }

  componentWillMount() {
    bindAll(this, ['computeBins', 'aggregate'])
  }

  aggregate() {
    let { scaledData, scale } = this.state
    let newScaledData = []

    console.time("aggregate")
    for(let i=0; i<scaledData.length; i++) {
      let source = scaledData[i]
      if(source.used) continue

      let vec = source.encoding
      source.used = true

      let closest = []
      
      for(let j=0; j<scaledData.length; j++) {
        let target = scaledData[j]
        if(target.used) continue

        let diff = subVectors(vec, target.encoding)
        let distance = getDistance['manhattan'](diff)

        // if it's closer than any of the elements in closer (comment out this if block for random aggregation)
        if(closest.length === closestCount) {
          let toDelete = -1
          for(let k=0; k<closest.length; k++) {
            if(distance < closest[k].distance) {
              toDelete = k
              break
            }
          }

          closest.splice(toDelete, 1)
        }

        if(closest.length < closestCount) {
          closest.push(Object.assign({ distance, index: j }, target))
        }
      }

      for(let j=0; j<closest.length; j++) {
        scaledData[closest[j].index].used = true
      }

      let closestLength = closest.length
      let average = {
        encoding: vec,
        polarity: source.polarity
      } 

      if(closestLength > 0) {
        average = {
          encoding: vec.map((d, i) => {
            return (d + closest.reduce((acc, curr) => acc + curr.encoding[i])) / (closestLength + 1)
          }),
          polarity: (source.polarity + closest.reduce((acc, curr) => acc + curr.polarity, 0)) / (closestLength + 1)
        }        
      }

      newScaledData.push(average)
    }
    console.timeEnd("aggregate")
    console.log(newScaledData.length)

    this.setState({ scaledData: newScaledData, scale: scale + 1 }, this.computeBins)
  }

  computeBins() {
    let { scaledData } = this.state
    let bins = []
    for(let i=0; i<resolution; i++) bins.push(0)

    for(let i=0; i<scaledData.length; i++) {
      let obj = scaledData[i]

      for(let j=0; j<bins.length; j++) {
        if(obj.polarity <= j / bins.length || j === bins.length - 1) {
          bins[j]++
          break
        }
      }
    }

    console.log(bins)

    this.setState({ bins })
  }

  componentDidMount() {
    let sample = this.props.data['50']
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
          return <div class="label">{(i / bins.length).toFixed(2)}</div>
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