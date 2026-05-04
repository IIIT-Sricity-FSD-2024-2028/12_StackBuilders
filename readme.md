## Problem Statement: Wellness Program Management Platform

Modern organizations conduct multiple wellness programs to improve employee mental and physical health. However, these programs are often managed independently, leading to poor coordination, low participation, and limited visibility into their effectiveness. The lack of a unified platform prevents organizations from efficiently organizing, tracking, and optimizing wellness initiatives, thereby limiting their potential benefits.

The objective of the platform is to streamline the management of employee wellness programs by providing a centralized and organized system that enhances accessibility, coordination, and effectiveness.

## Actors
- Employee
- Wellness Expert (Physical Wellness Instructor, Nutritionist, Psychologist)
- HR (Human Resource)
- Administrator

## Planned Features

### Employee
- Access wellness video library
- Join live wellness sessions
- Book consultations with wellness experts
- Participate in challenges and claim rewards

### Wellness Expert
- Conduct and manage live wellness sessions
- Provide consultations to employees
- Upload and manage wellness content

### HR (Human Resource)
- Manage challenges and rewards
- Manage wellness experts and employees

### Administrator
- Manage database
- Configure platform settings

## Project Structure

```text
FFSD/
|-- front-end/
|-- back-end/
|   |-- docs/
|   |   |-- swagger.json
|   |-- src/
`-- Videos/
```

## Prerequisites

- Node.js and npm
- Python 3

## How To Run

### 1. Start the Backend

Open a terminal in `back-end` and run:

```powershell
cd C:\Users\sudee\OneDrive\Desktop\FFSD\back-end
npm.cmd install
npm.cmd run start:dev
```

The backend will run on:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

Swagger will be available at:

- [http://127.0.0.1:3000/api/docs](http://127.0.0.1:3000/api/docs)

### 2. Start the Frontend

Open a second terminal in `front-end` and run:

```powershell
cd C:\Users\sudee\OneDrive\Desktop\FFSD\front-end
python -m http.server 5500
```

The frontend homepage will be available at:

- [http://127.0.0.1:5500/homepage.html](http://127.0.0.1:5500/homepage.html)

## Frontend Demo

Start by signing in as the Super User.

### Super User Credentials

- Gmail: `ravi@gmail.com`
- Password: `1234`

## Important Notes

- The backend uses **NestJS** with **in-memory data structures**.
- There is **no external database**.
- Since the backend is in-memory, data will reset whenever the backend server is restarted.
- Authorization is based on the request header `role`.
- The login system remains frontend-only as required.

## Quick Access Links

- Swagger: [http://127.0.0.1:3000/api/docs](http://127.0.0.1:3000/api/docs)
- Homepage: [http://127.0.0.1:5500/homepage.html](http://127.0.0.1:5500/homepage.html)
