import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

const resolution = 20

let distances = ['euclidean', 'manhattan']
let dimensions = ['100', '50', '10']

class Dropdown extends Component {
  render({ options, change }) {
    return (
      <select onChange={e => change(e.target.value)} class="options">
        {options.map(d => {
          return <option 
            value={d.id}
            selected={d.active} class="option">{d.label}</option>
        })}
      </select>
    )
  }
}

class Aggregation extends Component {
  constructor(props) {
    super(props)

    this.setState({
      scale: 0,
      data: null,
      dimensions: dimensions.map((d, i) => {
        return {
          active: i === 0,
          label: d,
          id: d
        }
      }),
      distances: distances.map((d, i) => {
        return {
          active: i === 0,
          label: d,
          id: d
        }
      })
    })
  }

  changeDropdown(id, key) {
    this.setState({
      [key]: this.state[key].map(d => {
        if(d.id == id) {
          d.active = true
        } else {
          d.active = false
        }

        return d
      })
    })
  }

  componentWillMount() {
    bindAll(this, ['aggregate', 'changeDropdown'])

    Promise.all(['aggregations'].map(getData)).then(resp => {
      console.log(resp[0])
      this.setState({ 
        data: resp[0],
        maxScale: resp[0]['euclidean']['100'].length
      })
    })
  }

  aggregate() {
    this.setState({ scale: this.state.scale + 1 })
  }

  render({}, { data, scale, maxScale, dimensions, distances }) {
    let activeDim = dimensions.find(d => d.active).label
    let activeDistance = distances.find(d => d.active).label

    let bins = []
    if(data) {
      bins = data[activeDistance][activeDim][scale]
    }
    let total = bins.reduce((acc, curr) => acc + curr, 0)

    return (
      <div id="aggregation-wrapper">
        <Dropdown change={id => this.changeDropdown(id, 'dimensions')} options={dimensions} />
        <Dropdown change={id => this.changeDropdown(id, 'distances')} options={distances} />
        <div id="histogram">{bins.map(bin => {
          return <div class="bin">
            <div style={`height: ${100 * bin/total}%`} class="contents"></div>
          </div>
        })}</div>
        <div class="labels x-markers">{bins.map((bin, i) => {
          return <div class="label">{(i / bins.length).toFixed(2)}</div>
        })}</div>
        <div class="labels breakdowns">{bins.map((bin, i) => {
          return <div class="label">{`${bin > 0 ? bin : ''} ${bin > 0 ? Math.round(100 * bin / total) + '%' : ''}`}</div>
        })}</div>
        <div class="input-wrapper">
          <div class="scale">{scale}</div>
          <button style={`display: ${scale < maxScale - 1? 'inline-block' : 'none'}`} onClick={this.aggregate}>zoom out</button>
          <button style={`display: ${scale > 0 ? 'inline-block' : 'none'}`} onClick={() => {
            this.setState({
              scale: scale - 1
            })
          }}>zoom in</button>
        </div>
      </div>
    )
  }
}

export default Aggregation