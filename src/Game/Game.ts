import Scenario from '../Scenario/Scenario'
import Unit from '../Units/Unit'
import Cell from '../Cell/Cell'

export default class Game {
  private scenario: Scenario
  private x: number
  private y: number
  public selectedUnitList: string[]

  constructor(playerCount: number) {
    this.scenario = new Scenario(playerCount)
    const startingCell = this.Cells()
      .controlledBy(this.scenario.activePlayer)
      .hasStructure('Castle')
      .display()[0]
    this.x = startingCell.x
    this.y = startingCell.y
    this.selectedUnitList = []

    console.log('The Game has begun!')
    console.log(`${this.activePlayer()!.name} will begin.`)
    console.log(' ')
  }

  public grid = () => {
    return this.scenario.grid
  }

  public getPlayer = (id: string) => {
    return this.scenario.players.find(player => player.id === id)
  }

  public selectCell = (x: number, y: number) => {
    this.x = x
    this.y = y
    this.selectedUnitList = []
  }

  public selectUnit = (id: string) => {
    this.selectedUnitList.push(id)
  }

  public selectableUnits = () => {
    return this.Units()
      .atLoc(this.selectedCell().x, this.selectedCell().y)
      .controlledBy(this.activePlayer()!.id)
      .display()
      .filter(
        unit => unit.movesLeft > 0 && !this.selectedUnitList.includes(unit.id)
      )
  }

  public selectAllUnits = () => {
    this.selectedUnitList = this.scenario.units
      .filter(
        unit =>
          unit.x === this.selectedCell().x &&
          unit.y === this.selectedCell().y &&
          unit.controlledBy === this.scenario.activePlayer
      )
      .map(unit => unit.id)
  }

  public unselectUnit = (id: string) => {
    this.selectedUnitList = this.selectedUnitList.filter(unit => unit !== id)
  }

  public unselectAllUnits = () => {
    this.selectedUnitList = []
  }

  public buildUnit = (unit: typeof Unit) => {
    return new Promise((resolve, reject) => {
      const newUnit = new unit(
        this.selectedCell().x,
        this.selectedCell().y,
        this.scenario.activePlayer
      )
      if (this.activePlayer()!.resources.gold - newUnit.cost < 0)
        reject(`You do not have enough gold!`)
      else if (
        this.activePlayer()!.resources.farms <=
        this.Units()
          .controlledBy(this.activePlayer()!.id)
          .display().length
      )
        reject(`You do not have enough farms!`)
      else {
        this.scenario.units.push(newUnit)
        this.activePlayer()!.resources.gold -= newUnit.cost
        resolve(
          `${this.activePlayer()!.name} built a ${unit.name} in ${
            this.selectedCell().x
          }, ${this.selectedCell().y}`
        )
      }
    })
  }

  public getCellsInRange = () => {
    const inRangeCells: { x: number; y: number }[] = []
    this.scenario.grid.forEach(row => {
      row.forEach(cell => {
        if (this.isInRange(cell.x, cell.y)) {
          inRangeCells.push({ x: cell.x, y: cell.y })
        }
      })
    })
    return inRangeCells
  }

  public moveSelectedUnits = (x: number, y: number) => {
    return new Promise((resolve, reject) => {
      if (this.isInRange(x, y)) {
        this.activePlayer()!.resources.actions -=
          this.getMoveCost() *
          this.getDistance(
            { x, y },
            { x: this.selectedCell().x, y: this.selectedCell().y }
          )
        this.selectedUnits().forEach(unit => {
          unit.x = x
          unit.y = y
          unit.movesLeft--
        })
        this.selectedUnitList = []
        this.selectCell(x, y)
        if (
          this.Units()
            .atLoc(x, y)
            .notControlledBy(this.activePlayer()!.id)
            .display().length > 0
        ) {
          this.performCombat(x, y)
        }

        console.log('Assigning ownership')
        this.Cells().atLoc(x, y).controlledBy = this.Units()
          .atLoc(x, y)
          .display()[0].controlledBy
        resolve(`${this.activePlayer()!.name} has moved units to ${x},${y}`)
      } else {
        reject('Not enough actions')
      }
    })
  }

