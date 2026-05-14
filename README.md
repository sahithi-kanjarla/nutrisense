# NutriSense

NutriSense is a full-stack digital pantry and nutrition application designed to help users track their meals, manage their pantry inventory, and achieve their health goals. It features real-time progress tracking, AI-powered nutritional analysis, and personalized dietary strategies.

## Features

- **Digital Pantry**: Keep track of ingredients, set expiration dates, and get notifications for expiring items.
- **Meal Logging**: Log daily meals with automated nutritional macro calculation (calories, protein, carbs, fats, fiber).
- **Personalized Insights**: Track your daily progress towards health goals with beautiful, interactive visualizations.
- **AI Chat Assistant**: A dedicated AI chatbot that understands your specific pantry inventory, allergies, and dietary preferences to suggest personalized recipes.
- **Health Profiles**: Store custom dietary preferences, water intake goals, and allergy constraints to guide all AI suggestions.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **UI Components**: Radix UI, Framer Motion, Recharts
- **State Management**: TanStack Query (React Query)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase), Drizzle ORM
- **Authentication**: Passport.js
- **AI Integration**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- PostgreSQL database (Local or Supabase)
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nutrisense.git
   cd nutrisense
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   Ensure you provide `DATABASE_URL`, `SESSION_SECRET`, and `AI_INTEGRATIONS_GEMINI_API_KEY`.

4. Push Database Schema:
   ```bash
   npm run db:push
   ```

5. Start the Development Server:
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License.
