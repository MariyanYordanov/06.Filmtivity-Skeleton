import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';

import connectDB from './config/db.js';

// Зареждане на средата
dotenv.config();

// ESM специфични настройки
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Създаване на приложение
const app = express();
const PORT = process.env.PORT || 3000;

// Извикване на функцията за свързване с базата данни
connectDB();

// Настройка на Handlebars
app.engine('hbs', engine({
    extname: '.hbs',
    //defaultLayout: 'main',
    layoutsDir: join(__dirname, 'views/layouts'),
    partialsDir: join(__dirname, 'views/partials'),
}));
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'static')));
app.use('/src', express.static(join(__dirname, 'src')));

// Основен маршрут
app.get('/', (req, res) => {
    res.render('pages/home', {
        title: 'Home',
        additionalStyles: ['home']
    });
});

// 404
app.use((req, res) => {
    res.status(404).render('pages/404', {
        title: 'Page Not Found',
        additionalStyles: ['404']
    });
});

// Стартиране на сървъра
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});