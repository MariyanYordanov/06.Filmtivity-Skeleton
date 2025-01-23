const API_KEY = '25afacdd7d9acf12478bb0c74e5d129a';

document.addEventListener(`DOMContentLoaded`, searchMovie);

function searchMovie() {
    document.getElementById(`search-btn`).addEventListener(`click`, function (e) {
        e.preventDefault();
        const title = document.getElementById(`search`).value;
        if (title.trim()) {
            fetchMovie(title);
            document.getElementById(`details-page`).style.display = `block`;
        }
        else {
            window.alert('something for test');
            document.getElementById(`details-page`).style.display = `none`;
        }
    });
}

function fetchMovie(title) {
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${title}`)
        .then(response => response.json())
        .then(data => {
            const results = data.results[0];
            document.getElementById('title').textContent = results.title;
            document.getElementById('release_date').textContent = results.release_date;
            document.getElementById('overview').textContent = results.overview;
            document.getElementById('vote_average').textContent = results.vote_average;
            document.getElementById('poster').src = 'https://image.tmdb.org/t/p/w500' + results.poster_path;
        })
        .catch(error => console.error(error));
}