  public performCombat = (x: number, y: number) => {
    const thisCell = this.Cells().atLoc(x, y)
    const notMe = this.Units()
      .atLoc(x, y)
      .notControlledBy(this.activePlayer()!.id)
      .display()[0].controlledBy

    let atkPlr = this.activePlayer()
    let defPlr = this.getPlayer(notMe)

    const atkUnits = () =>
      this.Units()
        .atLoc(x, y)
        .controlledBy(atkPlr!.id)
        .display()
    const defUnits = () =>
      this.Units()
        .atLoc(x, y)
        .controlledBy(defPlr!.id)
        .display()

    while (atkUnits().length > 0 && defUnits().length > 0) {
      const attacker = Math.floor(Math.random() * atkUnits().length)
      const defender = Math.floor(Math.random() * defUnits().length)

      console.log(
        `${atkUnits()[attacker].name} is attacking ${defUnits()[defender].name}`
      )
      // Attacker deals first damage
      // If cell has defBonus, and attacker is me, hit that first.
      // Assassins don't care about cell defBonus.
      // Priests don't attack
      if (atkUnits()[attacker].name !== 'Priest') {
        if (
          thisCell.defBonus > 0 &&
          atkPlr!.id === this.activePlayer()!.id &&
          atkUnits()[attacker].name !== 'Assassin'
        ) {
          thisCell.takeDamage(atkUnits()[attacker].attack)
          console.log(`Defense bonus reduced to ${thisCell.defBonus}`)
        } // Otherwise, hit the unit.
        else {
          defUnits()[defender].health -= atkUnits()[attacker].attack
        }
      }

      // If defender is still alive AND is in range, attack back.
      // Priests don't attack, but are never in range.
      // So we don't need an additional check for priest here.
      if (
        defUnits()[defender].health > 0 &&
        defUnits()[defender].range >= atkUnits()[attacker].range
      ) {
        console.log(
          `${defUnits()[defender].name} is attacking ${
            atkUnits()[attacker].name
          }`
        )
        // If structure has health, and defender is me, hit that first.
        // Assassins don't care about structure health.
        if (
          thisCell.defBonus > 0 &&
          defPlr!.id === this.activePlayer()!.id &&
          defUnits()[defender].name !== 'Assassin'
        ) {
          thisCell.defBonus -= defUnits()[defender].attack
          console.log(`Defense bonus reduced to ${thisCell.defBonus}`)
        } else {
          atkUnits()[attacker].health -= defUnits()[defender].attack
        }
      }
      // If one of the characters is a priest,
      // heal all of that player's units by one
      // (except the priest)
      if (atkUnits()[attacker].name === 'Priest') {
        console.log(`${atkPlr} priest is healing the party...`)
        atkUnits().forEach((unit, index) => {
          if (index !== attacker && unit.health < unit.maxHealth) {
            unit.health++
          }
        })
      }
      if (defUnits()[defender].name === 'Priest') {
        console.log(`${defPlr} priest is healing the party...`)
        defUnits().forEach((unit, index) => {
          if (index !== defender && unit.health < unit.maxHealth) {
            unit.health++
          }
        })
      }

      // Remove defender if dead.
      if (defUnits()[defender].health <= 0) {
        console.log(`${defPlr} ${defUnits()[defender].name} is dead!`)
        this.scenario.units = this.scenario.units.filter(
          unit => unit.id !== defUnits()[defender].id
        )
      }
      // Remove attacker if dead.
      if (atkUnits()[attacker].health <= 0) {
        console.log(`${atkPlr} ${atkUnits()[attacker].name} is dead!`)
        this.scenario.units = this.scenario.units.filter(
          unit => unit.id !== atkUnits()[attacker].id
        )
      }

      // Switch who goes first
      if (atkPlr === this.activePlayer()) {
        atkPlr = this.getPlayer(notMe)
        defPlr = this.activePlayer()
      } else {
        atkPlr = this.activePlayer()
        defPlr = this.getPlayer(notMe)
      }
    }
  }

  public isInRange = (x: number, y: number) => {
    return (
      this.selectedUnitList.length > 0 &&
      this.Cells().atLoc(x, y).terrain !== 'Mountain' &&
      this.activePlayer()!.resources.actions >=
        this.getMoveCost() *
          this.getDistance(
            { x, y },
            { x: this.selectedCell().x, y: this.selectedCell().y }
          )
    )
  }

  public getMoveCost = () => {
    let cost = 0
    let wizard: Unit | null = null
    this.selectedUnits().forEach(unit => {
      cost += unit.move
      if (unit.name === 'Wizard') wizard = unit
    })
    if (wizard) {
      cost = this.selectedUnitList.length * wizard!.move
    }
    return cost
  }

  public endTurn = () => {
    return new Promise((resolve, reject) => {
      this.scenario.activePlayer = this.scenario.nextPlayer().id
      resolve(`${this.activePlayer()!.name}'s turn`)
    })
  }

  public activePlayer = () =>
    this.scenario.players.find(
      player => player.id === this.scenario.activePlayer
    )

  public selectedCell = () => this.Cells().atLoc(this.x, this.y)

  public selectedUnits = () =>
    this.scenario.units.filter(unit => this.selectedUnitList.includes(unit.id))

  private getDistance = (
    loc1: { x: number; y: number },
    loc2: { x: number; y: number }
  ) => Math.abs(loc1.x - loc2.x) + Math.abs(loc1.y - loc2.y)

  public Units = () => {
    UnitSet.unitSet = this.scenario.units

    return UnitSet
  }

  public Cells = () => {
    CellSet.cellSet = []
    this.scenario.grid.forEach(row => {
      row.forEach(cell => CellSet.cellSet.push(cell))
    })

    return CellSet
  }
}

interface IUnitSet {
  unitSet: Unit[]
  atLoc: (x: number, y: number) => IUnitSet
  controlledBy: (id: string) => IUnitSet
  notControlledBy: (id: string) => IUnitSet
  display: () => Unit[]
}

const UnitSet: IUnitSet = {
  unitSet: [],
  atLoc(x: number, y: number) {
    this.unitSet = this.unitSet.filter(unit => unit.x === x && unit.y === y)
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
  display() {
    return [...this.unitSet]
  }
}

interface ICellSet {
  cellSet: Cell[]
  atLoc: (x: number, y: number) => Cell
  inRow: (row: number) => ICellSet
  inCol: (col: number) => ICellSet
  hasStructure: (name: string) => ICellSet
  controlledBy: (id: string) => ICellSet
  display: () => Cell[]
}

const CellSet: ICellSet = {
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
  hasStructure(struct: string) {
    this.cellSet = this.cellSet.filter(
      cell => cell.structure && cell.structure.name === struct
    )
    return this
  },
  controlledBy(id: string) {
    this.cellSet = this.cellSet.filter(cell => cell.controlledBy === id)
    return this
  },
  display() {
    return this.cellSet
  }
}
