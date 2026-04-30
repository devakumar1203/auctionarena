require('dotenv').config();
const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('http://localhost:5000/api/auth/verify-email?token=invalid_token');
    console.log('Response:', res.data);
  } catch (err) {
    console.log('Error:', err.response?.data || err.message);
  }
}
run();
