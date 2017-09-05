import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import ChildSelector from './childSelector'
import Support from './support'

export default class ArgumentControls extends Component {
  render({ resolveSupporter, supporters, supportive, left, top, attackers, defenders, addChild, concede, text }) {
    let controls = []

    if(supportive) {
      if(defenders.length) {
        controls.push(<ChildSelector 
          attacking={false}
          options={defenders}
          select={arg => addChild(arg, true)} />)
      } else {
        controls.push(<div id="no-options-available">No options available</div>)
      }
    } else {
      if(attackers.length) {
        controls.push(<ChildSelector 
          attacking={true}
          options={attackers}
          select={arg => addChild(arg, false)} />)
      }

      if(concede) {
        controls.push(<button onClick={concede}>concede</button>)
      }

      if(!controls.length) {
        controls.push(<div id="no-options-available">No options available</div>)
      }
    }

    return (
      <div id="argument-controls">
        <div class="arg-text">{text}</div>
        <Support 
          clickUser={resolveSupporter}
          supporters={supporters} />
        <div>{controls}</div>
      </div>
    )
  }
}