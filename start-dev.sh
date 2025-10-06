#!/bin/bash

echo "========================================"
echo "Healthcare SaaS Platform - Development"
echo "========================================"
echo

echo "Starting Backend Server (NestJS)..."
echo "Port: 3001"
cd backend
npm run start:dev &
BACKEND_PID=$!

echo "Waiting for backend to initialize..."
sleep 5

echo "Starting Frontend Server (React)..."
echo "Port: 3000"
cd ../admin-panel
npm start &
FRONTEND_PID=$!

echo
echo "========================================"
echo "Development servers are starting..."
echo
echo "Backend API: http://localhost:3001"
echo "Frontend Admin Panel: http://localhost:3000"
echo "API Documentation: http://localhost:3001/api/docs"
echo
echo "========================================"
echo
echo "Default Login Credentials:"
echo "Email: admin@healthcare-platform.com"
echo "Password: Admin123!"
echo
echo "========================================"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop servers
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
