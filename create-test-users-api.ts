// Create test users using the API endpoint
async function createTestUsers() {
  const API_URL = 'https://inmodash-back-production.up.railway.app/api/auth/register'
  const password = 'Lidius@2001'

  const users = [
    {
      email: 'test5@lidius.co',
      name: 'Test User 5',
      password,
      companyName: 'Test Company 5',
    },
    {
      email: 'test6@lidius.co',
      name: 'Test User 6',
      password,
      companyName: 'Test Company 6',
    },
    {
      email: 'test7@lidius.co',
      name: 'Test User 7',
      password,
      companyName: 'Test Company 7',
    },
    {
      email: 'test8@lidius.co',
      name: 'Test User 8',
      password,
      companyName: 'Test Company 8',
    },
    {
      email: 'test9@lidius.co',
      name: 'Test User 9',
      password,
      companyName: 'Test Company 9',
    },
  ]

  for (const userData of users) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log(`✅ Created user: ${userData.email} (ID: ${data.user.id})`)
      } else {
        console.log(`❌ Failed to create ${userData.email}: ${data.error}`)
      }
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error)
    }
  }

  console.log('\n🎉 Test user creation completed!')
  console.log('Password for all users: Lidius@2001')
  console.log('\nYou can now login with:')
  users.forEach(u => console.log(`  - ${u.email}`))
}

createTestUsers()
