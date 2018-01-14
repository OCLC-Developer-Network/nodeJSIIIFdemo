"use strict";
const express = require('express');
const app = express();
const axios = require("axios");
class Image {
    constructor(data) {
	    this.manifest = data;
		this.imageID = this.manifest.sequences[0].canvases[0].images[0].resource.service['@id'];
		this.metadata = this.manifest.metadata;
    }

    getImageID(){
    	return this.imageID;
    }
    
    getMetadata(){
    	return this.metadata;
    }
}
 
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
	   var action = "production/submit";
   } else {
		 var action = "submit";
   }
   
   res.render('index', {action: action});
});
 
app.post('/submit', (req, res) => {
	const URL = require('url');
	const objectURL = URL.parse(req.body.url);
	const pathParts = objectURL.pathname.split("/");
	
	const collectionID = pathParts[3];
	const objectID = pathParts[5];
	const url = 'https://sandbox.contentdm.oclc.org/digital/iiif-info/' + collectionID + '/' + objectID;
	axios.get(url)
		.then(response => {
	    	var image = new Image(response.data);
	    	res.render('display-image', { metadata: image.getMetadata(), imageID: image.getImageID() });
	    })
    	.catch (error => {
    		console.log(error);
    	})
});

//Server
module.exports = app;