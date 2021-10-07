import React from 'react';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import { CognitoUserPool, CookieStorage } from 'amazon-cognito-identity-js';
import AppConfig from '../AppConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons'
import { NavDropdown, Nav } from "react-bootstrap";

alertify.set('notifier', 'position', 'top-right');

class UserInfo extends React.Component {
    constructor(props) {
        super(props);
        let userPool = new CognitoUserPool({
            UserPoolId: AppConfig.CognitoUserPoolId,
            ClientId: AppConfig.CognitoClientId,
            Storage: new CookieStorage({domain: ".minerva.im"})
        });

        this.state = {
            cognitoUserPool: userPool,
        }

        this.logout = this.logout.bind(this);

    }

    logout() {
        localStorage.removeItem('loggedInUser');
        let cognitoUser = this.state.cognitoUserPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
        this.props.login_state.logoutSuccess();
    }

    render() {
        return (
        <Nav>
            <NavDropdown
              id='nav-account-dropdown'
              title='Account'
            >
                <NavDropdown.Item>
                    <FontAwesomeIcon icon={faUser}/>&nbsp;
                    {this.props.login_state.loggedInUser}
                </NavDropdown.Item>
                <NavDropdown.Item onClick={this.logout}>
                    <FontAwesomeIcon icon={faSignOutAlt}/>&nbsp;
                    Sing out
                </NavDropdown.Item>
            </NavDropdown>
        </Nav>
        );
    }

}

export default UserInfo;