import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

export default class ChildSelector extends Component {
  handleChange(event) {
    this.props.select(event.target.value)
  }

  render({ options, select }) {
    const optionsDOM = options.map(o => {
      return <option 
        value={o.id}>{o.description}</option>
    })

    optionsDOM.unshift(<option>none</option>)

    return (
      <select onChange={this.handleChange.bind(this)}>{optionsDOM}</select>
    )
  }
}