# Harthio

A platform for meaningful conversations with AI-powered matching and moderation. Harthio connects people for scheduled video/voice conversations based on shared topics and interests.

## 🌟 Features

- **User Authentication & Profiles**: Secure email/password registration with comprehensive user profiles
- **Session Management**: Schedule sessions with specific topics and request-to-join system
- **Video Calling**: WebRTC-based video calling with real-time chat capabilities
- **Real-time Updates**: Live messaging and session updates using Supabase real-time
- **Mobile Optimized**: Responsive design that works seamlessly on all devices
- **AI-Powered Features**: Intention-based matching and moderation (planned)

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: React hooks and context
- **Forms**: React Hook Form with Zod validation

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Real-time subscriptions
- **Storage**: Supabase Storage for file uploads

### Communication
- **Video/Voice**: WebRTC with custom signaling service
- **TURN Server**: Coturn for NAT traversal
- **Real-time Chat**: Supabase real-time channels

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/harthio-app.git
cd harthio-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.template .env.local
```

4. Configure your `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Add other required environment variables
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── auth/              # Authentication pages
│   └── session/           # Video calling sessions
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── harthio/          # App-specific components
│   └── common/           # Shared utility components
├── lib/                  # Core utilities and services
│   ├── services/         # Database and API services
│   ├── real-time/        # WebRTC and signaling
│   └── utils/            # Helper functions
└── hooks/                # Custom React hooks
```

## 🔧 Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # TypeScript type checking
```

## 🗄️ Database Setup

The project uses Supabase with PostgreSQL. Database schema and setup scripts are included in the SQL files.

## 🌐 Deployment

The application is designed to be deployed on Vercel with Supabase as the backend.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [harthio.com](https://harthio.com)
- **Documentation**: Coming soon
- **Support**: Create an issue in this repository

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)