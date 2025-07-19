# This script sets environment variables for local development and starts the Vite dev server.
# It should NOT be committed to Git. It will be added to .gitignore automatically.

# --- Set Environment Variables ---
# Replace these with your actual Stripe keys from Cloudflare dashboard
$env:STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
$env:STRIPE_PRO_PRICE_ID="price_your_price_id_here" 
$env:VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
$env:PUBLIC_ORIGIN="http://localhost:5173"

Write-Host "Environment variables set for local development"
Write-Host "STRIPE_SECRET_KEY: $($env:STRIPE_SECRET_KEY.Substring(0,10))..."
Write-Host "STRIPE_PRO_PRICE_ID: $env:STRIPE_PRO_PRICE_ID"
Write-Host "VITE_STRIPE_PUBLISHABLE_KEY: $($env:VITE_STRIPE_PUBLISHABLE_KEY.Substring(0,10))..."

# --- Run the development server ---
Write-Host "Starting SimpleDCC development server..."
npm run dev 