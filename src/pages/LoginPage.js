import React from 'react';
import '../css/LoginPage.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import {
    CognitoUser,
    AuthenticationDetails
} from 'amazon-cognito-identity-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faBackward, faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons'
import Client from '../MinervaClient';
import AppConfig from '../AppConfig';
import AWS from 'aws-sdk';

class LoginPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loggedIn: false,
            loggedInUser: null,
            warning: null,
            loginSpinner: false,
            showLoginForm: true,
            showPasswordChange: false,
            password: null,
            passwordConfirmation: null,
            forcedPasswordResponse: null
        };

        this.login = this.login.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.enterPressed = this.enterPressed.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.anonymousLogin = this.anonymousLogin.bind(this);
    }

    changePassword() {
        if (this.state.password !== this.state.passwordConfirmation) {
            this.setState({warning: 'New password and confirmation do not match.'});
            return;
        }
        console.log(this.state.forcedPasswordResponse);
        let userAttributes = this.state.forcedPasswordResponse.fields;
        userAttributes.name = userAttributes.email;
        userAttributes.preferred_username = userAttributes.name;
        delete userAttributes.email_verified;
        this.state.cognitoUser.completeNewPasswordChallenge(this.state.password, userAttributes, {
            onSuccess: (data, cognitoUser) => this.passwordChallengeSuccess(data, cognitoUser),
            onFailure: err => {
                console.error(err);
                this.setState({warning: 'Password must contain one lowercase, uppercase, number and special character.'});
            }
          });
    }

    passwordChallengeSuccess(data, cognitoUser) {
        this.setState({ loggedIn: true, loggedInUser: this.state.username });
        localStorage.setItem('loggedInUser', this.state.username);
        alertify.success("Login success", 2);
        this.props.loginSuccess(cognitoUser);
        console.log(data);
    }

    handleChange = evt => {
        const value =
            evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.setState({
            ...this.state,
            [evt.target.name]: value
        });
    }

    login = () => {
        const cognitoUser = new CognitoUser({
            Username: this.state.username,
            Pool: this.props.userPool
        });

        const authenticationDetails = new AuthenticationDetails({
            Username: this.state.username,
            Password: this.state.password
        });

        this.setState({loginSpinner: true});

        const auth = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: result => resolve(result),
                onFailure: err => reject(err),
                mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
                newPasswordRequired: (fields, required) => reject({ fields, required })
            });
        });

        this._token = auth
            .then(response => {
                this.setState({ loggedIn: true, loggedInUser: this.state.username, warning: null, loginSpinner: false });
                localStorage.setItem('loggedInUser', this.state.username);
                this.props.loginSuccess(cognitoUser);
            }).catch(err => {
                this.setState({loginSpinner: false});
                if (err.fields && err.required) {
                    this.setState({showLoginForm: false, showPasswordChange: true, 
                                forcedPasswordResponse: err,
                                warning: 'You must update your password before continuing.',
                                cognitoUser: cognitoUser
                            });
                    
                } else {
                    console.error(err);
                    this.setState({warning: 'Invalid Email or Password.'});
                }
            });
    };

    anonymousLogin() {
        const cognitoUser = new CognitoUser({
            Username: '00000000-0000-0000-0000-000000000000',
            Pool: this.props.userPool
        });
        this.props.loginSuccess(cognitoUser, true);
    }

    showLoginForm() {
        this.setState({showPasswordChange: false, showLoginForm: true, warning: ''});
    }

    enterPressed(evt) {
        if (evt.key === "Enter") {
            this.login();
        }
    }

    forgotPassword() {
        if (!this.state.username) {
            alertify.warning('Input your email or phone first.');
            return;
        }
        let cognitoUser = new CognitoUser({
            Username: this.state.username,
            Pool: this.props.userPool
        });

        cognitoUser.forgotPassword({
            onSuccess: (result) => {
                console.log('call result: ' + result);
                this.setState({warning: 'You have been sent an email which contains instructions how to reset your password.'});
            },
            onFailure: (err) => {
                alertify.error(err.message);
            }
        });
    }

    render() {
        return (
            <div className="loginContainer">
                { this.state.showLoginForm ? this.renderLoginForm() : null }
                { this.state.showPasswordChange ? this.renderPasswordChange() : null }
                { this.state.warning ? (
                    <div className="alert alert-warning mt-3" role="alert">
                        {this.state.warning}
                    </div> ) 
                : null }
            </div>
        );
    }

    renderLoginForm() {
        return (
        <form>
            <h2 className="h2 mb-3">MINERVA</h2>
            <div className="loginForm">
            <div className="input-group mb-3">
                <div class="input-group-prepend">
                    <span class="input-group-text" id="basic-addon1"><FontAwesomeIcon icon={faEnvelope} /></span>
                </div>
                <input type="email" className="form-control" placeHolder="Email or Phone" id="username" name="username" onChange={this.handleChange} aria-describedby="emailHelp"/>
            </div>
            <div className="input-group mb-3">
                <div class="input-group-prepend">
                    <span class="input-group-text" id="basic-addon1"><FontAwesomeIcon icon={faKey} /></span>
                </div>
                <input type="password" className="form-control" placeHolder="Password" id="password" name="password" onChange={this.handleChange} onKeyPress={this.enterPressed} aria-describedby="emailHelp"/>
            </div>
            <button type="button" className="btn form-control btn-primary mb-3" onClick={this.login}>Sign in
                { this.state.loginSpinner ? <FontAwesomeIcon className="float-right" icon={faSpinner} size="lg" spin /> : null }
            </button>
            <a href="#" onClick={this.forgotPassword}>Forgot password</a><br></br>
            <button type="button" className="btn form-control btn-outline-light mt-3" onClick={this.anonymousLogin}>Continue as Guest
            </button>
            
            </div>
        </form>
        );
    }

    
    renderPasswordChange() {
        return (
        <form>
            <h3 className="h3 mb-3">
                <a className="float-left" href="#" onClick={() => this.showLoginForm()}><FontAwesomeIcon icon={faBackward} /></a>
                Update Password
            </h3>
            <div className="loginForm">
            <div className="form-group">
                <input type="password" className="form-control" placeHolder="New Password" id="password" name="password" onChange={this.handleChange} aria-describedby="emailHelp"/>
            </div>
            <div className="form-group">
                <input type="password" className="form-control" placeHolder="New Password (confirmation)" id="password" name="passwordConfirmation" onChange={this.handleChange} aria-describedby="emailHelp"/>
            </div>
            <button type="button" className="btn form-control btn-primary" onClick={this.changePassword}>Update Password
                { this.state.loginSpinner ? <FontAwesomeIcon className="float-right" icon={faSpinner} spin /> : null }
            </button>
            </div>
        </form>
        );
    }
}

export default LoginPage;