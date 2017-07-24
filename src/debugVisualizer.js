import { select } from 'd3-selection'
import { stratify } from 'd3-hierarchy'
import sharedState from './sharedState'

let svgDOM = document.createElement("svg"), 
  svg, g,
  width, height

export default {
  initialize(tree) {
    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")

    svgDOM.setAttribute("width", width)
    svgDOM.setAttribute("height", height)

    document.body.prepend(svgDOM)

    svg = select("svg")

    g = svg.append("g").attr("transform", "translate(0, 0)")
  },

  draw() {

  }
}