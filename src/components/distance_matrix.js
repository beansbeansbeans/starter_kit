import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

let distances = ['euclidean', 'manhattan', 'wasserstein']
let sortBy = [{
  label: 'euclidean',
  perm: [310, 343, 491, 336, 464, 230, 256, 296, 191, 314, 173, 496, 271, 190, 281, 52, 457, 339, 353, 290, 305, 321, 167, 494, 63, 307, 168, 38, 469, 123, 73, 458, 193, 272, 75, 18, 287, 140, 135, 447, 133, 342, 499, 14, 223, 39, 477, 428, 459, 88, 424, 197, 24, 113, 214, 294, 303, 65, 351, 161, 304, 212, 445, 374, 57, 219, 181, 356, 222, 430, 397, 264, 358, 326, 492, 385, 407, 323, 92, 453, 357, 48, 392, 15, 232, 72, 484, 94, 25, 414, 260, 262, 316, 103, 441, 322, 129, 344, 144, 172, 141, 390, 431, 160, 362, 77, 258, 37, 465, 96, 179, 379, 164, 460, 87, 209, 434, 118, 119, 51, 341, 350, 236, 76, 355, 122, 187, 376, 456, 152, 462, 419, 208, 114, 372, 111, 44, 211, 6, 53, 267, 432, 393, 79, 490, 143, 242, 148, 395, 61, 192, 112, 381, 404, 263, 486, 157, 301, 205, 450, 47, 493, 308, 218, 278, 49, 203, 3, 373, 80, 402, 7, 104, 289, 29, 335, 269, 337, 489, 274, 34, 279, 487, 89, 283, 297, 329, 23, 224, 56, 198, 331, 364, 299, 246, 334, 32, 378, 389, 495, 417, 483, 162, 413, 195, 312, 11, 207, 361, 468, 306, 233, 433, 109, 31, 107, 439, 471, 408, 498, 401, 437, 240, 455, 416, 93, 345, 2, 68, 220, 435, 41, 213, 165, 163, 1, 254, 16, 180, 449, 142, 324, 405, 46, 461, 27, 26, 139, 128, 387, 421, 340, 480, 22, 244, 444, 488, 62, 420, 436, 138, 35, 248, 124, 21, 154, 201, 238, 86, 66, 243, 309, 423, 137, 257, 74, 332, 400, 410, 478, 228, 429, 204, 265, 127, 409, 226, 411, 454, 347, 302, 360, 9, 145, 102, 438, 28, 136, 225, 229, 216, 121, 286, 54, 403, 235, 245, 178, 427, 363, 78, 159, 90, 291, 10, 185, 64, 156, 116, 169, 170, 295, 384, 367, 320, 467, 183, 250, 12, 239, 100, 485, 194, 59, 396, 472, 234, 249, 43, 298, 83, 98, 327, 476, 176, 369, 440, 13, 470, 174, 412, 241, 382, 150, 199, 270, 370, 125, 354, 5, 84, 50, 466, 189, 217, 149, 276, 292, 497, 151, 386, 175, 311, 155, 368, 448, 479, 215, 338, 117, 126, 158, 380, 273, 202, 251, 210, 315, 99, 227, 442, 8, 105, 130, 131, 177, 333, 0, 300, 60, 346, 330, 481, 277, 422, 30, 259, 474, 255, 446, 237, 106, 317, 293, 348, 359, 261, 366, 406, 71, 36, 91, 231, 473, 352, 377, 40, 200, 33, 188, 285, 253, 20, 132, 221, 81, 482, 288, 69, 101, 97, 134, 70, 388, 55, 371, 415, 147, 452, 268, 325, 282, 146, 375, 17, 184, 275, 365, 182, 475, 166, 328, 399, 252, 313, 58, 425, 463, 4, 206, 443, 318, 426, 266, 383, 247, 319, 280, 398, 42, 186, 19, 284, 153, 394, 196, 391, 45, 115, 108, 349, 85, 418, 451, 171, 67, 82, 110, 95, 120]
}, {
  label: 'wasserstein',
  perm: [106, 49, 206, 317, 435, 482, 104, 132, 35, 138, 400, 309, 454, 360, 448, 203, 243, 340, 22, 168, 304, 292, 201, 230, 404, 107, 428, 69, 98, 145, 487, 65, 439, 444, 33, 410, 423, 257, 190, 402, 248, 411, 28, 80, 238, 192, 490, 4, 50, 273, 296, 108, 338, 440, 182, 287, 270, 6, 253, 422, 86, 136, 152, 151, 285, 126, 127, 154, 368, 231, 381, 177, 262, 261, 446, 479, 150, 7, 23, 70, 21, 301, 302, 121, 188, 369, 216, 229, 155, 450, 432, 20, 333, 18, 205, 19, 466, 480, 160, 278, 447, 9, 259, 191, 286, 113, 161, 218, 438, 125, 228, 43, 265, 5, 354, 370, 497, 101, 47, 409, 299, 386, 84, 331, 29, 373, 0, 289, 213, 361, 387, 195, 408, 52, 268, 75, 27, 224, 143, 306, 472, 163, 399, 255, 89, 335, 314, 493, 117, 495, 46, 60, 40, 200, 274, 128, 406, 38, 10, 196, 441, 133, 220, 64, 99, 247, 343, 469, 197, 204, 443, 131, 429, 184, 456, 212, 478, 187, 193, 342, 227, 319, 134, 312, 295, 463, 232, 135, 344, 379, 164, 460, 419, 72, 103, 165, 275, 294, 122, 347, 30, 172, 221, 252, 280, 346, 42, 186, 293, 199, 311, 300, 350, 8, 374, 105, 396, 476, 118, 394, 120, 481, 24, 277, 298, 349, 356, 405, 169, 322, 45, 91, 398, 36, 166, 115, 451, 2, 383, 78, 159, 90, 291, 282, 345, 457, 353, 367, 44, 449, 34, 391, 85, 464, 170, 426, 210, 318, 194, 110, 149, 51, 416, 245, 54, 326, 235, 403, 100, 467, 183, 239, 250, 427, 485, 384, 12, 116, 222, 430, 266, 249, 87, 153, 14, 477, 421, 455, 264, 109, 305, 308, 39, 88, 320, 139, 323, 56, 233, 237, 458, 73, 208, 77, 465, 358, 141, 407, 25, 390, 434, 156, 414, 321, 41, 417, 63, 418, 462, 68, 307, 362, 483, 494, 236, 355, 258, 401, 437, 185, 48, 94, 76, 372, 114, 313, 179, 431, 453, 15, 96, 471, 144, 376, 397, 499, 129, 260, 209, 316, 415, 452, 365, 97, 496, 147, 412, 175, 366, 142, 241, 1, 251, 81, 303, 225, 325, 380, 26, 202, 352, 377, 16, 130, 174, 189, 470, 173, 180, 382, 17, 53, 389, 269, 436, 215, 31, 158, 198, 475, 137, 214, 124, 267, 254, 279, 276, 491, 244, 336, 388, 473, 359, 283, 348, 272, 123, 3, 11, 58, 271, 102, 146, 364, 375, 328, 378, 82, 119, 474, 83, 181, 157, 217, 242, 351, 226, 488, 498, 219, 140, 468, 71, 330, 57, 329, 327, 445, 281, 32, 459, 207, 288, 93, 13, 167, 176, 332, 112, 393, 489, 290, 425, 263, 148, 246, 61, 334, 66, 79, 420, 486, 62, 395, 297, 256, 337, 55, 424, 284, 461, 341, 492, 171, 95, 433, 442, 484, 234, 315, 363, 59, 178, 37, 385, 392, 324, 339, 310, 357, 67, 223, 111, 92, 162, 240, 211, 413, 74, 371]
}]

