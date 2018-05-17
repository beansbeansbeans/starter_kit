import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import { getData, getShader } from '../api'
const { bindAll, permute, createDropdown, getActiveOption } = helpers
import { interpolateRdBu } from 'd3-scale-chromatic'
import { debounce } from 'underscore'
import Dropdown from './dropdown'
import { line } from 'd3-shape'
import { select } from 'd3-selection'

const vizHeight = 750
const innerContentsWidth = 900
const maxCanvasHeight = 500
let cellSize = 1.5

// let models = ['infer-sent', 'quick-thought', 'glove', 'unigram-books', 'unigram-wiki', 'skip-thought', 'doc2vec']
let models = ['infer-sent', 'quick-thought', 'glove', 'unigram-books', 'skip-thought', 'doc2vec']
// let dimensions = [500, 100]
let dimensions = [500]
// let stories = ['didion', 'eclipse', 'frogtoad', 'politicslanguage', 'spacedoctors']
let stories = ['didion', 'frogtoad', 'politicslanguage', 'spacedoctors']

class SentencesVsFeaturesMatrix extends Component {
  constructor(props) {
    super(props)

    this.setState({
      canvasLeft: 0,
      canvasTop: 0,
      canvasWidth: 0,
      canvasHeight: 0,
      sentence: 0,
      models: models.map(createDropdown),
      dimensions: dimensions.map(createDropdown),
      stories: stories.map(createDropdown),
      data: {},
      bins: {},
      meta: {}
    })
  }

  draw() {
    let { models, stories, dimensions, data } = this.state
    let activeModel = getActiveOption(models)
    let activeStory = getActiveOption(stories)
    let activeDimension = getActiveOption(dimensions)
    let { embeddings, min, max } = data[activeStory][activeModel][activeDimension]

    let canvas = this.root.querySelector("canvas")

    this.ctx = canvas.getContext('2d')
    let width = embeddings.length * cellSize
    let naturalHeight = embeddings[0].encoding.length * cellSize
    let height = Math.min(naturalHeight, maxCanvasHeight)
    let cellWidth = cellSize
    let cellHeight = (height / naturalHeight) * cellSize

    canvas.width = 2 * width
    canvas.height = 2 * height

    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    this.ctx.scale(2, 2)

    for(let i=0; i<embeddings.length; i++) {
      for(let row=0; row<embeddings[0].encoding.length; row++) {
        let val = embeddings[i].encoding[row]
        val = (val - min) / (max - min)

        this.ctx.fillStyle = interpolateRdBu(val)
        this.ctx.fillRect(i * cellWidth, row * cellHeight, cellWidth, cellHeight)
      }
    }
  }

  calculateSize() {
    let rect = this.root.querySelector("canvas").getBoundingClientRect()

    this.setState({
      canvasLeft: Math.round(rect.left),
      canvasTop: Math.round(rect.top),
      canvasWidth: rect.width,
      canvasHeight: rect.height
    })
  }

