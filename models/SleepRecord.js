import mongoose from 'mongoose';

const { Schema } = mongoose;

const sleepRecordSchema = new Schema({
		userId: { type: String, required: true },
		sleepStart: { type: Date, required: true },
		sleepEnd: { type: Date, required: true },
		createdAt: { type: Date, default: Date.now }
});

const SleepRecord = mongoose.model('SleepRecord', sleepRecordSchema);

export default SleepRecord;
