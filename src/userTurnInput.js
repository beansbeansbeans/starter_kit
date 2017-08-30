import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import sharedState from './sharedState'
import ChildSelector from './components/childSelector'

export default class UserTurnInput extends Component {
  render({ attackers, addChild, concede, exit, submitPosition, lastMove, data }) {

    let controls = [], argText

    if(lastMove === sharedState.get("web")._root._id) {
      argText = data
      controls.push(<button onClick={() => submitPosition(true)}>agree</button>)
      controls.push(<button onClick={() => submitPosition(false)}>disagree</button>)
    } else {
      argText = `computer says: ${data}`
      if(attackers.length) {
        controls.push(<ChildSelector 
          attacking={true}
          options={attackers}
          select={addChild} />)
      }

      if(concede) {
        controls.push(<button onClick={concede}>concede</button>)
      }

      if(!attackers.length && !concede) {
        controls.push(<div>No options available</div>)
      }

      controls.push(<button onClick={exit}>exit</button>)
    }

    return (
      <div id="user-turn-input">
        <div>{argText}</div>
        {controls}
      </div>
    )
  }
}