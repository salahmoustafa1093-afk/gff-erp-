import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiService } from '@/app/api';

const forgotPasswordValidationSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Email is required'),
});

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: forgotPasswordValidationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      try {
        await apiService.post('/auth/forgot-password', { email: values.email });
        setIsSubmitted(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send reset link';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        px: 3,
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Fade in timeout={500}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 440,
            borderRadius: 3,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {isSubmitted ? (
              /* Success State */
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    backgroundColor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Check Your Email
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  We&apos;ve sent a password reset link to{' '}
                  <strong>{formik.values.email}</strong>. Please check your inbox and follow the
                  instructions to reset your password.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  If you don&apos;t see the email, check your spam folder.
                </Typography>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              /* Form State */
              <>
                <Button
                  component={Link}
                  to="/login"
                  startIcon={<ArrowBackIcon />}
                  sx={{ mb: 2, pl: 0 }}
                  color="inherit"
                >
                  Back to Login
                </Button>

                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Forgot Password?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2.5 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={formik.handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    margin="normal"
                    placeholder="your@email.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={isLoading}
                    InputProps={{
                      sx: { borderRadius: 2 },
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading || !formik.isValid}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
