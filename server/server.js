const express = require('express');
require('isomorphic-fetch');
const app = express();
const port = 3001;
const DARK_SKY_KEY = "<your dark sky key here>";
const GOOGLE_PLACES_KEY = "<your google places key here>";

const DARK_SKY_URL_PREFIX = "https://api.darksky.net/forecast/"
      + DARK_SKY_KEY + "/";

const GOOGLE_PLACES_PREFIX = "https://maps.googleapis.com/maps/api/place/autocomplete/json?key="
      + GOOGLE_PLACES_KEY;

const GOOGLE_PLACE_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json?key="
      + GOOGLE_PLACES_KEY;

// https://api.darksky.net/forecast/[key]/[latitude],[longitude]
//https://maps.googleapis.com/maps/api/place/autocomplete/xml?input=Amoeba&types=establishment&location=37.76999,-122.44696&radius=500&key=YOUR_API_KEY

app.get("/getWeather", function(req, res) {
    var latitude = req.query.latitude;
    var longitude = req.query.longitude;
    var darkSkyURL = DARK_SKY_URL_PREFIX + latitude + "," + longitude + "?units=us";
    fetch(darkSkyURL).then(function(resp) {
        if(resp.status != 200) {
            console.log(resp.statusText);
            return {'message': 'Bad response from Dark Sky server'};
        } else {
            return resp.json();            
        }
    }).then(function(data) {
        res.json(data);        
    });
});

app.get("/getLatLong", function(req, res) {
    //return the lat and long based off of place_id
    var placeID = req.query.input;
    var placeDetailURL = GOOGLE_PLACE_DETAILS + "&placeid=" + placeID;
    fetch(placeDetailURL).then(function(resp) {
        if(resp.status != 200) {
            console.log(resp.statusText);
            return {'message': 'Bad response from Google Place Detail server'};
        } else {
            return resp.json();            
        }
    }).then(function(data) {
        res.json(data); 
    });
});

// Note: If you do not supply the location and radius, the API will attempt to detect the user's location from their IP address, and will bias the results to that location. If you would prefer to have no location bias, set the location to '0,0' and radius to '20000000' (20 thousand kilometers), to encompass the entire world.
app.get("/getCities", function(req, res) {
    var input = req.query.input;
    var googlePlacesURL = GOOGLE_PLACES_PREFIX + "&types=(cities)&location=0,0&radius=20000000&input=" + input;

    fetch(googlePlacesURL)
        .then(function(resp) {
            if(resp.status != 200) {
                console.log(resp.statusText);
                return {'message': 'Bad response from Google Places server'};
            } else {
                return resp.json();
            }
        }).then(function(data){
            res.json(data);
        });
});


app.listen(port, function() {
    console.log("Server listening on port " + port); 
});