let dimensions = ['100'], sentences = []

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

class DistanceMatrix extends Component {
  constructor(props) {
    super(props)

    let data = {}, max = {}

    distances.forEach(d => {
      data[d] = {}
      max[d] = {}
      dimensions.forEach(dim => {
        data[d][dim] = null
        max[d][dim] = 0
      })
    })

    this.setState({
      canvasTop: 0,
      canvasLeft: 0,
      max,
      highlightedSentences: [],
      dragging: false,
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
      }),
      sortBy: sortBy.map((d, i) => {
        if(i === 0) {
          d.active = true
        }
        d.id = d.label
        return d
      }),
      data,
      canvasSize: 0,
      highlightRegion: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    })
  }

  componentWillMount() {
    bindAll(this, ['changeDropdown', 'draw'])

    let files = []

    for(let i=0; i<distances.length; i++) {
      for(let j=0; j<dimensions.length; j++) {
        files.push(`distance_matrix_${distances[i]}_${dimensions[j]}`)
      }
    }

    files.push('distance_matrix_sentences')

    Promise.all(files.map(getData)).then(resp => {
      sentences = resp[files.length - 1]

      let data = this.state.data
      let canvas = document.querySelector("#distance_matrix #canvas")
      this.ctx = canvas.getContext('2d')
      let keys = Object.keys(resp[0])
      let canvasSize = keys.length
      let max = this.state.max

      canvas.width = 2 * canvasSize
      canvas.height = 2 * canvasSize
      canvas.style.width = canvasSize + 'px'
      canvas.style.height = canvasSize + 'px'

      this.ctx.scale(2, 2)

      distances.forEach((d, i) => {
        dimensions.forEach((dim, dimi) => {
          data[d][dim] = resp[i * dimensions.length + dimi]
        })
      })

      for(let i=0; i<keys.length; i++) {
        let key = keys[i]
        let targetKeys = Object.keys(resp[0][key])
        for(let j=0; j<targetKeys.length; j++) {
          distances.forEach((d, i) => {
            dimensions.forEach((dim, dimi) => {
              let val = resp[i * dimensions.length + dimi][key][targetKeys[j]]

              if(val > max[d][dim]) max[d][dim] = val
            })
          })
        }
      }

      max.wasserstein['100'] = 0.025 // otherwise everything is super close

      this.setState({ data, max, canvasSize }, () => {
        let rect = document.querySelector("canvas").getBoundingClientRect()
        this.setState({
          canvasLeft: rect.left,
          canvasTop: rect.top
        }, this.draw)
      })
    })

    window.addEventListener("mousemove", e => {
      if(!this.state.dragging) return

      let highlightRegion = this.state.highlightRegion

      let left = e.clientX - this.state.canvasLeft
      let top = e.clientY - this.state.canvasTop

      highlightRegion.width = left - highlightRegion.x
      highlightRegion.height = top - highlightRegion.y
      this.setState({ highlightRegion})
    })

    window.addEventListener("mouseup", e => {
      let { x, y, width, height } = this.state.highlightRegion

      let indices = []
      for(let i=0; i<width; i++) {
        indices.push(x + i)
      }

      for(let i=0; i<height; i++) {
        if(indices.indexOf(y + i) === -1) indices.push(y + i)
      }

      this.setState({ 
        dragging: false,
        highlightedSentences: indices.map(index => {
          return {
            index,
            sentence: sentences[index].sentence
          }
        })
      })
    })
  }

  componentDidMount() {
    this.draw()
  }

  draw() {
    let { data, max, dimensions, distances, sortBy } = this.state
    let activeDim = dimensions.find(d => d.active).label
    let activeDistance = distances.find(d => d.active).label
    let activeData = data[activeDistance][activeDim]
    let activeMax = max[activeDistance][activeDim]
    let perm = sortBy.find(d => d.active).perm

    if(activeData) {
      let keys = Object.keys(activeData)
      let size = keys.length

      this.ctx.clearRect(0, 0, size, size)

      for(let row=0; row<size; row++) {
        let key = keys[row]
        for(let col=0; col<size; col++) {
          let target = keys[col]

          let val = activeData[key][target]
          if(typeof val === 'undefined') {
            val = activeData[target][key]
          }

          if(key === target) {
            val = 0
          }

          this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - (val / activeMax)})`
          this.ctx.fillRect(perm.indexOf(col), perm.indexOf(row), 1, 1)
          // this.ctx.fillRect(col, row, 1, 1)
        }
      }
    }
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
    }, this.draw)
  }

  render({}, {distances, sortBy, dimensions, data, highlightRegion, canvasSize, canvasLeft, canvasTop, highlightedSentences}) {

    let sentences = null

    if(highlightedSentences.length) {
      sentences = highlightedSentences.map(d => {
        return <div class="sentence">{d.index + ': ' + d.sentence}</div>
      })
    }

    return (
      <div id="distance_matrix">
        <div>DIMENSIONS</div>
        <Dropdown change={id => this.changeDropdown(id, 'dimensions')} options={dimensions} />
        <div>COLOR BY</div>
        <Dropdown change={id => this.changeDropdown(id, 'distances')} options={distances} />
        <div>SORT BY</div>
        <Dropdown change={id => {
          this.changeDropdown(id, 'sortBy')
          this.setState({
            highlightRegion: {
              x: 0,
              y: 0,
              width: 0,
              height: 0
            },
            highlightedSentences: []
          })
        }} options={sortBy} />
        <br/>
        <div onMouseDown={e => {
          highlightRegion.x = e.clientX - canvasLeft
          highlightRegion.y = e.clientY - canvasTop
          highlightRegion.width = 0
          highlightRegion.height = 0

          this.setState({ 
            dragging: true,
            highlightRegion
          })
        }} style={`width:${canvasSize}px;height:${canvasSize}px`} class="canvas_wrapper">
          <canvas id="canvas"></canvas>
          <div style={`width:${highlightRegion.width}px;height:${highlightRegion.height}px;top:${highlightRegion.y}px;left:${highlightRegion.x}px;`} class="highlight-region"></div>
        </div>
        <div id="highlighted_sentences">
          <div class="label">HIGHLIGHTED SENTENCES</div>
          {sentences}
        </div>
      </div>
    )
  }
}

export default DistanceMatrix