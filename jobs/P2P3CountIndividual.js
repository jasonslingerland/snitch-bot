'use strict';
const utils = require('../utils');

module.exports = {
  disabled: true,
  name: 'P2P3CountIndividual',
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
    'p3 count',
    'how many p2s do I have',
    'how many p3s do I have'
  ],
  fn: function ({
                  bot,
                  message,
                  jira,
                  phraseMatch
                }) {
    let filterPath;
    let p2p3String = 'p3';
    if (phraseMatch.includes('p2')) {
      p2p3String = 'p2';
      filterPath = 'filter/15209';
    } else {
      filterPath = 'filter/17400';
    }
    jira.get(filterPath).
    then(filterResults => {
      const searchResultsPromise = jira.get(filterResults.data.searchUrl.split('/api/2/')[1]);
      utils.getIssueCount({
        jqlOrPromise: searchResultsPromise,
        bot: bot,
        message: message
      }).
      then(count => {
        bot.reply(message, `The total number of ${p2p3String} bugs is \`${count[0]}\``);
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
