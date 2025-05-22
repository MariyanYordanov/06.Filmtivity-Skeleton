# Ръководство за превръщане на статичен уеб сайт в динамичен

## Подобрена структура на файловете

```
Filmtivity/
  ├── config/                 # Конфигурационни файлове
  ├── controllers/            # Само логика за обработка на HTTP заявки
  ├── middlewares/            # Middleware функции
  ├── models/                 # Mongoose модели
  ├── routes/                 # Маршрути
  ├── services/               # Бизнес логика
  ├── src/                    # JavaScript файлове за клиентската част
  ├── static/                 # Статични файлове
  │   ├── css/                # CSS стилове
  │   └── img/                # Изображения 
  ├── views/                  # Handlebars шаблони
  │   ├── layouts/            # Основни шаблони (main.hbs)
  │   ├── partials/           # Частични шаблони
  │   └── pages/              # Основни страници
  ├── .env                    # Настройки на средата
  ├── .gitignore              # Git ignore файл
  ├── index.js                # Входна точка на приложението
  └── package.json            # NPM пакетна конфигурация
```

## 1. Създаване на директориите

```bash
mkdir -p config controllers middlewares models routes services src static/css static/img views/layouts views/partials views/pages
```

## 2. Настройване на Express и Handlebars

### Файл: index.js

```javascript
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';

// Зареждане на helpers за Handlebars
import { helpers } from './config/handlebars-helpers.js';

// Зареждане на маршрути
import movieRoutes from './routes/movieRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Зареждане на middleware
import { isAuthenticated } from './middlewares/authMiddleware.js';

// Зареждане на средата
dotenv.config();

// ESM специфични настройки
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Създаване на приложение
const app = express();
const PORT = process.env.PORT || 3000;

// Свързване с базата данни
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Успешно свързване с MongoDB'))
  .catch(err => console.error('Грешка при свързване с MongoDB:', err));

// Настройка на Handlebars
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: join(__dirname, 'views/layouts'),
  partialsDir: join(__dirname, 'views/partials'),
  helpers
}));
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'static')));

// Експортиране на src директорията като /src за клиентските скриптове
app.use('/src', express.static(join(__dirname, 'src')));
app.use(isAuthenticated); // Добавяне на middleware за автентикация

// Основен маршрут
app.get('/', (req, res) => {
  res.render('pages/home', { 
    title: 'Filmtivity',
    additionalStyles: ['home']
  });
});

// Добавяне на маршрути
app.use(userRoutes);
app.use(movieRoutes);

// Обработка на 404
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: 'Page Not Found',
    additionalStyles: ['404']
  });
});

// Стартиране на сървъра
app.listen(PORT, () => {
  console.log(`Сървърът е стартиран на порт ${PORT}`);
});
```

## 3. Организиране на конфигурациите

### Файл: config/handlebars-helpers.js

```javascript
export const helpers = {
  // Форматиране на дата
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  },
  
  // Орязване на текст
  truncate: (text, length) => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
  
  // Проверка за равенство
  equals: (a, b) => a === b,
  
  // Условно сравнение
  ifCond: function(v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  }
};
```

### Файл: config/db.js

```javascript
import mongoose from 'mongoose';

// Функция за свързване с базата данни
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB свързано: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Грешка: ${error.message}`);
    process.exit(1);
  }
};
```

### Файл: config/constants.js

```javascript
// API конфигурации
export const TMDB = {
  API_KEY: '25afacdd7d9acf12478bb0c74e5d129a',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500'
};

// JWT конфигурации
export const JWT = {
  SECRET: process.env.JWT_SECRET || 'supersecretkey',
  EXPIRES_IN: '30d'
};
```

## 4. Дефиниране на модели

### Файл: models/User.js

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Потребителското име е задължително'],
    unique: true,
    minlength: [4, 'Потребителското име трябва да е поне 4 символа']
  },
  email: {
    type: String,
    required: [true, 'Имейлът е задължителен'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Моля, въведете валиден имейл']
  },
  password: {
    type: String,
    required: [true, 'Паролата е задължителна'],
    minlength: [6, 'Паролата трябва да е поне 6 символа']
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  }]
}, { timestamps: true });

// Хеширане на паролата преди запазване
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Метод за проверка на паролата
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
```

### Файл: models/Movie.js

```javascript
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
```

## 5. Създаване на Service Layer за бизнес логика

### Файл: services/authService.js

