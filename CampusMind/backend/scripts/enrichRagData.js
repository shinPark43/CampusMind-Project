import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { connectRAGDB } from '../db/ragDb.js';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Data Structure
const fitnessData = [
  {
    title: "Cardio Exercises at ASU Gym",
    description: "Comprehensive guide to cardio workouts available at Angelo State University gym",
    pageType: "fitness",
    content: `
      # Cardio Exercises at ASU Gym
      
      The ASU gym offers a variety of cardio equipment and spaces for students to improve their cardiovascular health.
      
      ## Available Cardio Equipment
      
      * Treadmills (15 machines)
      * Ellipticals (10 machines)
      * Stationary bikes (8 machines)
      * Stair climbers (5 machines)
      * Rowing machines (4 machines)
      
      ## Cardio Workout Suggestions
      
      ### Beginner Cardio Routine
      * 5 minutes warm-up on treadmill (3.0 mph)
      * 15 minutes on elliptical (moderate resistance)
      * 5 minutes on stationary bike (low resistance)
      * 5 minutes cool-down walk
      
      ### Intermediate Cardio Routine
      * 5 minutes warm-up jog
      * 20 minutes interval training on treadmill (alternate 1 minute at 6.0 mph with 2 minutes at 4.0 mph)
      * 10 minutes on rowing machine
      * 5 minutes cool-down
      
      ### Advanced Cardio Routine
      * 5 minutes dynamic stretching
      * 30 minutes high-intensity interval training (alternate 1 minute sprint with 1 minute rest)
      * 15 minutes stair climber
      * 5 minutes cool-down
      
      ## Cardio Benefits
      
      Regular cardio exercise at the ASU gym can provide numerous benefits:
      
      * Improved heart health
      * Weight management
      * Increased lung capacity
      * Reduced stress levels
      * Better sleep quality
      * Enhanced immune function
      
      ## Best Times for Cardio
      
      The cardio area tends to be less crowded during:
      * Early mornings (6:00 AM - 8:00 AM)
      * Mid-afternoons (2:00 PM - 4:00 PM)
      * Late evenings (8:00 PM - 10:00 PM)
    `
  },
  {
    title: "Strength Training Guide for ASU Students",
    description: "Complete guide to strength training facilities and routines at Angelo State University gym",
    pageType: "fitness",
    content: `
      # Strength Training at ASU Gym
      
      The Angelo State University gym provides excellent facilities for strength training, catering to all experience levels.
      
      ## Available Equipment
      
      ### Free Weights
      * Dumbbells (5-100 lbs)
      * Barbells and weight plates
      * Kettlebells (10-70 lbs)
      * Olympic lifting platforms (4)
      
      ### Machines
      * Leg press
      * Chest press
      * Shoulder press
      * Lat pulldown
      * Cable machines
      * Smith machines
      * Leg extension/curl
      * Abdominal machines
      
      ## Recommended Routines
      
      ### Beginner Full-Body Workout
      * Dumbbell squats: 3 sets of 12
      * Chest press machine: 3 sets of 10
      * Lat pulldown: 3 sets of 10
      * Shoulder press machine: 2 sets of 12
      * Leg curl: 2 sets of 15
      * Plank: 3 sets of 30 seconds
      
      ### Intermediate Push/Pull/Legs Split
      
      #### Push Day
      * Bench press: 4 sets of 8-10
      * Shoulder press: 3 sets of 8-10
      * Incline dumbbell press: 3 sets of 10-12
      * Tricep pushdown: 3 sets of 12-15
      * Lateral raises: 3 sets of 15
      
      #### Pull Day
      * Deadlifts: 4 sets of 8
      * Pull-ups or assisted pull-ups: 3 sets of 8-10
      * Seated rows: 3 sets of 10-12
      * Bicep curls: 3 sets of 12
      * Face pulls: 3 sets of 15
      
      #### Legs Day
      * Squats: 4 sets of 8-10
      * Leg press: 3 sets of 10-12
      * Romanian deadlifts: 3 sets of 10
      * Leg extensions: 3 sets of 12-15
      * Calf raises: 4 sets of 15-20
      
      ## Strength Training Guidelines
      
      * Always warm up properly before lifting
      * Start with lighter weights to perfect form
      * Gradually increase weight as strength improves
      * Rest 48 hours before training the same muscle group
      * Use a spotter for heavy lifts
      * Clean equipment after use
      
      ## Personal Training
      
      ASU Gym offers personal training services for students interested in personalized strength programs:
      * Single session: $25
      * 5-session package: $100
      * 10-session package: $180
      
      Contact the gym front desk to schedule with a certified personal trainer.
    `
  },
  {
    title: "Nutrition Guide for ASU Student Athletes",
    description: "Nutrition advice and meal planning for Angelo State University athletes and fitness enthusiasts",
    pageType: "fitness",
    content: `
      # Nutrition Guide for ASU Student Athletes
      
      Proper nutrition is essential for athletic performance and recovery. This guide provides nutrition recommendations for Angelo State University students.
      
      ## Pre-Workout Nutrition
      
      Eat 1-3 hours before exercise:
      
      ### Meal Options
      * Oatmeal with banana and honey
      * Whole grain toast with peanut butter
      * Greek yogurt with berries
      * Chicken with rice and vegetables
      * Protein smoothie with fruit
      
      ### Key Nutrients
      * Carbohydrates: 0.5-1g per kg of body weight
      * Protein: 15-20g
      * Low fat content
      * Adequate hydration
      
      ## During Exercise
      
      For workouts lasting longer than 60 minutes:
      
      * Water or sports drink (depending on intensity)
      * 30-60g carbohydrates per hour for extended exercise
      * Electrolyte replacement for intense training
      
      ## Post-Workout Nutrition
      
      Consume within 30-60 minutes after exercise:
      
      ### Recovery Options
      * Chocolate milk
      * Protein shake with banana
      * Chicken or tuna sandwich
      * Greek yogurt with fruit and granola
      * Eggs on toast with avocado
      
      ### Key Nutrients
      * Protein: 20-25g to repair muscles
      * Carbohydrates: 1g per kg of body weight to replenish glycogen
      * Electrolytes to replace those lost in sweat
      
      ## Meal Planning
      
      ### Sample Day (Moderate Training)
      
      #### Breakfast
      * 3 eggs scrambled
      * 2 slices whole grain toast
      * 1 cup berries
      * Water or coffee
      
      #### Mid-Morning Snack
      * Greek yogurt with honey
      * Handful of almonds
      
      #### Lunch
      * 6oz grilled chicken breast
      * 1 cup brown rice
      * 2 cups mixed vegetables
      * 1 tablespoon olive oil
      * Water
      
      #### Pre-Workout Snack
      * Banana with peanut butter
      * Water
      
      #### Post-Workout
      * Protein shake with milk and fruit
      
      #### Dinner
      * 6oz salmon
      * Sweet potato
      * Large salad with olive oil dressing
      * Water
      
      #### Evening Snack
      * Cottage cheese with fruit
      
      ## Hydration Guidelines
      
      * Daily minimum: Half your body weight (lbs) in ounces of water
      * Before exercise: 16-20oz 2-3 hours before, 8oz 15 minutes before
      * During exercise: 7-10oz every 10-20 minutes
      * After exercise: 16-24oz for every pound lost during exercise
      
      ## Campus Dining Options
      
      ASU Food Court offers several healthy options:
      * Grilled chicken options
      * Fresh salad bar
      * Protein smoothies at the juice bar
      * Vegetable sides
      * Whole grain options
      
      ## Supplements
      
      Common supplements for student athletes:
      * Protein powder
      * Creatine
      * Multivitamins
      * Fish oil
      * Vitamin D
      
      Consult with a sports nutritionist before starting any supplement regimen.
    `
  }
];

