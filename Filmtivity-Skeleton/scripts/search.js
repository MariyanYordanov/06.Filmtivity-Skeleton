let BASE_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&`;
let API_KEY = '2663a47da530c754207396eef5db5fb1';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('search-btn').addEventListener('click', function () {
        const title = document.getElementById('search').value;
        if (title.trim()) {
            fetchMovie(title);
            document.getElementById('details-page').style.display = 'block';
        } else {
            document.getElementById('details-page').style.display = 'none';
        }
    });
});

function fetchMovie(title) {
    fetch(`${BASE_URL}t=${title}`)
        .then(response => response.json())
        .then(data => {
            const movie = data.results[0];
            document.getElementById('title').textContent = movie.title;
            document.getElementById('overview').textContent = movie.overview;
            document.getElementById('release-date').textContent = movie.release_date;
            document.getElementById('vote-average').textContent = movie.vote_average;
            document.getElementById('original-language').textContent = movie.original_language;
            document.getElementById('poster').src = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;
        })
        .catch(error => console.error(error));
}