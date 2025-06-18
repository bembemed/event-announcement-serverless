# Event Management & Notification System

A full-stack serverless application for event management and real-time notifications, built with modern cloud technologies.

## 🎥 Demo

You can watch the demo video [here](https://raw.githubusercontent.com/bembemed/event-announcement-serverless/master/main/screen-capture%20(1).webm)

## 🏗️ Architecture

![Architecture Diagram](https://raw.githubusercontent.com/bembemed/event-announcement-serverless/master/architecture.png)

## 📋 Project Structure

This repository contains two main components:

### [Frontend Application](./event)
A Next.js application providing the user interface for event management.

- User authentication with Cognito
- Event submission and management
- Subscription management
- Real-time notifications
- Responsive design

### [Backend Services](./event%20announcement)
A serverless backend built with AWS SAM, providing the API and event processing.

- Event storage and retrieval
- Email notifications
- Subscription management
- Security and rate limiting
- CORS-enabled endpoints

## 🔧 Tech Stack

### Frontend
- Next.js 15+
- TypeScript
- AWS Amplify
- Tailwind CSS
- Radix UI Components

### Backend
- AWS Lambda
- Amazon S3
- Amazon SNS
- API Gateway
- DynamoDB
- AWS SAM

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- AWS Account
- AWS SAM CLI
- AWS Amplify CLI

### Backend Setup
1. Navigate to the backend directory:
```bash
cd "event announcement"
```

2. Install dependencies:
```bash
npm install
```

3. Build and deploy:
```bash
sam build
sam deploy --guided
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd event
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
# Create .env.local with required variables
NEXT_PUBLIC_API_URL=<your-api-gateway-url>
NEXT_PUBLIC_USER_POOL_ID=<your-cognito-user-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<your-cognito-client-id>
NEXT_PUBLIC_AWS_REGION=<your-aws-region>
```

4. Run the development server:
```bash
npm run dev
```

## 🔐 Security Features

- Cognito Authentication
- JWT Token Validation
- CORS Protection
- API Rate Limiting
- Secure Event Storage

## 📱 Features

### Event Management
- Create and submit events
- View personal events
- Browse all events
- Customizable event feed

### Subscription System
- Subscribe to event notifications
- Follow event organizers
- Email notifications
- Real-time updates

### User Management
- Secure authentication
- Profile management
- Subscription management
- Event history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- AWS for the robust cloud infrastructure
- Tailwind and Radix UI for the beautiful components
