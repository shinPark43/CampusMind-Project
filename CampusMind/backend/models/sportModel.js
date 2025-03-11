// import { Schema, model, models } from 'mongoose';
import pkg from 'mongoose';
const { Schema, model, models } = pkg;

const sportSchema = new Schema({
    // sport_id: { type: Number, required: true, trim: true, unique: true },
    sport_name : { type: String, required: true, trim: true, unique: true },
});

const Sport = models.Sport || model('Sport', sportSchema);

export { Sport };