import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

export default class AttackSelector extends Component {
  handleChange(event) {
    console.log("handle change")
    console.log(this)
    
    this.props.select(event.target.value)
  }

  render({ options, select }) {
    return (
      <select onChange={this.handleChange}>{options.map(o => {
        return <option 
          value={o.id}>{o.description}</option>
      })}</select>
    )
  }
}