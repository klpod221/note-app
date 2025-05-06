<div align="center">
    <h1>--// Note-Taking App //--</h1>
    <img src="https://img.shields.io/github/last-commit/klpod221/note-app?style=for-the-badge&color=ffb4a2&labelColor=201a19">
    <img src="https://img.shields.io/github/stars/klpod221/note-app?style=for-the-badge&color=e6c419&labelColor=1d1b16">
    <img src="https://img.shields.io/github/repo-size/klpod221/note-app?style=for-the-badge&color=a8c7ff&labelColor=1a1b1f">
</div>

## About

This is a simple note application that allows you to create, manage, and organize your notes. It is built using Next.js, Ant Design, Mongo database to store the data and Redis to cache the data so you can easily host your app on Vercel for free.

The goal of this project is to provide a simple and easy-to-use note-taking application that can be used by anyone. It is designed to help you capture thoughts, make lists, and keep track of important information.

**This project is in development and is not yet ready for production use.**

## Features

- [x] User authentication
- [x] User registration
- [x] Create, edit, and delete notes
- [x] Organize notes with categories
- [x] Rich text formatting
- [x] Custom markdown editor using [monaco](https://microsoft.github.io/monaco-editor/)
- [ ] Search functionality
- [ ] Responsive design
- [ ] Tags and labels for notes
- [ ] File attachments
- [ ] Offline support
- [ ] Note history and versioning
- [ ] Reminders and notifications
- [ ] Sync notes across devices (real-time)
- [ ] Note sharing and collaboration (real-time)
- [ ] API access for integration with other tools

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Vercel](https://vercel.com/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [Ant Design](https://ant.design/)
- [Tailwind CSS](https://tailwindcss.com/)

## Host your own

1. Fork this repository
2. Go to [Vercel](https://vercel.com/) and create an account
3. Create a new project
4. Connect your GitHub account to Vercel
   - Authorize Vercel to access your GitHub account
   - Select the repository you forked
   - Choose the framework preset as `Next.js`
   - Set the root directory to `note-app`
5. Choose the repository you want to deploy
   - Select the branch you want to deploy (default is `main`)
   - Set the build command to `npm run build`
   - Set the output directory to `out`
   - Set the environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `REDIS_URL`: Your Redis connection string
     - `NEXTAUTH_SECRET`: A random string for NextAuth.js
     - `NEXTAUTH_URL`: The URL of your deployed app
6. Add a redis database on Vercel dashboard Storage tab
7. Set up the environment variables
8. Deploy your app
9. Enjoy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
