import React from 'react';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import { CognitoUserPool, CookieStorage } from 'amazon-cognito-identity-js';
import AppConfig from '../AppConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons'

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
            loggedIn: false
        }

        this.logout = this.logout.bind(this);

    }

    logout() {
        this.setState({ loggedIn: false });
        localStorage.removeItem('loggedInUser');
        let cognitoUser = this.state.cognitoUserPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
        
        this.props.logoutSuccess();
    }

    render() {
        // {this.props.loggedInUser}
        return (
                <ul className="navbar-nav ml-auto">
                <li className="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="accountDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Account
                    </a>
                    <div class="dropdown-menu dropdown-menu-right" aria-labelledby="accountDropdown">
                        <a class="dropdown-item" disabled href="#">
                            <FontAwesomeIcon icon={faUser} />&nbsp;
                            {this.props.loggedInUser}
                        </a>
                        <a class="dropdown-item" href="#" onClick={this.logout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />&nbsp;
                            Sign out
                        </a>
                    </div>
                </li>
                </ul>
        );
    }

}

export default UserInfo;