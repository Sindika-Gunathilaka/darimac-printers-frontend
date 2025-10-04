import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { loginUser } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import backgroundImage from '../../assets/TLOFkB.jpg';
import logo from '../../assets/ffc84c26-4b91-42a0-ab12-6199226ed30d.jpg';

const validationSchema = yup.object({
  usernameOrEmail: yup
    .string()
    .required('Username or email is required'),
  password: yup
    .string()
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      usernameOrEmail: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        console.log('Attempting login with:', values); // Debug log
        
        const response = await loginUser(values.usernameOrEmail, values.password);
        
        console.log('Login response:', response); // Debug log
        
        // Handle your backend's response format with accessToken and refreshToken
        if (response && response.accessToken && response.user) {
          // New format: accessToken + refreshToken
          login(response.user, response.accessToken, response.refreshToken);
          navigate('/', { replace: true });
        } else if (response && response.token && response.user) {
          // Fallback for backward compatibility
          login(response.user, response.token, response.refreshToken);
          navigate('/', { replace: true });
        } else {
          console.error('Invalid response structure:', response);
          setError('Invalid response from server. Please try again.');
        }
      } catch (err) {
        console.error('Login error:', err); // Debug log
        
        // Your backend returns { error: "message" } on failure with 401 status
        let errorMessage = 'Login failed. Please try again.';
        
        if (err.response) {
          // Server responded with error status
          const { status, data } = err.response;
          
          if (status === 401) {
            // Unauthorized - invalid credentials
            errorMessage = data?.error || 'Invalid username/email or password.';
          } else if (status === 400) {
            // Bad request
            errorMessage = data?.error || 'Invalid request. Please check your input.';
          } else if (status >= 500) {
            // Server error
            errorMessage = 'Server error. Please try again later.';
          } else {
            // Other errors
            errorMessage = data?.error || data?.message || `Error: ${status}`;
          }
        } else if (err.request) {
          // Network error - no response received
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else {
          // Other error
          errorMessage = err.message || 'An unexpected error occurred.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 2,
        },
      }}
    >
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 3 }}>
        <Box
          sx={{
            paddingTop: 8,
            paddingBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100vh',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={12}
            sx={{
              padding: 4,
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <img
                src={logo}
                alt="Darimac Digital Logo"
                style={{
                  width: '80px',
                  height: '80px',
                  marginBottom: '16px',
                  borderRadius: '8px'
                }}
              />
              <Typography component="h1" variant="h4" align="center" gutterBottom>
                Darimac Digital
              </Typography>
              <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 1 }}>
                Towards Digitalize
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="usernameOrEmail"
                label="Username or Email"
                name="usernameOrEmail"
                autoComplete="username"
                autoFocus
                value={formik.values.usernameOrEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.usernameOrEmail && Boolean(formik.errors.usernameOrEmail)}
                helperText={formik.touched.usernameOrEmail && formik.errors.usernameOrEmail}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !formik.isValid}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Signing in...
                  </Box>
                ) : (
                  'Sign In'
                )}
              </Button>

              <Grid container justifyContent="center">
                <Grid item>
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">
                      Don't have an account? Sign up
                    </Typography>
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;