  componentWillMount() {
    bindAll(this, ['draw', 'calculateSize', 'changeDropdown', 'updateBins'])

    let files = []
    let data = {}
    let bins = {}
    let meta = {}
    stories.forEach(s => {
      data[s] = {}
      bins[s] = {}
      models.forEach(m => {
        data[s][m] = {}
        bins[s][m] = {}
        meta[m] = {}
        dimensions.forEach(d => {
          data[s][m][d] = []
          bins[s][m][d] = []
          meta[m][d] = []

          files.push(`sentences_vs_features/${s}_${m}_${d}`)
          // files.push(`sentences_vs_features/${s}_${m}_${d}_tsne`)
          files.push(`sentences_vs_features/didion_${m}_${d}_tsne`) // try using same tsne for all
        })
      })
    })

    Promise.all(files.map(getData)).then(resp => {
      stories.forEach((s, si) => {
        let storyBatchLength = models.length * dimensions.length * 2
        models.forEach((m, mi) => {
          let modelBatchLength = dimensions.length * 2
          dimensions.forEach((d, di) => {
            let index = si * storyBatchLength + mi * modelBatchLength + di * 2
            let tSnePerm = resp[index + 1]

            let permArray = []
            for(let i=0; i<tSnePerm.length; i++) permArray.push(i)

            permArray.sort((a, b) => tSnePerm[a] - tSnePerm[b])

            let sentences = resp[index].map(sent => {
              sent.encoding = permute(sent.encoding, permArray)
              return sent
            })

            let encodingLength = sentences[0].encoding.length

            for(let i=0; i<encodingLength; i++) {
              bins[s][m][d].push([])
              if(meta[m][d].length < encodingLength) {
                meta[m][d].push([Infinity, 0])
              }
            }

            let min = 100, max = -100
            for(let i=0; i<sentences.length; i++) {
              let encodings = sentences[i].encoding

              for(let j=0; j<encodingLength; j++) {
                let val = encodings[j]
                bins[s][m][d][j].push(val)
                meta[m][d][j][0] = Math.min(meta[m][d][j][0], val)
                meta[m][d][j][1] = Math.max(meta[m][d][j][1], val)

                if(val > max) max = val.toFixed(2)
                if(val < min) min = val.toFixed(2)
              }
            }

            bins[s][m][d].forEach(row => row.sort())

            data[s][m][d] = { embeddings: sentences, min, max }
          })
        })
      })

      console.log(bins)
      console.log(meta)

      this.setState({ data, bins, meta })

      this.draw()
      this.updateBins()
      setTimeout(this.calculateSize, 0)
    })

    window.addEventListener("mousemove", e => {
      let { data, models, stories, dimensions } = this.state
      if(!Object.keys(data).length) return

      let activeModel = getActiveOption(models)
      let activeStory = getActiveOption(stories)
      let activeDimension = getActiveOption(dimensions)
      let sentences = data[activeStory][activeModel][activeDimension].embeddings

      let left = e.clientX - this.state.canvasLeft
      let index = Math.floor(left / cellSize)

      this.setState({ sentence: index > 0 && index < sentences.length ? index : 0 })
    })

    window.addEventListener("scroll", debounce(this.calculateSize, 200))
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
    }, () => {
      this.draw()
      this.updateBins()
      this.calculateSize()
    })
  }

  updateBins() {
    let { data, models, stories, dimensions } = this.state
    let activeModel = getActiveOption(models)
    let activeStory = getActiveOption(stories)

    let graphXIncrement = 2
    let graphHeight = 150

    stories.forEach((s, si) => {
      let storyBins = []
      for(let i=0; i<100; i++) storyBins.push(Math.random())

      select(this.root.querySelector(`svg path:nth-of-type(${si + 1})`))
        .attr("d", line().x((d, i) => i * graphXIncrement).y(d => (1 - (d)) * graphHeight)(storyBins))
        .style("stroke-width", s.id === activeStory ? "1.5" : "0.5")
        .style("stroke", s.id === activeStory ? "#FF6468" : "#999")
    })
  }

  render({}, { sentence, canvasWidth, canvasHeight, models, dimensions, stories, data, canvasLeft }) {
    let activeModel = getActiveOption(models)
    let activeStory = getActiveOption(stories)
    let activeDimension = getActiveOption(dimensions)
    let activeSentence, scale

    if(Object.keys(data).length) {
      let { embeddings, min, max } = data[activeStory][activeModel][activeDimension]
      activeSentence = <div class="active-sentence">{embeddings[sentence].sentence}</div>
      scale = <div class="scale-wrapper">
        <div class="scale-label">{min}</div>
        <div style={`background-image: linear-gradient(to right, ${interpolateRdBu(0)}, ${interpolateRdBu(0.25)}, ${interpolateRdBu(0.5)}, ${interpolateRdBu(0.75)}, ${interpolateRdBu(1)})`} class="color-bar"></div>
        <div class="scale-label">{max}</div>
      </div>
    }

    return (
      <div ref={ c => this.root=c } class="inset_visualization" id="sentences_vs_features_matrix">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents">
            <div class="controls">
              <div class="dropdown-wrapper-wrapper">
                <div class="dropdown-wrapper">
                  <h4 class="label">Story</h4>
                  <Dropdown change={id => this.changeDropdown(id, 'stories')} options={stories} />
                </div>
                <div class="dropdown-wrapper">
                  <h4 class="label">Model</h4>
                  <Dropdown change={id => this.changeDropdown(id, 'models')} options={models} />
                </div>
                <div class="dropdown-wrapper">
                  <h4 class="label">Dimensions</h4>
                  <Dropdown change={id => this.changeDropdown(id, 'dimensions')} options={dimensions} />
                </div>
              </div>
              <div class="bins-wrapper">
                <div class="svg-wrapper">
                  <svg>{stories.map(s => <path></path>)}</svg>
                </div>
              </div>
              {scale}
            </div>
            <div class="canvas-wrapper">
              <canvas></canvas>
              <div data-active="true" style={`height:${canvasHeight}px;left:${sentence * cellSize - 1}px`} class="mask"></div>
              {activeSentence}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SentencesVsFeaturesMatrix