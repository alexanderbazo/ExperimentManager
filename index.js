/* eslint-env node */

import { exec } from "child_process";
import express from "express";
import Config from "./utils/Config.js";
import ExperimentManager from "./api/ExperimentManager.js";

let app;

function start() {
    startServer();
}

function startServer() {
    app = express();
    app.use(express.json());
    app.use(express.static(Config.appDir));
    app.use("/app", express.static(Config.appDir));
    app.get("/update", onClientUpdateRequested);
    app.get("/api/experiment/:id", onExperimentRequested);
    app.get("/api/experiment/:id/cancel", onExperimentCanceled);
    app.get("/api/experiment/:id/close", onExperimentsResultsSend);
    app.get("/api/experiments/random", onRandomExperimentRequested);
    app.listen(Config.port);
}

function onClientUpdateRequested(request, response) {
    setImmediate(() => exec(Config.updateScript));
    response.json({ msg: "Trying to update client code, server will now shutdown ..." });
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
    let result = ExperimentManager.storeExperimentResults(request.body);
    response.json(result);
}

function onExperimentCanceled(request, response) {
    let result = ExperimentManager.putBackExperiment(request.params.id);
    response.json(result);
}

start();