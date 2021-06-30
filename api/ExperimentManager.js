/* eslint-env node */

import fs from "fs";
import path from "path";
import Config from "../utils/Config.js";

const CONDITIONS = ["step-through", "data", "speed"];

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
    if (experiment.state === "closed") {
        let targetPath = path.join(Config.resultsDir, experiment.id + ".json");
        fs.copyFileSync(filePath, targetPath);
        fs.unlinkSync(filePath);
        for (let i = 0; i < experiments.length; i++) {
            if (experiments[i].id === experiment.id) {
                experiments.splice(i, 1);
                return new ExperimentMessage(`Experiment ${experiment.id} closed and moved to storage.`);
            }
        }
    }
    return new ExperimentMessage(`Experiment ${experiment.id} updated.`);
}

/**
 * Resets the given experiment in the live array ("experiments") and on disk so that it can be reused
 * by another participant
 */
function resetExperimentWidthID(id) {
    let foundExperiments = experiments.filter(experiment => experiment.id === id);
    if (foundExperiments.length !== 0) {
        foundExperiments[0].state = "open";
        foundExperiments[0].startedAt = null;
        foundExperiments[0].currentParticipant = null;
        foundExperiments[0].results = {
            data: null,
        };
        return updateExperimentOnDisk(foundExperiments[0]);
    }
    return new ExperimentError(`Unknown ID, could not reset experiment for ${id}`);
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

    constructor(error) {
        this.error = error;
        Object.freeze(this);
    }
}

class ExperimentMessage {

    constructor(msg) {
        this.msg = msg;
        Object.freeze(this);
    }
}

class ExperimentManager {

    constructor() {
        loadExperimentsFromDisk(Config.dataDir);
    }


    /**
     * Returns a currently not used and not yet finished experiment by
     * randomly picking one while trying to balance the different conditions.
     * 
     * Before returning, the picked experiment's state will be changed to "in-use".
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
        pick = this.pickRandomExperimentWithConditionBias(availableExperiments);
        pick.state = "in-use";
        pick.startedAt = Date.now();
        updateExperimentOnDisk(pick);
        return pick;
    }

    pickRandomExperimentWithConditionBias(availableExperiments) {
        let filteredExperiments = {},
            experimentsForPick;
        CONDITIONS.forEach(condition => filteredExperiments[condition] = availableExperiments.filter(experiment => experiment.conditions[1].mode === condition));
        experimentsForPick = filteredExperiments[CONDITIONS[0]];
        for (let i = 1; i < CONDITIONS.length; i++) {
            let condition = CONDITIONS[i],
                experimentsForConditions = filteredExperiments[condition];
            if (experimentsForConditions.length > experimentsForPick.length) {
                experimentsForPick = experimentsForConditions;
            }
        }
        return experimentsForPick[Math.floor(Math.random() * experimentsForPick.length)];
    }

    /**
     * 
     * Returns the experiment, identified by the given id, without changing its state
     */
    getExperiment(id) {
        let foundExperiments = experiments.filter(experiment => experiment.id === id);
        if (foundExperiments.length !== 0) {
            return foundExperiments[0];
        }
        return new ExperimentError(`Could not retrieve experiment for ${id}`);
    }

    /**
     * Resets the state of the given experiments so that it can be reused by another
     * participant. 
     */
    putBackExperiment(id) {
        return resetExperimentWidthID(id);
    }

    /**
     * Marks the given experiment as done an stores it results for further analysis. The 
     * stored experiment will not be available to other participants. 
     */
    storeExperimentResults(experiment) {
        experiment.state = "closed";
        return updateExperimentOnDisk(experiment);
    }

}

export default new ExperimentManager();