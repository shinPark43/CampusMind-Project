import mongoose from 'mongoose';

const gymSchema = new mongoose.Schema({
  // Core information
  url: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  pageType: {
    type: String,
    enum: ['hours', 'membership', 'program', 'facility', 'equipment', 'general'],
    required: true
  },
  
  // Facility information
  name: String,
  hours: {
    type: Map,
    of: String
  },
  features: [String],
  equipment: [String],
  rules: [String],
  
  // Programs and classes
  programs: [{
    name: String,
    description: String,
    schedule: String,
    requirements: [String],
    instructor: String,
    capacity: Number
  }],
  
  // Membership information
  membership: {
    types: [{
      name: String,
      description: String,
      price: Number,
      duration: String,
      benefits: [String]
    }],
    policies: [String],
    registration: String
  },
  
  // For vector search
  vector: { type: [Number], required: true },
  textForEmbedding: { type: String, required: true },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  lastScraped: { type: Date, default: Date.now }
});

// Create text index for traditional search
gymSchema.index({ 
  title: 'text', 
  description: 'text',
  'programs.name': 'text',
  'programs.description': 'text',
  'membership.types.name': 'text'
});

const GymData = mongoose.model('GymData', gymSchema);

export default GymData; 