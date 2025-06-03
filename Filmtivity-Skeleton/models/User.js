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
userSchema.pre('save', async function (next) {
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
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;