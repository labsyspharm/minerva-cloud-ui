<img width="500px" src="./public/Minerva-Cloud_HorizLogo_RGB.svg" />

# Minerva Cloud UI

Administrator user interface for Minerva Cloud. Through the interface, the user is able to:
* View images and repositories
* Manage image and repository access
* Import BioFormats-compatible microscopy images
* Configure channel rendering settings

## Setting up the development environment

* Install NodeJS (recent LTS version should work)
* Run in the project directory: `npm install`

## Configure Minerva Cloud url and Cognito

Update package.json property "proxy" to point to your Minerva Cloud API Gateway address.

```"proxy": "https://<api_gateway_id>.execute-api.<region>.amazonaws.com"```

Update AppConfig.js to contain correct values of region, CognitoUserPoolId and CognitoClientId.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

### `npm run deploy-demo`

Deploys the built app to S3 demo bucket "minerva-admin-demo".
The bucket name can be changed by editing package.json.
Requires that aws command line tools are installed and configured.

To create a hosted website, see AWS CloudFront documentation about how to
host a static website from Amazon S3. You should create a CloudFront distribution, 
that has one origin for the bucket serving static content, and another origin for Minerva Cloud API Gateway. 
A CloudFront behavior should proxy all requests starting with the API Gateway stage (e.g. /dev) 
to the API Gateway. All other requests should be proxied to the bucket.
