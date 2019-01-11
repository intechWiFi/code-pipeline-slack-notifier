var request = require('request');

var SLACK_URL = process.env.SLACK_URL;
var SLACK_URL_DEV = process.env.SLACK_URL_DEV;
var PIPELINE_QA = process.env.PIPELINE_QA;
var PIPELINE_STAGE = process.env.PIPELINE_STAGE;
var PIPELINE_PROD = process.env.PIPELINE_PROD;
var DEPLOY_STAGE = process.env.DEPLOY_STAGE;
var DEPLOY_PROD = process.env.DEPLOY_PROD;
var SLACK_URL_USED;

exports.handler = (event, context, callback) => {
    if (event.detail.pipeline == PIPELINE_QA || event.detail.pipeline == PIPELINE_STAGE || event.detail.pipeline == PIPELINE_PROD) {
        SLACK_URL_USED=SLACK_URL;
        console.log('Using Main Slack hook URL' + SLACK_URL_USED);
    } else {
        SLACK_URL_USED=SLACK_URL_DEV;
        console.log('Using Dev Slack hook URL' + SLACK_URL_USED);
    }

    request(generateRequestDetails(event, SLACK_URL_USED), function (err, res, body) {
        if (res && (res.statusCode === 200 || res.statusCode === 201)) {
            callback(null, 'Done');
        }
        else {
            console.log('Error: ' + err + ' ' + res + ' ' + body);
            callback('Error');
        }
        SLACK_URL_USED = '';
    });
};

function generateRequestDetails(event, url) {
    //if (event['detail-type'] != "CodePipeline Pipeline Execution State Change")
    //    throw new Error ("Unsupported detail type: " + event['detail-type']);
	
	var mpsSystem;
    var color;
    var text;
    var pipelineState = event.detail.state;

	if (event['detail-type'] == "CodePipeline Stage Execution State Change") {
        if (event.detail.stage == DEPLOY_STAGE) {
            mpsSystem = "STAGING";
            text = "The deployment for " + mpsSystem + " ";
        }
        else if (event.detail.stage == DEPLOY_PROD) {
            mpsSystem = "PROD";
            text = "The deployment for " + mpsSystem + " ";
        }
        else {
            text = "CodePipeline " + event.detail.pipeline + " ";
        }
    }
    else if (event.detail.pipeline == PIPELINE_QA) {
        mpsSystem = "QA";
        text = "The deployment for " + mpsSystem + " ";
    }
    else {
        text = "CodePipeline " + event.detail.pipeline + " ";
    }


    if (pipelineState == 'STARTED') {
        color = "#888888";
        text += "has started."
    }
    else if (pipelineState == 'SUCCEEDED') {
        color = "good";
        text += "has *succeeded*.";
    }
    else if (pipelineState == 'FAILED') {
        color = "danger";
        text += "has *failed*.";
    }
    else {
        color = "warning";
        text += "has " + pipelineState + " (This is an unknown state to the Slack notifier.)";
    }

    console.log('Posting following message to Slack: ' + text);

    var options = {
        url: url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        json: {
            attachments: [ {text: text, color: color}]
        }
    };

    return options;
}

exports.__test__ = {
    generateRequestDetails: generateRequestDetails
};