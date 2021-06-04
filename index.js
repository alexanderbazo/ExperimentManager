/* eslint-env node */

import express from "express";
import Config from "./utils/Config.js";
import ExperimentManager from "./api/ExperimentManager.js";

let app;

function start() {
    startServer();
}

function startServer() {
    app = express();
    app.listen(Config.port);
    app.use(express.static(Config.appDir));
    app.get("/api/experiment/random", onRandomExperimentRequested);
}

function onRandomExperimentRequested(request, response) {
    let experiment = ExperimentManager.pickRandomExperiment();
    response.json(experiment);
}

function onExperimentsResultsSend(request, response) {

}

function onExperimentCanceled(request, response) {

}

start();