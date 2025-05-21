// let's make express server
import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { engine } from 'express-handlebars'

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.engine('handlebars', engine());

app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'static')));
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cookieParser());

// paths
app.get('/', (req, res) => {
    res.render('home')
});

app.listen(PORT, () => {
    console.log('Server is started')
});