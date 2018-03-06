const expect = require('chai').expect;
const nock = require('nock');

const Image = require('../src/image');
const response = require('./mocks/imageResponse');

describe('Create Image test', () => {
	var image;
	  before(() => {
		  image = new Image(response);
		  });
	  
	  it('Creates an image object', () => {
		  expect(image).to.be.an.instanceof(Image);
	  });
	  
	  it('Sets the image properties', () => {
        expect(image.id).to.equal('https://cdm10010.contentdm.oclc.org/digital/iiif-info/coll16/390')
        expect(image.label).to.equal('A coasting party on the Cripple Creek Short Line')
        expect(image.imageID).to.equal('https://cdm10010.contentdm.oclc.org/digital/iiif/coll16/390')
        expect(image.height).to.equal(4069)
        expect(image.width).to.equal(5023)
        expect(image.metadata).to.be.an.instanceof(Array);
        expect(image.metadata[0]['label']).to.equal('Call Number')
        expect(image.metadata[0]['value']).to.equal('MCC-94')
	  });
	  
	  it('Has functioning getters', () => {
        expect(image.getID()).to.equal('https://cdm10010.contentdm.oclc.org/digital/iiif-info/coll16/390')
        expect(image.getLabel()).to.equal('A coasting party on the Cripple Creek Short Line')
        expect(image.getImageID()).to.equal('https://cdm10010.contentdm.oclc.org/digital/iiif/coll16/390')
        expect(image.getHeight()).to.equal(4069)
        expect(image.getWidth()).to.equal(5023)
        expect(image.getMetadata()).to.be.an.instanceof(Array);
        
        var metadata = image.getMetadata();
        expect(metadata[0]['label']).to.equal('Call Number')
        expect(metadata[0]['value']).to.equal('MCC-94')
	  });
	  
	});

describe('Fetch Image tests', () => {
  beforeEach(() => {
    nock('https://sandbox.contentdm.oclc.org')
      .get('/digital/iiif-info/coll16/390')
      .reply(200, response);
  });

  it('Get an image by url', () => {
    return Image.fetchImage('https://sandbox.contentdm.oclc.org/digital/iiif-info/coll16/390')
      .then(response => {
        //expect an Image object back
        expect(response).to.be.an.instanceof(Image);

        //Test result of ID, Label, ImageID, Height, Width, and Metadata for the image
        expect(response.getID()).to.equal('https://cdm10010.contentdm.oclc.org/digital/iiif-info/coll16/390')
        expect(response.getLabel()).to.equal('A coasting party on the Cripple Creek Short Line')
        expect(response.getImageID()).to.equal('https://cdm10010.contentdm.oclc.org/digital/iiif/coll16/390')
        expect(response.getHeight()).to.equal(4069)
        expect(response.getWidth()).to.equal(5023)
        expect(response.getMetadata()).to.be.an.instanceof(Array);
        
        var metadata = response.getMetadata();
        expect(metadata[0]['label']).to.equal('Call Number')
        expect(metadata[0]['value']).to.equal('MCC-94')
        
      });
  });
});
