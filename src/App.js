import React, { Component } from 'react';
import logo from './sunny.svg';
import Autocomplete from 'react-md/lib/Autocompletes';
import Button from 'react-md/lib/Buttons/Button';
import Card from 'react-md/lib/Cards/Card';
import CardTitle from 'react-md/lib/Cards/CardTitle';
import CardText from 'react-md/lib/Cards/CardText';
import CircularProgress from 'react-md/lib/Progress/CircularProgress';
import {Helmet} from "react-helmet";
import List from 'react-md/lib/Lists/List';
import ListItem from 'react-md/lib/Lists/ListItem';
import './App.css';

var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

class FutureForecast extends Component {
    render() {
        var dailyMinMax = this.props.dailyData.map((data, index) => {
            if(!index) {
                return "";
            } else {
                var date = new Date(data.time * 1000);                
                return <ListItem id={daysOfWeek[date.getDay()]}
                                 primaryText={daysOfWeek[date.getDay()]}
                                 secondaryText={"Max:" + data.temperatureMax  + "----Min:" + data.temperatureMin} />
            }
        });

        return(
            <Card className="md-cell--middle">
                <CardTitle title="7 day forecast"/>
                <CardText>
                    <div className="md-text-left md-display-1 weather-card-pad">
                        <List ordered>
                            {dailyMinMax} 
                        </List>
                    </div>
                </CardText>
            </Card>
        )
    }
}

class WeatherCardItem extends Component {
    render() {
        return (
            <div className="md-text-left md-display-1 weather-card-pad">
                {this.props.description}
            </div>
        );
    }
}

class WeatherCard extends Component {
    constructor() {
        super();
        this.state={
            flipped: false
        };
        
        this.flip = this.flip.bind(this);
    }

    flip() {
        var flipped = this.state.flipped;
        this.setState({
            flipped: !flipped
        });
    }
    
    render() {
        var weather = this.props.weather;
        var sunriseDate = new Date(weather.daily.data[0].sunriseTime * 1000);
        var sunsetDate = new Date(weather.daily.data[0].sunsetTime * 1000);
        var sunriseTime = sunriseDate.getHours() + ":" + sunriseDate.getMinutes();
        var sunsetTime = sunsetDate.getHours() + ":" + sunsetDate.getMinutes();
        var flipCSS = this.state.flipped ? "flipped" : "";
        
        return (
            <div className="centerCard">
                <section className="container">
                    <div id="card" className={flipCSS}>
                        <figure className={"front"}>
                            <Card className="md-cell--middle">
                                <CardTitle title={this.props.city} />
                                <CardText>
                                    <WeatherCardItem description={weather.currently.summary} />
                                    <WeatherCardItem
                                        description={"Currently: " + weather.currently.temperature + " F"} />
                                    <WeatherCardItem
                                        description={"Precipitation: "
                                                   + weather.currently.precipProbability * 100 + " %"} />
                                    <WeatherCardItem
                                        description={"High: " + weather.daily.data[0].temperatureMax + " F"} />
                                    <WeatherCardItem
                                        description={"Low: " + weather.daily.data[0].temperatureMin + " F"} />
                                    <WeatherCardItem description={"Sunrise: " + sunriseTime} />
                                    <WeatherCardItem description={"Sunset: " + sunsetTime} />
                                </CardText>
                            </Card>
                            <Button raised label="7 day forecast" onClick={this.flip} />
                        </figure>
                        <figure className="back">
                            <FutureForecast dailyData={this.props.weather.daily.data} />                        
                            <Button raised label="Today's weather" onClick={this.flip} />
                        </figure>
                    </div>
                </section>
            </div>
        );
    }
}

class CitySearch extends Component {
    constructor() {
        super();
        this.state = {
            input: "",
            cities: [],
            selectedCity: {cityID: null, cityLabel: null },
            weather: null,
            gettingWeather: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.getSelection = this.getSelection.bind(this);
        this.getLatLong = this.getLatLong.bind(this);
    }

    handleChange(textInput) {
        this.autoCompleteCities(textInput);
        this.setState({
            input: textInput,
        });
    }

    getSelection(selectedCity, cityIndex) {
        this.setState({
            selectedCity: {cityID: this.state.cities[cityIndex].id, cityLabel: selectedCity},
            weather: null
        });
    }

    // need a way to get the selected value from the third party auto-complete component
    autoCompleteCities(input) {
        if(input.length > 0) {
            fetch("/getCities?input=" + input)
                .then(resp => {
                    return resp.json();
                })
                .then(data => {
                    var results = data.predictions.map(city => {
                        return {name: city.description, id: city.place_id};
                    });
                    this.setState({
                        cities: results
                    });
                });
        } else {
            this.setState({
                selectedCity: {cityID: null, cityLabel: null}
            });
        }
    }

    // input is the place_id that was provided by google
    getLatLong() {
        this.setState({
            gettingWeather: true,
            weather: null
        });
        fetch("/getLatLong?input=" + this.state.selectedCity.cityID)
            .then(resp => {
                return resp.json();
            })
            .then(data => {
                var latitude = data.result.geometry.location.lat;
                var longitude = data.result.geometry.location.lng;
                this.getWeather(latitude, longitude);
            });
    }
    
    getWeather(latitude, longitude) {
        fetch("/getWeather?latitude=" + latitude + "&longitude=" + longitude)
            .then((resp) => {
                return resp.json();
            })
            .then((data) => {
                this.setState({
                    weather: data,
                    gettingWeather: false
                });
            });
    }

    getButton() {
        if(this.state.selectedCity.cityID) {
            return <Button raised label="Get Weather" onClick={this.getLatLong} />;
        } else {
            return <Button raised disabled label="Get Weather" />;
        }
    }

    renderWeatherCard() {
        if(this.state.weather) {
            return <WeatherCard weather={this.state.weather}
                                city={this.state.selectedCity.cityLabel} />;
        } else if(this.state.gettingWeather) {
            return <CircularProgress id="progress" />;
        }
    }

    render() {
        return (
            <div>
                <Autocomplete
                    id="city-search"
                    type="search"
                    label="Enter a city"
                    className="md-cell"
                    placeholder="City"
                    data={this.state.cities}
                    dataLabel="name"
                    dataValue="id"
                    filter={null}
                    onChange={this.handleChange}
                    onAutocomplete={this.getSelection} />
                {this.getButton()}
                {this.renderWeatherCard()}
            </div>
        );
    }
}


class App extends Component {    
    render() {
        return (
            <div className="App">
                <Helmet>
                    <link rel="stylesheet" href="https://unpkg.com/react-md/dist/react-md.indigo-pink.min.css"/>
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,500,700|Material+Icons"/>
                </Helmet>
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <div className="md-headline">Clear Skies</div>
                </div>
                <CitySearch></CitySearch>
            </div>
        );
    }
}

export default App;
