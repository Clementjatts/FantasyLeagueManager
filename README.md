# Fantasy League Manager

A comprehensive fantasy league management system built with modern web technologies. This platform enables users to create, manage, and participate in fantasy sports leagues with real-time updates, detailed statistics tracking, and an intuitive user interface.

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
  - Vue.js/Nuxt.js for the user interface
  - TailwindCSS for styling
  - WebSocket for real-time updates

- **Backend**
  - Node.js/Express.js server
  - PostgreSQL database for data storage
  - Redis for caching
  - WebSocket server for real-time features

- **Infrastructure**
  - Deployed on Cloud Run
  - Docker containerization
  - CI/CD pipeline for automated deployments

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- PostgreSQL (v16)
- npm or yarn package manager

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/fantasy-league-manager.git
   cd fantasy-league-manager
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:5000
- Development tools: Various ports (see .replit configuration)

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run linting

### Project Structure
```
fantasy-league-manager/
├── client/            # Frontend Vue.js application
├── server/            # Backend Node.js application
├── database/          # Database migrations and seeds
├── tests/            # Test files
└── docs/             # Documentation
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
- Project Link: [https://github.com/Clementjatts/fantasy-league-manager](https://github.com/Clementjatts/fantasy-league-manager)
- Developer: [@Clementjatts](https://github.com/Clementjatts)

## Acknowledgments
- Thanks to all contributors who participate in this project
- Special thanks to the open source community for the tools and libraries used in this project
