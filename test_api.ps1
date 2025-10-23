$body = @{
    risk_appetite = "Moderate (Balance between safety and returns)"
    investment_timeframe = "Medium-term (1-3 years)"
    monthly_investment = 5000
    experience_level = 2
    loss_tolerance = 1
    current_investments = @("Mutual Funds")
    expected_returns = 2
    management_style = "Through a financial advisor"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/analyze-investment-profile" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success! Response:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
