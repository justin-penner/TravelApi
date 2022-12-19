const express = require('express');
const app = express();
const { covidHistory } = require('./covidApi.js');
const { getPlacesOfInterest } = require('./placesApi.js');
const user = require('../controllers/userController.js');
var bodyParser = require('body-parser');
const { reverseGeoCoding, geoCoding } = require('./geocodeApi.js');
const { getHotels } = require('./hotelApi.js');
const { getWeatherForecast } = require('./weatherApi.js');
const res = require('express/lib/response.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//router for User
app.get('/index', user.index);
app.get('/register', user.register);
app.post('/create', user.create);
app.post('/login', user.login);
app.get('/login', user.loginPage);
app.get('/update-email', user.updatePageEmail);
app.post('/update-email', user.updateEmail);
app.get('/update-password', user.updatePagePassword);
app.post('/update-password', user.updatePassword);
app.get('/user', user.info);
app.get('/logout', user.logout);
app.post('/delete', user.delete);
app.get('/delete', user.index);







const {isCityInCountry} = require('./country.js')

// Travelence
app.get('/search', async function(request, result) {

	// check for key
	if(await checkApiKey(request, result, request.query.apikey)) {

		// check for city and country
		if(request.query.city && request.query.country) {

			// check if city is in country
			if(await isCityInCountry(request.query.city, request.query.country)) {
				// geoCode API
				let coordinates = await geoCoding(request);

				// define variables
				let covid, weather, placesOfInterest, hotels;

				// covid API
				if(!request.query.options || request.query.options.toLowerCase().includes("covid")) covid = await covidHistory(request);

				// weather API
				if(!request.query.options || request.query.options.toLowerCase().includes("weather") ) weather = await getWeatherForecast(request, coordinates);

				// places API
				if(!request.query.options || request.query.options.toLowerCase().includes("places")) {
					placesOfInterest = await getPlacesOfInterest(request, coordinates);

					placesOfInterest = placesOfInterest.sort(sortByProperty("rating"));
					if(placesOfInterest.length > 10) placesOfInterest.length = 10;

					for(let index = 0; index < 10; index++) {

						placesOfInterest[index]["address"] = await reverseGeoCoding(request, placesOfInterest[index].coordinates);

					}
				}

				// hotel API
				if(!request.query.options || request.query.options.toLowerCase().includes("hotels")) hotels = await getHotels(request, result);




				// get response
				const response = require("../json/response.json");

				if(!request.query.options) {

					response["covid"] = covid;
					response["weather"] = weather;
					response["places"] = placesOfInterest;
					response["hotels"] = hotels;

				}
				else {
					
					if(request.query.options.includes("covid")) response["covid"] = covid;
					if(request.query.options.includes("weather")) response["weather"] = weather;
					if(request.query.options.includes("places")) response["places"] = placesOfInterest;
					if(request.query.options.includes("hotels")) response["hotels"] = hotels;

				}

				result.send(response);
			}
			else {
				result.send("City is not in country")
			}

			

		}	
		else {
			result.send("Missing city or / and country");
		}

	}
	else {
		result.send("Invalid key");
	}


});



function sortByProperty(property){  
   return function(a,b){  
      if(a[property] > b[property])  
         return -1;  
      else if(a[property] < b[property])  
         return 1;  
  
      return 0;  
   }  
}















/* Proof of concept and endpoints for used API's */


//router for CovidApi
app.get('/covid', async function (req, res) {
	if (await checkApiKey(req, res, req.query.apikey)) {
		res.status(200).send(await covidHistory(req, res));
	} else {
		res.status(400).send({ error: 'Invalid API-Key' });
	}
});

//router for HotelApi
app.get('/hotels', async function (req, res) {
	if (await checkApiKey(req, res, req.query.apikey)) {
		getHotels(req, res);
	} else {
		res.status(400).send({ error: 'Invalid API-Key' });
	}
});

//router for SightseeingApi
app.get('/poi', async function (req, res) {
	if (await checkApiKey(req, res, req.query.apikey)) {
		res.send(await getPlacesOfInterest(req, res));
	} else {
		res.status(400).send({ error: 'Invalid API-Key' });
	}
});

// 48.864716, 2.349014 for Paris

app.get('/reverseGeoCode', async function (req, res) {
	if (await checkApiKey(req, res, req.query.apikey)) {
		res.send(await reverseGeoCoding(req));
	} else {
		res.status(400).send({ error: 'Invalid API-Key' });
	}
});

app.get('/geoCode', async function (req, res) {
	if (await checkApiKey(req, res, req.query.apikey)) {
		res.send(await geoCoding(req));
	} else {
		res.status(400).send({ error: 'Invalid API-Key' });
	}
});
//router for WeatherApi
app.get('/weather', async function (req, res) {
	if (await checkApiKey(req, res, req.query.apikey)) {
		res.send(await getWeatherForecast(req, res));
	} else {
		res.status(400).send({ error: 'Invalid API-Key' });
	}
});







//function to check if Api Key does exist
async function checkApiKey(req, res, apikey) {
	let boolean = false;
	let apikeys = await user.getAllApiKeys(req, res);
	await apikeys.forEach((element) => {
		if (element.apikey == apikey) {
			boolean = true;
		}
	});
	return boolean;
}

app.listen(3000);
