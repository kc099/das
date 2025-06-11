# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

✅ Complete Authentication Setup

  1. API Service (src/services/api.js)

  - Axios configuration with base URL for your Django backend
  - Automatic token attachment to requests
  - Error handling for 401 responses
  - Login/signup/logout endpoints

  2. Authentication Utilities (src/utils/auth.js)

  - Token management in localStorage
  - User data storage/retrieval
  - Authentication status checking

  3. Authentication Context (src/contexts/AuthContext.js)

  - Centralized auth state management
  - Login/signup/logout methods
  - User session persistence

  4. Updated Components

  - Login: Calls api/login/ with email/password, stores token
  - Signup: Calls api/signup/ with username/email/password
  - Error handling, loading states, form validation
  - Automatic redirect to homepage on success

  🔧 Configuration Needed

  Update API URL in src/services/api.js:4:
  const API_BASE_URL = 'http://localhost:8000'; // Change to your Django server

  🔌 Django Backend Requirements

  Your Django backend should return:

  Login Response (POST /api/login/):
  {
    "token": "your-jwt-token",
    "user": {
      "id": 1,
      "username": "user",
      "email": "user@example.com"
    }
  }

  Signup Response (POST /api/signup/):
  {
    "token": "your-jwt-token",
    "user": {
      "id": 1,
      "username": "user",
      "email": "user@example.com"
    }
  }

  🚀 Ready to Use
