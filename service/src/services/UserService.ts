import { User, IUser } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { Service } from '../factory/IServiceFactory';

export class UserService implements Service {

  /**
   * Get all users
   */
  async getAllUsers(): Promise<{ users: IUser[], count: number }> {
    try {
      const users = await User.find().select('-__v');
      return {
        users,
        count: users.length,
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error}`);
    }
  }

  /**
   * Get user by user ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ user_id: userId }).select('-__v');
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ user_email: email }).select('-__v');
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user by email: ${error}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userName: string, userEmail: string): Promise<IUser> {
    try {
      // Validate required fields
      if (!userName || !userEmail) {
        throw new Error('user_name and user_email are required');
      }

      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if user with email already exists
      const existingUser = await this.getUserByEmail(userEmail);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser = new User({
        user_id: uuidv4(),
        user_name: userName.trim(),
        user_email: userEmail.toLowerCase().trim(),
      });

      const savedUser = await newUser.save();
      return savedUser;
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string, 
    updates: { user_name?: string; user_email?: string }
  ): Promise<IUser> {
    try {
      const updateData: Partial<IUser> = {};
      
      if (updates.user_name) {
        updateData.user_name = updates.user_name.trim();
      }
      
      if (updates.user_email) {
        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(updates.user_email)) {
          throw new Error('Please enter a valid email address');
        }

        // Check if another user already has this email
        const existingUser = await this.getUserByEmail(updates.user_email);
        if (existingUser && existingUser.user_id !== userId) {
          throw new Error('Another user with this email already exists');
        }

        updateData.user_email = updates.user_email.toLowerCase().trim();
      }

      const updatedUser = await User.findOneAndUpdate(
        { user_id: userId },
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<IUser> {
    try {
      const deletedUser = await User.findOneAndDelete({ user_id: userId });

      if (!deletedUser) {
        throw new Error('User not found');
      }

      return deletedUser;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  /**
   * Check if user exists by ID
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ user_id: userId }).select('user_id');
      return !!user;
    } catch (error) {
      throw new Error(`Failed to check user existence: ${error}`);
    }
  }

  /**
   * Check if email is already taken
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const query: any = { user_email: email.toLowerCase().trim() };
      
      if (excludeUserId) {
        query.user_id = { $ne: excludeUserId };
      }

      const user = await User.findOne(query).select('user_id');
      return !!user;
    } catch (error) {
      throw new Error(`Failed to check email existence: ${error}`);
    }
  }

  /**
   * Get users with pagination
   */
  async getUsersWithPagination(
    limit: number = 20, 
    page: number = 1,
    searchTerm?: string
  ): Promise<{ users: IUser[], total: number, pagination: any }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build search filter
      const filter: any = {};
      if (searchTerm) {
        filter.$or = [
          { user_name: { $regex: searchTerm, $options: 'i' } },
          { user_email: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-__v')
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip);

      const total = await User.countDocuments(filter);

      return {
        users,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users with pagination: ${error}`);
    }
  }

  /**
   * Validate user data
   */
  validateUserData(userData: { user_name?: string; user_email?: string }): string[] {
    const errors: string[] = [];

    if (userData.user_name !== undefined) {
      if (!userData.user_name || userData.user_name.trim().length === 0) {
        errors.push('User name is required');
      } else if (userData.user_name.trim().length > 100) {
        errors.push('User name must be less than 100 characters');
      }
    }

    if (userData.user_email !== undefined) {
      if (!userData.user_email || userData.user_email.trim().length === 0) {
        errors.push('Email is required');
      } else {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(userData.user_email)) {
          errors.push('Please enter a valid email address');
        }
      }
    }

    return errors;
  }
} 