# moderate-jokes

Project Title
Moderate Jokes Microservice

Overview
Allows moderators to manage jokes.

Technologies
Express.js
MongoDB
Endpoints
POST /login - Authenticate moderator.
GET /jokes - Retrieve jokes for moderation.
PATCH /jokes/:id - Edit a joke.
DELETE /jokes/:id - Reject a joke.
Setup Instructions
Clone the repository:
bash
Copy code
git clone <moderate_microservice_repository_url>
Install dependencies:
bash
Copy code
npm install
Configure .env file:
plaintext
Copy code
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
DATABASE_URL=<your_database_url>
Start the service:
bash
Copy code
npm run start
