import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import sharedState from './sharedState'

export default class UserTurnInput extends Component {
  render({ addAttack, concede, exit, submitPosition, lastMove, data }) {

    let controls = [], argText

    if(lastMove === sharedState.get("web")._root._id) {
      argText = data
      controls.push(<button onClick={() => submitPosition(true)}>agree</button>)
      controls.push(<button onClick={() => submitPosition(false)}>disagree</button>)
    } else {
      argText = `computer says: ${data}`
      controls.push(<button onClick={addAttack}>attack</button>)
      controls.push(<button onClick={concede}>concede</button>)
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