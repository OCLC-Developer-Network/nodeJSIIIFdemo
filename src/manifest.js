module.exports = class Manifest {
    constructor(data) {
    	this.id = data.ManifestID;
    	this.name = data.ManifestName;
    	this.description = data.Description;
    	this.images = data.Images;
    }
    
    getID() {
    	return this.id;
    }
    
    getName() {
    	return this.name;
    }
    
    getDescription() {
    	return this.description;
    }
    
    getImages() {
    	return this.images;
    }
};