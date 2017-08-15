import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'

export default class ArgumentLabels extends Component {
  render({ labels, constraints, onMouseOver, onClick }) {
    return (
      <div id="argument-labels-wrapper">
        {labels.map(label => {
          let background = 'transparent'

          if(label.value !== null && typeof label.value !== 'undefined') {
            if(label.value) {
              background = 'rgba(0, 255, 0, 0.2)'
            } else {
              background = 'rgba(255, 0, 0, 0.2)'
            }
          }

          return <div 
            style={`
              position:fixed; top: ${label.top}px; 
              left: ${label.left + 3}px; 
              height: ${label.height}px; 
              width: ${label.width}px; 
              font-size: 11px; 
              background-color: ${background};
              border: ${constraints.find(c => c.id === label.id) ? 'solid 2px yellow' : ''};
            `}
            class="debug-label"
            onMouseOver={() => onMouseOver(label) }
            onClick={() => onClick(label)}
            data-id={label.id}>
            {label.id.substring(0, 2) + ' ' + (label.moralMatrices ? label.moralMatrices.join(" ") : '')}
          </div>
        })}
      </div>
    )
  }
}