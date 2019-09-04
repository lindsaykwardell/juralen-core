import Structure from './Structure'
import {
  Soldier,
  Archer,
  Assassin,
  Knight,
  Wizard,
  Priest
} from '../../Units/Units'

export default class Castle extends Structure {
  constructor() {
    super()
    this.name = 'Castle'
    this.buildUnits = [Soldier]
    this.initDefBonus = 5

    const roll2 = Math.floor(Math.random() * 51)
    if (roll2 >= 0 && roll2 <= 10) {
      this.buildUnits.push(Archer)
    }
    if (roll2 > 10 && roll2 <= 20) {
      this.buildUnits.push(Assassin)
    }
    if (roll2 > 20 && roll2 <= 30) {
      this.buildUnits.push(Knight)
    }
    if (roll2 > 30 && roll2 <= 40) {
      this.buildUnits.push(Wizard)
    }
    if (roll2 > 40 && roll2 <= 50) {
      this.buildUnits.push(Priest)
    }
  }

  public static structureName = 'Castle'
}
