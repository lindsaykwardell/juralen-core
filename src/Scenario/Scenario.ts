import { PlayerType } from './../Player/Player'
import Cell from '../Cell/Cell'
import Plains from '../Cell/Terrain/Plains'
import Mountain from '../Cell/Terrain/Mountain'
import Forest from '../Cell/Terrain/Forest'
import { Town, Castle } from '../Cell/Structures/Structures'
import Player from '../Player/Player'
import Unit from '../Units/Unit'
import { Soldier } from '../Units/Units'
import Citadel from '../Cell/Structures/Citadel'
import naturalOrder from 'natural-order'

export default class Scenario {
  private x: number
  private y: number
  private grid: Cell[][]
  private players: Player[]
  private units: Unit[]
  public activePlayer: string
  private objectives: IObjective[]

  constructor(
    playerList: { name: string; isHuman: boolean; color: string }[],
    grid: { x: number; y: number } = { x: 9, y: 9 }
  ) {
    this.x = grid.x
    this.y = grid.y
    this.grid = this.generateGrid()
    this.players = []
    this.units = []
    playerList.forEach(newPlayer => {
      this.players.push(
        new Player(
          newPlayer.name,
          newPlayer.isHuman,
          {
            actions: 4,
            gold: 2
          },
          newPlayer.color
        )
      )
    })
    this.players.forEach(player => {
      let done = false
      while (!done) {
        const x = Math.floor(Math.random() * this.x)
        const y = Math.floor(Math.random() * this.y)
        const cell = this.grid[y][x]
        if (!cell.structure) {
          cell.controlledBy = player.id
          cell.buildStructure(Citadel)
          for (let i = 0; i < 3; i++) {
            this.units.push(new Soldier(cell.x, cell.y, player.id))
          }
          done = true
        }
      }
    })
    this.activePlayer = this.Players().random().id
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

  private generateGrid = () => {
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

  public addUnit = (newUnit: Unit) => {
    this.units = [...this.units.map(unit => unit), newUnit]
  }

  public removeUnit = (deadUnit: Unit) => {
    this.units = [...this.units.map(unit => unit)].filter(
      unit => unit.id !== deadUnit.id
    )
  }

  public Cells = () => {
    CellSet.cellSet = []
    CellSet.grid = this.grid
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

  public firstPlace = () => {
    return this.checkScores()[0]
  }

  public lastPlace = () => {
    return this.checkScores().pop()
  }

  public checkScores = (): { id: string; name: string; score: number }[] => {
    const scorecard: { id: string; name: string; score: number }[] = []

    this.Players()
      .hasNotLost()
      .get()
      .forEach(player => {
        let score = player.resources.gold

        score += this.Cells()
          .controlledBy(player.id)
          .count()
        score += this.Cells()
          .controlledBy(player.id)
          .hasStructure()
          .count()
        score +=
          this.Cells()
            .controlledBy(player.id)
            .hasStructure(['Citadel'])
            .count() * 2
        score += this.Units()
          .controlledBy(player.id)
          .count()

        scorecard.push({ id: player.id, name: player.name, score })
      })

    return naturalOrder(scorecard, ['score'], 'desc')
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
                .count() >=
              this.gridSize() / objective.value
            ) {
              this.players.find(player => player.id === id)!.hasLost = false
              reject(true)
            }
            break
          case Objective.BelowMinTownCount:
            if (
              this.Cells()
                .controlledBy(thisPlayer!.id)
                .hasStructure()
                .count() <= 0
            ) {
              this.players.find(player => player.id === id)!.hasLost = true
              reject(false)
            }
            break
          default:
          // Do nothing
        }
      })
      resolve()
    })
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

export interface IUnitSet {
  unitSet: Unit[]
  refresh: (val: Unit[]) => IUnitSet
  atLoc: (x: number, y: number) => IUnitSet
  withinDistance: (val: number, cell: { x: number; y: number }) => IUnitSet
  controlledBy: (id: string) => IUnitSet
  notControlledBy: (id: string) => IUnitSet
  get: () => Unit[]
  is: (names: string[]) => IUnitSet
  count(): number
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
  get() {
    return [...this.unitSet]
  },
  count() {
    return this.unitSet.length
  }
}

export interface ICellSet {
  unitSet: Unit[]
  cellSet: Cell[]
  grid: Cell[][]
  atLoc: (x: number, y: number) => Cell
  withinDistance: (val: number, cell: { x: number; y: number }) => ICellSet
  inRow: (row: number) => ICellSet
  inCol: (col: number) => ICellSet
  hasStructure: (name?: string[]) => ICellSet
  hasUnit: (name?: string[]) => ICellSet
  controlledBy: (id: string) => ICellSet
  notControlledBy: (id: string) => ICellSet
  get: () => Cell[]
  count: () => number
}

const CellSet: ICellSet = {
  unitSet: [],
  cellSet: [],
  grid: [],
  atLoc(x: number, y: number) {
    this.cellSet = this.cellSet.filter(cell => cell.x === x && cell.y === y)
    return this.cellSet[0]
  },
  withinDistance(val: number, outerCell: { x: number; y: number }) {
    this.cellSet = this.cellSet.filter(
      cell =>
        val >=
        getDistance(
          { x: cell.x, y: cell.y },
          { x: outerCell.x, y: outerCell.y }
        )
    )
    return this
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
          .count() > 0 && (names ? UnitSet.is(names) : true)
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
  get() {
    return this.cellSet
  },
  count() {
    return this.cellSet.length
  }
}

export interface IPlayerSet {
  playerSet: Player[]
  next: (id: string) => Player
  is: (id: string) => Player | undefined
  hasNotLost: () => IPlayerSet
  random: () => Player
  get: () => Player[]
  count: () => number
}

const PlayerSet: IPlayerSet = {
  playerSet: [],
  next(id: string) {
    const activePlayers = this.hasNotLost().get()
    const key = activePlayers.findIndex(player => player.id === id)
    if (key + 1 === activePlayers.length) return activePlayers[0]
    else return activePlayers[key + 1]
  },
  is(id: string) {
    return this.playerSet.find(player => player.id === id)
  },
  hasNotLost() {
    this.playerSet = this.playerSet.filter(player => !player.hasLost)
    return this
  },
  random() {
    return this.playerSet[Math.floor(Math.random() * this.count())]
  },
  get() {
    return this.playerSet
  },
  count() {
    return this.playerSet.length
  }
}

const getDistance = (
  loc1: { x: number; y: number },
  loc2: { x: number; y: number }
) => Math.abs(loc1.x - loc2.x) + Math.abs(loc1.y - loc2.y)
