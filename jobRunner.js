'use strict';

const every = require('schedule').every;
const fs = require('fs');
const normalizedPath = require("path").join(__dirname, "jobs");

function runJobs(postSlackMessageFunctions, jira) {
  let jobs = [];
  let previousMessages = {};

  fs.readdirSync(normalizedPath).forEach(function(file) {
    jobs.push(require('./jobs/' + file));
  });

  console.log('Loading jobs...');
  for (let job of jobs) {
    every(job.invokeEvery).do(function () {
      console.log(`invoking ${job.name}`);
      const postSlackMessageFn = postSlackMessageFunctions[job.slackChannel];
      if (!postSlackMessageFn) {
        console.log('Unknown slack channel, did you spell it correctly?');
      } else {
        job.fn(postSlackMessageFn,
               jira,
               previousMessages);
      }
    });
    console.log(`invoking ${job.name} every ${job.invokeEvery}`);
  }
}

module.exports = {
  runJobs: runJobs
};

