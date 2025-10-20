# Fantasy Premier League Manager

A comprehensive Fantasy Premier League management system built with modern web technologies. This platform connects to the official Fantasy Premier League API to provide real-time player data, statistics, and league management features with an intuitive user interface.

## Features
- **League Management**
  - Create and customize leagues with different scoring systems
  - Set league rules and settings
  - Manage seasons and schedules
  - Invite players and assign roles

- **Team Management**
  - Create and manage multiple teams
  - Set team rosters
  - Player substitutions
  - Team statistics dashboard

- **Player System**
  - Comprehensive player database
  - Real-time player statistics
  - Performance tracking and analysis
  - Player comparison tools

- **Live Features**
  - Real-time scoring updates
  - Live match tracking
  - Instant notifications
  - League chat system

- **Draft System**
  - Automated draft scheduling
  - Live draft interface
  - Draft order management
  - Mock draft functionality

- **Trading System**
  - Player trading platform
  - Trade proposals and negotiations
  - Trade history tracking
  - Trade deadline management

## Technology Stack
- **Frontend**
  - React.js with TypeScript for the user interface
  - Vite for fast development and building
  - TailwindCSS for styling
  - Radix UI components for accessible UI elements
  - Tanstack Query for data fetching and caching

- **Backend**
  - Node.js/Express.js server with TypeScript
  - PostgreSQL database for data storage
  - Drizzle ORM for database operations
  - WebSocket for real-time features

- **Development & Deployment**
  - Originally developed on Replit
  - Local development support
  - GitHub integration for version control

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- PostgreSQL (v16 recommended)
- npm package manager
- Git for version control

### Local Development Setup

#### Quick Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/Clementjatts/FantasyLeagueManager.git
   cd FantasyLeagueManager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install PostgreSQL** (if not already installed)
   ```bash
   # macOS with Homebrew
   brew install postgresql@16
   brew services start postgresql@16

   # Add to PATH
   echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
   ```

4. **Set up database**
   ```bash
   # Create user and database
   createuser -s clementjatts
   createdb -O clementjatts fantasy_league_manager

   # Set password
   psql -d fantasy_league_manager -c "ALTER USER clementjatts WITH PASSWORD '1234567890';"
   ```

5. **Configure environment variables**

   Create a `.env` file in the project root:
   ```env
   # Database connection
   DATABASE_URL=postgresql://clementjatts:1234567890@localhost:5432/fantasy_league_manager

   # Application settings
   NODE_ENV=development
   PORT=4000
   ```

6. **Initialize database schema**
   ```bash
   npm run db:push
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at:
- **Main Application**: http://localhost:4000
- **API Endpoints**: http://localhost:4000/api/*

#### Detailed Setup Guide
For detailed setup instructions, troubleshooting, and additional configuration options, see [LOCAL_SETUP.md](LOCAL_SETUP.md).

## GitHub Integration

### Initial Setup
1. Create a new repository on GitHub
2. Initialize local Git repository (if not already done):
   ```bash
   git init
   ```
3. Add GitHub repository as remote:
   ```bash
   git remote add origin https://github.com/Clementjatts/FantasyLeagueManager.git
   ```

### Required Secrets
To push code to GitHub, you'll need to set up a Personal Access Token:
1. Go to GitHub.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token with 'repo' scope
3. Save the token in your project's secrets as `GITHUB_TOKEN`

### Pushing Updates to GitHub
Changes made in your local project are NOT automatically pushed to GitHub. You need to manually push your changes using these steps:

1. Check what files have changed:
   ```bash
   git status
   ```

2. Stage your changes:
   ```bash
   git add .    # Add all changes
   # OR
   git add filename    # Add specific file
   ```

3. Commit your changes:
   ```bash
   git commit -m "Your commit message describing the changes"
   ```

4. Push to GitHub:
   ```bash
   git push origin main
   ```

### Common Git Commands for Daily Use
- `git status`: Check which files have changed
- `git diff`: See exact changes in files
- `git log`: View commit history
- `git pull`: Get latest changes from GitHub
- `git branch`: List or create branches
- `git checkout`: Switch branches

## Fantasy Premier League Integration

This application connects to the official Fantasy Premier League API to provide:
- Real-time player statistics and performance data
- Current gameweek information
- Player prices and ownership percentages
- Fixture schedules and results
- League standings and player rankings

**Note**: An active internet connection is required for API functionality.

## Troubleshooting

### Common Issues

**Database Connection Problems:**
- Ensure PostgreSQL is running: `brew services start postgresql@16`
- Verify DATABASE_URL in `.env` file is correct
- Check that database and user exist

**Port Already in Use:**
- Kill process using the port: `lsof -ti:4000 | xargs kill -9`
- Or change PORT in `.env` file

**Node Modules Issues:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**TypeScript Errors:**
- Run `npm run check` to see detailed errors
- Ensure all dependencies are installed

## Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Start production server (run `build` first)
- `npm run db:push` - Update database schema
- `npm run check` - Run TypeScript type checking

### Project Structure
```
FantasyLeagueManager/
├── client/                 # Frontend React application
│   ├── src/               # React source files
│   ├── public/            # Static assets
│   └── index.html         # Main HTML file
├── server/                # Backend Node.js application
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   └── vite.ts            # Development server setup
├── db/                    # Database configuration
│   ├── index.ts           # Database connection
│   └── schema.ts          # Database schema definitions
├── docs/                  # Documentation
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Frontend build configuration
├── tailwind.config.ts     # CSS framework configuration
├── drizzle.config.ts      # Database ORM configuration
├── tsconfig.json          # TypeScript configuration
├── LOCAL_SETUP.md         # Detailed local setup guide
└── .env                   # Environment variables (create this)
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
- Project Link: [https://github.com/Clementjatts/FantasyLeagueManager](https://github.com/Clementjatts/FantasyLeagueManager)
- Developer: [@Clementjatts](https://github.com/Clementjatts)

## Acknowledgments
- Thanks to all contributors who participate in this project
- Special thanks to the open source community for the tools and libraries used in this project