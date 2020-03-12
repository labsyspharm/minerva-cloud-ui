import React from 'react';

class NotLoggedIn extends React.Component {

    render() {
        return (
            <div className="notLoggedIn">
                <h1>
                    Not logged in
                </h1>
                <p>
                    Please log in with your username and password
                </p>
            </div>
        )
    }
}

export default NotLoggedIn;