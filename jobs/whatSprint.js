'use strict';
const calendar_config = require('../creds').calendar;
const calendar_API = require('node-google-calendar');
const moment = require('moment');
const build_calendar = new calendar_API(calendar_config);

module.exports = {
  name: 'whatSprint',
  description: "find out what sprint we're in, and which day in that sprint",
  type: 'responsive',
  dependencies: [
  ],
  hiddenFromHelp: false,
  phrases: [
    'what sprint is it',
    'what sprint are we in',
    'are we in a sprint right now',
    'what day of the sprint is it',
    "what's the current sprint"
  ],
  fn: function ({
                  bot,
                  message
                }) {
      const timeMin = moment();
      console.log(timeMin);
      const params = {
        timeMin: timeMin.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      };
      build_calendar.Events.list(calendar_config.calendarId.primary, params).then(response => {
        const daySummary = response[0].summary;
        const nextSprintDay = moment(response[0].start.dateTime);
        let reply = 'Today'
        if (timeMin.date() !== nextSprintDay.date()) {
          reply = `Today is not a work day. ${ nextSprintDay.calendar() }`
        }

        if (daySummary.slice(0, 6) === "Sprint") {
          const sprint = daySummary.match(/\d+/)[0];
          const day = daySummary.slice(daySummary.indexOf('day')+4)
          if (daySummary.includes('end')) {
            reply += ` is Branch Day for Sprint ${ sprint }! :party_parrot:`
          } else {
            reply +=  ` is day ${ day }.Sprint ${ sprint }. `
          }
        } else {
          reply += ` is not an active sprint day, but should be used to ${ daySummary.toLowerCase() }.`
        }

        bot.reply(message, reply)
      }).catch(err => {
        console.log(err.message);
      });
  }
};
