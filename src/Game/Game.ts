import 'reflect-metadata'
import Scenario, { INewPlayer } from '../Scenario/Scenario'
import Unit from '../Units/Unit'
import Castle from '../Cell/Structures/Castle'
import {
  Soldier,
  Archer,
  Assassin,
  Knight,
  Priest,
  Wizard
} from '../Units/Units'

export default class Game {
  private scenario: Scenario
  private x: number
  private y: number
  public selectedUnitList: string[]

  constructor(
    playerList: INewPlayer[],
    grid: { x: number; y: number } = { x: 9, y: 9 }
  ) {
    this.scenario = new Scenario(playerList, grid)
    const startingCell = this.scenario
      .Cells()
      .controlledBy(this.scenario.activePlayer)
      .hasStructure(['Castle'])
      .get()[0]
    this.x = startingCell.x
    this.y = startingCell.y
    this.selectedUnitList = []

    console.log('The Game has begun!')
    console.log(`${this.activePlayer()!.name} will begin.`)
    console.log(' ')
  }

  public grid = () => {
    return this.scenario.Cells().grid
  }

  public getPlayer = (id: string) => {
    return this.scenario.Players().is(id)
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
    return this.scenario
      .Units()
      .atLoc(this.selectedCell().x, this.selectedCell().y)
      .controlledBy(this.activePlayer()!.id)
      .get()
      .filter(
        unit => unit.movesLeft > 0 && !this.selectedUnitList.includes(unit.id)
      )
  }

  public fortifyCell = () => {
    return new Promise((resolve, reject) => {
      if (
        this.selectedCell().structure &&
        this.activePlayer()!.resources.gold >=
          this.selectedCell().structure!.fortifyCost
      ) {
        this.activePlayer()!.resources.gold -= this.selectedCell().structure!.fortifyCost
        this.selectedCell().fortify()
        resolve(
          `${this.selectedCell().x},${
            this.selectedCell().y
          } has been fortified by ${this.activePlayer()!.name}`
        )
      } else reject('You cannot fortify this cell.')
    })
  }

  public upgradeToCastle = () => {
    return new Promise((resolve, reject) => {
      if (
        this.selectedCell().structure &&
        this.selectedCell().structure!.name === 'Town' &&
        this.activePlayer()!.resources.gold >= 7
      ) {
        this.activePlayer()!.resources.gold -= 7
        this.selectedCell().buildStructure(Castle)
        resolve(
          `A castle has been built at ${this.selectedCell().x},${
            this.selectedCell().y
          } by ${this.activePlayer()!.name}`
        )
      } else reject('You cannot build a castle here.')
    })
  }

