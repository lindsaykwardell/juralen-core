import uuid from "uuid/v4";

export default class Player {
  public id: string
  public name: string
  public resources: IResources
  public hasLost: boolean

  constructor(name: string, resources: IResources){
    this.id = uuid()
    this.name = name;
    this.resources = resources
    this.hasLost = false
  }
}

interface IResources {
  actions: number
  gold: number
}