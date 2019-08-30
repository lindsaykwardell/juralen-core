import Structure from './Structure'
import { Soldier } from '../../Units/Units'

export default class Castle extends Structure {
  constructor() {
    super()
    this.name = 'Castle'
    this.buildUnits = [Soldier]
    this.initDefBonus = 5
    this.fortifyCost = 1
  }
}
