 TaskFlow – Collaborative Project Management System

TaskFlow is a full-stack project management application designed to help teams organize projects, manage tasks, collaborate with team members, and track work progress through an intuitive workspace.

 Features

- User Authentication – Secure registration, login, and JWT-based authentication.
- Project Management – Create, view, update, and manage projects.
- Team Collaboration – Add team members and collaborate within projects.
- Task Management– Create, assign, update, and delete tasks.
- Kanban Board – Organize tasks using drag-and-drop columns.
- Task Priorities– Manage tasks with different priority levels.
- Comments – Add and manage comments on tasks.
- Real-Time Notifications – Receive updates when tasks are assigned or comments are added.
- Dashboard – View project statistics and recent activities.
- Team Members– View project members and their details.
- Settings – Update profile information, change passwords, and customize appearance.
- Dark and Light Mode – Switch between themes.

 Technologies Used

 Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Bootstrap Icons
- SweetAlert2

 Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Socket.IO

 Project Structure

```text
TaskFlow/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── css/
    ├── js/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── projects.html
    ├── project-details.html
    ├── tasks.html
    ├── kanban.html
    ├── notifications.html
    ├── team-members.html
    └── settings.html
```

Installation and Setup

 1. Clone the Repository

git clone https://github.com/Dinethimantha/CodeAlpha_TaskFlow.git

 2. Navigate to the Backend


cd CodeAlpha_TaskFlow/backend


 3. Install Dependencies


npm install


 4. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

Add the following configuration:

env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Replace the placeholder values with your own MongoDB connection string and JWT secret.

 5. Start the Backend Server

bash
npm run dev

The backend server will run at:

`http://localhost:5001`

6. Run the Frontend

Open the `frontend` folder using Visual Studio Code and launch `index.html` with the Live Server extension.

 API Base URL

`http://localhost:5001/api`

 Security

- Passwords are hashed using bcryptjs.
- JWT is used for authentication.
- Protected API routes require valid authentication.
- Environment variables are excluded from version control.

 Author

Dineth Imantha Nupehewa

Software Engineering Graduate | Full Stack Developer

GitHub: https://github.com/Dinethimantha

License

This project was developed for educational and portfolio purposes.
