import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

const vizHeight = 600
const innerContentsWidth = 900

class SentencesVsFeaturesMatrix extends Component {
  constructor(props) {
    super(props)

    this.setState({})
  }

  componentWillMount() {

  }

  render() {
    return (
      <div class="inset_visualization" id="sentences_vs_features_matrix">
        <div style={`height:${vizHeight}px`} class="buffer"></div>
        <div style={`height:${vizHeight}px`} class="contents">
          <div style={`width:${innerContentsWidth}px`} class="inner-contents"></div>
        </div>
      </div>
    )
  }
}

export default SentencesVsFeaturesMatrix