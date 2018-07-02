'use strict'

const utils = require('../utils');

module.exports = {
  name: 'myOpenBugs',
  description: 'lists number of open bugs that a user has',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  userInfoNeeded: [
    'jiraUserId'
  ],
  hiddenFromHelp: false,
  phrases: [
    'give me my p2 p3 count',
    'what is my p2 p3 count',
    'my bug count',
    'my p2 p3 count',
    'my p2 count',
    'my p3 count',
    'my bugs',
    'my open bugs',
    'my p2s',
    'my p3s',
    'my p2s and p3s',
    'how many p2 bugs do I have',
    'how many p3 bugs do I have',
    'how many p2 and p3 bugs do I have',
    'how many open bugs do I have'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  userInfo,
                  phraseMatch
                }) {
    const p2p3 = [];
    const filters = [];
    let jqlOrPromise = `assignee = ${userInfo.jiraUserId} AND status IN (Open, Reopened, "In Progress") AND type = bug`;
    if (phraseMatch.includes('p2')) {
      p2p3.push('p2');
      filters.push('filter = 15209');
    }
    if (phraseMatch.includes('p3')) {
      p2p3.push('p3');
      filters.push('filter = 17400');
    }
    if (filters.length > 0) {
      jqlOrPromise += ' AND (' + filters.join(' OR ') +')';
    }
    console.log(jqlOrPromise);
    utils.getIssueCount({
      jqlOrPromise,
      bot,
      message,
      jira
    }).
    then(count => {
      let plural = '';
      if (count[0] > 1) {
        plural = 's'
      };
      bot.reply(message, `<@${message.user}> you have \`${count[0]}\` open ${ p2p3.join(' and ') } bug${plural}.`);
    }).catch(response => {
      console.log(response);
    });
  }
};
