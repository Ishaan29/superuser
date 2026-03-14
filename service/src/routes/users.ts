import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';

const router = Router();
const userService = new UserService();

// GET /api/users - Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, page, search } = req.query;
    
    if (limit || page || search) {
      // Use pagination if query params provided
      const result = await userService.getUsersWithPagination(
        Number(limit) || 20,
        Number(page) || 1,
        search as string
      );
      
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } else {
      // Get all users without pagination
      const result = await userService.getAllUsers();
      res.json({
        success: true,
        data: result.users,
        count: result.count,
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

// GET /api/users/:userId - Get user by ID
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_name, user_email } = req.body;
    
    // Validate input data
    const validationErrors = userService.validateUserData({ user_name, user_email });
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      });
      return;
    }
    
    const savedUser = await userService.createUser(user_name, user_email);
    
    res.status(201).json({
      success: true,
      data: savedUser,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
      
      if (error.message.includes('required') || error.message.includes('valid email')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
});

// PUT /api/users/:userId - Update user
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { user_name, user_email } = req.body;
    
    const updates: { user_name?: string; user_email?: string } = {};
    if (user_name) updates.user_name = user_name;
    if (user_email) updates.user_email = user_email;
    
    // Validate input data
    const validationErrors = userService.validateUserData(updates);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      });
      return;
    }
    
    const updatedUser = await userService.updateUser(userId, updates);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      
      if (error.message.includes('already exists') || error.message.includes('valid email')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

// DELETE /api/users/:userId - Delete user
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const deletedUser = await userService.deleteUser(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

export { router as userRoutes }; 