const sportsData = [
  {
    title: "ASU Intramural Sports Programs",
    description: "Overview of intramural sports offered at Angelo State University",
    pageType: "sports",
    content: `
      # ASU Intramural Sports Programs
      
      Angelo State University offers a wide range of intramural sports programs for students of all skill levels.
      
      ## Available Sports
      
      ### Fall Semester
      * Flag Football
      * Volleyball (indoor)
      * Soccer
      * Tennis
      * Basketball 3v3 tournament
      * Ping Pong
      
      ### Spring Semester
      * Basketball (5v5)
      * Softball
      * Volleyball (sand)
      * Dodgeball
      * Ultimate Frisbee
      * Racquetball
      
      ### Year-Round
      * Esports leagues
      * Chess
      * Table Tennis
      
      ## Registration Process
      
      1. Create an account on IMLeagues.com/angelostate
      2. Select your desired sport
      3. Join as a free agent or create/join a team
      4. Pay the registration fee ($5-$20 depending on sport)
      5. Attend the mandatory captain's meeting
      
      ## Competition Levels
      
      * Recreational: For fun and casual play
      * Competitive: More serious competition
      * Co-Rec: Mixed gender teams with modified rules
      
      ## Facilities
      
      * Ben Kelly Center for Human Performance
      * Massie Baseball Fields
      * ASU Soccer Field
      * Outdoor basketball courts
      * Indoor gymnasium
      * Racquetball courts
      
      ## Important Dates (2023-2024)
      
      * Fall Registration: August 28 - September 8
      * Spring Registration: January 15 - January 26
      * Championship Tournaments: End of each season
      
      ## Eligibility
      
      * Must be a currently enrolled ASU student
      * Faculty and staff are eligible with recreation membership
      * Must present valid ASU ID before each game
      * Varsity athletes cannot play in their sport of expertise
      
      ## Contact Information
      
      * Email: intramurals@angelo.edu
      * Phone: (325) 942-2034
      * Office: Ben Kelly Center, Room 133
    `
  },
  {
    title: "ASU Rams and Rambelles: Varsity Athletics",
    description: "Information about Angelo State University's NCAA Division II athletic programs",
    pageType: "sports",
    content: `
      # ASU Rams and Rambelles: Varsity Athletics
      
      Angelo State University competes at the NCAA Division II level in the Lone Star Conference.
      
      ## Sports Programs
      
      ### Men's Sports
      * Football
      * Basketball
      * Baseball
      * Track & Field (Indoor/Outdoor)
      * Cross Country
      
      ### Women's Sports
      * Basketball
      * Soccer
      * Softball
      * Volleyball
      * Track & Field (Indoor/Outdoor)
      * Cross Country
      * Tennis
      * Golf
      
      ## Athletic Facilities
      
      ### LeGrand Stadium at 1st Community Credit Union Field
      * Home to Rams Football
      * 6,000 capacity
      * Artificial turf
      * Located on Jackson Street
      
      ### Junell Center/Stephens Arena
      * Home to basketball and volleyball
      * 5,500 capacity
      * Located on Victory Lane
      
      ### Foster Field at 1st Community Credit Union Stadium
      * Home to Rams Baseball
      * 4,200 capacity
      * Located on Jackson Street
      
      ### Mayer Field
      * Home to Rambelles Softball
      * 750 capacity
      * Located on Jackson Street
      
      ### ASU Soccer Field
      * Home to Rambelles Soccer
      * Located near Foster Field
      
      ## Game Attendance
      
      * Students get in free with valid ASU ID
      * Faculty/Staff: $8
      * General Public: $10
      * Season passes available at the Athletic Department
      
      ## Athletic Achievements
      
      * Football: Lone Star Conference Champions (2018)
      * Men's Track & Field: NCAA DII National Champions (2009)
      * Softball: NCAA DII National Champions (2004)
      * Volleyball: NCAA Regional Champions (2019)
      
      ## Athletic Scholarships
      
      For scholarship information:
      * Contact the Athletic Department: (325) 942-2264
      * Email: athletics@angelo.edu
      * Visit the coaching staff of your specific sport
      
      ## Support Programs
      
      * Blue & Gold Club: Athletic booster organization
      * Student Athletic Advisory Committee
      * Athletic training services
      * Academic support for student-athletes
      
      ## Social Media
      
      * Twitter: @ASURams, @ASURambelles
      * Instagram: @angelostatesports
      * Facebook: Angelo State Athletics
      
      ## Contact Information
      
      Athletic Department:
      * Phone: (325) 942-2264
      * Email: athletics@angelo.edu
      * Office: Junell Center, Second Floor
    `
  },
  {
    title: "Sports Facilities at Angelo State University",
    description: "Detailed information about sports facilities available at ASU",
    pageType: "sports",
    content: `
      # Sports Facilities at Angelo State University
      
      Angelo State University offers modern sports facilities for both varsity athletes and the general student population.
      
      ## Ben Kelly Center for Human Performance (CHP)
      
      The hub of recreational sports on campus.
      
      ### Main Gymnasium
      * 3 full basketball courts
      * 6 volleyball courts
      * Retractable seating for events
      * Available for drop-in play when not scheduled
      
      ### Weight Room
      * 5,000 sq. ft strength training area
      * Free weights and machine stations
      * Olympic lifting platforms
      * Specialized equipment for athletic teams
      
      ### Fitness Center
      * 40+ cardio machines
      * Circuit training equipment
      * Stretching area
      * Personal training space
      
      ### Natatorium
      * 25-yard indoor pool
      * 8 lanes
      * Diving board
      * Accessible entry options
      * Open swim hours daily
      
      ### Racquetball Courts
      * 6 regulation courts
      * Equipment rental available
      * Reservation system for students
      
      ## Outdoor Facilities
      
      ### Multipurpose Fields
      * Located behind the CHP
      * Used for flag football, soccer, and ultimate frisbee
      * Lighted for evening play
      * Available for drop-in use when not scheduled
      
      ### Tennis Courts
      * 12 lighted courts
      * Resurfaced in 2021
      * Located near the CHP
      * Open daily from 6am-10pm
      
      ### Sand Volleyball Courts
      * 4 regulation sand courts
      * Located near the residence halls
      * Nets provided year-round
      
      ### Disc Golf Course
      * 9-hole course
      * Located on the east side of campus
      * Free access for all students
      
      ## Specialized Athletic Facilities
      
      ### Junell Center Performance Center
      * 10,000 sq. ft training facility
      * Sports medicine center
      * Rehabilitation equipment
      * Team meeting rooms
      * Limited to varsity athletes
      
      ### Indoor Practice Facility
      * Full-sized turf field
      * Climate controlled
      * Used by football and soccer programs
      * Special event access for students
      
      ## Equipment Rental
      
      The CHP front desk offers equipment rental for students:
      * Basketballs, volleyballs, soccer balls
      * Tennis and racquetball equipment
      * Flag football belts
      * Disc golf sets
      
      Student ID required for all rentals.
      
      ## Facility Hours
      
      ### Academic Year
      * Monday-Thursday: 6:00am - 11:00pm
      * Friday: 6:00am - 8:00pm
      * Saturday: 9:00am - 6:00pm
      * Sunday: 1:00pm - 8:00pm
      
      ### Summer and Breaks
      * Monday-Friday: 8:00am - 7:00pm
      * Saturday: 10:00am - 5:00pm
      * Sunday: Closed
      
      Hours may vary during holidays and special events.
    `
  }
];

