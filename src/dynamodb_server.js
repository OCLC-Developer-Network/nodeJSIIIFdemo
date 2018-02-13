"use strict";
const express = require('express');
const app = express();
const uuidv1 = require('uuid/v1');

const dynamodb = require('aws-sdk/clients/dynamodb');

const axios = require("axios");
const Image = require("./image.js")
const Manifest = require("./manifest.js")

function getInfoURL(requestURL) {
		const URL = require('url');
		const objectURL = URL.parse(requestURL);
		const pathParts = objectURL.pathname.split("/");
		
		const collectionID = pathParts[3];
		const objectID = pathParts[5];
		const url = 'https://sandbox.contentdm.oclc.org/digital/iiif-info/' + collectionID + '/' + objectID;
		return url;
}

function getImageServiceURL(requestURL) {
	const URL = require('url');
	const objectURL = URL.parse(requestURL);
	const pathParts = objectURL.pathname.split("/");
	
	const collectionID = pathParts[3];
	const objectID = pathParts[5];
	const url = 'https://sandbox.contentdm.oclc.org/digital/iiif/' + collectionID + '/' + objectID;
	return url;
}

function getCanvas(image, index, manifestID) {
    var canvas = {
        "height": image.height,
        "images": [
          {
            "motivation": "sc:painting",
            "on": "https://localhost:8000/manifest/" + manifestID + "/data/canvas/c" + index,
            "resource": {
              "format": "image/jpeg",
              "service": {
                "profile": "http://iiif.io/api/image/2/level1.json",
                "@context": "http://iiif.io/api/image/2/context.json",
                "@id": image.url
              },
              "height": image.height,
              "width": image.width,
              "@id": image.url + "/full/full/0/default.jpg",
              "@type": "dctypes:Image"
            },
            "@id": "https://localhost:8000/manifest/" + manifestID + "/data/annotation/a" + index,
            "@type": "oa:Annotation"
          }
        ],
        "label": image.label,
        "width": image.width,
        "@type": "sc:Canvas",
        "@id": "https://localhost:8000/manifest/" + manifestID + "/data/canvas/c" + index
      }
    return canvas;
}

const dynamodb_doc = new dynamodb.DocumentClient({'region': 'us-east-1'});
 
const port = process.env.PORT || 8000;
const baseUrl = `http://localhost:${port}`;
 
 
const bodyParser = require('body-parser');

const isLambda = !!(process.env.LAMBDA_TASK_ROOT || false);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', 'views');
 
 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
 
app.get('/', (req, res) => {   
   if (isLambda) {
	   var action = "production/manifest";
   } else {
	   var action = "manifest";
   }
   
   var params = {
		    TableName: "Manifest",
		    ProjectionExpression: "ManifestID, ManifestName"
		};
   
   dynamodb_doc.scan(params, function(err, data) {
	   if (err) {
		   console.log("Error", err);
	   } else {
		   // show the collection info
		   res.render('index', {action: action, manifests: data.Items});
	   }
   });
   
});

app.post('/manifest', (req, res) => {
	if (req.body.id == 'new'){
		if (isLambda) {
		   var action = "production/create-manifest";
		} else {
		   var action = "create-manifest";
		}
		res.render('create-manifest', {action: action, url: req.body.url});
	} else {
		var url = getInfoURL(req.body.url);
		axios.get(url)
			.then(response => {
		    	var image = new Image(response.data);
		    	var id = req.body.id;
				var params = {
					    TableName: "Manifest",
					    Key: {ManifestID: id},
					    UpdateExpression: "SET #attrName = list_append(#attrName, :i)",
					    ExpressionAttributeNames: {"#attrName" : "Images"},
					    ExpressionAttributeValues:{
					        ":i": [{label: image.getLabel(), url: image.getImageID(), info_url: image.getID()}]
					    },
					    ReturnValues:"UPDATED_NEW"
					};
				dynamodb_doc.update(params, function(err, data) {
				    if (err) {
				        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
				    } else {
				    	res.redirect('/manifest/' + id);
				    }
				});
		    })
	    	.catch (error => {
	    		console.log(error);
	    })
	}
});

app.post('/create-manifest', (req, res) => {	
	var url = getInfoURL(req.body.url);
	var name = req.body.name;
	var description = req.body.description;
	
	axios.get(url)
		.then(response => {
	    	var image = new Image(response.data);
	    	var id = uuidv1();
	    	
	    	//create JSON with the collection name and the first url
	    	var collection = {
	    			  TableName: 'Manifest',
	    			  Item: {
	    			    'ManifestID': id,
	    			    'ManifestName': name,
	        			'Description': description,	
	    			    'Images': [
	    			    	{
	    			    		'label': image.getLabel(),
	    			    		'url': image.getImageID(),
	    			    		'id': image.getID()
	    			    	}
	    			    	]
	    			    }
	    			};
	    	dynamodb_doc.put(collection, function(err, data) {
	    		  if (err) {
	    			console.log("Error", err);
	    		  } else {
	    			  res.redirect('/manifest/' + id);
	    		  }
	    	});
	    	
	    })
		.catch (error => {
			console.log(error);
	})
});

app.get('/manifest/:id', (req, res) => {
	var id = req.params['id'];
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
		var manifest = new Manifest(data.Item);
	    res.render('display-manifest', {name: manifest.getName(), description: manifest.getDescription(), images: manifest.getImages()});
	  }
	});
});

app.get('/manifest/:id/view', (req, res) => {
	var id = req.params['id'];
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
		var manifest = new Manifest(data.Item);  
		res.render('display-manifest-images', {name: manifest.getName(), description: manifest.getDescription(), images: manifest.getImages()});		  
	  }
	});
});

app.get('/manifest/:id/data', (req, res) => {
	// render the manifest itself
	var id = req.params['id'];
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
		var manifest = new Manifest(data.Item); 
	    res.setHeader('Content-Type', 'application/json');
	    var canvases = manifest.getImages().map((image, index) => getCanvas(image, index, manifest.getID()));;
	    var canvas_ids = manifest.getImages().map((image, index) => {return "https://localhost:8000/manifest/" + manifest.getID() + "/data/canvas/c" + index});
	    var json = {
	    		"label": manifest.getName(),
	    		"@type": "sc:Manifest",
	    		"sequences": [
	    			{
		    			"canvases": canvases,
		    			"label": manifest.getName(),
		    			"@type": "sc:Sequence",
		    			"@id": "https://localhost:8000/manifest/" + manifest.getID() + "/data/sequence/s0"
	    			}
	    		],
	    		"structures": [
	    			{
	    				"label": manifest.getName(),
	    				"canvases": canvas_ids,
	    				"@id": "https://localhost:8000/manifest/" + manifest.getID() + "/data/range/r0"
	    			}
	    			],
				"@id": "https://localhost:8000/manifest/" + manifest.getID() + "/data",
				"@context": "http://iiif.io/api/presentation/2/context.json"
	    }
	    res.send(JSON.stringify(json));
	    //ejs.render();
	  }
	});
});

//Server
module.exports = app;