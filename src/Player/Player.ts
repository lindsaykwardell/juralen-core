import uuid from "uuid/v4";

export default class Player {
  public id: string
  public name: string
  public resources: IResources

  constructor(name: string, resources: IResources){
    this.id = uuid()
    this.name = name;
    this.resources = resources
  }
}

interface IResources {
  actions: number
  gold: number
  farms: number
  towns: number
}