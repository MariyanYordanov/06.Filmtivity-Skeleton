import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    movieId: {
        type: String,
        required: true,
        unique: true
    },
    poster_path: String,
    overview: String,
    release_date: String,
    vote_average: Number,
    original_language: String,
    savedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;