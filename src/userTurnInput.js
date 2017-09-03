import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import sharedState from './sharedState'
import ChildSelector from './components/childSelector'

export default class UserTurnInput extends Component {
  render({ attackers, addChild, concede, exit, submitPosition, lastMove, data }) {

    let controls = [], argText

    if(lastMove === sharedState.get("web")._root._id) {
      argText = 'The claim:'
      controls.push(<button onClick={() => submitPosition(true)}>agree</button>)
      controls.push(<button onClick={() => submitPosition(false)}>disagree</button>)
    } else {
      argText = 'The other side says:'
      if(attackers.length) {
        controls.push(<ChildSelector 
          attacking={true}
          options={attackers}
          select={arg => addChild(arg, false)} />)
      }

      if(concede) {
        controls.push(<button onClick={concede}>concede</button>)
      }

      if(!attackers.length && !concede) {
        controls.push(<div>No options available</div>)
      }
    }

    return (
      <div id="user-turn-input">
        <div class="arg-text"><span>{argText}</span> {data}</div>
        {controls}
      </div>
    )
  }
}