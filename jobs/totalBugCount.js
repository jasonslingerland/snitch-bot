'use strict';
const utils = require('../utils');

module.exports = {
  name: 'getP2P3Count',
  description: 'gets the count of p2 and p3 bugs that are open',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  hiddenFromHelp: false,
  phrases: [
    'give me the p2 p3 count',
    'what is the total p2 p3 count',
    'total bug count',
    'bug count',
    'p2 p3 count',
    'p2 count',
    'p3 count',
    'p2 p3 total',
    'p2 total',
    'p3 total',
    'bug total',
    'how many p2s are there',
    'how many p3s are there',
    'how many p2s and p3s are there',
    'how many bugs are there',
    'how many p2 and p3 bugs are there',
    'how many p2 bugs do we have',
    'how many p3 bugs do we have',
    'how many p2 and p3 bugs do we have'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  phraseMatch
                }) {
    const p2p3 = [];
    const filters = [];
    if (!phraseMatch.includes('p2') && !phraseMatch.includes('p3')) {
      p2p3.push('');
      filters.push('status IN (Open, Reopened, "In Progress") AND type = bug');
    }
    if (phraseMatch.includes('p2')) {
      p2p3.push(' p2');
      filters.push('filter = 15209');
    }
    if (phraseMatch.includes('p3')) {
      p2p3.push(' p3');
      filters.push('filter = 17400');
    }
    let reply = '';
    function getReply(counts) {
      console.log(counts);
      p2p3.forEach((bugType, index) => {
      reply += `The total number of open${ bugType } bugs is \`${ counts[index] }\`\n`});
      reply = reply.trim();
      return reply;
    }
    utils.getIssueCount({
      jqlOrPromise: filters,
      bot: bot,
      message: message,
      jira: jira
    }).
    then(counts => {
      bot.reply(message, getReply(counts));
    }).catch(err => {
      console.log(err);
    });
  }
};
