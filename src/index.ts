import { PlayerType } from './Player/Player'
import 'reflect-metadata'
import inquirer from 'inquirer'
import Game from './Game/Game'
import readline from 'readline'
import Castle from './Cell/Structures/Castle'
import Town from './Cell/Structures/Town'
import {
  Soldier,
  Archer,
  Knight,
  Assassin,
  Priest,
  Wizard
} from './Units/Units'
import { table } from 'table'
import { INewPlayer } from './Scenario/Scenario'

const main = async () => {
  const getCommand = async () => {
    // console.log('\x1B[2J')
    console.log(
      table(
        game.grid().map(row =>
          row.map(
            cell => `${
              cell.controlledBy
                ? `*** ${game.getPlayer(cell.controlledBy)!.name} ***
  
  `
                : ''
            }${
              game.isInRange(cell.x, cell.y)
                ? `## ${cell.terrain} ##`
                : cell.terrain
            }
  ${
    cell.structure
      ? `${cell.structure.name}
  `
      : ''
  }${game
              .Units()
              .atLoc(cell.x, cell.y)
              .get()
              .map(unit => {
                let code = ''
                switch (unit.name.toLowerCase()) {
                  case 'soldier':
                    code = 'So'
                    break
                  case 'archer':
                    code = 'Ar'
                    break
                  case 'knight':
                    code = 'Kn'
                    break
                  case 'assassin':
                    code = 'As'
                    break
                  case 'priest':
                    code = 'Pr'
                    break
                  case 'wizard':
                    code = 'Wi'
                    break
                }
                return game.selectedUnitList.includes(unit.id)
                  ? `[${code}]`
                  : code
              })}`
          )
        )
      )
    )
    console.log('')
    console.log(game.activePlayer()!.name + "'s turn")
    const { actions, gold } = game.activePlayer()!.resources
    const farms = game.farmsOwnedBy(game.activePlayer()!.id)
    const towns = game.townsOwnedBy(game.activePlayer()!.id)
    const units = game
      .Units()
      .controlledBy(game.activePlayer()!.id)
      .count()
    console.log(`Actions: ${actions}
Gold: ${gold}
Farms: ${farms}
Towns/Castles: ${towns}
Units: ${units}
`)

    if (game.activePlayer()!.type === PlayerType.AI) {
      await game.runComputerTurn()
      game.endTurn()
    } else {
      const input: string = await askQuestion(
        `${game.activePlayer()!.name} @ [${game.selectedCell().x},${
          game.selectedCell().y
        } | ${game.selectedCell().terrain}${
          game.selectedCell().structure
            ? ` | ${game.selectedCell().structure!.name}`
            : ''
        }] Enter a command: `
      )
      const command = input.toLowerCase().split(' ')
      switch (command[0]) {
        case 'fortify':
          await game
            .fortifyCell()
            .then(res => console.log(res))
            .catch(res => console.log(res))
          break
        case 'show':
          switch (command[1]) {
            case 'analysis':
              console.log(game.analyze())
            case 'selected':
              switch (command[2]) {
                case 'cell':
                  console.log(game.selectedCell())
                  console.log(
                    game
                      .Units()
                      .atLoc(game.selectedCell().x, game.selectedCell().y)
                  )
                  break
                case 'units':
                  console.log(game.selectedUnits())
              }
              break
            case 'cell':
              const coords = command[2].split(',')
              console.log(
                game
                  .Cells()
                  .atLoc(parseInt(coords[0], 10), parseInt(coords[1], 10))
              )
              break
            case 'my':
              switch (command[2]) {
                case 'structure':
                case 'structures':
                case 'building':
                case 'buildings':
                  console.log(
                    game
                      .Cells()
                      .controlledBy(game.activePlayer()!.id)
                      .hasStructure()
                      .get()
                  )
                  break
                case 'castle':
                case 'castles':
                  console.log(
                    game
                      .Cells()
                      .controlledBy(game.activePlayer()!.id)
                      .hasStructure([Castle.structureName])
                      .get()
                  )
                  break
                case 'town':
                case 'towns':
                  console.log(
                    game
                      .Cells()
                      .controlledBy(game.activePlayer()!.id)
                      .hasStructure([Town.structureName])
                      .get()
                  )
                  break
                case 'cells':
                  console.log(
                    game
                      .Cells()
                      .controlledBy(game.activePlayer()!.id)
                      .get()
                  )
                  break
                case 'units':
                  console.log(
                    game
                      .Units()
                      .controlledBy(game.activePlayer()!.id)
                      .get()
                  )
                  break
                case 'resources':
                  const { actions, gold } = game.activePlayer()!.resources
                  const farms = game.farmsOwnedBy(game.activePlayer()!.id)
                  const towns = game.townsOwnedBy(game.activePlayer()!.id)
                  const units = game
                    .Units()
                    .controlledBy(game.activePlayer()!.id)
                    .count()
                  console.log(`Actions: ${actions}
Gold: ${gold}
Farms: ${farms}
Towns/Castles: ${towns}
Units: ${units}`)
              }
              break
            case 'range':
              console.log(
                `Showing distance from ${game.selectedCell().x},${
                  game.selectedCell().y
                }`
              )
              console.log(`Move cost: ${game.getMoveCost()}`)
              console.log(game.getCellsInRange())
              break
          }
          break
        case 'select':
          switch (command[1]) {
            case 'cell':
              const coords = command[2].split(',')
              game.selectCell(parseInt(coords[0], 10), parseInt(coords[1], 10))
              console.log(`Cell ${coords} selected.`)
              break
            case 'unit':
              if (game.selectableUnits().length > 0) {
                const toSelect = await inquirer.prompt([
                  {
                    type: 'list',
                    name: 'selectUnit',
                    message: 'Select a unit',
                    choices: game.selectableUnits().map(unit => ({
                      name: `${unit.name} (ATK: ${unit.attack} | HP: ${unit.health} | Moves: ${unit.movesLeft})`,
                      value: unit.id
                    }))
                  }
                ])
                game.selectUnit(toSelect.selectUnit)
              } else {
                console.log('No units available to select!')
              }
          }
          break
        case 'build':
          switch (command[1]) {
            case 'castle':
              await game
                .upgradeToCastle()
                .then(res => console.log(res))
                .catch(res => console.log(res))
              break
            case 'unit':
              if (!game.selectedCell().structure) {
                console.log('There is no building here.')
              } else if (
                game.selectedCell().controlledBy !== game.activePlayer()!.id
              ) {
                console.log('You do not control this cell.')
              } else {
                const toBuild: { selectUnit: string } = await inquirer.prompt([
                  {
                    type: 'list',
                    name: 'selectUnit',
                    message: 'Choose a unit to build',
                    choices: game.selectedCell().structure!.buildUnits
                  }
                ])
                switch (toBuild.selectUnit.toLowerCase()) {
                  case 'soldier':
                    await game
                      .buildUnit(Soldier)
                      .then(res => console.log(res))
                      .catch(res => console.log(res))
                    break
                  case 'archer':
                    await game
                      .buildUnit(Archer)
                      .then(res => console.log(res))
                      .catch(res => console.log(res))
                    break
                  case 'knight':
                    await game
                      .buildUnit(Knight)
                      .then(res => console.log(res))
                      .catch(res => console.log(res))
                    break
                  case 'assassin':
                    await game
                      .buildUnit(Assassin)
                      .then(res => console.log(res))
                      .catch(res => console.log(res))
                    break
                  case 'priest':
                    await game
                      .buildUnit(Priest)
                      .then(res => console.log(res))
                      .catch(res => console.log(res))
                    break
                  case 'wizard':
                    await game
                      .buildUnit(Wizard)
                      .then(res => console.log(res))
                      .catch(res => console.log(res))
                    break
                }
              }
              break
          }
          break
        case 'move':
          const coords = command[1].split(',')
          await game
            .moveSelectedUnits(parseInt(coords[0], 10), parseInt(coords[1], 10))
            .then(res => console.log(res))
            .catch(res => console.log(res))
          break
        case 'pass':
          await game.endTurn().then(res => console.log(res))
          break
        case 'exit':
          console.log('Exiting')
          return false
        default:
          console.log('Unknown command')
      }
    }

    return getCommand()
  }

  let game: Game
  let playerCount = 0
  while (playerCount <= 0) {
    const input = await askQuestion('How many players? ')
    if (parseInt(input, 10) !== NaN) playerCount = parseInt(input, 10)
    else console.log('Invalid input!')
  }
  const newPlayers: INewPlayer[] = []
  for (let i = 0; i < playerCount; i++) {
    const results = await inquirer.prompt([
      {
        type: 'input',
        name: `name`,
        message: `Player ${i + 1} - Enter a name: `,
        default: `Player${i + 1}`
      },
      {
        type: 'list',
        name: `type`,
        message: 'Human or AI?',
        choices: [
          {
            name: 'Human',
            value: PlayerType.Human
          },
          {
            name: 'AI',
            value: PlayerType.AI
          }
        ]
      }
    ])
    newPlayers.push({
      name: results.name,
      type: results.type
    })
  }

  game = new Game(newPlayers)
  getCommand()
}

main()

function askQuestion(query): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve =>
    rl.question(query, ans => {
      rl.close()
      resolve(ans)
    })
  )
}
