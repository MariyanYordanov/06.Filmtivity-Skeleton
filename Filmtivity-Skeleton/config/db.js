import mongoose from 'mongoose';

// Функция за свързване с базата данни
export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Експортиране на функцията за свързване
export default connectDB;