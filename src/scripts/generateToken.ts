import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'customer',
    provider: 'email'
};

const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

console.log('Token:', token);
console.log('User:', JSON.stringify({
    id: user.id,
    name: 'Test User',
    email: user.email,
    role: user.role,
    provider: user.provider
}));
