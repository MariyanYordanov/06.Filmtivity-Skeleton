const BASE_URL = `http://www.omdbapi.com/?apikey=${API_KEY}&`;
const API_KEY = 'e756d47e';

document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('search');

    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const searchInput = document.getElementById('search-input');
        const searchValue = searchInput.value;
        fetchMovie(searchValue);
    });
});

function fetchMovie(title) {
    fetch(`${BASE_URL}t=${title}`)
        .then(response => response.json())
        .then(data => {
            const movie = {
                title: data.Title,
                year: data.Year,
                rated: data.Ratings[0].Value.value,
            }
        displayMovie(movie);    
    });
} Value