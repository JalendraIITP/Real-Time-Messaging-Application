import mongoose from 'mongoose';
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    // mongoose.set("useFindAndModify", false);
    const conn = await mongoose.connect(process.env.MongoDB_URL, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // autoIndex: false,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

