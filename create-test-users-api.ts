// Create test users using the API endpoint
async function createTestUsers() {
  const API_URL = 'https://inmodash-back-production.up.railway.app/api/auth/register'
  const password = 'Lidius@2001'

  const users = [
    {
      email: 'test1@lidius.co',
      name: 'Test User 1',
      password,
      companyName: 'Test Company 1',
    },
    {
      email: 'test2@lidius.co',
      name: 'Test User 2',
      password,
      companyName: 'Test Company 2',
    },
    {
      email: 'test3@lidius.co',
      name: 'Test User 3',
      password,
      companyName: 'Test Company 3',
    },
    {
      email: 'test4@lidius.co',
      name: 'Test User 4',
      password,
      companyName: 'Test Company 4',
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
