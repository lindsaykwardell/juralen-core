import Unit from '../../Units/Unit'

export default class Structure {
  public name: string = ''
  public buildUnits: typeof Unit[] = []
  public initDefBonus: number = 0
  public fortifyCost: number = 0
}
