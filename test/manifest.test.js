const expect = require('chai').expect;
const nock = require('nock');

const Manifest = require('../src/manifest');
const response = require('./mocks/manifestResponse');
const expected_json = require('./mocks/manifestJSON');

const Image = require('../src/image');
const imageData = require('./mocks/imageResponse');
const expected_canvas = require('./mocks/canvasResponse');

const listResponse = require('./mocks/listResponse');

describe('Create Manifest test', () => {
	var manifest;
	  before(() => {
		  manifest = new Manifest(response.Item);
		  });
	  
	  it('Creates a manifest object', () => {
		  expect(manifest).to.be.an.instanceof(Manifest);
	  });
	  
	  it('Sets the manifest properties', () => {
        expect(manifest.id).to.equal('f1de5a8a-0ddf-11e8-ba89-0ed5f89f718b')
        expect(manifest.name).to.equal("Karen's ContentDM Highlights")
        expect(manifest.description).to.equal('Highlights from Denver Public Library')
        expect(manifest.images).to.be.an.instanceof(Array);
        expect(manifest.images.length).to.equal(5);
	  });
	  
	  it('Has functioning getters', () => {
        expect(manifest.getID()).to.equal('f1de5a8a-0ddf-11e8-ba89-0ed5f89f718b')
        expect(manifest.getName()).to.equal("Karen's ContentDM Highlights")
        expect(manifest.getDescription()).to.equal('Highlights from Denver Public Library')
        expect(manifest.getImages()).to.be.an.instanceof(Array);
        expect(manifest.getImages().length).to.equal(5);
        expect(manifest.getImages()[0].height).to.equal(5041);
        expect(manifest.getImages()[0].info_url).to.equal("https://cdm10010.contentdm.oclc.org/digital/iiif-info/coll16/391");
        expect(manifest.getImages()[0].label).to.equal("Tunnel No. 4, Cripple Creek Short Line");
        expect(manifest.getImages()[0].url).to.equal("https://cdm10010.contentdm.oclc.org/digital/iiif/coll16/391");
        expect(manifest.getImages()[0].width).to.equal(4089);
        
	  });
	  
	  it('Serializes as JSON', () => {
		  expect(JSON.stringify(manifest.serializeJSON())).to.equal(JSON.stringify(expected_json));
	  });
	  
	});

describe('Create Canvas test', () => {
	var canvas;
	  before(() => {
	    // Create an image object to use
		var image = { width: 5041,
			       label: 'A coasting party on the Cripple Creek Short Line',
			       info_url: 'https://cdm10010.contentdm.oclc.org/digital/iiif-info/coll16/390',
			       url: 'https://cdm10010.contentdm.oclc.org/digital/iiif/coll16/390',
			       height: 4069 };
		var index = 1;
		var manifestID = "f1de5a8a-0ddf-11e8-ba89-0ed5f89f718b";
		canvas = Manifest.getCanvas(image, index, manifestID);
	  });

	  it('Outputs canvas as JSON', () => {
		  expect(JSON.stringify(canvas)).to.equal(JSON.stringify(expected_canvas))
	  });
});

describe('Fetch Manifest test', () => {
  before(() => {
    // mock read AWS dynamo response
	var AWS = require('aws-sdk-mock');
	AWS.mock('DynamoDB.DocumentClient', 'get', function (params, callback){
			callback(null, response);		
	});  
  });

  it('Gets manifest by id', () => {
    return Manifest.fetchManifest('f1de5a8a-0ddf-11e8-ba89-0ed5f89f718b')
      .then(manifest => {
        //expect an Image object back
        expect(manifest).to.be.an.instanceof(Manifest);

        expect(manifest.getID()).to.equal('f1de5a8a-0ddf-11e8-ba89-0ed5f89f718b')
        expect(manifest.getName()).to.equal("Karen's ContentDM Highlights")
        expect(manifest.getDescription()).to.equal('Highlights from Denver Public Library')
        expect(manifest.getImages()).to.be.an.instanceof(Array);
        expect(manifest.getImages().length).to.equal(5);
        
      });
  });
});

describe('Search Manifest test', () => {
	  before(() => {
	    // mock list AWS dynamo response
		var AWS = require('aws-sdk-mock');
		AWS.mock('DynamoDB.DocumentClient', 'scan', function (params, callback){
			callback(null, listResponse);		
		});
	  });

	  it('lists manifests', () => {
	    return Manifest.search()
	      .then(manifests => {
	        //expect an array of back
	    	  expect(manifests).to.be.an.instanceof(Array);
	    	  expect(manifests[0].ManifestID).to.equal('0ee8ddf0-1261-11e8-93f6-c9888a314ce3')
	    	  expect(manifests[0].ManifestName).to.equal('Test to show Jason')
	      });
	  });
});

describe('Add Manifest test', () => {
	var image;
	  before(() => {
	    // mock create AWS dynamo response
		var AWS = require('aws-sdk-mock');
		AWS.mock('DynamoDB.DocumentClient', 'put', function (params, callback){
			callback(null, "123456");		
		});
		image = new Image(imageData);
	  });

	  it('Create a new manifest', () => {
	    return Manifest.create(image, 'name', 'description')
	      .then(id => {
	        //expect an id back
		  	expect(id).to.equal('123456')
	      });
	  });
});

describe('Update Manifest test', () => {
	var image;
	  before(() => {
	    // mock update AWS dynamo response
		var AWS = require('aws-sdk-mock');
		AWS.mock('DynamoDB.DocumentClient', 'update', function (params, callback){
			callback(null, "0ee8ddf0-1261-11e8-93f6-c9888a314ce3");		
		});
		image = new Image(imageData);
	  });

	  it('Update a manifest', () => {
	    return Manifest.update(image, '0ee8ddf0-1261-11e8-93f6-c9888a314ce3')
	      .then(id => {
	        //expect an id back
		  	expect(id).to.equal('0ee8ddf0-1261-11e8-93f6-c9888a314ce3')        
	      });
	  });
});
