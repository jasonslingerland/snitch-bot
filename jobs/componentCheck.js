'use strict';
const utils = require('../utils');

module.exports = {
  name: 'componentCheck',
  description: 'checks for new components',
  type: 'time-based',
  //type: 'responsive',
  phrases: [
    'component'
  ],
  dependencies: [
    'slackChannel',
    'jira',
    'mongo'
  ],
  slackChannel: 'test',
  //disabled: true,
  invokeEvery: '30 m',
  fn: function ({
                  slackChannel,
                  jira,
                  mongo
                }) {
    const collection = mongo.collection('components');
    const projects = ['AND','BEL','IOS','TRN'];
    const componentsPromises = [];
    for (const project of projects) {
      componentsPromises.push(jira.get(`project/${project}/components`));
    }
    Promise.all(componentsPromises).then(async results => {
     // if mongo is empty populte
      if (await collection.count() === 0) {
        // slackChannel('Known components list was empty, filling now.');
        let knownComponents = [];
        for (let result of results) {
          for (let componentObj of result.data) {
            knownComponents.push({
              name: componentObj.name,
              project: componentObj.project
            });
          }
        }
        // store counts of each
        let countsObj = createCountsObj(results, projects);
        collection.insertOne(countsObj);
        await collection.insertMany(knownComponents);
      } else {
        //results[0].data.push({name: 'newProject Woo!', project: 'AND', lead: {key: 'asdf'}});
        const countsObj = createCountsObj(results, projects);
        const countsAreDifferent = !(await collection.findOne(countsObj));
        if (countsAreDifferent) {
          const differingProjects = diffCountObjects(countsObj,
                                                     await collection.findOne({'AND': {'$exists': true}}),
                                                     projects);
          let newComponents = [];
          for (const differingProject in differingProjects) {
            // remember, in = key
            let components = results[projects.indexOf(differingProject)].data;
            let componentSearchPromises = [];
            for (let componentObj of components) {
              // search for component in mongo then promise.all and
              componentSearchPromises.push(collection.findOne({
                name: componentObj.name,
                project: componentObj.project
              }));
            }
            const componentSearchResults = await Promise.all(componentSearchPromises);
            let i = 0;
            for (let searchResult of componentSearchResults) {
              if (searchResult === null) {
                newComponents.push(components[i]);
              }
              i+=1;
            }
          }
          let message = '*Found new component(s)*:\n';
          for (let componentObj of newComponents) {
            message += (`>${componentObj.lead.key} created new ${componentObj.project} component: \`${componentObj.name}\`\n`);
          }
          slackChannel(message);
          newComponents.map(function (componentObj) {
            return {
              name: componentObj.name,
              project: componentObj.project
            };
          });
          await collection.insertMany(newComponents);
          await collection.findOneAndUpdate({'AND': {'$exists': true}}, countsObj);
        }
      }
      console.log('done');
    }).catch(console.log);
  }
};

function createCountsObj(results, projects) {
  let countsObj = {};
  let i = 0;
  for (const project of projects) {
    countsObj[project] = results[i].data.length;
    i += 1;
  }
  return countsObj;
}

function diffCountObjects(newCounts, oldCounts, projects) {
  let differingProjects = {};
  for (const project of projects) {
    if (newCounts[project] !== oldCounts[project]) {
      differingProjects[project] = newCounts[project] - oldCounts[project];
      if (differingProjects[project] < 0) {
        throw new Error('new counts of components in project ' + project + ' less than old count');
      }
    }
  }
  return differingProjects;
}
