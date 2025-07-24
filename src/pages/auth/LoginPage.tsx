import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
  Link,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Computer,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, APP_SETTINGS, VALIDATION_RULES } from '../../constants';
import toast from 'react-hot-toast';

// Validation schema
const loginSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(VALIDATION_RULES.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USERNAME.MAX_LENGTH, `Username must be at most ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`),
  password: yup
    .string()
    .required('Password is required')
    .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`),
});

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      navigate(from, { replace: true });
    }
  }, [state.isAuthenticated, state.isLoading, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      await login(data.username, data.password);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error types
      if (error.status === 401) {
        setError('password', { 
          type: 'manual', 
          message: 'Invalid username or password' 
        });
      } else if (error.status === 403) {
        setError('root', { 
          type: 'manual', 
          message: 'Account is disabled. Please contact administrator.' 
        });
      } else if (error.status === 429) {
        setError('root', { 
          type: 'manual', 
          message: 'Too many login attempts. Please try again later.' 
        });
      } else {
        setError('root', { 
          type: 'manual', 
          message: error.message || 'Login failed. Please try again.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (state.isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              color: 'white',
              textAlign: 'center',
              py: 4,
              px: 3,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'white',
                color: 'primary.main',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Computer sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h4" gutterBottom fontWeight="bold">
              {APP_SETTINGS.NAME}
            </Typography>
            
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {APP_SETTINGS.DESCRIPTION}
            </Typography>
          </Box>

          {/* Login Form */}
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              textAlign="center"
              color="textPrimary"
              sx={{ mb: 3 }}
            >
              Sign In to Your Account
            </Typography>

            {/* Global error message */}
            {errors.root && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.root.message}
              </Alert>
            )}

            {/* Login form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Username"
                    margin="normal"
                    autoComplete="username"
                    autoFocus
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    margin="normal"
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={<LoginIcon />}
                sx={{
                  py: 1.5,
                  mb: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Additional options */}
              <Box textAlign="center" sx={{ mt: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Please contact your administrator for password reset.');
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  Forgot your password?
                </Link>
              </Box>
            </Box>
          </CardContent>

          {/* Footer */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              textAlign: 'center',
              py: 2,
              px: 3,
              borderTop: '1px solid',
              borderTopColor: 'divider',
            }}
          >
            <Typography variant="caption" color="textSecondary">
              © 2024 VirtFlow. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;