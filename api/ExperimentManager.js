/* eslint-env node */

import fs from "fs";
import path from "path";
import { start } from "repl";
import Config from "../utils/Config.js";

let experiments;

function loadExperimentsFromDisk(dataPath) {
    let files = fs.readdirSync(dataPath);
    experiments = [];
    files.forEach(file => experiments.push(Experiment.fromFile(path.join(dataPath, file))));
}

/**
 * Updates the corresponding JSON file with the data from the experiment object. If the objects
 * state was set to "closed", the file will be moved from Config.dataDir to Config.resultsDir and the 
 * experiment object will be removed from the live array ("experiments");
 */
function updateExperimentOnDisk(experiment) {
    let filePath = path.join(Config.dataDir, experiment.id + ".json"),
        experimentAsJSON = JSON.stringify(experiment);
    fs.writeFileSync(filePath, experimentAsJSON);
}

/**
 * Resets the given experiment in the live array ("experiments") and on disk so that it can be reused
 * by another participant
 */
function resetExperiment(id) {
    let foundExperiments = experiments.filter(experiment => experiment.id === id);
    if (foundExperiments.length !== 0) {
        foundExperiments[0].state = "open";
        foundExperiments[0].startedAt = null;
        foundExperiments[0].currentParticipant = null;
        foundExperiments[0].results = {
            data: null,
        };
        updateExperimentOnDisk(foundExperiments[0]);
    }
}

class Experiment {

    constructor(id, state, startedAt, conditions, currentParticipant, results) {
        this.id = id;
        this.state = state;
        this.startedAt = startedAt;
        this.conditions = conditions;
        this.currentParticipant = currentParticipant;
        this.results = results;
    }

    static fromFile(filePath) {
        let fileContent = fs.readFileSync(filePath),
            values = JSON.parse(fileContent);
        return new Experiment(values.id, values.state, values.startedAt, values.conditions, values.currentParticipant, values.results);
    }
}

class ExperimentError {

    constructor(msg) {
        this.msg = msg;
        Object.freeze(msg);
    }
}

class ExperimentManager {

    constructor() {
        loadExperimentsFromDisk(Config.dataDir);
    }


    /**
     * Returns a currently not used and not yet finished experiment by
     * randomly picking one while trying to balance the different conditions
     */
    pickRandomExperiment() {
        let availableExperiments, pick;
        if (experiments.length === 0) {
            return new ExperimentError("No more experiments available");
        }
        availableExperiments = experiments.filter(experiment => experiment.state === "open");
        if (availableExperiments.length === 0) {
            return new ExperimentError("No open experiment currently available");
        }
        pick = availableExperiments[Math.floor(Math.random() * availableExperiments.length)];
        pick.state = "in-use";
        pick.startedAt = Date.now();
        updateExperimentOnDisk(pick);
        return pick;
    }

    /**
     * Resets the state of the given experiments so that it can be reused by another
     * participant. 
     */
    putBackExperiment(experiment) {

    }

    /**
     * Marks the given experiment as done an stores it results for further analysis. The 
     * stored experiment will not be available to other participants. 
     */
    storeExperimentResults(experiment) {

    }

}

export default new ExperimentManager();