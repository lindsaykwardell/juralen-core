import Structure from './Structures/Structure'
import Plains from './Terrain/Plains'
import { Town } from './Structures/Structures'
import Mountain from './Terrain/Mountain'
import Forest from './Terrain/Forest'

export default class Cell {
  public x: number
  public y: number
  public structure: Structure | null
  public terrain: Terrain | null
  public defBonus: number
  public units: any[]
  public controlledBy: number | null
  public passable: boolean

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.structure = null
    this.terrain = null
    this.defBonus = 0
    this.units = []
    this.controlledBy = null
    this.passable = true
  }

  buildStructure(struct: typeof Structure) {
    if (this.structure) {
      const newStruct = new struct()
      newStruct.buildUnits = [
        ...new Set([...newStruct.buildUnits, ...this.structure.buildUnits])
      ]
    } else {
      this.structure = new struct()
    }
    this.defBonus = this.structure.initDefBonus
  }
}

export enum Terrain {
  Plains = 'Plains',
  Forest = 'Forest',
  Mountain = 'Mountain'
}
