import React from 'react';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails
} from 'amazon-cognito-identity-js';
import AppConfig from './../AppConfig';

alertify.set('notifier','position', 'top-right');

class Login extends React.Component {
    constructor(props) {
      super(props);
      let userPool = new CognitoUserPool({
        UserPoolId : AppConfig.CognitoUserPoolId,
        ClientId : AppConfig.CognitoClientId
      });

      this.state = {
            cognitoUserPool: userPool,
            loggedIn: false,
            loggedInUser: null
        }

        var cognitoUser = userPool.getCurrentUser();
        if (cognitoUser != null) {
            cognitoUser.getSession((err, session) => {
                if (err) {
                    alert(err.message || JSON.stringify(err));
                    return;
                }
                props.loginSuccess(session.idToken.jwtToken, cognitoUser);
                let loggedInUser = localStorage.getItem('loggedInUser');
                this.state.loggedInUser = loggedInUser;
                this.state.loggedIn = true;
            });
        }

        this.login = this.login.bind(this);

    }

    handleChange = evt => {
        const value =
          evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.setState({
          ...this.state,
          [evt.target.name]: value
        });
      }

    logout = () => {
        this.setState({ loggedIn: false});
        localStorage.removeItem('loggedInUser');
        let cognitoUser = this.state.cognitoUserPool.getCurrentUser();
        cognitoUser.signOut();
        this.props.logoutSuccess();
    }
  
    login = () => {
        let loginSuccess = this.props.loginSuccess;
        const cognitoUser = new CognitoUser({
          Username: this.state.username,
          Pool: this.state.cognitoUserPool
        });
    
        const authenticationDetails = new AuthenticationDetails({
          Username: this.state.username,
          Password: this.state.password
        });
    
        const auth = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
              onSuccess: result => resolve(result),
              onFailure: err => reject(err),
              mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
              newPasswordRequired: (fields, required) => reject({fields, required})
            });
          });
    
        this._token = auth
          .then(response => {
              this.setState({ loggedIn: true, loggedInUser: this.state.username});
              localStorage.setItem('loggedInUser', this.state.username);
              alertify.success("Login success", 2);
              loginSuccess(response.getIdToken().getJwtToken(), cognitoUser);
          }).catch(err => {
              console.error(err);
              alertify.error("Invalid username or password.", 2);
          });
      }
  
    render() {
      return (
        <div>
            { this.state.loggedIn ? 
                this.renderUserInfo():
                this.renderLoginForm()
            }
            
        </div>
      );
    }

    renderLoginForm() {
        return (
            <form className="form-inline">
            <input size="40" className="form-control-sm" type="text" name="username" onChange={this.handleChange} placeholder="username"></input>&nbsp;
            <input className="form-control-sm" type="password" name="password" onChange={this.handleChange} placeholder="password"></input>&nbsp;
            <button className="btn btn-primary btn-sm" type="button" onClick={this.login}>Login</button>
            </form>
        );
    }

    renderUserInfo() {
        return (
        <form className="form-inline">
            <span className="text-light">{this.state.loggedInUser}</span>&nbsp;
            <button className="btn btn-primary btn-sm" type="button" onClick={this.logout}>Logout</button>
        </form>
        );
    }
  
}

export default Login;