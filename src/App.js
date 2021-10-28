import React from 'react';
import Header from './components/Header';
import ImportTool from './pages/ImportTool';
import RepositoryList from './pages/RepositoryList';
import RepositoryView from './pages/RepositoryView';
import Permissions from './pages/Permissions';
import { Router, navigate } from "@reach/router";
import Client from './MinervaClient';
import LoginPage from './pages/LoginPage';
import {
    CognitoUserPool, CookieStorage
} from 'amazon-cognito-identity-js';
import AppConfig from './AppConfig';
import './css/App.css';
import './css/core.css';
import ImageView from "./pages/ImageView";


class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            loggedIn: false,
            guest: false
        };

        this.loginSuccess = this.loginSuccess.bind(this);
        this.logoutSuccess = this.logoutSuccess.bind(this);

        let userPool = new CognitoUserPool({
            UserPoolId: AppConfig.CognitoUserPoolId,
            ClientId: AppConfig.CognitoClientId,
            Storage: new CookieStorage({domain: ".minerva.im"})
        });
        this.state.userPool = userPool;

        var cognitoUser = userPool.getCurrentUser();
        if (cognitoUser != null) {
            cognitoUser.getSession((err, session) => {
                if (err) {
                    alert(err.message || JSON.stringify(err));
                    cognitoUser.signOut();
                    this.logoutSuccess();
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

    loginSuccess(user, guest = false, navigateRoot = false) {
        Client.setUser(user);
        Client.setGuest(guest);
        this.setState({ loggedIn: true, guest: guest });
        if (guest) {
            this.setState({ loggedInUser: 'Guest' });
        } else {
            this.setState({ loggedInUser: localStorage.getItem('loggedInUser') });
        }
        this.forceUpdate();

        if (navigateRoot) {
            navigate('/repositories');
        }
    }

    logoutSuccess() {
        this.setState({ loggedIn: false });
        this.forceUpdate();
        console.log('logoutSuccess');
        navigate('/login');
    }

    render() {
        let login_state = {
            loggedIn: this.state.loggedIn,
            loggedInUser: this.state.loggedInUser,
            guest: this.state.guest,
            logoutSuccess: this.logoutSuccess
        }
        return (
            <div className="App text-light">
                <Header login_state={login_state}/>
                <Router className="router-container">
                    <LoginPage
                      path="/login"
                      loggedIn={this.state.loggedIn}
                      loginSuccess={this.loginSuccess}
                      userPool={this.state.userPool}
                    />
                    <ImportTool
                      path="/import"
                      loggedIn={this.state.loggedIn}
                    />
                    <RepositoryList
                      default path="/repositories"
                      login_state={login_state}
                    />
                    <RepositoryView
                      path="/repositories/:repositoryUuid"
                      login_state={login_state}
                    />
                    <ImageView
                      path="/images/:imageUuid"
                      login_state={login_state}
                    />
                    <Permissions
                      path="/permissions/:repositoryUuid"
                      loggedIn={this.state.loggedIn}
                    />
                    <Permissions
                      path="/permissions"
                      loggedIn={this.state.loggedIn}
                    />
                </Router>
                <footer className="copyright">
                    ©2020, Laboratory of Systems Pharmacology. All rights reserved.
                </footer>
            </div>
        );
    }
}

export default App;
