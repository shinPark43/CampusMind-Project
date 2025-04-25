# Database Scripts

This directory contains various scripts for managing and maintaining the database for the CampusMind application.

## Enriching the RAG Database

The `enrichRagData.js` script adds additional data about fitness, sports, and Angelo State University general information to the Retrieval Augmented Generation (RAG) database. This enhances the chatbot's ability to answer questions on these topics.

### How to Run the Script

1. Make sure your environment variables are properly set up in your `.env` file:
   - `MONGODB_RAG_URI`: MongoDB connection string for the RAG database
   - `OPENAI_API_KEY`: Your OpenAI API key for generating embeddings

2. Run the script using Node.js:
   ```bash
   cd CampusMind/backend
   node scripts/enrichRagData.js
   ```

3. The script will:
   - Connect to your RAG database
   - Process fitness-related data (cardio exercises, strength training, nutrition)
   - Process sports-related data (intramural sports, varsity athletics, sports facilities)
   - Process general ASU information (university overview, student services, campus navigation)
   - Generate embeddings for each document
   - Save the data to the database with proper vector embeddings
   - Check/create vector indexes for similarity search

4. Upon successful completion, the script will display a summary of added documents.

### Customizing the Data

If you want to add more documents or modify the existing ones:

1. Edit the `fitnessData`, `sportsData`, or `asuData` arrays in `enrichRagData.js`
2. Follow the existing structure for each document:
   - `title`: Document title
   - `description`: Brief description
   - `pageType`: Category (fitness, sports, general)
   - `content`: Markdown-formatted content with headings and bullet points

### Troubleshooting

- If you encounter connection errors, verify your MongoDB connection string
- OpenAI API errors may indicate quota limits or authentication issues
- For MongoDB index errors, check that your MongoDB Atlas cluster supports vector search

## Other Scripts

- `migrateGymData.js`: Migrates data between database schemas
- `finalizeMigration.js`: Finalizes database migrations
- `checkGymData.js`: Verifies database integrity
- `scrapeGym.js`: Scrapes gym data from external sources
- `populateSports.js`: Populates sports-related data
- `populateCourts.js`: Populates court reservation data
- `deleteReservations.js`: Cleans up old reservation data 