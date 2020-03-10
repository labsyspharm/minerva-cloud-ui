import React from 'react';
import Client from '../MinervaClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUsers, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'

class UserGroupSelect extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            users: [],
            groups: [],
            selected: null
        }

        this.findUsers = this.findUsers.bind(this);
        this.findGroups = this.findGroups.bind(this);
        this.find = this.find.bind(this);
    }

    find(e) {
        let search = e.target.value;
        if (!search || search.length < 3) {
            this.setState({users: [], groups: []});
            this.props.onSelect(null);
            return;
        }
        this.findUsers(search);
        this.findGroups(search);
    }

    findUsers(search) {
        Client.findUser(search).then(response => {
            this.setState({users: response.data});
        });
    }

    findGroups(search) {
        Client.findGroup(search).then(response => {
            this.setState({groups: response.data});
        });
    }

    render() {
        return (
            <div>
                <label htmlFor="userAutocomplete">Type user or group name:</label>
                <input size="40" className="form-control-sm" id="userAutocomplete" type="text" name="username" onChange={this.find} placeholder="username" autoComplete="off"></input>&nbsp;
                {this.renderUsers()}
            </div>
        );
    }

    renderUsers() {
        return (
            <ul className="list-group">
                {this.state.groups.map((group, key) => {
                    return (
                        <li className="list-group-item text-dark" key={key}>
                            <FontAwesomeIcon className="float-left" size="lg" icon={faUsers} />&nbsp;
                            {group.name}&nbsp;
                            <button type="button" className="btn btn-primary btn-sm float-right" onClick={() => this.props.onSelect(group, 'group')}>
                                <FontAwesomeIcon icon={faAngleDoubleDown} />
                            </button>
                        </li>
                    );
                })}

                {this.state.users.map((user, key) => {
                    return (
                        <li className="list-group-item text-dark" key={key}>
                            <FontAwesomeIcon className="float-left" size="lg" icon={faUser} />&nbsp;
                            {user.name}
                            <button type="button" className="btn btn-success btn-sm float-right" onClick={() => this.props.onSelect(user, 'user')}>
                                <FontAwesomeIcon icon={faAngleDoubleDown} />
                            </button>
                        </li>
                    );
                })}
            </ul>

        );
    }
}

export default UserGroupSelect;