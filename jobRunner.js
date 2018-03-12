'use strict';

const every = require('schedule').every;
const fs = require('fs');
const normalizedPath = require("path").join(__dirname, "jobs");
let FuzzySet = require('fuzzyset.js');
let fuzzyMatcher = FuzzySet();
let phraseToJobMap = {};
const userInfoStrings = {
  'githubId': 'Github ID',
  'jiraUserId': 'Jira User ID'
};

function runJobs(slackBot, dependenciesObj) {
  dependenciesObj.userInfoStrings = userInfoStrings;
  // getting jobs from the directory
  let jobs = [];
  fs.readdirSync(normalizedPath).forEach(function(file) {
    if (file.endsWith('.js')) {
      jobs.push(require('./jobs/' + file));
    }
  });

  console.log('Loading jobs...');
  let responsiveJobs = [];
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
      responsiveJobs.push(job);
    }
  }
  dependenciesObj.responsiveJobs = responsiveJobs;
  setupFuzzyMatcher(responsiveJobs);
  slackBot(listenForSlackMessages(dependenciesObj));
}

function setupFuzzyMatcher(responsiveJobs) {
  for (let job of responsiveJobs) {
    for (let phrase of job.phrases) {
      fuzzyMatcher.add(phrase);
      phraseToJobMap[phrase] = job;
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

function listenForSlackMessages(dependenciesObj) {
  return async (bot, message) => {
    // find the job this message pertains to
    const [job, phraseMatch] = findJobFromMessage(message);
    // check if it needs identifying info
    let userInfo = {};
    let userInfoPopulated = true;
    if (job.userInfoNeeded) {
      let userInfoStore = dependenciesObj.userInfoStore;
      let retreivedUserInfo;
      try {
        retreivedUserInfo = await userInfoStore.findOne({user: message.user});
      } catch (e) {
        console.log(e);
        retreivedUserInfo = {};
      }
      if (retreivedUserInfo === null) {
        retreivedUserInfo = {};
      }
      for (let userInfoNeeded of job.userInfoNeeded) {
        if (!retreivedUserInfo[userInfoNeeded]) {
          // if we don't have what we're looking for ask the user to input it.
          bot.reply(message,
            `Sorry, I can't do that without your ${userInfoStrings[userInfoNeeded]}.\n`
            + 'Give it to me by saying something like: '
            + `\`@Amazing-Bot set my ${userInfoStrings[userInfoNeeded]} to "something"\`.`
            + ' Remember to include the quotes.');
          userInfoPopulated = false;
        } else {
          userInfo[userInfoNeeded] = retreivedUserInfo[userInfoNeeded];
        }
      }
    }
    if (userInfoPopulated) {
      //bundle dependencies and add bot, message, userInfo
      let dependencies = bundleDependencies(dependenciesObj, job.dependencies);
      dependencies.bot = bot;
      dependencies.message = message;
      dependencies.userInfo = userInfo;
      dependencies.phraseMatch = phraseMatch;
      job.fn(dependencies);
    }
  }
}

function findJobFromMessage(message) {
   const unknownIntent = {
    fn: function ({
                   message,
                   bot
    }) {
      bot.reply(message, 'Sorry, not sure what you want. type `@Amazing-Bot help` for a list of things I can do.');
    },
    dependencies: []
  };
  const match = fuzzyMatcher.get(message.text);
  console.log(match);
  // if we don't have a match or the confidence is extremely low, tell the user we don't know what to do
  if (!match || match[0][0] < 0.33) {
    return [unknownIntent, undefined];
  } else {
    return [phraseToJobMap[match[0][1]], match[0][1]];
  }
}

module.exports = {
  runJobs: runJobs
};