```javascript
import jwt from 'jsonwebtoken';
import { JWT } from '../config/constants.js';
import User from '../models/User.js';

// Генериране на JWT токен
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT.SECRET, {
    expiresIn: JWT.EXPIRES_IN
  });
};

// Регистрация
export const registerUser = async (userData) => {
  const { username, email, password } = userData;

  // Проверка дали потребителят вече съществува
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  
  if (userExists) {
    throw new Error('Потребител с този имейл или потребителско име вече съществува');
  }

  // Създаване на нов потребител
  const user = await User.create({
    username,
    email,
    password
  });

  return user;
};

// Вход
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  
  if (!user || !(await user.matchPassword(password))) {
    throw new Error('Невалиден имейл или парола');
  }
  
  return user;
};

// Добавяне към любими
export const addToUserFavorites = async (userId, movieId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: movieId } },
    { new: true }
  );
  
  if (!user) {
    throw new Error('Потребителят не е намерен');
  }
  
  return user;
};

// Взимане на любими филми
export const getUserWithFavorites = async (userId) => {
  const user = await User.findById(userId).populate('favorites');
  
  if (!user) {
    throw new Error('Потребителят не е намерен');
  }
  
  return user;
};
```

### Файл: services/movieService.js

```javascript
import fetch from 'node-fetch';
import { TMDB } from '../config/constants.js';
import Movie from '../models/Movie.js';

// Извличане на популярни филми
export const getPopularMovies = async (limit = 12) => {
  const response = await fetch(`${TMDB.BASE_URL}/discover/movie?api_key=${TMDB.API_KEY}&sort_by=popularity.desc`);
  
  if (!response.ok) {
    throw new Error('Грешка при извличане на популярни филми');
  }
  
  const data = await response.json();
  return data.results.slice(0, limit);
};

// Търсене на филми по заглавие
export const searchMoviesByTitle = async (title) => {
  const response = await fetch(`${TMDB.BASE_URL}/search/movie?api_key=${TMDB.API_KEY}&query=${title}`);
  
  if (!response.ok) {
    throw new Error('Грешка при търсенето на филми');
  }
  
  const data = await response.json();
  return data.results;
};

// Извличане на филм по ID
export const getMovieById = async (movieId) => {
  const response = await fetch(`${TMDB.BASE_URL}/movie/${movieId}?api_key=${TMDB.API_KEY}`);
  
  if (!response.ok) {
    throw new Error('Грешка при извличане на филм');
  }
  
  return await response.json();
};

// Запазване на филм в базата данни
export const saveMovieToDatabase = async (movieId, userId) => {
  // Проверка дали филмът вече съществува
  let movie = await Movie.findOne({ movieId: movieId.toString() });
  
  if (!movie) {
    // Извличане на данни от TMDB API
    const movieData = await getMovieById(movieId);
    
    // Създаване на нов филм
    movie = await Movie.create({
      title: movieData.title,
      movieId: movieData.id.toString(),
      poster_path: movieData.poster_path,
      overview: movieData.overview,
      release_date: movieData.release_date,
      vote_average: movieData.vote_average,
      original_language: movieData.original_language,
      savedBy: [userId]
    });
  } else if (!movie.savedBy.includes(userId)) {
    // Добавяне на потребителя към savedBy
    movie.savedBy.push(userId);
    await movie.save();
  }
  
  return movie;
};
```

## 6. Контролери (използват services)

### Файл: controllers/userController.js

```javascript
import * as authService from '../services/authService.js';

// Регистрация
export const register = async (req, res) => {
  try {
    // Използваме authService за бизнес логиката
    const user = await authService.registerUser(req.body);
    
    // Генериране на токен
    const token = authService.generateToken(user._id);

    // Записване на токена в бисквитка
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дни
    });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.render('pages/register', { 
      error: error.message,
      username: req.body.username,
      email: req.body.email,
      title: 'Register',
      additionalStyles: ['register-login']
    });
  }
};

// Вход
export const login = async (req, res) => {
  try {
    // Използваме authService за бизнес логиката
    const user = await authService.loginUser(req.body.email, req.body.password);
    
    // Генериране на токен
    const token = authService.generateToken(user._id);

    // Записване на токена в бисквитка
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дни
    });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.render('pages/login', { 
      error: error.message,
      email: req.body.email,
      title: 'Login',
      additionalStyles: ['register-login'] 
    });
  }
};

// Изход
export const logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.redirect('/');
};

// Добавяне на филм към любими
export const addToFavorites = async (req, res) => {
  try {
    await authService.addToUserFavorites(req.user._id, req.params.movieId);
    res.redirect('/favorites');
  } catch (error) {
    console.error(error);
    res.status(500).render('pages/error', { 
      message: error.message,
      title: 'Error' 
    });
  }
};

// Взимане на любими филми
export const getFavorites = async (req, res) => {
  try {
    const user = await authService.getUserWithFavorites(req.user._id);
    
    res.render('pages/favorites', {
      title: 'My Favorites',
      user,
      favorites: user.favorites,
      additionalStyles: ['my-posts']
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('pages/error', { 
      message: error.message,
      title: 'Error' 
    });
  }
};
```

