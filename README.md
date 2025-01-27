# Academic Resource Hub

A web application for managing and sharing academic papers and resources.

## Features

- Student Portal for accessing academic papers
- Admin Portal for managing papers and subjects
- Real-time search functionality
- Secure file upload and download
- Visit tracking and analytics
- Mobile-responsive design

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **File Storage**: Local storage with Multer
- **Authentication**: JWT

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/KrishnaTolani/FY_PROJECT.git
   cd FY_PROJECT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Access the application:
   - Student Portal: http://localhost:5000
   - Admin Login: http://localhost:5000/admin-login
   - Papers Page: http://localhost:5000/papers

## Admin Access

- Username: admin
- Password: Waheguru@9698

## Project Structure

```
├── backend/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   └── server.js
├── frontend/
│   ├── admin.html
│   ├── student.html
│   ├── papers.html
│   └── styles.css
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 