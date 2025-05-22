import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';

// Зареждане на helpers за Handlebars
//import { helpers } from './config/handlebars-helpers.js';

// Зареждане на маршрути
//import movieRoutes from './routes/movieRoutes.js';
//import userRoutes from './routes/userRoutes.js';

// Зареждане на middleware
//import { isAuthenticated } from './middlewares/authMiddleware.js';

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
    //helpers
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
//app.use(isAuthenticated); // Добавяне на middleware за автентикация

// Основен маршрут
app.get('/', (req, res) => {
    res.render('pages/home', {
        title: 'Filmtivity',
        additionalStyles: ['home']
    });
});

// Добавяне на маршрути
//app.use(userRoutes);
//app.use(movieRoutes);

// Обработка на 404
app.use((req, res) => {
    res.status(404).render('pages/404', {
        title: 'Page Not Found',
        additionalStyles: ['404']
    });
});

// Стартиране на сървъра
app.listen(PORT, () => {
    console.log(`Сървърът е стартиран на порт http://localhost:${PORT}`);
});