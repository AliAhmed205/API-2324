const express = require('express');
const ejs = require('ejs');

const app = express();
const port = 6660;
require('dotenv').config();

app.use(express.static('./static'))

app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', (req, res) => {
    const urlTrending = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&primary_release_year=2010&sort_by=popularity.desc';
    const urlTopRated = 'https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1';
    
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.MOVIEDB_TOKEN}`
        }
    };

    Promise.all([
        fetch(urlTrending, options).then(res => res.json()),
        fetch(urlTopRated, options).then(res => res.json())
    ])
    .then(([trendingJson, topRatedJson]) => {
        res.render('index.ejs', {
            title: 'Netflix',
            filmlijst: trendingJson.results || [], // Renamed 'movies' to 'filmlijst'
            searchResults: [], // Voeg een lege array toe voor searchResults
            topRatedMovies: topRatedJson.results || []
        });
    })
    .catch(err => {
        console.error('error:' + err);
        res.render('index.ejs', {
            title: 'Netflix',
            filmlijst: [], // Renamed 'movies' to 'filmlijst'
            searchResults: [], // Voeg een lege array toe voor searchResults
            topRatedMovies: [] // Add top-rated films to the data sent to EJS
        });
    });
});


// Dynamische routing via een id 
app.get('/search', (req, res) => {
    const searchQuery = req.query.search;
    const year = 2010;

    // Zoekopdracht met release_date.lte-parameter
    const urlSearch = `https://api.themoviedb.org/3/search/movie?query=${searchQuery}&include_adult=false&language=en-US&page=1&release_date.lte=${year}`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.MOVIEDB_TOKEN}`
        }
    };

    fetch(urlSearch, options)
        .then(res => res.json())
        .then(data => {
            const searchResults = data.results.filter(movie => movie.release_date.slice(0, 4) < year); // Filter films die vóór het jaar 2000 zijn
            res.render('index.ejs', {
                title: `Search results for '${searchQuery}'`,
                searchResults: searchResults // Gebruik de variabele searchResults hier
            });

        })
        .catch(err => console.error('error:' + err));
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

function renderTemplate(file, data) {
    ejs.renderFile(file, data, {}, function (err, str) {
        if (err) {
            console.error(err);
            return; // Handle error
        }
        return str;
    });
}