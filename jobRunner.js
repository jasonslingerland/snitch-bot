'use strict';

const every = require('schedule').every;
const fs = require('fs');
const normalizedPath = require("path").join(__dirname, "jobs");

function runJobs(dependenciesObj) {
  // getting jobs from the directory
  let jobs = [];
  fs.readdirSync(normalizedPath).forEach(function(file) {
    if (file.endsWith('.js')) {
      jobs.push(require('./jobs/' + file));
    }
  });

  console.log('Loading jobs...');
  for (let job of jobs) {
    if (job.type === 'time-based') {
      every(job.invokeEvery).do(function () {
        console.log(`invoking ${job.name}`);
        const dependencies = bundleDependencies(dependenciesObj,
                                                job.dependencies,
                                                job.slackChannel);
        job.fn(dependencies);
      });
      console.log(`invoking ${job.name} every ${job.invokeEvery}`);
    } else if (job.type === 'responsive') {

    }
  }
}

function bundleDependencies(dependenciesObj, jobDependencies, optionalSlackChannel) {
  let dependencies = {};
  const slackChannel = 'slackChannel';
  for (let dependencyName of jobDependencies) {
    if (dependencyName === slackChannel) {
      const postSlackMessageFn = dependenciesObj.postSlackMessageFunctions[optionalSlackChannel];
      if (!postSlackMessageFn) {
        console.log('Unknown slack channel, did you spell it correctly?');
      } else {
        dependencies[slackChannel] = postSlackMessageFn
      }
    } else {
      dependencies[dependencyName] = dependenciesObj[dependencyName];
    }
  }
  return dependencies;
}

module.exports = {
  runJobs: runJobs
};

