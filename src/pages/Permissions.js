import React from 'react';
import RepositorySelect from '../components/RepositorySelect';
import UserGroupSelect from '../components/UserGroupSelect';
import Client from '../MinervaClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faUser, faUsers, faUserShield, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons'
import Spinner from '../components/Spinner';
import '../css/Permissions.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';

class Permissions extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            grants: [],
            users: [],
            repository: null,
            selectedUser: null,
            loading: false
        };

        this.repositorySelected = this.repositorySelected.bind(this);
        this.userOrGroupSelected = this.userOrGroupSelected.bind(this);

        this.repositorySelect = React.createRef();
    }

    componentDidMount() {
        if (this.props.repositoryUuid) {
            this.setState({ loading: true });
            Client.getRepository(this.props.repositoryUuid).then(response => {
                this.repositorySelect.current.selectRepository(response.data);
            });
        }
    }

    repositorySelected(repository) {
        if (this.state.repository && this.state.repository.uuid === repository.uuid) {
            return;
        }
        this.refreshGrants(repository);
    }

    userOrGroupSelected(userOrGroup, type) {
        if (!userOrGroup) {
            this.setState({selectedUser: null});
            return;
        }
        if (this.state.selectedUser && this.state.selectedUser.uuid === userOrGroup.uuid) {
            this.setState({selectedUser: null});
            return;
        }
        this.setState({selectedUser: userOrGroup});
    }

    addGrant(permission) {
        if (!this.state.repository) {
            console.warn('Repository not selected');
            return;
        }
        Client.grantPermissionToRepository(this.state.selectedUser.uuid, this.state.repository.uuid, permission).then(response => {
            console.log('Permission granted');
            this.refreshGrants(this.state.repository);
        }).catch(err => {
            if (err.status === 403) {
                alertify.error("Only repository Admins can add permissions");
            } else {
                alertify.error(err.message);
            }
            this.refreshGrants(this.state.repository);
            console.error(err);
        });
    }

    refreshGrants(repository) {
        this.setState({loading: true});
        Client.listGrantsForRepository(repository.uuid).then(response => {
            
            this.setState({grants: response.data, 
                users: response.included.users, 
                repository: repository, 
                groups: response.included.groups, 
                loading: false});
        });
    }

    getNameAndType(uuid) {
        for (let user of this.state.users) {
            if (user.uuid === uuid) {
                return { name: user.name, type: 'user' };
            }
        }
        for (let group of this.state.groups) {
            if (group.uuid === uuid) {
                return { name: group.name, type: 'group' };
            }
        }
        return 'unnamed';
    }

    removeGrant(grant) {
        let grants = this.state.grants.filter((item) => {
            return item.subject_uuid !== grant.subject_uuid || item.repository_uuid !== grant.repository_uuid;
        });
        this.setState({grants: grants});

        Client.deleteGrant(grant.repository_uuid, grant.subject_uuid).then(response => {
        }).catch(err => {
            if (err.status === 403) {
                alertify.error("Only repository Admins can remove permissions");
            } else {
                alertify.error(err.message);
            }
            this.refreshGrants(this.state.repository);
            console.error(err);
        });
    }

    render() {
        if (!this.props.loggedIn) {
            return null;
        }
        let repository = this.state.repository;
        if (!repository) {
            repository = {};
        }
        return (
            <div className="container mt-3">
                <RepositorySelect ref={this.repositorySelect} onSelect={this.repositorySelected} />
                { this.state.loading ? <FontAwesomeIcon className="ml-2" icon={faSpinner} spin /> : null }

                { this.renderRepositoryHeaders(repository) }
                <div className="row">
                    <div className="col col-3 mr-3">
                        {this.renderAddUser(repository)}
                    </div>
                    <div className="col col-6">
                        {this.renderGrants(repository)}
                    </div>
                </div>
            </div>
        );
    }

    renderRepositoryHeaders(repository) {
        if (!repository.uuid) {
            return null;
        }
        
        return (
            <div className="text-center">

            <h5 className="h5 mt-3">MANAGE PERMISSIONS</h5>
            </div>
        );
    }

    renderAddUser(repository) {
        if (!repository.uuid) {
            return null;
        }
        return (
                <div>
                <UserGroupSelect onSelect={this.userOrGroupSelected}/>
                {this.renderUserSelected()}
                </div>
        )
    }

    renderUserSelected() {
        if (!this.state.selectedUser) {
            return null;
        }
        return (
            <div className="list-group mt-3">
            <span className="list-group-item text-dark">
                <FontAwesomeIcon className="float-left text-success" icon={faPlus} size="lg"/>
                {this.state.selectedUser.name}
            </span>
            <a href="#" className="list-group-item list-group-item-action text-dark userGroupItem" onClick={() => this.addGrant('Admin')}>
                <span className="badge badge-primary">Admin</span>
                <div>User/group is able to import, read and delete images.</div>
            </a>
            <a href="#" className="list-group-item list-group-item-action text-dark userGroupItem" onClick={() => this.addGrant('Read')}>
                <span className="badge badge-secondary">Read</span>
                <div>User/group is only able to read images.</div>
            </a>
        </div>           
        );
    }

    _getBadgeClass(permission) {
        let badgeClass = 'badge badge-pill';
        if (permission === 'Admin') {
            return badgeClass + ' badge-primary';
        } else if (permission === 'Read') {
            return badgeClass + ' badge-secondary';
        }
    }

    renderGrants() {
        if (!this.state.repository) {
            return null;
        }
        return (
            <div>
            <ul className="list-group">
                {this.state.grants.map((grant, key) => {
                    let nameAndType = this.getNameAndType(grant.subject_uuid);
                    let icon = faUser;
                    if (nameAndType.type === 'group') {
                        icon = faUsers;
                    } else if (grant.permission === 'Admin') {
                        icon = faUserShield;
                    }
                    let badgeClass = this._getBadgeClass(grant.permission);
                    return (
                        <li className="list-group-item text-dark" key={key}>
                            <FontAwesomeIcon className="float-left" size="lg" icon={icon} />
                            {nameAndType.name} <span className={badgeClass}>{grant.permission}</span>
                            &nbsp;
                            <button type="button" className="btn btn-danger btn-sm float-right" onClick={() => this.removeGrant(grant)}>
                                <FontAwesomeIcon icon={faMinus} />
                            </button>
                        </li>
                    )
                })}
            </ul>
            <Spinner show={this.state.loading} />
            </div>
        );
    }
}

export default Permissions;