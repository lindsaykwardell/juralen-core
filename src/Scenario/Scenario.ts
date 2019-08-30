import Cell from "../Cell/Cell"
import Plains from "../Cell/Terrain/Plains";
import Mountain from "../Cell/Terrain/Mountain";
import Forest from "../Cell/Terrain/Forest";
import { Town } from "../Cell/Structures/Structures";

export default class Scenario {
  // constructor(
  //   scenarioType = "quick",
  //   loadScenario = { gridSize: { x: 9, y: 9 } }
  // ) {
  //   if (scenarioType === "quick") {
  //     this.initialGrid = this.generateGrid({ ...loadScenario.gridSize });
  //     this.initialResources = {
  //       Player1: { actions: 4, gold: 5, farms: 1, towns: 1, units: 0 },
  //       Player2: { actions: 4, gold: 5, farms: 1, towns: 1, units: 0 }
  //     };
  //     this.me = "Player1";
  //     this.notMe = "Player2";
  //     this.objectives = [
  //       {
  //         type: "boardControl",
  //         value: 2
  //       },
  //       {
  //         type: "belowMinTownCount",
  //         value: 0
  //       }
  //     ];
  //     this.beforeStart = [];
  //     this.afterEnd = [];
  //   }
  // }

  generateGrid = (gridSize = { x: 9, y: 9 }) => {
    const grid: Cell[][] = [];
    for (let y = 0; y < gridSize.y; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < gridSize.x; x++) {
        const thisCell = this.generateCell(x, y);

        row.push(thisCell);
      }
      grid.push(row);
    }
    return grid;
  };

  generateCell(x: number, y: number) {
    const roll = Math.floor(Math.random() * 101)
    if (roll <= 12) {
      // Make a Plains with a Town
      const cell = new Plains(x, y)
      cell.buildStructure(Town)
      return cell
    }
    if (roll > 12 && roll <= 20) {
      // Make a Mountain
      const cell = new Mountain(x, y)
      return cell
    }
    if (roll > 20 && roll <= 40) {
      // Make a Forest
      const cell = new Forest(x, y)
      return cell
    }
    const cell = new Plains(x, y)
    return cell
  }

  // checkObjectives = state => {
  //   return new Promise((resolve, reject) => {
  //     this.objectives.forEach(objective => {
  //       switch (objective.type) {
  //         case "boardControl":
  //           let gridControlCount = 0;
  //           state.grid.forEach(row => {
  //             row.forEach(cell => {
  //               if (cell.controlledBy === state.me) gridControlCount++;
  //             });
  //           });
  //           if (
  //             gridControlCount >=
  //             (state.grid[0].length * state.grid.length) / objective.value
  //           ) {
  //             reject();
  //           }
  //           break;
  //         case "belowMinTownCount":
  //           if (state.resources[state.notMe].towns === 0) {
  //             reject();
  //           }
  //           break;
  //         default:
  //         // Do nothing.
  //       }
  //     });
  //     resolve();
  //   });
  // };
}
