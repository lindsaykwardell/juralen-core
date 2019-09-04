import Structure from './Structure'
import { Soldier, Warrior } from '../../Units/Units'

export default class Fortress extends Structure {
  constructor() {
    super()
    this.name = 'Fortress'
    this.buildUnits = [Soldier, Warrior]
    this.initDefBonus = 7
  }

  public static structureName = 'Fortress'
}
