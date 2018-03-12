'use strict';
const utils = require('../utils');

module.exports = {
  name: 'getP2Count',
  description: 'gets the count of open p2 bugs or p3 bugs',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  hiddenFromHelp: false,
  phrases: [
    'give me p2 count',
    'p2 count',
    'give me p3 count',
    'p3 count'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  phraseMatch
                }) {
    let filterPath;
    if (phraseMatch.includes('p2')) {
      filterPath = 'filter/15209';
    } else {
      filterPath = 'filter/17400';
    }
    jira.get(filterPath).
    then(filterResults => {
      console.log(filterResults);
      const searchResultsPromise = jira.get(filterResults.data.searchUrl.split('/api/2/')[1]);
      utils.getIssueCount({
        jqlOrPromise: searchResultsPromise,
        bot: bot,
        message: message
      }).
      then(count => {
        bot.reply(message, `The total number of p2 bugs is \`${count}\``);
      }).catch(err => {
        console.log(err);
        utils.somethingWentWrong(bot, message);
      });
    }).catch(err => {
      console.log(err);
      utils.somethingWentWrong(bot, message);
    });
  }
};
