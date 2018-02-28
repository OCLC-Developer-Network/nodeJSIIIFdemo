"use strict";
const express = require('express');
const app = express();

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
   
   Manifest.search()
   	.then(manifests => {
   		res.render('index', {action: action, manifests: manifests});
   	})
   	.catch(error => {
   		console.log(error);
   	})

   
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
		Image.fetchImage(url)
			.then(image => {
				var id = req.body.id;
				Manifest.update(image, id)
				.then(id => {
					res.redirect('/manifest/' + id);
				})
			.catch (error => {
					console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
			})
				
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
	
	Image.fetchImage(url)
		.then(image => {
			Manifest.create(image, name, description)
				.then(id => {
					res.redirect('/manifest/' + id);
				})
				.catch (error => {
					console.log(error);
				})
		})
		.catch (error => {
			console.log(error);
	})
});

app.get('/manifest/:id', (req, res) => {
	var id = req.params['id'];
	Manifest.fetchManifest(id)
		.then(manifest => {
			res.render('display-manifest', {name: manifest.getName(), description: manifest.getDescription(), images: manifest.getImages()});
		})
		.catch (error => {
			console.log(error);
		})
});

app.get('/manifest/:id/view', (req, res) => {
	var id = req.params['id'];
	Manifest.fetchManifest(id)
		.then(manifest => {
			res.render('display-manifest-images', {name: manifest.getName(), description: manifest.getDescription(), images: manifest.getImages()});
		})
		.catch (error => {
			console.log(error);
		})		
});

app.get('/manifest/:id/data', (req, res) => {
	// render the manifest itself
	var id = req.params['id'];
	
	Manifest.fetchManifest(id)
		.then(manifest => {
		    res.setHeader('Content-Type', 'application/json');
		    var json = manifest.serializeJSON();
		    res.send(JSON.stringify(json));
		})
		.catch (error => {
			console.log(error);
		})	
});

app.get('/image', (req, res) => {
	var url = getInfoURL(req.query.url);
	Image.fetchImage(url)
		.then(image => {
			res.render('display-image', { metadata: image.getMetadata(), imageID: image.getImageID() });
		})
		.catch (error => {
			console.log(error);
	})
});

//Server
module.exports = app;