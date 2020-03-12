import React from 'react';
import './css/App.css';
import './css/dashboard.css';
import Header from './components/Header'; 
import ImportTool from './pages/ImportTool';
import Repositories from './pages/Repositories';
import Permissions from './pages/Permissions';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Router, navigate } from "@reach/router";
import Client from './MinervaClient';
import LoginPage from './pages/LoginPage';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from 'amazon-cognito-identity-js';
import AppConfig from './AppConfig';

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false
    }
    this.loginSuccess = this.loginSuccess.bind(this);
    this.logoutSuccess = this.logoutSuccess.bind(this);

    let userPool = new CognitoUserPool({
      UserPoolId: AppConfig.CognitoUserPoolId,
      ClientId: AppConfig.CognitoClientId
    });
    this.state.userPool = userPool;

    var cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                alert(err.message || JSON.stringify(err));
                return;
            }
            this.loginSuccess(cognitoUser);
            let loggedInUser = localStorage.getItem('loggedInUser');
            this.state.loggedInUser = loggedInUser;
            this.state.loggedIn = true;
        });
    } else {
      navigate('/login');
    }
  }

  loginSuccess(user) {
    console.log(user);
    Client.setUser(user);
    Client.getCognitoDetails();
    this.setState({loggedIn: true});
    this.forceUpdate();
    console.log('loginSuccess');

    navigate('/');
  }

  logoutSuccess() {
    this.setState({loggedIn: false});
    this.forceUpdate();
    console.log('logoutSuccess');
    navigate('/login');
  }

  render() {
    return (
      <div className="App text-light">
        <Header logoutSuccess={this.logoutSuccess} loggedIn={this.state.loggedIn} loggedInUser={this.state.loggedInUser} />
        <Router className="container-fluid text-light container-fullheight">
          <LoginPage path="/login" loggedIn={this.state.loggedIn} loginSuccess={this.loginSuccess} userPool={this.state.userPool}/>
          <ImportTool path="/import" loggedIn={this.state.loggedIn}/>
          <Repositories path="/" loggedIn={this.state.loggedIn} />
          <Permissions path="/permissions/:repositoryUuid" loggedIn={this.state.loggedIn} />
          <Permissions path="/permissions" loggedIn={this.state.loggedIn} />
        </Router>
        <footer className="copyright">©2020, Laboratory of Systems Pharmacology. All rights reserved.</footer>
      </div>
    );
  }
}

export default App;
