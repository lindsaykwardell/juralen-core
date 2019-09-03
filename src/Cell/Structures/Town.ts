import Structure from "./Structure";
import { Soldier } from "../../Units/Units";

export default class Town extends Structure {
  constructor() {
    super();
    this.name = "Town";
    this.buildUnits = [Soldier];
    this.initDefBonus = 3;
    this.fortifyCost = 2;
  }

  public static structureName = "Town";
}
