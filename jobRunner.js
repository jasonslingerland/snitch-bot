'use strict';

const every = require('schedule').every;
const fs = require('fs');
const normalizedPath = require("path").join(__dirname, "jobs");
const FuzzySet = require('fuzzyset.js');
const fuzzyMatcher = FuzzySet();
const phraseToJobMap = {};
const userInfoStrings = {
  'githubId': 'Github ID',
  'jiraUserId': 'Jira User ID',
  'jiraTeam': 'Jira Team'
};

function runJobs(slackBot, dependenciesObj) {
  dependenciesObj.userInfoStrings = userInfoStrings;
  // getting jobs from the directory
  const jobs = [];
  fs.readdirSync(normalizedPath).forEach(function(file) {
    if (file.endsWith('.js')) {
      const job = require('./jobs/' + file);
      if (!job.disabled) {
        jobs.push(job);
      }
    }
  });

  console.log('Loading jobs...');
  const responsiveJobs = [];
  for (const job of jobs) {
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
  for (const job of responsiveJobs) {
    for (const phrase of job.phrases) {
      fuzzyMatcher.add(phrase);
      phraseToJobMap[phrase] = job;
    }
  }
}

function bundleDependencies(dependenciesObj, jobDependencies, optionalSlackChannel) {
  const dependencies = {};
  const slackChannel = 'slackChannel';
  for (const dependencyName of jobDependencies) {
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
    //exit if we get the restart command
    if (message.text === '//restart') {
      bot.reply(message, ':skull_and_crossbones:', function() {
        process.exit(0)
      });
    }
    // find the job this message pertains to
    const [ job, phraseMatch ] = findJobFromMessage(message);
    // check if it needs identifying info
    const userInfo = {};
    let userInfoPopulated = true;
    if (job.userInfoNeeded) {
      const userInfoStore = dependenciesObj.userInfoStore;
      let retrievedUserInfo;
      try {
        retrievedUserInfo = await userInfoStore.findOne({
          user: message.user
        });
      } catch (e) {
        console.log(e);
        retrievedUserInfo = {};
      }
      if (retrievedUserInfo === null) {
        retrievedUserInfo = {};
      }
      for (const userInfoNeeded of job.userInfoNeeded) {
        if (!retrievedUserInfo[userInfoNeeded]) {
          // if we don't have what we're looking for ask the user to input it.
          bot.reply(message,
            `Sorry, I can't do that without your ${userInfoStrings[userInfoNeeded]}.\n`
            + 'Give it to me by saying something like: '
            + `\`@QA-Bot set my ${userInfoStrings[userInfoNeeded]} to "something"\`.`
            + ' Remember to include the quotes.');
          userInfoPopulated = false;
        } else {
          userInfo[userInfoNeeded] = retrievedUserInfo[userInfoNeeded];
        }
      }
    }
    if (userInfoPopulated) {
      //bundle dependencies and add bot, message, userInfo
      const dependencies = bundleDependencies(dependenciesObj, job.dependencies);
      dependencies.bot = bot;
      dependencies.message = message;
      dependencies.userInfo = userInfo;
      dependencies.phraseMatch = phraseMatch;
      job.fn(dependencies);
    }
  }
}

function findJobFromMessage(unknownMessage) {
   const unknownIntent = {
    fn: function ({
                   message,
                   bot
    }) {
      bot.reply(message, 'Sorry, not sure what you want. type `@QA-Bot help` for a list of things I can do.');
    },
    dependencies: []
  };
  const match = fuzzyMatcher.get(unknownMessage.text);
  console.log(match);
  // if we don't have a match or the confidence is extremely low, tell the user we don't know what to do
  if (!match || match[0][0] < 0.33) {
    return [ unknownIntent, undefined ];
  } else {
    return [ phraseToJobMap[match[0][1]], match[0][1] ];
  }
}

module.exports = {
  runJobs: runJobs
};
