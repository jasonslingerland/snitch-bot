# snitch-bot
A little framework to run jira queries at specified intervals and post useful info to slack.

There must be a creds.js which looks like:

```
module.exports = {
  hookUrls: {
    <a slack channel name>: <a slack channel hook URL>
  },
  jiraBaseUrl: <url for jira (e.g. https://companyName.atlassian.net)>,
  username: <jira username>,
  password: <jira password>,
  oauth: <slack oauth token for the bot user>
}
```

To use the Google calendar branch day functionality, there must also be a google_creds.json file and another object, calendar, in the creds.js module that looks like:

```
calendar: {
  key,
  serviceAcctId:  <a google service account address (e.g. <service_account>@<project_name>.iam.gserviceaccount.com)>,
  calendarId: {
    primary: <email that has a primary calendar with branch day on it>
  },
  timezone: <timezone>
}
```
where key is defined as `require('./google_creds.json').private_key`

For more information about using node-google-calendar see [the package documentation](https://github.com/yuhong90/node-google-calendar/wiki).

To add a time based job you create a javascript file in the jobs directory that looks like:

```
// see billingChanges.js for a simple example
module.exports = {
  name: <job name>,
  description: <job description>,
  type: <job type. currently either 'time-based' or 'reactive',
  dependencies: [
    <list of dependencies as strings. Look at the bottom of main.js
     for the list of those. e.g. 'slackChannel'>
  ],
  hiddenFromHelp: <true or false>,
  slackChannel: <slack channel name (one of the ones in creds.js)>,
  invokeEvery: <time period to run the job, see link below code snippet for format>,
  fn: <function to do the job, it's given what's listed in the dependencies
       list as a destructured (object) parameter, must be exactly as listed in dependencies>
}
```

To add a responsive job you do the same thing but without slackChannel or invokeEvery. You must also include a few
additional fields. fn must also include 'bot' and 'message' in its arguments. The additional fields are:

```
// see myOpenBugs.js for a simple example
phrases: [
  <phrases to fuzzy match on to invoke the job>
],
userInfoNeeded: [
  <list the user info you need. Must match exactly what's listed in jobRunner.
   gets passed to fn as 'userInfo'. Can be omitted if you don't need anything.>
]
```
### important note for invokeEvery

I'm using [this library](https://www.npmjs.com/package/schedule) which is nice
because it allows you to say things like every('1 hour').do(something), but it does have a funny
spelling of minutes, so I suggest just using 'h','m','s' because it doesn't fail if it gets
an invalid argument
