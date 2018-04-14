import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

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

class EmbeddingSpiral extends Component {
  constructor(props) {
    super(props)

    let sentences = [
      "i'm going to give it a marginal thumbs up . i liked it just enough .",
      "a deliciously nonsensical comedy about a city coming apart at its seams ."
    ]

    this.setState({
      sentences: sentences.map((d, i) => {
        return {
          label: d,
          id: d,
          active: i === 0
        }
      })
    })
  }

  componentWillMount() {
    bindAll(this, ['changeDropdown'])

    Promise.all(['encodings_permutations_2400'].map(getData)).then(resp => {
      console.log(resp[0])
      let canvas = document.querySelector("#embedding_spiral #canvas")
      this.ctx = canvas.getContext('2d')
      let keys = Object.keys(resp[0])
      let canvasSize = keys.length
      let max = this.state.max

      canvas.width = 2 * canvasSize
      canvas.height = 2 * canvasSize
      canvas.style.width = canvasSize + 'px'
      canvas.style.height = canvasSize + 'px'

      this.ctx.scale(2, 2)
    })
  }

  componentDidUpdate() {

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

  render({}, { sentences }) {
    return (
      <div id="embedding_spiral">
        <canvas id="canvas"></canvas>
      </div>
    )
  }
}

export default EmbeddingSpiral