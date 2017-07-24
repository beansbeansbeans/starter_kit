import { select } from 'd3-selection'
import { stratify as d3Stratify, cluster } from 'd3-hierarchy'
import sharedState from './sharedState'

let svg, g, tree, 
  stratify = d3Stratify().id(d => d.name).parentId(d => d.parent),
  width, height

export default {
  initialize(data) {
    width = sharedState.get("windowWidth")
    height = sharedState.get("windowHeight")

    svg = select("#debug-svg")
    svg.attr("width", width)
    svg.attr("height", height)

    g = svg.append("g").attr("transform", "translate(40, 0)")

    let processedData = []

    data.traverseDF(node => {
      processedData.push({
        parent: node.parent ? node.parent._id : '',
        name: node._id,
        value: node
      })
    })

    var root = stratify(processedData)

    tree = cluster().size([ height, width - 160 /*to accommodate labels*/ ])(root)

    const link = g.selectAll(".link")
        .data(root.descendants().slice(1))
      .enter().append("path")
        .attr("class", "link")
        .attr("d", d => "M" + d.y + "," + d.x
            + "C" + (d.parent.y + 100) + "," + d.x
            + " " + (d.parent.y + 100) + "," + d.parent.x
            + " " + d.parent.y + "," + d.parent.x)

    const node = g.selectAll(".node")
        .data(root.descendants())
      .enter().append("g")
        .attr("class", d => "node" + (d.cildren ? "node--internal" : " node-leaf"))
        .attr("transform", d => `translate(${d.y}, ${d.x})`)

    node.append("circle").attr("r", 2.5)

    node.append("text")
      .attr("dy", 3)
      .attr("x", d => d.children ? -8 : 8)
      .text(d => d.data.value.data)
  },

  draw() {

  }
}