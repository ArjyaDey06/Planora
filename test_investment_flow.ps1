# Test Investment Analysis Flow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing Investment Analysis Complete Flow" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health Check
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
    Write-Host "   ✓ Backend is healthy" -ForegroundColor Green
    Write-Host "   - Models loaded: $($health.models_loaded)" -ForegroundColor Gray
    Write-Host "   - Dataset loaded: $($health.dataset_loaded)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Investment Analysis Endpoint - Conservative Profile
Write-Host "2. Testing Investment Analysis - Conservative Profile..." -ForegroundColor Yellow
$conservativeData = @{
    risk_appetite = "Low (Prefer safety over returns)"
    investment_timeframe = "Long-term (More than 3 years)"
    monthly_investment = 5000
    experience_level = 1
    loss_tolerance = 0
    current_investments = @("Fixed Deposits")
    expected_returns = 1
    management_style = "Through a financial advisor"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/analyze-investment-profile" -Method POST -Body $conservativeData -ContentType "application/json"
    Write-Host "   ✓ Conservative profile analysis successful" -ForegroundColor Green
    Write-Host "   - Portfolio Type: $($response.portfolio_type)" -ForegroundColor Gray
    Write-Host "   - Risk Profile: $($response.risk_profile_description)" -ForegroundColor Gray
    $conf1 = [math]::Round($response.confidence * 100, 2)
    Write-Host "   - Confidence: $conf1%" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Conservative analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Investment Analysis Endpoint - Aggressive Profile
Write-Host "3. Testing Investment Analysis - Aggressive Profile..." -ForegroundColor Yellow
$aggressiveData = @{
    risk_appetite = "High (Can take risks for higher returns)"
    investment_timeframe = "Long-term (More than 3 years)"
    monthly_investment = 15000
    experience_level = 3
    loss_tolerance = 2
    current_investments = @("Stocks", "Mutual Funds", "Crypto")
    expected_returns = 4
    management_style = "Self-managed"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/analyze-investment-profile" -Method POST -Body $aggressiveData -ContentType "application/json"
    Write-Host "   ✓ Aggressive profile analysis successful" -ForegroundColor Green
    Write-Host "   - Portfolio Type: $($response.portfolio_type)" -ForegroundColor Gray
    Write-Host "   - Risk Profile: $($response.risk_profile_description)" -ForegroundColor Gray
    $conf2 = [math]::Round($response.confidence * 100, 2)
    Write-Host "   - Confidence: $conf2%" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Aggressive analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Investment Analysis Endpoint - Balanced Profile
Write-Host "4. Testing Investment Analysis - Balanced Profile..." -ForegroundColor Yellow
$balancedData = @{
    risk_appetite = "Moderate (Balance between safety and returns)"
    investment_timeframe = "Medium-term (1-3 years)"
    monthly_investment = 10000
    experience_level = 2
    loss_tolerance = 1
    current_investments = @("Mutual Funds", "Fixed Deposits")
    expected_returns = 2
    management_style = "Both"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/analyze-investment-profile" -Method POST -Body $balancedData -ContentType "application/json"
    Write-Host "   ✓ Balanced profile analysis successful" -ForegroundColor Green
    Write-Host "   - Portfolio Type: $($response.portfolio_type)" -ForegroundColor Gray
    Write-Host "   - Risk Profile: $($response.risk_profile_description)" -ForegroundColor Gray
    $confidencePercent = [math]::Round($response.confidence * 100, 2)
    Write-Host "   - Confidence: $confidencePercent%" -ForegroundColor Gray
    Write-Host "   - Number of Recommendations: $($response.recommendations.Count)" -ForegroundColor Gray
    Write-Host "   - Portfolio Allocations: $($response.portfolio_allocation.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Balanced analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Investment Analysis Flow Test Complete!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start frontend: npm run dev" -ForegroundColor White
Write-Host "2. Navigate to Dashboard" -ForegroundColor White
Write-Host "3. Click on 'Investment Guidance' card" -ForegroundColor White
Write-Host "4. Complete the questionnaire" -ForegroundColor White
Write-Host "5. View personalized investment recommendations" -ForegroundColor White
Write-Host ""
