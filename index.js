const express = require('express');
const ejs = require('ejs');

const app = express();
const port = 6660;
require('dotenv').config();

app.use(express.static('public'))

app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', (req, res) => {
  const urlTrending = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc';
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
      console.log(trendingJson)
      res.render('index.ejs', {
        filmlijst: trendingJson.results || [], // Renamed 'movies' to 'filmlijst'
        searchResults: [], // Voeg een lege array toe voor searchResults
        topRatedMovies: topRatedJson.results || []
      });
    })
    .catch(err => {
      console.error('error:' + err);
      res.render('index.ejs', {
        filmlijst: [], // Renamed 'movies' to 'filmlijst'
        searchResults: [], // Voeg een lege array toe voor searchResults
        topRatedMovies: [] // Add top-rated films to the data sent to EJS
      });
    });
});

app.get('/disney', (req, res) => {
  const urlTrending = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&with_companies=3166';
  const urlFrom2005 = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&primary_release_date.lte=1950&with_companies=3166';

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.MOVIEDB_TOKEN}`
    }
  };

  // Fetch data from the first URL
  fetch(urlTrending, options)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(trendingJson => {
      // Fetch data from the second URL
      fetch(urlFrom2005, options)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(from2005Json => {
          console.log(trendingJson, from2005Json);
          res.render('disney.ejs', {
            filmlijst: trendingJson.results || [], // Renamed 'movies' to 'filmlijst'
            searchResults: [], // Voeg een lege array toe voor searchResults
            filmsFrom2005: from2005Json.results || [] // Films vanaf 2005
          });
        })
        .catch(err => {
          console.error('error:' + err);
          res.render('disney.ejs', {
            filmlijst: [], // Renamed 'movies' to 'filmlijst'
            searchResults: [], // Voeg een lege array toe voor searchResults
            filmsFrom2005: [] // Films vanaf 2005
          });
        });
    })
    .catch(err => {
      console.error('error:' + err);
      res.render('disney.ejs', {
        filmlijst: [], // Renamed 'movies' to 'filmlijst'
        searchResults: [], // Voeg een lege array toe voor searchResults
        filmsFrom2005: [] // Films vanaf 2005
      });
    });
});



// Dynamische routing via een id 
app.get('/results/search', (req, res) => {
  const searchQuery = req.query.term;

  // Zoekopdracht met release_date.lte-parameter
  const urlSearch = `https://api.themoviedb.org/3/search/movie?query=${searchQuery}&include_adult=false&language=en-US&page=1`;
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

      const searchResults = data.results.filter(movie => 
        movie.poster_path !== null
        ); // Filter films die vóór het jaar 2000 zijn en een poster hebben
        console.log(searchResults);
      
      res.render('results.ejs', {
        title: `Search results for '${searchQuery}'`,
        queryResults: searchResults // Gebruik de variabele searchResults hier
      });

    })
    .catch(err => console.error('error:' + err));
});

app.get('/detail/:movie_id', (req, res) => {
  const movieId = req.params.movie_id;
  const detailDataUrl = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US&api_key=${process.env.API_KEY}`;
  const detailVideoUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`;
  console.log(detailDataUrl);
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.MOVIEDB_TOKEN}`
    }
  };


  Promise.all([
      fetch(detailDataUrl, options).then(res => res.json()),
      fetch(detailVideoUrl, options).then(res => res.json())
    ])
    .then(([jsonDetailData, jsonVideoData]) => {
      const detailData = jsonDetailData
      const videoData = jsonVideoData.results

      res.render('detail.ejs', {
        detailData,
        videoData
      });
    })
    .catch(err => {
      console.error('error:' + err);
      res.render('detail.ejs', {
        videoData: [],
        detailData: []
        //   filmlijst: [], // Renamed 'movies' to 'filmlijst'
        //   searchResults: [], // Voeg een lege array toe voor searchResults
        //   topRatedMovies: [] // Add top-rated films to the data sent to EJS
      });
    });
});


app.use((req, res, next) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  res.status(500).render('500');
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
