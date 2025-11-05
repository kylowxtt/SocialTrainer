# SocialTrainer

**The all-in-one platform for social media coaches and their clients.**

SocialTrainer is a comprehensive coaching platform built specifically for social media influencers and fitness coaches. It automates the manual work and duct-tape solutions that coaches currently use, providing a unified platform to manage programs, clients, and workouts efficiently.

## 🚀 Features

### For Coaches
- **Program Management**: Create and manage unlimited coaching programs with custom pricing, duration, and capacity limits
- **Client Dashboard**: Track all your clients in one organized dashboard with real-time progress insights
- **Workout Builder**: Create custom workout templates with exercises, sets, reps, and notes
- **Automated Workflows**: Handle enrollments, notifications, and scheduling automatically

### For Clients
- **Program Discovery**: Browse and enroll in programs from top coaches
- **Workout Tracking**: Log workouts with performance metrics and notes
- **Progress Monitoring**: Track your journey and see improvements over time
- **Direct Coach Access**: Stay connected with your coach throughout your program

## 🛠️ Tech Stack

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Authentication**: [NextAuth.js](https://next-auth.js.org)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://prisma.io)
- **API**: [tRPC](https://trpc.io)
- **Type Safety**: End-to-end type safety with TypeScript and tRPC

## 📋 Prerequisites

- Node.js 20.x or later
- PostgreSQL database
- npm or pnpm package manager

## 🏃 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/kylowxtt/SocialTrainer.git
   cd SocialTrainer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   Required environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)

4. **Set up the database**
   
   Start the database (uses Docker):
   ```bash
   ./start-database.sh
   ```
   
   Push the schema to your database:
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format:check` - Check code formatting
- `npm run format:write` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## 🗃️ Database Schema

The application uses the following core models:

- **User**: Base user with authentication
- **CoachProfile**: Extended profile for coaches with bio and social links
- **ClientProfile**: Extended profile for clients with goals
- **Program**: Coaching programs created by coaches
- **Enrollment**: Links clients to programs they've joined
- **Workout**: Workout templates within programs
- **WorkoutLog**: Client workout completion records

## 🔐 Authentication

The app uses NextAuth.js for authentication. To add providers:

1. Configure providers in `src/server/auth/config.ts`
2. Add required environment variables to `.env`
3. Update the Prisma schema if needed

## 🎨 Design Philosophy

SocialTrainer follows modern startup design principles:
- **Clean & Crisp**: Built with shadcn/ui components
- **User-Centric**: Maximizes user inspiration and retention
- **Responsive**: Mobile-first design that works everywhere
- **Accessible**: WCAG compliant with proper ARIA labels

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Links

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
