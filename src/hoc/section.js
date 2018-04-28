import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle } = helpers

function Section(WrappedComponent) {
  return class extends Component {
    constructor(props) {
      super(props)

      this.state = {}
    }

    render({ title }) {
      return <div class="section">
        <h2>{title}</h2>
        <WrappedComponent {...this.props} />
        <hr/>
      </div>
    }
  }
}

export default Section