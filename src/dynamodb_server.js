"use strict";
const express = require('express');
const app = express();

var dynamodb = require('aws-sdk/clients/dynamodb');

const dynamodb_doc = new dynamodb.DocumentClient({'region': 'us-east-1'});
 
const port = process.env.PORT || 8000;
const baseUrl = `http://localhost:${port}`;
 
 
const bodyParser = require('body-parser');

const isLambda = !!(process.env.LAMBDA_TASK_ROOT || false);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', 'views');
 
 
app.use(bodyParser.urlencoded({ extended: true }));
 
app.get('/', (req, res) => {   
   if (isLambda) {
	   var action = "production/collection";
   } else {
	   var action = "collection";
   }
   
   var params = {
		    TableName: "Manifest",
		    ProjectionExpression: "ManifestID, ManifestName"
		};
   
   dynamodb_doc.scan(params, function(err, data) {
	   if (err) {
		   console.log("Error", err);
	   } else {
		   console.log(data.Items);
		   // show the collection info
		   res.render('index', {action: action, manifests: data.Items});
	   }
   });
   
});

app.get('/collection', (req, res) => {
	if (req.query.id !== 'new'){
		res.redirect('/collection/' + req.query.id + '?url=' + req.query.url);
	} else {
		if (isLambda) {
		   var action = "production/collection";
		} else {
		   var action = "collection";
		}
		res.render('create-manifest', {action: action, url: req.query.url});
	}
});

app.post('/collection', (req, res) => {
	const URL = require('url');
	const objectURL = URL.parse(req.body.url);
	const pathParts = objectURL.pathname.split("/");
	
	const collectionID = pathParts[3];
	const objectID = pathParts[5];
	const url = 'https://sandbox.contentdm.oclc.org/digital/iiif-info/' + collectionID + '/' + objectID;
	
	var name = req.body.name;
	var description = req.body.description;
	//create JSON with the collection name and the first url
//	var collection = {
//			  TableName: 'Manifest',
//			  Item: {
//			    'ManifestID': VALUE,
//			    'Name': name,
//			    'Images': [
//			    	{
//			    		'lable': label,
//			    		'url': url
//			    	}
//			    	]
//			    }
//			  }
//			};
	dynamodb_doc.put(collection, function(err, data) {
		  if (err) {
			console.log("Error", err);
		  } else {
			  // show the collection created
		    console.log("Success", data);
		  }
	});
});

app.get('/collection/:id', (req, res) => {
	var id = parseInt(req.params['id']);
	//retrieve the collection
	var params = {
	 TableName: 'Manifest',
	 Key: {ManifestID: id}
	};

	// Call DynamoDB to read the item from the table
	dynamodb_doc.get(params, function(err, data) {
	  if (err) {
	    console.log("Error", err);
	  } else {
		// show the collection info
	    res.render('display-manifest', {name: data.Item.ManifestName, description: data.Item.Description, images: data.Item.Images});
	  }
	});
});

app.put('/collection/{id}', (req, res) => {
	const URL = require('url');
	const objectURL = URL.parse(req.body.url);
	const pathParts = objectURL.pathname.split("/");
	
	const collectionID = pathParts[3];
	const objectID = pathParts[5];
	const url = 'https://sandbox.contentdm.oclc.org/digital/iiif-info/' + collectionID + '/' + objectID;
	
	//update JSON with the collection name and the new url
	

	dynamodb_doc.put(params, function(err, data) {
	  if (err) {
	    console.log("Error", err);
	  } else {
	    console.log("Success", data);
	  }
	});
});

//Server
module.exports = app;