const asuData = [
  {
    title: "Angelo State University History and Overview",
    description: "General information about Angelo State University, its history, and campus",
    pageType: "general",
    content: `
      # Angelo State University: An Overview
      
      Angelo State University (ASU) is a public university located in San Angelo, Texas, and is part of the Texas Tech University System.
      
      ## Historical Background
      
      * Founded in 1928 as San Angelo Junior College
      * Became Angelo State College in 1965
      * Achieved university status in 1969 as Angelo State University
      * Joined the Texas Tech University System in 2007
      
      ## Campus
      
      * Located on 268 acres in San Angelo, Texas
      * Features over 60 buildings
      * Known for its Spanish Colonial Revival architecture
      * Home to the iconic granite "Angelo State University" sign
      * Houses the 1 Million Acres display showcasing West Texas ranching
      
      ## Academics
      
      * Offers over 100 majors and concentrations
      * 41 undergraduate degrees
      * 28 graduate degrees
      * 1 doctoral program
      * Student-to-faculty ratio of 17:1
      * Average class size of 26 students
      
      ## Colleges and Departments
      
      * Archer College of Health and Human Services
      * College of Arts and Humanities
      * College of Education
      * College of Science and Engineering
      * Norris-Vincent College of Business
      * College of Graduate Studies and Research
      
      ## Student Body
      
      * Approximately 10,000 students
      * Students from 46 states and 28 countries
      * 55% female, 45% male
      * Diverse student population
      * 80% of students receive financial aid
      
      ## Campus Life
      
      * Over 100 student organizations
      * Active Greek life with fraternities and sororities
      * Numerous cultural and academic events
      * Ram Jam and other campus traditions
      * Robust intramural sports program
      
      ## Athletics
      
      * NCAA Division II
      * Member of the Lone Star Conference
      * Mascots: Rams (men's teams) and Rambelles (women's teams)
      * 13 varsity sports
      * Colors: Blue and Gold
      
      ## Notable Features
      
      * Angelo State University Museum of Fine Arts
      * ASU Planetarium
      * LeGrand Center for Professional Development
      * Porter Henderson Library with over 1.7 million items
      * Formal Gardens with water features and sculptures
      
      ## Notable Alumni
      
      * Phil Danaher - Record-holding high school football coach
      * Alvin New - Former CEO of Town & Country Food Stores
      * Jay Novacek - Former NFL tight end
      * Pierce Holt - Former NFL defensive end
      * Bonnie Suggs - Renowned educator
      
      ## Contact Information
      
      * Address: 2601 W. Avenue N, San Angelo, TX 76909
      * Phone: (325) 942-2555
      * Website: www.angelo.edu
      * Email: info@angelo.edu
    `
  },
  {
    title: "Student Services at Angelo State University",
    description: "Information about student services and resources available at ASU",
    pageType: "general",
    content: `
      # Student Services at Angelo State University
      
      Angelo State University offers comprehensive support services to help students succeed academically and personally.
      
      ## Academic Support
      
      ### Tutoring Center
      * Located in the Porter Henderson Library
      * Free tutoring for most subjects
      * Both appointment and walk-in options
      * Group study sessions
      * Online tutoring available
      
      ### Writing Center
      * Help with papers, essays, and writing assignments
      * Assistance with citation styles
      * Editing and proofreading guidance
      * Workshops throughout the semester
      * Located in the Library Learning Commons
      
      ### Supplemental Instruction
      * Peer-led study sessions for difficult courses
      * Regular weekly meetings
      * Focus on high-risk STEM and business classes
      * Improves grades by average of 0.5 GPA points
      
      ### Testing Center
      * Accommodated testing
      * Make-up exams
      * Placement tests
      * Located in the Academic Building
      
      ## Career Development
      
      ### Career Development Office
      * Resume and cover letter assistance
      * Interview preparation
      * Career fairs (Fall and Spring)
      * Internship opportunities
      * Job search strategies
      * Located in the Houston Harte University Center
      
      ### Handshake Platform
      * Online job board
      * Employer connection portal
      * Interview scheduling
      * Career event registration
      
      ## Health and Wellness
      
      ### University Health Clinic
      * Primary care services
      * Immunizations
      * Laboratory services
      * Women's health
      * Located in the University Center
      
      ### Counseling Services
      * Individual therapy
      * Group counseling
      * Crisis intervention
      * Stress management workshops
      * 10 free sessions per academic year
      
      ### Recreational Facilities
      * Ben Kelly Center for Human Performance
      * Intramural fields
      * Swimming pool
      * Group fitness classes
      
      ## Student Life Resources
      
      ### Multicultural Center
      * Cultural programming
      * Diversity education
      * Support for underrepresented students
      * Located in the University Center
      
      ### Student Disability Services
      * Academic accommodations
      * Assistive technology
      * Note-taking services
      * Testing accommodations
      * Located in the Academic Building
      
      ### Veterans Educational and Transitional Services (VETS) Center
      * GI Bill processing
      * Academic support for veterans
      * Transition assistance
      * Located in the University Center
      
      ## Technology Services
      
      ### Information Technology
      * Campus WiFi
      * Computer labs
      * Technical support
      * Software access
      * Printing services
      
      ### Porter Henderson Library
      * Research assistance
      * 24/7 online resources
      * Interlibrary loan
      * Study spaces
      * Technology checkout
      
      ## Financial Services
      
      ### Financial Aid Office
      * Scholarship information
      * FAFSA assistance
      * Work-study opportunities
      * Located in the Hardeman Building
      
      ### One Card Office
      * Student ID cards
      * Meal plan management
      * Campus cash deposits
      * Located in the University Center
      
      ## Contact Information
      
      ASU Student Affairs:
      * Phone: (325) 942-2047
      * Email: student.affairs@angelo.edu
      * Office: University Center, Room 112
    `
  },
  {
    title: "Angelo State University Campus Map and Navigation",
    description: "Guide to navigating the ASU campus, including building locations and parking information",
    pageType: "general",
    content: `
      # Angelo State University Campus Map and Navigation
      
      Navigate Angelo State University's campus efficiently with this comprehensive guide.
      
      ## Main Campus Areas
      
      ### Academic Core
      * Centered around the Mayer Administration Building
      * Includes the Porter Henderson Library
      * Most classroom buildings located here
      * Centralized for easy walking between classes
      
      ### Residence Life Area
      * Located on the east side of campus
      * Houses all residence halls and apartments
      * Near dining facilities
      * Adjacent to recreational spaces
      
      ### Athletic Zone
      * Western part of campus
      * Houses all major athletic facilities
      * Includes the Junell Center and LeGrand Stadium
      * Accessible parking for sporting events
      
      ## Key Buildings
      
      ### Administrative Buildings
      * Mayer Administration Building - Central administration, registrar
      * Hardeman Building - Financial aid, business office
      * Sol Mayer Administration Building - President's office
      
      ### Academic Buildings
      * Academic Building - College of Arts and Humanities
      * Archer Health and Human Services Building
      * Cavness Science Building - Biology, Chemistry, Physics
      * Mathematics-Computer Science Building
      * Rassman Building - Business programs
      * Vincent Building - Engineering programs
      
      ### Student Services
      * Houston Harte University Center - Food court, bookstore, meeting spaces
      * Porter Henderson Library - Study spaces, computer labs
      * Ben Kelly Center for Human Performance - Recreation
      
      ### Residence Halls
      * Centennial Village - Freshman housing
      * Carr Hall - Upperclassman housing
      * Massie Residence Halls - Specialty housing
      * Plaza Verde Apartments - Upperclassman housing
      * Texan Hall - Honors housing
      * Vanderventer Apartments - Family housing
      
      ## Parking Areas
      
      ### Student Parking
      * General parking (blue zones) - Available with student permit
      * Residence hall parking (red zones) - For resident students
      * Commuter parking (green zones) - For commuter students
      
      ### Visitor Parking
      * Visitor spots (orange zones) - Limited to 2 hours
      * Pay stations located near the University Center
      * Visitor passes available from University Police
      
      ### Special Parking
      * ADA accessible spaces throughout campus
      * Reserved faculty/staff parking (yellow zones)
      * Special event parking designated during events
      
      ## Transportation Options
      
      ### Ram Tram
      * Free campus shuttle service
      * Routes cover entire campus
      * Operates Monday-Friday, 7:30am-6:00pm
      * Live tracking available via ASU mobile app
      
      ### Bike Racks
      * Located outside most buildings
      * Covered racks available at residence halls
      * Bike registration available through University Police
      
      ### Walking Paths
      * Campus designed to be pedestrian-friendly
      * Most buildings within 10-minute walk of each other
      * Well-lit pathways connect all areas
      
      ## Navigation Tips
      
      * Download the ASU mobile app for interactive maps
      * Blue emergency phones located throughout campus
      * Buildings are numbered on campus maps
      * Information kiosks located at main entrances
      * Cardinal directions often used in giving directions
      
      ## Campus Entrances
      
      * Main Entrance - Johnson Street and Vanderventer Avenue
      * West Entrance - Jackson Street
      * South Entrance - Avenue N
      * East Entrance - Varsity Drive
      
      ## Contact Information
      
      * University Police: (325) 942-2071
      * Visitor Center: (325) 942-2041
      * Campus Facilities: (325) 942-2355
    `
  }
];

