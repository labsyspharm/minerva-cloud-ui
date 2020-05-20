/*
Configuration file for the Minerva admin client
*/

var AppConfig = {
    region: "us-east-1",
    // Url for the Minerva API Gateway (without stage) 
    minervaBaseUrl: "https://nldzj7hd69.execute-api.us-east-1.amazonaws.com",
    // Stage name for the Minerva API Gateway (e.g. dev, test, prod)
    minervaStage: "dev",
    CognitoUserPoolId: "us-east-1_YuTF9ST4J",
    CognitoClientId: "6ctsnjjglmtna2q5fgtrjug47k"
}

export default AppConfig;