import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorIcon from '@mui/icons-material/Error';

function NotFound() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <ErrorIcon sx={{ fontSize: 100, color: 'error.main', mb: 4 }} />
        <Typography variant="h2" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button variant="contained" component={Link} to="/" size="large">
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default NotFound;