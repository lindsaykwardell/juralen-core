import { PlayerType } from './../Player/Player'
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
        new Player(`Player${i + 1}`, PlayerType.Human, {
          actions: 4,
          gold: 2
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

  public Units = () => {
    UnitSet.unitSet = this.units
    return UnitSet
  }

  public Cells = () => {
    CellSet.cellSet = []
    CellSet.unitSet = this.units
    this.grid.forEach(row => {
      row.forEach(cell => CellSet.cellSet.push(cell))
    })

    return CellSet
  }

  public Players = () => {
    PlayerSet.playerSet = this.players
    return PlayerSet
  }

  public checkObjectives = (id: string) => {
    return new Promise((resolve, reject) => {
      const thisPlayer = this.players.find(player => player.id === id)
      this.objectives.forEach(objective => {
        switch (objective.objective) {
          case Objective.BoardControl:
            if (
              this.Cells()
                .controlledBy(id)
                .display().length >=
              this.gridSize() / objective.value
            ) {
              this.players.find(player => player.id === id)!.hasLost = true
              reject()
            }
            break
          case Objective.BelowMinTownCount:
            if (
              this.Cells()
                .controlledBy(thisPlayer!.id)
                .hasStructure()
                .display().length <= 0
            ) {
              this.players.find(player => player.id === id)!.hasLost = true
              reject()
            }
            break
          default:
          // Do nothing
        }
      })
      resolve()
    })
  }

  public nextPlayer(): Player {
    const activePlayers = this.Players()
      .hasNotLost()
      .display()
    const key = activePlayers.findIndex(
      player => player.id === this.activePlayer
    )
    if (key + 1 === activePlayers.length) return activePlayers[0]
    else return activePlayers[key + 1]
  }

  private randomPlayer(count: number) {
    return Math.floor(Math.random() * count)
  }

  private gridSize(): number {
    return this.x * this.y
  }

  public getDistance = getDistance

  public getMoveCost = (units: Unit[]) => {
    let moveCost = 0
    units.forEach(unit => {
      moveCost += unit.move
    })
    return moveCost
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

interface IUnitSet {
  unitSet: Unit[]
  refresh: (val: Unit[]) => IUnitSet
  atLoc: (x: number, y: number) => IUnitSet
  withinDistance: (val: number, cell: { x: number; y: number }) => IUnitSet
  controlledBy: (id: string) => IUnitSet
  notControlledBy: (id: string) => IUnitSet
  display: () => Unit[]
  is: (names: string[]) => IUnitSet
}

const UnitSet: IUnitSet = {
  unitSet: [],
  refresh(val: Unit[]) {
    this.unitSet = val
    return this
  },
  atLoc(x: number, y: number) {
    this.unitSet = this.unitSet.filter(unit => unit.x === x && unit.y === y)
    return this
  },
  withinDistance(val: number, cell: { x: number; y: number }) {
    this.unitSet = this.unitSet.filter(
      unit =>
        val >= getDistance({ x: unit.x, y: unit.y }, { x: cell.x, y: cell.y })
    )
    return this
  },
  controlledBy(id: string) {
    this.unitSet = this.unitSet.filter(unit => unit.controlledBy === id)
    return this
  },
  notControlledBy(id: string) {
    this.unitSet = this.unitSet.filter(unit => unit.controlledBy !== id)
    return this
  },
  is(names: string[]) {
    this.unitSet = this.unitSet.filter(unit => names.includes(unit.name))
    return this
  },
  display() {
    return [...this.unitSet]
  }
}

interface ICellSet {
  unitSet: Unit[]
  cellSet: Cell[]
  atLoc: (x: number, y: number) => Cell
  inRow: (row: number) => ICellSet
  inCol: (col: number) => ICellSet
  hasStructure: (name?: string[]) => ICellSet
  hasUnit: (name?: string[]) => ICellSet
  controlledBy: (id: string) => ICellSet
  notControlledBy: (id: string) => ICellSet
  display: () => Cell[]
}

const CellSet: ICellSet = {
  unitSet: [],
  cellSet: [],
  atLoc(x: number, y: number) {
    this.cellSet = this.cellSet.filter(cell => cell.x === x && cell.y === y)
    return this.cellSet[0]
  },
  inRow(row: number) {
    this.cellSet = this.cellSet.filter(cell => cell.x === row)
    return this
  },
  inCol(col: number) {
    this.cellSet = this.cellSet.filter(cell => cell.x === col)
    return this
  },
  hasStructure(struct?: string[]) {
    this.cellSet = this.cellSet.filter(
      cell =>
        cell.structure &&
        (struct ? struct!.includes(cell.structure.name) : true)
    )
    return this
  },
  hasUnit(names?: string[]) {
    this.cellSet = this.cellSet.filter(
      cell =>
        UnitSet.refresh(this.unitSet)
          .atLoc(cell.x, cell.y)
          .display().length > 0 && (names ? UnitSet.is(names) : true)
    )
    return this
  },
  controlledBy(id: string) {
    this.cellSet = this.cellSet.filter(cell => cell.controlledBy === id)
    return this
  },
  notControlledBy(id: string) {
    this.cellSet = this.cellSet.filter(cell => cell.controlledBy !== id)
    return this
  },
  display() {
    return this.cellSet
  }
}

interface IPlayerSet {
  playerSet: Player[]
  is: (id: string) => Player | undefined
  hasNotLost: () => IPlayerSet
  display: () => Player[]
}

const PlayerSet: IPlayerSet = {
  playerSet: [],
  is(id: string) {
    return this.playerSet.find(player => player.id === id)
  },
  hasNotLost() {
    this.playerSet = this.playerSet.filter(player => !player.hasLost)
    return this
  },
  display() {
    return this.playerSet
  }
}

const getDistance = (
  loc1: { x: number; y: number },
  loc2: { x: number; y: number }
) => Math.abs(loc1.x - loc2.x) + Math.abs(loc1.y - loc2.y)
