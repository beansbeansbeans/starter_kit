import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getEricData, getShader } from '../api'
import { line } from 'd3-shape'
import { select } from 'd3-selection'

// const models = ['comp-ngrams', 'doc2vec', 'glove', 'infer-sent', 'quick-thought', 'skip']
const models = ['comp-ngrams']

const manipulations = ['dropout', 'forward', 'shuffle']

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

function createDropdown(d, i) {
  return {
    active: i === 0,
    id: d,
    label: d
  }
}

class EmbeddingSpiral extends Component {
  constructor(props) {
    super(props)

    

    this.setState({ 
      sentences: [],
      distances: [],
      models: models.map(createDropdown),
      manipulations: manipulations.map(createDropdown)
    })
  }

  componentWillMount() {
    bindAll(this, ['changeDropdown'])

    let files = []

    models.forEach(m => {
      manipulations.forEach(man => {
        files.push(`${m}_${man}_dists.pkl`)
      })
      files.push(`${m}_sents-embs.pkl`)
    })

    Promise.all(files.map(getEricData)).then(resp => {
      console.log(resp)

      // let canvas = document.querySelector("#embedding_spiral #canvas")
      // this.ctx = canvas.getContext('2d')
      // let canvasSize = 50

      // canvas.width = 2 * canvasSize
      // canvas.height = 2 * canvasSize
      // canvas.style.width = canvasSize + 'px'
      // canvas.style.height = canvasSize + 'px'

      // this.ctx.scale(2, 2)

      let sentences = resp[0].map(d => d.orig_sent)
      let data = {}
      models.forEach((m, i) => {
        data[m] = {
          embeddings: resp[i * 4 + 3],
          manipulations: resp.slice(i * 4, i * 4 + 3)
        }
      })

      this.setState({
        data,
        sentences: sentences.map(createDropdown),
        distances: Object.keys(resp[0][0].dists),
        manipulations: this.state.manipulations.map((d, i) => {
          d.sentences = sentences.map((sent, si) => {
            return {
              base: sent,
              manipulations: resp[i][si].manipulated_sents
            }
          })
          return d
        })
      })
    })
  }

  componentDidUpdate() {
    let { distances, manipulations, sentences, data, models } = this.state
    let activeManipulation = manipulations.find(d => d.active)
    let activeManipulationIndex = manipulations.findIndex(d => d.active)
    let activeModel = models.find(d => d.active)
    let activeSentenceIndex = sentences.findIndex(d => d.active)

    let sparklinePoints = distances.map((d, distIndex) => {
      return data[activeModel.id].manipulations[activeManipulationIndex][activeSentenceIndex].dists[d]
    })

    let graphXIncrement = 200 / sparklinePoints[0].length
    let graphHeight = 100

    distances.forEach((dist, di) => {
      let max = Math.max(...sparklinePoints[di])
      select(document.querySelector(`#svg_${dist}`)).select("path")
        .attr("d", line().x((d, i) => i * graphXIncrement).y(d => (1 - (d / max)) * graphHeight)(sparklinePoints[di]))
    })

    console.log(sparklinePoints)
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

  render({}, { sentences, models, manipulations, distances }) {
    let activeManipulation = manipulations.find(d => d.active)
    let activeSentenceIndex = sentences.findIndex(d => d.active)

    let sentencesDOM

    if(activeSentenceIndex > -1) {
      sentencesDOM = activeManipulation.sentences[activeSentenceIndex].manipulations.map((d, i) => {
        return <div class="sentence-wrapper">
          <div>{d}</div>
          <canvas id={`canvas_${i}`}></canvas>
        </div>
      })
    }

    return (
      <div id="embedding_spiral">
        <div class="sentences-wrapper">
          {sentencesDOM}
        </div>
        <div class="controls">
          <Dropdown change={id => this.changeDropdown(id, 'sentences')} options={sentences} />
          <Dropdown change={id => this.changeDropdown(id, 'models')} options={models} />
          <Dropdown change={id => this.changeDropdown(id, 'manipulations')} options={manipulations} />
          <br />
          <div class="distances-wrapper">{distances.map(d => {
            return <div class="distance-wrapper">
              <div class="label">{d}</div>
              <svg id={`svg_${d}`}>
                <line></line>
                <path></path>
              </svg>
            </div>
          })}</div>
        </div>
      </div>
    )
  }
}

export default EmbeddingSpiral