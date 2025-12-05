// Clean subscriptions using the Railway API
async function cleanSubscriptions() {
  const API_URL = 'https://inmodash-back-production.up.railway.app'

  try {
    console.log('🧹 Cleaning all subscriptions via API...')

    // You'll need to create a temporary endpoint in the backend
    // For now, let's just show the SQL commands you can run manually

    console.log('\n📝 Run these SQL commands in Railway dashboard:')
    console.log('\n1. Go to: https://railway.app → Your Project → PostgreSQL → Query')
    console.log('\n2. Run these commands:\n')
    
    console.log('-- Delete all subscription payments')
    console.log('DELETE FROM subscription_payments;')
    console.log('')
    console.log('-- Delete all subscriptions')
    console.log('DELETE FROM subscriptions;')
    console.log('')
    console.log('-- Reset user subscription status')
    console.log('UPDATE users SET')
    console.log('  "subscriptionStatus" = NULL,')
    console.log('  "subscriptionPlan" = NULL,')
    console.log('  "subscriptionStartDate" = NULL,')
    console.log('  "subscriptionEndDate" = NULL,')
    console.log('  "lastPaymentDate" = NULL,')
    console.log('  "nextPaymentDate" = NULL;')
    console.log('')
    console.log('✅ Done! Copy and paste these commands in Railway.')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

cleanSubscriptions()
