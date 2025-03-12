// import { Schema, model, models } from 'mongoose';
import pkg from 'mongoose';
const { Schema, model, models } = pkg;

const sport_equipmentSchema = new Schema({
    // equipment_id: { type: Number, required: true, trim: true, unique: true },
    sport_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'Sport' },
    equipment_name: { type: String, trim: true, required: true },
    quantity: { type: Number, trim: true, required: true },
});

const SportEquipment = models.SportEquipment || model('SportEquipment', sport_equipmentSchema);

export { SportEquipment };