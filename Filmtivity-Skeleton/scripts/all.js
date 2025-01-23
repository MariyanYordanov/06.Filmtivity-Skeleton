const API_KEY = '25afacdd7d9acf12478bb0c74e5d129a';

function fetchTopTenMovies() {
    fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc`)
        .then(response => response.json())
        .then(data => {
            const results = data.results;
            displayMovies(results);
        })
        .catch(error => console.error(error));
}

function displayMovies(movies) {
    let movieContainer = document.getElementById('movie-container');
    movieContainer.innerHTML = '';

    movies.forEach(movie => {
        let movieCard = document.createElement('div');
        movieCard.classList.add('col-md-3', 'mb-3');
        movieCard.innerHTML = `
            <div class="card">
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="card-img-top" alt="${movie.title}">   
                <div class="card-body">
                    <h5 class="card-title">${movie.title}</h5>
                    <p class="card-text">${movie.overview}</p>
                    <a href="#" class="btn btn-primary">Details</a>
                </div>
            </div>  
        `;
        movieContainer.appendChild(movieCard);
    });
}

