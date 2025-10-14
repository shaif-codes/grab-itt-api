import { Op } from "sequelize";
import { User, Product, Order, Category, Offer } from "../../models/index.js";

const userHelper = {
  // User methods
  getUser: async (id: string): Promise<any | undefined> => {
    const user = await User.findByPk(id);
    return user?.toJSON();
  },

  getUserByEmail: async (email: string): Promise<any | undefined> => {
    const user = await User.findOne({ where: { email } });
    return user?.toJSON();
  },

  getUserByFirebaseUid: async (
    firebaseUid: string
  ): Promise<any | undefined> => {
    const user = await User.findOne({ where: { firebaseUid } });
    return user?.toJSON();
  },

  getUserByGoogleId: async (
    googleId: string
  ): Promise<any | undefined> => {
    const user = await User.findOne({ where: { googleId } });
    return user?.toJSON();
  },

  getUserByProvider: async (
    provider: 'email' | 'google' | 'facebook' | 'apple',
    identifier: string
  ): Promise<any | undefined> => {
    let whereClause: any = { provider };
    
    switch (provider) {
      case 'email':
        whereClause.email = identifier;
        break;
      case 'google':
        whereClause.googleId = identifier;
        break;
      case 'facebook':
        whereClause.facebookId = identifier;
        break;
      case 'apple':
        whereClause.appleId = identifier;
        break;
    }
    
    const user = await User.findOne({ where: whereClause });
    return user?.toJSON();
  },

  createUser: async (userData: Partial<any>): Promise<any> => {
    const user = await User.create(userData as any);
    return user.toJSON();
  },

  updateUser: async (
    id: string,
    updates: Partial<any>
  ): Promise<any | undefined> => {
    const [affectedCount] = await User.update(updates, { where: { id } });
    if (affectedCount > 0) {
      const user = await User.findByPk(id);
      return user?.toJSON();
    }
    return undefined;
  },

  // Firebase-specific methods
  createOrUpdateFirebaseUser: async (firebaseUserData: {
    firebaseUid: string;
    email: string;
    name: string;
    profilePictureUrl?: string;
    emailVerified?: boolean;
    googleId?: string;
  }): Promise<any> => {
    const { firebaseUid, email, name, profilePictureUrl, emailVerified, googleId } = firebaseUserData;
    
    // Check if user exists by Firebase UID
    let user = await User.findOne({ where: { firebaseUid } });
    
    if (user) {
      // Update existing user
      await user.update({
        name,
        email,
        profilePictureUrl,
        emailVerified: emailVerified || false,
        googleId: googleId || null,
      });
    } else {
      // Check if user exists by email (for account linking)
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        // Link Firebase account to existing user
        await existingUser.update({
          firebaseUid,
          provider: 'google',
          googleId: googleId || null,
          profilePictureUrl,
          emailVerified: emailVerified || false,
        });
        user = existingUser;
      } else {
        // Create new user
        user = await User.create({
          firebaseUid,
          email,
          name,
          provider: 'google',
          googleId: googleId || null,
          profilePictureUrl,
          emailVerified: emailVerified || false,
          role: 'customer',
        });
      }
    }
    
    return user.toJSON();
  },

  linkFirebaseAccount: async (
    userId: string,
    firebaseUid: string,
    googleId?: string
  ): Promise<any | undefined> => {
    const user = await User.findByPk(userId);
    if (!user) return undefined;
    
    await user.update({
      firebaseUid,
      googleId: googleId || null,
      provider: 'google',
    });
    
    return user.toJSON();
  }
};

export default userHelper;
