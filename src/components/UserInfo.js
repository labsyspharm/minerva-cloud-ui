import React from 'react';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import AppConfig from '../AppConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

alertify.set('notifier', 'position', 'top-right');

class UserInfo extends React.Component {
    constructor(props) {
        super(props);
        let userPool = new CognitoUserPool({
            UserPoolId: AppConfig.CognitoUserPoolId,
            ClientId: AppConfig.CognitoClientId
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
        return (
            <div>
                <form className="form-inline">
                <span className="text-light">
                    <FontAwesomeIcon icon={faUser} size="lg" className="mr-2" />
                    {this.props.loggedInUser}
                </span>&nbsp;
                <button className="btn btn-secondary btn-sm" type="button" onClick={this.logout}>Sign out</button>
                </form>
            </div>
        );
    }

}

export default UserInfo;