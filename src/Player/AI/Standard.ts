import Scenario from '../../Scenario/Scenario'
import Cell from '../../Cell/Cell'
import Unit from '../../Units/Unit'
import Player from '../Player'
import { plainToClass } from 'class-transformer'
import Structure from '../../Cell/Structures/Structure'
import {
  Soldier,
  Archer,
  Assassin,
  Knight,
  Wizard,
  Priest
} from '../../Units/Units'

export default (scenario: Scenario) => {
  const thisPlayer = scenario.Players().is(scenario.activePlayer)!
  const enemyCells = scenario
    .Cells()
    .notControlledBy(scenario.activePlayer)
    .display()

  const analyzeMoves = () => {}

  const getMoveList = () => {
    const results: IAction[] = []
    scenario
      .Cells()
      .controlledBy(thisPlayer.id)
      .display()
      .forEach(cell => {
        if (cell.structure) {
          cell.structure.buildUnits.forEach(unit => {
            const cost = () => {
              switch (unit) {
                case Soldier:
                  return 1
                case Archer:
                  return 3
                case Priest:
                  return 4
                case Assassin:
                  return 5
                case Knight:
                  return 6
                case Wizard:
                  return 7
                default:
                  return 0
              }
            }
            if (thisPlayer.resources.gold >= cost()) {
              results.push({
                x: cell.x,
                y: cell.y,
                action: `build:${unit.name}`,
                desc: `Build ${unit.name}`,
                id: []
              })
            }
          })
          const cost = () => {
            switch (cell.structure!.name) {
              case 'Castle':
                return 1
              case 'Town':
                return 2
              default:
                return 0
            }
          }
          // if (thisPlayer.resources.gold >= cost()) {
          //   results.push({
          //     x: cell.x,
          //     y: cell.y,
          //     action: 'fortify',
          //     desc: 'Fortify',
          //     id: []
          //   })
          // }
          if (
            cell.structure.name === 'Town' &&
            thisPlayer.resources.gold >= 7
          ) {
            results.push({
              x: cell.x,
              y: cell.y,
              action: 'upgrade:Castle',
              desc: 'Upgrade to Castle',
              id: []
            })
          }
        }
        findUnitMoves(cell).forEach(result => results.push(result))
      })
    return results
  }

  const findUnitMoves = (cell: Cell, units: Unit[] = []) => {
    let results: IAction[] = []
    scenario
      .Units()
      .atLoc(cell.x, cell.y)
      .controlledBy(thisPlayer.id)
      .display()
      .filter(unit => !units.find(u => u.id === unit.id))
      .forEach(unit => {
        let thisOptimalMove: any
        let baseMoveCost = unit.move
        units.forEach(unit => {
          baseMoveCost += unit.move
        })
        // Need to add Wizard check
        if (
          unit.movesLeft > 0 &&
          baseMoveCost <= thisPlayer.resources.actions
        ) {
          thisOptimalMove = getOptimalMove(cell, [...units, unit])
          if (thisOptimalMove.score > 0) {
            results.push({
              x: cell.x,
              y: cell.y,
              action: thisOptimalMove.isCombat ? 'attack' : 'move',
              desc: `Move ${[...units, unit].map(unit => unit.name)}`,
              id: [...units, unit].map(unit => unit.id),
              coords: { x: thisOptimalMove.x, y: thisOptimalMove.y }
            })
          }
          results = [...results, ...findUnitMoves(cell, [...units, unit])]
        }
      })
    return results
  }

  const getOptimalMove = (thisCell: Cell, units: Unit[]): any => {
    let moveOptions: IMove[] = []
    let thisOptimalMove: IMove = {
      x: 0,
      y: 0,
      cost: 100,
      structure: null,
      distanceToEnemy: 100,
      score: -10,
      isCombat: false
    }
    scenario
      .Cells()
      .display()
      .forEach(cell => {
        const distance = scenario.getDistance(thisCell, cell)
        const moveCost = scenario.getMoveCost(units)
        const thisCost = distance * moveCost
        if (thisPlayer.resources.actions >= thisCost && distance !== 0) {
          let distanceToEnemy = 100
          enemyCells.forEach(enemyCell => {
            let thisDistanceToEnemy = scenario.getDistance(cell, enemyCell)
            if (distanceToEnemy > thisDistanceToEnemy) {
              distanceToEnemy = thisDistanceToEnemy
            }
          })
          let score = 0
          if (thisCost < thisOptimalMove.cost) {
            score += thisPlayer.resources.actions - thisCost
            if (scenario.Cells().atLoc(cell.x, cell.y).structure) {
              score += 100
            }
          }
          if (cell.structure && cell.controlledBy !== thisPlayer.id) score += 5
          if (
            cell.structure &&
            cell.controlledBy !== thisPlayer.id &&
            scenario
              .Units()
              .atLoc(cell.x, cell.y)
              .display().length <= 0
          )
            score += 100
          if (cell.controlledBy !== thisPlayer.id && cell.terrain! === 'Plains')
            score += 2
          if (cell.terrain! === 'Forest') score--
          if (cell.terrain! === 'Mountain') score -= 100
          if (cell.controlledBy === thisPlayer.id && distanceToEnemy > 4)
            score -= 10
          else if (
            scenario
              .Units()
              .atLoc(cell.x, cell.y)
              .display().length <=
            scenario
              .Units()
              .notControlledBy(thisPlayer.id)
              .withinDistance(4, { x: cell.x, y: cell.y })
              .display().length
          )
            score +=
              scenario
                .Units()
                .notControlledBy(thisPlayer.id)
                .withinDistance(4, { x: cell.x, y: cell.y })
                .display().length *
                units.length -
              scenario
                .Units()
                .atLoc(cell.x, cell.y)
                .display().length
          if (
            distanceToEnemy < thisOptimalMove.distanceToEnemy &&
            cell.structure
          )
            score++

          let isCombat = false
          if (
            scenario
              .Units()
              .atLoc(cell.x, cell.y)
              .notControlledBy(thisPlayer.id)
              .display().length > 0
          ) {
            let won = 0
            let lost = 0
            for (let i = 0; i < 5; i++) {
              if (
                simulateCombat(
                  { x: cell.x, y: cell.y },
                  { x: thisCell.x, y: thisCell.y }
                )
              )
                won++
              else lost++
            }
            // console.log('Won', won, 'Lost', lost)
            if (won > lost) {
              isCombat = true
              score += 15
            } else score -= 1000
          }
          const thisMove: IMove = {
            x: cell.x,
            y: cell.y,
            cost: distance * moveCost,
            structure: cell.structure,
            distanceToEnemy,
            score,
            isCombat
          }
          if (score > thisOptimalMove.score) {
            moveOptions = [thisMove]
            thisOptimalMove = thisMove
          } else if (score === thisOptimalMove.score) {
            moveOptions.push(thisMove)
          }
        }
      })
    if (moveOptions.length > 1) {
      thisOptimalMove =
        moveOptions[Math.floor(Math.random() * moveOptions.length)]
    }
    return thisOptimalMove
  }

  const simulateCombat = (
    defCell: { x: number; y: number },
    atkCell: { x: number; y: number }
  ) => {
    const thisCell = plainToClass(Cell, {
      ...scenario.Cells().atLoc(defCell.x, defCell.y)
    })
    thisCell.structure = plainToClass(Structure, { ...thisCell.structure })

    const notMe = scenario
      .Units()
      .atLoc(defCell.x, defCell.y)
      .notControlledBy(thisPlayer.id)
      .display()[0].controlledBy

    let atkPlr = thisPlayer
    let defPlr = scenario.Players().is(notMe)

    let units = [
      ...scenario
        .Units()
        .atLoc(defCell.x, defCell.y)
        .display(),
      ...scenario
        .Units()
        .atLoc(atkCell.x, atkCell.y)
        .display()
    ].map(unit => plainToClass(Unit, { ...unit }))

    const atkUnits = () => units.filter(unit => unit.controlledBy === atkPlr.id)
    const defUnits = () =>
      units.filter(unit => unit.controlledBy === defPlr!.id)

    while (atkUnits().length > 0 && defUnits().length > 0) {
      const attacker = Math.floor(Math.random() * atkUnits().length)
      const defender = Math.floor(Math.random() * defUnits().length)

      // Attacker deals first damage
      // If cell has defBonus, and attacker is me, hit that first.
      // Assassins don't care about cell defBonus.
      // Priests don't attack
      if (atkUnits()[attacker].name !== 'Priest') {
        if (
          thisCell.defBonus > 0 &&
          atkPlr!.id === thisPlayer.id &&
          atkUnits()[attacker].name !== 'Assassin'
        ) {
          thisCell.takeDamage(atkUnits()[attacker].attack)
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
        // If structure has health, and defender is me, hit that first.
        // Assassins don't care about structure health.
        if (
          thisCell.defBonus > 0 &&
          defPlr!.id === thisPlayer.id &&
          defUnits()[defender].name !== 'Assassin'
        ) {
          thisCell.defBonus -= defUnits()[defender].attack
        } else {
          atkUnits()[attacker].health -= defUnits()[defender].attack
        }
      }
      // If one of the characters is a priest,
      // heal all of that player's units by one
      // (except the priest)
      if (atkUnits()[attacker].name === 'Priest') {
        atkUnits().forEach((unit, index) => {
          if (index !== attacker && unit.health < unit.maxHealth) {
            unit.health++
          }
        })
      }
      if (defUnits()[defender].name === 'Priest') {
        defUnits().forEach((unit, index) => {
          if (index !== defender && unit.health < unit.maxHealth) {
            unit.health++
          }
        })
      }

      // Remove defender if dead.
      if (defUnits()[defender].health <= 0) {
        units = units.filter(unit => unit.id !== defUnits()[defender].id)
      }
      // Remove attacker if dead.
      if (atkUnits()[attacker].health <= 0) {
        units = units.filter(unit => unit.id !== atkUnits()[attacker].id)
      }
      if (units.filter(unit => unit.name !== 'Priest').length <= 0) {
        units.forEach(unit => {
          unit.controlledBy = notMe
        })
      }
      // Switch who goes first
      if (atkPlr === thisPlayer) {
        atkPlr = scenario.Players().is(notMe)!
        defPlr = thisPlayer
      } else {
        atkPlr = thisPlayer
        defPlr = scenario.Players().is(notMe)!
      }
    }
    return units.filter(unit => unit.controlledBy === thisPlayer.id).length > 0
  }

  const scoreMove = (a: IAction) => {
    let score = 0
    if (a.action.includes('attack')) score += 10
    if (a.action.includes('fortify')) {
      score += 2
      if (scenario.Cells().atLoc(a.x, a.y).defBonus < 3) {
        score++
      }
    }
    if (a.action.includes('build')) {
      const action = a.action.split(':')
      if (
        scenario
          .Units()
          .atLoc(a.x, a.y)
          .display().length > 4
      )
        score -= scenario
          .Units()
          .atLoc(a.x, a.y)
          .display().length
      const cost = () => {
        switch (action[1]) {
          case 'Soldier':
            return 1
          case 'Archer':
            score++
            return 3
          case 'Priest':
            if (
              scenario
                .Units()
                .atLoc(a.x, a.y)
                .controlledBy(thisPlayer.id)
                .display().length <= 0
            )
              score -= 1000
            else {
              let onlyPriests = true
              scenario
                .Units()
                .atLoc(a.x, a.y)
                .controlledBy(thisPlayer.id)
                .display()
                .forEach(unit => {
                  if (unit.name !== 'Priest') {
                    onlyPriests = false
                    if (unit.health < unit.maxHealth) score += 3
                  }
                })
              if (onlyPriests) score -= 1000
              else score++
            }
            return 4
          case 'Assassin':
            score += 2
            return 5
          case 'Knight':
            score += 3
            return 6
          case 'Wizard':
            score += 2
            return 7
          default:
            return 0
        }
      }
      if (
        scenario
          .Units()
          .controlledBy(thisPlayer.id)
          .display().length >=
          scenario
            .Cells()
            .controlledBy(thisPlayer.id)
            .display().length ||
        thisPlayer.resources.gold < cost()
      ) {
        score -= 1000
      } else {
        score += Math.abs(
          scenario
            .Units()
            .atLoc(a.x, a.y)
            .display().length - 8
        )
        if (
          scenario
            .Cells()
            .controlledBy(thisPlayer.id)
            .display().length /
            2 >=
          scenario
            .Units()
            .controlledBy(thisPlayer.id)
            .display().length
        )
          score += 2
        let distanceToEnemy = 100
        scenario
          .Cells()
          .notControlledBy(thisPlayer.id)
          .hasUnit()
          .display()
          .forEach(cell => {
            const thisDistanceToEnemy = scenario.getDistance(
              { x: a.x, y: a.y },
              { x: cell.x, y: cell.y }
            )
            if (distanceToEnemy < thisDistanceToEnemy)
              distanceToEnemy = thisDistanceToEnemy
          })
        if (distanceToEnemy <= 4) {
          if (
            scenario
              .Units()
              .atLoc(a.x, a.y)
              .display().length <=
            scenario
              .Units()
              .notControlledBy(thisPlayer.id)
              .withinDistance(4, { x: a.x, y: a.y })
              .display().length
          ) {
            score += 100
          }
        }
      }
    }
    if (a.action.includes('move')) {
      score += 5
      if (
        scenario
          .Cells()
          .controlledBy(thisPlayer.id)
          .hasStructure()
          .display().length <= 2
      ) {
        let demerit = 10
        if (
          scenario
            .Cells()
            .controlledBy(thisPlayer.id)
            .display().length ===
          scenario
            .Units()
            .controlledBy(thisPlayer.id)
            .display().length
        ) {
          demerit = 0
        }
        if (a.id.length > 1) demerit += 10
        else demerit -= 5
        score +=
          -demerit +
          scenario
            .Units()
            .atLoc(a.x, a.y)
            .display().length
      }
      if (
        scenario
          .Cells()
          .controlledBy(thisPlayer.id)
          .display().length <=
        scenario
          .Units()
          .controlledBy(thisPlayer.id)
          .display().length
      )
        score += 5
      if (
        scenario
          .Units()
          .atLoc(a.x, a.y)
          .display().length <= 2 &&
        scenario.Cells().atLoc(a.x, a.y).structure
      ) {
        score -= 2
        let distanceToEnemy = 100
        scenario
          .Cells()
          .notControlledBy(thisPlayer.id)
          .hasUnit()
          .display()
          .forEach(cell => {
            const thisDistanceToEnemy = scenario.getDistance(
              { x: a.x, y: a.y },
              { x: cell.x, y: cell.y }
            )
            if (distanceToEnemy < thisDistanceToEnemy)
              distanceToEnemy = thisDistanceToEnemy
          })
        if (distanceToEnemy <= 4) {
          score -= Math.abs(distanceToEnemy - 6)
          if (
            scenario
              .Units()
              .atLoc(a.x, a.y)
              .display().length <=
            scenario
              .Units()
              .notControlledBy(thisPlayer.id)
              .withinDistance(4, { x: a.x, y: a.y })
              .display().length
          )
            score -= 1000
        }
      }
      if (
        a.coords &&
        scenario.Cells().atLoc(a.coords!.x, a.coords!.y).structure
      ) {
        const distance = scenario.getDistance(
          { x: a.x, y: a.y },
          { x: a.coords!.x, y: a.coords!.y }
        )
        const bonus = 15 - distance < 0 ? 0 : 15 - distance
        score += bonus
      }
    }
    return score
  }

  const results = getMoveList()

  results.forEach(result => {
    result.score = scoreMove(result)
  })

  results.sort((a, b) => {
    let scorea = a.score!
    let scoreb = b.score!

    if (scorea === scoreb) {
      enemyCells.forEach(cell => {
        const adiff = scenario.getDistance(
          { x: a.x, y: a.y },
          { x: cell.x, y: cell.y }
        )
        const bdiff = scenario.getDistance(
          { x: b.x, y: b.y },
          { x: cell.x, y: cell.y }
        )
        if (adiff > bdiff) scoreb++
        if (adiff < bdiff) scorea++
      })
    }

    return scoreb - scorea
  })

  return results
}

interface IMove {
  x: number
  y: number
  cost: number
  structure: Structure | null
  distanceToEnemy: number
  score: number
  isCombat: boolean
}

interface IAction {
  x: number
  y: number
  action: string
  desc: string
  id: string[]
  coords?: { x: number; y: number }
  score?: number
}