### Файл: controllers/movieController.js

```javascript
import * as movieService from '../services/movieService.js';

// Показване на всички популярни филми
export const getAllMovies = async (req, res) => {
  try {
    const movies = await movieService.getPopularMovies(12);
    
    res.render('pages/all', {
      title: 'All Movies',
      movies,
      additionalStyles: ['all-posts'],
      scripts: ['all']
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('pages/error', { 
      message: 'Възникна грешка при зареждане на филмите',
      title: 'Error'
    });
  }
};

// Търсене на филми
export const searchMovies = async (req, res) => {
  try {
    const { title } = req.query;
    
    if (title) {
      const results = await movieService.searchMoviesByTitle(title);
      
      if (results && results.length > 0) {
        res.render('pages/search', {
          title: 'Search Results',
          movie: results[0],
          searchTerm: title,
          showDetails: true,
          additionalStyles: ['search', 'details'],
          scripts: ['search']
        });
      } else {
        res.render('pages/search', {
          title: 'Search Movies',
          searchTerm: title,
          noResults: true,
          additionalStyles: ['search'],
          scripts: ['search']
        });
      }
    } else {
      res.render('pages/search', {
        title: 'Search Movies',
        additionalStyles: ['search'],
        scripts: ['search']
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).render('pages/error', { 
      message: 'Възникна грешка при търсенето на филми',
      title: 'Error'
    });
  }
};

// Запазване на филм в базата данни
export const saveMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;
    
    await movieService.saveMovieToDatabase(movieId, userId);
    
    res.redirect('/favorites');
  } catch (error) {
    console.error(error);
    res.status(500).render('pages/error', { 
      message: 'Възникна грешка при запазване на филма',
      title: 'Error'
    });
  }
};
```

## 7. Middleware за автентикация

### Файл: middlewares/authMiddleware.js

```javascript
import jwt from 'jsonwebtoken';
import { JWT } from '../config/constants.js';
import User from '../models/User.js';

// Защита на маршрути, изискващи автентикация
export const protect = async (req, res, next) => {
  let token;

  // Проверка за токен в бисквитки
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.redirect('/login');
  }

  try {
    // Верификация на токена
    const decoded = jwt.verify(token, JWT.SECRET);

    // Добавяне на потребителя към заявката
    req.user = await User.findById(decoded.id).select('-password');
    
    // Добавяне на потребителя към глобалните променливи на изгледа
    res.locals.user = req.user;
    
    next();
  } catch (error) {
    console.error(error);
    res.redirect('/login');
  }
};

// Проверка дали потребителят е влязъл (за условен рендеринг)
export const isAuthenticated = async (req, res, next) => {
  let token;

  // Проверка за токен в бисквитки
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      // Верификация на токена
      const decoded = jwt.verify(token, JWT.SECRET);

      // Добавяне на потребителя към глобалните променливи на изгледа
      const user = await User.findById(decoded.id).select('-password');
      res.locals.user = user;
    } catch (error) {
      console.error(error);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  
  next();
};
```

## 8. Маршрути

### Файл: routes/userRoutes.js

```javascript
import express from 'express';
import { register, login, logout, addToFavorites, getFavorites } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Регистрация
router.get('/register', (req, res) => {
  res.render('pages/register', { 
    title: 'Register', 
    additionalStyles: ['register-login'] 
  });
});
router.post('/register', register);

// Вход
router.get('/login', (req, res) => {
  res.render('pages/login', { 
    title: 'Login', 
    additionalStyles: ['register-login'] 
  });
});
router.post('/login', login);

// Изход
router.get('/logout', logout);

// Любими филми
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:movieId', protect, addToFavorites);

export default router;
```

### Файл: routes/movieRoutes.js

```javascript
import express from 'express';
import { getAllMovies, searchMovies, saveMovie } from '../controllers/movieController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Всички филми
router.get('/movies', getAllMovies);

// Търсене на филми
router.get('/search', searchMovies);

// Запазване на филм
router.post('/movies/:movieId/save', protect, saveMovie);

export default router;
```

## 9. Handlebars шаблони

