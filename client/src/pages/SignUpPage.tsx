import { SignUp } from '@clerk/clerk-react';

const SignUpPage = () => {
  return (
    <SignUp 
      path="/sign-up" 
      routing="path" 
      signInUrl="/sign-in" 
      appearance={{
        variables: {
          colorPrimary: 'hsl(142.1 76.2% 36.3%)' // Verde primario
        }
      }}
    />
  );
};

export default SignUpPage;
