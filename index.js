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
    app.use("/app", express.static(Config.appDir)); // Serves client
    app.post("/update", onClientUpdateRequested); // Invokes client update and server restart
    app.get("/api/experiment/:id", onExperimentRequested); // Returns current state of given experiment from server
    app.post("/api/experiment/:id", onExperimentUpdated); // Stores current state of given experiment on server
    app.post("/api/experiment/:id/cancel", onExperimentCanceled); // Resets given experiment on server
    app.post("/api/experiment/:id/close", onExperimentClosed); // Sets experiment state to closed and stores it on server
    app.get("/api/experiments/random", onRandomExperimentRequested); // Returns current state of a random pick from all available experiments
    app.listen(Config.port);
}

function onClientUpdateRequested(request, response) {
    setImmediate(() => exec(Config.updateScript));
    response.json({ msg: "Trying to update client code, server will now shutdown ..." });
}

function onExperimentUpdated(request, response) {
    let result = ExperimentManager.updateExperimentData(request.body);
    response.json(result);
}


function onExperimentRequested(request, response) {
    let result = ExperimentManager.getExperiment(request.params.id);
    response.json(result);
}

function onRandomExperimentRequested(request, response) {
    let experiment = ExperimentManager.pickRandomExperiment();
    response.json(experiment);
}

function onExperimentClosed(request, response) {
    let result = ExperimentManager.closeExperiment(request.body);
    response.json(result);
}

function onExperimentCanceled(request, response) {
    let result = ExperimentManager.putBackExperiment(request.params.id);
    response.json(result);
}

start();