  public selectAllUnits = () => {
    this.selectedUnitList = this.scenario
      .Units()
      .atLoc(this.selectedCell().x, this.selectedCell().y)
      .controlledBy(this.activePlayer()!.id)
      .get()
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
        this.farmsOwnedBy(this.activePlayer()!.id) <=
        this.scenario
          .Units()
          .controlledBy(this.activePlayer()!.id)
          .count()
      )
        reject(`You do not have enough farms!`)
      else {
        this.scenario.addUnit(newUnit)
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
    this.scenario
      .Cells()
      .get()
      .forEach(cell => {
        if (this.isInRange(cell.x, cell.y)) {
          inRangeCells.push({ x: cell.x, y: cell.y })
        }
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
          this.scenario
            .Units()
            .atLoc(x, y)
            .notControlledBy(this.activePlayer()!.id)
            .count() > 0
        ) {
          this.performCombat(x, y)
        }

        this.scenario.Cells().atLoc(x, y).controlledBy = this.scenario
          .Units()
          .atLoc(x, y)
          .get()[0].controlledBy
        resolve(`${this.activePlayer()!.name} has moved units to ${x},${y}`)
      } else {
        reject("We can't get there.")
      }
    })
  }

  public performCombat = (x: number, y: number) => {
    const thisCell = this.scenario.Cells().atLoc(x, y)
    const notMe = this.scenario
      .Units()
      .atLoc(x, y)
      .notControlledBy(this.activePlayer()!.id)
      .get()[0].controlledBy

    let atkPlr = this.activePlayer()
    let defPlr = this.getPlayer(notMe)

    const atkUnits = () =>
      this.scenario
        .Units()
        .atLoc(x, y)
        .controlledBy(atkPlr!.id)
        .get()
    const defUnits = () =>
      this.scenario
        .Units()
        .atLoc(x, y)
        .controlledBy(defPlr!.id)
        .get()

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
        console.log(`${atkPlr!.name}'s priest is healing the party...`)
        atkUnits().forEach((unit, index) => {
          if (index !== attacker && unit.health < unit.maxHealth) {
            unit.health++
          }
        })
      }
      if (defUnits()[defender].name === 'Priest') {
        console.log(`${defPlr!.name} priest is healing the party...`)
        defUnits().forEach((unit, index) => {
          if (index !== defender && unit.health < unit.maxHealth) {
            unit.health++
          }
        })
      }

      // Remove defender if dead.
      if (defUnits()[defender].health <= 0) {
        console.log(`${defPlr!.name}'s ${defUnits()[defender].name} is dead!`)
        this.scenario.removeUnit(defUnits()[defender])
      }
      // Remove attacker if dead.
      if (atkUnits()[attacker].health <= 0) {
        console.log(`${atkPlr!.name}'s ${atkUnits()[attacker].name} is dead!`)
        this.scenario.removeUnit(atkUnits()[attacker])
      }

      if (
        this.scenario
          .Units()
          .atLoc(x, y)
          .get()
          .filter(unit => unit.name !== 'Priest').length <= 0
      ) {
        this.scenario
          .Units()
          .atLoc(x, y)
          .controlledBy(this.activePlayer()!.id)
          .get()
          .forEach(unit => {
            console.log(
              `${this.activePlayer()!.name}'s ${
                unit.name
              } has surrendered and joined with ${this.getPlayer(notMe)!.name}!`
            )
            unit.controlledBy = notMe
          })
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
      this.scenario.Cells().atLoc(x, y).passable !== false &&
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
    return new Promise(async (resolve, reject) => {
      this.scenario
        .Units()
        .get()
        .forEach(unit => {
          unit.movesLeft = unit.maxMoves
        })
      const allPriests = this.scenario
        .Units()
        .is(['Priest'])
        .get()
      allPriests.forEach(priest => {
        const units = this.scenario
          .Units()
          .atLoc(priest.x, priest.y)
          .get()
        units.forEach(unit => {
          if (unit.id !== priest.id && unit.health < unit.maxHealth) {
            console.log('Healing!')
            unit.health++
          }
        })
      })
      const prevPlayer = this.activePlayer()!.id
      this.scenario.activePlayer = this.scenario
        .Players()
        .next(this.activePlayer()!.id).id
      this.scenario.checkObjectives(prevPlayer).catch(result => {
        if (result) {
          console.log(
            `${this.scenario.Players().is(prevPlayer)!.name} has won!`
          )
        } else {
          console.log(
            `${this.scenario.Players().is(prevPlayer)!.name} has lost!`
          )
        }
      })
      if (
        this.scenario
          .Players()
          .hasNotLost()
          .count() === 1
      ) {
        console.log(
          `${
            this.scenario
              .Players()
              .hasNotLost()
              .get()[0].name
          } has won!`
        )
      }
      this.gatherResources()
      resolve(`${this.activePlayer()!.name}'s turn`)
    })
  }

  public gatherResources = () => {
    const farms = this.farmsOwnedBy(this.activePlayer()!.id)
    const towns = this.townsOwnedBy(this.activePlayer()!.id)

    this.activePlayer()!.resources.actions = towns + 3
    this.activePlayer()!.resources.gold += farms
  }

  public analyze = () => {
    return this.activePlayer()!.ai(this.scenario)
  }

  public runComputerTurn = () => {
    return new Promise((resolve, reject) => {
      let prevOption = {}
      let prevCount = 0
      let hasFortified = false
      const runningTurn = setInterval(() => {
        const options = this.analyze()

        let action
        for (let i = 0; i < options.length; i++) {
          if (options[i].action.includes('fortify') && !hasFortified) {
            hasFortified = true
            action = options[i]
            break
          } else if (!options[i].action.includes('fortify')) {
            action = options[i]
            break
          }
        }
        if (!action) resolve()
        // console.log(options.length > 0 ? options[0] : '')
        if (options.length > 0 && options[0].score >= 0) {
          if (JSON.stringify(prevOption) === JSON.stringify(options[0])) {
            if (prevCount >= 5) {
              clearInterval(runningTurn)
              resolve()
            } else {
              prevCount++
              this.runComputerAction(options[0])
                .then(res => console.log(res))
                .catch(res => console.log(res))
            }
          } else {
            prevOption = options[0]

            this.runComputerAction(options[0])
              .then(res => console.log(res))
              .catch(res => console.log(res))
          }
        } else {
          clearInterval(runningTurn)
          resolve()
        }
      }, 500)
    })
  }

  runComputerAction = async s => {
    if (s.action.includes('build')) {
      const option = s.action.split(':')
      this.selectCell(s.x, s.y)

      const unit = () => {
        switch (option[1]) {
          case 'Soldier':
            return Soldier
          case 'Archer':
            return Archer
          case 'Assassin':
            return Assassin
          case 'Knight':
            return Knight
          case 'Priest':
            return Priest
          case 'Wizard':
            return Wizard
          default:
            return Soldier
        }
      }

      return this.buildUnit(unit())
    }
    if (s.action.includes('fortify')) {
      this.selectCell(s.x, s.y)

      return this.fortifyCell()
    }
    if (s.action.includes('upgrade')) {
      this.selectCell(s.x, s.y)

      return this.upgradeToCastle()
    }
    if (s.action.includes('move') || s.action.includes('attack')) {
      this.selectCell(s.x, s.y)
      s.id.forEach(id => {
        this.selectUnit(id)
      })

      return this.moveSelectedUnits(s.coords.x, s.coords.y)
    }
  }

  public farmsOwnedBy = (id: string) =>
    this.scenario
      .Cells()
      .controlledBy(id)
      .count()

  public townsOwnedBy = (id: string) =>
    this.scenario
      .Cells()
      .controlledBy(id)
      .hasStructure()
      .count()

  public activePlayer = () =>
    this.scenario.Players().is(this.scenario.activePlayer)

  public selectedCell = () => this.scenario.Cells().atLoc(this.x, this.y)

  public selectedUnits = () =>
    this.scenario
      .Units()
      .get()
      .filter(unit => this.selectedUnitList.includes(unit.id))

  private getDistance = (
    loc1: { x: number; y: number },
    loc2: { x: number; y: number }
  ) => Math.abs(loc1.x - loc2.x) + Math.abs(loc1.y - loc2.y)

  public Units = () => this.scenario.Units()
  public Cells = () => this.scenario.Cells()
  public Players = () => this.scenario.Players()
}
