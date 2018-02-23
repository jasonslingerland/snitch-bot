'use strict';

module.exports = {
  name: 'getP2P3Count',
  description: 'gets the count of p2 and p3 bugs that are open',
  type: 'responsive',
  dependencies: [
    'jira'
  ],
  hiddenFromHelp: true,
  phrases: [
    'give me p2 p3 count',
    'p2 p3 count'
  ],
  fn: function ({
                  bot,
                  message,
                  jira
  }) {
    let filterPromises = [
      jira.get('filter/17400'),
      jira.get('filter/15209')
    ];
    Promise.all(filterPromises).then(filterResults => {
      console.log(filterResults);
      let searchResultsPromises = [];
      for (let item of filterResults) {
        console.log('search url-------------');
        console.log(item.data.searchUrl.split('/api/2/')[1]);
        console.log('search url-------------');
        searchResultsPromises.push(jira.get(item.data.searchUrl.split('/api/2/')[1]));
      }
      Promise.all(searchResultsPromises).then(searchResults => {
        const p2Total = searchResults[0].data.total;
        const p3Total = searchResults[1].data.total;
        bot.reply(message, `The total number of p2 bugs is \`${p2Total}\` and the total number of p3 bugs is \`${p3Total}\``);
      }).catch(err => {
        console.log(err);
        bot.reply(message, 'oops something went wrong.');
      })
    }).catch(err => {
      console.log(err);
      bot.reply(message, 'oops something went wrong.');
    });
  }
};
