import Cell from '../Cell/Cell'
import Plains from '../Cell/Terrain/Plains'
import Mountain from '../Cell/Terrain/Mountain'
import Forest from '../Cell/Terrain/Forest'
import { Town, Castle } from '../Cell/Structures/Structures'
import Player from '../Player/Player'
import Unit from '../Units/Unit'
import { Soldier } from '../Units/Units'

export default class Scenario {
  private x: number
  private y: number
  public grid: Cell[][]
  public players: Player[]
  public units: Unit[]
  public activePlayer: string
  public objectives: IObjective[]
  public timeline: string[] = []

  constructor(playerCount: number) {
    this.x = 9
    this.y = 9
    this.grid = this.generateGrid()
    this.players = []
    this.units = []
    for (let i = 0; i < playerCount; i++) {
      this.players.push(
        new Player(`Player${i + 1}`, {
          actions: 4,
          gold: 2,
          farms: 1,
          towns: 1
        })
      )
    }
    this.players.forEach(player => {
      let done = false
      while (!done) {
        const x = Math.floor(Math.random() * this.x)
        const y = Math.floor(Math.random() * this.y)
        const cell = this.grid[y][x]
        if (!cell.structure) {
          cell.controlledBy = player.id
          cell.buildStructure(Castle)
          for (let i = 0; i < 3; i++) {
            this.units.push(new Soldier(cell.x, cell.y, player.id))
          }
          done = true
        }
      }
    })
    this.activePlayer = this.players[this.randomPlayer(this.players.length)].id
    this.objectives = [
      {
        objective: Objective.BoardControl,
        value: 2
      },
      {
        objective: Objective.BelowMinTownCount,
        value: 0
      }
    ]
  }

  public generateGrid = () => {
    const grid: Cell[][] = []
    for (let y = 0; y < this.y; y++) {
      const row: Cell[] = []
      for (let x = 0; x < this.x; x++) {
        const thisCell = this.generateCell(x, y)

        row.push(thisCell)
      }
      grid.push(row)
    }
    return grid
  }

  private generateCell(x: number, y: number) {
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

  public checkObjectives = (id: string) => {
    return new Promise((resolve, reject) => {
      const thisPlayer = this.players.find(player => player.id === id)
      this.objectives.forEach(objective => {
        switch (objective.objective) {
          case Objective.BoardControl:
            let gridControlCount: number = 0
            this.grid.forEach(row => {
              row.forEach(cell => {
                if (cell.controlledBy === id) gridControlCount++
              })
            })

            if (gridControlCount >= this.gridSize() / objective.value) reject()
            break
          case Objective.BelowMinTownCount:
            if (thisPlayer!.resources.towns <= 0) reject()
            break
          default:
          // Do nothing
        }
      })
      resolve()
    })
  }

  public nextPlayer(): Player {
    const key = this.players.findIndex(
      player => player.id === this.activePlayer
    )
    if (key + 1 === this.players.length) return this.players[0]
    else return this.players[key + 1]
  }

  private randomPlayer(count: number) {
    return Math.floor(Math.random() * count)
  }

  private gridSize(): number {
    return this.x * this.y
  }
}

interface IObjective {
  objective: Objective
  value: number
}

enum Objective {
  BoardControl,
  BelowMinTownCount
}