### Файл: views/layouts/main.hbs

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet">
    {{#if additionalStyles}}
        {{#each additionalStyles}}
            <link href="/css/{{this}}.css" type="text/css" rel="stylesheet">
        {{/each}}
    {{/if}}
</head>
<body>
    <div id="box">
        {{> navigation}}

        <main>
            {{{body}}}
        </main>

        {{> footer}}
    </div>

    {{#if scripts}}
        {{#each scripts}}
            <script src="/src/{{this}}.js" defer></script>
        {{/each}}
    {{/if}}
</body>
</html>
```

### Файл: views/partials/navigation.hbs

```handlebars
<nav>
    <img src="/img/logo.png" alt="logo">

    <ul class="menu">
        <li><a href="/">Home</a></li>
        <li><a href="/movies">All Movies</a></li>
        <li><a href="/search">Search</a></li>
        {{#if user}}
            <li><a href="/favorites">My Favorites</a></li>
            <li><a href="/logout">Logout</a></li>
        {{else}}
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
        {{/if}}
    </ul>
</nav>
```

### Файл: views/partials/footer.hbs

```handlebars
<footer>
    © Filmtivity
</footer>
```

### Файл: views/pages/home.hbs

```handlebars
<section id="home">
    <div class="home-container">
        <div class="short-info">
            <h1>Explore the World of Movies</h1>
            <h2>Discover a Cinematic Journey</h2>
        </div>
    </div>
</section>
<section id="home-page">
    <div class="offers">
        <div class="col container"><img src="/img/cinema1.jpg" alt="nature_1"></div>
        <div class="col container"><img src="/img/cinema2.jpg" alt="nature_2"></div>
        <div class="col container"><img src="/img/cinema3.jpg" alt="nature_3"></div>
        <div class="col container"><img src="/img/cinema4.jpg" alt="nature_4"></div>
    </div>
</section>
```

### Файл: views/pages/login.hbs

```handlebars
<div class="loginSection">
    <div class="info">
        <h2>Login</h2>
        <h4>Welcome back to Filmtivity!</h4>
    </div>

    <form method="post" class="loginForm">
        <h2>Login</h2>
        {{#if error}}
            <p class="error">{{error}}</p>
        {{/if}}
        <ul class="noBullet">
            <li>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" class="inputFields" value="{{email}}" required>
            </li>
            <li>
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" class="inputFields" required>
            </li>
            <li id="center-btn">
                <button id="login-btn" type="submit">Login</button>
            </li>
        </ul>
        <p>Don't have an account? <a href="/register">Register here</a></p>
    </form>
</div>
```

### Файл: views/pages/register.hbs

```handlebars
<div class="signupSection">
    <div class="info">
        <h2>Sign Up</h2>
        <h4>Join Filmtivity today!</h4>
    </div>

    <form method="post" class="signupForm">
        <h2>Register</h2>
        {{#if error}}
            <p class="error">{{error}}</p>
        {{/if}}
        <ul class="noBullet">
            <li>
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" class="inputFields" value="{{username}}" required>
            </li>
            <li>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" class="inputFields" value="{{email}}" required>
            </li>
            <li>
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" class="inputFields" required>
            </li>
            <li id="center-btn">
                <button id="join-btn" type="submit">Join</button>
            </li>
        </ul>
        <p>Already have an account? <a href="/login">Login here</a></p>
    </form>
</div>
```

### Файл: views/pages/all.hbs

```handlebars
<section id="catalog">
    <h1>All Movies</h1>
    <div class="band" id="movie-container">
        {{#each movies}}
            <div class="flip flip-vertical">
                <div class="front">
                    <img src="https://image.tmdb.org/t/p/w500{{this.poster_path}}" class="card-img-top" alt="{{this.title}}">
                </div>
                <div class="back">
                    <h2>{{this.title}}</h2>
                    <p>{{truncate this.overview 150}}</p>
                    <p>Rating: {{this.vote_average}}</p>
                    {{#if ../user}}
                        <form action="/movies/{{this.id}}/save" method="POST">
                            <button type="submit" class="details">Add to Favorites</button>
                        </form>
                    {{else}}
                        <a href="/login" class="details">Login to save</a>
                    {{/if}}
                </div>
            </div>
        {{/each}}
    </div>
</section>
```

### Файл: views/pages/search.hbs

```handlebars
<div class="createSection">
    <div class="info">
        <h2>Find Movies</h2>
        <h4>Discover information about your favorite movies.</h4>
    </div>

    <form method="get" class="createForm">
        <h2>Search for </h2>
        <ul class="noBullet">
            <li>
                <label for="title">Title:</label>
                <input type="text" id="title" name="title" class="inputFields" placeholder="Enter movie title..." value="{{searchTerm}}">
            </li>
            <li id="center-btn">
                <button id="search-btn" type="submit">Search</button>
            </li>
        </ul>
    </form>
</div>

{{#if noResults}}
    <div class="no-posts">
        <p class="no-offer">No results found for "{{searchTerm}}"</p>
        <p>Try searching for a different movie title</p>
    </div>
{{/if}}

{{#if showDetails}}
    <section id="details-page">
        <div class="main_card">
            <div class="card_left">
                <div class="card_datails">
                    <h1 id="title">{{movie.title}}</h1>
                    <h3>Original language: <span id="original_language">{{movie.original_language}}</span></h3>
                    <div class="card_animal">
                        <p class="card-keyword">Votes: <span class="card-keyword" id="vote_average">{{movie.vote_average}}</span></p>
                        <p class="card-keyword">Date: <span class="card-keyword" id="release_date">{{movie.release_date}}</span></p>
                    </div>
                    <p id="overview">{{movie.overview}}</p>
                    
                    {{#if ../user}}
                        <form action="/movies/{{movie.id}}/save" method="POST">
                            <button type="submit" class="vote-up">Add to Favorites</button>
                        </form>
                    {{else}}
                        <a href="/login" class="vote-up">Login to save</a>
                    {{/if}}
                </div>
            </div>
            <div class="card_right">
                <img id="poster" src="https://image.tmdb.org/t/p/w500{{movie.poster_path}}" alt="{{movie.title}}">
            </div>
        </div>
    </section>
{{/if}}
```

### Файл: views/pages/favorites.hbs

```handlebars
<section id="my-posts">
    <h1>My Favorite Movies</h1>
    
    <div class="my-container">
        {{#if favorites.length}}
            {{#each favorites}}
                <div class="my-card">
                    <div class="card-header">
                        <img src="https://image.tmdb.org/t/p/w500{{this.poster_path}}" alt="{{this.title}}">
                    </div>
                    <div class="card-body">
                        <span class="tag tag-teal">{{this.vote_average}}</span>
                        <h4>{{this.title}}</h4>
                        <p>{{truncate this.overview 100}}</p>
                        <div class="user">
                            <div class="user-info">
                                <h5>Released: {{formatDate this.release_date}}</h5>
                                <small>{{this.original_language}}</small>
                            </div>
                        </div>
                    </div>
                </div>
            {{/each}}
        {{else}}
            <div class="no-posts">
                <p class="no-offer">You haven't added any favorite movies yet.</p>
                <p>Go to <a href="/movies">All Movies</a> to discover and add movies to your favorites!</p>
            </div>
        {{/if}}
    </div>
</section>
```

## 10. Клиентски JavaScript файлове в src директорията

### Файл: src/all.js

```javascript
/**
 * Скрипт за страницата с всички филми
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('All movies page loaded');
  
  // Този скрипт може да добави допълнителни клиентски функционалности
  // Например анимации или интеракции за филмовите карти
  
  const movieCards = document.querySelectorAll('.flip');
  
  movieCards.forEach(card => {
    // Можем да добавим допълнителни събития или класове ако е необходимо
    card.addEventListener('mouseenter', function() {
      console.log('Hovering over movie:', card.querySelector('h2')?.textContent);
    });
  });
});
```

### Файл: src/search.js

```javascript
/**
 * Скрипт за страницата за търсене на филми
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Search page loaded');
  
  const searchForm = document.querySelector('.createForm');
  const searchInput = document.getElementById('title');
  
  // Добавяне на валидация преди изпращане на формата
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      if (!searchInput.value.trim()) {
        e.preventDefault();
        alert('Моля, въведете заглавие на филм за търсене');
      }
    });
  }
  
  // Auto-focus за полето за търсене
  if (searchInput) {
    searchInput.focus();
  }
});
```

## 11. Стартиране на приложението

```bash
node index.js
```

Приложението ще бъде достъпно на адрес: `http://localhost:3000`

## Заключение

Това ръководство представя подобрената архитектура с разделение на отговорностите и изнесени клиентски JavaScript файлове в папка `src`, вместо `static/js`:

1. `controllers` - обработват HTTP заявки/отговори
2. `services` - съдържат цялата бизнес логика
3. `models` - дефинират структурата на данните
4. `views/pages` - съдържат шаблоните за страниците
5. `views/partials` - съдържат повтарящи се компоненти
6. `views/layouts` - съдържат основната структура на страниците
7. `src` - съдържа клиентските JavaScript файлове

Сега всички JavaScript файлове за клиентската част са в отделна директория `src`, което дава по-добра организация и разделение на кода. В Handlebars шаблоните скриптовете се зареждат от `/src` пътя, който Express сървърът експортира като статичен.
