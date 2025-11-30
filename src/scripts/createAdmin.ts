import { User } from '../models/index.js';
import { initializeDatabase } from '../models/index.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const createAdmin = async () => {
    try {
        await initializeDatabase();

        const adminEmail = 'admin@grab-itt.com';
        const adminPassword = 'admin123';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

        const adminUser = await User.findOne({ where: { email: adminEmail } });

        if (adminUser) {
            console.log('Admin user already exists.');
            if (adminUser.role !== 'admin') {
                await adminUser.update({ role: 'admin', passwordHash });
                console.log('Updated existing user to admin role and reset password.');
            } else {
                // Update password just in case
                await adminUser.update({ passwordHash });
                console.log('Updated admin password.');
            }
        } else {
            await User.create({
                name: 'Admin User',
                email: adminEmail,
                role: 'admin',
                provider: 'email',
                firebaseUid: 'admin-uid-123', // Mock UID
                emailVerified: true,
                passwordHash: passwordHash,
            });
            console.log('Admin user created successfully.');
        }

        console.log('----------------------------------------');
        console.log('✅ Admin Credentials Generated:');
        console.log('Email: ' + adminEmail);
        console.log('Password: ' + adminPassword);
        console.log('----------------------------------------');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        process.exit();
    }
};

createAdmin();
