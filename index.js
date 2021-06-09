/* eslint-env node */

import bodyParser from "body-parser";
import express from "express";
import Config from "./utils/Config.js";
import ExperimentManager from "./api/ExperimentManager.js";

let app;

function start() {
    startServer();
}

function startServer() {
    app = express();
    app.use(bodyParser.json());
    app.use(express.static(Config.appDir));
    app.get("/api/experiment/:id", onExperimentRequested);
    app.get("/api/experiment/:id/cancel", onExperimentCanceled);
    app.get("/api/experiment/:id/close", onExperimentsResultsSend);
    app.get("/api/experiments/random", onRandomExperimentRequested);
    app.listen(Config.port);
}

function onExperimentRequested(request, response) {
    let result = ExperimentManager.getExperiment(request.params.id);
    response.json(result);
}

function onRandomExperimentRequested(request, response) {
    let experiment = ExperimentManager.pickRandomExperiment();
    response.json(experiment);
}

function onExperimentsResultsSend(request, response) {
    response.json({ msg: "Not yet implemented" });
}

function onExperimentCanceled(request, response) {
    let result = ExperimentManager.putBackExperiment(request.params.id);
    response.json(result);
}

start();