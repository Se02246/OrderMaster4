import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => {
  return (
    <SignIn 
      path="/sign-in" 
      routing="path" 
      signUpUrl="/sign-up" 
      appearance={{
        variables: {
          colorPrimary: 'hsl(142.1 76.2% 36.3%)' // Verde primario
        }
      }}
    />
  );
};

export default SignInPage;
