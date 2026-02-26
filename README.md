# FiskFollow

**FiskFollow** is a specialized social media web application designed exclusively for the Fisk University community]. Inspired by systems like X and Threads, it provides a dedicated space for students to stay connected, share posts, and receive real-time updates on campus events and student life.

---

## Project Description

The goal of this project is to solve the issue of campus communication being spread across too many broad platforms—like group chats or Instagram—or overlooked emails. FiskFollow centralizes student interaction through a secure, responsive web interface.

### Core Features

- **User Authentication**: Secure student registration and login using Clerk.
- **Interactive Feed**: Create, edit, and delete posts; like and comment on others' content.
- **Social Connections**: Follow and unfollow other users to personalize your feed.
- **Real-Time Updates**: Live updates for posts, likes, and comments via Socket.io.
- **User Profiles**: Custom profiles displaying basic information and post history.

---

## Technologies Used

The application is built using the **MERN stack**, following modern full-stack web architecture:

- **Frontend**: React.js, HTML, CSS (Tailwind CSS), TypeScript.
- **UI Components**: Shadcn UI.
- **Backend**: Node.js and Server Actions.
- **Database**: MongoDB for storing users, posts, and comments.
- **Real-Time Communication**: Socket.io.
- **Authentication**: Using Clerk.
- **Tools**: Git, GitHub, and VS Code.

---

## Setup Instructions

### Prerequisites

- **Node.js** installed on your machine.
- **MongoDB** database (local instance or MongoDB Atlas).
- **Git** for version control.

### Installation

1.  **Clone the repository**:

    ```bash
    git clone [https://github.com/chukwubuikem-onwuchuruba/FiskFollow.git](https://github.com/chukwubuikem-onwuchuruba/FiskFollow.git)
    cd FiskFollow
    ```

2.  **Install dependencies**:

    ```bash
    # Install backend dependencies in the root
    npm install

    # Navigate to the frontend directory and install dependencies
    cd client
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory and add your configuration:
    ```env
    NEXT_CLERK_WEBHOOK_SECRET=
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
    CLERK_SECRET_KEY=
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
    NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/
    MONGODB_URL=
    UPLOADTHING_SECRET=
    UPLOADTHING_APP_ID=
    ```

---

## How to Run the Project

This project is a Next.js project bootstrapped with `create-next-app`.

### 1. Run the Development Server

From the root directory, start the development environment:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
