# Test Orders Endpoint Directly
# This will show the actual error from the backend

Write-Host "`n🔍 Testing Orders Endpoint..." -ForegroundColor Cyan

# Get auth token (you need to be logged in first)
Write-Host "Note: You must be logged in to get a valid token" -ForegroundColor Yellow
Write-Host "Token from localStorage (check browser console):" -ForegroundColor White

# Test the endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/marketplace/orders" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer YOUR_TOKEN_HERE"
        } `
        -UseBasicParsing
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "`n❌ Error Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "`nResponse:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}

