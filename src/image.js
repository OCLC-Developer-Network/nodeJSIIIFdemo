const axios = require("axios");
module.exports = class Image {
    constructor(data) {
	    this.manifest = data;
    	this.id = this.manifest['@id'].substring(0, this.manifest['@id'].lastIndexOf('/'));
		this.imageID = this.manifest.sequences[0].canvases[0].images[0].resource.service['@id'];
		this.metadata = this.manifest.metadata;
		this.label = this.manifest.label;
		this.height = this.manifest.sequences[0].canvases[0].height;
		this.width = this.manifest.sequences[0].canvases[0].width;
    }
    
    getID(){
    	return this.id;
    }
    
    getLabel(){
    	return this.label;
    }

    getImageID(){
    	return this.imageID;
    }
    
    getMetadata(){
    	return this.metadata;
    }
    
    getHeight(){
    	return this.height;
    }
    
    getWidth(){
    	return this.width;
    }
    
    static fetchImage(url) {
        return new Promise(function (resolve, reject) {
            axios.get(url)
          		.then(response => {
          	    	resolve(new Image(response.data));	    	
          	    })
          		.catch (error => {
          			reject(error);
          		});
        });
    }
};
