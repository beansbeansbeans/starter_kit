import helpers from './helpers/helpers'
import "../main.scss"
import { values } from 'underscore'
import forceLayout3d from 'ngraph.forcelayout3d'

console.log(forceLayout3d)

/**
 * An awesome script
 */
export default class {
  constructor(name = 'Dear Coder', text = 'hi there') {
    this.name = name
    this.text = text
  }
  get message() {
    return `${this.text} ${this.name}!`
  }
  set message(text) {
    this.text = helpers.trim(text)
  }
}