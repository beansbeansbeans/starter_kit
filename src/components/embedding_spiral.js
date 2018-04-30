import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getEricData, getShader } from '../api'
import { line } from 'd3-shape'
import { select } from 'd3-selection'

const vizHeight = 620
const innerContentsWidth = 960
const controlsWidth = 0.3

const models = ['comp-ngrams', 'doc2vec', 'glove', 'infer-sent', 'quick-thought', 'skip']
// const models = ['comp-ngrams']

const manipulations = ['dropout', 'forward', 'shuffle']
let graphHeight = 100
let graphXIncrement = 0

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
      hoverIndex: 0,
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

      let sentences = resp[0].map(d => d.orig_sent)
      let data = {}

      models.forEach((m, i) => {
        let embeddings = resp[i * 4 + 3]

        let basePermutations = sentences.map((d, si) => {
          let emb = embeddings[d]

          let indices = [], max = 0
          for(let i=0; i<emb.length; i++) {
            indices.push(i)
            if(emb[i] > max) max = emb[i]
          }

          indices.sort((a, b) => {
            if(emb[a] > emb[b]) {
              return -1
            }
            return 1
          })

          return { indices, max }
        })

        data[m] = {
          embeddings,
          manipulations: resp.slice(i * 4, i * 4 + 3),
          basePermutations
        }
      })

      this.setState({
        data,
        sentences: sentences.map(createDropdown),
        distances: Object.keys(resp[0][0].dists).filter(d => d !== 'energy'),
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
    let { distances, manipulations, sentences, data, models, hoverIndex } = this.state
    let activeManipulation = manipulations.find(d => d.active)
    let activeManipulationIndex = manipulations.findIndex(d => d.active)
    let activeModel = models.find(d => d.active)
    let activeModelIndex = models.findIndex(d => d.active)
    let activeSentence = sentences.find(d => d.active)
    let activeSentenceIndex = sentences.findIndex(d => d.active)

    let sparklinePoints = distances.map((d, distIndex) => {
      return models.map(model => data[model.id].manipulations[activeManipulationIndex][activeSentenceIndex].dists[d])
    })

    graphXIncrement = (controlsWidth * innerContentsWidth) / sparklinePoints[0].length

    distances.forEach((dist, di) => {
      let max = Math.max(...sparklinePoints[di].reduce((acc, curr) => acc.concat(curr), []))

      models.forEach((model, mi) => {
        select(document.querySelector(`#svg_${dist}`)).select(`path:nth-of-type(${mi + 1})`)
          .attr("d", line().x((d, i) => i * graphXIncrement).y(d => (1 - (d / max)) * graphHeight)(sparklinePoints[di][mi]))        
      })

      document.querySelector(`#svg_${dist} .marker`).setAttribute("cy", (1 - (sparklinePoints[di][activeModelIndex][hoverIndex] / max)) * graphHeight)
      document.querySelector(`#text_max_${dist}`).textContent = `${max.toFixed(3)}`
    })

    let sents = activeManipulation.sentences[activeSentenceIndex].manipulations

    let embLength = data[activeModel.id].manipulations[activeManipulationIndex][activeSentenceIndex].manipulated_embs[0].length
    let canvasSize = 2
    while(canvasSize * canvasSize < embLength) {
      canvasSize *= 2
    }

    canvasSize += 1

    let cellDim = 100 / canvasSize

    let { indices, max } = data[activeModel.id].basePermutations[activeSentenceIndex]

    sents.forEach((sent, i) => {
      let canvas = document.querySelector(`#embedding_spiral #canvas_${i}`)
      let ctx = canvas.getContext('2d')

      canvas.width = 2 * (canvasSize * cellDim)
      canvas.height = 2 * (canvasSize * cellDim)
      canvas.style.width = (canvasSize * cellDim) + 'px'
      canvas.style.height = (canvasSize * cellDim) + 'px'

      ctx.scale(2, 2)

      ctx.clearRect(0, 0, (canvasSize * cellDim), (canvasSize * cellDim))

      let emb = data[activeModel.id].manipulations[activeManipulationIndex][activeSentenceIndex].manipulated_embs[i].slice(0)
      emb = permute(emb, indices)

      let r = 0
      let c = 1
      let iter = 0
      let d = 0
      let mid = Math.floor(canvasSize / 2)
      let coord = [mid, mid]
      let direction = 0
      let xDir = 0
      let yDir = 1

      for(let idx=0; idx<emb.length; idx++) {
        if(idx > 0 && iter % d === 0) {
          if(direction % 4 === 0) { // down
            xDir = 0
            yDir = 1
          } else if(direction % 4 === 1) { // right
            xDir = 1
            yDir = 0
          } else if(direction % 4 === 2) { // up
            xDir = 0
            yDir = -1
          } else { // left
            xDir = -1
            yDir = 0
          }

          direction++ 
        }

        // paint
        ctx.fillStyle = `rgba(0, 0, 0, ${emb[idx] / max})`
        ctx.fillRect(coord[0] * cellDim, coord[1] * cellDim, cellDim, cellDim)

        iter++

        if(iter === c) {
          iter = 0
          r += 1
          d += 2
          c = 4 * (r * 2 - 1) + 4

          coord = [mid - r, mid - r]
        } else {
          coord[0] += xDir
          coord[1] += yDir            
        }
      }        
    })
  }

  changeDropdown(id, key) {
    this.setState({
      hoverIndex: 0,
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

  render({}, { left, sentences, models, manipulations, distances, hoverIndex }) {
    let activeManipulation = manipulations.find(d => d.active)
    let activeSentenceIndex = sentences.findIndex(d => d.active)

    let sentencesDOM

    if(activeSentenceIndex > -1) {
      sentencesDOM = activeManipulation.sentences[activeSentenceIndex].manipulations.map((d, i) => {
        return <div data-active={i === hoverIndex} onMouseOver={() => {
          this.setState({ hoverIndex: i })
        }} class="sentence-wrapper">
          <div class="label">{d}</div>
          <canvas id={`canvas_${i}`}></canvas>
        </div>
      })
    }

    return (
      <div ref={ c => this.root=c } id="embedding_spiral">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents">
            <div style={`width:${controlsWidth * 100}%`} class="controls">
              <h4>Distance</h4>
              <Dropdown change={id => this.changeDropdown(id, 'models')} options={models} />
              <div class="distances-wrapper">{distances.map(d => {
                return <div class="distance-wrapper">
                  <h4 class="label">{d}</h4>
                  <div id={`svg_${d}`} class="svg-wrapper">
                    <div class="graph_max" id={`text_max_${d}`}></div>
                    <svg style={`height:${graphHeight}px`}>
                      <line class="axis" x1="0" x2="0" y1="0" y2={graphHeight}></line>
                      <g class="path_wrapper">{models.map(model => <path></path>)}</g>
                      <circle class="marker" r="3" cx={hoverIndex * graphXIncrement}></circle>
                    </svg>
                  </div>
                </div>
              })}</div>
            </div>
            <div style={`width:${(1 - controlsWidth) * 100}%`} class="sentences-wrapper">
              <h4>Input Sentences</h4>
              <Dropdown change={id => this.changeDropdown(id, 'sentences')} options={sentences} />
              {sentencesDOM}
              <Dropdown change={id => this.changeDropdown(id, 'manipulations')} options={manipulations} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default EmbeddingSpiral