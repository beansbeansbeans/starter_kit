import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'
import sharedState from './sharedState'

export default class UserTurnInput extends Component {
  render({ addAttack, addDefense, submitPosition, lastMove }) {
    
    let controls = []

    if(lastMove === sharedState.get("web")._root._id) {
      controls.push(<button onClick={() => submitPosition(true)}>agree</button>)
      controls.push(<button onClick={() => submitPosition(false)}>disagree</button>)
    } else {
      controls.push(<button onClick={addAttack}>attack</button>)
      controls.push(<button onClick={addDefense}>defend</button>)
    }

    return (
      <div id="user-turn-input">
        <div>[insert text of argument here]</div>
        {controls}
      </div>
    )
  }
}