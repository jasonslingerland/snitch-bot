'use strict';
const jiraBaseUrl = require('./creds').jiraBaseUrl;
const FuzzySet = require('fuzzyset.js');
const teamNames = [
  'administrators',
  'android-developers',
  'api-team',
  'arch-team',
  'asm-team',
  'automation-team',
  'builds-team',
  'customerSuccess',
  'DataManagement-team',
  'developers',
  'developers - amcbridge',
  'developers - graebert',
  'dev-ops-team',
  'DevTeamLeads',
  'directors',
  'documentation',
  'DrawingDataMgmtPerf',
  'drawings-developers',
  'Everglades',
  'ext-marketing',
  'ext-team-inboundlabs',
  'fs-team',
  'graphics-team',
  'ios-developers',
  'language-translators',
  'marketing',
  'MobileDataEnterpriseDocs',
  'Modeling-team',
  'operations-team',
  'partStudio-team',
  'Performance',
  'Pune',
  'QE',
  'Sales',
  'security-team',
  'tech-marketing',
  'tools-team',
  'Training',
  'training-developers',
  'translator-developers',
  'UI&API',
  'UI-team',
  'Upper Management',
  'ux-team'
]

const teamMatcher = FuzzySet();

const teamNameMap = {}

teamNames.forEach(team => {
  if (team.slice(-5) === '-team') {
    const teamlessName = team.slice(0,-5);
    teamNameMap[teamlessName] = team;
    teamMatcher.add(teamlessName);
    teamMatcher.add(team);
  }
  else {
    teamNameMap[team] = team;
    teamMatcher.add(team);
  }
});

const createIssueLink = function (idOrKey) {
  return `<${jiraBaseUrl}/browse/${idOrKey}|${idOrKey}>`;
};

const getIssueKeys = function (issues) {
  const issueKeys = [];
  issues.forEach(issue => {
    issueKeys.push(issue.key);
  });
  return issueKeys;
};

const normalizeJqlOrPromise = function (jqlOrPromise, maxResults, jira) {
  let promise;
    if (typeof jqlOrPromise === 'string') {
      promise = jira.makeJqlQuery({
        jql: jqlOrPromise,
        fields: [ 'issuetype', 'summary' ],
        maxResults: maxResults
      });
    } else {
      promise = jqlOrPromise;
    }
    return promise;
};

const somethingWentWrong = function (bot, message) {
  return function() {
    bot.reply(message, 'Sorry, something went wrong.');
  }
};

const listIssuesInResult = function ({
                                       bot,
                                       message,
                                       jira,
                                       jqlOrPromise
                                     }) {
  return new Promise(function (resolve, reject) {
    if (!Array.isArray(jqlOrPromise)) {
      jqlOrPromise = [ jqlOrPromise ];
    }
    const promises = [];
    jqlOrPromise.forEach(function(item) {
      promises.push(normalizeJqlOrPromise(item, 100, jira));
    });
    const promise = Promise.all(promises);
    promise.then(response => {
      if (!Array.isArray(response)) {
        response = [ response ];
      }
      const issueListStrings = [];
      for (const item of response) {
        if (item.data && item.data.warningMessages) {
          bot.reply(message, `<@${message.user}> sorry, something went wrong. `
            + `Received error message from jira:\n \`${item.data.warningMessages.join('`\n')}\``);
          reject(item);
        } else {
          let issueListString = '';
          if (item.data === undefined || item.data.issues[0] === undefined) {
            issueListString = 'No issues.';
          } else {
            item.data.issues.forEach(issue => {
              issueListString += `${createIssueLink(issue.key)} ${issue.fields.summary}\n`;
            });
          }
          issueListStrings.push(issueListString);
        }
      }
      resolve(issueListStrings);
    }).catch(err => {
      console.log(err);
      if (err.response.data && err.response.data.errorMessages) {
        bot.reply(message, `<@${message.user}> sorry, something went wrong. `
           + `Received error message from jira:\n \`${err.response.data.errorMessages.join('`\n')}\``);
      } else {
        somethingWentWrong(bot, message)();
      }
      reject(err);
    });
  });
};

const getIssueCount = function ({
                                  jqlOrPromise,
                                  bot,
                                  message,
                                  jira
}) {
  return new Promise(function (resolve, reject) {
    if (!Array.isArray(jqlOrPromise)) {
      jqlOrPromise = [ jqlOrPromise ];
    }
    const promises = [];
    jqlOrPromise.forEach(function(item) {
      promises.push(normalizeJqlOrPromise(item, 1, jira));
    });
    const promise = Promise.all(promises);
    promise.then(result => {
      if (!Array.isArray(result)) {
        result = [ result ];
      }
      const counts = [];
      for (const item of result) {
        if (item.data && item.data.warningMessages) {
          bot.reply(message, `<@${message.user}> sorry, something went wrong. `
            + `Received error message from jira:\n \`${item.data.warningMessages.join('`\n')}\``);
          reject(item);
        }
        counts.push(item.data.total);
      }
      resolve(counts);
    }).catch(err => {
      console.log(err);
      if (err.response.data && err.response.data.errorMessages) {
        bot.reply(message, `<@${message.user}> sorry, something went wrong. `
          + `Received error message from jira:\n \`${err.response.data.errorMessages.join('`\n')}\``);
      } else {
        somethingWentWrong(bot, message)();
      }
      reject(err);
      bot.reply(message, `Sorry, something went wrong.`);
    });
  });
};

const matchTeam = function (teamGuess) {
  const match = teamMatcher.get(teamGuess);
  if (!match || match[0][0] < 0.5) {
    return undefined;
  } else {
    return teamNameMap[match[0][1]];
  }
}
const getTeamFromMessageText = function (messageText) {
  const messageWords = messageText.split(" ");
  console.log(messageWords);
  let teamIndex = messageWords.indexOf('team');
  console.log(teamIndex);
  if (teamIndex === -1) { teamIndex = messageWords.indexOf("team's")};
  let team = matchTeam(messageWords[teamIndex-1]);
  if (!team) {
    team = matchTeam(messageWords[teamIndex+1]);
  }
  return team
};

module.exports = {
  createIssueLink,
  jiraBaseUrl,
  getIssueKeys,
  getIssueCount,
  somethingWentWrong,
  listIssuesInResult,
  getTeamFromMessageText,
  matchTeam,
  teamNames
};
