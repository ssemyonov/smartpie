'use strict';

const uuidv4 = require('uuid/v4');

let state = "OFF";

const USER_DEVICES = [
  {
    endpointId: "radio-pulse-edm",
    description: "Pulse EDM Radio played from Raspberry Pi",
    displayCategories: ["SWITCH"],
    friendlyName: "Pulse EDM",
    manufacturerName: "x13",
    cookie: {},
    capabilities: [
      {
        type: "AlexaInterface",
        interface: "Alexa.EndpointHealth",
        version: "3",
        properties: {
          supported: [
            {
              name: "connectivity"
            }
          ],
          proactivelyReported: false,
          retrievable: true
        }
      },
      {
        type: "AlexaInterface",
        interface: "Alexa.PowerController",
        version: "3",
        properties: {
          supported: [
            {
              name: "powerState"
            }
          ],
          proactivelyReported: false,
          retrievable: true
        }
      },
    ]
  }
];

function log(title, msg) {
  console.log(`[${title}] ${msg}`);
}

function handleDiscovery(request, callback) {
  log('DEBUG', `Discovery Request: ${JSON.stringify(request)}`);

  const response = {
    event: {
      header: {
        messageId: uuidv4(),
        name: 'Discover.Response',
        namespace: 'Alexa.Discovery',
        payloadVersion: '3',
      },
      payload: {
        endpoints: USER_DEVICES,
      }
    }
  };

  log('DEBUG', `Discovery Response: ${JSON.stringify(response)}`);

  callback(null, response);
}

function handleReportState(endpoint, callback) {
  log('DEBUG', `ReportState for endpoint: ${JSON.stringify(endpoint)}`);

  const response = {
    event: {
      header: {
        messageId: uuidv4(),
        name: 'StateReport',
        namespace: 'Alexa',
        payloadVersion: '3',
      },
      endpoint: endpoint,
      payload: {}
    },
    context: {
      properties: [
        {
          namespace: "Alexa.EndpointHealth",
          name: "connectivity",
          value: {
            value: "OK"
          },
          timeOfSample: new Date(),
          uncertaintyInMilliseconds: 200
        },
        {
          namespace: "Alexa.PowerController",
          name: "powerState",
          value: state,
          timeOfSample: new Date(),
          uncertaintyInMilliseconds: 500
        }
      ]
    }
  };

  log('DEBUG', `ReportState Response: ${JSON.stringify(response)}`);

  callback(null, response);
}

function handlePowerController(directive, callback) {
  log('DEBUG', `PowerController Request: ${JSON.stringify(directive)}`);

  if (state == "OFF")
    state = "ON";
  else 
    state = "OFF";

  const response = {
    event: {
      header: {
        messageId: uuidv4(),
        name: 'Response',
        namespace: 'Alexa',
        payloadVersion: '3',
      },
      payload: {
      },
      endpoint: directive.endpoint,
      context: {
        properties: [
          {
            namespace: "Alexa.EndpointHealth",
            name: "connectivity",
            value: {
              value: "OK"
            },
            timeOfSample: new Date(),
            uncertaintyInMilliseconds: 200
          },
          {
            namespace: "Alexa.PowerController",
            name: "powerState",
            value: state,
            timeOfSample: new Date(),
            uncertaintyInMilliseconds: 500
          }
        ]
      }
    }
  };

  log('DEBUG', `PowerController Response: ${JSON.stringify(response)}`);

  callback(null, response);
}

exports.handler = (request, context, callback) => {
  log('DEBUG', `Handler request: ${JSON.stringify(request)}`);
  const namespace = request.directive.header.namespace;
  const name = request.directive.header.name;

  switch (namespace) {
    case 'Alexa.Discovery':
      handleDiscovery(request.directive, callback);
      break;

    case 'Alexa.PowerController':
      handlePowerController(request.directive, callback);
      break;

    case 'Alexa':
      switch (name) {
        case 'ReportState':
          handleReportState(request.directive.endpoint, callback);
          break;
        default: {
          const errorMessage = `No supported name: ${name}`;
          log('ERROR', errorMessage);
          callback(new Error(errorMessage));
        }
      }
      break;

    default: {
      const errorMessage = `No supported namespace: ${namespace}`;
      log('ERROR', errorMessage);
      callback(new Error(errorMessage));
    }
  }
};