// Function to generate an embedding for text
const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

// Function to process and save data
const processAndSaveData = async (data, category, GymData) => {
  console.log(`Processing ${category} data...`);
  
  for (const item of data) {
    try {
      // Create text for embedding (combination of title, description and content)
      const textForEmbedding = `${item.title}
${item.description}
${item.content}`;
      
      // Generate embedding vector
      const vector = await generateEmbedding(textForEmbedding);
      
      // Create document
      const doc = new GymData({
        url: `https://angelo.edu/${category}/${item.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: item.title,
        description: item.description,
        pageType: item.pageType,
        name: item.title,
        content: item.content,
        textForEmbedding: textForEmbedding,
        vector: vector,
        lastUpdated: new Date(),
        metadata: {
          source: 'enrichRagData.js',
          crawlDate: new Date(),
          lastModified: new Date(),
          language: 'en'
        }
      });
      
      // Save to database
      await doc.save();
      console.log(`Added: ${item.title}`);
    } catch (error) {
      console.error(`Error processing ${item.title}:`, error.message);
    }
  }
};

// Main function
async function enrichRagDatabase() {
  let ragConnection;
  
  try {
    console.log('Connecting to RAG database...');
    ragConnection = await connectRAGDB();
    console.log('Connected to RAG database');
    
    // Define the schema
    const gymSchema = new mongoose.Schema({
      url: { 
        type: String, 
        required: true, 
        unique: true,
        index: true,
      },
      title: { 
        type: String, 
        required: true,
      },
      description: {
        type: String,
      },
      pageType: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
      hours: {
        type: Map,
        of: String,
      },
      features: [String],
      equipment: [String],
      rules: [String],
      content: {
        type: String,
      },
      headings: [String],
      textForEmbedding: { 
        type: String, 
        required: true,
      },
      vector: { 
        type: [Number], 
        required: true,
      },
      lastUpdated: { 
        type: Date, 
        default: Date.now,
      },
      metadata: {
        source: String,
        crawlDate: Date,
        lastModified: Date,
        language: {
          type: String,
          default: 'en'
        }
      }
    });
    
    // Create the model
    const GymData = ragConnection.model('GymData', gymSchema);
    
    // Process and save fitness data
    await processAndSaveData(fitnessData, 'fitness', GymData);
    
    // Process and save sports data
    await processAndSaveData(sportsData, 'sports', GymData);
    
    // Process and save ASU general data
    await processAndSaveData(asuData, 'campus', GymData);
    
    // Create vector index if it doesn't exist
    const collections = await ragConnection.db.listCollections().toArray();
    const hasIndex = collections.some(col => col.name === 'gymdata');
    
    if (hasIndex) {
      console.log('Checking for vector index...');
      try {
        // Check if vector index exists, if not create it
        const indexes = await GymData.collection.indexes();
        const vectorIndexExists = indexes.some(idx => idx.name === 'vector_index');
        
        if (!vectorIndexExists) {
          console.log('Creating vector index...');
          await ragConnection.db.command({
            createIndexes: 'gymdata',
            indexes: [
              {
                name: 'vector_index',
                key: { vector: 'vectorSearch' },
                vectorSearchOptions: {
                  dimensions: 1536,
                  similarity: 'cosine'
                }
              }
            ]
          });
          console.log('Vector index created');
        } else {
          console.log('Vector index already exists');
        }
      } catch (error) {
        console.error('Error with vector index:', error);
      }
    }
    
    console.log('\nEnrichment complete!');
    console.log('Added:');
    console.log(`- ${fitnessData.length} fitness documents`);
    console.log(`- ${sportsData.length} sports documents`);
    console.log(`- ${asuData.length} ASU general documents`);
    
    // Close the connection
    await ragConnection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error in enrichRagDatabase:', error);
    if (ragConnection) {
      await ragConnection.close();
    }
    process.exit(1);
  }
}

// Run the function
enrichRagDatabase(); 