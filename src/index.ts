import 'reflect-metadata'
import Scenario from "./Scenario/Scenario";

const scenario = new Scenario();
console.log(JSON.stringify(scenario.generateGrid()));