import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import sharedState from './sharedState'

export default class UserTurnInput extends Component {
  render({ addAttack, concede, exit, submitPosition, lastMove, data }) {

    let controls = []

    if(lastMove === sharedState.get("web")._root._id) {
      controls.push(<button onClick={() => submitPosition(true)}>agree</button>)
      controls.push(<button onClick={() => submitPosition(false)}>disagree</button>)
    } else {
      controls.push(<button onClick={addAttack}>attack</button>)
      controls.push(<button onClick={concede}>concede</button>)
      controls.push(<button onClick={exit}>exit</button>)
    }

    return (
      <div id="user-turn-input">
        <div>{`computer says: ${data}`}</div>
        {controls}
      </div>
    )
  }
}