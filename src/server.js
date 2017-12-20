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
    static async getImage(collectionID, objectID) {
    	const url = 'https://sandbox.contentdm.oclc.org/digital/iiif-info/' + collectionID + '/' + objectID;
		  try {
		    const response = await axios.get(url);
		    const data = await response.data;
		    return await new Image(data);
		  } catch (error) {
		    console.log(error);
		  }
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

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', 'views');
 
 
app.use(bodyParser.urlencoded({ extended: true }));
 
app.get('/', (req, res) => {
   res.render('index');
});
 
app.post('/submit', async (req, res) => {
	const image = await Image.getImage(req.body.collectionID, req.body.objectID);
    res.render('display-image', { metadata: image.getMetadata(), imageID: image.getImageID() });
});

//Server
app.listen(port, () => {
   console.log(`Listening on: http://localhost:${port}`);
});