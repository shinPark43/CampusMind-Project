// import { Schema, model, models } from 'mongoose';
import pkg from 'mongoose';
const { Schema, model, models } = pkg;

const courtSchema = new Schema({
    court_name: { type: String, required: true, trim: true },
    sport_id: { type: Schema.Types.ObjectId, required: true, ref: 'Sport' },
    is_available: { type: Boolean, default: true },
    is_shared: { type: Boolean, default: false },
    shared_with: { type: [String], default: [] },
});

const Court = models.Court || model('Court', courtSchema);

export { Court }; 