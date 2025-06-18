const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_YLxnh9hcD',
      userPoolClientId: '3q9aj2dg61h7nmqphnmu7ipqgs',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        phone: false,
        username: false
      }
    }
  }
};

export default awsConfig;
