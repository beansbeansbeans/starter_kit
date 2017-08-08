import preact from 'preact'
let { h, render, Component } = preact
import mediator from './mediator'
import sharedState from './sharedState'

export default class MoralMatricesChart extends Component {

  render({ matrix }, {  }) {
    return (
      <div id="matrix">
        {matrix.map(m => {
          let bar = <div class="bar null"></div>
          if(m.value !== null) {
            bar = <div style={`width: ${m.value * 100}%`} class="bar"></div>
          }

          return <div class="matrix-row">
            <div class="label">{m.label}</div>
            {bar}
          </div>
        })}
      </div>
    )
  }
}