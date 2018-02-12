module.exports = class Image {
    constructor(data) {
	    this.manifest = data;
    	this.id = this.manifest['@id'];
		this.imageID = this.manifest.sequences[0].canvases[0].images[0].resource.service['@id'];
		this.metadata = this.manifest.metadata;
		this.label = this.manifest.label;
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
};
