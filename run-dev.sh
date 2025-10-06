#!/bin/bash

echo "Starting Healthcare SaaS Platform Development Servers..."
echo

echo "Starting Backend Server (NestJS)..."
cd backend
npm run start:dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting Frontend Server (React)..."
cd ../admin-panel
npm start &
FRONTEND_PID=$!

echo
echo "Development servers are starting..."
echo "Backend API: http://localhost:3001"
echo "Frontend Admin Panel: http://localhost:3000"
echo
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop servers
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
