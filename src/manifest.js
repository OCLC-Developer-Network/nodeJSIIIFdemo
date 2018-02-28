const dynamodb = require('aws-sdk/clients/dynamodb');
const dynamodb_doc = new dynamodb.DocumentClient({'region': 'us-east-1'});
const uuidv1 = require('uuid/v1');

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
    
    serializeJSON(){
    	var canvases = this.images.map((image, index) => Manifest.getCanvas(image, index, this.id));
    	var canvas_ids = this.images.map((image, index) => {return "https://localhost:8000/manifest/" + this.id + "/data/canvas/c" + index});
    	var json = {
    		"label": this.name,
    		"@type": "sc:Manifest",
    		"sequences": [
    			{
	    			"canvases": canvases,
	    			"label": this.name,
	    			"@type": "sc:Sequence",
	    			"@id": "https://localhost:8000/manifest/" + this.id + "/data/sequence/s0"
    			}
    		],
    		"structures": [
    			{
    				"label": this.name,
    				"canvases": canvas_ids,
    				"@id": "https://localhost:8000/manifest/" + this.id + "/data/range/r0"
    			}
    			],
	    	"viewingHint": "individuals",	
			"@id": "https://localhost:8000/manifest/" + this.id + "/data",
			"@context": "http://iiif.io/api/presentation/2/context.json"
    	}
    	return json;
    }
    
    static getCanvas(image, index, manifestID) {
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
    
    static search(){
    	   var params = {
    			    TableName: "Manifest",
    			    ProjectionExpression: "ManifestID, ManifestName"
    			};
    	   return new Promise(function (resolve, reject) {
	    	   dynamodb_doc.scan(params, function(err, data) {
	    		   if (err) {
	    			   reject(error);
	    		   } else {
	    			   resolve(data.Items);
	    		   }
	    	   });
       		});
    }
    
    static fetchManifest(id){
    	//retrieve the collection
    	var params = {
    	 TableName: 'Manifest',
    	 Key: {ManifestID: id}
    	};
    	return new Promise(function (resolve, reject) {
    	
	    	// Call DynamoDB to read the item from the table
	    	dynamodb_doc.get(params, function(err, data) {
	    	  if (err) {
	    		  reject(error);
	    	  } else {
	    		// show the collection info
	    		  resolve(new Manifest(data.Item));
	    	  }
	    	});
    	});
    	
    }
    
    static create(image, name, description){
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
    	return new Promise(function (resolve, reject) {
        	dynamodb_doc.put(collection, function(err, data) {
      		  if (err) {
      			  reject(error);
      		  } else {
      			resolve(id);
      		  }
        	});
    	});
    }
    
    static update(image, id){    
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
		return new Promise(function (resolve, reject) {
			dynamodb_doc.update(params, function(err, data) {
			    if (err) {
			    	reject(error);
			    } else {
			    	resolve(id);
			    }
			});
    	});
    }
};