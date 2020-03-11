import React from 'react';
import Client from '../MinervaClient';
import Spinner from './Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUsers, faSpinner } from '@fortawesome/free-solid-svg-icons'

class UserGroupSelect extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            users: [],
            groups: [],
            selected: null,
            spinner: null
        }

        this.findUsers = this.findUsers.bind(this);
        this.findGroups = this.findGroups.bind(this);
        this.find = this.find.bind(this);

        this.findTimeout = null;
    }

    find(e) {
        let search = e.target.value;
        if (!search || search.length < 3) {
            this.setState({users: [], groups: []});
            this.props.onSelect(null);
            return;
        }

        if (this.findTimeout) {
            clearTimeout(this.findTimeout);
        }
        let timeoutMs = 300;
        if (search.length === 3) {
            timeoutMs = 0;
        }
        this.findTimeout = setTimeout(() => {
            this.findUsers(search);
            this.findGroups(search);
        }, timeoutMs);
    }

    findUsers(search) {
        this.displaySpinner(true);
        Client.findUser(search).then(response => {
            this.displaySpinner(false);
            this.setState({users: response.data});
        });
    }

    findGroups(search) {
        Client.findGroup(search).then(response => {
            this.setState({groups: response.data});
        });
    }

    displaySpinner(value) {
        this.setState({spinner: value});
    }

    render() {
        return (
            <div className="text-center">
                <label htmlFor="userAutocomplete">
                    Type user or group name:
                </label>
                <input className="form-control" id="userAutocomplete" type="text" name="username" onChange={this.find} placeholder="user or group" autoComplete="off"></input>
                {this.renderUsers()}
                <div className="text-center mt-1">
                    <Spinner show={this.state.spinner} />
                </div>

            </div>
        );
    }

    renderUsers() {
        return (
            <div className="list-group">
                {this.state.groups.map((group, key) => {
                    return (
                        <a href="#" className="list-group-item list-group-item-action text-dark" onClick={() => this.props.onSelect(group, 'group')} key={key}>
                            <FontAwesomeIcon className="float-left" size="lg" icon={faUsers} />&nbsp;
                            {group.name}
                        </a>
                    );
                })}

                {this.state.users.map((user, key) => {
                    return (
                        <a href="#" className="list-group-item list-group-item-action text-dark" onClick={() => this.props.onSelect(user, 'user')} key={key}>
                            <FontAwesomeIcon className="float-left" size="lg" icon={faUser} />&nbsp;
                            {user.name}
                        </a>
                    );
                })}
            </div>

        );
    }
}

export default UserGroupSelect;