import uuid from 'uuid/v4'
import Scenario from '../Scenario/Scenario'
import StandardAI from './AI/Standard'

export default class Player {
  public id: string
  public name: string
  public resources: IResources
  public hasLost: boolean
  public type: PlayerType
  public ai: (scenario: Scenario) => any[]

  constructor(
    name: string,
    type: PlayerType,
    resources: IResources,
    ai?: (scenario: Scenario) => any[]
  ) {
    this.id = uuid()
    this.name = name
    this.resources = resources
    this.hasLost = false
    this.type = type
    this.ai = ai ? ai : StandardAI
  }
}

interface IResources {
  actions: number
  gold: number
}

export enum PlayerType {
  Human,
  AI
}
