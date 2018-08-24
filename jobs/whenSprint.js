'use strict';
const calendar_config = require('../creds').calendar;
const calendar_API = require('node-google-calendar');
const moment = require('moment');
const build_calendar = new calendar_API(calendar_config);

module.exports = {
  name: 'whatSprint',
  description: "find out when a sprint starts or ends",
  type: 'responsive',
  dependencies: [
  ],
  hiddenFromHelp: false,
  phrases: [
    'when does sprint 90 start',
    'when does sprint 90 end',
    'when is sprint 90',
    'on what day does sprint 90 start'
  ],
  fn: function ({
                  bot,
                  message
                }) {
      const messageText = message.text.toLowerCase();
      let includeStart = false;
      let includeEnd = false;
      if (messageText.includes('end')) {
        includeEnd = true;
      }
      if (messageText.includes('start')) {
        includeStart = true;
      }
      if (!includeStart && !includeEnd) {
        includeStart = true;
        includeEnd = true;
      }
      const sprint = messageText.match(/\d+/)[0];
      const params = {
        q: `Sprint ${ sprint } day`,
        singleEvents: true,
        orderBy: 'startTime'
      };
      build_calendar.Events.list(calendar_config.calendarId.primary, params).then(response => {
        let reply = 'No sprint found';
        if (response.length !== 0) {
          const dates = [];
          const start = moment(response[0].start.date);
          const end = moment(response.pop().start.date);
          if (includeStart) {
            dates.push(` starts on ${ start.format('dddd, MMMM Do') }`)
          }
          if (includeEnd) {
            dates.push(` ends on ${ end.format('dddd, MMMM Do') }`)
          }
          reply = `Sprint ${ sprint + dates.join(' and')}`
        }
        bot.reply(message, reply)
      }).catch(err => {
        console.log(err.message);
      });
  }
};
