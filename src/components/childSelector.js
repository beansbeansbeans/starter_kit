import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

export default class ChildSelector extends Component {
  state = { selected: this.props.options[0].id }

  handleChange(event) {
    event.stopPropagation()
    
    if(event.target.value !== this.state.selected) {
      this.setState({ selected: event.target.value })
    }
  }

  render({ options, select, attacking }, { selected }) {
    return (
      <div class="child-selector">
        <select onChange={this.handleChange.bind(this)}>{options.map(o => {
            return <option 
              value={o.id}>{o.description}</option>
          })}
        </select>
        <button onClick={e => select(selected)}>{attacking ? 'attack' : 'defend'}</button>
      </div>
    )
  }
}